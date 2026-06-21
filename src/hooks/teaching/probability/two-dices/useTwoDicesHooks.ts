'use client'

import { CheckboxInterface } from '@/components/global/Checkbox';
import { TextInputInterface } from '@/components/global/TextInput';
import { SelectInputInterface } from '@/components/global/SelectInput';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertType } from '@/components/global/Alert';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import { logAttempt, logMarkAllUsed } from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';
import { telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';

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

export interface Event {
  name?: string;
  description: string;
  complementaryDescription: string;
  validation: (greenDice: number, blueDice:number) => boolean;
}

type Operation = "Intersection" | "Union" | "Difference" | "ReverseDifference";

const MAXIMUM_VALUE_DICE = 6;

const events: Event[] = [
  {
    description: "Soma maior que 8",
    complementaryDescription: "Soma menor ou igual a 8",
    validation: (greenDice, blueDice) => greenDice + blueDice > 8,
  },
  {
    description: "Menor face igual a 5",
    complementaryDescription: "Menor face diferente de 5",
    validation: (greenDice, blueDice) => Math.min(greenDice, blueDice) === 5,
  },
  {
    description: "Face par no dado verde",
    complementaryDescription: "Face ímpar no dado verde",
    validation: (greenDice, ) => greenDice % 2 === 0,
  },
  {
    description: "Soma igual a 6",
    complementaryDescription: "Soma diferente de 6",
    validation: (greenDice, blueDice) => greenDice + blueDice === 6,
  },
  {
    description: "Produto das faces maior que 15",
    complementaryDescription: "Produto das faces menor ou igual a 15",
    validation: (greenDice, blueDice) => greenDice * blueDice > 15,
  },
  {
    description: "Número primo no dado azul",
    complementaryDescription: "Número não primo no dado azul",
    validation: (_, blueDice) => isPrime(blueDice),
  },
  {
    description: "Maior face igual a 4",
    complementaryDescription: "Maior face diferente de 4",
    validation: (greenDice, blueDice) => Math.max(greenDice, blueDice) === 4,
  },
  {
    description: "Soma menor que 7",
    complementaryDescription: "Soma maior ou igual a 7",
    validation: (greenDice, blueDice) => greenDice + blueDice < 7,
  },
  {
    description: "Pelo menos uma face par",
    complementaryDescription: "Nenhuma face par",
    validation: (greenDice, blueDice) => greenDice % 2 === 0 || blueDice % 2 === 0,
  },
  {
    description: "Pelo menos uma face múltipla de 3",
    complementaryDescription: "Nenhuma face múltipla de 3",
    validation: (greenDice, blueDice) => greenDice % 3 === 0 || blueDice % 3 === 0,
  },
  {
    description: "Exatamente uma face par",
    complementaryDescription: "Nenhuma ou mais de uma face par",
    validation: (greenDice, blueDice) =>
      (greenDice % 2 === 0 && blueDice % 2 !== 0) || (blueDice % 2 === 0 && greenDice % 2 !== 0),
  },
  {
    description: "Nenhuma face par",
    complementaryDescription: "Pelo menos uma face par",
    validation: (greenDice, blueDice) => greenDice % 2 === 1 && blueDice % 2 === 1,
  },
];

const operations = ["Intersection", "Union", "Difference", "ReverseDifference"] as Operation[];

const isPrime = (num: number): boolean => {
  return [2, 3, 5].includes(num);
};

const getCompositeValidationFunction = (operation: Operation, validation1 : (greenDice: number, blueDice : number) => boolean, validation2: (greenDice: number, blueDice : number) => boolean) => {
  return (greenDice: number, blueDice: number) => {
    const result1 = validation1(greenDice, blueDice);
    const result2 = validation2(greenDice, blueDice);
    
    switch (operation) {
      case "Intersection":
        return result1 && result2;
      case "Union":
        return result1 || result2;
      case "Difference":
        return result1 && !result2;
      case "ReverseDifference":
        return !result1 && result2;
    }
  }
}

const getCompoundDescription = (operation: Operation, eventA: Event, eventB: Event) => {
  switch (operation) {
    case "Intersection":
      return eventA.description + " e " + eventB.description.toLowerCase();
    case "Union":
      return eventA.description + " ou " + eventB.description.toLowerCase();
    case "Difference":
      return eventA.description + " e " + eventB.complementaryDescription.toLowerCase();
    case "ReverseDifference":
      return eventB.description + " e " + eventA.complementaryDescription.toLowerCase();
  }
}

function shuffleArray<T>(data: T[]): T[] {
  const newArray = [...data];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/** Gera uma permutação aleatória [0..n-1] — serve como "seed" persistível
 *  do shuffle. Persistir o array é tão barato quanto um seed numérico
 *  e dispensa um RNG seedable. */
function randomOrder(n: number): number[] {
  return shuffleArray(Array.from({ length: n }, (_, i) => i));
}

/** Aplica uma ordem (índices) sobre o array — inversa de `randomOrder`. */
function applyOrder<T>(arr: T[], order: number[]): T[] {
  return order.map(i => arr[i]).filter((v): v is T => v !== undefined);
}

const getNewGame = (scrambledEvents: Event[], operations: Operation[]) => {
  const challenges = [];

  for (let i = 0; i < 2; i++) {
    challenges.push({
      steps: [
        {
          activeEvents: [{ name: "A", ...scrambledEvents[i] }],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao <strong>evento</strong>.
            Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
          </p>`,
        },
        {
          activeEvents: [{ name: "A", ...scrambledEvents[i] }],
          checkType: "probability-and-complementary-probability",
          instructions: `<p className="ds-body">
            Calcule a probabilidade de ocorrer o <strong>Evento A</strong> e a probabilidade de ocorrer o seu <strong>complementar (A&#773)</strong>,
            digitando os valores apropriados no numerador e no denominador das frações abaixo no <strong>Quadro de Cálculo(s)</strong>.
            Ao terminar, clique no <strong>Botão Conferir</strong> para conferir sua resposta. 
          </p>`,
          eventToProbability: { name: "A", ...scrambledEvents[i] },
          hasComplementary: true,
        }
      ]
    });
  }

  for (let i = 2, j = 0; i < scrambledEvents.length - 2; i += 2, j++) {
    const A = scrambledEvents[i];
    const B = scrambledEvents[i + 1];
    const operation = operations[j];
    const D = {
      name: "D",
      description: getCompoundDescription(operation, A, B),
      complementaryDescription: "",
      validation: getCompositeValidationFunction(operation, A.validation, B.validation)
    };

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
            { value: "Union", label: "\u222A" },
            { value: "Difference", label: "\u2212" }
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


export const useTwoDicesHooks = () => {

  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [challenge, setChallenge] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] = useState<ProbabilitiesTextInputs>({} as ProbabilitiesTextInputs);
  const [operationSelectInputs, setOperationSelectInputs] = useState<OperationSelectInputs>({} as OperationSelectInputs)

  // Ordens de embaralhamento — persistidas no snapshot pra que F5 restaure
  // a MESMA sequência de challenges que o aluno estava vendo. Default =
  // identidade (ordem original do array, comportamento histórico).
  const [eventsOrder, setEventsOrder] = useState<number[]>(() => Array.from({ length: events.length }, (_, i) => i));
  const [operationsOrder, setOperationsOrder] = useState<number[]>(() => Array.from({ length: operations.length }, (_, i) => i));
  const [game, setGame] = useState(() => getNewGame(applyOrder(events, eventsOrder), applyOrder(operations, operationsOrder)));

  const {alerts, createAlert: _createAlert, updateAlert, deleteAlerts} = useAlerts();
  const {modal, updateModal} = useModal();
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledNextStepButton, setDisabledNextStepButton] = useState(true);
  const [disabledClearButton, setDisabledClearButton] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // TELEMETRIA — `createAlert` inteligente
  //
  // Mesmo padrão da Roleta: 7 createAlerts no hook, a maioria sem 5º
  // param `userResponse`. Quando não vem, o wrapper deriva do estado
  // atual do aluno (células marcadas, selects, frações digitadas).
  // Ref sincronizada a cada render mantém o snapshot atualizado.
  // ─────────────────────────────────────────────────────────────────
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

  /** Resume o estado de células marcadas — "evento X: 4 células (1,2;3,5;...)". */
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
        // Limita a 8 células listadas pra não explodir o JSON.
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
      const checkboxParts = summarizeCheckboxes(s.checkboxes, s.activeEvents);
      if (checkboxParts.length > 0) parts.push(checkboxParts.join(' | '));
      // Frações (numerador/denominador) — evento principal + complementar.
      const p = s.probInputs;
      if (p?.numerator?.value || p?.denominator?.value) {
        parts.push(`P(${p.eventName ?? '?'}) = ${p.numerator?.value || '_'} / ${p.denominator?.value || '_'}`);
      }
      if (p?.hasComplementary && (p?.complementaryNumerator?.value || p?.complementaryDenominator?.value)) {
        parts.push(`P(complementar) = ${p.complementaryNumerator?.value || '_'} / ${p.complementaryDenominator?.value || '_'}`);
      }
      // Select inputs (eventoA / operação / eventoB).
      const sel = s.selectInputs;
      const eA = sel?.eventsA?.value;
      const op = sel?.operations?.value;
      const eB = sel?.eventsB?.value;
      if (eA || op || eB) {
        parts.push(`select: A="${eA || '_'}" op="${op || '_'}" B="${eB || '_'}"`);
      }
      // (Não anexamos `desafio X, passo Y` aqui — quem lê a telemetria
      // já tem o `title`/`descricao` da seção como âncora pedagógica.
      // Numeração interna polui sem agregar.)
      if (parts.length > 0) resolved = parts.join(' | ');
    }
    _createAlert(title, message, type, duration, resolved);
  }, [_createAlert]);

  // Mount inicial: chama startGame() pra montar challenges[0] + game.
  // GUARD anti-StrictMode: sem o ref, o useEffect roda 2x em dev e o
  // segundo startGame zera o restoreSnapshot (que o componente aplica
  // ENTRE os 2 runs do strict). Resultado: F5 voltava sempre pra
  // challenge=0, step=0, checkboxes vazios.
  const didMountStartGameRef = useRef(false);
  useEffect(() => {
    if (didMountStartGameRef.current) return;
    didMountStartGameRef.current = true;
    startGame();
    // Inicialização única no mount; startGame é redefinido a cada render
    // mas só queremos disparar uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snapshot do input atual do aluno — alimenta o wrapper do createAlert.
  // Roda em todo render (sem deps).
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

  // Flag suprimindo detect-and-emit durante restoreSnapshot — sem isso,
  // F5 era interpretado como "aluno digitou/selecionou" e criava exercício
  // fantasma na telemetria.
  const isRestoringSnapshotRef = useRef(false);
  // Change-detection dos SELECTS (evento A / operação / evento B) — cada
  // mudança real vira `interacao_exercicio`. Sem isso, a sequência de
  // experimentação do aluno fica invisível na coleta. Sentinel `null`
  // pula o mount inicial; reset (== reabrir desafio) também não loga.
  const prevSelectsRef = useRef<{ a: string; o: string; b: string } | null>(null);
  useEffect(() => {
    const cur = {
      a: operationSelectInputs?.eventsA?.value ?? '',
      o: operationSelectInputs?.operations?.value ?? '',
      b: operationSelectInputs?.eventsB?.value ?? '',
    };
    const prev = prevSelectsRef.current;
    // Inicializa snapshot SEM logar — primeiro render do desafio.
    if (prev === null) {
      prevSelectsRef.current = cur;
      return;
    }
    // Sem mudança real (mesmo objeto referencial, mas valores idênticos).
    if (prev.a === cur.a && prev.o === cur.o && prev.b === cur.b) return;
    prevSelectsRef.current = cur;
    if (isRestoringSnapshotRef.current) return;
    // Identifica QUAL select mudou pra mensagem ficar específica.
    const changed: string[] = [];
    if (prev.a !== cur.a) changed.push(`Evento A: "${prev.a || '_'}" → "${cur.a || '_'}"`);
    if (prev.o !== cur.o) changed.push(`Operação: "${prev.o || '_'}" → "${cur.o || '_'}"`);
    if (prev.b !== cur.b) changed.push(`Evento B: "${prev.b || '_'}" → "${cur.b || '_'}"`);
    if (changed.length === 0) return;
    telemetryRecordInteracaoExercicio(
      `select ${changed.join(' ; ')}`
    );
  }, [operationSelectInputs, challenge, step]);

  // Change-detection das FRAÇÕES (numerador/denominador). Debounce 600ms
  // pra capturar o valor "final" depois que o aluno termina de digitar
  // (cada keystroke faria spam). Não loga vazio inicial.
  const prevFractionsRef = useRef<{ n: string; d: string; cn: string; cd: string } | null>(null);
  useEffect(() => {
    const cur = {
      n: probabilitiesTextInputs?.numerator?.value ?? '',
      d: probabilitiesTextInputs?.denominator?.value ?? '',
      cn: probabilitiesTextInputs?.complementaryNumerator?.value ?? '',
      cd: probabilitiesTextInputs?.complementaryDenominator?.value ?? '',
    };
    const prev = prevFractionsRef.current;
    if (prev === null) {
      prevFractionsRef.current = cur;
      return;
    }
    if (prev.n === cur.n && prev.d === cur.d && prev.cn === cur.cn && prev.cd === cur.cd) return;
    prevFractionsRef.current = cur;
    if (isRestoringSnapshotRef.current) return;
    const handle = window.setTimeout(() => {
      const parts: string[] = [];
      if (prev.n !== cur.n || prev.d !== cur.d) {
        parts.push(`P principal: ${cur.n || '_'} / ${cur.d || '_'}`);
      }
      if (prev.cn !== cur.cn || prev.cd !== cur.cd) {
        parts.push(`P complementar: ${cur.cn || '_'} / ${cur.cd || '_'}`);
      }
      if (parts.length === 0) return;
      telemetryRecordInteracaoExercicio(
        `digitou fração — ${parts.join(' ; ')}`
      );
    }, 600);
    return () => window.clearTimeout(handle);
  }, [probabilitiesTextInputs, challenge, step]);

  const disabledCheckboxesState = (eventsCheckboxesActual=eventsCheckboxes) => {
    const newState: EventCheckboxes = {...eventsCheckboxesActual};

    Object.keys(newState).forEach((eventName) => {
      for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
        for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
          newState[eventName][diceGreen][diceBlue] = {...newState[eventName][diceGreen][diceBlue], disabled: true };
        }
      }
    });
    setEventsCheckboxes(newState);

    return newState;
  };

  const buildCheckboxesState = (gameActual=game, challengeActual=challenge, stepActual=step, eventsCheckboxesActual=eventsCheckboxes) => {
    const eventsName = gameActual.challenges?.[challengeActual]?.steps?.[stepActual]?.activeEvents.map(event => event.name) ?? [];
    const newState: EventCheckboxes = {...eventsCheckboxesActual};

    eventsName.forEach((eventName) => {
      if(!newState[eventName]) {
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

  const resetEventsCheckboxes = (eventsCheckboxesActual=eventsCheckboxes, preserveDisabledState=true) => {
    const newState: EventCheckboxes = {};

    Object.keys(eventsCheckboxesActual).forEach((eventName) => {
      if(preserveDisabledState && eventsCheckboxesActual?.[eventName]?.[0]?.[0]?.disabled) {
        newState[eventName] = eventsCheckboxesActual[eventName];
      }
      else {
        newState[eventName] = [];
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          newState[eventName][diceGreen] = [];
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newState[eventName][diceGreen].push({checked: false, disabled: false });
          }
        }
      }
    });

    setEventsCheckboxes(newState);
  };

  const updateEventsCheckboxes = (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => {
    // Telemetria — clique do aluno numa célula. Esta função SÓ é
    // chamada por click do usuário (resets sistêmicos usam outros
    // setters via `setEventsCheckboxes` direto). Logamos APÓS o
    // toggle, refletindo o novo estado.
    telemetryRecordInteracaoExercicio(
      `${checked ? 'marcou' : 'desmarcou'} célula (verde=${diceGreen}, azul=${diceBlue}) do evento "${eventName}"`
    );
    setEventsCheckboxes(prev => {
      const updated = { ...prev };
      updated[eventName][diceGreen-1][diceBlue-1] = {
        checked: checked,
        disabled: disabled
      };
      return updated;
    });
  };

  const resetProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs({} as ProbabilitiesTextInputs);
  }

  const buildProbabilities = (eventName : string, hasComplementary: boolean, initialValues?: { num?: string; den?: string; compNum?: string; compDen?: string }) => {
    const probabilitiesTextInputsAux: ProbabilitiesTextInputs  = {
      eventName: eventName,
      hasComplementary: hasComplementary,
      numerator: {
        value: initialValues?.num ?? "",
        disabled: false,
        error: false,
      },
      denominator: {
        value: initialValues?.den ?? "",
        disabled: false,
        error: false,
      },
      complementaryNumerator: {
        value: initialValues?.compNum ?? "",
        disabled: false,
        error: false,
      },
      complementaryDenominator: {
        value: initialValues?.compDen ?? "",
        disabled: false,
        error: false,
      },
    };

    probabilitiesTextInputsAux.numerator.setValue = (value: string) => {
      setProbabilitiesTextInputs(prev => (
        {
          ...prev,
          numerator: {
            ...prev.numerator,
            value: value,
          },
        }
      ));
    };

    probabilitiesTextInputsAux.denominator.setValue = (value: string) => {
      setProbabilitiesTextInputs(prev => (
        {
          ...prev,
          denominator: {
            ...prev.denominator,
            value: value,
          },
        }
      ));
    }

    if (probabilitiesTextInputsAux.complementaryNumerator) {
      probabilitiesTextInputsAux.complementaryNumerator.setValue = (value: string) => {
        setProbabilitiesTextInputs(prev => (
          {
            ...prev,
            complementaryNumerator: {
              ...prev.complementaryNumerator,
              value: value,
            },
          }
        ));
      };
    }

    if (probabilitiesTextInputsAux.complementaryDenominator) {
      probabilitiesTextInputsAux.complementaryDenominator.setValue = (value: string) => {
        setProbabilitiesTextInputs(prev => (
          {
            ...prev,
            complementaryDenominator: {
              ...prev.complementaryDenominator,
              value: value,
            },
          }
        ));
      };
    }

    setProbabilitiesTextInputs(probabilitiesTextInputsAux);
  }

  const disabledProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs(prev => (
      { 
        ...prev,
        numerator: {
          ...prev.numerator,
          error: false,
          disabled: true,
        },
        denominator: {
          ...prev.denominator,
          error: false,
          disabled: true,
        },
        complementaryNumerator: {
          ...prev.complementaryNumerator,
          error: false,
          disabled: true,
        },
        complementaryDenominator: {
          ...prev.complementaryDenominator,
          error: false,
          disabled: true,
        },
      }
    ));
  }

  const addErrorProbabilitiesTextInputs = () => {
    setProbabilitiesTextInputs(prev => (
      { 
        ...prev,
        numerator: {
          ...prev.numerator,
          error: true,
        },
        denominator: {
          ...prev.denominator,
          error: true,
        },
        complementaryNumerator: {
          ...prev.complementaryNumerator,
          error: true,
        },
        complementaryDenominator: {
          ...prev.complementaryDenominator,
          error: true,
        },
      }
    ));
  }

  const resetOperationSelectInputs = () => {
    setOperationSelectInputs({} as OperationSelectInputs);
  }

  const buildOperationSelectInputs = (events: string[], operations: {value: string, label: string}[], initialValues?: { a?: string; o?: string; b?: string }) => {
    const operationSelectInputsAux: OperationSelectInputs = {
      eventsA: {
        disabled: false,
        value: initialValues?.a ?? " ",
        error: false,
        setValue: (value) => {
          setOperationSelectInputs(prev => (
            {
              ...prev,
              eventsA : {
                ...prev.eventsA,
                value: value
              }
            }
          ))
        },
        options: events.map(event => ({ value: event, label: event })),
      },
      operations: {
        disabled: false,
        value: initialValues?.o ?? " ",
        error: false,
        setValue: (value) => {
          setOperationSelectInputs(prev => (
            {
              ...prev,
              operations : {
                ...prev.operations,
                value: value
              }
            }
          ))
        },
        options: operations.map(operation => ({ value: operation.value, label: operation.label })),
      },
      eventsB: {
        disabled: false,
        value: initialValues?.b ?? " ",
        error: false,
        setValue: (value) => {
          setOperationSelectInputs(prev => (
            {
              ...prev,
              eventsB : {
                ...prev.eventsB,
                value: value
              }
            }
          ))
        },
        options: events.map(event => ({ value: event, label: event })),
      },
    }

    setOperationSelectInputs(operationSelectInputsAux);
  }

  const disabledOperationSelectInputs = () => {

    if(operationSelectInputs?.eventsA) {
      setOperationSelectInputs(prev => ({
        ...prev,
        eventsA: {
          ...prev.eventsA,
          error: false,
          disabled: true
        },
        operations: {
          ...prev.operations,
          error: false,

          disabled: true
        },
        eventsB: {
          ...prev.eventsB,
          error: false,
          disabled: true
        }
      }));
    }
  }

  const addErrorOperationSelectInputs = () => {
    if(operationSelectInputs?.eventsA) {
      setOperationSelectInputs(prev => ({
        ...prev,
        eventsA: {
          ...prev.eventsA,
          error: true
        },
        operations: {
          ...prev.operations,
          error: true
        },
        eventsB: {
          ...prev.eventsB,
          error: true
        }
      }));
    }
  }

  const isGameOver = () => {
    return (game.challenges?.length - 1) === challenge && (game.challenges?.[challenge]?.steps?.length - 1) === step;
  }

  const verifyCheckboxSolution = () => {
    const activeEvents = game.challenges?.[challenge]?.steps?.[step]?.activeEvents;
    const checkboxes = eventsCheckboxes;

    return activeEvents.every((event) => {
      for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
        for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
          if(event.validation(diceGreen+1, diceBlue+1) != checkboxes[event.name][diceGreen][diceBlue].checked) {
            return false;
          }
        }
      }

      return true;
    });
  }

  const verifyProbabilityAndProbabilityComplementary = () => {
    const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    let eventOccurrences = 0;
    
    for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
      for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
        if(eventToProbability?.validation(diceGreen+1, diceBlue+1)) {
          eventOccurrences += 1;
        }
      }
    }
    const probabilityOfEventOccurring = eventOccurrences / sampleSpace;
    const probabilityOfComplementaryEventOccurring =  1 - probabilityOfEventOccurring;

    if((parseInt(probabilitiesTextInputs.numerator.value as string) / parseInt(probabilitiesTextInputs.denominator.value as string)).toFixed(2) == probabilityOfEventOccurring.toFixed(2) &&
      (parseInt(probabilitiesTextInputs.complementaryNumerator?.value as string) / parseInt(probabilitiesTextInputs.complementaryDenominator?.value as string)).toFixed(2) == probabilityOfComplementaryEventOccurring.toFixed(2)
    ) {
      return true;
    }

    return false;
  }

  const verifyProbability = () => {
    const eventToProbability = game.challenges?.[challenge]?.steps?.[step]?.eventToProbability;
    const sampleSpace = MAXIMUM_VALUE_DICE * MAXIMUM_VALUE_DICE;
    let eventOccurrences = 0;
    
    for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
      for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
        if(eventToProbability?.validation(diceGreen+1, diceBlue+1)) {
          eventOccurrences += 1;
        }
      }
    }

    const probabilityOfEventOccurring = eventOccurrences / sampleSpace;

    if(parseInt(probabilitiesTextInputs.numerator.value as string) / parseInt(probabilitiesTextInputs.denominator.value as string) == probabilityOfEventOccurring) {
      return true;
    }

    return false;
  }

  const verifySelectOperation = () => {
    const operation = game.challenges?.[challenge]?.steps?.[step]?.operation;

    switch(operation) {
      case "Union": 
        if(operationSelectInputs.operations.value == "Union") {
          if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B") ||
            (operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A")
          ) {
            return true;
          }
        }
        break;
  
      case "Intersection":
        if(operationSelectInputs.operations.value == "Intersection") {
          if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B") ||
            (operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A")
          ) {
            return true;
          }
        }
  
        if(operationSelectInputs.operations.value == "Difference") {
          if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B\u0305") ||
            (operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A\u0305")
          ) {
            return true;
          }
        }

        break;
      case "Difference":  
        if(operationSelectInputs.operations.value == "Intersection") {
          if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B\u0305") ||
            (operationSelectInputs.eventsA.value == "B\u0305" && operationSelectInputs.eventsB.value == "A")
          ) {
            return true;
          }
        }
  
        if(operationSelectInputs.operations.value == "Difference") {
          if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B")
          ) {
            return true;
          }
        }

        break;

      case "ReverseDifference":
        if(operationSelectInputs.operations.value == "Intersection") {
          if((operationSelectInputs.eventsA.value == "A\u0305" && operationSelectInputs.eventsB.value == "B") ||
            (operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A\u0305")
          ) {
            return true;
          }
        }
  
        if(operationSelectInputs.operations.value == "Difference") {
          if((operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A")
          ) {
            return true;
          }
        }
    }
    return false;
  }

  const checkSolution = () => {
    switch (game.challenges?.[challenge]?.steps?.[step]?.checkType) {
      case "checkbox":
        return verifyCheckboxSolution();
      case "probability-and-complementary-probability":
        return verifyProbabilityAndProbabilityComplementary();
      case "probability":
        return verifyProbability();
      case "select":
        return verifySelectOperation();
    }
  };

  const finishedTheChallenge = () => {
    const nextStep = step + 1;
    return nextStep >= game.challenges?.[challenge]?.steps.length
  }

  const nextStep = () => {
    const nextStep = step + 1;
    if (nextStep < game.challenges?.[challenge]?.steps.length) {

      let newEventsCheckboxes = {...eventsCheckboxes};

      if(getCheckTypeByChallengeAndStep(challenge, step) == "checkbox") {
        newEventsCheckboxes = disabledCheckboxesState();
      }

      if(getCheckTypeByChallengeAndStep(challenge, nextStep) === "checkbox") {
        buildCheckboxesState(game, challenge, nextStep, newEventsCheckboxes);
      }

      if(getCheckTypeByChallengeAndStep(challenge, step) === "probability-and-complementary-probability" || getCheckTypeByChallengeAndStep(challenge, step) === "probability" ) {
        disabledProbabilitiesTextInputs();
      } 

      if(getCheckTypeByChallengeAndStep(challenge, nextStep) === "probability-and-complementary-probability" || getCheckTypeByChallengeAndStep(challenge, nextStep) === "probability" ) {
        buildProbabilities(game.challenges?.[challenge]?.steps?.[nextStep]?.eventToProbability?.name ?? '', game.challenges?.[challenge]?.steps?.[nextStep]?.hasComplementary ?? false);
      } 

      if(getCheckTypeByChallengeAndStep(challenge, step) == "select") {
        disabledOperationSelectInputs();
      }

      if(getCheckTypeByChallengeAndStep(challenge, nextStep) == "select") {
        buildOperationSelectInputs(
          game.challenges?.[challenge]?.steps?.[nextStep]?.eventsForSelect ?? [],
          game.challenges?.[challenge]?.steps?.[nextStep]?.operations ?? []
        )
      }

      setStep(nextStep);
      setActiveEvents(game.challenges?.[challenge]?.steps?.[nextStep]?.activeEvents);
      setInstructions(game.challenges?.[challenge]?.steps?.[nextStep]?.instructions);

      return game.challenges?.[challenge]?.steps?.[nextStep]?.checkType;
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

  const dicesChecksClearOnClick = () => { 
    updateModal({
        title: "Limpando marcações", 
        description:"Você gostaria de limpar as marcações da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          createAlert("Dados limpos", "Todas as marcações foram limpas", "info");
          playSound("/sounds/clear.mp3");
          resetEventsCheckboxes(eventsCheckboxes, true);
        }
    });
  }

  // Scroll suave para o topo da seção dos dois dados após resposta.
  // Aceita os dois ids possíveis do wrapper: `dois-dados` (rota
  // standalone /ensino/probabilidade/dois-dados — `TwoDicesSection`)
  // e `seq-dois-dados` (sequência didática — `page.tsx`). Sem essa
  // tolerância, o scroll silenciosamente não acontecia dentro da
  // sequência e o aluno ficava sem âncora visual após acertar.
  const goToTopOfChallenge = () => {
    requestAnimationFrame(() => {
      // Fallback chain de IDs — ordem importa:
      //   1) "dois-dados": ID da rota standalone do OVA (TwoDicesSection)
      //   2) "apresentacao-dado": Grid raiz do OVA quando renderizado dentro
      //      da Sequência Didática (TwoDicesPresentation) — sem este
      //      fallback, Ex6/Ex7/Ex8 dentro da sequência caíam pro outer
      //      "seq-dois-dados" que rolava pra antes do header do OVA
      //   3) "seq-dois-dados": Grid da página da sequência didática (último
      //      recurso — só usado se os dois anteriores não existirem)
      const target =
        document.getElementById("dois-dados") ??
        document.getElementById("apresentacao-dado") ??
        document.getElementById("seq-dois-dados");
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const getCheckTypeByChallengeAndStep = (challenge: number, step: number,) => {
    return game.challenges?.[challenge].steps?.[step].checkType;
  }

  const checkOnClick = () => {
    const ok = checkSolution();
    // Instrumentação de log — `stepKind` = checkType para o Ex7/cena 1.
    // Atende o requisito REQ-3 do framework DSR (validação longitudinal).
    logAttempt(
      'twoDicesGame',
      `c${challenge}-s${step}`,
      !!ok,
      getCheckTypeByChallengeAndStep(challenge, step),
    );
    if(ok) {
      if(isGameOver()) {
        createAlert("Parabéns!", "Você acertou! Parabéns por finalizar todos os desafios!", "success", 5000);
        playSound("/sounds/gameFinished.mp3");

        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, você finalizou todos os desafios!</p>");
        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(true);
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();

      } else if(finishedTheChallenge()) {
        createAlert("Parabéns!", "Você acertou! Passe para o próximo desafio.", "success", 5000);
        playSound("/sounds/challengeFinished.mp3");

        setDisabledCheckButton(true);
        setDisabledClearButton(true);
        setDisabledNextStepButton(false);
        setInstructions("<p className='ds-body-bold text-feedback-success-dark text-center'>Parabéns, passe para o próximo desafio!</p>");
        disabledProbabilitiesTextInputs();
        disabledOperationSelectInputs();
        disabledCheckboxesState();
      }
      else {
        createAlert("Parabéns!", "Você acertou!", "success", 5000);
        playSound("/sounds/correct.mp3");
        goToNextStepOnClick();
      }
    }
    else {
      createAlert("Ops!", "Você errou, tente novamente!", "error", 4000);
      playSound("/sounds/incorrect.mp3");
      
      if(getCheckTypeByChallengeAndStep(challenge, step) === "select") {
        addErrorOperationSelectInputs();
      }

      if(getCheckTypeByChallengeAndStep(challenge, step) === "probability" || getCheckTypeByChallengeAndStep(challenge, step) === "probability-and-complementary-probability") {
        addErrorProbabilitiesTextInputs();
      }
    }

    goToTopOfChallenge();
  }

  const goToNextStepOnClick = () => {
    setDisabledCheckButton(false);
    setDisabledNextStepButton(true);

    const checkType = nextStep();
    if(checkType === "checkbox") {
      setDisabledClearButton(false);
    } else {
      setDisabledClearButton(true);
    }

    goToTopOfChallenge();
  }

  const resetGameOnClick = () => {
    updateModal({
        title: "Reiniciando o jogo", 
        description:"Você gostaria de reiniciar o jogo?", 
        status: "show",
        confirmCallback: () => {
          createAlert("Jogo reiniciado", "O jogo foi reiniciado", "info");
          playSound("/sounds/clear.mp3");
          startGame();
          setDisabledCheckButton(false);
          setDisabledNextStepButton(true);
          setDisabledClearButton(false);
          goToTopOfChallenge();
        }
    });
  }

  /* ──────────────────────────────────────────────────────────────
     markAllOnClick — adicionado para o Ex7 (Exercícios de Fixação).
     Marca todas as 36 células dos eventos ATIVOS (não-disabled) do
     step atual. Eventos congelados (disabled=true após validação
     de step anterior) NUNCA são tocados — guarda célula a célula.
     Uso ergonômico para eventos com cardinalidade alta (n>15):
     marca tudo e o estudante desmarca os que não satisfazem.
     Adição é puramente aditiva — preserva todo comportamento atual.
     ──────────────────────────────────────────────────────────── */
  const markAllOnClick = () => {
    // Loga — registra que o botão foi acionado nesta sub-fase.
    // Como o Ex7 não diferencia A/B/D explicitamente nos steps, marca 'all'.
    logMarkAllUsed('twoDicesGame', `c${challenge}-s${step}`, 'all');
    setEventsCheckboxes((prev) => {
      const next: EventCheckboxes = { ...prev };
      Object.keys(next).forEach((eventName) => {
        const grid = next[eventName];
        if (!grid?.[0]?.[0]) return;
        // Pula evento inteiramente congelado (disabled na primeira célula).
        if (grid[0][0].disabled) return;
        next[eventName] = grid.map((row) =>
          row.map((cell) => (cell.disabled ? cell : { ...cell, checked: true })),
        );
      });
      return next;
    });
    playSound('/sounds/clear.mp3');
    createAlert(
      'Todas as células marcadas',
      'Agora desmarque as células que NÃO satisfazem o evento.',
      'info',
      4000,
    );
  };

  const startGame = () => {
    setChallenge(0);
    setStep(0);
    // Gera novas ordens e persiste — F5 vai restaurar este mesmo shuffle.
    const newEventsOrder = randomOrder(events.length);
    const newOperationsOrder = randomOrder(operations.length);
    setEventsOrder(newEventsOrder);
    setOperationsOrder(newOperationsOrder);
    const newGame = getNewGame(applyOrder(events, newEventsOrder), applyOrder(operations, newOperationsOrder));
    setGame(newGame);
    resetEventsCheckboxes({}, false);
    resetProbabilitiesTextInputs();
    resetOperationSelectInputs();
    buildCheckboxesState(newGame, 0, 0, {});
    setActiveEvents(newGame.challenges?.[0]?.steps?.[0]?.activeEvents);
    setInstructions(newGame.challenges?.[0]?.steps?.[0]?.instructions);
  }

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
    /** Marca todas as 36 células dos eventos ATIVOS do step atual.
     *  Eventos congelados (disabled após validação) não são tocados.
     *  Disponibilizado opcionalmente — TwoDicesGame só renderiza o botão
     *  quando recebe a prop `enableMarkAll`. Seção introdutória do OVA
     *  permanece inalterada (não passa a prop). */
    markAllOnClick,
    // Expostos pra que o componente possa usar como discriminadores
    // de "tela atual" na telemetria (id da seção muda quando mudam).
    challenge,
    step,
    // Restauração pós-F5 — chamado pelo TwoDicesGame via setCurrentPhaseId.
    // Restaura challenge/step + marcações + VALUES dos inputs com closures
    // (probabilitiesTextInputs/operationSelectInputs). Os inputs em si têm
    // `setValue` em closure que não sobrevive a JSON.stringify, mas os
    // strings de value sim — chamamos buildProbabilities/buildOperationSelectInputs
    // pra recriar as closures, passando os values restaurados.
    restoreSnapshot: (snap: {
      challenge?: number;
      step?: number;
      eventsCheckboxes?: EventCheckboxes;
      eventsOrder?: number[];
      operationsOrder?: number[];
      probValues?: { num?: string; den?: string; compNum?: string; compDen?: string };
      selectValues?: { a?: string; o?: string; b?: string };
      disabledCheckButton?: boolean;
      disabledNextStepButton?: boolean;
      disabledClearButton?: boolean;
      probInputsDisabled?: boolean;
      selectInputsDisabled?: boolean;
    }) => {
      // Suprime detect-and-emit dos useEffects de change-detection
      // durante a janela do restore — F5 não conta como digitação.
      isRestoringSnapshotRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => { isRestoringSnapshotRef.current = false; }, 700);
        });
      });
      // Restaura ordens ANTES de challenge/step — re-deriva o `game`
      // pra que challenges[challenge] mostre o MESMO desafio que o
      // aluno estava vendo antes do F5 (e não um sorteio novo).
      let restoredEventsOrder: number[] | null = null;
      let restoredOperationsOrder: number[] | null = null;
      if (Array.isArray(snap.eventsOrder) && snap.eventsOrder.every(n => typeof n === 'number')) {
        restoredEventsOrder = snap.eventsOrder;
        setEventsOrder(snap.eventsOrder);
      }
      if (Array.isArray(snap.operationsOrder) && snap.operationsOrder.every(n => typeof n === 'number')) {
        restoredOperationsOrder = snap.operationsOrder;
        setOperationsOrder(snap.operationsOrder);
      }
      // Computa o game restaurado inline (state ainda não atualizou) pra
      // poder ler stepConfig dele abaixo.
      const restoredGame = (restoredEventsOrder || restoredOperationsOrder)
        ? getNewGame(applyOrder(events, restoredEventsOrder ?? eventsOrder), applyOrder(operations, restoredOperationsOrder ?? operationsOrder))
        : game;
      if (restoredEventsOrder || restoredOperationsOrder) {
        setGame(restoredGame);
      }
      if (typeof snap.challenge === 'number') setChallenge(snap.challenge);
      if (typeof snap.step === 'number') setStep(snap.step);
      if (snap.eventsCheckboxes && typeof snap.eventsCheckboxes === 'object') setEventsCheckboxes(snap.eventsCheckboxes);

      // Restaura values dos inputs (closures recriadas a partir do step
      // atual). Sem isso, aluno perdia digitação parcial em P(A)=?/?
      // ou em selects de evento/operação após F5.
      const challengeIdx = snap.challenge ?? challenge;
      const stepIdx = snap.step ?? step;
      const stepConfig = restoredGame.challenges?.[challengeIdx]?.steps?.[stepIdx];
      if (snap.probValues && stepConfig?.eventToProbability) {
        buildProbabilities(
          stepConfig.eventToProbability.name ?? '',
          stepConfig.hasComplementary ?? false,
          snap.probValues,
        );
        if (snap.probInputsDisabled) disabledProbabilitiesTextInputs();
      }
      if (snap.selectValues && stepConfig?.activeEvents && stepConfig?.operation !== undefined) {
        const eventNames = stepConfig.activeEvents.map((e: Event) => e.name ?? '');
        const operations = stepConfig.operation
          ? [{ value: stepConfig.operation as string, label: stepConfig.operation as string }]
          : [];
        buildOperationSelectInputs(eventNames, operations, snap.selectValues);
        if (snap.selectInputsDisabled) disabledOperationSelectInputs();
      }

      // Botões — sem isso, F5 após acerto VOLTA o "Próximo Desafio" pra
      // disabled e os inputs voltam editáveis, parecendo que a validação
      // foi desfeita.
      if (typeof snap.disabledCheckButton === 'boolean') setDisabledCheckButton(snap.disabledCheckButton);
      if (typeof snap.disabledNextStepButton === 'boolean') setDisabledNextStepButton(snap.disabledNextStepButton);
      if (typeof snap.disabledClearButton === 'boolean') setDisabledClearButton(snap.disabledClearButton);
    },
    // Snapshot serializável pro getCurrentPhaseId — inclui ordens pra
    // reconstruir o `game` idêntico após F5 + VALUES dos inputs (strings
    // extraídas dos objetos com closures).
    snapshotData: {
      challenge, step, eventsCheckboxes, eventsOrder, operationsOrder,
      probValues: {
        num: probabilitiesTextInputs?.numerator?.value ?? '',
        den: probabilitiesTextInputs?.denominator?.value ?? '',
        compNum: probabilitiesTextInputs?.complementaryNumerator?.value ?? '',
        compDen: probabilitiesTextInputs?.complementaryDenominator?.value ?? '',
      },
      selectValues: {
        a: operationSelectInputs?.eventsA?.value ?? '',
        o: operationSelectInputs?.operations?.value ?? '',
        b: operationSelectInputs?.eventsB?.value ?? '',
      },
      disabledCheckButton,
      disabledNextStepButton,
      disabledClearButton,
      probInputsDisabled: probabilitiesTextInputs?.numerator?.disabled ?? false,
      selectInputsDisabled: operationSelectInputs?.eventsA?.disabled ?? false,
    },
  };
};
