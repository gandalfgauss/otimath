'use client';

/* ═══════════════════════════════════════════════════════════════
   useComplementaryEventsHooks — orquestração da seção
   "Probabilidade de Eventos Complementares" do OVA Dois Dados.

   Responsabilidades:
     • Geração de problemas via selectComplementaryEvent(round).
     • Máquina de estados de sub-fases por rodada:
         strategyChoice → markingComplement → revealing
                       → fillN → fillProbabilities → roundComplete
     • Validação de cada sub-fase (incluindo R14 — fração equivalente).
     • Animação reveal: 1 piscada vermelha (Ā) + 1 piscada verde (A),
       intencionalmente sequenciais para o aluno PERCEBER que
       Ω = A ⊔ Ā (invariante I3 do verifyComplementaryConsistency).
     • Botões: Conferir, Limpar, Próxima rodada (R0→R1),
       Treinar novamente + Continuar (R≥1).

   Reusa arquitetura de useTwoDicesHooks.ts:
     • EventCheckboxes (matrizes 6×6 por nome de evento).
     • Validação por validation(green, blue) → boolean.
     • Alertas globais (useAlerts) e modal global (useModal).
     • Sons oficiais (correct, incorrect, challengeFinished, ...).

   Pedagogia:
     • R0 e R1 obrigatórias com strategyChoice (Polya/Schoenfeld).
     • R≥2 opcionais — pula strategyChoice (estratégia internalizada).
     • Cor vermelha em Ā, verde em A — materializa partição visual.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckboxInterface } from '@/components/global/Checkbox';
import { TextInputInterface } from '@/components/global/TextInput';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import {
  ComplementaryEventData,
  isPrimeFace as _isPrimeFace,  // eslint-disable-line @typescript-eslint/no-unused-vars
} from '@/components/teaching/probability/two-dices/shared/eventBank';
import { selectComplementaryEvent } from '@/components/teaching/probability/two-dices/shared/complementaryEventGenerator';

// ─── Tipos exportados ───────────────────────────────────────────

export interface EventCheckboxes {
  [eventName: string]: CheckboxInterface[][];
}

export interface ComplementaryProbabilityInputs {
  /** Numerador de P(Ā) — aluno digita */
  pComplementNumerator: TextInputInterface;
  /** Denominador de P(Ā) — fixo em 36 (somente leitura) */
  pComplementDenominator: TextInputInterface;
  /** Numerador de P(A) — aluno digita (resultado de 1 − P(Ā)) */
  pANumerator: TextInputInterface;
  /** Denominador de P(A) — fixo em 36 (somente leitura) */
  pADenominator: TextInputInterface;
}

export type ComplementarySubPhase =
  | 'strategyChoice'      // Passo 1: escolha A ou Ā?
  | 'markingComplement'   // Passo 2: aluno marca Ā na tabela em vermelho
  | 'revealing'           // Animação: pisca Ā vermelho → pisca A verde
  | 'fillN'               // Passo 3: digitar n(Ā)
  | 'fillProbabilities'   // Passos 4 e 5: P(Ā) e P(A)
  | 'roundComplete';      // Fim da rodada — botões de progressão

export type RevealPhase =
  | 'idle'
  | 'fillingGreen'   // verde aparece (oculto até pintar)
  | 'blinkingRed'    // pisca Ā todos juntos
  | 'blinkingGreen'  // pisca A todos juntos
  | 'stable';        // dual fixo

// ─── Constantes internas ────────────────────────────────────────

/** Cardinalidade do espaço amostral (dois dados honestos = 36). */
const SAMPLE_SPACE = 36;

/** Rodadas obrigatórias antes de liberar "Treinar novamente" / "Continuar". */
const MANDATORY_ROUNDS = 2;

/** Rodada do gerador (saturada após a 3ª). Round 0 e 1 obrigatórias usam
 *  generator round 0 e 1. Round ≥ 2 (opcional) sempre usa generator round 2
 *  — pool máximo, com combinações 3-a-3. */
function generatorRoundFor(uiRound: number): number {
  return Math.min(uiRound, 2);
}

