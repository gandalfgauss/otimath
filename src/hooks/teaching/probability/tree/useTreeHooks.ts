'use client'

import { useState, useEffect, useCallback, useRef} from 'react';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';

type CheckType = "Tree" | "Probability";

interface Event {
  description: string;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  error?: boolean;
  inputIsFocused?: boolean;
  inputHelperText?: string;
}
interface EventTree {
  event: Event;
  probabilityOfOccurring: number;
  parentEventTree?: EventTree;
  childrenEventsTree?: EventTree[];
  level: number;
  show?: boolean;
}

interface Problem {
  description: string;
  eventsTree: EventTree[];
  eventOptions: Event[]; 
}

interface CheckTree {
  levelsToAssemble?: number[];
  parentEvent?: Event;
}

interface Step {
  instructions: string;
  checkType: CheckType;
  checkTree?: CheckTree;
}
interface Challenge {
  problem: Problem;
  steps: Step[];
}

interface NextChallengeButton {
  onClick: () => void;
  disabled: boolean;
}

interface CheckButton {
  onClick: () => void;
  disabled: boolean;
}

interface ClearButton {
  onClick: () => void;
  disabled: boolean;
}

interface NewGameButton {
  onClick: () => void;
  disabled: boolean;
}

export interface Game {
  currentStep: number;
  currentChallenge: number;
  challenges: Challenge[];
  nextChallengeButton?: NextChallengeButton;
  checkButton?: CheckButton;
  clearButton?: ClearButton;
  newGameButton?: NewGameButton;
}

const generateRandomPartition = (partsCount: number) => {
  const rawValues = Array.from(
    { length: partsCount },
    () => Math.random() + 0.1
  );

  const rawSum = rawValues.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );

  let normalizedValues = rawValues.map(
    value => value / rawSum
  );

  normalizedValues = normalizedValues.map(
    value => Math.round(value * 100) / 100
  );

  const roundingError = +(
    1 - normalizedValues.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    )
  ).toFixed(2);

  const indexOfLargestValue = normalizedValues.indexOf(
    Math.max(...normalizedValues)
  );

  normalizedValues[indexOfLargestValue] = Number((
    normalizedValues[indexOfLargestValue] + roundingError
  ).toFixed(2));

  return normalizedValues;
}

function gcd(a: number, b: number) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

