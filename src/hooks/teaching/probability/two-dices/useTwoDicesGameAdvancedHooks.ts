'use client';

/* ═══════════════════════════════════════════════════════════════════
   useTwoDicesGameAdvancedHooks.ts — Hook do Exercício 8 (Fixação avançada)

   ARQUITETURA: Caminho C (híbrido).
   ----------------------------------------------------------------
   Não substitui `useTwoDicesHooks` em produção (Ex7 + cena 1). Vive
   ao lado, consome o framework `eventParametrization` (pool de ~50
   eventos parametrizados, restrições R1–R4, progressão de dificuldade
   e balanceamento por família) e produz a mesma API estrutural que o
   `useTwoDicesGame` espera (instructions, eventsCheckboxes, ...).

   DIFERENÇAS ESTRUTURAIS EM RELAÇÃO AO `useTwoDicesHooks`:
   ----------------------------------------------------------------
   • Pool ~50 eventos via `DEFAULT_EVENT_POOL` (vs 12 fixos).
   • Geração validada via `buildBalancedProgressiveValidatedGameSetup`.
   • R14 nativo via `verifyExactProbability` (multiplicação cruzada
     em inteiros, sem ponto flutuante).
   • Sanitização granular de fração com 5 razões de erro distintas.
   • Marcação SEQUENCIAL A → B → D nos compostos (Opção i — espelha
     `useTwoDicesSingleShotHooks` do Ex6): subdivide `mark-A-and-B`
     em `mark-A` + `mark-B`, com congelamento em cor nítida e
     remoção progressiva de placeholders inúteis (`hideIfUnchecked`).
   • `eventColors` (A azul, B laranja, D roxo) e `markAllOnClick`
     que opera SOMENTE no evento da sub-fase atual não-disabled.
   • `currentStepKind` exposto para feedback didático específico
     no consumidor (TwoDicesGameAdvanced).
   • `onStepError(stepKind)` opcional para integração com Menu de
     Revisão (StudyMenu) — análogo ao SingleShot.

   GARANTIA R14 (CLAUDE.md) — INVIOLÁVEL
   ----------------------------------------------------------------
   `verifyExactProbability` aceita qualquer fração matematicamente
   equivalente; rejeita vazio, não-inteiro, denominador zero, negativo,
   impróprio. Comparação por p·s === r·q (sem decimais).

   API EXTERNA — assinaturas NOVAS (em relação ao hook base):
   ----------------------------------------------------------------
     useTwoDicesGameAdvancedHooks({ onStepError? })
       → estado/handlers + `currentStepKind` + `eventColors` +
         `hideIfUnchecked` + `markAllOnClick` + `disabledMarkAllButton`.
     onStepError(stepKind) — chamado a cada erro em algum step.
   ═══════════════════════════════════════════════════════════════════ */