const COMPLEMENT_LABEL = 'Ā';   // U+00C1 + U+0305 — letra A com macron combinante
const A_LABEL = 'A';

/** Tempos da animação reveal (ms) — 2 piscadas sequenciais.
 *  Total ≈ 1.7s. Respeita prefers-reduced-motion (vai direto a stable). */
const REVEAL_TIMING = {
  beforeRed: 200,
  redBlink: 600,
  betweenColors: 200,
  greenBlink: 600,
  beforeFillN: 200,
} as const;

// ─── Helpers ────────────────────────────────────────────────────

function buildEmptyMatrix(): CheckboxInterface[][] {
  const matrix: CheckboxInterface[][] = [];
  for (let g = 0; g < 6; g++) {
    matrix[g] = [];
    for (let b = 0; b < 6; b++) {
      matrix[g].push({ checked: false, disabled: false });
    }
  }
  return matrix;
}

function buildMatrixFromValidation(
  validation: (g: number, b: number) => boolean,
  disabled: boolean,
): CheckboxInterface[][] {
  const matrix: CheckboxInterface[][] = [];
  for (let g = 0; g < 6; g++) {
    matrix[g] = [];
    for (let b = 0; b < 6; b++) {
      matrix[g].push({ checked: validation(g + 1, b + 1), disabled });
    }
  }
  return matrix;
}

