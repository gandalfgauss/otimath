'use client';

/* ═══════════════════════════════════════════════════════════════════
   useTwoDicesSingleShotHooks.ts — Hook irmão de useTwoDicesHooks
   especializado para renderizar UMA ÚNICA RODADA de desafio
   (1 par de eventos A,B + 1 operação ∈ {Union, Intersection}).

   POR QUE UM HOOK NOVO E NÃO REFATORAR O ORIGINAL?
   ----------------------------------------------------------------
   • O hook original (useTwoDicesHooks) está em produção na seção
     introdutória do OVA via TwoDicesActivity.tsx — qualquer mexida
     no fluxo (shuffle de 12 eventos, 7 desafios em cadeia,
     isGameOver, sons, instruções dinâmicas) tem risco real de
     regressão visível ao usuário.
   • Duplicar é mais barato e mais defensável que refatorar.
     Ganha-se isolamento; perde-se ~250 linhas de DRY — aceitável.

   GARANTIA R14 (CLAUDE.md) — INVIOLÁVEL
   ----------------------------------------------------------------
   TODAS as validações de fração deste hook usam validateFractionR14
   (multiplicação cruzada exata em inteiros). Aceita-se qualquer
   fração matematicamente equivalente; rejeita-se vazio, não-inteiro,
   negativo, denominador zero. Nunca compara decimais com ==.

   API EXTERNA
   ----------------------------------------------------------------
     useTwoDicesSingleShotHooks({ candidate, onChallengeFinished, onStepError })
       → retorna o conjunto de estados/handlers que o componente
         TwoDicesGameSingleShot consome para renderizar UI.
     onStepError(stepKind) é chamado a cada erro do estudante
       (orquestrador externo decide como sinalizar/abrir StudyMenu).
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import type { CheckboxInterface } from '@/components/global/Checkbox';
import type { TextInputInterface } from '@/components/global/TextInput';
import type { SelectInputInterface } from '@/components/global/SelectInput';
import type { Ex6Candidate } from '@/components/teaching/probability/two-dices/shared/exercise6Challenges';
import { validateFractionR14 } from '@/components/teaching/probability/two-dices/shared/exercise6Challenges';
import { logAttempt, logMarkAllUsed } from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';

const MAXIMUM_VALUE_DICE = 6;
const TOTAL = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;

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

interface SingleShotEvent {
  name: string;
  description: string;
  /** Mantido para compat com o tipo Event consumido por TwoDicesFormulation;
   *  no contexto do Ex6 (∪/∩), o complementar não é exibido. Sempre ''. */
  complementaryDescription: string;
  validation: (g: number, b: number) => boolean;
}

export type SingleShotStepKind =
  | 'mark-A'
  | 'mark-B'
  | 'mark-D'
  | 'identify-operation'
  | 'compute-probability';

/* ───────────────────────────────────────────────────────────────────
   PALETA — cores nítidas, distintas e daltônica-friendly para A,B,D
   • A = azul Info darkest (token DS)
   • B = laranja queimado Warning darkest (token DS)
   • D = roxo brand otimath puro (token DS)
   Reuso do padrão eventColors da TwoDicesTable (idem ComplementaryEvents).
   ─────────────────────────────────────────────────────────────────── */
export const SINGLE_SHOT_EVENT_COLORS: Record<string, string> = {
  A: 'var(--color-feedback-info-darkest)',
  B: 'var(--color-feedback-warning-darkest)',
  D: 'var(--color-brand-otimath-pure)',
};

interface SingleShotStep {
  kind: SingleShotStepKind;
  activeEvents: SingleShotEvent[];
  instructions: string;
  /** evento cujo P(...) será calculado (apenas em compute-probability) */
  eventToProbability?: SingleShotEvent;
  /** opções para o select (apenas em identify-operation) */
  eventsForSelect?: string[];
  selectOperations?: { value: string; label: string }[];
}

