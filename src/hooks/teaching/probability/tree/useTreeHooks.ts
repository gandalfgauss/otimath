'use client'

import { useState, useEffect, useCallback, useRef} from 'react';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';

type CheckType = "Tree" | "Probability" | "Calculations";
type Operation = "Union" | "Intersection" | "Conditional";

interface Event {
  description: string;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  error?: boolean;
  inputHelperText?: string;
  inputElement?: HTMLInputElement;
}

interface Calculations {
  eventA: Event;
  operation?: Operation;
  eventB?: Event;
  result: number;
}

export interface EventTree {
  event: Event;
  probabilityOfOccurring: number;
  parentEventTree?: EventTree;
  childrenEventsTree?: EventTree[];
  level: number;
  show?: boolean;
  probability?: Probability;
}

interface Probability {
  probabilityOfOccurring?: number;
  probabilityText?: string;
  selected?: boolean;
  disabled?: boolean;
  show?: boolean;
}

interface CalculationsLayout {
  value: string;
  disabled: boolean;
  error: boolean;
  options?: {value: string, label: string}[];
}

interface Problem {
  description: string;
  eventsTree: EventTree[];
  eventOptions: Event[]; 
  probabilitiesToAssemble: Probability[];
  boardEventsDisabled?: boolean;
  boardProbabilityDisabled?: boolean;
  boardCalculationsDisabled?: boolean;
  calculationsEventA?: CalculationsLayout;
  calculationsOperation?: CalculationsLayout;
  calculationsEventB?: CalculationsLayout;
  calculationsResult?: CalculationsLayout; 
  calculationsHistory?: Calculations[];
}

interface CheckTree {
  levelsToAssemble?: number[];
}

interface Step {
  instructions: string;
  checkType: CheckType;
  checkTree?: CheckTree;
  calculations?: Calculations;
}
interface Challenge {
  problem: Problem;
  steps: Step[];
}

interface NextChallengeButton {
  onClick?: () => void;
  disabled: boolean;
}

interface CheckButton {
  onClick?: () => void;
  disabled: boolean;
}

interface ClearButton {
  onClick?: () => void;
  disabled: boolean;
}

interface NewGameButton {
  onClick?: () => void;
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

export const operationsOptions: { value: Operation, label: string }[] = [
  { value: "Intersection", label: "\u2229" },
  { value: "Union", label: "\u222A" },
  { value: "Conditional", label: "|" }
];

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
  const event0: Event = {
    description: "Raiz",
  };
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

  const eventTree0 : EventTree = {
    event: event0,
    probabilityOfOccurring: 1,
    level: 0,
  };

  const levelOneProbabilities = generateRandomPartition(2);
  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: levelOneProbabilities[0],
    level: 1,
    parentEventTree: eventTree0
  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: levelOneProbabilities[1],
    level: 1,
    parentEventTree: eventTree0
  };

  eventTree0.childrenEventsTree = [eventTree1, eventTree2];

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
    <br/> Um aluno é sorteado ao acaso.
    </p>`,
    eventsTree: [eventTree0, eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6, eventTree7, eventTree8],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4, event5, event6, event7, event8]),
    probabilitiesToAssemble: []
  };

  problem.probabilitiesToAssemble = shuffleArray(
    Array.from(
      new Map(
        [
          ...problem.eventsTree.map(eventTree => ({
            probabilityOfOccurring: eventTree.probabilityOfOccurring,
            probabilityText: eventTree.probabilityOfOccurring.toFixed(2),
          })),
          ...generateRandomPartition(3).map(partition => ({
            probabilityOfOccurring: partition,
            probabilityText: partition.toFixed(2),
          })),
        ].map(item => [item.probabilityOfOccurring, item])
      ).values()
    )
  );

  const stepOne: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                      Construa a árvore de probabilidade que representa a distribuição dos alunos do Colégio Universitário participantes da gincana anual. 
                      <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> PRIMEIRO NÍVEL</strong> da árvore utilizando o <strong>Quadro de Eventos</strong>.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                    </span>
                  </div>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1],
    },
  };

  const stepTwo: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                      Construa a árvore de probabilidade que representa a distribuição dos alunos do Colégio Universitário participantes da gincana anual. 
                      <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> SEGUNDO NÍVEL</strong> da árvore utilizando o <strong>Quadro de Eventos</strong>.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                    </span>
                  </div>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [2],
    },
  };

  const stepThree: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                     Complete as <strong>probabilidades dos nós da árvore</strong> selecionando um valor no <strong>Quadro de Probabilidades</strong> e,
                     <br/>em seguida, clicando no botão com o <strong>símbolo “?”</strong> no <strong>nó</strong> correspondente.  
                    </span>
                  </div>`,
    checkType: "Probability",
  };

  const stepFour: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de que seja uma menina do primeiro ano?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Intersection",
      eventB: event3,
      result: eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring
    }
  };

  const stepFive: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de que seja um menino do segundo ano?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Intersection",
      eventB: event4,
      result: eventTree2.probabilityOfOccurring * eventTree7.probabilityOfOccurring
    }
  };

  const stepSix: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de que seja do terceiro ano?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event5,
      result: (eventTree5.probabilityOfOccurring * eventTree1.probabilityOfOccurring) + (eventTree8.probabilityOfOccurring * eventTree2.probabilityOfOccurring)
    }
  };

  const stepSeven: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de que seja uma menina, dado que é do primeiro ano?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Conditional",
      eventB: event3,
      result: (eventTree3.probabilityOfOccurring * eventTree1.probabilityOfOccurring) /
              ((eventTree3.probabilityOfOccurring * eventTree1.probabilityOfOccurring) +
               (eventTree6.probabilityOfOccurring * eventTree2.probabilityOfOccurring))
    }
  };

    const stepEight: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de que seja um menino, dado que é do segundo ano?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Conditional",
      eventB: event4,
      result: (eventTree7.probabilityOfOccurring * eventTree2.probabilityOfOccurring) /
              ((eventTree7.probabilityOfOccurring * eventTree2.probabilityOfOccurring) +
               (eventTree4.probabilityOfOccurring * eventTree1.probabilityOfOccurring) )
    }
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven, stepEight],
  };

  return challenge;
}