import { CheckboxInterface } from '@/components/global/Checkbox';
import { TextInputInterface } from '@/components/global/TextInput';
import { SelectInputInterface } from '@/components/global/SelectInput';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AlertType } from '@/components/global/Alert';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import { telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';
import {
  buildValidatedGameSetup,
  buildBalancedProgressiveValidatedGameSetup,
  DEFAULT_EVENT_POOL,
  DEFAULT_OPERATION_POOL,
  countFavorable,
  verifyExactProbability,
  sanitizeFraction,
  createCompositeEvent,
  type Event,
  type Operation,
  type ValidatedSetup,
  type FractionInvalidReason,
} from '@/lib/probability/eventParametrization';
import { logAttempt, logMarkAllUsed } from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';

export type { Event, Operation };

// ============================================================================
// 1. INTERFACES DE UI (preservadas do hook base para compat com TwoDicesTable
//    e TwoDicesFormulation)
// ============================================================================

export interface EventCheckboxes {
  [eventName: string]: CheckboxInterface[][];
}

export interface ProbabilitiesTextInputs {
  eventName: string;
  numerator: TextInputInterface;
  denominator: TextInputInterface;
  hasComplementary: boolean;
  complementaryNumerator?: TextInputInterface;
  complementaryDenominator?: TextInputInterface;
}

export interface OperationSelectInputs {
  eventsA: SelectInputInterface;
  operations: SelectInputInterface;
  eventsB: SelectInputInterface;
}

// ============================================================================
// 2. CONSTANTES, MAPEAMENTOS, PALETA
// ============================================================================

const MAXIMUM_VALUE_DICE = 6;

/** Mensagens de feedback formativo por razão de input inválido. */
const FRACTION_FEEDBACK_MESSAGES: Record<FractionInvalidReason, string> = {
  'empty':            'Preencha o numerador e o denominador.',
  'non-integer':      'Use apenas números inteiros.',
  'zero-denominator': 'O denominador não pode ser zero.',
  'negative':         'A probabilidade não admite valores negativos.',
  'improper':         'O numerador não pode ser maior que o denominador.',
};

/** Paleta nítida e daltônica-friendly (A azul, B laranja, D roxo).
 *  Idêntica à do SingleShot — preserva consistência visual entre Ex6/Ex8. */
export const ADVANCED_EVENT_COLORS: Record<string, string> = {
  A: 'var(--color-feedback-info-darkest)',
  B: 'var(--color-feedback-warning-darkest)',
  D: 'var(--color-brand-otimath-pure)',
};

// ============================================================================
// 3. TIPOS INTERNOS DOS STEPS
//
// `kind` identifica semanticamente o step para:
//   • feedback didático específico (StudyMenu);
//   • `markAllOnClick` (alvo é o evento do step atual);
//   • `hideIfUnchecked` (placeholders some após validação do step);
//   • instrumentação de log (futura integração com `useTwoDicesLog`).
// ============================================================================

export type AdvancedStepKind =
  | 'mark-A'
  | 'mark-B'
  | 'mark-D'
  | 'identify-operation'
  | 'compute-probability-and-complementary'
  | 'compute-probability';

interface AdvancedStep {
  kind: AdvancedStepKind;
  activeEvents: Event[];
  /** "checkbox" | "select" | "probability" | "probability-and-complementary-probability" */
  checkType: string;
  instructions: string;
  /** Apenas em compute-* */
  eventToProbability?: Event;
  hasComplementary?: boolean;
  /** Apenas em identify-operation */
  operation?: Operation;
  eventsForSelect?: string[];
  selectOperations?: { value: string; label: string }[];
}

interface AdvancedChallenge {
  steps: AdvancedStep[];
}

interface AdvancedGame {
  challenges: AdvancedChallenge[];
}

// ============================================================================
// 4. CONSTRUÇÃO DOS DESAFIOS A PARTIR DE UM SETUP VALIDADO
//
// Para cada par (A, B, operation) do setup composto, o desafio é subdividido
// em CINCO sub-fases: mark-A → mark-B → mark-D → identify-operation →
// compute-probability. Para os simples (2 primeiros): mark-A → P(A) + P(Ā).
// A subdivisão dos compostos em mark-A / mark-B (Opção i) materializa a
// situação a-didática brousseauniana de identificar primeiro cada predicado
// isoladamente antes de operar com eles, reduzindo carga cognitiva por
// princípio de segmentação (MAYER, 2014, p. 175).
// ============================================================================

const getNewGame = (setup: ValidatedSetup): AdvancedGame => {
  const challenges: AdvancedChallenge[] = [];

  // ---- Desafios simples (2): mark-A + P(A) e P(Ā) ------------------------
  for (const ev of setup.simpleEvents) {
    const A: Event = { name: 'A', ...ev };
    challenges.push({
      steps: [
        {
          kind: 'mark-A',
          activeEvents: [A],
          checkType: 'checkbox',
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e marque na tabela 6×6 os pares ordenados (verde, azul) que satisfazem o evento.
            Clique em <strong>Conferir</strong> ao terminar a marcação ou em <strong>Limpar</strong> para recomeçar.
          </p>`,
        },
        {
          kind: 'compute-probability-and-complementary',
          activeEvents: [A],
          checkType: 'probability-and-complementary-probability',
          instructions: `<p className="ds-body">
            Calcule a probabilidade de ocorrer o <strong>Evento A</strong> e a probabilidade de ocorrer o seu <strong>complementar (A&#773;)</strong>,
            digitando os valores apropriados nas frações abaixo. <strong>Frações equivalentes são aceitas</strong> (ex.: 1/2 = 18/36).
            Clique em <strong>Conferir</strong> ao terminar.
          </p>`,
          eventToProbability: A,
          hasComplementary: true,
        },
      ],
    });
  }

  // ---- Desafios compostos: mark-A → mark-B → mark-D → identify → P(D) ----
  for (const { A: rawA, B: rawB, operation } of setup.compoundSlots) {
    const A: Event = { name: 'A', ...rawA };
    const B: Event = { name: 'B', ...rawB };
    const D: Event = createCompositeEvent(operation, A, B, 'D');

    challenges.push({
      steps: [
        {
          kind: 'mark-A',
          activeEvents: [A],
          checkType: 'checkbox',
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e marque na tabela 6×6 os pares (verde, azul) que satisfazem A.
            O Evento B só aparecerá depois que A estiver correto. Clique em <strong>Conferir</strong>.
          </p>`,
        },
        {
          kind: 'mark-B',
          activeEvents: [A, B],
          checkType: 'checkbox',
          instructions: `<p className="ds-body">
            O Evento A está congelado em <span style="color: var(--color-feedback-info-darkest); font-weight: 700;">azul</span> nas células onde é verdadeiro — use como referência.
            Agora marque os pares que satisfazem o <strong>Evento B</strong> (em <span style="color: var(--color-feedback-warning-darkest); font-weight: 700;">laranja</span>). Clique em <strong>Conferir</strong>.
          </p>`,
        },
        {
          kind: 'mark-D',
          activeEvents: [A, B, D],
          checkType: 'checkbox',
          instructions: `<p className="ds-body">
            Com A e B já marcados como referência, veja a definição do <strong>Evento D</strong> no Quadro de Eventos e marque (em <span style="color: var(--color-brand-otimath-pure); font-weight: 700;">roxo</span>) os pares que pertencem a D. Clique em <strong>Conferir</strong>.
          </p>`,
        },
        {
          kind: 'identify-operation',
          activeEvents: [A, B, D],
          checkType: 'select',
          instructions: `<p className="ds-body">
            Expresse o <strong>Evento D</strong> como uma operação entre A, B ou seus complementares. Selecione os eventos e a operação correta e clique em <strong>Conferir</strong>.
          </p>`,
          operation: operation,
          eventsForSelect: ['A', 'A̅', 'B', 'B̅'],
          selectOperations: [
            { value: 'Intersection', label: '∩' },
            { value: 'Union',        label: '∪' },
            { value: 'Difference',   label: '−' },
          ],
        },
        {
          kind: 'compute-probability',
          activeEvents: [A, B, D],
          checkType: 'probability',
          instructions: `<p className="ds-body">
            Calcule <strong>P(D)</strong>. Use a forma direta n(D)/n(S) ou a forma composta apropriada (P(A) + P(B) − P(A ∩ B), por exemplo).
            <strong>Frações equivalentes são aceitas</strong>. Clique em <strong>Conferir</strong>.
          </p>`,
          eventToProbability: D,
          hasComplementary: false,
        },
      ],
    });
  }

  return { challenges };
};

// ============================================================================
// 5. HOOK PRINCIPAL
// ============================================================================

interface UseAdvancedArgs {
  /** Disparado a cada erro do estudante. O orquestrador externo
   *  (TwoDicesGameAdvanced) decide como sinalizar (pulso, badge, abrir
   *  StudyMenu sugerindo verbete pertinente). */
  onStepError?: (stepKind: AdvancedStepKind) => void;
  /** Disparado quando o estudante conclui o último step do último desafio.
   *  Permite ao orquestrador externo (TwoDicesGameAdvanced) registrar log
   *  de conclusão e/ou habilitar a Tela de Fechamento. */
  onGameFinished?: () => void;
}

export const useTwoDicesGameAdvancedHooks = (args: UseAdvancedArgs = {}) => {
  const { onStepError, onGameFinished } = args;

  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [challenge, setChallenge] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] =
    useState<ProbabilitiesTextInputs>({} as ProbabilitiesTextInputs);
  const [operationSelectInputs, setOperationSelectInputs] =
    useState<OperationSelectInputs>({} as OperationSelectInputs);

  const [game, setGame] = useState<AdvancedGame>({ challenges: [] });

  /** Conjunto de nomes de evento já validados (mark-A, mark-B, mark-D)
   *  no DESAFIO ATUAL — usado por `hideIfUnchecked`. */
  const [markValidatedInChallenge, setMarkValidatedInChallenge] =
    useState<Set<string>>(new Set());

  const { alerts, createAlert: _createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledNextStepButton, setDisabledNextStepButton] = useState(true);
  const [disabledClearButton, setDisabledClearButton] = useState(false);

  // ── TELEMETRIA — createAlert inteligente + change-detection ──────
  // Mesmo padrão do useTwoDicesHooks.
  const studentInputRef = useRef<{
    checkboxes: EventCheckboxes;
    probInputs: ProbabilitiesTextInputs;
    selectInputs: OperationSelectInputs;
    activeEvents: Event[];
    challenge: number;
    step: number;
  }>({
    checkboxes: {},
    probInputs: {} as ProbabilitiesTextInputs,
    selectInputs: {} as OperationSelectInputs,
    activeEvents: [],
    challenge: 0,
    step: 0,
  });

  const summarizeCheckboxes = (cbs: EventCheckboxes, events: Event[]): string[] => {
    const parts: string[] = [];
    for (const ev of events) {
      const name = ev.name ?? '';
      const grid = cbs[name];
      if (!grid) continue;
      const marked: string[] = [];
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c]?.checked) marked.push(`(${r + 1},${c + 1})`);
        }
      }
      if (marked.length > 0) {
        const shown = marked.length <= 8 ? marked.join(';') : `${marked.slice(0, 8).join(';')}...+${marked.length - 8}`;
        parts.push(`evento ${name}: ${marked.length} célula(s) [${shown}]`);
      }
    }
    return parts;
  };

  const createAlert = useCallback((title: string, message: string, type: AlertType, duration?: number, userResponse?: string) => {
    let resolved = userResponse;
    if (resolved === undefined) {
      const s = studentInputRef.current;
      const parts: string[] = [];
      const cb = summarizeCheckboxes(s.checkboxes, s.activeEvents);
      if (cb.length > 0) parts.push(cb.join(' | '));
      const p = s.probInputs;
      if (p?.numerator?.value || p?.denominator?.value) {
        parts.push(`P(${p.eventName ?? '?'}) = ${p.numerator?.value || '_'} / ${p.denominator?.value || '_'}`);
      }
      if (p?.hasComplementary && (p?.complementaryNumerator?.value || p?.complementaryDenominator?.value)) {
        parts.push(`P(complementar) = ${p.complementaryNumerator?.value || '_'} / ${p.complementaryDenominator?.value || '_'}`);
      }
      const sel = s.selectInputs;
      const eA = sel?.eventsA?.value;
      const op = sel?.operations?.value;
      const eB = sel?.eventsB?.value;
      if (eA || op || eB) {
        parts.push(`select: A="${eA || '_'}" op="${op || '_'}" B="${eB || '_'}"`);
      }
      // (Numeração interna do desafio/passo NÃO entra — o `title`/
      // `descricao` da seção já dão o contexto pedagógico.)
      if (parts.length > 0) resolved = parts.join(' | ');
    }
    _createAlert(title, message, type, duration, resolved);
  }, [_createAlert]);

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza snapshot do aluno pro wrapper do createAlert.
  useEffect(() => {
    studentInputRef.current = {
      checkboxes: eventsCheckboxes,
      probInputs: probabilitiesTextInputs,
      selectInputs: operationSelectInputs,
      activeEvents,
      challenge,
      step,
    };
  });

  // Change-detection dos SELECTS — vide useTwoDicesHooks pra rationale.
  const prevSelectsRef = useRef<{ a: string; o: string; b: string } | null>(null);
  useEffect(() => {
    const cur = {
      a: operationSelectInputs?.eventsA?.value ?? '',
      o: operationSelectInputs?.operations?.value ?? '',
      b: operationSelectInputs?.eventsB?.value ?? '',
    };
    const prev = prevSelectsRef.current;
    if (prev === null) { prevSelectsRef.current = cur; return; }
    if (prev.a === cur.a && prev.o === cur.o && prev.b === cur.b) return;
    prevSelectsRef.current = cur;
    const changed: string[] = [];
    if (prev.a !== cur.a) changed.push(`Evento A: "${prev.a || '_'}" → "${cur.a || '_'}"`);
    if (prev.o !== cur.o) changed.push(`Operação: "${prev.o || '_'}" → "${cur.o || '_'}"`);
    if (prev.b !== cur.b) changed.push(`Evento B: "${prev.b || '_'}" → "${cur.b || '_'}"`);
    if (changed.length === 0) return;
    telemetryRecordInteracaoExercicio(
      `select ${changed.join(' ; ')}`
    );
  }, [operationSelectInputs, challenge, step]);

  // Change-detection das FRAÇÕES (numerador/denominador) com debounce.
  const prevFractionsRef = useRef<{ n: string; d: string; cn: string; cd: string } | null>(null);
  useEffect(() => {
    const cur = {
      n: probabilitiesTextInputs?.numerator?.value ?? '',
      d: probabilitiesTextInputs?.denominator?.value ?? '',
      cn: probabilitiesTextInputs?.complementaryNumerator?.value ?? '',
      cd: probabilitiesTextInputs?.complementaryDenominator?.value ?? '',
    };
    const prev = prevFractionsRef.current;
    if (prev === null) { prevFractionsRef.current = cur; return; }
    if (prev.n === cur.n && prev.d === cur.d && prev.cn === cur.cn && prev.cd === cur.cd) return;
    prevFractionsRef.current = cur;
    const handle = window.setTimeout(() => {
      const parts: string[] = [];
      if (prev.n !== cur.n || prev.d !== cur.d) parts.push(`P principal: ${cur.n || '_'} / ${cur.d || '_'}`);
      if (prev.cn !== cur.cn || prev.cd !== cur.cd) parts.push(`P complementar: ${cur.cn || '_'} / ${cur.cd || '_'}`);
      if (parts.length === 0) return;
      telemetryRecordInteracaoExercicio(
        `digitou fração — ${parts.join(' ; ')}`
      );
    }, 600);
    return () => window.clearTimeout(handle);
  }, [probabilitiesTextInputs, challenge, step]);

  // --------------------------------------------------------------------------
  // 5.1 Helpers de leitura do step atual
  // --------------------------------------------------------------------------

  const currentStep: AdvancedStep | undefined =
    game.challenges?.[challenge]?.steps?.[step];

  const currentStepKind: AdvancedStepKind | undefined = currentStep?.kind;

  /** Lista de eventos cujo placeholder deve sumir nas células onde estão
   *  unchecked — todos os que JÁ FORAM VALIDADOS no desafio atual. */
  const hideIfUnchecked = useMemo<string[]>(
    () => Array.from(markValidatedInChallenge),
    [markValidatedInChallenge],
  );

  // --------------------------------------------------------------------------
  // 5.2 Estado dos checkboxes
  // --------------------------------------------------------------------------

  const disabledCheckboxesState = (
    eventsCheckboxesActual = eventsCheckboxes,
  ): EventCheckboxes => {
    const newState: EventCheckboxes = { ...eventsCheckboxesActual };
    Object.keys(newState).forEach((eventName) => {
      for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
        for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
          newState[eventName][g][b] = {
            ...newState[eventName][g][b],
            disabled: true,
          };
        }
      }
    });
    setEventsCheckboxes(newState);
    return newState;
  };

  const buildCheckboxesState = (
    gameActual: AdvancedGame = game,
    challengeActual: number = challenge,
    stepActual: number = step,
    eventsCheckboxesActual: EventCheckboxes = eventsCheckboxes,
  ) => {
    const eventsName =
      gameActual.challenges?.[challengeActual]?.steps?.[stepActual]?.activeEvents.map(
        (event: Event) => event.name,
      ) ?? [];
    const newState: EventCheckboxes = { ...eventsCheckboxesActual };
    eventsName.forEach((eventName) => {
      if (!eventName) return;
      if (!newState[eventName]) {
        newState[eventName] = [];
        for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
          newState[eventName][g] = [];
          for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
            newState[eventName][g].push({ checked: false, disabled: false });
          }
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const resetEventsCheckboxes = (
    eventsCheckboxesActual: EventCheckboxes = eventsCheckboxes,
    preserveDisabledState = true,
  ) => {
    const newState: EventCheckboxes = {};
    Object.keys(eventsCheckboxesActual).forEach((eventName) => {
      if (
        preserveDisabledState &&
        eventsCheckboxesActual?.[eventName]?.[0]?.[0]?.disabled
      ) {
        newState[eventName] = eventsCheckboxesActual[eventName];
      } else {
        newState[eventName] = [];
        for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
          newState[eventName][g] = [];
          for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
            newState[eventName][g].push({ checked: false, disabled: false });
          }
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const updateEventsCheckboxes = (
    eventName: string,
    diceGreen: number,
    diceBlue: number,
    checked: boolean,
    disabled: boolean,
  ) => {
    // Telemetria — clique do aluno numa célula. SÓ é chamada por click
    // do usuário (resets sistêmicos vão direto em `setEventsCheckboxes`).
    telemetryRecordInteracaoExercicio(
      `${checked ? 'marcou' : 'desmarcou'} célula (verde=${diceGreen}, azul=${diceBlue}) do evento "${eventName}"`
    );
    setEventsCheckboxes((prev) => {
      const updated = { ...prev };
      if (!updated[eventName]) return prev;
      updated[eventName][diceGreen - 1][diceBlue - 1] = { checked, disabled };
      return updated;
    });
  };

  // --------------------------------------------------------------------------
  // 5.3 Probabilidades (frações)
  // --------------------------------------------------------------------------

  const resetProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs({} as ProbabilitiesTextInputs);
  };

  const buildProbabilities = (eventName: string, hasComplementary: boolean) => {
    const aux: ProbabilitiesTextInputs = {
      eventName,
      hasComplementary,
      numerator:                { value: '', disabled: false, error: false },
      denominator:              { value: '', disabled: false, error: false },
      complementaryNumerator:   { value: '', disabled: false, error: false },
      complementaryDenominator: { value: '', disabled: false, error: false },
    };
    aux.numerator.setValue = (v: string) =>
      setProbabilitiesTextInputs((p) => ({ ...p, numerator: { ...p.numerator, value: v } }));
    aux.denominator.setValue = (v: string) =>
      setProbabilitiesTextInputs((p) => ({ ...p, denominator: { ...p.denominator, value: v } }));
    if (aux.complementaryNumerator) {
      aux.complementaryNumerator.setValue = (v: string) =>
        setProbabilitiesTextInputs((p) => ({
          ...p,
          complementaryNumerator: { ...p.complementaryNumerator!, value: v },
        }));
    }
    if (aux.complementaryDenominator) {
      aux.complementaryDenominator.setValue = (v: string) =>
        setProbabilitiesTextInputs((p) => ({
          ...p,
          complementaryDenominator: { ...p.complementaryDenominator!, value: v },
        }));
    }
    setProbabilitiesTextInputs(aux);
  };

  const disabledProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs((p) => ({
      ...p,
      numerator:                { ...p.numerator,                error: false, disabled: true },
      denominator:              { ...p.denominator,              error: false, disabled: true },
      complementaryNumerator:   p.complementaryNumerator   ? { ...p.complementaryNumerator,   error: false, disabled: true } : undefined,
      complementaryDenominator: p.complementaryDenominator ? { ...p.complementaryDenominator, error: false, disabled: true } : undefined,
    }));
  };

  const addErrorProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs((p) => ({
      ...p,
      numerator:                { ...p.numerator,                error: true },
      denominator:              { ...p.denominator,              error: true },
      complementaryNumerator:   p.complementaryNumerator   ? { ...p.complementaryNumerator,   error: true } : undefined,
      complementaryDenominator: p.complementaryDenominator ? { ...p.complementaryDenominator, error: true } : undefined,
    }));
  };

  // --------------------------------------------------------------------------
  // 5.4 Selects
  // --------------------------------------------------------------------------

  const resetOperationSelectInputs = () => {
    setOperationSelectInputs({} as OperationSelectInputs);
  };

  const buildOperationSelectInputs = (
    eventOptions: string[],
    opOptions: { value: string; label: string }[],
  ) => {
    setOperationSelectInputs({
      eventsA: {
        disabled: false, value: ' ', error: false,
        setValue: (v) => setOperationSelectInputs((p) => ({ ...p, eventsA: { ...p.eventsA, value: v } })),
        options: eventOptions.map((e) => ({ value: e, label: e })),
      },
      operations: {
        disabled: false, value: ' ', error: false,
        setValue: (v) => setOperationSelectInputs((p) => ({ ...p, operations: { ...p.operations, value: v } })),
        options: opOptions.map((o) => ({ value: o.value, label: o.label })),
      },
      eventsB: {
        disabled: false, value: ' ', error: false,
        setValue: (v) => setOperationSelectInputs((p) => ({ ...p, eventsB: { ...p.eventsB, value: v } })),
        options: eventOptions.map((e) => ({ value: e, label: e })),
      },
    });
  };

  const disabledOperationSelectInputs = () => {
    if (operationSelectInputs?.eventsA) {
      setOperationSelectInputs((p) => ({
        ...p,
        eventsA:    { ...p.eventsA,    error: false, disabled: true },
        operations: { ...p.operations, error: false, disabled: true },
        eventsB:    { ...p.eventsB,    error: false, disabled: true },
      }));
    }
  };

  const addErrorOperationSelectInputs = () => {
    if (operationSelectInputs?.eventsA) {
      setOperationSelectInputs((p) => ({
        ...p,
        eventsA:    { ...p.eventsA,    error: true },
        operations: { ...p.operations, error: true },
        eventsB:    { ...p.eventsB,    error: true },
      }));
    }
  };

  // --------------------------------------------------------------------------
  // 5.5 Verificações de solução
  //     • Marcação por evento (mark-A / mark-B / mark-D): valida APENAS o
  //       evento daquele step (subdivisão A→B→D).
  //     • Probabilidade: R14 nativo via verifyExactProbability.
  //     • Select: lógica idêntica à do hook base (preserva semântica).
  // --------------------------------------------------------------------------

  const verifyMarkSingleEvent = (eventName: string): boolean => {
    const ev = currentStep?.activeEvents.find((e) => e.name === eventName);
    if (!ev) return false;
    const grid = eventsCheckboxes[eventName];
    if (!grid) return false;
    for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
      for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
        if (ev.validation(g + 1, b + 1) !== grid[g][b].checked) return false;
      }
    }
    return true;
  };

  const verifyProbabilityAndComplementary = (): boolean => {
    const ev = currentStep?.eventToProbability;
    if (!ev) return false;
    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    const eventOcc = countFavorable(ev);
    const compOcc = sampleSpace - eventOcc;
    const okEvent = verifyExactProbability(
      probabilitiesTextInputs.numerator?.value as string | undefined,
      probabilitiesTextInputs.denominator?.value as string | undefined,
      eventOcc,
      sampleSpace,
    );
    const okComp = verifyExactProbability(
      probabilitiesTextInputs.complementaryNumerator?.value as string | undefined,
      probabilitiesTextInputs.complementaryDenominator?.value as string | undefined,
      compOcc,
      sampleSpace,
    );
    return okEvent && okComp;
  };

  const verifyProbability = (): boolean => {
    const ev = currentStep?.eventToProbability;
    if (!ev) return false;
    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    return verifyExactProbability(
      probabilitiesTextInputs.numerator?.value as string | undefined,
      probabilitiesTextInputs.denominator?.value as string | undefined,
      countFavorable(ev),
      sampleSpace,
    );
  };

  const verifySelectOperation = (): boolean => {
    const operation = currentStep?.operation;
    const eA = (operationSelectInputs?.eventsA?.value as string) ?? '';
    const op = (operationSelectInputs?.operations?.value as string) ?? '';
    const eB = (operationSelectInputs?.eventsB?.value as string) ?? '';

    switch (operation) {
      case 'Union':
        if (op === 'Union' &&
            ((eA === 'A' && eB === 'B') || (eA === 'B' && eB === 'A'))) return true;
        break;
      case 'Intersection':
        if (op === 'Intersection' &&
            ((eA === 'A' && eB === 'B') || (eA === 'B' && eB === 'A'))) return true;
        if (op === 'Difference' &&
            ((eA === 'A' && eB === 'B̅') || (eA === 'B' && eB === 'A̅'))) return true;
        break;
      case 'Difference':
        if (op === 'Intersection' &&
            ((eA === 'A' && eB === 'B̅') || (eA === 'B̅' && eB === 'A'))) return true;
        if (op === 'Difference' && (eA === 'A' && eB === 'B')) return true;
        break;
      case 'ReverseDifference':
        if (op === 'Intersection' &&
            ((eA === 'A̅' && eB === 'B') || (eA === 'B' && eB === 'A̅'))) return true;
        if (op === 'Difference' && (eA === 'B' && eB === 'A')) return true;
        break;
    }
    return false;
  };

  const checkSolution = (): boolean => {
    switch (currentStep?.kind) {
      case 'mark-A': return verifyMarkSingleEvent('A');
      case 'mark-B': return verifyMarkSingleEvent('B');
      case 'mark-D': return verifyMarkSingleEvent('D');
      case 'identify-operation': return verifySelectOperation();
      case 'compute-probability': return verifyProbability();
      case 'compute-probability-and-complementary': return verifyProbabilityAndComplementary();
      default: return false;
    }
  };

  // --------------------------------------------------------------------------
  // 5.6 Pré-validação granular para inputs de fração
  // --------------------------------------------------------------------------

  const preValidateProbabilityInputs = (): boolean => {
    const kind = currentStep?.kind;
    const isProb = kind === 'compute-probability' || kind === 'compute-probability-and-complementary';
    if (!isProb) return true;

    const numIssue = sanitizeFraction(
      probabilitiesTextInputs.numerator?.value,
      probabilitiesTextInputs.denominator?.value,
    );
    if (!numIssue.valid) {
      playSound('/sounds/incorrect.mp3');
      createAlert('Atenção', FRACTION_FEEDBACK_MESSAGES[numIssue.reason!], 'warning', 4000);
      addErrorProbabilitiesTextInputs();
      return false;
    }
    if (kind === 'compute-probability-and-complementary') {
      const compIssue = sanitizeFraction(
        probabilitiesTextInputs.complementaryNumerator?.value,
        probabilitiesTextInputs.complementaryDenominator?.value,
      );
      if (!compIssue.valid) {
        playSound('/sounds/incorrect.mp3');
        createAlert('Atenção', FRACTION_FEEDBACK_MESSAGES[compIssue.reason!], 'warning', 4000);
        addErrorProbabilitiesTextInputs();
        return false;
      }
    }
    return true;
  };

  // --------------------------------------------------------------------------
  // 5.7 Navegação entre steps
  // --------------------------------------------------------------------------

  const isGameOver = (): boolean => {
    return (
      (game.challenges?.length ?? 0) - 1 === challenge &&
      ((game.challenges?.[challenge]?.steps?.length ?? 0) - 1) === step
    );
  };

  const finishedTheChallenge = (): boolean => {
    return step + 1 >= (game.challenges?.[challenge]?.steps?.length ?? 0);
  };

  // Tolera os dois wrappers possíveis: `dois-dados` (rota standalone)
  // e `seq-dois-dados` (sequência didática). Sem o fallback, o scroll
  // virava no-op dentro da sequência e o aluno ficava sem âncora.
  const goToTopOfChallenge = () => {
    requestAnimationFrame(() => {
      // Fallback chain — ordem importa:
      //   1) "dois-dados": rota standalone do OVA (TwoDicesSection)
      //   2) "apresentacao-dado": Grid raiz do OVA dentro da sequência
      //      didática (TwoDicesPresentation). Sem este intermediário, o
      //      scroll caía pra "seq-dois-dados" que ancora ANTES do header
      //      do OVA — visualmente longe do conteúdo do Ex8.
      //   3) "seq-dois-dados": Grid da página da sequência didática (last resort)
      const target =
        document.getElementById('dois-dados') ??
        document.getElementById('apresentacao-dado') ??
        document.getElementById('seq-dois-dados');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const advanceStepOrChallenge = () => {
    const nextStep = step + 1;
    const stepsLen = game.challenges?.[challenge]?.steps?.length ?? 0;

    if (nextStep < stepsLen) {
      let newEventsCheckboxes = { ...eventsCheckboxes };

      // Encerra checkboxes do step atual (congela cor nítida)
      if (currentStep?.checkType === 'checkbox') {
        newEventsCheckboxes = disabledCheckboxesState();
      }
      // Inicializa checkboxes do próximo step (mark-B / mark-D inserem novo grid)
      const nextStepData = game.challenges?.[challenge]?.steps?.[nextStep];
      if (nextStepData?.checkType === 'checkbox') {
        buildCheckboxesState(game, challenge, nextStep, newEventsCheckboxes);
      }
      if (currentStep?.checkType === 'probability' ||
          currentStep?.checkType === 'probability-and-complementary-probability') {
        disabledProbabilitiesTextInputs();
      }
      if (nextStepData?.checkType === 'probability' ||
          nextStepData?.checkType === 'probability-and-complementary-probability') {
        buildProbabilities(
          nextStepData.eventToProbability?.name ?? '',
          nextStepData.hasComplementary ?? false,
        );
      }
      if (currentStep?.checkType === 'select') {
        disabledOperationSelectInputs();
      }
      if (nextStepData?.checkType === 'select') {
        buildOperationSelectInputs(
          nextStepData.eventsForSelect ?? [],
          nextStepData.selectOperations ?? [],
        );
      }

      setStep(nextStep);
      setActiveEvents(nextStepData?.activeEvents ?? []);
      setInstructions(nextStepData?.instructions ?? '');
      return nextStepData?.checkType;
    }

    // Avança o desafio (reseta o conjunto de validados de marcação)
    const nextChallenge = challenge + 1;
    if (nextChallenge < (game.challenges?.length ?? 0)) {
      setMarkValidatedInChallenge(new Set());
      buildCheckboxesState(game, nextChallenge, 0, {});
      resetProbabilitiesTextInputs();
      resetOperationSelectInputs();
      setChallenge(nextChallenge);
      setStep(0);
      const firstStep = game.challenges?.[nextChallenge]?.steps?.[0];
      setInstructions(firstStep?.instructions ?? '');
      setActiveEvents(firstStep?.activeEvents ?? []);
      return firstStep?.checkType;
    }
    return undefined;
  };

  const goToNextStepOnClick = () => {
    setDisabledCheckButton(false);
    setDisabledNextStepButton(true);
    const ct = advanceStepOrChallenge();
    if (ct === 'checkbox') {
      setDisabledClearButton(false);
    } else {
      setDisabledClearButton(true);
    }
    goToTopOfChallenge();
  };

  // --------------------------------------------------------------------------
  // 5.8 Handlers principais
  // --------------------------------------------------------------------------

  const dicesChecksClearOnClick = () => {
    updateModal({
      title: 'Limpando marcações',
      description: 'Você gostaria de limpar as marcações da atividade atual?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Dados limpos', 'Todas as marcações foram limpas', 'info');
        playSound('/sounds/clear.mp3');
        resetEventsCheckboxes(eventsCheckboxes, true);
      },
    });
  };

  /** Marca todas as 36 células do EVENTO da sub-fase atual (A em mark-A,
   *  B em mark-B, D em mark-D). Eventos congelados (disabled) não são tocados.
   *  Mesma regra ergonômica do SingleShot. */
  const markAllOnClick = () => {
    const targetName =
      currentStepKind === 'mark-A' ? 'A' :
      currentStepKind === 'mark-B' ? 'B' :
      currentStepKind === 'mark-D' ? 'D' : null;
    if (!targetName) return;
    logMarkAllUsed('unionExercise8', `c${challenge}-s${step}`, targetName);

    setEventsCheckboxes((prev) => {
      if (!prev[targetName]) return prev;
      const next = { ...prev };
      next[targetName] = next[targetName].map((row) =>
        row.map((cell) => (cell.disabled ? cell : { ...cell, checked: true })),
      );
      return next;
    });
    playSound('/sounds/clear.mp3');
    createAlert(
      'Todas as células marcadas',
      `Agora desmarque as células que NÃO satisfazem o Evento ${targetName}.`,
      'info',
      4000,
    );
  };

  /** Marcar todos só faz sentido em sub-fases de marcação ativas. */
  const disabledMarkAllButton =
    !(currentStepKind === 'mark-A' || currentStepKind === 'mark-B' || currentStepKind === 'mark-D')
    || disabledClearButton;

  const checkOnClick = () => {
    if (!preValidateProbabilityInputs()) {
      goToTopOfChallenge();
      return;
    }
    const ok = checkSolution();
    // Instrumentação de log — registra cada tentativa com stepKind para
    // posterior análise a posteriori e detecção de viés cognitivo.
    logAttempt(
      'unionExercise8',
      `c${challenge}-s${step}`,
      ok,
      currentStepKind,
    );
    if (ok) {
      // Após acerto de mark-A/mark-B/mark-D, registra o evento como
      // validado no desafio atual — `hideIfUnchecked` removerá placeholders
      // nas células onde o evento é falso.
      if (currentStepKind === 'mark-A' || currentStepKind === 'mark-B' || currentStepKind === 'mark-D') {
        const evName = currentStepKind === 'mark-A' ? 'A' : currentStepKind === 'mark-B' ? 'B' : 'D';
        setMarkValidatedInChallenge((prev) => {
          const next = new Set(prev);
          next.add(evName);
          return next;
        });
      }

      if (isGameOver()) {
        createAlert('Parabéns!', 'Você acertou! Parabéns por finalizar todos os desafios!', 'success', 5000);
        playSound('/sounds/gameFinished.mp3');
        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, você finalizou todos os desafios!</p>");
        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(true);
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();
        onGameFinished?.();
      } else if (finishedTheChallenge()) {
        createAlert('Parabéns!', 'Você acertou! Passe para o próximo desafio.', 'success', 5000);
        playSound('/sounds/challengeFinished.mp3');
        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(false);
        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, passe para o próximo desafio!</p>");
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();
      } else {
        createAlert('Parabéns!', 'Você acertou!', 'success', 4000);
        playSound('/sounds/correct.mp3');
        goToNextStepOnClick();
      }
    } else {
      createAlert('Ops!', 'Você errou, tente novamente!', 'error', 4000);
      playSound('/sounds/incorrect.mp3');
      if (currentStep?.checkType === 'select') addErrorOperationSelectInputs();
      if (currentStep?.checkType === 'probability' ||
          currentStep?.checkType === 'probability-and-complementary-probability') {
        addErrorProbabilitiesTextInputs();
      }
      if (currentStepKind) onStepError?.(currentStepKind);
    }
    goToTopOfChallenge();
  // ok já foi consumido — função não retorna nada
  };

  // --------------------------------------------------------------------------
  // 5.9 Inicialização do jogo
  // --------------------------------------------------------------------------

  const startGame = () => {
    setChallenge(0);
    setStep(0);
    setMarkValidatedInChallenge(new Set());
    try {
      const setup = buildBalancedProgressiveValidatedGameSetup(
        DEFAULT_EVENT_POOL,
        DEFAULT_OPERATION_POOL,
      );
      const newGame = getNewGame(setup);
      setGame(newGame);
      resetEventsCheckboxes({}, false);
      resetProbabilitiesTextInputs();
      resetOperationSelectInputs();
      buildCheckboxesState(newGame, 0, 0, {});
      const firstStep = newGame.challenges?.[0]?.steps?.[0];
      setActiveEvents(firstStep?.activeEvents ?? []);
      setInstructions(firstStep?.instructions ?? '');
      setDisabledCheckButton(false);
      setDisabledNextStepButton(true);
      setDisabledClearButton(false);
    } catch {
      try {
        const setup = buildValidatedGameSetup(
          DEFAULT_EVENT_POOL,
          DEFAULT_OPERATION_POOL,
        );
        const newGame = getNewGame(setup);
        setGame(newGame);
        resetEventsCheckboxes({}, false);
        resetProbabilitiesTextInputs();
        resetOperationSelectInputs();
        buildCheckboxesState(newGame, 0, 0, {});
        const firstStep = newGame.challenges?.[0]?.steps?.[0];
        setActiveEvents(firstStep?.activeEvents ?? []);
        setInstructions(firstStep?.instructions ?? '');
      } catch (e2) {
        if (typeof console !== 'undefined') {
          console.error('[useTwoDicesGameAdvancedHooks] Falha ao iniciar o jogo:', e2);
        }
        createAlert(
          'Erro',
          'Não foi possível gerar um jogo válido. Por favor, recarregue a página.',
          'error',
          6000,
        );
      }
    }
  };

  const resetGameOnClick = () => {
    updateModal({
      title: 'Reiniciando o jogo',
      description: 'Você gostaria de reiniciar o jogo?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Jogo reiniciado', 'O jogo foi reiniciado', 'info');
        playSound('/sounds/clear.mp3');
        startGame();
        setDisabledCheckButton(false);
        setDisabledNextStepButton(true);
        setDisabledClearButton(false);
        goToTopOfChallenge();
      },
    });
  };

  // --------------------------------------------------------------------------
  // 5.10 API pública
  // --------------------------------------------------------------------------

  return {
    instructions,
    resetGameOnClick,
    disabledClearButton, dicesChecksClearOnClick,
    disabledCheckButton, checkOnClick,
    disabledNextStepButton, goToNextStepOnClick,
    activeEvents, eventsCheckboxes, updateEventsCheckboxes,
    operationSelectInputs, probabilitiesTextInputs,
    alerts, updateAlert, deleteAlerts,
    modal, updateModal,
    /** Sub-fase corrente — usado pelo consumidor para feedback didático
     *  específico via StudyMenu. */
    currentStepKind,
    /** Cores nítidas por evento (A=azul info, B=laranja warning, D=roxo brand). */
    eventColors: ADVANCED_EVENT_COLORS,
    /** Lista de eventos cujo placeholder some nas células onde estão unchecked
     *  (após validação de mark-A / mark-B / mark-D no desafio atual). */
    hideIfUnchecked,
    /** Marca todas as 36 células do EVENTO da sub-fase atual. */
    markAllOnClick,
    /** Acessível apenas em sub-fases de marcação ainda não validadas. */
    disabledMarkAllButton,
    /** Índices do desafio atual (para integração com log/instrumentação). */
    challenge,
    step,
  };
};
