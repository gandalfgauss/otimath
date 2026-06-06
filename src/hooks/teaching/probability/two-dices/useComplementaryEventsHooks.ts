'use client';

/* ═══════════════════════════════════════════════════════════════
   useComplementaryEventsHooks — orquestração da seção
   "Probabilidade de Eventos Complementares" do OVA Dois Dados.

   ARQUITETURA ESPELHA useTwoDicesHooks (fase simulação/jogo):
   mesmos tipos Event, EventCheckboxes, ProbabilitiesTextInputs,
   OperationSelectInputs; mesma API pública.

   Ciclo didático (WHITE; GUNSTONE, 1992 — PODE):
     Predict → Observe → Confront → Formalize → Apply

   Sub-fases internas (7):
     1. strategyChoice   — aluno escolhe A ou Ā (hipótese, sem validação)
     2. marking          — marca Ā na tabela (descrição de Ā oculta)
     3. reveal           — anima dual; descrição de Ā aparece no painel
     4. strategyReview   — escolha congelada + "mantém ou muda?" + confronto
     5. formalization    — R0 apenas: derivação P(Ā) = 1 − P(A) em 3 passos
     6. probabilities    — preenche P(A) e P(Ā)
     7. complete         — botões de progressão
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckboxInterface } from '@/components/global/Checkbox';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import {
  Event,
  EventCheckboxes,
  ProbabilitiesTextInputs,
  OperationSelectInputs,
} from '@/hooks/teaching/probability/two-dices/useTwoDicesHooks';
import { ComplementaryEventData } from '@/components/teaching/probability/two-dices/shared/eventBank';
import { selectComplementaryEvent } from '@/components/teaching/probability/two-dices/shared/complementaryEventGenerator';

export type { Event, EventCheckboxes, ProbabilitiesTextInputs, OperationSelectInputs };

// ─── Tipos específicos da seção ─────────────────────────────────

export type ComplementarySubPhase =
  | 'strategyChoice'
  | 'marking'
  | 'reveal'
  | 'strategyReview'
  | 'computeComplementProb'   // calcula P(Ā) = n(Ā)/n(S) — antes da formalização
  | 'formalization'           // deduz P(A) = 1 − P(Ā)
  | 'probabilities'           // calcula P(A) aplicando a fórmula
  | 'complete';

export type RevealPhase =
  | 'idle'
  | 'showingOnlyRed'
  | 'blinkingRed'
  | 'fillingGreen'
  | 'blinkingGreen'
  | 'stable';

export type FormalizationStep = 0 | 1 | 2 | 3 | 4 | 5;

// ─── Constantes internas ────────────────────────────────────────

const SAMPLE_SPACE = 36;
const MAXIMUM_VALUE_DICE = 6;
const MANDATORY_ROUNDS = 2;

const COMPLEMENT_LABEL = 'Ā';
const A_LABEL = 'A';

const REVEAL_TIMING = {
  beforeRed: 200,
  redBlink: 600,
  betweenColors: 200,
  greenBlink: 600,
  beforeFinish: 200,
} as const;

function generatorRoundFor(uiRound: number): number {
  return Math.min(uiRound, 2);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toInfinitiveForEventA(desc: string): string {
  return desc
    .replace(/^ocorre pelo menos/, 'ocorrer pelo menos')
    .replace(/^não ocorre nenhuma/, 'não ocorrer nenhuma')
    .replace(/ são /g, ' serem ')
    .replace(/ é /g, ' ser ')
    .replace(/dos dois dados/g, 'dos dois números obtidos')
    .replace(/os dois dados/g, 'os dois números obtidos')
    .replace(/dos dados/g, 'dos números obtidos');
}

// ─── Builders ───────────────────────────────────────────────────

function buildEmptyCheckboxLayer(): CheckboxInterface[][] {
  const matrix: CheckboxInterface[][] = [];
  for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
    matrix[g] = [];
    for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
      matrix[g].push({ checked: false, disabled: false });
    }
  }
  return matrix;
}

function buildLayerFromValidation(
  validation: (g: number, b: number) => boolean,
  disabled: boolean,
): CheckboxInterface[][] {
  const matrix: CheckboxInterface[][] = [];
  for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
    matrix[g] = [];
    for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
      matrix[g].push({ checked: validation(g + 1, b + 1), disabled });
    }
  }
  return matrix;
}

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

function gcdNat(a: number, b: number): number {
  const aa = Math.abs(a), bb = Math.abs(b);
  return bb === 0 ? aa : gcdNat(bb, aa % bb);
}

/** Aceita a fração quando é equivalente à esperada E está na forma irredutível. */
function isIrreducibleAndEquivalent(
  numStr: string, denStr: string,
  expectedNum: number, expectedDen: number,
): boolean {
  const num = parseInt(numStr.trim(), 10);
  const den = parseInt(denStr.trim(), 10);
  if (!Number.isInteger(num) || !Number.isInteger(den)) return false;
  if (num < 0 || den <= 0) return false;
  if (num * expectedDen !== den * expectedNum) return false;
  return gcdNat(num, den) === 1;
}

/** Retorna as representações decimal (até 4 casas) e percentual (até 2 casas)
 *  em pt-BR a partir dos inteiros numerador e denominador. */