/** Valida fração equivalente (R14 do CLAUDE.md). */
function isEquivalentFraction(
  numStr: string, denStr: string,
  expectedNum: number, expectedDen: number,
): boolean {
  const num = parseInt(numStr.trim(), 10);
  const den = parseInt(denStr.trim(), 10);
  if (!Number.isInteger(num) || !Number.isInteger(den)) return false;
  if (num < 0 || den <= 0) return false;
  return num * expectedDen === den * expectedNum;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Converte descrição indicativa do gerador para forma infinitiva, adequada
 *  ao template "ocorrer o evento A: [descrição]".
 *
 *  Ex.: "o produto dos dados é maior que 2" → "o produto dos números obtidos ser maior que 2"
 *       "as duas faces são pares"           → "as duas faces serem pares"
 *       "ocorre pelo menos uma..."          → "ocorrer pelo menos uma..." */
function toInfinitiveForEventA(desc: string): string {
  return desc
    // Ocorrências específicas primeiro (antes das genéricas)
    .replace(/^ocorre pelo menos/, 'ocorrer pelo menos')
    .replace(/^não ocorre nenhuma/, 'não ocorrer nenhuma')
    // Verbos de ligação
    .replace(/ são /g, ' serem ')
    .replace(/ é /g, ' ser ')
    // Substantivo: "dados" → "números obtidos" (só nos contextos esperados)
    .replace(/dos dois dados/g, 'dos dois números obtidos')
    .replace(/os dois dados/g, 'os dois números obtidos')
    .replace(/dos dados/g, 'dos números obtidos');
}

// ─── Props do hook ──────────────────────────────────────────────

interface UseComplementaryEventsHooksProps {
  /** Callback chamado quando o aluno clica "Continuar" — avança para unionTheory. */
  onContinue: () => void;
}

// ════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ════════════════════════════════════════════════════════════════

export const useComplementaryEventsHooks = ({ onContinue }: UseComplementaryEventsHooksProps) => {
  // ─── Estado de geração e progressão ────────────────────────────
  const [data, setData] = useState<ComplementaryEventData | null>(null);
  const [round, setRound] = useState<number>(0);
  const [subPhase, setSubPhase] = useState<ComplementarySubPhase>('strategyChoice');

  // ─── Estado de marcação ───────────────────────────────────────
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});

  // ─── Inputs específicos ───────────────────────────────────────
  const [strategyChoice, setStrategyChoiceState] = useState<'A' | COMPLEMENT_TYPE | null>(null);
  const [strategyError, setStrategyError] = useState<boolean>(false);

  const [nEInput, setNEInput] = useState<TextInputInterface>({
    value: '', disabled: false, error: false,
  });

  const [probabilities, setProbabilities] = useState<ComplementaryProbabilityInputs>({
    pComplementNumerator: { value: '', disabled: false, error: false },
    pComplementDenominator: { value: String(SAMPLE_SPACE), disabled: true, error: false },
    pANumerator: { value: '', disabled: false, error: false },
    pADenominator: { value: String(SAMPLE_SPACE), disabled: true, error: false },
  });

  // ─── Animação reveal ──────────────────────────────────────────
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');

  // ─── Estado de botões ─────────────────────────────────────────
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledClearButton, setDisabledClearButton] = useState(true);
  const [disabledNextRoundButton, setDisabledNextRoundButton] = useState(true);
  const [disabledTrainAgainButton, setDisabledTrainAgainButton] = useState(true);
  const [disabledContinueButton, setDisabledContinueButton] = useState(true);

  // ─── Instructions ─────────────────────────────────────────────
  const [instructions, setInstructions] = useState<string>('');

  // ─── Hooks globais ────────────────────────────────────────────
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();

  // Refs para evitar stale closures dentro de timers da animação.
  const dataRef = useRef<ComplementaryEventData | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);
  const roundRef = useRef<number>(0);
  useEffect(() => { roundRef.current = round; }, [round]);

  // ─── Inicialização ────────────────────────────────────────────
  useEffect(() => {
    startRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ════════════════════════════════════════════════════════════
  // GERAÇÃO DE NOVA RODADA
  // ════════════════════════════════════════════════════════════

  /** Sorteia novo problema e reseta estado da rodada.
   *  uiRound = 0, 1: rodadas obrigatórias com strategyChoice.
   *  uiRound ≥ 2: rodadas opcionais — pula strategyChoice. */
  const startRound = (uiRound: number) => {
    const newData = selectComplementaryEvent(generatorRoundFor(uiRound));
    setData(newData);
    setRound(uiRound);

    // Reset de inputs
    setStrategyChoiceState(null);
    setStrategyError(false);
    setNEInput({ value: '', disabled: false, error: false });
    setProbabilities({
      pComplementNumerator: { value: '', disabled: false, error: false },
      pComplementDenominator: { value: String(SAMPLE_SPACE), disabled: true, error: false },
      pANumerator: { value: '', disabled: false, error: false },
      pADenominator: { value: String(SAMPLE_SPACE), disabled: true, error: false },
    });
    setRevealPhase('idle');
    setEventsCheckboxes({});

    // R0 e R1 começam em strategyChoice; R≥2 vai direto para markingComplement.
    if (uiRound >= MANDATORY_ROUNDS) {
      goToMarkingComplement(newData);
    } else {
      setSubPhase('strategyChoice');
      setInstructions(buildInstructions('strategyChoice', newData));
    }

    // Reset botões
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setDisabledNextRoundButton(true);
    setDisabledTrainAgainButton(true);
    setDisabledContinueButton(true);
  };

  // ════════════════════════════════════════════════════════════
  // INSTRUÇÕES POR SUB-FASE
  // ════════════════════════════════════════════════════════════

  function buildInstructions(phase: ComplementarySubPhase, d: ComplementaryEventData | null): string {
    if (!d) return '';
    switch (phase) {
      case 'strategyChoice': {
        // Enunciado em azul marinho (token darkest do Design System otimath).
        const navy = 'var(--color-brand-otimath-darkest)';
        const eventInInfinitive = toInfinitiveForEventA(d.eventA.description);
        return (
          `<p class="ds-body" style="color:${navy}">Em um experimento aleatório, dois dados equilibrados ` +
          `e de mesmo tamanho, um verde e um azul, são lançados simultaneamente. Após o lançamento, ` +
          `observa-se o número de pintas nas faces voltadas para cima. Calcule a probabilidade de ocorrer ` +
          `o evento <strong>A</strong>: <em>${eventInInfinitive}</em>.</p>` +
          `<p class="ds-body mt-micro" style="color:${navy}">Antes de calcular P(A), escolha: qual cálculo ` +
          `você acha que será <strong>mais rápido</strong> — marcar todos os casos de A diretamente ou ` +
          `marcar apenas os casos do complementar <strong>Ā</strong>?</p>`
        );
      }
      case 'markingComplement':
        return `<p class="ds-body">Marque na tabela todos os casos do <strong>complementar Ā</strong> ` +
               `(em <span style="color:var(--color-feedback-error-dark);font-weight:700">vermelho</span>). ` +
               `O evento Ā ocorre quando: <em>${d.eventComplement.description}</em>.</p>`;
      case 'revealing':
        return `<p class="ds-body">Observe: o complementar <strong style="color:var(--color-feedback-error-dark)">Ā</strong> ` +
               `(vermelho) e o evento <strong style="color:var(--color-feedback-success-dark)">A</strong> (verde) ` +
               `juntos cobrem <strong>todo o espaço amostral</strong> de 36 resultados.</p>`;
      case 'fillN':
        return `<p class="ds-body">Quantos casos pertencem ao complementar Ā? ` +
               `Conte as células marcadas em vermelho e digite <strong>n(Ā)</strong>.</p>`;
      case 'fillProbabilities':
        return `<p class="ds-body">Calcule <strong>P(Ā) = n(Ā)/36</strong> e depois ` +
               `<strong>P(A) = 1 − P(Ā)</strong>. Digite as duas frações abaixo.</p>`;
      case 'roundComplete':
        return `<p class="ds-body-bold text-feedback-success-dark text-center">` +
               `Rodada concluída! Você usou a estratégia do complementar com sucesso.</p>`;
    }
  }

  // ════════════════════════════════════════════════════════════
  // TRANSIÇÕES DE SUB-FASE
  // ════════════════════════════════════════════════════════════

  function goToMarkingComplement(d: ComplementaryEventData) {
    const matrix = buildEmptyMatrix();
    setEventsCheckboxes({ [COMPLEMENT_LABEL]: matrix });
    setSubPhase('markingComplement');
    setInstructions(buildInstructions('markingComplement', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(false);
  }

  function goToRevealing(d: ComplementaryEventData) {
    setSubPhase('revealing');
    setInstructions(buildInstructions('revealing', d));
    setDisabledCheckButton(true);
    setDisabledClearButton(true);

    // Auto-preenche A em verde e congela Ā vermelho.
    const aMatrix = buildMatrixFromValidation(d.eventA.validation, true);
    const compMatrix = buildMatrixFromValidation(d.eventComplement.validation, true);
    setEventsCheckboxes({
      [COMPLEMENT_LABEL]: compMatrix,
      [A_LABEL]: aMatrix,
    });

    // Sequência da animação. Materializa Ω = A ⊔ Ā para o aluno SENTIR a partição.
    const reduced = prefersReducedMotion();
    if (reduced) {
      // Sem animação — vai direto a stable e segue o fluxo.
      setRevealPhase('stable');
      setTimeout(() => goToFillN(d), 100);
      return;
    }

    setRevealPhase('fillingGreen');
    let t = REVEAL_TIMING.beforeRed;
    setTimeout(() => setRevealPhase('blinkingRed'), t);
    t += REVEAL_TIMING.redBlink + REVEAL_TIMING.betweenColors;
    setTimeout(() => setRevealPhase('blinkingGreen'), t);
    t += REVEAL_TIMING.greenBlink;
    setTimeout(() => setRevealPhase('stable'), t);
    t += REVEAL_TIMING.beforeFillN;
    setTimeout(() => goToFillN(d), t);
  }

  function goToFillN(d: ComplementaryEventData) {
    setSubPhase('fillN');
    setInstructions(buildInstructions('fillN', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setNEInput({ value: '', disabled: false, error: false });
  }

  function goToFillProbabilities(d: ComplementaryEventData) {
    setSubPhase('fillProbabilities');
    setInstructions(buildInstructions('fillProbabilities', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setNEInput(prev => ({ ...prev, disabled: true }));
  }

  function goToRoundComplete(d: ComplementaryEventData) {
    setSubPhase('roundComplete');
    setInstructions(buildInstructions('roundComplete', d));
    setDisabledCheckButton(true);
    setDisabledClearButton(true);
    setProbabilities(prev => ({
      pComplementNumerator: { ...prev.pComplementNumerator, disabled: true },
      pComplementDenominator: { ...prev.pComplementDenominator, disabled: true },
      pANumerator: { ...prev.pANumerator, disabled: true },
      pADenominator: { ...prev.pADenominator, disabled: true },
    }));

    // Liberação dos botões de progressão.
    const currentRound = roundRef.current;
    if (currentRound < MANDATORY_ROUNDS - 1) {
      // Ainda dentro das obrigatórias — só "Próxima rodada".
      setDisabledNextRoundButton(false);
      setDisabledTrainAgainButton(true);
      setDisabledContinueButton(true);
    } else {
      // Cumpriu obrigatórias — libera "Treinar novamente" e "Continuar".
      setDisabledNextRoundButton(true);
      setDisabledTrainAgainButton(false);
      setDisabledContinueButton(false);
    }
  }

  // ════════════════════════════════════════════════════════════
  // HANDLERS DE INPUTS
  // ════════════════════════════════════════════════════════════

  const setStrategyChoice = (choice: 'A' | typeof COMPLEMENT_LABEL) => {
    setStrategyChoiceState(choice);
    setStrategyError(false);
  };

  const updateEventsCheckboxes = useCallback(
    (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => {
      setEventsCheckboxes(prev => {
        const updated = { ...prev };
        if (!updated[eventName]) return prev;
        updated[eventName] = updated[eventName].map((row, gIdx) =>
          gIdx === diceGreen - 1
            ? row.map((cell, bIdx) =>
                bIdx === diceBlue - 1 ? { checked, disabled } : cell,
              )
            : row,
        );
        return updated;
      });
    },
    [],
  );

  const setNEValue = useCallback((value: string) => {
    setNEInput(prev => ({ ...prev, value, error: false }));
  }, []);

  const setPComplementNumerator = useCallback((value: string) => {
    setProbabilities(prev => ({
      ...prev,
      pComplementNumerator: { ...prev.pComplementNumerator, value, error: false },
    }));
  }, []);

  const setPANumerator = useCallback((value: string) => {
    setProbabilities(prev => ({
      ...prev,
      pANumerator: { ...prev.pANumerator, value, error: false },
    }));
  }, []);

  // Liga os setters reais aos TextInputInterface (necessário por causa do
  // padrão visual usado em useTwoDicesHooks.ts).
  const probabilitiesWithSetters: ComplementaryProbabilityInputs = {
    pComplementNumerator: { ...probabilities.pComplementNumerator, setValue: setPComplementNumerator },
    pComplementDenominator: probabilities.pComplementDenominator,
    pANumerator: { ...probabilities.pANumerator, setValue: setPANumerator },
    pADenominator: probabilities.pADenominator,
  };

  const nEInputWithSetter: TextInputInterface = { ...nEInput, setValue: setNEValue };

  // ════════════════════════════════════════════════════════════
  // VALIDAÇÕES POR SUB-FASE
  // ════════════════════════════════════════════════════════════

  function verifyStrategy(): boolean {
    return strategyChoice === COMPLEMENT_LABEL;
  }

  function verifyMarkingComplement(): boolean {
    if (!data) return false;
    const matrix = eventsCheckboxes[COMPLEMENT_LABEL];
    if (!matrix) return false;
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        const expected = data.eventComplement.validation(g + 1, b + 1);
        const actual = !!matrix[g]?.[b]?.checked;
        if (expected !== actual) return false;
      }
    }
    return true;
  }

  function verifyN(): boolean {
    if (!data) return false;
    const v = parseInt(nEInput.value ?? '', 10);
    return Number.isInteger(v) && v === data.nE;
  }

  function verifyProbabilities(): boolean {
    if (!data) return false;
    const okPComp = isEquivalentFraction(
      probabilities.pComplementNumerator.value ?? '',
      probabilities.pComplementDenominator.value ?? '',
      data.nE, SAMPLE_SPACE,
    );
    const okPA = isEquivalentFraction(
      probabilities.pANumerator.value ?? '',
      probabilities.pADenominator.value ?? '',
      data.nA, SAMPLE_SPACE,
    );
    return okPComp && okPA;
  }

  // ════════════════════════════════════════════════════════════
  // BOTÃO CONFERIR
  // ════════════════════════════════════════════════════════════

  const checkOnClick = () => {
    if (!data) return;

    let ok = false;
    let errorMessage = 'Você errou, tente novamente!';
    let advancer: (() => void) | null = null;

    switch (subPhase) {
      case 'strategyChoice': {
        ok = verifyStrategy();
        if (!ok) {
          setStrategyError(true);
          errorMessage = 'O evento A tem muitos casos. Marcar todos será trabalhoso. ' +
                         'Tente pela estratégia do complementar.';
        }
        if (ok) advancer = () => goToMarkingComplement(data);
        break;
      }
      case 'markingComplement': {
        ok = verifyMarkingComplement();
        if (!ok) errorMessage = 'A marcação ainda não corresponde ao complementar Ā. Revise as células.';
        if (ok) advancer = () => goToRevealing(data);
        break;
      }
      case 'fillN': {
        ok = verifyN();
        if (!ok) {
          setNEInput(prev => ({ ...prev, error: true }));
          errorMessage = 'Recontagem: quantas células estão marcadas em vermelho?';
        }
        if (ok) advancer = () => goToFillProbabilities(data);
        break;
      }
      case 'fillProbabilities': {
        ok = verifyProbabilities();
        if (!ok) {
          setProbabilities(prev => ({
            pComplementNumerator: { ...prev.pComplementNumerator, error: true },
            pComplementDenominator: prev.pComplementDenominator,
            pANumerator: { ...prev.pANumerator, error: true },
            pADenominator: prev.pADenominator,
          }));
          errorMessage = 'Verifique as frações. P(Ā) = n(Ā)/36 e P(A) = 1 − P(Ā). Frações equivalentes são aceitas.';
        }
        if (ok) advancer = () => goToRoundComplete(data);
        break;
      }
      default:
        return;
    }

    if (ok) {
      createAlert('Parabéns!', 'Você acertou!', 'success', 3000);
      playSound('/sounds/correct.mp3');
      advancer?.();
    } else {
      createAlert('Ops!', errorMessage, 'error', 4000);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ════════════════════════════════════════════════════════════
  // BOTÃO LIMPAR (só na fase markingComplement)
  // ════════════════════════════════════════════════════════════

  const clearOnClick = () => {
    updateModal({
      title: 'Limpar marcações',
      description: 'Você gostaria de limpar todas as marcações da tabela?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Marcações limpas', 'A tabela foi reiniciada.', 'info', 2000);
        playSound('/sounds/clear.mp3');
        setEventsCheckboxes({ [COMPLEMENT_LABEL]: buildEmptyMatrix() });
      },
    });
  };

  // ════════════════════════════════════════════════════════════
  // BOTÕES DE PROGRESSÃO
  // ════════════════════════════════════════════════════════════

  const nextRoundOnClick = () => {
    playSound('/sounds/nextChallenge.mp3');
    startRound(round + 1);
  };

  const trainAgainOnClick = () => {
    playSound('/sounds/nextChallenge.mp3');
    startRound(round + 1);
  };

  const continueOnClick = () => {
    playSound('/sounds/challengeFinished.mp3');
    onContinue();
  };

  // ════════════════════════════════════════════════════════════
  // RETORNO
  // ════════════════════════════════════════════════════════════

  return {
    // Dados do problema atual
    data,
    round,
    subPhase,
    revealPhase,
    instructions,

    // Estado de marcação
    eventsCheckboxes,
    updateEventsCheckboxes,

    // Strategy choice
    strategyChoice,
    strategyError,
    setStrategyChoice,

    // n(Ā) e probabilidades
    nEInput: nEInputWithSetter,
    probabilities: probabilitiesWithSetters,

    // Botões
    disabledCheckButton, checkOnClick,
    disabledClearButton, clearOnClick,
    disabledNextRoundButton, nextRoundOnClick,
    disabledTrainAgainButton, trainAgainOnClick,
    disabledContinueButton, continueOnClick,

    // Globais
    alerts, updateAlert, deleteAlerts,
    modal, updateModal,
  };
};

// ─── Tipo auxiliar para o literal 'Ā' ───────────────────────────
// Necessário para tipar strategyChoice corretamente com union literal.
type COMPLEMENT_TYPE = typeof COMPLEMENT_LABEL;
