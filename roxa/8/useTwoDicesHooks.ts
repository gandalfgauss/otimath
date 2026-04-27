'use client'

import { CheckboxInterface } from '@/components/global/Checkbox';
import { TextInputInterface } from '@/components/global/TextInput';
import { SelectInputInterface } from '@/components/global/SelectInput';
import { useState, useEffect } from 'react';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';

// ----------------------------------------------------------------------------
// Parametrização matemática rigorosa.
//
// Substitui o sorteio cego (12 eventos × shuffleArray) por um gerador que:
//   • valida cada par (A,B,operação) antes de propor o problema ao aluno;
//   • garante eventos simples não-equivalentes e não-complementares;
//   • impede desafios degenerados (∅, Ω, A⊆B, B⊆A, etc.);
//   • compara probabilidades por produto cruzado (sem toFixed/==).
//
// Toda a coreografia de UI (alerts, modais, sons, navegação entre steps)
// permanece intocada — somente o gerador e a verificação numérica mudam.
// ----------------------------------------------------------------------------
import {
  buildValidatedGameSetup,
  buildProgressiveValidatedGameSetup,
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

// Re-exports preservam compatibilidade com consumidores legados que
// importavam Event/Operation diretamente deste arquivo.
export type { Event, Operation };

// ============================================================================
// 1. INTERFACES DE UI (preservadas integralmente do hook original)
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
// 2. CONSTANTES E MAPEAMENTOS
// ============================================================================

const MAXIMUM_VALUE_DICE = 6;

/**
 * Mensagens de feedback formativo para inputs de fração inválidos.
 * Mapeadas a partir de FractionInvalidReason fornecido por sanitizeFraction.
 */
const FRACTION_FEEDBACK_MESSAGES: Record<FractionInvalidReason, string> = {
  "empty":            "Preencha o numerador e o denominador.",
  "non-integer":      "Use apenas números inteiros.",
  "zero-denominator": "O denominador não pode ser zero.",
  "negative":         "A probabilidade não admite valores negativos.",
  "improper":         "O numerador não pode ser maior que o denominador.",
};

// ============================================================================
// 3. CONSTRUÇÃO DOS DESAFIOS A PARTIR DE UM SETUP JÁ VALIDADO
//    Estrutura interna de challenges/steps/instructions preservada
//    LITERALMENTE do código original — apenas a fonte dos pares mudou.
// ============================================================================

const getNewGame = (setup: ValidatedSetup) => {
  const challenges: any[] = [];

  // ---- Desafios simples (2): evento A com complementar -------------------
  for (const ev of setup.simpleEvents) {
    challenges.push({
      steps: [
        {
          activeEvents: [{ name: "A", ...ev }],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao <strong>evento</strong>.
            Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
          </p>`,
        },
        {
          activeEvents: [{ name: "A", ...ev }],
          checkType: "probability-and-complementary-probability",
          instructions: `<p className="ds-body">
            Calcule a probabilidade de ocorrer o <strong>Evento A</strong> e a probabilidade de ocorrer o seu <strong>complementar (A&#773)</strong>,
            digitando os valores apropriados no numerador e no denominador das frações abaixo no <strong>Quadro de Cálculo(s)</strong>.
            Ao terminar, clique no <strong>Botão Conferir</strong> para conferir sua resposta. 
          </p>`,
          eventToProbability: { name: "A", ...ev },
          hasComplementary: true,
        }
      ]
    });
  }

  // ---- Desafios compostos: pares (A, B) com operação validada ------------
  for (const { A, B, operation } of setup.compoundSlots) {
    const D = createCompositeEvent(operation, A, B, "D");

    challenges.push({
      steps: [
        {
          activeEvents: [{ name: "A", ...A }, { name: "B", ...B }],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição dos eventos <strong>A</strong> e <strong>B</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes aos <strong>eventos.</strong>
            Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
          </p>`,
        },
        {
          activeEvents: [{ name: "A", ...A }, { name: "B", ...B }, D],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento D</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao evento.
            Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
          </p>`,
        },
        {
          activeEvents: [{ name: "A", ...A }, { name: "B", ...B }, D],
          checkType: "select",
          instructions: `<p className="ds-body">
            Expresse o <strong>Evento D</strong> a partir de <strong>operações</strong> com os <strong>eventos A e B,</strong> selecionando as
            operações e eventos apropriados. Ao terminar, clique no <strong>Botão Conferir</strong> para conferir sua resposta.
          </p>`,
          operation: operation,
          eventsForSelect: ["A", "A\u0305", "B", "B\u0305"],
          operations: [
            { value: "Intersection", label: "\u2229" },
            { value: "Union",        label: "\u222A" },
            { value: "Difference",   label: "\u2212" }
          ],
        },
        {
          activeEvents: [{ name: "A", ...A }, { name: "B", ...B }, D],
          checkType: "probability",
          hasComplementary: false,
          instructions: `<p className="ds-body">
            Calcule a probabilidade de ocorrer o <strong>Evento D</strong>,
            digitando os valores apropriados no numerador e no denominador da fração abaixo no <strong>Quadro de Cálculo(s)</strong>.
            Ao terminar, clique no <strong>Botão Conferir</strong> para conferir sua resposta. 
          </p>`,
          eventToProbability: D,
        }
      ]
    });
  }

  return { challenges };
};

// ============================================================================
// 4. HOOK PRINCIPAL
// ============================================================================

export const useTwoDicesHooks = () => {

  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [challenge, setChallenge] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] =
    useState<ProbabilitiesTextInputs>({} as ProbabilitiesTextInputs);
  const [operationSelectInputs, setOperationSelectInputs] =
    useState<OperationSelectInputs>({} as OperationSelectInputs);

  // Inicializamos com challenges vazio. O useEffect abaixo dispara startGame()
  // imediatamente após o mount, populando o jogo de fato. Esta abordagem
  // evita gerar dois jogos no ciclo de mount (um descartado, outro mantido).
  // Os fallbacks `?.` em todo o código tratam graciosamente o estado vazio.
  const [game, setGame] = useState<{ challenges: any[] }>({ challenges: [] });

  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledNextStepButton, setDisabledNextStepButton] = useState(true);
  const [disabledClearButton, setDisabledClearButton] = useState(false);

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // 4.1 Estado dos checkboxes (preservado integralmente)
  // --------------------------------------------------------------------------

  const disabledCheckboxesState = (eventsCheckboxesActual = eventsCheckboxes) => {
    const newState: EventCheckboxes = { ...eventsCheckboxesActual };

    Object.keys(newState).forEach((eventName) => {
      for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
        for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
          newState[eventName][diceGreen][diceBlue] = {
            ...newState[eventName][diceGreen][diceBlue],
            disabled: true,
          };
        }
      }
    });
    setEventsCheckboxes(newState);
    return newState;
  };

  const buildCheckboxesState = (
    gameActual = game,
    challengeActual = challenge,
    stepActual = step,
    eventsCheckboxesActual = eventsCheckboxes
  ) => {
    const eventsName =
      gameActual.challenges?.[challengeActual]?.steps?.[stepActual]?.activeEvents.map(
        (event: Event) => event.name
      ) ?? [];
    const newState: EventCheckboxes = { ...eventsCheckboxesActual };

    eventsName.forEach((eventName: string) => {
      if (!newState[eventName]) {
        newState[eventName] = [];
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          newState[eventName][diceGreen] = [];
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newState[eventName][diceGreen].push({ checked: false, disabled: false });
          }
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const resetEventsCheckboxes = (
    eventsCheckboxesActual = eventsCheckboxes,
    preserveDisabledState = true
  ) => {
    const newState: EventCheckboxes = {};

    Object.keys(eventsCheckboxesActual).forEach((eventName) => {
      if (preserveDisabledState && eventsCheckboxesActual?.[eventName]?.[0]?.[0]?.disabled) {
        newState[eventName] = eventsCheckboxesActual[eventName];
      } else {
        newState[eventName] = [];
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          newState[eventName][diceGreen] = [];
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newState[eventName][diceGreen].push({ checked: false, disabled: false });
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
    disabled: boolean
  ) => {
    setEventsCheckboxes((prev) => {
      const updated = { ...prev };
      updated[eventName][diceGreen - 1][diceBlue - 1] = { checked, disabled };
      return updated;
    });
  };

  // --------------------------------------------------------------------------
  // 4.2 Estado das frações (preservado integralmente)
  // --------------------------------------------------------------------------

  const resetProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs({} as ProbabilitiesTextInputs);
  };

  const buildProbabilities = (eventName: string, hasComplementary: boolean) => {
    const probabilitiesTextInputsAux: ProbabilitiesTextInputs = {
      eventName,
      hasComplementary,
      numerator:                { value: "", disabled: false, error: false },
      denominator:              { value: "", disabled: false, error: false },
      complementaryNumerator:   { value: "", disabled: false, error: false },
      complementaryDenominator: { value: "", disabled: false, error: false },
    };

    probabilitiesTextInputsAux.numerator.setValue = (value: string) => {
      setProbabilitiesTextInputs((prev) => ({
        ...prev, numerator: { ...prev.numerator, value }
      }));
    };

    probabilitiesTextInputsAux.denominator.setValue = (value: string) => {
      setProbabilitiesTextInputs((prev) => ({
        ...prev, denominator: { ...prev.denominator, value }
      }));
    };

    if (probabilitiesTextInputsAux.complementaryNumerator) {
      probabilitiesTextInputsAux.complementaryNumerator.setValue = (value: string) => {
        setProbabilitiesTextInputs((prev) => ({
          ...prev,
          complementaryNumerator: { ...prev.complementaryNumerator, value },
        }));
      };
    }

    if (probabilitiesTextInputsAux.complementaryDenominator) {
      probabilitiesTextInputsAux.complementaryDenominator.setValue = (value: string) => {
        setProbabilitiesTextInputs((prev) => ({
          ...prev,
          complementaryDenominator: { ...prev.complementaryDenominator, value },
        }));
      };
    }

    setProbabilitiesTextInputs(probabilitiesTextInputsAux);
  };

  const disabledProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs((prev) => ({
      ...prev,
      numerator:                { ...prev.numerator,                error: false, disabled: true },
      denominator:              { ...prev.denominator,              error: false, disabled: true },
      complementaryNumerator:   { ...prev.complementaryNumerator,   error: false, disabled: true },
      complementaryDenominator: { ...prev.complementaryDenominator, error: false, disabled: true },
    }));
  };

  const addErrorProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs((prev) => ({
      ...prev,
      numerator:                { ...prev.numerator,                error: true },
      denominator:              { ...prev.denominator,              error: true },
      complementaryNumerator:   { ...prev.complementaryNumerator,   error: true },
      complementaryDenominator: { ...prev.complementaryDenominator, error: true },
    }));
  };

  // --------------------------------------------------------------------------
  // 4.3 Estado dos selects (preservado integralmente)
  // --------------------------------------------------------------------------

  const resetOperationSelectInputs = () => {
    setOperationSelectInputs({} as OperationSelectInputs);
  };

  const buildOperationSelectInputs = (
    events: string[],
    operations: { value: string; label: string }[]
  ) => {
    const operationSelectInputsAux: OperationSelectInputs = {
      eventsA: {
        disabled: false, value: " ", error: false,
        setValue: (value) => setOperationSelectInputs((prev) => ({
          ...prev, eventsA: { ...prev.eventsA, value }
        })),
        options: events.map((event) => ({ value: event, label: event })),
      },
      operations: {
        disabled: false, value: " ", error: false,
        setValue: (value) => setOperationSelectInputs((prev) => ({
          ...prev, operations: { ...prev.operations, value }
        })),
        options: operations.map((op) => ({ value: op.value, label: op.label })),
      },
      eventsB: {
        disabled: false, value: " ", error: false,
        setValue: (value) => setOperationSelectInputs((prev) => ({
          ...prev, eventsB: { ...prev.eventsB, value }
        })),
        options: events.map((event) => ({ value: event, label: event })),
      },
    };
    setOperationSelectInputs(operationSelectInputsAux);
  };

  const disabledOperationSelectInputs = () => {
    if (operationSelectInputs?.eventsA) {
      setOperationSelectInputs((prev) => ({
        ...prev,
        eventsA:    { ...prev.eventsA,    error: false, disabled: true },
        operations: { ...prev.operations, error: false, disabled: true },
        eventsB:    { ...prev.eventsB,    error: false, disabled: true },
      }));
    }
  };

  const addErrorOperationSelectInputs = () => {
    if (operationSelectInputs?.eventsA) {
      setOperationSelectInputs((prev) => ({
        ...prev,
        eventsA:    { ...prev.eventsA,    error: true },
        operations: { ...prev.operations, error: true },
        eventsB:    { ...prev.eventsB,    error: true },
      }));
    }
  };

  // --------------------------------------------------------------------------
  // 4.4 Verificações de solução
  //     verifyCheckboxSolution e verifySelectOperation: preservadas.
  //     verifyProbability* refatoradas para usar comparação EXATA por
  //     produto cruzado (verifyExactProbability), eliminando os bugs do
  //     toFixed (falso-positivo) e do == em float (falso-negativo).
  // --------------------------------------------------------------------------

  const isGameOver = () => {
    return (
      game.challenges?.length - 1 === challenge &&
      game.challenges?.[challenge]?.steps?.length - 1 === step
    );
  };

  const verifyCheckboxSolution = () => {
    const activeEvts = game.challenges?.[challenge]?.steps?.[step]?.activeEvents;
    const checkboxes = eventsCheckboxes;

    return activeEvts.every((event: Event) => {
      for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
        for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
          if (
            event.validation(diceGreen + 1, diceBlue + 1) !==
            checkboxes[event.name as string][diceGreen][diceBlue].checked
          ) {
            return false;
          }
        }
      }
      return true;
    });
  };

  const verifyProbabilityAndProbabilityComplementary = () => {
    const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
    if (!eventToProbability) return false;

    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    const eventOccurrences = countFavorable(eventToProbability);
    const complementaryOccurrences = sampleSpace - eventOccurrences;

    const okEvent = verifyExactProbability(
      probabilitiesTextInputs.numerator.value as string,
      probabilitiesTextInputs.denominator.value as string,
      eventOccurrences,
      sampleSpace
    );
    const okComp = verifyExactProbability(
      probabilitiesTextInputs.complementaryNumerator?.value as string,
      probabilitiesTextInputs.complementaryDenominator?.value as string,
      complementaryOccurrences,
      sampleSpace
    );
    return okEvent && okComp;
  };

  const verifyProbability = () => {
    const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
    if (!eventToProbability) return false;

    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    return verifyExactProbability(
      probabilitiesTextInputs.numerator.value as string,
      probabilitiesTextInputs.denominator.value as string,
      countFavorable(eventToProbability),
      sampleSpace
    );
  };

  const verifySelectOperation = () => {
    const operation = game.challenges?.[challenge]?.steps?.[step]?.operation;

    switch (operation) {
      case "Union":
        if (operationSelectInputs.operations.value === "Union") {
          if (
            (operationSelectInputs.eventsA.value === "A" && operationSelectInputs.eventsB.value === "B") ||
            (operationSelectInputs.eventsA.value === "B" && operationSelectInputs.eventsB.value === "A")
          ) return true;
        }
        break;

      case "Intersection":
        if (operationSelectInputs.operations.value === "Intersection") {
          if (
            (operationSelectInputs.eventsA.value === "A" && operationSelectInputs.eventsB.value === "B") ||
            (operationSelectInputs.eventsA.value === "B" && operationSelectInputs.eventsB.value === "A")
          ) return true;
        }
        if (operationSelectInputs.operations.value === "Difference") {
          if (
            (operationSelectInputs.eventsA.value === "A" && operationSelectInputs.eventsB.value === "B\u0305") ||
            (operationSelectInputs.eventsA.value === "B" && operationSelectInputs.eventsB.value === "A\u0305")
          ) return true;
        }
        break;

      case "Difference":
        if (operationSelectInputs.operations.value === "Intersection") {
          if (
            (operationSelectInputs.eventsA.value === "A"        && operationSelectInputs.eventsB.value === "B\u0305") ||
            (operationSelectInputs.eventsA.value === "B\u0305" && operationSelectInputs.eventsB.value === "A")
          ) return true;
        }
        if (operationSelectInputs.operations.value === "Difference") {
          if (operationSelectInputs.eventsA.value === "A" && operationSelectInputs.eventsB.value === "B") return true;
        }
        break;

      case "ReverseDifference":
        if (operationSelectInputs.operations.value === "Intersection") {
          if (
            (operationSelectInputs.eventsA.value === "A\u0305" && operationSelectInputs.eventsB.value === "B") ||
            (operationSelectInputs.eventsA.value === "B"        && operationSelectInputs.eventsB.value === "A\u0305")
          ) return true;
        }
        if (operationSelectInputs.operations.value === "Difference") {
          if (operationSelectInputs.eventsA.value === "B" && operationSelectInputs.eventsB.value === "A") return true;
        }
        break;
    }
    return false;
  };

  const checkSolution = () => {
    switch (game.challenges?.[challenge]?.steps?.[step]?.checkType) {
      case "checkbox":                                  return verifyCheckboxSolution();
      case "probability-and-complementary-probability": return verifyProbabilityAndProbabilityComplementary();
      case "probability":                               return verifyProbability();
      case "select":                                    return verifySelectOperation();
    }
  };

  // --------------------------------------------------------------------------
  // 4.5 Navegação entre steps (preservada integralmente)
  // --------------------------------------------------------------------------

  const finishedTheChallenge = () => {
    return step + 1 >= game.challenges?.[challenge]?.steps.length;
  };

  const getCheckTypeByChallengeAndStep = (challenge: number, step: number) => {
    return game.challenges?.[challenge].steps?.[step].checkType;
  };

  const nextStep = () => {
    const next = step + 1;
    if (next < game.challenges?.[challenge]?.steps.length) {
      let newEventsCheckboxes = { ...eventsCheckboxes };

      if (getCheckTypeByChallengeAndStep(challenge, step) === "checkbox") {
        newEventsCheckboxes = disabledCheckboxesState();
      }
      if (getCheckTypeByChallengeAndStep(challenge, next) === "checkbox") {
        buildCheckboxesState(game, challenge, next, newEventsCheckboxes);
      }
      if (
        getCheckTypeByChallengeAndStep(challenge, step) === "probability-and-complementary-probability" ||
        getCheckTypeByChallengeAndStep(challenge, step) === "probability"
      ) {
        disabledProbabilitiesTextInputs();
      }
      if (
        getCheckTypeByChallengeAndStep(challenge, next) === "probability-and-complementary-probability" ||
        getCheckTypeByChallengeAndStep(challenge, next) === "probability"
      ) {
        buildProbabilities(
          game.challenges?.[challenge]?.steps?.[next]?.eventToProbability?.name ?? '',
          game.challenges?.[challenge]?.steps?.[next]?.hasComplementary ?? false
        );
      }
      if (getCheckTypeByChallengeAndStep(challenge, step) === "select") {
        disabledOperationSelectInputs();
      }
      if (getCheckTypeByChallengeAndStep(challenge, next) === "select") {
        buildOperationSelectInputs(
          game.challenges?.[challenge]?.steps?.[next]?.eventsForSelect ?? [],
          game.challenges?.[challenge]?.steps?.[next]?.operations ?? []
        );
      }

      setStep(next);
      setActiveEvents(game.challenges?.[challenge]?.steps?.[next]?.activeEvents);
      setInstructions(game.challenges?.[challenge]?.steps?.[next]?.instructions);

      return game.challenges?.[challenge]?.steps?.[next]?.checkType;
    } else {
      const nextChallenge = challenge + 1;
      if (nextChallenge < game.challenges.length) {
        buildCheckboxesState(game, nextChallenge, 0, {});
        resetProbabilitiesTextInputs();
        resetOperationSelectInputs();
        setChallenge(nextChallenge);
        setStep(0);
        setInstructions(game.challenges?.[nextChallenge]?.steps?.[0]?.instructions);
        setActiveEvents(game.challenges?.[nextChallenge]?.steps?.[0]?.activeEvents);
        return game.challenges?.[nextChallenge]?.steps?.[0]?.checkType;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4.6 Handlers de UI
  //     Preservados, com inserção da pré-validação numérica granular
  //     que oferece feedback formativo específico para cada tipo de erro
  //     de input antes da verificação matemática propriamente dita.
  // --------------------------------------------------------------------------

  const dicesChecksClearOnClick = () => {
    updateModal({
      title: "Limpando marcações",
      description: "Você gostaria de limpar as marcações da atividade atual?",
      status: "show",
      confirmCallback: () => {
        createAlert("Dados limpos", "Todas as marcações foram limpas", "info");
        playSound("/sounds/clear.mp3");
        resetEventsCheckboxes(eventsCheckboxes, true);
      },
    });
  };

  const goToTopOfChallenge = () => {
    requestAnimationFrame(() => {
      document.getElementById("dois-dados")?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  /**
   * Pré-validação didática para inputs numéricos: detecta inputs
   * malformados (vazios, não-inteiros, denominador zero, negativos,
   * frações impróprias) e exibe feedback formativo específico ANTES de
   * executar a verificação matemática. Eleva a qualidade pedagógica do
   * feedback sem alterar o fluxo da aplicação.
   *
   * Retorna true se os inputs estiverem bem-formados (segue o fluxo);
   * false se houver erro (alerta e marcação são exibidos, retorno cedo).
   */
  const preValidateProbabilityInputs = (
    currentCheckType: string | undefined
  ): boolean => {
    if (
      currentCheckType !== "probability" &&
      currentCheckType !== "probability-and-complementary-probability"
    ) {
      return true; // não se aplica a outros checkTypes
    }

    const numIssue = sanitizeFraction(
      probabilitiesTextInputs.numerator?.value,
      probabilitiesTextInputs.denominator?.value
    );
    if (!numIssue.valid) {
      createAlert("Atenção", FRACTION_FEEDBACK_MESSAGES[numIssue.reason!], "warning", 4000);
      addErrorProbabilitiesTextInputs();
      return false;
    }

    if (currentCheckType === "probability-and-complementary-probability") {
      const compIssue = sanitizeFraction(
        probabilitiesTextInputs.complementaryNumerator?.value,
        probabilitiesTextInputs.complementaryDenominator?.value
      );
      if (!compIssue.valid) {
        createAlert("Atenção", FRACTION_FEEDBACK_MESSAGES[compIssue.reason!], "warning", 4000);
        addErrorProbabilitiesTextInputs();
        return false;
      }
    }

    return true;
  };

  const checkOnClick = () => {
    const currentCheckType = getCheckTypeByChallengeAndStep(challenge, step);

    // Pré-validação de inputs numéricos com feedback formativo granular.
    if (!preValidateProbabilityInputs(currentCheckType)) {
      goToTopOfChallenge();
      return;
    }

    if (checkSolution()) {
      if (isGameOver()) {
        createAlert("Parabéns!", "Você acertou! Parabéns por finalizar todos os desafios!", "success", 5000);
        playSound("/sounds/gameFinished.mp3");

        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, você finalizou todos os desafios!</p>");
        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(true);
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();

      } else if (finishedTheChallenge()) {
        createAlert("Parabéns!", "Você acertou! Passe para o próximo desafio.", "success", 5000);
        playSound("/sounds/challengeFinished.mp3");

        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(false);
        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, passe para o próximo desafio!</p>");
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();

      } else {
        createAlert("Parabéns!", "Você acertou!", "success", 5000);
        playSound("/sounds/correct.mp3");
        goToNextStepOnClick();
      }
    } else {
      createAlert("Ops!", "Você errou, tente novamente!", "error", 4000);
      playSound("/sounds/incorrect.mp3");

      if (currentCheckType === "select") {
        addErrorOperationSelectInputs();
      }
      if (
        currentCheckType === "probability" ||
        currentCheckType === "probability-and-complementary-probability"
      ) {
        addErrorProbabilitiesTextInputs();
      }
    }

    goToTopOfChallenge();
  };

  const goToNextStepOnClick = () => {
    setDisabledCheckButton(false);
    setDisabledNextStepButton(true);

    const checkType = nextStep();
    if (checkType === "checkbox") {
      setDisabledClearButton(false);
    } else {
      setDisabledClearButton(true);
    }
    goToTopOfChallenge();
  };

  const resetGameOnClick = () => {
    updateModal({
      title: "Reiniciando o jogo",
      description: "Você gostaria de reiniciar o jogo?",
      status: "show",
      confirmCallback: () => {
        createAlert("Jogo reiniciado", "O jogo foi reiniciado", "info");
        playSound("/sounds/clear.mp3");
        startGame();
        setDisabledCheckButton(false);
        setDisabledNextStepButton(true);
        setDisabledClearButton(false);
        goToTopOfChallenge();
      },
    });
  };

  // --------------------------------------------------------------------------
  // 4.7 Inicialização do jogo
  //     Substitui shuffleArray cego por buildValidatedGameSetup, que
  //     aplica as restrições matemáticas de admissibilidade (R1–R4) e
  //     usa defesa em profundidade (greedy + retries + backtracking).
  // --------------------------------------------------------------------------

  const startGame = () => {
    setChallenge(0);
    setStep(0);
    try {
      // Geração balanceada: respeita progressão de dificuldade E
      // diversidade pedagógica por família. Internamente faz cascata
      // de 4 níveis até chegar em buildValidatedGameSetup, garantindo
      // sempre um jogo matematicamente válido.
      const setup = buildBalancedProgressiveValidatedGameSetup(DEFAULT_EVENT_POOL, DEFAULT_OPERATION_POOL);
      const newGame = getNewGame(setup);
      setGame(newGame);
      resetEventsCheckboxes({}, false);
      resetProbabilitiesTextInputs();
      resetOperationSelectInputs();
      buildCheckboxesState(newGame, 0, 0, {});
      setActiveEvents(newGame.challenges?.[0]?.steps?.[0]?.activeEvents);
      setInstructions(newGame.challenges?.[0]?.steps?.[0]?.instructions);
    } catch (e) {
      // Fallback final: tenta o gerador validado básico.
      try {
        const setup = buildValidatedGameSetup(DEFAULT_EVENT_POOL, DEFAULT_OPERATION_POOL);
        const newGame = getNewGame(setup);
        setGame(newGame);
        resetEventsCheckboxes({}, false);
        resetProbabilitiesTextInputs();
        resetOperationSelectInputs();
        buildCheckboxesState(newGame, 0, 0, {});
        setActiveEvents(newGame.challenges?.[0]?.steps?.[0]?.activeEvents);
        setInstructions(newGame.challenges?.[0]?.steps?.[0]?.instructions);
      } catch (e2) {
        if (typeof console !== "undefined") {
          console.error("[useTwoDicesHooks] Falha ao iniciar o jogo:", e2);
        }
        createAlert(
          "Erro",
          "Não foi possível gerar um jogo válido. Por favor, recarregue a página.",
          "error",
          6000
        );
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4.8 API pública do hook (assinatura idêntica à do código original)
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
  };
};