const simplifyFraction = (numerator: number, denominator: number) => {
  const divisor = gcd(numerator, denominator);

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

function shuffleArray<T>(data: T[]): T[] {
  const newArray = [...data];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function getDuplicatesBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const count = new Map<T[K], number>();

  for (const item of array) {
    count.set(item[key], (count.get(item[key]) ?? 0) + 1);
  }

  return array.filter(item => (count.get(item[key]) ?? 0) > 1);
}

const goToTopOfChallenge = () => {
  requestAnimationFrame(() => {
    document.getElementById("arvore")?.scrollIntoView({ behavior: 'smooth' });
  });
}

const getChallengeOne = (): Challenge => {
  const event1: Event = {
    description: "Feminino",
  };
  const event2: Event = {
    description: "Masculino",
  }
  const event3: Event = {
    description: "Primeiro Ano",
  };
  const event4: Event = {
    description: "Segundo Ano",
  };
  const event5: Event = {
    description: "Terceiro Ano",
  };
  const event6: Event = {
    description: "É aluno",
  };
  const event7: Event = {
    description: "Matutino",
  };
  const event8: Event = {
    description: "Feminino e Masculino",
  };

  const levelOneProbabilities = generateRandomPartition(2);
  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: levelOneProbabilities[0],
    level: 1,
  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: levelOneProbabilities[1],
    level: 1,
  };

  const levelTwoProbabilitiesEvent1 = generateRandomPartition(3);
  const eventTree3 : EventTree = {
    event: event3,
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[0],
    parentEventTree: eventTree1,
    level: 2,
  };
  const eventTree4 : EventTree = {
    event: event4,
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[1],
    parentEventTree: eventTree1,
    level: 2,
  };
  const eventTree5 : EventTree = {
    event: event5,
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[2],
    parentEventTree: eventTree1,
    level: 2,
  };
  eventTree1.childrenEventsTree = [eventTree3, eventTree4, eventTree5];

  const levelTwoProbabilitiesEvent2 = generateRandomPartition(3);
  const eventTree6 : EventTree = {
    event: event3,
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[0],
    parentEventTree: eventTree2,
    level: 2,
  };
  const eventTree7 : EventTree = {
    event: event4,
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[1],
    parentEventTree: eventTree2,
    level: 2,
  };
  const eventTree8 : EventTree = {
    event: event5,
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[2],
    parentEventTree: eventTree2,
    level: 2,
  };
  eventTree2.childrenEventsTree = [eventTree6, eventTree7, eventTree8];

  const problem: Problem = {
    description: `<p className="ds-body">
    Na gincana anual do Colégio Universitário, <strong>${(eventTree1.probabilityOfOccurring*100).toFixed(0)}%</strong> dos alunos presentes são do <strong>sexo feminino.</strong> 
    <br/><strong>Entre as meninas, ${(eventTree3.probabilityOfOccurring*100).toFixed(0)}%</strong> são do <strong>primeiro ano,</strong> <strong>${(eventTree4.probabilityOfOccurring*100).toFixed(0)}%</strong> são do <strong>segundo ano</strong> e <strong>${(eventTree5.probabilityOfOccurring*100).toFixed(0)}%</strong> são do <strong>terceiro ano.</strong> 
    <br/><strong>Entre os meninos</strong>, esses percentuais são <strong>${(eventTree6.probabilityOfOccurring*100).toFixed(0)}%, ${(eventTree7.probabilityOfOccurring*100).toFixed(0)}% e ${(eventTree8.probabilityOfOccurring*100).toFixed(0)}%</strong> respectivamente.
    </p>`,
    eventsTree: [eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6, eventTree7, eventTree8],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4, event5, event6, event7, event8]),
  };

  const stepOne: Step = {
    instructions: `<p className="ds-body"> 
                    Construa a árvore de probabilidade que representa a distribuição dos alunos do Colégio Universitário participantes da gincana anual. 
                    <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> PRIMEIRO NÍVEL</strong> da árvore.
                    <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1],
    },
  };

  const stepTwo: Step = {
    instructions: `<p className="ds-body"> 
                    Construa a árvore de probabilidade que representa a distribuição dos alunos do Colégio Universitário participantes da gincana anual. 
                    <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong>SEGUNDO NÍVEL</strong> da árvore.
                    <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [2],
    },
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne, stepTwo],
  };

  return challenge;
}

const getChallengeTwo = (): Challenge => {
  const event1 : Event = {
    description: "Urna A",
  }

  const event2 : Event = {
    description: "Urna B",
  }

  const event3 : Event = {
    description: "Bola Vermelha",
  }

  const event4 : Event = {
    description: "Bola Preta",
  }

  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: 0.5,
    level: 1,
  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: 0.5,
    level: 1,
  };

  const redBallInUrnA = Math.floor(Math.random() * 19) + 1;
  const blackBallInUrnA = 20 - redBallInUrnA;
  const eventTree3 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((redBallInUrnA / (redBallInUrnA + blackBallInUrnA)).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };
  const eventTree4 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((blackBallInUrnA / (redBallInUrnA + blackBallInUrnA)).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };

  eventTree1.childrenEventsTree = [eventTree3, eventTree4];

  const redBallInUrnB = Math.floor(Math.random() * 20) + 1;
  const blackBallInUrnB = 20 - redBallInUrnB;
  const eventTree5 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((redBallInUrnB / (redBallInUrnB + blackBallInUrnB)).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };
  const eventTree6 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((blackBallInUrnB / (redBallInUrnB + blackBallInUrnB)).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };

  eventTree2.childrenEventsTree = [eventTree5, eventTree6];

  const problem: Problem = {
    description: `<p className="ds-body">
    Em um experimento de Probabilidade, são utilizadas duas urnas, <strong>A e B</strong>, contendo <strong>bolas vermelhas e pretas.</strong>
    <br/> A <strong>urna A</strong> possui <strong>${redBallInUrnA} bola${redBallInUrnA > 1 ? 's' : ''} vermelha${redBallInUrnA > 1 ? 's' : ''}</strong> e <strong>${blackBallInUrnA} bola${blackBallInUrnA > 1 ? 's' : ''} preta${blackBallInUrnA > 1 ? 's' : ''},</strong> 
    enquanto a <strong>urna B</strong> possui <strong>${redBallInUrnB} bola${redBallInUrnB > 1 ? 's' : ''} vermelha${redBallInUrnB > 1 ? 's' : ''}</strong> e <strong>${blackBallInUrnB} bola${blackBallInUrnB > 1 ? 's' : ''} preta${blackBallInUrnB > 1 ? 's' : ''}.</strong>
    <br/> Uma das urnas é escolhida ao acaso e, em seguida, retira-se uma bola da urna escolhida.
    </p>`,
    eventsTree: [eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4]),
  };

  const stepOne: Step = {
    instructions: `<p className="ds-body"> 
                    Construa a árvore de probabilidade que representa a distribuição das bolas nas urnas. 
                    <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong>PRIMEIRO NÍVEL</strong> da árvore.
                    <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1],
    },
  };

  const stepTwo: Step = {
    instructions: `<p className="ds-body"> 
                    Construa a árvore de probabilidade que representa a distribuição das bolas nas urnas. 
                    <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong>SEGUNDO NÍVEL</strong> da árvore.
                    <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [2],
    },
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne, stepTwo],
  };

  return challenge;
}