const EVENT_DEFINITIONS = [
  { description: 'Soma maior que 8',                         validation: (g: number, b: number) => g + b > 8 },
  { description: 'Menor face igual a 5',                     validation: (g: number, b: number) => Math.min(g, b) === 5 },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { description: 'Face par no dado verde',                   validation: (g: number, _b: number) => g % 2 === 0 },
  { description: 'Soma igual a 6',                           validation: (g: number, b: number) => g + b === 6 },
  { description: 'Produto das faces maior que 15',           validation: (g: number, b: number) => g * b > 15 },
  { description: 'Número primo no dado azul',                validation: (_g: number, b: number) => [2, 3, 5].includes(b) },
  { description: 'Maior face igual a 4',                     validation: (g: number, b: number) => Math.max(g, b) === 4 },
  { description: 'Soma menor que 7',                         validation: (g: number, b: number) => g + b < 7 },
  { description: 'Pelo menos uma face par',                  validation: (g: number, b: number) => g % 2 === 0 || b % 2 === 0 },
  { description: 'Pelo menos uma face múltipla de 3',        validation: (g: number, b: number) => g % 3 === 0 || b % 3 === 0 },
  { description: 'Exatamente uma face par',                  validation: (g: number, b: number) => (g % 2 === 0 && b % 2 !== 0) || (b % 2 === 0 && g % 2 !== 0) },
  { description: 'Nenhuma face par',                         validation: (g: number, b: number) => g % 2 === 1 && b % 2 === 1 },
] as const;

function buildCompositeValidation(
  op: 'Union' | 'Intersection',
  vA: (g: number, b: number) => boolean,
  vB: (g: number, b: number) => boolean,
): (g: number, b: number) => boolean {
  return (g, b) => {
    const a = vA(g, b);
    const c = vB(g, b);
    return op === 'Union' ? a || c : a && c;
  };
}

function buildCompositeDescription(
  op: 'Union' | 'Intersection',
  descA: string,
  descB: string,
): string {
  return op === 'Union'
    ? `${descA} ou ${descB.toLowerCase()}`
    : `${descA} e ${descB.toLowerCase()}`;
}

function buildSteps(candidate: Ex6Candidate): SingleShotStep[] {
  const A: SingleShotEvent = {
    name: 'A',
    description: EVENT_DEFINITIONS[candidate.aIndex].description,
    complementaryDescription: '',
    validation: EVENT_DEFINITIONS[candidate.aIndex].validation,
  };
  const B: SingleShotEvent = {
    name: 'B',
    description: EVENT_DEFINITIONS[candidate.bIndex].description,
    complementaryDescription: '',
    validation: EVENT_DEFINITIONS[candidate.bIndex].validation,
  };
  const D: SingleShotEvent = {
    name: 'D',
    description: buildCompositeDescription(candidate.operation, A.description, B.description),
    complementaryDescription: '',
    validation: buildCompositeValidation(candidate.operation, A.validation, B.validation),
  };

  return [
    {
      kind: 'mark-A',
      activeEvents: [A],
      instructions:
        'Marque na tabela todos os pares ordenados <strong>(verde, azul)</strong> que satisfazem o <strong>Evento A</strong> — veja a definição no Quadro de Eventos. O Evento B só aparecerá depois que A estiver correto. Clique em <strong>Conferir</strong> ao terminar.',
    },
    {
      kind: 'mark-B',
      activeEvents: [A, B],
      instructions:
        'O Evento A está congelado em <span style="color: var(--color-feedback-info-darkest); font-weight: 700;">azul</span> nas células onde é verdadeiro — use como referência. Agora marque todos os pares que satisfazem o <strong>Evento B</strong> (em <span style="color: var(--color-feedback-warning-darkest); font-weight: 700;">laranja</span>). Clique em <strong>Conferir</strong>.',
    },
    {
      kind: 'mark-D',
      activeEvents: [A, B, D],
      instructions:
        candidate.operation === 'Union'
          ? 'Com A e B já marcados como referência, agora marque o <strong>Evento D</strong> (em <span style="color: var(--color-brand-otimath-pure); font-weight: 700;">roxo</span>): pares que pertencem a <strong>A OU B</strong> (união ∪). Clique em <strong>Conferir</strong>.'
          : 'Com A e B já marcados como referência, agora marque o <strong>Evento D</strong> (em <span style="color: var(--color-brand-otimath-pure); font-weight: 700;">roxo</span>): pares que pertencem a <strong>A E B</strong> ao mesmo tempo (interseção ∩). Clique em <strong>Conferir</strong>.',
    },
    {
      kind: 'identify-operation',
      activeEvents: [A, B, D],
      instructions:
        'Expresse o <strong>Evento D</strong> como uma operação entre A, B ou seus complementares. Selecione os eventos e a operação correta e clique em <strong>Conferir</strong>.',
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
      instructions:
        'Calcule <strong>P(D)</strong>. Use a forma direta n(D)/n(Ω) ou a forma composta P(A) + P(B) − P(A ∩ B). Frações equivalentes são aceitas (ex.: 11/18 = 22/36). Clique em <strong>Conferir</strong>.',
      eventToProbability: D,
    },
  ];
}

