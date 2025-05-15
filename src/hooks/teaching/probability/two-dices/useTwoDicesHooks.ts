import { CheckboxInterface } from '@/components/global/Checkbox';
import { useState, useEffect} from 'react';

export interface EventCheckboxes {
  [key: string]: CheckboxInterface[][];
}

export interface Event {
  name?: string;
  description: string;
  complementaryDescription: string;
  validation: (greenDice: number, blueDice:number) => boolean;
}

const isPrime = (num: number): boolean => {
  return [2, 3, 5].includes(num);
};

/*const drawAnInteger = (maxValue: number): number => {
  return Math.floor(Math.random() * maxValue);
}*/

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
    complementaryDescription: "Todas as faces são ímpares",
    validation: (greenDice, blueDice) =>
      (greenDice % 2 === 0 && blueDice % 2 !== 0) || (blueDice % 2 === 0 && greenDice % 2 !== 0),
  },
  {
    description: "Nenhuma face par",
    complementaryDescription: "Todas as faces são pares",
    validation: (greenDice, blueDice) => greenDice % 2 === 1 && blueDice % 2 === 1,
  },
];

const shuffleArray = (events: Event[]) => {
  const newArray = [...events];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getGame = (scrambledEvents: Event[]) => {
  return{
    challenges: [
      {
        steps: [
          {
            activeEvents: [{ name: "A", ...scrambledEvents[0] }],
            checkType: "checkbox",
            instructions: `<p className="ds-body">
              Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao evento.
              Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
            </p>`,
          }
        ],
      },
      {
        steps: [
          {
            activeEvents: [{ name: "A", ...scrambledEvents[1] }],
            checkType: "checkbox",
            instructions: `<p className="ds-body">
              Veja a definição do <strong>Evento A</strong> no <strong>Quadro de Eventos</strong> e selecione os resultados correspondentes ao evento.
              Clique no <strong>Botão Conferir</strong> ao terminar a marcação para conferir sua resposta ou no <strong>Botão Limpar</strong> para recomeçar a marcação. 
            </p>`,
          }
        ],
      },
    ],
  }
}

const MAXIMUM_VALUE_DICE = 6;

export const useTwoDicesHooks = () => {
  const [eventsCheckboxes, setEventsCheckboxes] = useState<EventCheckboxes>({});
  const [challenge, setChallenge] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [scrambledEvents, setScrambledEvents] = useState<Event[]>(shuffleArray(events));

  const [game, setGame] = useState(getGame(scrambledEvents));

  const buildCheckboxesState = () => {
    const eventsName = game.challenges?.[challenge]?.steps?.[step]?.activeEvents.map(event => event.name) ?? [];
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
      }
    });
    setEventsCheckboxes(newState);
  };

  const resetEventsCheckboxes = () => {
    const eventsName = game.challenges?.[challenge]?.steps?.[step]?.activeEvents.map(event => event.name) ?? [];
    const newState: EventCheckboxes = {};

    eventsName.forEach((eventName) => {
      newState[eventName] = [];
      for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
        newState[eventName][diceGreen] = [];
        for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
          newState[eventName][diceGreen].push({checked: false, disabled: false });
        }
      }
    });
    setEventsCheckboxes(newState);
  };

  const disabledEventsCheckboxes = () => {    
    setEventsCheckboxes((prev) => {
      const newEventsCheckboxes: EventCheckboxes = {};

      for (const [eventName, checkboxes] of Object.entries(prev)) {
        newEventsCheckboxes[eventName] = [];
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          newEventsCheckboxes[eventName][diceGreen] = [];
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            newEventsCheckboxes[eventName][diceGreen][diceBlue] = {...checkboxes[diceGreen][diceBlue], disabled: true };
          }
        }
      }
      return newEventsCheckboxes;
    });
  }

  useEffect(() => {console.log("pos atulizacao", eventsCheckboxes)}, [eventsCheckboxes]);

  const updateEventsCheckboxes = (eventName: string, diceGreen: number, diceBlue: number, checked: boolean, disabled: boolean) => {
    console.log(eventName, diceGreen, diceBlue, checked, disabled);
    setEventsCheckboxes(prev => {
      const updated = { ...prev };
      updated[eventName][diceGreen-1][diceBlue-1] = {
        checked: checked,
        disabled: disabled
      };
      return updated;
    });
  };

  const resetGame = () => {
    setScrambledEvents(shuffleArray(events));
  };

  const isGameOver = () => {
    console.log("gameFinished", game.challenges?.length, challenge, game.challenges?.[challenge]?.steps?.length, step);
    return (game.challenges?.length - 1) === challenge && (game.challenges?.[challenge]?.steps?.length - 1) === step;
  }

  const checkSolution = () => {
    if (game.challenges?.[challenge]?.steps?.[step]?.checkType === "checkbox") {
      const activeEvents = game.challenges?.[challenge]?.steps?.[step]?.activeEvents;
      const checkboxes = eventsCheckboxes;

      return activeEvents.every((event) => {
        for (let diceGreen = 0; diceGreen < MAXIMUM_VALUE_DICE; diceGreen++) {
          for (let diceBlue = 0; diceBlue < MAXIMUM_VALUE_DICE; diceBlue++) {
            console.log(diceGreen+1, diceBlue+1, event.validation(diceGreen+1, diceBlue+1), checkboxes[event.name][diceGreen][diceBlue].checked, event.validation, activeEvents);

            if(event.validation(diceGreen+1, diceBlue+1) != checkboxes[event.name][diceGreen][diceBlue].checked) {
              return false;
            }
          }
        }

        return true;
      });
    }
  };

  const nextChallenge = () => {
    const nextStep = step + 1;
    if (nextStep < game.challenges?.[challenge]?.steps.length) {
      setStep(nextStep);
      setActiveEvents(game.challenges?.[challenge]?.steps?.[nextStep]?.activeEvents);
      setInstructions(game.challenges?.[challenge]?.steps?.[nextStep]?.instructions);
      buildCheckboxesState();
    } else {
      const nextChallenge = challenge + 1;
      if (nextChallenge < game.challenges.length) {
        setChallenge(nextChallenge);
        setStep(0);
        setActiveEvents(game.challenges?.[nextChallenge]?.steps?.[0]?.activeEvents);
        setInstructions(game.challenges?.[nextChallenge]?.steps?.[0]?.instructions);
        resetEventsCheckboxes();
      }
    }
  };

  useEffect(() => {
    setChallenge(0);
    setStep(0);
    resetEventsCheckboxes();
    setGame(getGame(scrambledEvents));
    console.log("vim por aqui");
  }, [scrambledEvents]);

  useEffect(() => {
    setActiveEvents(game.challenges?.[0]?.steps?.[0]?.activeEvents);
    setInstructions(game.challenges?.[0]?.steps?.[0]?.instructions);
  }, [game]);

  return {
    eventsCheckboxes,
    updateEventsCheckboxes,
    resetEventsCheckboxes,
    disabledEventsCheckboxes,
    activeEvents,
    instructions,
    setInstructions,
    resetGame,
    checkSolution,
    nextChallenge,
    isGameOver
  };
};
