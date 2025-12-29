'use client'

import { useState, useEffect} from 'react';

type CheckType = "Tree" | "Probability" | "ProbabilityWithIntersection";

interface Event {
  description: string;
  label?: string;
  probabilityOfOccurring: number;
  parentEvent?: Event;
  childrenEvents?: Event[];
  level: number;
}

interface Problem {
  description: string;
  events: Event[];
}

interface CheckTree {
  levelToAssemble?: number;
  parentEvent?: Event;
}

interface CheckProbabilityWithIntersection {
  events: Event[];
}

interface Step {
  instructions: string;
  checkType: CheckType;
  checkTree?: CheckTree;
  checkProbabilityWithIntersection?: CheckProbabilityWithIntersection;
}

interface Challenge {
  problem: Problem;
  steps: Step[];
  currentStep: number;
}

export interface Game {
  currentChallenge: number;
  challenges: Challenge[];
}

const generateRandomPartitionTwoDecimals = (partsCount: number) => {
  const rawValues = Array.from(
    { length: partsCount },
    () => Math.random()
  );

  const rawSum = rawValues.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );

  let normalizedValues = rawValues.map(
    value => value / rawSum
  );

  normalizedValues = normalizedValues.map(
    value => Math.round(value * 10000) / 10000
  );

  const roundingError = +(
    1 - normalizedValues.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    )
  ).toFixed(4);

  const indexOfLargestValue = normalizedValues.indexOf(
    Math.max(...normalizedValues)
  );

  normalizedValues[indexOfLargestValue] = +(
    normalizedValues[indexOfLargestValue] + roundingError
  ).toFixed(4);

  return normalizedValues;
}

const getChallengeOne = (): Challenge => {
  const levelOneProbabilities = generateRandomPartitionTwoDecimals(2);
  const event1 : Event = {
    description: "Feminino",
    probabilityOfOccurring: levelOneProbabilities[0],
    level: 1,
  };
  const event2 : Event = {
    description: "Masculino",
    probabilityOfOccurring: levelOneProbabilities[1],
    level: 1,
  };

  const levelTwoProbabilitiesEvent1 = generateRandomPartitionTwoDecimals(3);
  const event3 : Event = {
    description: "Primeiro Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[0],
    parentEvent: event1,
    level: 2,
  };
  const event4 : Event = {
    description: "Segundo Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[1],
    parentEvent: event1,
    level: 2,
  };
  const event5 : Event = {
    description: "Terceiro Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent1[2],
    parentEvent: event1,
    level: 2,
  };
  event1.childrenEvents = [event3, event4, event5];

  const levelTwoProbabilitiesEvent2 = generateRandomPartitionTwoDecimals(3);
  const event6 : Event = {
    description: "Primeiro Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[0],
    parentEvent: event2,
    level: 2,
  };
  const event7 : Event = {
    description: "Segundo Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[1],
    parentEvent: event2,
    level: 2,
  };
  const event8 : Event = {
    description: "Terceiro Ano",
    probabilityOfOccurring: levelTwoProbabilitiesEvent2[2],
    parentEvent: event2,
    level: 2,
  };
  event2.childrenEvents = [event6, event7, event8];

  const problem: Problem = {
    description: `<p className="ds-body">
    <span className="ds-body-large text-brand-otimath-pure"><strong>Problema:</strong></span>
    <br />  Na gincana anual do Colégio Universitário, <strong>${(event1.probabilityOfOccurring*100).toFixed(2)}%</strong> dos alunos presentes são do <strong>sexo feminino.</strong> 
    <br /><strong>Entre as meninas, ${(event3.probabilityOfOccurring*100).toFixed(2)}%</strong> são do <strong>primeiro ano,</strong> <strong>${(event4.probabilityOfOccurring*100).toFixed(2)}%</strong> são do <strong>segundo ano</strong> e <strong>${(event5.probabilityOfOccurring*100).toFixed(2)}%</strong> são do <strong>terceiro ano.</strong> 
    <br /><strong>Entre os meninos</strong>, esses percentuais são <strong>${(event6.probabilityOfOccurring*100).toFixed(2)}%, ${(event7.probabilityOfOccurring*100).toFixed(2)}% e ${(event8.probabilityOfOccurring*100).toFixed(2)}%</strong> respectivamente.
    </p>`,
    events: [event1, event2],
  };

  const stepOne: Step = {
    instructions: `<p className="ds-body"> 
                    <span className="ds-body-large text-brand-otimath-pure"><strong>Instruções:</strong></span>
                    <br /> Construa a árvore de probabilidade que representa a distribuição dos alunos do Colégio Universitário participantes da gincana anual. 
                    <br /> <strong> Identifique, marque e nomeie os eventos</strong> correspondentes ao <strong> primeiro nível</strong> da árvore.
                    <br /> Ao finalizar, clique no <strong>Botão Conferir</strong> para verificar sua resposta ou no <strong>Botão Limpar</strong> para reiniciar a atividade.
                  </p>`,
    checkType: "Tree",
    checkTree: {
      levelToAssemble: 1,
    },
  };

  const challenge: Challenge = {
    problem: problem,
    steps: [stepOne],
    currentStep: 0,
  };

  return challenge;
}

const getNewGame = (): Game => {
  const challenges: Challenge[] = [];
  challenges.push(getChallengeOne());
  
  return { challenges, currentChallenge: 0  };
};

export const useTreeHooks = () => {
  const [game, setGame] = useState<Game>(() => getNewGame());

  return { game };
};