function decimalAndPercent(num: number, den: number): { decimal: string; percent: string } {
  const value = num / den;
  const decimal = value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  const percent = (value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
  return { decimal, percent };
}

// ─── Props do hook ──────────────────────────────────────────────

interface UseComplementaryEventsHooksProps {
  onContinue: () => void;
}

// ════════════════════════════════════════════════════════════════

export const useComplementaryEventsHooks = ({ onContinue }: UseComplementaryEventsHooksProps) => {
  // ─── Estado de geração e progressão ──────────────────────────
  const [data, setData] = useState<ComplementaryEventData | null>(null);
  const [round, setRound] = useState<number>(0);
  const [subPhase, setSubPhase] = useState<ComplementarySubPhase>('strategyChoice');

  // ─── Estado espelhando useTwoDicesHooks ───────────────────────
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] =
    useState<ProbabilitiesTextInputs>({} as ProbabilitiesTextInputs);
  const [operationSelectInputs] = useState<OperationSelectInputs>({} as OperationSelectInputs);

  // ─── Botões ───────────────────────────────────────────────────
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledClearButton, setDisabledClearButton] = useState(true);
  const [disabledNextStepButton, setDisabledNextStepButton] = useState(true);
  const [disabledTrainAgainButton, setDisabledTrainAgainButton] = useState(true);
  const [disabledContinueButton, setDisabledContinueButton] = useState(true);

  // ─── Estado do Passo 1 — hipótese (sem validação) ─────────────
  const [strategyChoice, setStrategyChoiceState] = useState<string | null>(null);

  // ─── Estado do Passo strategyReview ───────────────────────────
  const [reviewChoice, setReviewChoiceState] = useState<'keep' | 'change' | null>(null);
  const [reviewError, setReviewError] = useState(false);
  const [confrontMessage, setConfrontMessage] = useState<string>('');

  // ─── Estado do Passo formalization ────────────────────────────
  const [formStep, setFormStep] = useState<FormalizationStep>(0);
  const [formStep0Value, setFormStep0ValueState] = useState<string>(''); // select: 'S'|'A'|'Ā'
  const [formStep0Error, setFormStep0Error] = useState(false);
  const [formStep1Value, setFormStep1ValueState] = useState<string>(''); // input: '1'
  const [formStep1Error, setFormStep1Error] = useState(false);
  const [formStep2Value, setFormStep2ValueState] = useState<string>(''); // numerador: '36'
  const [formStep2DenValue, setFormStep2DenValueState] = useState<string>(''); // denominador: '36'
  const [formStep2Error, setFormStep2Error] = useState(false);
  const [formStep2ErrorCount, setFormStep2ErrorCount] = useState<number>(0);
  // Step 3: substituição de P(Ā) pelo valor calculado (nE/36 ou equivalente).
  const [formStep3NumValue, setFormStep3NumValueState] = useState<string>('');
  const [formStep3DenValue, setFormStep3DenValueState] = useState<string>('');
  const [formStep3Error, setFormStep3Error] = useState(false);
  // Step 4: resultado da subtração — P(A) final (nA/36 ou equivalente).
  const [formStep4NumValue, setFormStep4NumValueState] = useState<string>('');
  const [formStep4DenValue, setFormStep4DenValueState] = useState<string>('');
  const [formStep4Error, setFormStep4Error] = useState(false);
  // Step 5: forma irredutível da mesma fração. Depois de validar, a UI
  // exibe automaticamente a igualdade em decimal e em percentagem.
  const [formStep5NumValue, setFormStep5NumValueState] = useState<string>('');
  const [formStep5DenValue, setFormStep5DenValueState] = useState<string>('');
  const [formStep5Error, setFormStep5Error] = useState(false);
  const [formStep5Validated, setFormStep5Validated] = useState(false);
  const [formStep5Decimal, setFormStep5Decimal] = useState<string>('');
  const [formStep5Percent, setFormStep5Percent] = useState<string>('');

  // ─── Animação reveal ──────────────────────────────────────────
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');


  // ─── Globais ──────────────────────────────────────────────────
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();

  const roundRef = useRef<number>(0);
  useEffect(() => { roundRef.current = round; }, [round]);
  const dataRef = useRef<ComplementaryEventData | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ════════════════════════════════════════════════════════════
  // INSTRUÇÕES POR SUB-FASE
  // ════════════════════════════════════════════════════════════

  function buildInstructions(phase: ComplementarySubPhase, d: ComplementaryEventData | null): string {
    if (!d) return '';
    const navy = 'var(--color-brand-otimath-darkest)';
    switch (phase) {
      case 'strategyChoice': {
        const eventInInfinitive = toInfinitiveForEventA(d.eventA.description);
        return (
          `<p class="ds-body" style="color:${navy}">Em um experimento aleatório, dois dados equilibrados ` +
          `e de mesmo tamanho, um verde e um azul, são lançados simultaneamente. Após o lançamento, ` +
          `observa-se o número de pintas nas faces voltadas para cima. Calcule a probabilidade de ocorrer ` +
          `o evento <strong>A</strong>: <em>${eventInInfinitive}</em>.</p>` +
          `<p class="ds-body mt-micro" style="color:${navy}">Antes de calcular P(A), escolha: qual caminho ` +
          `você acha que será <strong>mais rápido</strong> — marcar todos os casos favoráveis ao evento A ` +
          `diretamente ou marcar apenas os casos favoráveis ao complementar <strong style="color:#FF6A00"><span class="ova-bar-a">A</span></strong>?</p>`
        );
      }
      case 'marking':
        return (
          `<p class="ds-body" style="color:${navy}">Marque no <strong>Quadro de Dados</strong> os resultados ` +
          `que correspondem ao <strong>complementar <span class="ova-bar-a" style="color:#FF6A00">A</span></strong> do evento A. Clique em <strong>Conferir</strong> ` +
          `ao terminar a marcação, ou em <strong>Limpar</strong> para recomeçar. ` +
          `Caso necessário, clique em <strong>Revisão</strong> antes de começar.</p>`
        );
      case 'reveal':
        return (
          `<p class="ds-body" style="color:${navy}">Observe: o complementar <strong style="color:#FF6A00"><span class="ova-bar-a">A</span></strong> (laranja) e o ` +
          `evento <strong style="color:#0050FF">A</strong> (azul) juntos cobrem <strong>todo o espaço amostral</strong> de 36 resultados.</p>`
        );
      case 'strategyReview':
        return (
          `<p class="ds-body" style="color:${navy}">Agora que você observou a tabela preenchida, revise sua ` +
          `escolha inicial. Com o que você viu, você <strong>mantém</strong> ou <strong>muda</strong> sua escolha?</p>`
        );
      case 'computeComplementProb':
        return (
          `<p class="ds-body" style="color:${navy}">Primeiro, calcule <strong>P(<span class="ova-bar-a" style="color:#FF6A00">A</span>)</strong> ` +
          `pela definição clássica — <strong>casos favoráveis dividido por casos possíveis</strong> — no ` +
          `<strong>Quadro de Cálculo(s)</strong>.</p>`
        );
      case 'formalization':
        return (
          `<p class="ds-body" style="color:${navy}">Vamos formalizar a relação entre P(A) e P(<span class="ova-bar-a" style="color:#FF6A00">A</span>) a partir do ` +
          `que você observou.</p>`
        );
      case 'probabilities':
        return (
          `<p class="ds-body" style="color:${navy}">Agora, usando a fórmula <strong>P(A) = 1 − P(<span class="ova-bar-a" style="color:#FF6A00">A</span>)</strong>, ` +
          `calcule <strong>P(A)</strong> no <strong>Quadro de Cálculo(s)</strong>.</p>`
        );
      case 'complete':
        return (
          `<p class="ds-body-bold text-feedback-success-dark text-center">` +
          `Parabéns, você finalizou esta rodada com sucesso!</p>`
        );
    }
  }

  // ════════════════════════════════════════════════════════════
  // GERAÇÃO DE NOVA RODADA
  // ════════════════════════════════════════════════════════════

  const startRound = useCallback((uiRound: number) => {
    const newData = selectComplementaryEvent(generatorRoundFor(uiRound));
    setData(newData);
    setRound(uiRound);

    // Reset completo
    setStrategyChoiceState(null);
    setReviewChoiceState(null);
    setReviewError(false);
    setConfrontMessage('');
    setFormStep(0);
    setFormStep0ValueState('');
    setFormStep1ValueState('');
    setFormStep2ValueState('');
    setFormStep2DenValueState('');
    setFormStep3NumValueState('');
    setFormStep3DenValueState('');
    setFormStep4NumValueState('');
    setFormStep4DenValueState('');
    setFormStep5NumValueState('');
    setFormStep5DenValueState('');
    setFormStep5Validated(false);
    setFormStep5Decimal('');
    setFormStep5Percent('');
    setFormStep0Error(false);
    setFormStep1Error(false);
    setFormStep2Error(false);
    setFormStep2ErrorCount(0);
    setFormStep3Error(false);
    setFormStep4Error(false);
    setFormStep5Error(false);
    setRevealPhase('idle');
    setEventsCheckboxes({});
    setProbabilitiesTextInputs({} as ProbabilitiesTextInputs);
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setDisabledNextStepButton(true);
    setDisabledTrainAgainButton(true);
    setDisabledContinueButton(true);

    // R0 e R1 obrigatórias: começa em strategyChoice. R≥2: pula para marking.
    if (uiRound >= MANDATORY_ROUNDS) {
      goToMarking(newData);
    } else {
      setSubPhase('strategyChoice');
      setActiveEvents([{ name: A_LABEL, ...newData.eventA }]);
      setInstructions(buildInstructions('strategyChoice', newData));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ════════════════════════════════════════════════════════════
  // TRANSIÇÕES DE SUB-FASE
  // ════════════════════════════════════════════════════════════

  // Rola pro topo do OVA em cada transição de sub-fase. Crítico no mobile:
  // o aluno termina a tarefa lá embaixo, clica Conferir, e a sub-fase nova
  // carrega sem trazer o enunciado pra viewport. `apresentacao-dado` é o
  // Grid raiz do OVA (TwoDicesPresentation), sempre presente.
  const scrollDiceToTop = () => {
    requestAnimationFrame(() => {
      document.getElementById('apresentacao-dado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  function goToMarking(d: ComplementaryEventData) {
    const checkboxes: EventCheckboxes = { [COMPLEMENT_LABEL]: buildEmptyCheckboxLayer() };
    setEventsCheckboxes(checkboxes);
    // Painel Evento(s) mostra APENAS A. Descrição de Ā fica oculta até reveal.
    setActiveEvents([{ name: A_LABEL, ...d.eventA }]);
    setSubPhase('marking');
    setInstructions(buildInstructions('marking', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(false);
    setDisabledNextStepButton(true);
    scrollDiceToTop();
  }

  function goToReveal(d: ComplementaryEventData) {
    setSubPhase('reveal');
    setInstructions(buildInstructions('reveal', d));
    setDisabledCheckButton(true);
    setDisabledClearButton(true);
    scrollDiceToTop();
    // Descrição de Ā REVELADA no painel Evento(s).
    setActiveEvents([
      { name: A_LABEL, ...d.eventA },
      { name: COMPLEMENT_LABEL, ...d.eventComplement },
    ]);

    const compLayer = buildLayerFromValidation(d.eventComplement.validation, true);
    const aLayer = buildLayerFromValidation(d.eventA.validation, true);
    setEventsCheckboxes({ [COMPLEMENT_LABEL]: compLayer });

    if (prefersReducedMotion()) {
      setEventsCheckboxes({ [COMPLEMENT_LABEL]: compLayer, [A_LABEL]: aLayer });
      setRevealPhase('stable');
      setTimeout(() => goToStrategyReview(d), 100);
      return;
    }

    setRevealPhase('showingOnlyRed');
    let t = REVEAL_TIMING.beforeRed;
    setTimeout(() => setRevealPhase('blinkingRed'), t);
    t += REVEAL_TIMING.redBlink + REVEAL_TIMING.betweenColors;
    setTimeout(() => {
      setEventsCheckboxes({ [COMPLEMENT_LABEL]: compLayer, [A_LABEL]: aLayer });
      setRevealPhase('fillingGreen');
    }, t);
    t += 50;
    setTimeout(() => setRevealPhase('blinkingGreen'), t);
    t += REVEAL_TIMING.greenBlink;
    setTimeout(() => setRevealPhase('stable'), t);
    t += REVEAL_TIMING.beforeFinish;
    setTimeout(() => goToStrategyReview(d), t);
  }

  function goToStrategyReview(d: ComplementaryEventData) {
    setSubPhase('strategyReview');
    setInstructions(buildInstructions('strategyReview', d));
    setReviewChoiceState(null);
    setReviewError(false);
    setConfrontMessage('');
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    scrollDiceToTop();
  }

  /** Sub-fase nova: aluno calcula P(Ā) pela definição clássica
   *  (casos favoráveis / casos possíveis). Usa TwoDicesCalculations com
   *  eventName='Ā' e hasComplementary=false — só o painel de P(Ā). */
  function goToComputeComplementProb(d: ComplementaryEventData) {
    setSubPhase('computeComplementProb');
    setInstructions(buildInstructions('computeComplementProb', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setDisabledNextStepButton(true);

    const probInputs: ProbabilitiesTextInputs = {
      eventName: COMPLEMENT_LABEL,
      hasComplementary: false,
      numerator: { value: '', disabled: false, error: false },
      denominator: { value: '', disabled: false, error: false },
    };
    probInputs.numerator.setValue = (v: string) =>
      setProbabilitiesTextInputs(prev => ({ ...prev, numerator: { ...prev.numerator, value: v } }));
    probInputs.denominator.setValue = (v: string) =>
      setProbabilitiesTextInputs(prev => ({ ...prev, denominator: { ...prev.denominator, value: v } }));
    setProbabilitiesTextInputs(probInputs);
    scrollDiceToTop();
  }

  function goToFormalization(d: ComplementaryEventData) {
    setSubPhase('formalization');
    // Trava o painel Cálculo(s) (numerator/denominator de P(Ā)) ao entrar na
    // formalização — sem isso o aluno poderia editar o cálculo de P(Ā) que
    // ele JÁ provou estar correto, invalidando a derivação progressiva
    // visível dentro do card de formalização (Step 3 usa P(Ā) substituído
    // pelo valor calculado).
    setProbabilitiesTextInputs(prev => ({
      ...prev,
      numerator:   { ...prev.numerator,   disabled: true, error: false },
      denominator: { ...prev.denominator, disabled: true, error: false },
    }));
    setFormStep(0);
    setFormStep0ValueState('');
    setFormStep1ValueState('');
    setFormStep2ValueState('');
    setFormStep2DenValueState('');
    setFormStep3NumValueState('');
    setFormStep3DenValueState('');
    setFormStep4NumValueState('');
    setFormStep4DenValueState('');
    setFormStep5NumValueState('');
    setFormStep5DenValueState('');
    setFormStep5Validated(false);
    setFormStep5Decimal('');
    setFormStep5Percent('');
    setFormStep0Error(false);
    setFormStep1Error(false);
    setFormStep2Error(false);
    setFormStep2ErrorCount(0);
    setFormStep3Error(false);
    setFormStep4Error(false);
    setFormStep5Error(false);
    setInstructions(buildInstructions('formalization', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    scrollDiceToTop();
  }

  function goToProbabilities(d: ComplementaryEventData) {
    setSubPhase('probabilities');
    setInstructions(buildInstructions('probabilities', d));
    setDisabledCheckButton(false);
    setDisabledClearButton(true);
    setDisabledNextStepButton(true);

    // Agora pede apenas P(A) (a resposta final do problema).
    const probInputs: ProbabilitiesTextInputs = {
      eventName: A_LABEL,
      hasComplementary: false,
      numerator: { value: '', disabled: false, error: false },
      denominator: { value: '', disabled: false, error: false },
    };
    probInputs.numerator.setValue = (v: string) =>
      setProbabilitiesTextInputs(prev => ({ ...prev, numerator: { ...prev.numerator, value: v } }));
    probInputs.denominator.setValue = (v: string) =>
      setProbabilitiesTextInputs(prev => ({ ...prev, denominator: { ...prev.denominator, value: v } }));
    setProbabilitiesTextInputs(probInputs);
    scrollDiceToTop();
  }

  function goToComplete(d: ComplementaryEventData) {
    setSubPhase('complete');
    setInstructions(buildInstructions('complete', d));
    setDisabledCheckButton(true);
    setDisabledClearButton(true);

    setProbabilitiesTextInputs(prev => ({
      ...prev,
      numerator: { ...prev.numerator, disabled: true, error: false },
      denominator: { ...prev.denominator, disabled: true, error: false },
      ...(prev.complementaryNumerator ? {
        complementaryNumerator: { ...prev.complementaryNumerator, disabled: true, error: false },
      } : {}),
      ...(prev.complementaryDenominator ? {
        complementaryDenominator: { ...prev.complementaryDenominator, disabled: true, error: false },
      } : {}),
    }));

    const currentRound = roundRef.current;
    if (currentRound < MANDATORY_ROUNDS - 1) {
      setDisabledNextStepButton(false);
      setDisabledTrainAgainButton(true);
      setDisabledContinueButton(true);
    } else {
      setDisabledNextStepButton(true);
      setDisabledTrainAgainButton(false);
      setDisabledContinueButton(false);
    }
    // Feedback de celebração ao finalizar a rodada — som + alert. Sem isso,
    // o aluno via apenas o texto "Parabéns, você finalizou esta rodada com
    // sucesso!" sem cue auditivo nem alert visual destacando a conquista.
    playSound('/sounds/challengeFinished.mp3');
    createAlert('Rodada concluída!', 'Você finalizou esta rodada com sucesso!', 'success', 4500);
    scrollDiceToTop();
  }

  // ════════════════════════════════════════════════════════════
  // HANDLERS DE INPUTS
  // ════════════════════════════════════════════════════════════

  const updateEventsCheckboxes = useCallback(
    (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => {
      setEventsCheckboxes(prev => {
        const updated = { ...prev };
        if (!updated[eventName]) return prev;
        updated[eventName] = updated[eventName].map((row, gIdx) =>
          gIdx === diceGreen - 1
            ? row.map((cell, bIdx) => (bIdx === diceBlue - 1 ? { checked, disabled } : cell))
            : row,
        );
        return updated;
      });
    },
    [],
  );

  const setStrategyChoice = (choice: string) => setStrategyChoiceState(choice);
  const setReviewChoice = (choice: 'keep' | 'change') => {
    setReviewChoiceState(choice);
    setReviewError(false);
  };
  const setFormStep0Value = (v: string) => { setFormStep0ValueState(v); setFormStep0Error(false); };
  const setFormStep1Value = (v: string) => { setFormStep1ValueState(v); setFormStep1Error(false); };
  const setFormStep2Value = (v: string) => { setFormStep2ValueState(v); setFormStep2Error(false); };
  const setFormStep2DenValue = (v: string) => { setFormStep2DenValueState(v); setFormStep2Error(false); };
  const setFormStep3NumValue = (v: string) => { setFormStep3NumValueState(v); setFormStep3Error(false); };
  const setFormStep3DenValue = (v: string) => { setFormStep3DenValueState(v); setFormStep3Error(false); };
  const setFormStep4NumValue = (v: string) => { setFormStep4NumValueState(v); setFormStep4Error(false); };
  const setFormStep4DenValue = (v: string) => { setFormStep4DenValueState(v); setFormStep4Error(false); };
  const setFormStep5NumValue = (v: string) => { setFormStep5NumValueState(v); setFormStep5Error(false); };
  const setFormStep5DenValue = (v: string) => { setFormStep5DenValueState(v); setFormStep5Error(false); };

  // ════════════════════════════════════════════════════════════
  // VALIDAÇÕES
  // ════════════════════════════════════════════════════════════

  /** Verificação granular da marcação:
   *    - ok: todas as marcações corretas E completas (pode avançar).
   *    - partial: todas as feitas estão corretas, mas falta marcar alguma (incompleto).
   *    - wrong: há pelo menos uma célula marcada que não pertence a Ā. */
  function verifyMarkingDetailed(): 'ok' | 'partial' | 'wrong' {
    if (!data) return 'wrong';
    const matrix = eventsCheckboxes[COMPLEMENT_LABEL];
    if (!matrix) return 'wrong';
    let hasWrongMark = false;
    let hasMissingMark = false;
    for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
      for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
        const expected = data.eventComplement.validation(g + 1, b + 1);
        const actual = !!matrix[g]?.[b]?.checked;
        if (actual && !expected) hasWrongMark = true;
        if (!actual && expected) hasMissingMark = true;
      }
    }
    if (hasWrongMark) return 'wrong';
    if (hasMissingMark) return 'partial';
    return 'ok';
  }

  /** Verifica apenas P(A) (na sub-fase 'probabilities'). */
  function verifyProbabilityOfA(): boolean {
    if (!data) return false;
    return isEquivalentFraction(
      probabilitiesTextInputs.numerator?.value as string ?? '',
      probabilitiesTextInputs.denominator?.value as string ?? '',
      data.nA, SAMPLE_SPACE,
    );
  }

  /** Verifica apenas P(Ā) (na sub-fase 'computeComplementProb'). */
  function verifyProbabilityOfComplement(): boolean {
    if (!data) return false;
    return isEquivalentFraction(
      probabilitiesTextInputs.numerator?.value as string ?? '',
      probabilitiesTextInputs.denominator?.value as string ?? '',
      data.nE, SAMPLE_SPACE,
    );
  }

  /** Monta mensagem de confronto didático.
   *  Em ambos os cenários a heurística é nomeada APÓS a observação. */
  function buildConfrontMessage(): string {
    if (!data) return '';
    const chose = strategyChoice;
    if (chose === COMPLEMENT_LABEL) {
      return (
        `Sua intuição se confirmou. O complementar <strong style="color:#FF6A00"><span class="ova-bar-a">A</span></strong> tem apenas ` +
        `<strong>${data.nE} casos favoráveis</strong>, enquanto o evento <strong>A</strong> ` +
        `teria <strong>${data.nA} casos</strong>. Marcar o menor deles é o caminho mais curto.`
      );
    }
    return (
      `Repare: ao marcar <strong>A</strong> diretamente, você precisaria marcar <strong>${data.nA} ` +
      `casos</strong>. Pelo complementar <strong style="color:#FF6A00"><span class="ova-bar-a">A</span></strong>, são apenas <strong>${data.nE}</strong>. ` +
      `O complementar é o caminho mais rápido sempre que o evento tem mais da metade dos casos do ` +
      `espaço amostral.`
    );
  }

  // ════════════════════════════════════════════════════════════
  // BOTÃO CONFERIR (DISPATCH POR SUB-FASE)
  // ════════════════════════════════════════════════════════════

  const checkOnClick = () => {
    if (!data) return;

    // Mirror do padrão do OVA disco — rola pro topo do OVA em todo Conferir
    // (acerto OU erro). Sem isso, no mobile o aluno fica confuso ao receber
    // um alert de erro lá embaixo, ou ao avançar pra próxima sub-fase
    // sem trazer o enunciado pra viewport.
    scrollDiceToTop();

    switch (subPhase) {
      case 'strategyChoice': {
        // Passo 1 — NÃO valida. Apenas registra e avança.
        if (!strategyChoice) {
          playSound('/sounds/incorrect.mp3');
          createAlert('Escolha uma opção', 'Selecione um caminho antes de continuar.', 'info', 3000);
          return;
        }
        createAlert('Resposta registrada', 'Vamos verificar na prática.', 'info', 2500);
        playSound('/sounds/nextChallenge.mp3');
        goToMarking(data);
        return;
      }
      case 'marking': {
        const result = verifyMarkingDetailed();
        if (result === 'ok') {
          createAlert('Parabéns!', 'Marcação correta.', 'success', 3000);
          playSound('/sounds/correct.mp3');
          goToReveal(data);
        } else if (result === 'partial') {
          // Todas as marcações feitas estão certas, mas faltam células de Ā.
          createAlert('Correto!', 'Mas ainda não completou! Há células do complementar Ā que precisam ser marcadas.', 'info', 4500);
          playSound('/sounds/incorrect.mp3');
        } else {
          createAlert('Ops!', 'Há marcações que não correspondem ao complementar Ā. Revise as células.', 'error', 4000);
          playSound('/sounds/incorrect.mp3');
        }
        return;
      }
      case 'strategyReview': {
        // Segundo clique (confronto já visível): avança para cálculo de P(Ā).
        if (confrontMessage) {
          goToComputeComplementProb(data);
          return;
        }
        // Primeiro clique: precisa ter escolhido "mantenho" ou "mudo".
        if (!reviewChoice) {
          setReviewError(true);
          playSound('/sounds/incorrect.mp3');
          createAlert('Escolha uma opção', 'Indique se mantém ou muda sua escolha.', 'info', 3000);
          return;
        }
        // Mostra o confronto inline e aguarda o aluno clicar em "Entendi".
        // Sem avanço automático — o aluno controla o tempo de reflexão.
        setConfrontMessage(buildConfrontMessage());
        createAlert('Resposta registrada', 'Leia o confronto e continue quando estiver pronto.', 'success', 3500);
        playSound('/sounds/correct.mp3');
        return;
      }
      case 'formalization': {
        if (formStep === 0) {
          if (formStep0Value === 'S') {
            createAlert('Correto!', 'A ∪ Ā é o espaço amostral S.', 'success', 2500);
            playSound('/sounds/correct.mp3');
            setFormStep(1);
            scrollDiceToTop();
          } else {
            setFormStep0Error(true);
            createAlert(
              'Ops!',
              'Pense: A ∪ Ā reúne todos os resultados em que A ocorre ou Ā ocorre — é o evento que sempre ocorre. Qual das opções representa esse evento?',
              'error', 5000,
            );
            playSound('/sounds/incorrect.mp3');
          }
        } else if (formStep === 1) {
          // Aceita "1", "1,0", "1.0", "100%", "100 %" — qualquer forma
          // numericamente equivalente a 1. Normaliza vírgula decimal pt-BR.
          const raw = formStep1Value.trim().toLowerCase();
          const hasPercent = raw.endsWith('%');
          const numericPart = (hasPercent ? raw.slice(0, -1) : raw).replace(',', '.').trim();
          const v = parseFloat(numericPart);
          const equivalent = Number.isFinite(v) && (hasPercent ? v === 100 : v === 1);
          if (equivalent) {
            createAlert('Correto!', 'P(S) = 1.', 'success', 2500);
            playSound('/sounds/correct.mp3');
            setFormStep(2);
            scrollDiceToTop();
          } else {
            setFormStep1Error(true);
            createAlert('Ops!', 'A probabilidade do espaço amostral S é 1 (ou, equivalentemente, 100%), pois S é o evento certo!', 'error', 4500);
            playSound('/sounds/incorrect.mp3');
          }
        } else if (formStep === 2) {
          const num = parseInt(formStep2Value.trim(), 10);
          const den = parseInt(formStep2DenValue.trim(), 10);
          if (num === SAMPLE_SPACE && den === SAMPLE_SPACE) {
            createAlert('Correto!', 'Agora substitua P(Ā) pelo valor que você calculou.', 'success', 3500);
            playSound('/sounds/correct.mp3');
            setFormStep(3);
            scrollDiceToTop();
          } else {
            setFormStep2Error(true);
            // Mensagens escalonadas: primeira falha aponta S abstrato;
            // falhas seguintes explicitam pares ordenados (x,y) dos dois dados.
            const nextErrorCount = formStep2ErrorCount + 1;
            setFormStep2ErrorCount(nextErrorCount);
            const msg = nextErrorCount === 1
              ? 'Quantos pares de resultados são possíveis para o espaço amostral S? Escreva 1 como a divisão desse número n(S) por ele mesmo.'
              : 'Quantos pares ordenados (x, y) são possíveis com os resultados do lançamento de dois dados uma única vez? Escreva 1 como a divisão desse total de casos possíveis por esse mesmo total.';
            createAlert('Ops!', msg, 'error', 6000);
            playSound('/sounds/incorrect.mp3');
          }
        } else if (formStep === 3) {
          // Substituição de P(Ā) pelo valor calculado (nE/36 ou equivalente).
          const okSub = isEquivalentFraction(
            formStep3NumValue, formStep3DenValue, data.nE, SAMPLE_SPACE,
          );
          if (okSub) {
            createAlert('Correto!', `Agora calcule P(A) = ${SAMPLE_SPACE}/${SAMPLE_SPACE} − ${data.nE}/${SAMPLE_SPACE}.`, 'success', 3500);
            playSound('/sounds/correct.mp3');
            setFormStep(4);
            scrollDiceToTop();
          } else {
            setFormStep3Error(true);
            createAlert('Ops!', 'Substitua P(Ā) pelo valor que você calculou anteriormente. Frações equivalentes são aceitas.', 'error', 4500);
            playSound('/sounds/incorrect.mp3');
          }
        } else if (formStep === 4) {
          // Resultado final: P(A) = (36 − nE)/36 = nA/36 (ou equivalente).
          const okA = isEquivalentFraction(
            formStep4NumValue, formStep4DenValue, data.nA, SAMPLE_SPACE,
          );
          if (okA) {
            createAlert('Correto!', 'Agora escreva na forma irredutível.', 'success', 3000);
            playSound('/sounds/correct.mp3');
            setFormStep(5);
            scrollDiceToTop();
          } else {
            setFormStep4Error(true);
            createAlert('Ops!', `Efetue a subtração ${SAMPLE_SPACE}/${SAMPLE_SPACE} − ${data.nE}/${SAMPLE_SPACE}. Frações equivalentes são aceitas.`, 'error', 4500);
            playSound('/sounds/incorrect.mp3');
          }
        } else if (formStep === 5) {
          // Se já validou, próximo clique avança para complete.
          if (formStep5Validated) {
            goToComplete(data);
            return;
          }
          // Valida a forma irredutível (GCD=1 E equivalente a nA/36).
          const okIrreducible = isIrreducibleAndEquivalent(
            formStep5NumValue, formStep5DenValue, data.nA, SAMPLE_SPACE,
          );
          if (okIrreducible) {
            const n = parseInt(formStep5NumValue.trim(), 10);
            const d = parseInt(formStep5DenValue.trim(), 10);
            const { decimal, percent } = decimalAndPercent(n, d);
            setFormStep5Decimal(decimal);
            setFormStep5Percent(percent);
            setFormStep5Validated(true);
            createAlert('Parabéns!', `P(A) = ${decimal} = ${percent}. Clique em Conferir para concluir.`, 'success', 5000);
            playSound('/sounds/correct.mp3');
          } else {
            setFormStep5Error(true);
            createAlert('Ops!', 'A fração precisa ser equivalente a P(A) e estar na forma irredutível (numerador e denominador sem divisores comuns).', 'error', 5000);
            playSound('/sounds/incorrect.mp3');
          }
        }
        return;
      }
      case 'computeComplementProb': {
        if (verifyProbabilityOfComplement()) {
          createAlert('Parabéns!', 'P(Ā) calculado corretamente.', 'success', 3000);
          playSound('/sounds/correct.mp3');
          // Trava os inputs de P(Ā) após acerto — sem isso o quadro de cálculo
          // permanece editável durante a fase de formalização, permitindo que
          // o aluno modifique o valor que ele já provou estar correto.
          setProbabilitiesTextInputs(prev => ({
            ...prev,
            numerator: { ...prev.numerator, disabled: true, error: false },
            denominator: { ...prev.denominator, disabled: true, error: false },
          }));
          // R0: passa para a formalização. R1+: pula formalização, vai direto para P(A).
          if (roundRef.current === 0) {
            goToFormalization(data);
          } else {
            goToProbabilities(data);
          }
        } else {
          setProbabilitiesTextInputs(prev => ({
            ...prev,
            numerator: { ...prev.numerator, error: true },
            denominator: { ...prev.denominator, error: true },
          }));
          createAlert('Ops!', 'Verifique a fração. P(Ā) = casos favoráveis ao complementar / casos possíveis do espaço amostral. Frações equivalentes são aceitas.', 'error', 5000);
          playSound('/sounds/incorrect.mp3');
        }
        return;
      }
      case 'probabilities': {
        if (verifyProbabilityOfA()) {
          createAlert('Parabéns!', 'Você acertou!', 'success', 3000);
          playSound('/sounds/correct.mp3');
          goToComplete(data);
        } else {
          setProbabilitiesTextInputs(prev => ({
            ...prev,
            numerator: { ...prev.numerator, error: true },
            denominator: { ...prev.denominator, error: true },
          }));
          createAlert('Ops!', 'Aplique a fórmula P(A) = 1 − P(Ā) para obter P(A). Frações equivalentes são aceitas.', 'error', 4500);
          playSound('/sounds/incorrect.mp3');
        }
        return;
      }
    }
  };

  // ════════════════════════════════════════════════════════════
  // BOTÃO LIMPAR
  // ════════════════════════════════════════════════════════════

  const dicesChecksClearOnClick = () => {
    updateModal({
      title: 'Limpar marcações',
      description: 'Você gostaria de limpar todas as marcações da tabela?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Marcações limpas', 'A tabela foi reiniciada.', 'info', 2000);
        playSound('/sounds/clear.mp3');
        setEventsCheckboxes({ [COMPLEMENT_LABEL]: buildEmptyCheckboxLayer() });
      },
    });
  };

  // ════════════════════════════════════════════════════════════
  // BOTÕES DE PROGRESSÃO
  // ════════════════════════════════════════════════════════════

  const goToNextStepOnClick = () => {
    scrollDiceToTop();
    playSound('/sounds/nextChallenge.mp3');
    startRound(round + 1);
  };

  const trainAgainOnClick = () => {
    scrollDiceToTop();
    playSound('/sounds/nextChallenge.mp3');
    startRound(round + 1);
  };

  const continueOnClick = () => {
    scrollDiceToTop();
    playSound('/sounds/challengeFinished.mp3');
    onContinue();
  };

  const resetGameOnClick = () => {
    updateModal({
      title: 'Reiniciar seção',
      description: 'Você gostaria de reiniciar desde a primeira rodada?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Seção reiniciada', 'Voltamos à primeira rodada.', 'info', 2000);
        playSound('/sounds/clear.mp3');
        startRound(0);
      },
    });
  };

  // ════════════════════════════════════════════════════════════
  // DEV — Avanço inline (simula a próxima ação correta do aluno)
  // ════════════════════════════════════════════════════════════
  // Atalho para o painel DEV: cada chamada move para a próxima sub-fase
  // como se o aluno tivesse respondido corretamente. Inlinearizamos a
  // lógica de sucesso (sem chamar checkOnClick) para evitar closure stale
  // após múltiplas setState dentro da mesma transição.
  const devAdvance = () => {
    if (!data) return;
    switch (subPhase) {
      case 'strategyChoice': {
        if (!strategyChoice) setStrategyChoiceState(COMPLEMENT_LABEL);
        goToMarking(data);
        return;
      }
      case 'marking': {
        const layer = buildLayerFromValidation(data.eventComplement.validation, false);
        setEventsCheckboxes({ [COMPLEMENT_LABEL]: layer });
        goToReveal(data);
        return;
      }
      case 'reveal': {
        // Pula a animação e vai direto para o confronto.
        goToStrategyReview(data);
        return;
      }
      case 'strategyReview': {
        if (!reviewChoice) setReviewChoiceState('keep');
        if (!confrontMessage) {
          setConfrontMessage(buildConfrontMessage());
          return;
        }
        goToComputeComplementProb(data);
        return;
      }
      case 'computeComplementProb': {
        // Preenche P(Ā) com nE/36 e avança.
        setProbabilitiesTextInputs(prev => ({
          ...prev,
          numerator:   { ...prev.numerator,   value: String(data.nE),           error: false },
          denominator: { ...prev.denominator, value: String(SAMPLE_SPACE),      error: false },
        }));
        if (roundRef.current === 0) goToFormalization(data);
        else goToProbabilities(data);
        return;
      }
      case 'formalization': {
        if (formStep === 0) {
          setFormStep0ValueState('S');
          setFormStep0Error(false);
          setFormStep(1);
          return;
        }
        if (formStep === 1) {
          setFormStep1ValueState('1');
          setFormStep1Error(false);
          setFormStep(2);
          return;
        }
        if (formStep === 2) {
          setFormStep2ValueState(String(SAMPLE_SPACE));
          setFormStep2DenValueState(String(SAMPLE_SPACE));
          setFormStep2Error(false);
          setFormStep(3);
          return;
        }
        if (formStep === 3) {
          setFormStep3NumValueState(String(data.nE));
          setFormStep3DenValueState(String(SAMPLE_SPACE));
          setFormStep3Error(false);
          setFormStep(4);
          return;
        }
        if (formStep === 4) {
          setFormStep4NumValueState(String(data.nA));
          setFormStep4DenValueState(String(SAMPLE_SPACE));
          setFormStep4Error(false);
          setFormStep(5);
          return;
        }
        if (formStep === 5) {
          if (!formStep5Validated) {
            const g = gcdNat(data.nA, SAMPLE_SPACE);
            const irrNum = data.nA / g;
            const irrDen = SAMPLE_SPACE / g;
            setFormStep5NumValueState(String(irrNum));
            setFormStep5DenValueState(String(irrDen));
            const { decimal, percent } = decimalAndPercent(irrNum, irrDen);
            setFormStep5Decimal(decimal);
            setFormStep5Percent(percent);
            setFormStep5Validated(true);
            setFormStep5Error(false);
            return;
          }
          goToComplete(data);
          return;
        }
        return;
      }
      case 'probabilities': {
        setProbabilitiesTextInputs(prev => ({
          ...prev,
          numerator:   { ...prev.numerator,   value: String(data.nA),      error: false },
          denominator: { ...prev.denominator, value: String(SAMPLE_SPACE), error: false },
        }));
        goToComplete(data);
        return;
      }
      case 'complete': {
        // Última rodada → continua para a próxima cena; senão começa outra rodada.
        if (roundRef.current < MANDATORY_ROUNDS - 1) {
          startRound(roundRef.current + 1);
        } else {
          onContinue();
        }
        return;
      }
    }
  };

  // ─── Inicialização ────────────────────────────────────────────
  useEffect(() => {
    startRound(0);
  }, [startRound]);

  // ════════════════════════════════════════════════════════════
  // RETORNO
  // ════════════════════════════════════════════════════════════

  return {
    // API espelhada do useTwoDicesHooks
    instructions,
    activeEvents,
    eventsCheckboxes,
    updateEventsCheckboxes,
    probabilitiesTextInputs,
    operationSelectInputs,
    alerts, updateAlert, deleteAlerts,
    modal, updateModal,
    disabledCheckButton, checkOnClick,
    disabledClearButton, dicesChecksClearOnClick,
    disabledNextStepButton, goToNextStepOnClick,
    resetGameOnClick,

    // Extras específicos da seção
    subPhase,
    round,
    revealPhase,
    data,

    // Passo 1 — hipótese
    strategyChoice,
    setStrategyChoice,

    // Passo strategyReview
    reviewChoice,
    reviewError,
    setReviewChoice,
    confrontMessage,

    // Passo formalization
    formStep,
    formStep0Value, formStep0Error, setFormStep0Value,
    formStep1Value, formStep1Error, setFormStep1Value,
    formStep2Value, formStep2Error, setFormStep2Value,
    formStep2DenValue, setFormStep2DenValue,
    formStep3NumValue, formStep3DenValue, formStep3Error,
    setFormStep3NumValue, setFormStep3DenValue,
    formStep4NumValue, formStep4DenValue, formStep4Error,
    setFormStep4NumValue, setFormStep4DenValue,
    formStep5NumValue, formStep5DenValue, formStep5Error,
    setFormStep5NumValue, setFormStep5DenValue,
    formStep5Validated, formStep5Decimal, formStep5Percent,

    // Progressão
    disabledTrainAgainButton, trainAgainOnClick,
    disabledContinueButton, continueOnClick,

    // DEV — avança para a próxima sub-fase como se o aluno tivesse acertado.
    devAdvance,
  };
};