const getChallengeTwo = (): Challenge => {
  const event0: Event = {
    description: "Raiz",
  };

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

  const eventTree0 : EventTree = {
    event: event0,
    probabilityOfOccurring: 1,
    level: 0,
  };

  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: 0.5,
    level: 1,
    parentEventTree: eventTree0

  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: 0.5,
    level: 1,
    parentEventTree: eventTree0
  };

  eventTree0.childrenEventsTree = [eventTree1, eventTree2];

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
    eventsTree: [eventTree0, eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4]),
    probabilitiesToAssemble: []
  };

  problem.probabilitiesToAssemble = shuffleArray(
    Array.from(
      new Map(
        [
          ...problem.eventsTree.map(eventTree => ({
            probabilityOfOccurring: eventTree.probabilityOfOccurring,
            probabilityText: eventTree.probabilityOfOccurring.toFixed(2),
          })),
          ...generateRandomPartition(3).map(partition => ({
            probabilityOfOccurring: partition,
            probabilityText: partition.toFixed(2),
          })),
        ].map(item => [item.probabilityOfOccurring, item])
      ).values()
    )
  );

  const stepOne: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                      Construa a árvore de probabilidade que representa a distribuição das bolas nas urnas.
                      <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> PRIMEIRO NÍVEL</strong> da árvore utilizando o <strong>Quadro de Eventos</strong>.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                    </span>
                  </div>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1],
    },
  };

  const stepTwo: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                      Construa a árvore de probabilidade que representa a distribuição das bolas nas urnas.
                      <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> SEGUNDO NÍVEL</strong> da árvore utilizando o <strong>Quadro de Eventos</strong>.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                    </span>
                  </div>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [2],
    },
  };

  const stepThree: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                     Complete as <strong>probabilidades dos nós da árvore</strong> selecionando um valor no <strong>Quadro de Probabilidades</strong> e,
                     <br/>em seguida, clicando no botão com o <strong>símbolo “?”</strong> no <strong>nó</strong> correspondente.  
                    </span>
                  </div>`,
    checkType: "Probability",
  };

  const stepFour: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de ser sorteada a primeira urna e uma bola preta?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Intersection",
      eventB: event4,
      result: eventTree1.probabilityOfOccurring * eventTree4.probabilityOfOccurring
    }
  };

  const stepFive: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de ser sorteada a segunda urna e uma bola vermelha?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Intersection",
      eventB: event3,
      result: eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring
    }
  };

  const stepSix: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de ser sorteada uma bola vermelha?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event3,
      result: (eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) +
              (eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring)
    }
  };

  const stepSeven: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de ter sido sorteada a primeira urna dado que a bola é vermelha?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Conditional",
      eventB: event3,
      result: (eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) /
              ((eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) +
               (eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring))
    }
  };

  const stepEight: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de ter sido sorteada a segunda urna dado que a bola é preta?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Conditional",
      eventB: event4,
      result: (eventTree2.probabilityOfOccurring * eventTree6.probabilityOfOccurring) /
              ((eventTree2.probabilityOfOccurring * eventTree6.probabilityOfOccurring) +
               (eventTree1.probabilityOfOccurring * eventTree4.probabilityOfOccurring) )
    }
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven, stepEight],
  };

  return challenge;
}

const getChallengeThree = (): Challenge => {
  const sickAdults = Math.floor(Math.random() * 4) + 1;
  const correctDiagnosisWhenSick = Math.floor(Math.random() * 4) + 16;
  const incorrectDiagnosisWhenHealthy = Math.floor(Math.random() * 3) + 1;

  const event0: Event = {
    description: "Raiz",
  };

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

  const eventTree0 : EventTree = {
    event: event0,
    probabilityOfOccurring: 1,
    level: 0,
  };

  const eventTree1 : EventTree = {
    event: event1,
    probabilityOfOccurring: Number((sickAdults/20).toFixed(2)),
    level: 1,
    parentEventTree: eventTree0
  };
  const eventTree2 : EventTree = {
    event: event2,
    probabilityOfOccurring: Number((1 - sickAdults/20).toFixed(2)),
    level: 1,
    parentEventTree: eventTree0
  };

  eventTree0.childrenEventsTree = [eventTree1, eventTree2];

  const eventTree3 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((correctDiagnosisWhenSick/20).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };
  const eventTree4 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((1 - correctDiagnosisWhenSick/20).toFixed(2)),
    parentEventTree: eventTree1,
    level: 2,
  };

  eventTree1.childrenEventsTree = [eventTree3, eventTree4];

  const eventTree5 : EventTree = {
    event: event3,
    probabilityOfOccurring: Number((incorrectDiagnosisWhenHealthy/20).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };
  const eventTree6 : EventTree = {
    event: event4,
    probabilityOfOccurring: Number((1 - incorrectDiagnosisWhenHealthy/20).toFixed(2)),
    parentEventTree: eventTree2,
    level: 2,
  };

  eventTree2.childrenEventsTree = [eventTree5, eventTree6];

  const sickAdultsFraction = simplifyFraction(sickAdults, 20);
  const healthyAdultsFraction = simplifyFraction(20 - sickAdults, 20);
  const correctDiagnosisWhenSickFraction = simplifyFraction(correctDiagnosisWhenSick, 20);
  const incorretDiagnosisWhenSickFraction = simplifyFraction(20 - correctDiagnosisWhenSick, 20);
  const incorrectDiagnosisWhenHealthyFraction = simplifyFraction(incorrectDiagnosisWhenHealthy, 20);
  const correctDiagnosisWhenHealthyFraction = simplifyFraction(20 - incorrectDiagnosisWhenHealthy, 20);

  const problem: Problem = {
    description: `<p className="ds-body">
    Em uma localidade, <strong>${sickAdultsFraction.numerator}/${sickAdultsFraction.denominator}</strong> dos adultos <strong>sofrem de determinada doença</strong>.
    <br/> Um médico local  <strong>diagnostica corretamente ${correctDiagnosisWhenSickFraction.numerator}/${correctDiagnosisWhenSickFraction.denominator}</strong> das pessoas que  <strong>têm a doença</strong> 
    e <strong>diagnostica erradamente ${incorrectDiagnosisWhenHealthyFraction.numerator}/${incorrectDiagnosisWhenHealthyFraction.denominator}</strong> das pessoas que  <strong>não a têm</strong>.
    <br/> Um adulto acaba de ser atendido pelo médico.
    </p>`,
    eventsTree: [eventTree0, eventTree1, eventTree2, eventTree3, eventTree4, eventTree5, eventTree6],
    eventOptions: shuffleArray<Event>([event1, event2, event3, event4]),
    probabilitiesToAssemble: []
  };

  const randomOption1 = Math.floor(Math.random() * 20) + 1;
  const randomOption1Fraction = simplifyFraction(randomOption1, 20);
  const randomOption2 = Math.floor(Math.random() * 20) + 1;
  const randomOption2Fraction = simplifyFraction(randomOption2, 20);
  const randomOption3 = Math.floor(Math.random() * 20) + 1;
  const randomOption3Fraction = simplifyFraction(randomOption3, 20);

  

  problem.probabilitiesToAssemble = shuffleArray(
    Array.from(
      new Map(
        [
          {
            probabilityOfOccurring: eventTree1.probabilityOfOccurring,
            probabilityText: `${sickAdultsFraction.numerator}/${sickAdultsFraction.denominator}`,
          },
          {
            probabilityOfOccurring: eventTree2.probabilityOfOccurring,
            probabilityText: `${healthyAdultsFraction.numerator}/${healthyAdultsFraction.denominator}`,
          },
          {
            probabilityOfOccurring: eventTree3.probabilityOfOccurring,
            probabilityText: `${correctDiagnosisWhenSickFraction.numerator}/${correctDiagnosisWhenSickFraction.denominator}`,
          },
          {
            probabilityOfOccurring: eventTree4.probabilityOfOccurring,
            probabilityText: `${incorretDiagnosisWhenSickFraction.numerator}/${incorretDiagnosisWhenSickFraction.denominator}`,
          },
          {
            probabilityOfOccurring: eventTree5.probabilityOfOccurring,
            probabilityText: `${incorrectDiagnosisWhenHealthyFraction.numerator}/${incorrectDiagnosisWhenHealthyFraction.denominator}`,
          },
          {
            probabilityOfOccurring: eventTree6.probabilityOfOccurring,
            probabilityText: `${correctDiagnosisWhenHealthyFraction.numerator}/${correctDiagnosisWhenHealthyFraction.denominator}`,
          },
          {
            probabilityOfOccurring: Number((randomOption1/20).toFixed(2)),
            probabilityText: `${randomOption1Fraction.numerator}/${randomOption1Fraction.denominator}`,
          },
          {
            probabilityOfOccurring: Number((randomOption2/20).toFixed(2)),
            probabilityText: `${randomOption2Fraction.numerator}/${randomOption2Fraction.denominator}`,
          },
          {
            probabilityOfOccurring: Number((randomOption3/20).toFixed(2)),
            probabilityText: `${randomOption3Fraction.numerator}/${randomOption3Fraction.denominator}`,
          },
        ].map(item => [item.probabilityOfOccurring, item])
      ).values()
    )
  );

  const stepOne: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                      Construa a árvore de probabilidade que representa a distribuição dos cartões.
                      <br/> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> PRIMEIRO E SEGUNDO NÍVEL</strong> da árvore utilizando o <strong>Quadro de Eventos</strong>.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                    </span>
                  </div>`,
    checkType: "Tree",
    checkTree: {
      levelsToAssemble: [1, 2],
    },
  };

  const stepTwo: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span>
                     Complete as <strong>probabilidades dos nós da árvore</strong> selecionando um valor no <strong>Quadro de Probabilidades</strong> e,
                     <br/>em seguida, clicando no botão com o <strong>símbolo “?”</strong> no <strong>nó</strong> correspondente.  
                    </span>
                  </div>`,
    checkType: "Probability",
  };

  const stepThree: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de o paciente ter a doença e o médico diagnosticar positivamente?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Intersection",
      eventB: event3,
      result: eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring
    }
  };

  const stepFour: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de o paciente não ter a doença e o médico diagnosticar positivamente?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Intersection",
      eventB: event3,
      result: eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring
    }
  };

  const stepFive: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>Qual é a probabilidade de o médico diagnosticar o paciente como portador?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      result: (eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) +
              (eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring)
    }
  };

  const stepSix: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>O médico diagnostica o paciente como não portador da doença. Qual é a probabilidade de que ele esteja certo?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Conditional",
      eventB: event4,
      result: (eventTree2.probabilityOfOccurring * eventTree6.probabilityOfOccurring) /
              ((eventTree2.probabilityOfOccurring * eventTree6.probabilityOfOccurring) +
               (eventTree1.probabilityOfOccurring * eventTree4.probabilityOfOccurring))
    }
  };

  const stepSeven: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>O médico diagnostica o paciente como portador da doença. Qual é probabilidade de ele estar errado?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event2,
      operation: "Conditional",
      eventB: event3,
      result: (eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) /
              ((eventTree1.probabilityOfOccurring * eventTree3.probabilityOfOccurring) +
               (eventTree2.probabilityOfOccurring * eventTree5.probabilityOfOccurring))
    }
  };

  const stepEight: Step = {
    instructions: `<div className="ds-body flex flex-col gap-y-xxxs"> 
                    <h3 className="ds-heading-large text-brand-otimath-pure">Enunciado:</h3>
                    <span> 
                      Monte a <strong>expressão</strong> correspondente à <strong>pergunta</strong> e, em seguida, realize os cálculos na calculadora.
                      <br/> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta.
                    </span>
                    <span className="ds-body-large text-center"><strong>O médico diagnostica o paciente como não portador da doença. Qual é probabilidade de ele esteja errado?</strong></span>
                  </div>`,
    checkType: "Calculations",
    calculations: {
      eventA: event1,
      operation: "Conditional",
      eventB: event4,
      result: (eventTree1.probabilityOfOccurring * eventTree4.probabilityOfOccurring) /
              ((eventTree1.probabilityOfOccurring * eventTree4.probabilityOfOccurring) +
               (eventTree2.probabilityOfOccurring * eventTree6.probabilityOfOccurring))
    }
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven, stepEight],
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
      } else {
        nextStep = game.challenges[game.currentChallenge].steps.length - 1;
      }
    }

    return {nextStep, nextChallenge};
  }, []);

  const getGameIncreaseStep = useCallback((game: Game): Game => {
    if (!game) {
      return game;
    }

    const nextStepAndChallenge = getNextStepAndChallenge(game);

    const updated: Game = {
      ...game,
      currentStep: nextStepAndChallenge.nextStep,
      currentChallenge: nextStepAndChallenge.nextChallenge,
    };

    return updated;
  }, [getNextStepAndChallenge]);

  const challengeIsComplete = useCallback((prevGame: Game): boolean => {
    const newGame = getGameIncreaseStep(prevGame);
    return prevGame.currentChallenge != newGame.currentChallenge || (prevGame.currentChallenge == newGame.currentChallenge && prevGame.currentStep == newGame.currentStep);
  }, [getGameIncreaseStep]);

  const gameIsComplete = useCallback((prevGame: Game): boolean => {
    const newGame = getGameIncreaseStep(prevGame);
    return prevGame.currentChallenge == newGame.currentChallenge && prevGame.currentStep == newGame.currentStep;
  }, [getGameIncreaseStep]);
  
  const buttonNextChallengeOnClick = useCallback(() => {
    playSound("/sounds/nextChallenge.mp3");

    setGame(prevGame => {
      if(!prevGame) return prevGame;
      const newGame = getGameIncreaseStep(prevGame);
      
      return {
        ...newGame, 
        nextChallengeButton: {
          ...newGame.nextChallengeButton,
          disabled: true,
        },
        checkButton: {
          ...newGame.checkButton,
          disabled: false,
        },
        clearButton: {
          ...newGame.clearButton,
          disabled: false,
        },
      };
    });

    goToTopOfChallenge();
  }, [getGameIncreaseStep]);

  const checkLabelSelectedEvents = useCallback((prevGame: Game, eventsToCheck: Event[]) => {
    const newGame = {...prevGame}

    const eventsWithoutLabel = eventsToCheck.filter(eventItem => !eventItem.label?.trim());
    if(eventsWithoutLabel.length > 0) {
      if (!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Eventos", "Verifique o(s) nome(s) do(s) evento(s)", "error");
        playSound("/sounds/incorrect.mp3");
      }

      newGame.challenges[newGame.currentChallenge].problem.eventOptions = 
        newGame.challenges[newGame.currentChallenge].problem.eventOptions.map(
          eventOption => {
            if (eventsWithoutLabel.some(eventItem => eventItem.description == eventOption.description)) {
              return { ...eventOption, error: true, inputHelperText: "Digite um nome para o evento" };
            }

            return eventOption;
          }
        );

        return {newGame, checkStatus: false};
    }

    const eventsDuplicated = getDuplicatesBy(
      [...eventsToCheck, 
        ...newGame.challenges[newGame.currentChallenge].problem.eventsTree.filter(eventTree => eventTree.event.label).map(eventTree => eventTree.event)
      ], "label");

    if(eventsDuplicated.length > 0) {
      if (!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Eventos", "Verifique o(s) nome(s) do(s) evento(s)", "error");
        playSound("/sounds/incorrect.mp3");
      }

      newGame.challenges[newGame.currentChallenge].problem.eventOptions = 
        newGame.challenges[newGame.currentChallenge].problem.eventOptions.map(
          eventOption => {
            if (eventsDuplicated.some(eventItem => eventItem.label == eventOption.label)) {
              return { ...eventOption, error: true, inputHelperText: "Digite um nome único para o evento" };
            }
            return eventOption;
          }
        );
      
        return {newGame, checkStatus: false};
    }

    return {newGame, checkStatus: true};
  }, [createAlert]);

  const checkSelectedEvents = useCallback((prevGame: Game, problem: Problem, checkTree: CheckTree, eventsToCheck: Event[]) => {
    const newGame = {...prevGame};

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
    
    if(selectionIsCorrect) {
      if(!challengeIsComplete(prevGame)) {
        if (!alertLockRef.current) {
          alertLockRef.current = true;
          createAlert("Parabéns!", "Você acertou!", "success");
          playSound("/sounds/correct.mp3");
        }
      }

      newGame.challenges[newGame.currentChallenge].problem.eventsTree = 
        newGame.challenges[newGame.currentChallenge].problem.eventsTree.map(
          eventTree => {
            if(eventTree.level == 0) {
              return {
                ...eventTree,
                show: true
              }
            }

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

      newGame.challenges[newGame.currentChallenge].problem.eventOptions = 
      newGame.challenges[newGame.currentChallenge].problem.eventOptions.map(
        eventOption => {
          return { ...eventOption, error: false, disabled: false, label: "", selected: false};
        }
      );

      return {newGame, checkStatus: true};
    }
    
    if (!alertLockRef.current) {
      alertLockRef.current = true;
      createAlert("Ops!", "Você errou, tente novamente!", "error");
      playSound("/sounds/incorrect.mp3");
    }

    newGame.challenges[newGame.currentChallenge].problem.eventOptions = 
    newGame.challenges[newGame.currentChallenge].problem.eventOptions.map(
      eventOption => {
        return { ...eventOption, error: false};
      }
    );
    

    return {newGame, checkStatus: false};

  }, [createAlert, challengeIsComplete]);
  
  const checkTreeStep = useCallback((prevGame: Game, problem: Problem, checkTree: CheckTree) => {
    const eventsToCheck = problem.eventOptions.filter(eventItem => eventItem.selected);

    let {newGame, checkStatus} = checkLabelSelectedEvents(prevGame, eventsToCheck);
    if(!checkStatus) {
      return {newGame, checkStatus};
    }
    
    ({newGame, checkStatus} = checkSelectedEvents(newGame, problem, checkTree, eventsToCheck));

    return {newGame, checkStatus};
  
  }, [checkLabelSelectedEvents, checkSelectedEvents]);

  const getGameToNextStep = useCallback((prevGame: Game): Game => {
    const newGame = getGameIncreaseStep(prevGame);

    return newGame;
  }, [getGameIncreaseStep]);

  const getGameChallengeFinishedButtonsStates = useCallback((prevGame: Game): Game => {
    return {
      ...prevGame, 
      nextChallengeButton: {
        ...prevGame.nextChallengeButton,
        disabled: false,
      },
      checkButton: {
        ...prevGame.checkButton,
        disabled: true,
      },
        clearButton: {
        ...prevGame.clearButton,
        disabled: true,
      },
    };
  }, []);

  const getGameFinishedButtonsStates = useCallback((prevGame: Game): Game => {
      return {
        ...prevGame, 
        nextChallengeButton: {
          ...prevGame.nextChallengeButton,
          disabled: true,
        },
        checkButton: {
          ...prevGame.checkButton,
          disabled: true,
        },
        clearButton: {
          ...prevGame.clearButton,
          disabled: true,
        },
      };
  }, []);

  const getGameWithEventsDisabled = useCallback((prevGame: Game): Game => {
    return {
      ...prevGame,
      challenges: prevGame.challenges.map((challenge, index) => {
        if(index == prevGame.currentChallenge) {
          let updatedEvents: Event[] = challenge.problem.eventOptions.filter((event) =>
            challenge.problem.eventsTree.some(eventTree => eventTree.event.description == event.description)
          )

          updatedEvents = updatedEvents.map((event) => {
            return { 
              ...event, 
              disabled: true, 
              selected: true, 
              label: challenge.problem.eventsTree.find(eventTree => eventTree.event.description == event.description)?.event.label};
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
    }
  }, []);

  const getGameChallengeFinishedNewInstructions = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const currentStepGame =  newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep];
    newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep] = {
      ...currentStepGame,
      instructions: `
        <p className="ds-body-bold text-feedback-success-dark text-center"> 
          Parabéns, passe para o próximo desafio!
        </p>`
    }
    
    return newGame;
  }, []);

  const getGameFinishedNewInstructions = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const currentStepGame =  newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep];
    newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep] = {
      ...currentStepGame,
      instructions: `
        <p className="ds-body-bold text-feedback-success-dark text-center"> 
          Parabéns, você finalizou todos os desafios!
        </p>`
    }
    
    return newGame;
  }, []);

  const getGameDisabledEventBoard = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const problem =  newGame.challenges[newGame.currentChallenge].problem;
    newGame.challenges[newGame.currentChallenge].problem = {
      ...problem,
      boardEventsDisabled: true
    }
    
    return newGame;
  }, []);

  const getGameActivedProbabilityBoard = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const problem =  newGame.challenges[newGame.currentChallenge].problem;
    newGame.challenges[newGame.currentChallenge].problem = {
      ...problem,
      boardProbabilityDisabled: false,
      eventsTree: problem.eventsTree.map(eventTree => {
        return {
          ...eventTree,
          probability: {
            ...eventTree.probability,
            show: true
          }
        }
      }),
      probabilitiesToAssemble: problem.probabilitiesToAssemble.map(probability => {
        return {
          ...probability,
          show: true,
        }
      })
    }
    
    return newGame;
  }, []);

  const getGameDisabledProbabilityBoard = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const problem =  newGame.challenges[newGame.currentChallenge].problem;
    newGame.challenges[newGame.currentChallenge].problem = {
      ...problem,
      boardProbabilityDisabled: true,
      eventsTree: problem.eventsTree.map(eventTree => {
        return {
          ...eventTree,
          probability: {
            ...eventTree.probability,
            selected: true,
            disabled: true
          }
        }
      })
    }
    
    return newGame;
  }, []);

  const getGameActivedCalculationsBoard = useCallback((prevGame: Game) : Game => {
    const newGame = {...prevGame};
    const problem =  newGame.challenges[newGame.currentChallenge].problem;
    newGame.challenges[newGame.currentChallenge].problem = {
      ...problem,
      boardCalculationsDisabled: false,
      calculationsEventA: {
        disabled: false,
        error: false,
        value: ' '
      },
      calculationsOperation: {
        disabled: false,
        error: false,
        value: ' ',
        options: operationsOptions
      },
      calculationsEventB: {
        disabled: false,
        error: false,
        value: ' '
      },
      calculationsResult: {
        disabled: false,
        error: false,
        value: ''
      }
    }
    
    return newGame;
  }, []);

  const checkProbabilityStep = useCallback((prevGame: Game) => {
    let newGame = {...prevGame};

    const eventsTree = newGame.challenges[newGame.currentChallenge].problem.eventsTree;

    const checkStatus = eventsTree.every(eventTree => {
      return eventTree.level == 0 || eventTree.probability?.probabilityOfOccurring == eventTree.probabilityOfOccurring
    })

    if(checkStatus) {
      if(!challengeIsComplete(prevGame)) {
        if (!alertLockRef.current) {
          alertLockRef.current = true;
          createAlert("Parabéns!", "Você acertou!", "success");
          playSound("/sounds/correct.mp3");
        }
      }

      newGame = getGameDisabledProbabilityBoard(newGame);
    } else {
      if(!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Ops!", "Você errou, tente novamente!", "error");
        playSound("/sounds/incorrect.mp3");
      }
    }
    
    return {newGame, checkStatus};

  }, [challengeIsComplete, createAlert, getGameDisabledProbabilityBoard]);

  const getGameDisabledCalculationsBoard = useCallback((prevGame: Game) : Game => {
    return {
      ...prevGame, 
      challenges: prevGame.challenges.map((challenge, index) => {
        if(index == prevGame.currentChallenge) {
          return {
            ...challenge,
            problem: {
              ...challenge.problem,
              calculationsEventA: {
                ...challenge.problem.calculationsEventA,
                error: challenge.problem.calculationsEventA?.error ?? false,
                disabled: true,
                value: challenge.problem.calculationsEventA?.value ?? '',
              },
              calculationsOperation: {
                ...challenge.problem.calculationsOperation,
                error: challenge.problem.calculationsOperation?.error ?? false,
                disabled: true,
                value: challenge.problem.calculationsOperation?.value ?? '',
              },
              calculationsEventB: {
                ...challenge.problem.calculationsEventB,
                error: challenge.problem.calculationsEventB?.error ?? false,
                disabled: true,
                value: challenge.problem.calculationsEventB?.value ?? '',
              },
              calculationsResult: {
                ...challenge.problem.calculationsResult,
                error: challenge.problem.calculationsResult?.error ?? false,
                disabled: true,
                value: challenge.problem.calculationsResult?.value ?? '',
              }
            }
          }
        }
        return challenge;
      })
    };
  }, []);

  const getGameSelectCalculationsInError = useCallback((prevGame: Game): Game => {
      return {
        ...prevGame, 
        challenges: prevGame.challenges.map((challenge, index) => {
          if(index == prevGame.currentChallenge) {
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                calculationsEventA: {
                  ...challenge.problem.calculationsEventA,
                  error: true,
                  disabled: challenge.problem.calculationsEventA?.disabled ?? false,
                  value: challenge.problem.calculationsEventA?.value ?? '',
                },
                calculationsOperation: {
                  ...challenge.problem.calculationsOperation,
                  error: true,
                  disabled: challenge.problem.calculationsOperation?.disabled ?? false,
                  value: challenge.problem.calculationsOperation?.value ?? '',
                },
                calculationsEventB: {
                  ...challenge.problem.calculationsEventB,
                  error: true,
                  disabled: challenge.problem.calculationsEventB?.disabled ?? false,
                  value: challenge.problem.calculationsEventB?.value ?? '',
                }
              }
            }
          }
          return challenge;
        })
      };
  }, []);

  const getGameInputCalculationsInError = useCallback((prevGame: Game): Game => {
      return {
        ...prevGame, 
        challenges: prevGame.challenges.map((challenge, index) => {
          if(index == prevGame.currentChallenge) {
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                calculationsResult: {
                  ...challenge.problem.calculationsResult,
                  error: true,
                  disabled: challenge.problem.calculationsResult?.disabled ?? false,
                  value: challenge.problem.calculationsResult?.value ?? '',
                }
              }
            }
          }
          return challenge;
        })
      };
  }, []);

  const getGameSelectCalculationsRemoveError = useCallback((prevGame: Game): Game => {
      return {
        ...prevGame, 
        challenges: prevGame.challenges.map((challenge, index) => {
          if(index == prevGame.currentChallenge) {
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                calculationsEventA: {
                  ...challenge.problem.calculationsEventA,
                  error: false,
                  disabled: challenge.problem.calculationsEventA?.disabled ?? false,
                  value: challenge.problem.calculationsEventA?.value ?? '',
                },
                calculationsOperation: {
                  ...challenge.problem.calculationsOperation,
                  error: false,
                  disabled: challenge.problem.calculationsOperation?.disabled ?? false,
                  value: challenge.problem.calculationsOperation?.value ?? '',
                },
                calculationsEventB: {
                  ...challenge.problem.calculationsEventB,
                  error: false,
                  disabled: challenge.problem.calculationsEventB?.disabled ?? false,
                  value: challenge.problem.calculationsEventB?.value ?? '',
                },
              }
            }
          }
          return challenge;
        })
      };
  }, []);

  const getGameInputCalculationsRemoveError = useCallback((prevGame: Game): Game => {
    return {
      ...prevGame, 
      challenges: prevGame.challenges.map((challenge, index) => {
        if(index == prevGame.currentChallenge) {
          return {
            ...challenge,
            problem: {
              ...challenge.problem,
              calculationsResult: {
                ...challenge.problem.calculationsResult,
                error: false,
                disabled: challenge.problem.calculationsResult?.disabled ?? false,
                value: challenge.problem.calculationsResult?.value ?? '',
              }
            }
          }
        }
        return challenge;
      })
    };
  }, []);

  const getGameCalculationsClear = useCallback((prevGame: Game): Game => {
    if(!prevGame) return prevGame;

    return {
      ...prevGame, 
      challenges: prevGame.challenges.map((challenge, index) => {
        if(index == prevGame.currentChallenge) {
          return {
            ...challenge,
            problem: {
              ...challenge.problem,
              calculationsEventA: {
                ...challenge.problem.calculationsEventA,
                error: false,
                disabled: challenge.problem.calculationsEventA?.disabled ?? false,
                value: ' ',
              },
              calculationsOperation: {
                ...challenge.problem.calculationsOperation,
                error: false,
                disabled: challenge.problem.calculationsOperation?.disabled ?? false,
                value: ' ',
              },
              calculationsEventB: {
                ...challenge.problem.calculationsEventB,
                error: false,
                disabled: challenge.problem.calculationsEventB?.disabled ?? false,
                value: ' ',
              },
              calculationsResult: {
                ...challenge.problem.calculationsResult,
                error: false,
                disabled: challenge.problem.calculationsResult?.disabled ?? false,
                value: ' ',
              }
            }
          }
        }
        return challenge;
      })
    };
  }, []);

  const checkExpression = useCallback((prevGame: Game) => {
    let newGame = {...prevGame};
    let checkStatus = false;
    
    const stepCalculations = newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep].calculations;
    const problemCalculations = newGame.challenges[newGame.currentChallenge].problem;

    if(stepCalculations?.eventA && !stepCalculations?.eventB) {
      if(stepCalculations?.eventA.description == problemCalculations.calculationsEventA?.value) {
        checkStatus = true;
        newGame = getGameSelectCalculationsRemoveError(newGame);
      }
    } else {
      if ((
          stepCalculations?.eventA.description == problemCalculations.calculationsEventA?.value &&
          stepCalculations?.operation == problemCalculations.calculationsOperation?.value &&
          stepCalculations?.eventB?.description == problemCalculations.calculationsEventB?.value
        ) ||
        (
          stepCalculations?.operation != "Conditional" &&
          stepCalculations?.eventA?.description == problemCalculations.calculationsEventB?.value &&
          stepCalculations?.eventB?.description == problemCalculations.calculationsEventA?.value
        )
      ) {
        checkStatus = true;
        newGame = getGameSelectCalculationsRemoveError(newGame);
      }
    }

    if(!checkStatus) {
      if(!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Ops!", "Você errou, confira a expressão e tente novamente!", "error");
        playSound("/sounds/incorrect.mp3");
      }
      newGame = getGameSelectCalculationsInError(newGame);
    }

    return {newGame, checkStatus};
  }, [createAlert, getGameSelectCalculationsInError, getGameSelectCalculationsRemoveError]);

  const calculateExpression = (expression: string) => {
    try {
      const sanitized = expression.replaceAll(',', '.');
      const result = new Function(`"use strict"; return (${sanitized})`)();
      if(result === Infinity || Number.isNaN(result)) {
        return "Erro";
      }
      return String(result);
    } catch {
      return "Erro";
    }
  };

  const getGameAddCalculationsInHistory = useCallback((prevGame: Game, calculationItem: Calculations) => {
    return {
      ...prevGame,
      challenges: prevGame.challenges.map((challenge, index) => {
        if(index == prevGame.currentChallenge) {
          return {
            ...challenge,
            problem: {
              ...challenge.problem,
              calculationsHistory: [
                ...(challenge.problem.calculationsHistory ?? []),
                calculationItem
              ]
            }
          }
        }
        return challenge;
      })
    }
  }, []);

  const checkCalculations = useCallback((prevGame: Game) => {
    let newGame = {...prevGame};
    let checkStatus = false;
    
    const stepCalculations = newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep].calculations;
    const stepCalculationsResult = stepCalculations?.result;
    const calculationResult = Number(calculateExpression(newGame.challenges[newGame.currentChallenge].problem.calculationsResult?.value ?? ''));
    const eventsTree = newGame.challenges[newGame.currentChallenge].problem.eventsTree;

    if(calculationResult == stepCalculationsResult) {
      checkStatus = true;
      newGame = getGameInputCalculationsRemoveError(newGame);

      const eventA = eventsTree.find(eventTree => eventTree.event.description == stepCalculations?.eventA?.description)?.event;
      const eventB = eventsTree.find(eventTree => eventTree.event.description == stepCalculations?.eventB?.description)?.event;
      newGame = getGameAddCalculationsInHistory(newGame, {
        eventA: eventA as Event,
        operation: stepCalculations?.operation,
        eventB: eventB,
        result: stepCalculations?.result ?? -1
      });
    }

    if(!checkStatus) {
      if(!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Ops!", "Você errou, confira os cálculos e tente novamente!", "error");
        playSound("/sounds/incorrect.mp3");
      }
      newGame = getGameInputCalculationsInError(newGame);
    }

    return {newGame, checkStatus};
  }, [createAlert, getGameInputCalculationsInError, getGameInputCalculationsRemoveError]);

  const checkCalculationsStep = useCallback((prevGame: Game) => {
    let newGame = {...prevGame};
    let checkStatus = false;

    ({newGame, checkStatus} = checkExpression(newGame));

    if(checkStatus) {
      ({newGame, checkStatus} = checkCalculations(newGame));
    }

    if(!checkStatus) {
      return {newGame, checkStatus};
    } 

    if(!challengeIsComplete(prevGame)) {
      if (!alertLockRef.current) {
        alertLockRef.current = true;
        createAlert("Parabéns!", "Você acertou!", "success");
        playSound("/sounds/correct.mp3");
      }
    }

    newGame = getGameCalculationsClear(newGame)
    
    return {newGame, checkStatus};

  }, [checkExpression, getGameCalculationsClear, createAlert, challengeIsComplete, checkCalculations]);

  const checkButtonOnClick = useCallback(() => {
    goToTopOfChallenge();

    alertLockRef.current = false;

    setGame(prevGame => {
      if (!prevGame) return prevGame;

      let newGame = {...prevGame};
      let checkStatus = false;
  
      const challenge = prevGame.challenges[prevGame.currentChallenge];
      const step = challenge?.steps[prevGame.currentStep];
    
      if(step.checkType == "Tree") {
        ({newGame, checkStatus} = checkTreeStep(prevGame, challenge.problem, step.checkTree as CheckTree));
      } else if(step.checkType == "Probability") {
        ({newGame, checkStatus} = checkProbabilityStep(prevGame));
      } else {
        ({newGame, checkStatus} = checkCalculationsStep(prevGame));
      }

      if(!checkStatus) {
        return newGame;
      }

      if(challengeIsComplete(newGame)) {
        newGame = getGameDisabledCalculationsBoard(newGame);

        if(gameIsComplete(newGame)) {
          newGame = getGameFinishedButtonsStates(newGame);
          newGame = getGameFinishedNewInstructions(newGame);

          if (!alertLockRef.current) {
            alertLockRef.current = true;
            createAlert("Parabéns!", "Você acertou! Parabéns por finalizar todos os desafios!", "success");
            playSound("/sounds/gameFinished.mp3");
          }
        }
        else {
          newGame = getGameChallengeFinishedButtonsStates(newGame);
          newGame = getGameChallengeFinishedNewInstructions(newGame);

          if (!alertLockRef.current) {
            alertLockRef.current = true;
            createAlert("Parabéns!", "Você acertou! Passe para o próximo desafio.", "success");;
            playSound("/sounds/challengeFinished.mp3");
          }
        }

      } else {
        newGame = getGameToNextStep(newGame);

        if(newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep].checkType == "Probability") {
          newGame = getGameWithEventsDisabled(newGame);
          newGame = getGameDisabledEventBoard(newGame);
          newGame = getGameActivedProbabilityBoard(newGame);
        }
        else if(newGame.challenges[newGame.currentChallenge].steps[newGame.currentStep].checkType == "Calculations") {
          newGame = getGameActivedCalculationsBoard(newGame);
        }
      }

      return newGame;
    });
  }, [setGame, checkTreeStep, challengeIsComplete,  getGameWithEventsDisabled, getGameChallengeFinishedButtonsStates, getGameToNextStep, getGameChallengeFinishedNewInstructions, getGameFinishedNewInstructions, gameIsComplete, createAlert, getGameFinishedButtonsStates, getGameDisabledEventBoard, getGameActivedProbabilityBoard, checkProbabilityStep, getGameActivedCalculationsBoard, checkCalculationsStep, getGameDisabledCalculationsBoard]);

  const clearTreeStep = useCallback((prevGame: Game): Game => {
    if (!alertLockRef.current) {
      alertLockRef.current = true;

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
            playSound("/sounds/clear.mp3");
            goToTopOfChallenge();
        }
      });
    }

    return prevGame;
  }, [createAlert, updateModal]);

  const clearProbabilityStep = useCallback((prevGame: Game): Game => {
    if (!alertLockRef.current) {
      alertLockRef.current = true;
      updateModal({
        title: "Limpando marcações", 
        description:"Você gostaria de limpar as marcações da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          setGame({ 
            ...prevGame,
              challenges: prevGame.challenges.map((challenge, challengeIndex): Challenge => {
                if (challengeIndex === prevGame.currentChallenge) {
                  const updatedProbabilities = challenge.problem.probabilitiesToAssemble.map((probability) => {
                    return { ...probability, selected: false};
                  });

                  const updatedEventsTree = challenge.problem.eventsTree.map((eventTree) => {
                    return { 
                      ...eventTree, 
                      probability: {
                        ...eventTree.probability,
                        selected: false,
                        probabilityText: '',
                        probabilityOfOccurring: -1
                      }
                    };
                  });
                  return {
                    ...challenge,
                    problem: {
                      ...challenge.problem,
                      probabilitiesToAssemble: updatedProbabilities,
                      eventsTree: updatedEventsTree
                    }
                  };
                }
                return challenge;
              })
            });
            goToTopOfChallenge();
            createAlert("Eventos", "Todas as marcações dos eventos foram limpas.", "info");
            playSound("/sounds/clear.mp3");
        }
      });
    }

    return prevGame;
  }, [createAlert, updateModal]);

  const clearCalculationStep = useCallback((prevGame: Game): Game => {
    if (!alertLockRef.current) {
      alertLockRef.current = true;

      updateModal({
        title: "Limpando expressões e cálculos", 
        description:"Você gostaria de limpar as expressões e cálculos da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          setGame(getGameCalculationsClear(prevGame));
          goToTopOfChallenge();
          createAlert("Eventos", "Todas as marcações dos eventos foram limpas.", "info");
          playSound("/sounds/clear.mp3");
        }
      });
    }

    return prevGame;
  }, [createAlert, updateModal, getGameCalculationsClear]);

  const clearButtonOnClick = useCallback(() => {
    alertLockRef.current = false;
    setGame(prevGame => {
      if (!prevGame) return prevGame;
  
      const challenge = prevGame.challenges[prevGame.currentChallenge];
      const step = challenge?.steps[prevGame.currentStep];
    
      if(step.checkType == "Tree") {
        return clearTreeStep(prevGame);
      } else if(step.checkType == "Probability") {
        return clearProbabilityStep(prevGame);
      }

      return clearCalculationStep(prevGame)
    });
  }, [clearTreeStep, clearProbabilityStep, clearCalculationStep]);

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
          inputHelperText: ""
        };
      });
    

      challenge.problem.eventsTree = challenge.problem.eventsTree.map((event) => {
        return {
          ...event,
          show: false,
          probability: {
            selected: false,
            disabled: false,
            show: false
          }
        };
      });

      challenge.problem.probabilitiesToAssemble = challenge.problem.probabilitiesToAssemble?.map((probability) => {
        return {
          ...probability,
          selected: false,
          disabled: false,
          show: false,
        };
      });

      challenge.problem.boardEventsDisabled = false;
      challenge.problem.boardProbabilityDisabled = true;
      challenge.problem.boardCalculationsDisabled = true;
      challenge.problem.calculationsEventA = {
        value: ' ',
        disabled: true,
        error: false
      }
      challenge.problem.calculationsOperation = {
        value: ' ',
        disabled: true,
        error: false,
        options: operationsOptions
      }
      challenge.problem.calculationsEventB = {
        value: ' ',
        disabled: true,
        error: false
      }

      challenge.problem.calculationsResult = {
        value: '',
        disabled: true,
        error: false
      }

      challenge.problem.calculationsHistory = [];
      
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
          playSound("/sounds/clear.mp3");
          startGame();
          goToTopOfChallenge();
        }
    });
  }, [createAlert, updateModal, startGame]);

  useEffect(() => {
    startGame();
  }, []);

  return { game, setGame, alerts, updateAlert, deleteAlerts, modal, updateModal};
};
