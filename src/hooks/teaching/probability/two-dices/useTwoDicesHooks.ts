import { CheckboxInterface } from '@/components/global/Checkbox';
import { TextInputInterface } from '@/components/global/TextInput';
import { SelectInputInterface } from '@/components/global/SelectInput';
import { useState, useEffect} from 'react';

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

const isPrime = (num: number): boolean => {
  return [2, 3, 5].includes(num);
};

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
    complementaryDescription: "Todas as faces são pares",
    validation: (greenDice, blueDice) => greenDice % 2 === 1 && blueDice % 2 === 1,
  },
];

const operations = ["Intersection", "Union", "Difference", "ReverseDifference"] as Operation[];

const getValidationOfOperation = (operation: Operation, validation1 : (greenDice: number, blueDice : number) => boolean, validation2: (greenDice: number, blueDice : number) => boolean) => {
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

const getDescriptionOfOperation = (operation: Operation, eventA: Event, eventB: Event) => {
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

const getGame = (scrambledEvents: Event[], operations: Operation[]) => {
  const challenges = [];

  for (let i = 0; i < 2; i++) {
    challenges.push({
      steps: [
        {
          activeEvents: [{ name: "A", ...scrambledEvents[i] }],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao evento.
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

  for (let i = 2, j = 0; i < scrambledEvents.length; i += 2, j++) {
    const A = scrambledEvents[i];
    const B = scrambledEvents[i + 1];
    const operation = operations[j];
    const D = {
      name: "D",
      description: getDescriptionOfOperation(operation, A, B),
      complementaryDescription: "",
      validation: getValidationOfOperation(operation, A.validation, B.validation)
    };

    challenges.push({
      steps: [
        {
          activeEvents: [{ name: "A", ...A }, { name: "B", ...B }],
          checkType: "checkbox",
          instructions: `<p className="ds-body">
            Veja a definição dos eventos <strong>A</strong> e <strong>B</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes aos eventos.
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


const MAXIMUM_VALUE_DICE = 6;

export const useTwoDicesHooks = () => {
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [challenge, setChallenge] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [scrambledEvents, setScrambledEvents] = useState<Event[]>(shuffleArray<Event>(events));
  const [probabilitiesTextInputs, setProbabilitiesTextInputs] = useState<ProbabilitiesTextInputs>({} as ProbabilitiesTextInputs);
  const [operationSelectInputs, setOperationSelectInputs] = useState<OperationSelectInputs>({} as OperationSelectInputs)

  const [game, setGame] = useState(getGame(scrambledEvents, shuffleArray<Operation>(operations)));

  const buildCheckboxesState = (challengeNumber = challenge, stepNumber = step) => {
    const eventsName = game.challenges?.[challengeNumber]?.steps?.[stepNumber]?.activeEvents.map(event => event.name) ?? [];
    const newState: EventCheckboxes = eventsCheckboxes;

    eventsName.forEach((eventName) => {
      if(!newState[eventName]) {
        newState[eventName] = [];
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          newState[eventName][diceGreen] = [];
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newState[eventName][diceGreen].push({ checked: false, disabled: false });
          }
        }
      } else {
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newState[eventName][diceGreen][diceBlue].disabled = true;
          }
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const resetEventsCheckboxes = (challengeNumber=challenge, stepNumber=step, igonoreDisableState=true) => {
    const eventsName = game.challenges?.[challengeNumber]?.steps?.[stepNumber]?.activeEvents.map(event => event.name) ?? [];
    const newState: EventCheckboxes = {};

    eventsName.forEach((eventName) => {
      if(igonoreDisableState && eventsCheckboxes?.[eventName]?.[0]?.[0]?.disabled) {
        newState[eventName] = eventsCheckboxes[eventName];
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

  const buildProbabilities = (eventName : string, hasComplementary: boolean) => {
    const probabilitiesTextInputsAux: ProbabilitiesTextInputs  = {
      eventName: eventName,
      hasComplementary: hasComplementary,
      numerator: {
        value: "",
        disabled: false,
        error: false,
      },
      denominator: {
        value: "",
        disabled: false,
        error: false,
      },
      complementaryNumerator: {
        value: "",
        disabled: false,
        error: false,
      },
      complementaryDenominator: {
        value: "",
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
          disabled: true,
        },
        denominator: {
          ...prev.denominator,
          disabled: true,
        },
        complementaryNumerator: {
          ...prev.complementaryNumerator,
          disabled: true,
        },
        complementaryDenominator: {
          ...prev.complementaryDenominator,
          disabled: true,
        },
      }
    ));
  }

  const resetOperationSelectInputs = () => {
    setOperationSelectInputs({} as OperationSelectInputs);
  }

  const buildOperationSelectInputs = (events: string[], operations: {value: string, label: string}[]) => {
    const operationSelectInputsAux: OperationSelectInputs = {
      eventsA: {
        disabled: false,
        value: " ",
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
        value: " ",
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
        value: " ",
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
          disabled: true
        },
        operations: {
          ...prev.operations,
          disabled: true
        },
        eventsB: {
          ...prev.eventsB,
          disabled: true
        }
      }));
    }
  }
  
  const resetGame = () => {
    setScrambledEvents(shuffleArray(events));
  };

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

    if(operation == "Union") {
      if(operationSelectInputs.operations.value == "Union") {
        if((operationSelectInputs.eventsA.value == "A" && operationSelectInputs.eventsB.value == "B") ||
          (operationSelectInputs.eventsA.value == "B" && operationSelectInputs.eventsB.value == "A")
        ) {
          return true;
        }
      }
    }

    if(operation == "Intersection") {
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
    }

    if(operation == "Difference") {
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
    }

    if(operation == "ReverseDifference") {
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

  const getTypeOfVerify = () => {
    return game.challenges?.[challenge]?.steps?.[step]?.checkType;
  }

  const nextChallenge = () => {
    const nextStep = step + 1;
    if (nextStep < game.challenges?.[challenge]?.steps.length) {
      setStep(nextStep);
      setActiveEvents(game.challenges?.[challenge]?.steps?.[nextStep]?.activeEvents);
      setInstructions(game.challenges?.[challenge]?.steps?.[nextStep]?.instructions);
      buildCheckboxesState(challenge, nextStep);

      if(game.challenges?.[challenge]?.steps?.[nextStep]?.eventToProbability) {
        buildProbabilities(game.challenges?.[challenge]?.steps?.[nextStep]?.eventToProbability.name, game.challenges?.[challenge]?.steps?.[nextStep]?.hasComplementary);
      } 

      if(game.challenges?.[challenge]?.steps?.[nextStep]?.eventsForSelect) {
        buildOperationSelectInputs(
          game.challenges?.[challenge]?.steps?.[nextStep]?.eventsForSelect ?? [],
          game.challenges?.[challenge]?.steps?.[nextStep]?.operations ?? []
        )
      }

      return game.challenges?.[challenge]?.steps?.[nextStep]?.checkType;
    } else {
      const nextChallenge = challenge + 1;
      if (nextChallenge < game.challenges.length) {;
        setActiveEvents(game.challenges?.[nextChallenge]?.steps?.[0]?.activeEvents);
        setInstructions(game.challenges?.[nextChallenge]?.steps?.[0]?.instructions);
        resetEventsCheckboxes(nextChallenge, 0, false);
        if(game.challenges?.[challenge]?.steps?.[step]?.eventToProbability) {
          resetProbabilitiesTextInputs();
        }
        
        if(game.challenges?.[challenge]?.steps?.[step-1]?.eventsForSelect) {
          resetOperationSelectInputs();
        }

        setChallenge(nextChallenge);
        setStep(0);
        
        return game.challenges?.[nextChallenge]?.steps?.[0]?.checkType;
      }
    }
  };

  useEffect(() => {
    setChallenge(0);
    setStep(0);
    setGame(getGame(scrambledEvents, shuffleArray<Operation>(operations)));
  }, [scrambledEvents]);

  useEffect(() => {
    resetEventsCheckboxes(0, 0, false);
    resetProbabilitiesTextInputs();
    resetOperationSelectInputs();
    setActiveEvents(game.challenges?.[0]?.steps?.[0]?.activeEvents);
    setInstructions(game.challenges?.[0]?.steps?.[0]?.instructions);
  }, [game]);

  return {
    eventsCheckboxes,
    buildCheckboxesState,
    updateEventsCheckboxes,
    resetEventsCheckboxes,
    activeEvents,
    instructions,
    setInstructions,
    resetGame,
    checkSolution,
    nextChallenge,
    isGameOver,
    probabilitiesTextInputs,
    operationSelectInputs,
    disabledOperationSelectInputs,
    finishedTheChallenge,
    disabledProbabilitiesTextInputs,
    getTypeOfVerify
  };
};