const getChallengeThree = (): Challenge => {
  const sickAdults = Math.floor(Math.random() * 4) + 1;
  const correctDiagnosis = Math.floor(Math.random() * 4) + 16;
  const incorrectDiagnosis = Math.floor(Math.random() * 3) + 1;

  const event1: Event = {
    description: "Doente",
  };
  const event2: Event = {
    description: "Saudável",
  }
  const event3: Event = {
    description: "Diagnóstico positivo",
  };
  const event4: Event = {
    description: "Diagnóstico negativo",
  };

  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: Number((sickAdults/20).toFixed(2)),
    level: 1,
  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: Number((1 - sickAdults/20).toFixed(2)),
    level: 1,
  };

  const eventTree3 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((correctDiagnosis/20).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };
  const eventTree4 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((1 - correctDiagnosis/20).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };

  eventTree1.childrenEventsTree = [eventTree3, eventTree4];

  const eventTree5 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((incorrectDiagnosis/20).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };
  const eventTree6 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((1 - incorrectDiagnosis/20).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };

  eventTree2.childrenEventsTree = [eventTree5, eventTree6];

  const sickAdultsFraction = simplifyFraction(sickAdults, 20);
  const correctDiagnosisFraction = simplifyFraction(correctDiagnosis, 20);
  const incorrectDiagnosisFraction = simplifyFraction(incorrectDiagnosis, 20);
  
  const problem: Problem = {
    description: `<p className="ds-body">
    Em uma localidade, <strong>${sickAdultsFraction.numerator}/${sickAdultsFraction.denominator}</strong> dos adultos <strong>sofrem de determinada doença</strong>.
    <br/> Um médico local  <strong>diagnostica corretamente ${correctDiagnosisFraction.numerator}/${correctDiagnosisFraction.denominator}</strong> das pessoas que  <strong>têm a doença</strong> 
    e <strong>diagnostica erradamente ${incorrectDiagnosisFraction.numerator}/${incorrectDiagnosisFraction.denominator}</strong> das pessoas que  <strong>não a têm</strong>.
    <br/> Um adulto acaba de ser atendido pelo médico.
    </p>`,
    eventsTree: [eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4]),
  };

  const stepOne: Step = {
    instructions: `<p className="ds-body"> 
                    Construa a árvore de probabilidade que representa a distribuição dos cartões. 
                    <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong>PRIMEIRO E SEGUNDO NÍVEL</strong> da árvore.
                    <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1, 2],
    },
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne],
  };

  return challenge;
}

const getNewGame = (): Game => {
  const challenges: Challenge[] = [];
  challenges.push(getChallengeOne(), getChallengeTwo(), getChallengeThree());
  return { challenges, currentChallenge: 0, currentStep: 0  };
};

export const useTreeHooks = () => {
  const [game, setGame] = useState<Game | null>(null);
  const {alerts, createAlert, updateAlert, deleteAlerts} = useAlerts();
  const {modal, updateModal} = useModal();
  const alertLockRef = useRef(false);

  const getNextStepAndChallenge = useCallback((game: Game) => {
    let nextStep = game.currentStep + 1;
    let nextChallenge = game.currentChallenge;

    if (nextStep >= game.challenges[game.currentChallenge].steps.length) {
      nextStep = 0;

      if (nextChallenge < game.challenges.length - 1) {
        nextChallenge = game.currentChallenge + 1;
      }
    }

    return {nextStep, nextChallenge};
  }, []);
  
  
  const increaseStep = useCallback(() => {
    setGame(prev => {
      if (!prev) {
        return prev;
      }

      const nextStepAndChallenge = getNextStepAndChallenge(prev);

      const updated: Game = {
        ...prev,
        currentStep: nextStepAndChallenge.nextStep,
        currentChallenge: nextStepAndChallenge.nextChallenge,
      };

      return updated;
    });
  }, []);
  
  const buttonNextChallengeOnClick = useCallback(() => {
    increaseStep();
  }, [increaseStep]);

  const checkLabelSelectedEvents = useCallback((prevGame: Game, eventsToCheck: Event[]) => {
    const newGameWithLabelVerifify = {...prevGame}
    let labelCheckStatus = true;

    const eventsWithoutLabel = eventsToCheck.filter(eventItem => !eventItem.label?.trim());
    if(eventsWithoutLabel.length > 0) {
      if (!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Eventos", "Verifique o(s) nome(s) do(s) evento(s)", "error");
      }

      newGameWithLabelVerifify.challenges[newGameWithLabelVerifify.currentChallenge].problem.eventOptions = 
        newGameWithLabelVerifify.challenges[newGameWithLabelVerifify.currentChallenge].problem.eventOptions.map(
          eventOption => {
            if (eventsWithoutLabel.some(eventItem => eventItem.description == eventOption.description)) {
              return { ...eventOption, error: true, inputHelperText: "Digite um nome para o evento" };
            }

            return eventOption;
          }
        );

      labelCheckStatus = false;
    }

    const eventsDuplicated = getDuplicatesBy(eventsToCheck, "label");
    if(eventsDuplicated.length > 0) {
      if (!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Eventos", "Verifique o(s) nome(s) do(s) evento(s)", "error");
      }

      newGameWithLabelVerifify.challenges[newGameWithLabelVerifify.currentChallenge].problem.eventOptions = 
        newGameWithLabelVerifify.challenges[newGameWithLabelVerifify.currentChallenge].problem.eventOptions.map(
          eventOption => {
            if (eventsDuplicated.some(eventItem => eventItem.label == eventOption.label)) {
              return { ...eventOption, error: true, inputHelperText: "Digite um nome único para o evento" };
            }
            return eventOption;
          }
        );

      labelCheckStatus = false;
    }

    return {newGameWithLabelVerifify, labelCheckStatus};
  }, [createAlert]);

  const checkSelectedEvents = useCallback((prevGame: Game, problem: Problem, checkTree: CheckTree, eventsToCheck: Event[]) => {
    const newGameTree = {...prevGame};
    let checkTreeStatus = false;

    const levelsToCheck = checkTree.levelsToAssemble ?? [];
    const eventsTree = problem.eventsTree.filter(eventTree => levelsToCheck.includes(eventTree.level));

    let selectionIsCorrect = false;
    if(eventsToCheck.length > 0) {
      selectionIsCorrect = eventsToCheck.every(eventToCheck => {
        return eventsTree.some(eventTree => eventTree.event.description == eventToCheck.description);
      }) && eventsTree.every(eventTree => {
        return eventsToCheck.some(eventToCheck => eventTree.event.description == eventToCheck.description);
      });
    }

    if (!alertLockRef.current) {
      if(selectionIsCorrect) {
        createAlert("Parabéns!", "Você acertou!", "success");

        newGameTree.challenges[newGameTree.currentChallenge].problem.eventsTree = 
          newGameTree.challenges[newGameTree.currentChallenge].problem.eventsTree.map(
            eventTree => {
              const eventToCheckFound = eventsToCheck.find(eventToCheck => eventToCheck.description == eventTree.event.description);
              if(eventToCheckFound) {
                return {
                  ...eventTree,
                  event: {
                    ...eventTree.event,
                    label: eventToCheckFound.label,
                  },
                  show: true
                }
              }

              return eventTree;
            }
          );

        newGameTree.challenges[newGameTree.currentChallenge].problem.eventOptions = 
        newGameTree.challenges[newGameTree.currentChallenge].problem.eventOptions.map(
          eventOption => {
            return { ...eventOption, error: false, disabled: false, label: "", selected: false};
          }
        );

        checkTreeStatus = true;
      }
      else {
        createAlert("Ops!", "Você errou, tente novamente!", "error");

        newGameTree.challenges[newGameTree.currentChallenge].problem.eventOptions = 
        newGameTree.challenges[newGameTree.currentChallenge].problem.eventOptions.map(
          eventOption => {
            return { ...eventOption, error: false};
          }
        );
      }

      goToTopOfChallenge();
      alertLockRef.current = true;
    }

    return {newGameTree, checkTreeStatus};
  }, [createAlert]);
  
  const checkTreeStep = useCallback((prevGame: Game, problem: Problem, checkTree: CheckTree) => {
    const eventsToCheck = problem.eventOptions.filter(eventItem => eventItem.selected);
    
    const {newGameWithLabelVerifify, labelCheckStatus} = checkLabelSelectedEvents(prevGame, eventsToCheck);
    if(!labelCheckStatus) {
      return newGameWithLabelVerifify;
    }

    const {newGameTree, checkTreeStatus} = checkSelectedEvents(prevGame, problem, checkTree, eventsToCheck);
    if(checkTreeStatus) {
      increaseStep();

      return newGameTree;
    }

    return prevGame;
  
  }, [checkLabelSelectedEvents, checkSelectedEvents]);

  const checkButtonOnClick = useCallback(() => {
    alertLockRef.current = false;
    setGame(prevGame => {
      if (!prevGame) return prevGame;
  
      const challenge = prevGame.challenges[prevGame.currentChallenge];
      const step = challenge?.steps[prevGame.currentStep];
    
      if(step.checkType == "Tree") {
        return checkTreeStep(prevGame, challenge.problem, step.checkTree as CheckTree);
      }

      return prevGame;
    });
  }, [setGame, checkTreeStep]);

  const clearTreeStep = useCallback((prevGame: Game): Game => {
    if (!alertLockRef.current) {
      updateModal({
        title: "Limpando marcações", 
        description:"Você gostaria de limpar as marcações da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          setGame({ 
            ...prevGame,
              challenges: prevGame.challenges.map((challenge, challengeIndex): Challenge => {
                if (challengeIndex === prevGame.currentChallenge) {
                  const updatedEvents: Event[] = challenge.problem.eventOptions.map((event) => {
                    return { ...event, error: false,  selected: false, label: ''};
                  });
                  return {
                    ...challenge,
                    problem: {
                      ...challenge.problem,
                      eventOptions: updatedEvents
                    }
                  };
                }
                return challenge;
              })
            });
            createAlert("Eventos", "Todas as marcações dos eventos foram limpas.", "info");
            goToTopOfChallenge();
            alertLockRef.current = true;
        }
      });
    }

    return prevGame;
  }, [createAlert, updateModal]);

  const clearButtonOnClick = useCallback(() => {
    alertLockRef.current = false;
    setGame(prevGame => {
      if (!prevGame) return prevGame;
  
      const challenge = prevGame.challenges[prevGame.currentChallenge];
      const step = challenge?.steps[prevGame.currentStep];
    
      if(step.checkType == "Tree") {
        return clearTreeStep(prevGame);
      }

      return prevGame;
    });
  }, [clearTreeStep]);

  const startGame = useCallback(() => {
    const newGame = getNewGame();

    newGame.challenges = newGame.challenges.map((challenge) => {
     challenge.problem.eventOptions = challenge.problem.eventOptions.map((event) => {
        return {
          ...event,
          selected: false,
          disabled: false,
          label: "",
          error: false,
          inputIsFocused: false,
          inputHelperText: ""
        };
      });

      challenge.problem.eventsTree = challenge.problem.eventsTree.map((event) => {
        return {
          ...event,
          show: false,
        };
      });
      return challenge;
    });

    newGame.nextChallengeButton = {
      onClick: buttonNextChallengeOnClick,
      disabled: true
    };

    newGame.checkButton = {
      onClick: checkButtonOnClick,
      disabled: false
    };

    newGame.clearButton = {
      onClick: clearButtonOnClick,
      disabled: false,
    }

    newGame.newGameButton = {
      onClick: newGameButtonOnClick,
      disabled: false,
    }

    setGame(newGame);
  }, [buttonNextChallengeOnClick, checkButtonOnClick, clearButtonOnClick]);

    const newGameButtonOnClick = useCallback(() => {
      updateModal({
          title: "Reiniciando o jogo", 
          description:"Você gostaria de reiniciar o jogo?", 
          status: "show",
          confirmCallback: () => {
            createAlert("Jogo reiniciado", "O jogo foi reiniciado.", "info");
            startGame();
            goToTopOfChallenge();
          }
      });
  }, [createAlert, updateModal, startGame]);

  useEffect(() => {
    startGame();
  }, []);

   useEffect(() => {
    console.log(game)
  }, [game]);

  return { game, setGame, alerts, updateAlert, deleteAlerts, modal, updateModal};
};