interface UseSingleShotArgs {
  candidate: Ex6Candidate;
  onChallengeFinished: () => void;
  onStepError?: (stepKind: SingleShotStepKind) => void;
}

export const useTwoDicesSingleShotHooks = ({
  candidate,
  onChallengeFinished,
  onStepError,
}: UseSingleShotArgs) => {
  const steps = useMemo(() => buildSteps(candidate), [candidate]);

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] = useState<ProbabilitiesTextInputs>(
    {} as ProbabilitiesTextInputs,
  );
  const [operationSelectInputs, setOperationSelectInputs] = useState<OperationSelectInputs>(
    {} as OperationSelectInputs,
  );

  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledNextStepButton, setDisabledNextStepButton] = useState(true);
  const [disabledClearButton, setDisabledClearButton] = useState(false);
  const [instructions, setInstructions] = useState<string>('');

  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();

  const currentStep = steps[stepIndex];

  /* ──────────────────────────────────────────────────────────────
     INITIALIZAÇÃO — monta o estado para o primeiro step
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    setStepIndex(0);
    setInstructions(steps[0].instructions);
    initCheckboxesForStep(steps[0]);
    setDisabledCheckButton(false);
    setDisabledNextStepButton(true);
    setDisabledClearButton(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  /* ──────────────────────────────────────────────────────────────
     CHECKBOXES — montagem, reset, disable, update
     ──────────────────────────────────────────────────────────── */
  const initCheckboxesForStep = (step: SingleShotStep) => {
    const newState: EventCheckboxes = {};
    step.activeEvents.forEach((ev) => {
      newState[ev.name] = [];
      for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
        newState[ev.name][g] = [];
        for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
          newState[ev.name][g].push({ checked: false, disabled: false });
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const resetCheckboxesPreservingDisabled = () => {
    setEventsCheckboxes((prev) => {
      const next: EventCheckboxes = {};
      Object.keys(prev).forEach((name) => {
        const isDisabled = prev[name]?.[0]?.[0]?.disabled === true;
        if (isDisabled) {
          next[name] = prev[name];
        } else {
          next[name] = [];
          for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
            next[name][g] = [];
            for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
              next[name][g].push({ checked: false, disabled: false });
            }
          }
        }
      });
      return next;
    });
  };

  const disableAllCheckboxes = () => {
    setEventsCheckboxes((prev) => {
      const next: EventCheckboxes = { ...prev };
      Object.keys(next).forEach((name) => {
        for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
          for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
            next[name][g][b] = { ...next[name][g][b], disabled: true };
          }
        }
      });
      return next;
    });
  };

  const updateEventsCheckboxes = useCallback(
    (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => {
      setEventsCheckboxes((prev) => {
        const updated = { ...prev };
        if (!updated[eventName]) return prev;
        updated[eventName][diceGreen - 1][diceBlue - 1] = { checked, disabled };
        return updated;
      });
    },
    [],
  );

  /* ──────────────────────────────────────────────────────────────
     PROBABILITY INPUTS — build e disable
     ──────────────────────────────────────────────────────────── */
  const buildProbabilitiesInputs = (eventName: string, hasComplementary: boolean) => {
    const aux: ProbabilitiesTextInputs = {
      eventName,
      hasComplementary,
      numerator:   { value: '', disabled: false, error: false },
      denominator: { value: '', disabled: false, error: false },
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

  const disableProbabilitiesInputs = () => {
    setProbabilitiesTextInputs((p) => ({
      ...p,
      numerator:   { ...p.numerator,   error: false, disabled: true },
      denominator: { ...p.denominator, error: false, disabled: true },
      complementaryNumerator:   p.complementaryNumerator   ? { ...p.complementaryNumerator,   error: false, disabled: true } : undefined,
      complementaryDenominator: p.complementaryDenominator ? { ...p.complementaryDenominator, error: false, disabled: true } : undefined,
    }));
  };

  const flagErrorOnProbabilities = () => {
    setProbabilitiesTextInputs((p) => ({
      ...p,
      numerator:   { ...p.numerator,   error: true },
      denominator: { ...p.denominator, error: true },
      complementaryNumerator:   p.complementaryNumerator   ? { ...p.complementaryNumerator,   error: true } : undefined,
      complementaryDenominator: p.complementaryDenominator ? { ...p.complementaryDenominator, error: true } : undefined,
    }));
  };

  /* ──────────────────────────────────────────────────────────────
     SELECT INPUTS — build, disable, error
     ──────────────────────────────────────────────────────────── */
  const buildSelectInputs = (eventOptions: string[], opOptions: { value: string; label: string }[]) => {
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

  const disableSelectInputs = () => {
    setOperationSelectInputs((p) =>
      p?.eventsA
        ? {
            ...p,
            eventsA:    { ...p.eventsA,    error: false, disabled: true },
            operations: { ...p.operations, error: false, disabled: true },
            eventsB:    { ...p.eventsB,    error: false, disabled: true },
          }
        : p,
    );
  };

  const flagErrorOnSelectInputs = () => {
    setOperationSelectInputs((p) =>
      p?.eventsA
        ? {
            ...p,
            eventsA:    { ...p.eventsA,    error: true },
            operations: { ...p.operations, error: true },
            eventsB:    { ...p.eventsB,    error: true },
          }
        : p,
    );
  };

  /* ──────────────────────────────────────────────────────────────
     VERIFICAÇÃO POR TIPO DE STEP
     ──────────────────────────────────────────────────────────── */
  const verifyMarkEvents = (eventNames: readonly string[]): boolean => {
    return eventNames.every((name) => {
      const ev = currentStep.activeEvents.find((e) => e.name === name);
      if (!ev) return false;
      const grid = eventsCheckboxes[name];
      if (!grid) return false;
      for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
        for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
          const expected = ev.validation(g + 1, b + 1);
          if (expected !== grid[g][b].checked) return false;
        }
      }
      return true;
    });
  };

  const verifyComputeProbability = (): boolean => {
    const ev = currentStep.eventToProbability;
    if (!ev) return false;
    let favorable = 0;
    for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
      for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
        if (ev.validation(g + 1, b + 1)) favorable++;
      }
    }
    return validateFractionR14(
      probabilitiesTextInputs.numerator?.value as string | undefined,
      probabilitiesTextInputs.denominator?.value as string | undefined,
      favorable,
      TOTAL,
    );
  };

  const verifyIdentifyOperation = (): boolean => {
    const value = (key: 'eventsA' | 'operations' | 'eventsB'): string =>
      (operationSelectInputs?.[key]?.value as string) ?? '';
    const eA = value('eventsA');
    const op = value('operations');
    const eB = value('eventsB');

    if (candidate.operation === 'Union') {
      // Aceita: A ∪ B, B ∪ A
      return op === 'Union' && ((eA === 'A' && eB === 'B') || (eA === 'B' && eB === 'A'));
    }
    // Intersection — aceita A ∩ B, B ∩ A, A − B̄, B − Ā
    if (op === 'Intersection') {
      return (eA === 'A' && eB === 'B') || (eA === 'B' && eB === 'A');
    }
    if (op === 'Difference') {
      return (
        (eA === 'A' && eB === 'B̅') ||
        (eA === 'B' && eB === 'A̅')
      );
    }
    return false;
  };

  const checkSolution = (): boolean => {
    switch (currentStep.kind) {
      case 'mark-A':
        return verifyMarkEvents(['A']);
      case 'mark-B':
        return verifyMarkEvents(['B']);
      case 'mark-D':
        return verifyMarkEvents(['D']);
      case 'identify-operation':
        return verifyIdentifyOperation();
      case 'compute-probability':
        return verifyComputeProbability();
    }
  };

  /* ──────────────────────────────────────────────────────────────
     hideIfUnchecked — calculado a partir do step atual.
     Após validação de mark-A, células onde A=falso devem perder o
     placeholder de A (TwoDicesTable trata via hideIfUnchecked).
     A lógica usa o índice do step: passou de mark-A → A entra na
     lista de "esconder se unchecked"; idem para B e D.
     ──────────────────────────────────────────────────────────── */
  const hideIfUnchecked = useMemo<string[]>(() => {
    const list: string[] = [];
    // Após o step de marcação de cada evento (índice 0=A, 1=B, 2=D),
    // o evento entra na lista — significa que já foi validado e seu
    // placeholder some das células onde é falso.
    if (stepIndex > 0) list.push('A');  // já passou de mark-A
    if (stepIndex > 1) list.push('B');  // já passou de mark-B
    if (stepIndex > 2) list.push('D');  // já passou de mark-D
    return list;
  }, [stepIndex]);

  /* ──────────────────────────────────────────────────────────────
     AVANÇO DE STEP
     ──────────────────────────────────────────────────────────── */
  const advanceToNextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      // Desafio concluído
      onChallengeFinished();
      return;
    }
    const nextStep = steps[nextIndex];

    // Encerra o step atual — congela os checkboxes daquele evento.
    // disabled=true + eventColors[name] presente → TwoDicesTable mantém
    // a cor nítida via pointer-events:none (não acinzenta como disabled puro).
    if (
      currentStep.kind === 'mark-A' ||
      currentStep.kind === 'mark-B' ||
      currentStep.kind === 'mark-D'
    ) {
      disableAllCheckboxes();
    }
    if (currentStep.kind === 'compute-probability') {
      disableProbabilitiesInputs();
    }
    if (currentStep.kind === 'identify-operation') {
      disableSelectInputs();
    }

    // Inicializa o próximo step adicionando o novo grid (preserva os anteriores).
    const addGridIfMissing = (name: string) => {
      setEventsCheckboxes((prev) => {
        if (prev[name]) return prev;
        const next = { ...prev };
        next[name] = [];
        for (let g = 0; g < MAXIMUM_VALUE_DICE; g++) {
          next[name][g] = [];
          for (let b = 0; b < MAXIMUM_VALUE_DICE; b++) {
            next[name][g].push({ checked: false, disabled: false });
          }
        }
        return next;
      });
    };

    if (nextStep.kind === 'mark-B') addGridIfMissing('B');
    if (nextStep.kind === 'mark-D') addGridIfMissing('D');

    if (nextStep.kind === 'compute-probability' && nextStep.eventToProbability) {
      buildProbabilitiesInputs(nextStep.eventToProbability.name, false);
    }
    if (nextStep.kind === 'identify-operation') {
      buildSelectInputs(nextStep.eventsForSelect ?? [], nextStep.selectOperations ?? []);
    }

    setInstructions(nextStep.instructions);
    setStepIndex(nextIndex);
    setDisabledCheckButton(false);
    setDisabledNextStepButton(true);
    const isMarkingStep =
      nextStep.kind === 'mark-A' ||
      nextStep.kind === 'mark-B' ||
      nextStep.kind === 'mark-D';
    setDisabledClearButton(!isMarkingStep);
  };

  /* ──────────────────────────────────────────────────────────────
     HANDLERS DE BOTÃO (Conferir, Próximo, Limpar)
     ──────────────────────────────────────────────────────────── */
  // Ancora no topo do OVA — usado em Conferir e Próximo passo. Tenta os 3
  // IDs candidatos pra cobrir contextos diferentes (standalone, sequência
  // didática como Grid raiz, ou outer da sequência). Sem isso, no Ex6 o
  // aluno clicava Conferir lá embaixo e o alert + próximo passo
  // carregavam fora da viewport.
  const goToTopOfChallenge = () => {
    requestAnimationFrame(() => {
      const target =
        document.getElementById('dois-dados') ??
        document.getElementById('apresentacao-dado') ??
        document.getElementById('seq-dois-dados');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const checkOnClick = () => {
    const ok = checkSolution();
    // Instrumentação de log — registra cada tentativa com stepKind para
    // posterior análise a posteriori e detecção de viés cognitivo.
    logAttempt('unionExercise6', String(stepIndex), ok, currentStep.kind);
    // Resumo do estado relevante pra resposta_usuario da telemetria.
    // O `currentStep.kind` indica qual tipo de input/seleção foi usado
    // (marcação de células, seleção de operação, ou fração).
    const summarizeResponse = (): string => {
      const k = currentStep.kind;
      if (k === 'mark-A' || k === 'mark-B' || k === 'mark-D') {
        const eventName = k.replace('mark-', '');
        const grid = eventsCheckboxes[eventName];
        if (!grid) return `step=${k}`;
        const marked: string[] = [];
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c]?.checked) marked.push(`(${r + 1},${c + 1})`);
          }
        }
        return `step=${k}; marcou ${marked.length} células: ${marked.slice(0, 12).join(', ')}${marked.length > 12 ? '…' : ''}`;
      }
      if (k === 'identify-operation') {
        const s = operationSelectInputs;
        return `step=${k}; A=${s?.eventsA?.value || '_'} op=${s?.operations?.value || '_'} B=${s?.eventsB?.value || '_'}`;
      }
      if (k === 'compute-probability') {
        const p = probabilitiesTextInputs;
        return `step=${k}; P(${p?.eventName ?? '?'})=${p?.numerator?.value || '_'}/${p?.denominator?.value || '_'}`;
      }
      return `step=${k}`;
    };
    const respostaUsuario = summarizeResponse();
    if (ok) {
      const isLastStep = stepIndex + 1 >= steps.length;
      if (isLastStep) {
        createAlert('Parabéns!', 'Você acertou! Rodada concluída.', 'success', 4000, respostaUsuario);
        playSound('/sounds/challengeFinished.mp3');
        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(false);
        if (currentStep.kind === 'compute-probability') disableProbabilitiesInputs();
        if (currentStep.kind === 'identify-operation') disableSelectInputs();
        if (
          currentStep.kind === 'mark-A' ||
          currentStep.kind === 'mark-B' ||
          currentStep.kind === 'mark-D'
        ) disableAllCheckboxes();
      } else {
        createAlert('Parabéns!', 'Você acertou!', 'success', 3000, respostaUsuario);
        playSound('/sounds/correct.mp3');
        advanceToNextStep();
      }
    } else {
      createAlert('Ops!', 'Você errou — confira sua resposta.', 'error', 4000, respostaUsuario);
      playSound('/sounds/incorrect.mp3');
      if (currentStep.kind === 'identify-operation') flagErrorOnSelectInputs();
      if (currentStep.kind === 'compute-probability') flagErrorOnProbabilities();
      onStepError?.(currentStep.kind);
    }
    goToTopOfChallenge();
  };

  const goToNextStepOnClick = () => {
    advanceToNextStep();
    goToTopOfChallenge();
  };

  const dicesChecksClearOnClick = () => {
    updateModal({
      title: 'Limpando marcações',
      description: 'Você gostaria de limpar as marcações?',
      status: 'show',
      confirmCallback: () => {
        createAlert('Marcações limpas', 'As marcações foram apagadas.', 'info');
        playSound('/sounds/clear.mp3');
        resetCheckboxesPreservingDisabled();
      },
    });
  };

  /* ──────────────────────────────────────────────────────────────
     markAllOnClick — marca todas as 36 células do evento da
     sub-fase atual (A em mark-A, B em mark-B, D em mark-D).
     Estratégia útil quando o evento tem muitos casos favoráveis:
     marca tudo e o estudante desmarca os que NÃO satisfazem.
     Eventos anteriores já congelados (disabled=true) não são tocados.
     ──────────────────────────────────────────────────────────── */
  const markAllOnClick = () => {
    const targetName =
      currentStep.kind === 'mark-A' ? 'A' :
      currentStep.kind === 'mark-B' ? 'B' :
      currentStep.kind === 'mark-D' ? 'D' : null;
    if (!targetName) return;
    logMarkAllUsed('unionExercise6', String(stepIndex), targetName);

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

  // O botão "Marcar todos!" só faz sentido em sub-fases de marcação ainda
  // não validadas — usa o mesmo critério do botão Limpar.
  const disabledMarkAllButton = disabledClearButton;

  return {
    instructions,
    currentStepKind: currentStep.kind,
    activeEvents: currentStep.activeEvents,
    eventsCheckboxes,
    updateEventsCheckboxes,
    probabilitiesTextInputs,
    operationSelectInputs,
    disabledCheckButton,
    disabledNextStepButton,
    disabledClearButton,
    checkOnClick,
    goToNextStepOnClick,
    dicesChecksClearOnClick,
    alerts,
    updateAlert,
    deleteAlerts,
    modal,
    updateModal,
    /** Cores nítidas por evento (A=azul info, B=laranja warning, D=roxo brand). */
    eventColors: SINGLE_SHOT_EVENT_COLORS,
    /** Lista de eventos cujo placeholder deve sumir nas células onde
     *  estão unchecked (após validação do step daquele evento). */
    hideIfUnchecked,
    /** Marca todas as 36 células do evento da sub-fase atual. */
    markAllOnClick,
    /** Acessível apenas em sub-fases de marcação ainda não validadas. */
    disabledMarkAllButton,
    /** DEV — avança para o próximo sub-passo simulando a interação correta.
     *  Não valida; apenas reaproveita advanceToNextStep para fast-forward
     *  por marking → identify-operation → compute-probability. Quando
     *  estamos no último, chama onChallengeFinished. */
    devAdvance: advanceToNextStep,
  };
};
