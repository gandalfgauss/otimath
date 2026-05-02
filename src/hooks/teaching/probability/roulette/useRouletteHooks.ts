'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAlerts } from '@/hooks/global/useAlerts';
import { useModal } from '@/hooks/global/useModal';
import { playSound } from '@/hooks/global/useSound';
import { RouletteSector } from '@/components/teaching/probability/roulette/Roulette';
import { FrequencyData } from '@/components/teaching/probability/roulette/RouletteTable';
import { ChartData } from '@/components/teaching/probability/roulette/RouletteChart';
import { TextInputInterface } from '@/components/global/TextInput';
import { QuestionOption } from '@/components/teaching/probability/roulette/RouletteQuestion';
import { AlertType } from '@/components/global/Alert';
import { logTransition, logAttempt, logText, logBet, logSpinResult, downloadLog, getLogSummary } from './useRouletteLog';

// Cores disponíveis para o disco
const AVAILABLE_COLORS = ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Roxo', 'Rosa'];

// Conjunto de distratores para a pergunta do experimento aleatório
const DISTRACTORS = [
  'Calcular a probabilidade de cada cor aparecer no disco.',
  'Contar quantas regiões de cada cor existem no disco.',
  'Medir o ângulo central de cada setor colorido do disco.',
  'Escolher uma cor antes do giro e verificar se o ponteiro para nela.',
  'Girar o disco 10 vezes e registrar a sequência de cores obtida.',
  'Comparar se as cores têm a mesma chance, observando o tamanho dos setores.',
  'Ajustar a força do giro do ponteiro para tentar obter uma cor específica.',
  'Sortear uma cor de uma lista com as cores do disco.',
  'Observar se o ponteiro para mais vezes em cores claras do que em escuras.',
  'Registrar o tempo que o ponteiro leva para parar em cada giro.',
  'Verificar se o ponteiro para exatamente na linha que separa duas cores.',
  'Sem girar o disco, escolher ao acaso um setor e anotar a cor dele.',
  'Girar o disco e anotar a cor obtida em um giro específico.',
  'Ao girar o disco, determinar qual cor tem maior probabilidade de ocorrer.',
  'Dividir o disco em cores iguais antes de realizar o giro.',
  'Verificar se todas as cores do disco aparecem após vários giros.',
  'Selecionar apenas os giros em que o ponteiro do disco para na cor azul.'
];

// Sinônimos para variação linguística da resposta correta
const SYNONYMS = {
  girar: ['girar', 'rodar', 'acionar'],
  observar: ['observar', 'verificar', 'registrar'],
  parou: ['parou', 'indicou', 'apontou'],
  daRegiao: ['do setor circular', 'do setor', 'da área', 'da superfície', 'da região circular setorial', 'da fatia circular', 'da região'],
  ponteiro: ['o ponteiro', 'o indicador', 'a agulha', 'o marcador', 'a seta indicadora']
};

// Propriedades numéricas para o Desafio Dinâmico 1 (conjunto completo atualizado)
const NUMERIC_PROPERTIES = [
  'ímpar',
  'par',
  'primo',
  'não primo',
  'composto',
  'divisível por 3',
  'divisível por 4',
  'divisível por 5',
  'primo ímpar',
  'primo par',
  'múltiplo de 2 e 3 ao mesmo tempo',
  'múltiplo de 3',
  'múltiplo de 4',
  'múltiplo de 5',
  'múltiplo de 6',
  'múltiplo de 3 e 4 ao mesmo tempo',
  'divisor de 2',
  'divisor de 3',
  'divisor de 4',
  'divisor de 5',
  'divisor de 6',
  'divisor de 7',
  'divisor de 8',
  'divisor de 9',
  'divisor de 10',
  'divisor de 11',
  'divisor de 12',
  'divisor de qualquer número natural',
  'maior que p',
  'menor que p'
];

// Exemplos de experimentos determinísticos (sorteados aleatoriamente)
const DETERMINISTIC_EXAMPLES = [
  'Escolher um número natural par e verificar se ele é divisível por 2.',
  'Somar dois números naturais previamente fixados.',
  'Calcular o resto da divisão de um número natural por 3.',
  'Resolver uma equação do 1º grau com coeficientes dados.',
  'Determinar o máximo divisor comum de dois números fixos.',
  'Calcular a soma dos ângulos internos de um polígono convexo de n lados.',
  'Verificar se um número natural dado é primo.',
  'Determinar o valor de uma potência com expoente natural.',
  'Calcular a média aritmética de um conjunto fixo de números.',
  'Converter uma unidade de medida.',
  'Construir um triângulo conhecendo seus três lados.',
  'Traçar a bissetriz de um ângulo dado.',
  'Determinar a área de um círculo de raio conhecido.',
  'Calcular o comprimento de uma circunferência de raio fixo.',
  'Verificar se três segmentos dados formam um triângulo.',
  'Determinar o ponto médio de um segmento de reta.',
  'Calcular o volume de um paralelepípedo reto-retângulo.',
  'Verificar se um quadrilátero é um losango, dados seus lados.',
  'Aplicar uma simetria axial a uma figura plana.',
  'Rotacionar uma figura em torno de um ponto por um ângulo fixo.',
  'Traçar a mediatriz de um segmento de reta com régua e compasso.',
  'Construir um mosaico seguindo uma regra geométrica fixa.',
  'Aplicar uma transformação geométrica (rotação ou reflexão) a uma figura.',
  'Medir o comprimento de um objeto com régua graduada.',
  'Medir a massa de um corpo em uma balança calibrada.',
  'Medir um intervalo de tempo fixo com cronômetro.',
  'Aquecer água até a ebulição em condições ideais.',
  'Determinar a densidade de um corpo conhecendo sua massa e volume.',
  'Acionar um interruptor em um circuito simples e observar a lâmpada acender.',
  'Aquecer um fio metálico e observar sua dilatação.',
  'Refletir um raio de luz em um espelho plano e verificar o ângulo de reflexão.',
  'Fazer um objeto deslizar em um plano inclinado sem atrito ideal.',
  'Girar uma engrenagem conectada a outra e observar o sentido oposto do movimento.',
  'Misturar vinagre e bicarbonato e observar a liberação de gás carbônico.',
  'Passar corrente elétrica por um fio de níquel-cromo e observar o aquecimento.',
  'Comprimir uma mola e medir sua deformação (Lei de Hooke).',
  'Colocar um objeto em água e observar se ele afunda ou flutua, com densidade conhecida.',
  'Incidir luz branca em um prisma e observar a decomposição em cores.',
  'Girar uma roldana simples com carga conhecida.',
  'Medir a corrente elétrica em um circuito com tensão e resistência fixas.',
  'Determinar a resistência equivalente de resistores ligados em série.',
  'Medir o empuxo exercido sobre um corpo totalmente imerso em um fluido.',
  'Determinar o período de oscilação de um pêndulo simples de comprimento fixo.',
  'Determinar a trajetória de um projétil lançado com velocidade e ângulo fixos.',
  'Verificar a conservação da energia mecânica em um sistema ideal.',
  'Escolher uma carta previamente conhecida de um baralho.',
  'Retirar uma bola de uma urna contendo apenas bolas brancas.',
  'Girar um disco com apenas um setor.',
  'Lançar um dado cujas faces possuem todas o mesmo número.',
  'Sortear um número de um conjunto unitário.',
  'Abrir um arquivo digital salvo e verificar que o conteúdo não se altera.',
  'Executar um algoritmo determinístico com entradas fixas.',
  'Resolver um labirinto sem bifurcações.',
  'Empilhar blocos idênticos seguindo uma regra fixa de montagem.',
  'Programar um robô para andar três passos, virar à direita e andar mais dois.',
  'Dobrar uma folha ao meio repetidas vezes e observar o padrão de dobras.',
  'Acionar uma sequência de dominós em linha reta (efeito dominó).',
  'Inserir uma senha correta em um sistema e obter acesso.',
  'Apertar o botão de um elevador e deslocar-se ao andar selecionado.',
  'Programar uma simulação computacional sem geração aleatória.',
  'Montar um cubo mágico resolvido seguindo um algoritmo fixo.',
  'Medir o tempo de um cronômetro eletrônico para um intervalo previamente fixado.',
  'Executar um experimento virtual com parâmetros fixos e sem sorteio.',
  'Inserir uma moeda em uma máquina automática que libera sempre o mesmo produto.'
];

// Exemplos de experimentos aleatórios (sorteados aleatoriamente)
const RANDOM_EXAMPLES = [
  'Lançar uma moeda e observar a face de cima.',
  'Lançar um dado e observar o número da face de cima.',
  'Lançar duas moedas e observar as sequências de caras e coroas obtidas.',
  'Lançar duas moedas e observar o número de caras obtidas.',
  'De um lote de 80 peças boas e 20 defeituosas, selecionar 10 peças e observar o número de peças defeituosas.',
  'De uma urna contendo 3 bolas vermelhas e 2 bolas brancas, selecionar uma bola e observar sua cor.',
  'De um baralho de 52 cartas, selecionar uma carta e observar seu naipe.',
  'Numa cidade onde 10% dos habitantes possuem determinada moléstia, selecionar 20 pessoas e observar o número de portadores da moléstia.',
  'Observar o tempo que um certo aluno gasta para ir de ônibus de sua casa até a escola.',
  'Injetar uma dose de insulina em uma pessoa e observar a quantidade de açúcar que diminuiu.',
  'Sujeitar uma barra metálica à tração e observar sua resistência.',
  'Lançar três moedas e observar o número de caras obtidas.',
  'Lançar dois dados e observar a soma dos números obtidos.',
  'Lançar dois dados e observar o maior número obtido.',
  'Retirar uma carta de um baralho e observar se ela é vermelha ou preta.',
  'Retirar duas cartas de um baralho, sem reposição, e observar a sequência obtida.',
  'De uma urna contendo bolas numeradas de 1 a 10, retirar uma bola e observar o número sorteado.',
  'De uma urna com bolas numeradas, retirar duas bolas e observar o produto dos números obtidos.',
  'Selecionar ao acaso um aluno de uma turma e observar sua idade.',
  'Observar o número de faltas cometidas por um aluno durante um mês letivo.',
  'Observar a altura de uma pessoa escolhida ao acaso em uma população.',
  'Observar o tempo de vida útil de uma lâmpada escolhida aleatoriamente.',
  'Medir a quantidade de chuva que cai em um dia escolhido ao acaso.',
  'Selecionar um veículo que passa por uma via e observar sua cor.',
  'Selecionar uma família e observar o número de filhos.',
  'Observar o número de clientes que entram em uma loja durante uma hora escolhida ao acaso.',
  'Selecionar um produto de uma linha de produção e observar se ele é defeituoso ou não.',
  'Lançar um disco numerado e observar o número obtido.',
  'Observar o tempo de espera de um cliente em uma fila de banco.',
  'Selecionar um eleitor e observar sua faixa etária.',
  'Girar um disco e observar a cor indicada pelo ponteiro quando o disco entra em repouso.',
  'Atirar um dardo em um alvo e observar a região atingida.',
  'Sortear um subconjunto de 6 números pertencentes ao conjunto dos números naturais de 1 a 60.',
  'De uma caixa com 24 lápis de cor iguais em tamanho, escolher um lápis ao acaso e observar a sua cor.',
  'Retirar sucessivamente três bolas de uma caixa e observar a sequência de números impressos nas bolas sorteadas.',
  'Sortear as letras de uma palavra, uma a uma, ao acaso, e verificar o anagrama formado na sequência das retiradas.',
  'Montar um sorvete de duas bolas escolhendo dois sabores ao acaso em um cardápio de dez sabores.',
  'Produzir 1000 peças em uma máquina e retirar uma peça, verificando se a peça é boa ou defeituosa.',
  'Sortear ao acaso um número em um subconjunto dos números naturais e verificar sua paridade.',
  'Sortear ao acaso um número em um subconjunto dos números naturais e verificar a primalidade.',
  'Sortear ao acaso um número em um subconjunto dos números naturais e verificar se é divisível por 7.',
  'Lançar dois dados e verificar se a soma dos números das faces voltadas para cima é um número primo.',
  'Selecionar ao acaso uma pessoa de uma população e verificar se ela é portadora de determinada doença.',
  'Selecionar 30 pacientes de um hospital e observar o número de doentes diagnosticados com uma moléstia específica.',
  'De um grupo de pacientes submetidos a um exame clínico, observar quantos apresentam resultado positivo.',
  'Selecionar ao acaso um prontuário médico e observar se o paciente apresenta uma doença crônica.',
  'Em uma cidade onde 5% da população é portadora de determinada doença, selecionar 50 pessoas e observar o número de doentes.',
  'Selecionar ao acaso um paciente de um ambulatório e observar se ele apresenta sintomas de determinada enfermidade.',
  'De um grupo de pacientes internados, observar o número de portadores de uma infecção específica.',
  'Selecionar 20 exames laboratoriais realizados em um dia e observar quantos indicam presença de doença.',
  'Escolher aleatoriamente um morador de uma região e observar se ele é portador de uma doença contagiosa.',
  'Selecionar um paciente atendido em um pronto-socorro e observar se ele necessita de isolamento médico.'
];

// Características do experimento aleatório (todas são verdadeiras)
const RANDOM_EXPERIMENT_CHARACTERISTICS = [
  'Não é possível prever com certeza o resultado antes de sua realização, mesmo repetindo o experimento nas mesmas condições.',
  'O conjunto de resultados possíveis é conhecido previamente.',
  'Cada realização do experimento produz exatamente um resultado, entre todos os resultados possíveis.',
  'O resultado observado depende do acaso, e não apenas de uma regra fixa ou determinística.',
  'O experimento pode ser repetido indefinidamente, mantendo as mesmas condições iniciais.',
  'Resultados diferentes podem ocorrer em repetições distintas do experimento.',
  'É possível associar uma "chance" numérica aos resultados ou a conjuntos de resultados.'
];

// ─────────────────────────────────────────────────────────────────
// Lista ordenada de subSteps por etapa — usada exclusivamente pelo
// painel de DEV da Sequência Didática para navegar livremente entre
// "ceninhas" do disco. Cada entrada DEVE corresponder a um subStep que
// efetivamente renderiza UI (verificado contra os blocos `if (stage === N
// && subStep === X)` no checkAnswer + JSX guards no RouletteGame). Não
// inclui subSteps puramente intermediários (sem renderização própria),
// pois eles deixariam a tela em branco.
// ─────────────────────────────────────────────────────────────────
export const ROULETTE_STAGE_PHASES: Record<number, number[]> = {
  1: [
    0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6,
    1, 1.1, 1.17, 1.25, 1.5,
    2, 3, 3.4, 3.45, 3.5, 3.6,
    4, 4.5, 5, 5.5, 5.55, 5.7, 5.75, 5.8, 5.9,
    6, 6.1, 6.2, 6.3, 6.35, 6.36, 6.37, 6.38, 6.4,
    6.41, 6.42, 6.43, 6.44, 6.45,
    6.55, 6.56, 6.6, 6.65, 6.66, 6.67, 6.68, 6.69, 6.70,
    6.80, 6.85, 6.86, 6.87, 6.88, 6.90, 6.91, 6.92, 6.93,
    6.5,
    7, 7.1, 7.5, 7.6,
    8, 8.5, 8.6,
    9, 9.5,
    10, 11, 11.5, 11.6,
    12, 13, 14,
    15, 15.5, 15.6, 15.7, 16,
  ],
  2: [
    0, 0.15, 0.16, 0.17, 0.18, 0.185, 0.19, 0.191,
    2, 2.1, 2.2, 2.3, 2.4, 2.9,
    3, 4, 5, 5.1, 5.2,
    6, 6.101, 6.201, 6.202, 6.204,
    7, 8, 9.1, 9.2, 9.3,
    11, 12,
  ],
  3: [0.5, 1.5, 1.75, 2, 3, 4, 5, 6, 7, 8, 8.2, 8.4],
};

// Função auxiliar para verificar se um número é primo
function isPrime(num: number): boolean {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

// Função para verificar se um número satisfaz uma propriedade
// O parâmetro valorP é usado apenas para propriedades "maior que p" e "menor que p"
function checkProperty(num: number, property: string, valueP?: number): boolean {
  switch (property) {
    case 'ímpar':
      return num % 2 !== 0;
    case 'par':
      return num % 2 === 0;
    case 'primo':
      return isPrime(num);
    case 'não primo':
      return !isPrime(num);
    case 'composto':
      // Composto: número > 1 que não é primo
      return num > 1 && !isPrime(num);
    case 'divisível por 3':
      return num % 3 === 0;
    case 'divisível por 4':
      return num % 4 === 0;
    case 'divisível por 5':
      return num % 5 === 0;
    case 'primo ímpar':
      // Primo ímpar: primos diferentes de 2 (3, 5, 7, 11, ...)
      return isPrime(num) && num !== 2;
    case 'primo par':
      // Primo par: exclusivamente o número 2
      return num === 2;
    case 'múltiplo de 2 e 3 ao mesmo tempo':
      // Equivale a múltiplo de 6
      return num % 6 === 0;
    case 'múltiplo de 3':
      return num % 3 === 0;
    case 'múltiplo de 4':
      return num % 4 === 0;
    case 'múltiplo de 5':
      return num % 5 === 0;
    case 'múltiplo de 6':
      return num % 6 === 0;
    case 'múltiplo de 3 e 4 ao mesmo tempo':
      // Equivale a múltiplo de 12
      return num % 12 === 0;
    case 'divisor de 2':
      return 2 % num === 0; // 1, 2
    case 'divisor de 3':
      return 3 % num === 0; // 1, 3
    case 'divisor de 4':
      return 4 % num === 0; // 1, 2, 4
    case 'divisor de 5':
      return 5 % num === 0; // 1, 5
    case 'divisor de 6':
      return 6 % num === 0; // 1, 2, 3, 6
    case 'divisor de 7':
      return 7 % num === 0; // 1, 7
    case 'divisor de 8':
      return 8 % num === 0; // 1, 2, 4, 8
    case 'divisor de 9':
      return 9 % num === 0; // 1, 3, 9
    case 'divisor de 10':
      return 10 % num === 0; // 1, 2, 5, 10
    case 'divisor de 11':
      return 11 % num === 0; // 1, 11
    case 'divisor de 12':
      return 12 % num === 0; // 1, 2, 3, 4, 6, 12
    case 'divisor de qualquer número natural':
      // Exclusivamente o número 1
      return num === 1;
    case 'maior que p':
      return valueP !== undefined && num > valueP;
    case 'menor que p':
      return valueP !== undefined && num < valueP;
    default: {
      // Suporta o formato "mutado" `maior que N` / `menor que N` salvo em
      // challenge1PropertyY pelo restartChallenge1 (que substitui o `p`
      // canônico pelo valor sorteado para fins de exibição). Sem isso a
      // validação em 6.66/6.67/6.68 sempre retorna false para a condição
      // numérica e a resposta correta do aluno é rejeitada.
      const matchMaior = property.match(/^maior que (\d+)$/);
      if (matchMaior) return num > parseInt(matchMaior[1], 10);
      const matchMenor = property.match(/^menor que (\d+)$/);
      if (matchMenor) return num < parseInt(matchMenor[1], 10);
      return false;
    }
  }
}

// Função para gerar números distintos para os setores
function generateSectorNumbers(n: number, p: number): number[] {
  // Gerar conjunto {1, 2, ..., p}
  const fullSet = Array.from({ length: p }, (_, i) => i + 1);

  // Embaralhar e pegar os primeiros n números
  const shuffled = [...fullSet].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Função para verificar se existe pelo menos um número que satisfaz a propriedade
function hasFavorableCase(nums: number[], property: string, valueP?: number): boolean {
  return nums.some(num => checkProperty(num, property, valueP));
}

// === Tipos para exemplos de eventos mutuamente exclusivos (subStep 6.55) ===
// Categorias de exemplos disjuntos
type DisjointCategory =
  | 'cor_simples_x_cor_simples'       // A={Azul}, B={Vermelho}
  | 'cor_simples_x_cor_composta'      // A={Azul}, B={Vermelho ou Verde}
  | 'cor_composta_x_cor_composta'     // A={Azul ou Verde}, B={Vermelho ou Amarelo}
  | 'num_simples_x_num_simples'       // A={número 3}, B={número 7}
  | 'num_simples_x_num_composto'      // A={número 3}, B={número par}
  | 'num_composto_x_num_composto';    // A={par}, B={ímpar}

interface DisjointExampleMeta {
  category: DisjointCategory;  // categoria usada
}

interface DisjointExampleResult {
  textA: string;
  textB: string;
  setA: string;
  setB: string;
  indicesA: number[];  // índices dos setores do evento A
  indicesB: number[];  // índices dos setores do evento B
  needsNumbers: boolean;  // se o exemplo precisa de números visíveis no disco
  meta: DisjointExampleMeta;
}

// === Tipos para a fase de Probabilidade da União de Eventos ME (subStep 6.56) ===
type UnionPhase =
  | 'definition1'        // Primeira tela de definição (InfoBox)
  | 'definition2'        // Segunda tela de definição (InfoBox)
  | 'selecting'          // Aluno marcando setores do evento atual
  | 'filling_prob'       // Aluno digitando P(evento) como fração
  | 'final_calc'         // Aluno calculando P(A∪B∪...) como fração
  | 'activity_success'   // Atividade concluída com sucesso
  | 'all_done';          // Todas as atividades concluídas

interface UnionEvent {
  label: string;           // "A", "B", "C", "D", "E", "F"
  description: string;     // "ocorrer a cor Vermelho"
  sectorIndices: number[]; // índices corretos dos setores
  probNumerator: number;   // n(evento)
  probDenominator: number; // n(S)
  completed: boolean;      // se a probabilidade já foi confirmada
}

const EVENT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Propriedades numéricas para eventos compostos com números
const DISJOINT_PROPERTY_PAIRS: [string, string][] = [
  ['par', 'ímpar'],
  ['primo', 'composto'],
];

const DISJOINT_SIMPLE_PROPERTIES = [
  'par', 'ímpar', 'primo', 'composto',
  'múltiplo de 3', 'múltiplo de 5',
];

// Helpers (usados apenas pelo gerador de exemplos disjuntos)
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function indicesByProperty(nums: number[], prop: string): number[] {
  return nums.map((_, i) => i).filter(i => checkProperty(nums[i], prop));
}

function formatSet(indices: number[], colors: string[], nums: number[], useNumbers: boolean): string {
  if (indices.length === 0) return '∅';
  const items = indices.map(i =>
    useNumbers ? `${colors[i]}(${nums[i]})` : colors[i]
  );
  return `{${items.join(', ')}}`;
}

function formatColorsLabel(colorsArr: string[]): string {
  if (colorsArr.length === 1) return `ocorrer a cor ${colorsArr[0]}`;
  return `ocorrer a cor ${colorsArr.slice(0, -1).join(', ')} ou ${colorsArr[colorsArr.length - 1]}`;
}

// === Gerador de exemplos disjuntos por categoria (subStep 6.55) ===
function generateDisjointExample(
  sectors: RouletteSector[],
  sectorNums: number[],
  lastMeta: DisjointExampleMeta | null
): DisjointExampleResult {
  const n = sectors.length;
  const colors = sectors.map(s => s.colorName);
  const uniqueColors = [...new Set(colors)];
  const omega = Array.from({ length: n }, (_, i) => i);

  // Montar lista de categorias possíveis com base no disco atual
  const possibleCategories: DisjointCategory[] = [];

  // Cor simples × cor simples: precisa de pelo menos 2 cores distintas
  if (uniqueColors.length >= 2) possibleCategories.push('cor_simples_x_cor_simples');
  // Cor simples × cor composta: precisa de pelo menos 3 cores distintas
  if (uniqueColors.length >= 3) possibleCategories.push('cor_simples_x_cor_composta');
  // Cor composta × cor composta: precisa de pelo menos 4 cores distintas
  if (uniqueColors.length >= 4) possibleCategories.push('cor_composta_x_cor_composta');
  // Número simples × número simples: precisa de pelo menos 2 números distintos
  const uniqueNums = [...new Set(sectorNums)];
  if (uniqueNums.length >= 2) possibleCategories.push('num_simples_x_num_simples');
  // Número simples × número composto: precisa de números com propriedades variadas
  if (sectorNums.length >= 2) possibleCategories.push('num_simples_x_num_composto');
  // Número composto × número composto: precisa de pares de propriedades disjuntas
  if (sectorNums.length >= 2) possibleCategories.push('num_composto_x_num_composto');

  // Evitar repetir a mesma categoria do exemplo anterior
  const semRepetir = possibleCategories.filter(c => c !== lastMeta?.category);
  const pool = semRepetir.length > 0 ? semRepetir : possibleCategories;
  const category = pool[Math.floor(Math.random() * pool.length)];

  // Tentar gerar o exemplo da categoria escolhida
  const result = tryGenerateCategory(category, sectors, sectorNums, colors, uniqueColors, omega, n);
  if (result) return result;

  // Se falhou, tentar outras categorias
  const otherPool = shuffleArray(possibleCategories.filter(c => c !== category));
  for (const cat of otherPool) {
    const res = tryGenerateCategory(cat, sectors, sectorNums, colors, uniqueColors, omega, n);
    if (res) return res;
  }

  // Fallback absoluto: duas cores distintas
  const shuffled = shuffleArray([...uniqueColors]);
  const idxA = omega.filter(i => colors[i] === shuffled[0]);
  const idxB = omega.filter(i => colors[i] === shuffled[1] || (shuffled.length < 2 && i !== idxA[0]));
  return {
    textA: `ocorrer a cor ${shuffled[0]}`,
    textB: `ocorrer a cor ${shuffled[1] || colors[idxB[0]]}`,
    setA: formatSet(idxA, colors, sectorNums, false),
    setB: formatSet(idxB, colors, sectorNums, false),
    indicesA: idxA,
    indicesB: idxB,
    needsNumbers: false,
    meta: { category: 'cor_simples_x_cor_simples' }
  };
}

// Tenta gerar um exemplo para uma categoria específica
function tryGenerateCategory(
  category: DisjointCategory,
  sectors: RouletteSector[],
  nums: number[],
  colors: string[],
  uniqueColors: string[],
  omega: number[],
  n: number
): DisjointExampleResult | null {

  // ============================================================
  // 1) COR SIMPLES × COR SIMPLES
  //    A = {uma cor}, B = {outra cor diferente}
  // ============================================================
  if (category === 'cor_simples_x_cor_simples') {
    if (uniqueColors.length < 2) return null;
    const shuffled = shuffleArray(uniqueColors);
    const colorA = shuffled[0];
    const colorB = shuffled[1];
    const idxA = omega.filter(i => colors[i] === colorA);
    const idxB = omega.filter(i => colors[i] === colorB);
    return {
      textA: `ocorrer a cor ${colorA}`,
      textB: `ocorrer a cor ${colorB}`,
      setA: formatSet(idxA, colors, nums, false),
      setB: formatSet(idxB, colors, nums, false),
      indicesA: idxA,
      indicesB: idxB,
      needsNumbers: false,
      meta: { category: 'cor_simples_x_cor_simples' }
    };
  }

  // ============================================================
  // 2) COR SIMPLES × COR COMPOSTA
  //    A = {uma cor}, B = {duas ou mais cores diferentes}
  // ============================================================
  if (category === 'cor_simples_x_cor_composta') {
    if (uniqueColors.length < 3) return null;
    const shuffled = shuffleArray(uniqueColors);
    const colorA = shuffled[0];
    const remainingItems = shuffled.filter(c => c !== colorA);
    // B com 2 cores (ou 3 se houver espaço, sem pegar todas)
    const countB = Math.min(2 + Math.floor(Math.random() * 2), remainingItems.length, uniqueColors.length - 2);
    const colorsB = remainingItems.slice(0, Math.max(2, countB));
    const idxA = omega.filter(i => colors[i] === colorA);
    const idxB = omega.filter(i => colorsB.includes(colors[i]));
    // Sortear se A é simples e B composto, ou inverso
    if (Math.random() < 0.5) {
      return {
        textA: `ocorrer a cor ${colorA}`,
        textB: formatColorsLabel(colorsB),
        setA: formatSet(idxA, colors, nums, false),
        setB: formatSet(idxB, colors, nums, false),
        indicesA: idxA,
        indicesB: idxB,
        needsNumbers: false,
        meta: { category: 'cor_simples_x_cor_composta' }
      };
    } else {
      return {
        textA: formatColorsLabel(colorsB),
        textB: `ocorrer a cor ${colorA}`,
        setA: formatSet(idxB, colors, nums, false),
        setB: formatSet(idxA, colors, nums, false),
        indicesA: idxB,
        indicesB: idxA,
        needsNumbers: false,
        meta: { category: 'cor_simples_x_cor_composta' }
      };
    }
  }

  // ============================================================
  // 3) COR COMPOSTA × COR COMPOSTA
  //    A = {2+ cores}, B = {2+ cores diferentes}
  // ============================================================
  if (category === 'cor_composta_x_cor_composta') {
    if (uniqueColors.length < 4) return null;
    const shuffled = shuffleArray(uniqueColors);
    // Dividir as cores em dois grupos (cada um com pelo menos 2)
    const half = Math.floor(shuffled.length / 2);
    const colorsA = shuffled.slice(0, Math.max(2, half));
    const colorsB = shuffled.slice(Math.max(2, half));
    if (colorsB.length < 2) return null; // precisa de pelo menos 2 em cada
    const idxA = omega.filter(i => colorsA.includes(colors[i]));
    const idxB = omega.filter(i => colorsB.includes(colors[i]));
    return {
      textA: formatColorsLabel(colorsA),
      textB: formatColorsLabel(colorsB),
      setA: formatSet(idxA, colors, nums, false),
      setB: formatSet(idxB, colors, nums, false),
      indicesA: idxA,
      indicesB: idxB,
      needsNumbers: false,
      meta: { category: 'cor_composta_x_cor_composta' }
    };
  }

  // ============================================================
  // 4) NÚMERO SIMPLES × NÚMERO SIMPLES
  //    A = {um número específico}, B = {outro número específico}
  // ============================================================
  if (category === 'num_simples_x_num_simples') {
    const uniqueNums = [...new Set(nums)];
    if (uniqueNums.length < 2) return null;
    const shuffled = shuffleArray(uniqueNums);
    const numA = shuffled[0];
    const numB = shuffled[1];
    const idxA = omega.filter(i => nums[i] === numA);
    const idxB = omega.filter(i => nums[i] === numB);
    return {
      textA: `ocorrer o número ${numA}`,
      textB: `ocorrer o número ${numB}`,
      setA: formatSet(idxA, colors, nums, true),
      setB: formatSet(idxB, colors, nums, true),
      indicesA: idxA,
      indicesB: idxB,
      needsNumbers: true,
      meta: { category: 'num_simples_x_num_simples' }
    };
  }

  // ============================================================
  // 5) NÚMERO SIMPLES × NÚMERO COMPOSTO (propriedade)
  //    A = {um número}, B = {propriedade que exclui esse número}
  // ============================================================
  if (category === 'num_simples_x_num_composto') {
    // Escolher um setor aleatório como âncora
    const s = omega[Math.floor(Math.random() * n)];
    const anchorNum = nums[s];
    // Procurar propriedade que o número âncora NÃO satisfaz
    const propsToTry = shuffleArray(DISJOINT_SIMPLE_PROPERTIES);
    for (const prop of propsToTry) {
      if (!checkProperty(anchorNum, prop)) {
        const idxB = indicesByProperty(nums, prop);
        if (idxB.length > 0 && !idxB.includes(s)) {
          const idxA = [s];
          // Sortear se A é simples e B composto, ou inverso
          if (Math.random() < 0.5) {
            return {
              textA: `ocorrer o número ${anchorNum}`,
              textB: `ocorrer número ${prop}`,
              setA: formatSet(idxA, colors, nums, true),
              setB: formatSet(idxB, colors, nums, true),
              indicesA: idxA,
              indicesB: idxB,
              needsNumbers: true,
              meta: { category: 'num_simples_x_num_composto' }
            };
          } else {
            return {
              textA: `ocorrer número ${prop}`,
              textB: `ocorrer o número ${anchorNum}`,
              setA: formatSet(idxB, colors, nums, true),
              setB: formatSet(idxA, colors, nums, true),
              indicesA: idxB,
              indicesB: idxA,
              needsNumbers: true,
              meta: { category: 'num_simples_x_num_composto' }
            };
          }
        }
      }
    }
    return null;
  }

  // ============================================================
  // 6) NÚMERO COMPOSTO × NÚMERO COMPOSTO
  //    A = {propriedade X}, B = {propriedade Y disjunta}
  // ============================================================
  if (category === 'num_composto_x_num_composto') {
    // Tentar pares naturalmente disjuntos primeiro (par/ímpar, primo/composto)
    const shuffledPairs = shuffleArray(DISJOINT_PROPERTY_PAIRS);
    for (const [propA, propB] of shuffledPairs) {
      const idxA = indicesByProperty(nums, propA);
      const idxB = indicesByProperty(nums, propB);
      if (idxA.length > 0 && idxB.length > 0) {
        // Verificar disjunção
        const setB = new Set(idxB);
        const hasIntersection = idxA.some(i => setB.has(i));
        if (!hasIntersection) {
          return {
            textA: `ocorrer número ${propA}`,
            textB: `ocorrer número ${propB}`,
            setA: formatSet(idxA, colors, nums, true),
            setB: formatSet(idxB, colors, nums, true),
            indicesA: idxA,
            indicesB: idxB,
            needsNumbers: true,
            meta: { category: 'num_composto_x_num_composto' }
          };
        }
      }
    }
    // Se nenhum par natural funcionou, tentar combinações livres
    const props = shuffleArray(DISJOINT_SIMPLE_PROPERTIES);
    for (let i = 0; i < props.length; i++) {
      const idxA = indicesByProperty(nums, props[i]);
      if (idxA.length === 0 || idxA.length >= n) continue;
      for (let j = i + 1; j < props.length; j++) {
        const idxB = indicesByProperty(nums, props[j]);
        if (idxB.length === 0) continue;
        const setB = new Set(idxB);
        const hasIntersection = idxA.some(k => setB.has(k));
        if (!hasIntersection) {
          return {
            textA: `ocorrer número ${props[i]}`,
            textB: `ocorrer número ${props[j]}`,
            setA: formatSet(idxA, colors, nums, true),
            setB: formatSet(idxB, colors, nums, true),
            indicesA: idxA,
            indicesB: idxB,
            needsNumbers: true,
            meta: { category: 'num_composto_x_num_composto' }
          };
        }
      }
    }
    return null;
  }

  return null;
}

// === Gerador de eventos mutuamente exclusivos para a fase de União (subStep 6.56) ===
// Propriedades numéricas simples para uso em eventos da união
const UNION_SIMPLE_NUM_PROPS = ['par', 'ímpar', 'primo', 'divisível por 3'];

// Gerar números "interessantes" para setores (mix de pares, ímpares, primos)
function generateInterestingNumbers(n: number): number[] {
  // Pool com boa variedade de propriedades
  const pools = [
    [2, 3, 5, 6, 7, 9, 4, 8, 11, 10, 1, 12],  // mix geral
    [1, 2, 3, 4, 6, 7, 9, 11, 5, 8, 10, 12],   // primos + compostos
    [2, 5, 7, 4, 9, 6, 3, 8, 11, 10, 1, 12],   // primo-pesado
    [3, 4, 6, 8, 7, 2, 9, 5, 10, 11, 1, 12],   // par-pesado
  ];
  const pool = pools[Math.floor(Math.random() * pools.length)];
  const shuffled = shuffleArray(pool.slice(0, Math.max(n + 2, 8)));
  return shuffled.slice(0, n);
}

function generateUnionEvents(
  sectors: RouletteSector[],
  numEvents: number,
  sectorNumbers: number[]
): { events: UnionEvent[], needsNumbers: boolean } {
  const n = sectors.length;
  const colors = sectors.map(s => s.colorName);
  const uniqueColors = [...new Set(colors)];

  // Coletar todas as receitas aplicáveis e embaralhar
  const recipes = shuffleArray(getApplicableRecipes(numEvents, uniqueColors.length, n));

  // Tentar cada receita por ordem (já embaralhada)
  for (const recipe of recipes) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = recipe(sectors, sectorNumbers, colors, uniqueColors, n);
      if (result) {
        const totalSectors = result.events.reduce((sum, e) => sum + e.sectorIndices.length, 0);
        // Forte preferência por P(união) < 1
        if (totalSectors < n) return result;
      }
    }
  }

  // Segunda passagem: aceitar P=1 se nada melhor funcionar
  for (const recipe of recipes) {
    const result = recipe(sectors, sectorNumbers, colors, uniqueColors, n);
    if (result) return result;
  }

  // Fallback seguro
  return fallbackEvents(sectors, numEvents, colors, uniqueColors, n);
}

// Tipo para receitas de geração de eventos
type RecipeFn = (
  sectors: RouletteSector[],
  sectorNumbers: number[],
  colors: string[],
  uniqueColors: string[],
  n: number
) => { events: UnionEvent[], needsNumbers: boolean } | null;

// Auxiliar: criar um UnionEvent
function createEvent(label: string, desc: string, indices: number[], n: number): UnionEvent {
  return {
    label, description: desc,
    sectorIndices: indices.sort((a, b) => a - b),
    probNumerator: indices.length, probDenominator: n, completed: false
  };
}

// Auxiliar: índices de uma cor
function colorIndices(colors: string[], color: string): number[] {
  return colors.map((c, i) => c === color ? i : -1).filter(i => i >= 0);
}

// Auxiliar: índices que satisfazem propriedade numérica
function propertyIndices(sectorNumbers: number[], prop: string, valueP?: number): number[] {
  return sectorNumbers.map((num, i) => checkProperty(num, prop, valueP) ? i : -1).filter(i => i >= 0);
}

// Determinar quais receitas são aplicáveis e retornar lista embaralhada
function getApplicableRecipes(numEvents: number, numCores: number, n: number): RecipeFn[] {
  const recipes: RecipeFn[] = [];

  // --- RECEITAS PARA 2 EVENTOS ---
  if (numEvents === 2) {
    // R1: simples+simples (cor + cor, subconjunto)
    if (numCores > 2) recipes.push(recipeSimpleColorPair);
    // R2: simples+simples (número específico + número específico)
    recipes.push(recipeSpecificNumberPair);
    // R3: simples+composto (cor + propriedade numérica restrita)
    if (numCores >= 2) recipes.push(recipeColorPlusNumProp);
    // R4: composto+composto (cor∧num + cor∧num)
    if (numCores >= 2) recipes.push(recipeColorAndNumber);
    // R5: simples+composto (número prop + cor∧número)
    if (numCores >= 2) recipes.push(recipeNumPropPlusColorNum);
    // R6: composto+composto (propriedades numéricas disjuntas)
    recipes.push(recipeNumericProps2);
    // R7: simples+composto (cor + "cor ou" composto)
    if (numCores >= 3) recipes.push(recipeSimpleColorPlusColorOr);
    // R8: composto+simples (cor∧num + cor simples)
    if (numCores >= 2) recipes.push(recipeColorNumPlusSimpleColor);
    // R18: "Cor X ou par" + "Cor Y e ímpar"
    if (numCores >= 2) recipes.push(recipeColorOrPropPlusColorAndProp);
    // R19: "(Cor X e par) ou (Cor Y e ímpar)" + "Cor Z"
    if (numCores >= 3) recipes.push(recipeCompoundOrPair);
    // R20: "Cor X ou (Cor Y e primo)" + "Cor Z"
    if (numCores >= 3) recipes.push(recipeColorOrColorAndProp);
    // R21: "Cor X e soma s" + "Cor Y"
    if (numCores >= 2) recipes.push(recipeColorAndSum);
    // R26: "(Cor X e primo) ou (Cor Y e par)" + "Cor Z e ímpar"
    if (numCores >= 3) recipes.push(recipeCompoundOrPlusCompound);
    // R27: "Cor X ou primo" + "Cor Y"
    if (numCores >= 3) recipes.push(recipeColorOrSimpleProp);
    // R28: "soma" + cor
    if (numCores >= 2) recipes.push(recipeSumPlusColor);
  }

  // --- RECEITAS PARA 3 EVENTOS ---
  if (numEvents === 3) {
    // R9: simples+simples+simples (3 cores)
    if (numCores > 3) recipes.push(recipe3Colors);
    // R10: simples+simples+composto (2 cores + prop numérica nos restantes)
    if (numCores >= 3) recipes.push(recipe2ColorsPlusNumProp);
    // R11: composto+composto+composto (3 faixas numéricas)
    recipes.push(recipe3NumericRanges);
    // R12: misto (cor + cor∧num + número)
    if (numCores >= 2) recipes.push(recipeMixed3);
    // R13: 3 números específicos
    recipes.push(recipe3SpecificNumbers);
    // R22: "Cor X" + "Cor Y e par" + "Cor Y e ímpar"
    if (numCores >= 2) recipes.push(recipeColorPlusPartitionedColor);
    // R23: "Cor X ou ímpar" + "Cor Y e par" + "Cor Z e primo"
    if (numCores >= 3) recipes.push(recipe3Compound);
    // R24: "Cor X e primo" + "Cor Y e par" + "número ímpar nos restantes"
    if (numCores >= 3) recipes.push(recipePrimeEvenOdd);
    // R25: "soma" + cor + cor∧prop
    if (numCores >= 3) recipes.push(recipe3WithSum);
    // R29: "Cor X" + "Cor Y ou primo" + "Cor Z e par"
    if (numCores >= 4) recipes.push(recipe3MixedOrAnd);
  }

  // --- RECEITAS PARA 4+ EVENTOS ---
  if (numEvents >= 4) {
    // R14: cores parciais (subconjunto de cores)
    if (numCores > numEvents) recipes.push(recipePartialColors);
    // R15: cores + prop numérica no restante
    if (numCores >= numEvents - 1) recipes.push(recipeColorsPlusNum);
    // R16: números específicos
    if (n >= numEvents + 1) recipes.push(recipeSpecificNumbersN);
    // R17: misto cores∧num
    if (numCores >= 2) recipes.push(recipeMixedN);
    // R30: N mistos cor + cor∧prop
    if (numCores >= 3) recipes.push(recipeNMixedColorAndProp);
  }

  // Receita universal (qualquer numEvents): cores parciais se possível
  if (numCores > numEvents && !recipes.includes(recipeSimpleColorPair) && !recipes.includes(recipePartialColors)) {
    recipes.push(recipePartialColors);
  }

  return recipes;
}

// ======= RECEITAS PARA 2 EVENTOS =======

// R1: simples+simples — duas cores (não todas)
const recipeSimpleColorPair: RecipeFn = (_s, _sn, colors, uniqueColors, n) => {
  if (uniqueColors.length <= 2) return null;
  const shuffled = shuffleArray([...uniqueColors]);
  const [colorA, colorB] = shuffled;
  const iA = colorIndices(colors, colorA);
  const iB = colorIndices(colors, colorB);
  if (iA.length === 0 || iB.length === 0) return null;
  return {
    events: [createEvent('A', `ocorrer a cor ${colorA}`, iA, n), createEvent('B', `ocorrer a cor ${colorB}`, iB, n)],
    needsNumbers: false
  };
};

// R2: simples+simples — dois números específicos
const recipeSpecificNumberPair: RecipeFn = (_s, sn, _c, _uc, n) => {
  const uniqueNums = [...new Set(sn)];
  if (uniqueNums.length < 3) return null; // precisa de pelo menos 3 para sobrar
  const shuffled = shuffleArray(uniqueNums);
  const [numA, numB] = shuffled;
  const iA = sn.map((v, i) => v === numA ? i : -1).filter(i => i >= 0);
  const iB = sn.map((v, i) => v === numB ? i : -1).filter(i => i >= 0);
  if (iA.length === 0 || iB.length === 0) return null;
  if (iA.length + iB.length >= n) return null;
  return {
    events: [createEvent('A', `obter o número ${numA}`, iA, n), createEvent('B', `obter o número ${numB}`, iB, n)],
    needsNumbers: true
  };
};

// R3: simples+composto — cor + "número [prop] em setor que não é [cor]"
const recipeColorPlusNumProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  const color = shuffleArray([...uniqueColors])[0];
  const iColor = colorIndices(colors, color);
  const iNotColor = colors.map((c, i) => c !== color ? i : -1).filter(i => i >= 0);
  if (iColor.length === 0 || iNotColor.length === 0) return null;

  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iB = iNotColor.filter(j => checkProperty(sn[j], prop));
  if (iB.length === 0 || iB.length === iNotColor.length) return null; // precisa ser subconjunto estrito
  return {
    events: [
      createEvent('A', `ocorrer a cor ${color}`, iColor, n),
      createEvent('B', `obter número ${prop} em setor que não é ${color}`, iB, n)
    ],
    needsNumbers: true
  };
};

// R4: composto+composto — "cor X e número [prop]" + "cor Y e número [prop2]"
const recipeColorAndNumber: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const [colorA, colorB] = shuffleArray([...uniqueColors]);
  const disjointPropertyPairs = shuffleArray([
    ['par', 'ímpar'], ['primo', 'não primo']
  ]);
  for (const [propA, propB] of disjointPropertyPairs) {
    const iA = colors.map((c, i) => c === colorA && checkProperty(sn[i], propA) ? i : -1).filter(i => i >= 0);
    const iB = colors.map((c, i) => c === colorB && checkProperty(sn[i], propB) ? i : -1).filter(i => i >= 0);
    if (iA.length > 0 && iB.length > 0 && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `ocorrer ${colorA} e número ${propA}`, iA, n),
          createEvent('B', `ocorrer ${colorB} e número ${propB}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  // Fallback: mesma prop, cores diferentes (sempre ME por cor)
  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iA = colors.map((c, i) => c === colorA && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
  const iB = colors.map((c, i) => c === colorB && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
  if (iA.length > 0 && iB.length > 0 && iA.length + iB.length < n) {
    return {
      events: [
        createEvent('A', `ocorrer ${colorA} e número ${prop}`, iA, n),
        createEvent('B', `ocorrer ${colorB} e número ${prop}`, iB, n)
      ],
      needsNumbers: true
    };
  }
  return null;
};

// R5: simples+composto — "número [prop]" + "cor X e número [prop2 oposta]"
const recipeNumPropPlusColorNum: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  const color = shuffleArray([...uniqueColors])[0];
  const pairList = shuffleArray([['par', 'ímpar'], ['primo', 'não primo']]);
  for (const [propA, propB] of pairList) {
    // A = "número [propA]" nos setores que NÃO são da cor
    const iNotColor = colors.map((c, i) => c !== color ? i : -1).filter(i => i >= 0);
    const iA = iNotColor.filter(j => checkProperty(sn[j], propA));
    // B = "cor X e número [propB]"
    const iB = colors.map((c, i) => c === color && checkProperty(sn[i], propB) ? i : -1).filter(i => i >= 0);
    // ME: A só pega setores fora de cor, B só pega setores da cor → disjuntos
    if (iA.length > 0 && iB.length > 0 && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `obter número ${propA} em setor que não é ${color}`, iA, n),
          createEvent('B', `ocorrer ${color} e número ${propB}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R6: composto+composto — propriedades numéricas disjuntas (par vs primo ímpar, > vs <)
const recipeNumericProps2: RecipeFn = (_s, sn, _c, _uc, n) => {
  // Limiares: A = "> p", B = "< p"
  const nums = [...new Set(sn)].sort((a, b) => a - b);
  if (nums.length >= 3) {
    const middle = nums[Math.floor(nums.length / 2)];
    const iA = sn.map((v, i) => v > middle ? i : -1).filter(i => i >= 0);
    const iB = sn.map((v, i) => v < middle ? i : -1).filter(i => i >= 0);
    if (iA.length > 0 && iB.length > 0 && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `obter número maior que ${middle}`, iA, n),
          createEvent('B', `obter número menor que ${middle}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  // par vs primo ímpar
  const iA = propertyIndices(sn, 'par');
  const iB = propertyIndices(sn, 'primo ímpar');
  if (iA.length > 0 && iB.length > 0) {
    // Verificar disjunção (par ∩ primo ímpar = ∅)
    const inter = iA.filter(i => iB.includes(i));
    if (inter.length === 0 && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', 'obter número par', iA, n),
          createEvent('B', 'obter número primo ímpar', iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R7: simples+composto — cor simples + "cor X ou cor Y" (compound via ou)
const recipeSimpleColorPlusColorOr: RecipeFn = (_s, _sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 4) return null; // precisa 4+ para que sobre
  const shuffled = shuffleArray([...uniqueColors]);
  const [colorA, colorB, colorC] = shuffled;
  const iA = colorIndices(colors, colorA);
  const iB = [...colorIndices(colors, colorB), ...colorIndices(colors, colorC)];
  if (iA.length === 0 || iB.length === 0) return null;
  if (iA.length + iB.length >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer a cor ${colorA}`, iA, n),
      createEvent('B', `ocorrer a cor ${colorB} ou a cor ${colorC}`, iB, n)
    ],
    needsNumbers: false
  };
};

// R8: composto+simples — "cor X e número [prop]" + cor Y simples
const recipeColorNumPlusSimpleColor: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const [colorA, colorB] = shuffleArray([...uniqueColors]);
  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iA = colors.map((c, i) => c === colorA && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
  const iB = colorIndices(colors, colorB);
  if (iA.length === 0 || iB.length === 0) return null;
  if (iA.length + iB.length >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer ${colorA} e número ${prop}`, iA, n),
      createEvent('B', `ocorrer a cor ${colorB}`, iB, n)
    ],
    needsNumbers: true
  };
};

// ======= RECEITAS PARA 3 EVENTOS =======

// R9: simples+simples+simples — 3 cores
const recipe3Colors: RecipeFn = (_s, _sn, colors, uniqueColors, n) => {
  if (uniqueColors.length <= 3) return null;
  const shuffled = shuffleArray([...uniqueColors]).slice(0, 3);
  const events = shuffled.map((color, i) => createEvent(EVENT_LABELS[i], `ocorrer a cor ${color}`, colorIndices(colors, color), n));
  if (events.some(e => e.sectorIndices.length === 0)) return null;
  return { events, needsNumbers: false };
};

// R10: simples+simples+composto — 2 cores + "número [prop] nos restantes"
const recipe2ColorsPlusNumProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const shuffled = shuffleArray([...uniqueColors]);
  const [colorA, colorB] = shuffled;
  const usedColors = [colorA, colorB];
  const iA = colorIndices(colors, colorA);
  const iB = colorIndices(colors, colorB);
  const iRemaining = colors.map((c, i) => !usedColors.includes(c) ? i : -1).filter(i => i >= 0);
  if (iA.length === 0 || iB.length === 0 || iRemaining.length === 0) return null;

  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iC = iRemaining.filter(j => checkProperty(sn[j], prop));
  if (iC.length === 0 || iC.length === iRemaining.length) return null;
  return {
    events: [
      createEvent('A', `ocorrer a cor ${colorA}`, iA, n),
      createEvent('B', `ocorrer a cor ${colorB}`, iB, n),
      createEvent('C', `obter número ${prop} em setor que não é ${colorA} nem ${colorB}`, iC, n)
    ],
    needsNumbers: true
  };
};

// R11: composto+composto+composto — 3 faixas numéricas
const recipe3NumericRanges: RecipeFn = (_s, sn, _c, _uc, n) => {
  const nums = [...new Set(sn)].sort((a, b) => a - b);
  if (nums.length < 4) return null;
  const i1 = Math.floor(nums.length * 0.33);
  const i2 = Math.ceil(nums.length * 0.66);
  const lim1 = nums[i1];
  const lim2 = nums[Math.min(i2, nums.length - 1)];
  if (lim1 >= lim2) return null;

  const iA = sn.map((v, i) => v < lim1 ? i : -1).filter(i => i >= 0);
  const iB = sn.map((v, i) => v > lim2 ? i : -1).filter(i => i >= 0);
  const iC = sn.map((v, i) => (v === lim1 || v === lim2) ? i : -1).filter(i => i >= 0);
  if (iA.length === 0 || iB.length === 0 || iC.length === 0) return null;
  return {
    events: [
      createEvent('A', `obter número menor que ${lim1}`, iA, n),
      createEvent('B', `obter número maior que ${lim2}`, iB, n),
      createEvent('C', `obter o número ${lim1}${lim1 !== lim2 ? ` ou o número ${lim2}` : ''}`, iC, n)
    ],
    needsNumbers: true
  };
};

// R12: misto — cor + cor∧num + número específico
const recipeMixed3: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const [colorA, colorB] = shuffleArray([...uniqueColors]);
  const iA = colorIndices(colors, colorA);
  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iB = colors.map((c, i) => c === colorB && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
  if (iA.length === 0 || iB.length === 0) return null;

  // C = um número específico que não está em A nem B
  const usedIndices = new Set([...iA, ...iB]);
  const freeItems = sn.map((_, i) => i).filter(i => !usedIndices.has(i));
  if (freeItems.length === 0) return null;
  const targetNum = sn[freeItems[0]];
  const iC = freeItems.filter(j => sn[j] === targetNum);
  if (iC.length === 0) return null;
  const totalRemainder = n - iA.length - iB.length - iC.length;
  if (totalRemainder <= 0) return null;
  return {
    events: [
      createEvent('A', `ocorrer a cor ${colorA}`, iA, n),
      createEvent('B', `ocorrer ${colorB} e número ${prop}`, iB, n),
      createEvent('C', `obter o número ${targetNum}`, iC, n)
    ],
    needsNumbers: true
  };
};

// R13: 3 números específicos
const recipe3SpecificNumbers: RecipeFn = (_s, sn, _c, _uc, n) => {
  const uniqueNums = [...new Set(sn)];
  if (uniqueNums.length < 4) return null;
  const shuffled = shuffleArray(uniqueNums).slice(0, 3);
  const events = shuffled.map((num, i) => {
    const indices = sn.map((v, j) => v === num ? j : -1).filter(j => j >= 0);
    return createEvent(EVENT_LABELS[i], `obter o número ${num}`, indices, n);
  });
  if (events.some(e => e.sectorIndices.length === 0)) return null;
  const total = events.reduce((s, e) => s + e.sectorIndices.length, 0);
  if (total >= n) return null;
  return { events, needsNumbers: true };
};

// ======= RECEITAS PARA 4+ EVENTOS =======

// R14: cores parciais (subconjunto estrito)
const recipePartialColors: RecipeFn = (_s, _sn, colors, uniqueColors, n) => {
  const numEvents = Math.min(uniqueColors.length - 1, 6); // deixar pelo menos 1 cor fora
  if (numEvents < 2) return null;
  const shuffled = shuffleArray([...uniqueColors]).slice(0, numEvents);
  const events = shuffled.map((color, i) => createEvent(EVENT_LABELS[i], `ocorrer a cor ${color}`, colorIndices(colors, color), n));
  if (events.some(e => e.sectorIndices.length === 0)) return null;
  return { events, needsNumbers: false };
};

// R15: (numEvents-1) cores + prop numérica no restante
const recipeColorsPlusNum: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  const numEventColors = Math.min(uniqueColors.length - 1, 5);
  if (numEventColors < 1) return null;
  const shuffled = shuffleArray([...uniqueColors]);
  const usedColors = shuffled.slice(0, numEventColors);
  const events: UnionEvent[] = usedColors.map((color, i) =>
    createEvent(EVENT_LABELS[i], `ocorrer a cor ${color}`, colorIndices(colors, color), n)
  );
  const usedIndices = new Set(events.flatMap(e => e.sectorIndices));
  const freeItems = sn.map((_, i) => i).filter(i => !usedIndices.has(i));
  if (freeItems.length === 0) return null;

  const prop = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iNum = freeItems.filter(j => checkProperty(sn[j], prop));
  if (iNum.length === 0 || iNum.length === freeItems.length) return null;
  events.push(createEvent(
    EVENT_LABELS[events.length],
    `obter número ${prop} em setor que não é ${usedColors.join(' nem ')}`,
    iNum, n
  ));
  if (events.some(e => e.sectorIndices.length === 0)) return null;
  return { events, needsNumbers: true };
};

// R16: N números específicos
const recipeSpecificNumbersN: RecipeFn = (_s, sn, _c, _uc, n) => {
  const numEvents = Math.min(4, n - 1);
  const uniqueNums = [...new Set(sn)];
  if (uniqueNums.length < numEvents + 1) return null;
  const shuffled = shuffleArray(uniqueNums).slice(0, numEvents);
  const events = shuffled.map((num, i) => {
    const indices = sn.map((v, j) => v === num ? j : -1).filter(j => j >= 0);
    return createEvent(EVENT_LABELS[i], `obter o número ${num}`, indices, n);
  });
  if (events.some(e => e.sectorIndices.length === 0)) return null;
  const total = events.reduce((s, e) => s + e.sectorIndices.length, 0);
  if (total >= n) return null;
  return { events, needsNumbers: true };
};

// R17: misto N — cores + cor∧número
const recipeMixedN: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  const numEventColors = Math.min(2, uniqueColors.length - 1);
  if (numEventColors < 1) return null;
  const shuffled = shuffleArray([...uniqueColors]);
  const simpleColors = shuffled.slice(0, numEventColors);
  const remainingColors = shuffled.slice(numEventColors);
  const events: UnionEvent[] = simpleColors.map((color, i) =>
    createEvent(EVENT_LABELS[i], `ocorrer a cor ${color}`, colorIndices(colors, color), n)
  );

  // Adicionar eventos cor∧número com cores restantes
  const props = shuffleArray(UNION_SIMPLE_NUM_PROPS);
  let propIdx = 0;
  for (const color of remainingColors) {
    if (events.length >= 6) break;
    const prop = props[propIdx % props.length];
    propIdx++;
    const indices = colors.map((c, i) => c === color && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
    if (indices.length > 0) {
      events.push(createEvent(EVENT_LABELS[events.length], `ocorrer ${color} e número ${prop}`, indices, n));
    }
  }
  if (events.length < 3 || events.some(e => e.sectorIndices.length === 0)) return null;
  const total = events.reduce((s, e) => s + e.sectorIndices.length, 0);
  if (total >= n) return null;
  return { events, needsNumbers: true };
};

// ======= RECEITAS ADICIONAIS — COMBINAÇÕES AVANÇADAS =======

// Auxiliar: encontrar somas interessantes entre números dos setores
function findInterestingSums(sectorNumbers: number[]): Array<{ sum: number; addends: number[]; targetIndices: number[] }> {
  const results: Array<{ sum: number; addends: number[]; targetIndices: number[] }> = [];
  const n = sectorNumbers.length;
  // Tentar somas de 2 parcelas
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = sectorNumbers[i] + sectorNumbers[j];
      const targets = sectorNumbers.map((v, k) => v === s && k !== i && k !== j ? k : -1).filter(k => k >= 0);
      if (targets.length > 0) {
        results.push({ sum: s, addends: [sectorNumbers[i], sectorNumbers[j]], targetIndices: targets });
      }
    }
  }
  return results;
}

// Auxiliar: índices de "cor X ou prop numérica" (união de cor com propriedade)
function colorOrPropertyIndices(colors: string[], color: string, sn: number[], prop: string): number[] {
  const set = new Set<number>();
  colors.forEach((c, i) => { if (c === color) set.add(i); });
  sn.forEach((num, i) => { if (checkProperty(num, prop)) set.add(i); });
  return [...set].sort((a, b) => a - b);
}

// Auxiliar: índices de "cor X e prop numérica" (interseção)
function colorAndPropertyIndices(colors: string[], color: string, sn: number[], prop: string): number[] {
  return colors.map((c, i) => c === color && checkProperty(sn[i], prop) ? i : -1).filter(i => i >= 0);
}

// Auxiliar: verificar que grupos são ME (sem interseção)
function mutuallyExclusiveGroups(groups: number[][]): boolean {
  const all = new Set<number>();
  for (const g of groups) {
    for (const idx of g) {
      if (all.has(idx)) return false;
      all.add(idx);
    }
  }
  return true;
}

// R18: "Cor X ou par" + "Cor Y e ímpar" (compound_ou + compound_e)
const recipeColorOrPropPlusColorAndProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const [colorA, colorB] = shuffleArray([...uniqueColors]);
  const pairList = shuffleArray([['par', 'ímpar'], ['primo', 'não primo']]);
  for (const [propOr, propE] of pairList) {
    const iColorA = colorIndices(colors, colorA);
    const iProp = propertyIndices(sn, propOr);
    // Verificar que a propriedade contribui setores FORA de corA (senão "ou propOu" é redundante/enganoso)
    const propOutsideColorA = iProp.filter(i => !iColorA.includes(i));
    if (iColorA.length === 0 || propOutsideColorA.length === 0) continue;
    const iA = colorOrPropertyIndices(colors, colorA, sn, propOr);
    const iB = colorAndPropertyIndices(colors, colorB, sn, propE);
    if (iA.length > 0 && iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `ocorrer ${colorA} ou número ${propOr}`, iA, n),
          createEvent('B', `ocorrer ${colorB} e número ${propE}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R19: "(Cor X e par) ou (Cor Y e ímpar)" + "Cor Z"
const recipeCompoundOrPair: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY, colorZ] = shuffleArray([...uniqueColors]);
  const pairList = shuffleArray([['par', 'ímpar'], ['primo', 'não primo']]);
  for (const [p1, p2] of pairList) {
    const iXp1 = colorAndPropertyIndices(colors, colorX, sn, p1);
    const iYp2 = colorAndPropertyIndices(colors, colorY, sn, p2);
    // Cada sub-parte deve ser não-vazia para que a descrição faça sentido
    if (iXp1.length === 0 || iYp2.length === 0) continue;
    const iA = [...new Set([...iXp1, ...iYp2])].sort((a, b) => a - b);
    const iB = colorIndices(colors, colorZ);
    if (iA.length > 0 && iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `(${colorX} e ${p1}) ou (${colorY} e ${p2})`, iA, n),
          createEvent('B', `ocorrer a cor ${colorZ}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R20: "Cor X ou (Cor Y e primo)" + "Cor Z"
const recipeColorOrColorAndProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY, colorZ] = shuffleArray([...uniqueColors]);
  const props = shuffleArray(UNION_SIMPLE_NUM_PROPS);
  for (const prop of props) {
    const iX = colorIndices(colors, colorX);
    const iYprop = colorAndPropertyIndices(colors, colorY, sn, prop);
    // Cada sub-parte deve ser não-vazia: iX (corX) e iYprop (corY e prop)
    if (iX.length === 0 || iYprop.length === 0) continue;
    const iA = [...new Set([...iX, ...iYprop])].sort((a, b) => a - b);
    const iB = colorIndices(colors, colorZ);
    if (iA.length > 0 && iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `ocorrer ${colorX} ou (${colorY} e ${prop})`, iA, n),
          createEvent('B', `ocorrer a cor ${colorZ}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R21: "Cor X e soma s" + "Cor Y"  (soma = parcela1 + parcela2 de outros setores)
const recipeColorAndSum: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const sums = findInterestingSums(sn);
  if (sums.length === 0) return null;
  const sumInfo = shuffleArray(sums)[0];
  // Encontrar setores com essa soma que sejam de uma cor específica
  for (const colorX of shuffleArray([...uniqueColors])) {
    const iA = sumInfo.targetIndices.filter(j => colors[j] === colorX);
    if (iA.length === 0) continue;
    // Escolher cor Y diferente
    const otherColors = uniqueColors.filter(c => c !== colorX);
    if (otherColors.length === 0) continue;
    const colorY = shuffleArray(otherColors)[0];
    const iB = colorIndices(colors, colorY);
    if (iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `ocorrer ${colorX} e número igual a ${sumInfo.addends.join(' + ')}`, iA, n),
          createEvent('B', `ocorrer a cor ${colorY}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R22: "Cor X" + "Cor Y e par" + "Cor Y e ímpar" (3 eventos, mesma cor secundária particionada)
const recipeColorPlusPartitionedColor: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const iA = colorIndices(colors, colorX);
  const iB = colorAndPropertyIndices(colors, colorY, sn, 'par');
  const iC = colorAndPropertyIndices(colors, colorY, sn, 'ímpar');
  if (iA.length === 0 || iB.length === 0 || iC.length === 0) return null;
  if (!mutuallyExclusiveGroups([iA, iB, iC])) return null;
  const total = iA.length + iB.length + iC.length;
  if (total >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer a cor ${colorX}`, iA, n),
      createEvent('B', `ocorrer ${colorY} e número par`, iB, n),
      createEvent('C', `ocorrer ${colorY} e número ímpar`, iC, n)
    ],
    needsNumbers: true
  };
};

// R23: "Cor X ou ímpar" + "Cor Y e par" + "Cor Z e primo"  (3 compound)
const recipe3Compound: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [cX, cY, cZ] = shuffleArray([...uniqueColors]);
  // Verificar que 'ímpar' contribui setores fora de cX (senão "ou ímpar" é enganoso)
  const iCX = colorIndices(colors, cX);
  const iOdd = propertyIndices(sn, 'ímpar');
  const oddOutsideCX = iOdd.filter(i => !iCX.includes(i));
  if (iCX.length === 0 || oddOutsideCX.length === 0) return null;
  const iA = colorOrPropertyIndices(colors, cX, sn, 'ímpar');
  const iB = colorAndPropertyIndices(colors, cY, sn, 'par');
  const iC = colorAndPropertyIndices(colors, cZ, sn, 'primo');
  if (iA.length === 0 || iB.length === 0 || iC.length === 0) return null;
  if (!mutuallyExclusiveGroups([iA, iB, iC])) return null;
  const total = iA.length + iB.length + iC.length;
  if (total >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer ${cX} ou número ímpar`, iA, n),
      createEvent('B', `ocorrer ${cY} e número par`, iB, n),
      createEvent('C', `ocorrer ${cZ} e número primo`, iC, n)
    ],
    needsNumbers: true
  };
};

// R24: "Cor X e primo" + "Cor Y e par" + "número ímpar em setor que não é X nem Y"
const recipePrimeEvenOdd: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [cX, cY] = shuffleArray([...uniqueColors]);
  const iA = colorAndPropertyIndices(colors, cX, sn, 'primo');
  const iB = colorAndPropertyIndices(colors, cY, sn, 'par');
  const iRest = colors.map((c, i) => c !== cX && c !== cY ? i : -1).filter(i => i >= 0);
  const iC = iRest.filter(j => checkProperty(sn[j], 'ímpar'));
  if (iA.length === 0 || iB.length === 0 || iC.length === 0) return null;
  if (!mutuallyExclusiveGroups([iA, iB, iC])) return null;
  const total = iA.length + iB.length + iC.length;
  if (total >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer ${cX} e número primo`, iA, n),
      createEvent('B', `ocorrer ${cY} e número par`, iB, n),
      createEvent('C', `número ímpar em setor que não é ${cX} nem ${cY}`, iC, n)
    ],
    needsNumbers: true
  };
};

// R25: "número igual a soma" + "cor X" + "cor Y e prop" (3 eventos com soma)
const recipe3WithSum: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 2) return null;
  const sums = findInterestingSums(sn);
  if (sums.length === 0) return null;
  const sumInfo = shuffleArray(sums)[0];
  // A = obter a soma
  const iA = sumInfo.targetIndices;
  // B e C = cores que não estão em A
  const strictlyFreeColors = uniqueColors.filter(c => colorIndices(colors, c).every(j => !iA.includes(j)));
  if (strictlyFreeColors.length < 2) return null;
  const [cB, cC] = shuffleArray(strictlyFreeColors);
  const iB = colorIndices(colors, cB);
  const propC = shuffleArray(UNION_SIMPLE_NUM_PROPS)[0];
  const iC = colorAndPropertyIndices(colors, cC, sn, propC);
  if (iB.length === 0 || iC.length === 0) return null;
  if (!mutuallyExclusiveGroups([iA, iB, iC])) return null;
  const total = iA.length + iB.length + iC.length;
  if (total >= n) return null;
  return {
    events: [
      createEvent('A', `obter número igual a ${sumInfo.addends.join(' + ')}`, iA, n),
      createEvent('B', `ocorrer a cor ${cB}`, iB, n),
      createEvent('C', `ocorrer ${cC} e número ${propC}`, iC, n)
    ],
    needsNumbers: true
  };
};

// R26: "(Cor X e primo) ou (Cor Y e par)" + "Cor Z e ímpar" (2 eventos compound)
const recipeCompoundOrPlusCompound: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [cX, cY, cZ] = shuffleArray([...uniqueColors]);
  const combos = shuffleArray([
    { a1: 'primo', a2: 'par', b: 'ímpar' },
    { a1: 'par', a2: 'primo', b: 'ímpar' },
    { a1: 'ímpar', a2: 'primo', b: 'par' },
  ]);
  for (const { a1, a2, b } of combos) {
    const iXa1 = colorAndPropertyIndices(colors, cX, sn, a1);
    const iYa2 = colorAndPropertyIndices(colors, cY, sn, a2);
    // Cada sub-parte deve ser não-vazia para que a descrição faça sentido
    if (iXa1.length === 0 || iYa2.length === 0) continue;
    const iA = [...new Set([...iXa1, ...iYa2])].sort((a, b) => a - b);
    const iB = colorAndPropertyIndices(colors, cZ, sn, b);
    if (iA.length > 0 && iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `(${cX} e ${a1}) ou (${cY} e ${a2})`, iA, n),
          createEvent('B', `ocorrer ${cZ} e número ${b}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R27: "Cor X ou primo" + "Cor Y" (simple ou + simple, 2 eventos)
const recipeColorOrSimpleProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const [cX, cY] = shuffleArray([...uniqueColors]);
  const props = shuffleArray(UNION_SIMPLE_NUM_PROPS);
  for (const prop of props) {
    // Verificar que a propriedade contribui setores FORA de cX (senão "ou prop" é enganoso)
    const iCX = colorIndices(colors, cX);
    const iProp = propertyIndices(sn, prop);
    const propOutsideCX = iProp.filter(i => !iCX.includes(i));
    if (iCX.length === 0 || propOutsideCX.length === 0) continue;
    const iA = colorOrPropertyIndices(colors, cX, sn, prop);
    const iB = colorIndices(colors, cY);
    if (iA.length > 0 && iB.length > 0 && mutuallyExclusiveGroups([iA, iB]) && iA.length + iB.length < n) {
      return {
        events: [
          createEvent('A', `ocorrer ${cX} ou número ${prop}`, iA, n),
          createEvent('B', `ocorrer a cor ${cY}`, iB, n)
        ],
        needsNumbers: true
      };
    }
  }
  return null;
};

// R28: "soma" + cor (2 eventos simples com soma descritiva)
const recipeSumPlusColor: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  const sums = findInterestingSums(sn);
  if (sums.length === 0 || uniqueColors.length < 2) return null;
  const sumInfo = shuffleArray(sums)[0];
  const iA = sumInfo.targetIndices;
  const freeColors = uniqueColors.filter(c => colorIndices(colors, c).every(j => !iA.includes(j)));
  if (freeColors.length === 0) return null;
  const colorB = shuffleArray(freeColors)[0];
  const iB = colorIndices(colors, colorB);
  if (iB.length === 0 || !mutuallyExclusiveGroups([iA, iB]) || iA.length + iB.length >= n) return null;
  return {
    events: [
      createEvent('A', `obter número igual a ${sumInfo.addends.join(' + ')}`, iA, n),
      createEvent('B', `ocorrer a cor ${colorB}`, iB, n)
    ],
    needsNumbers: true
  };
};

// R29: 3 eventos — "Cor X" + "Cor Y ou primo" + "Cor Z e par"
const recipe3MixedOrAnd: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 4) return null;
  const [cX, cY, cZ] = shuffleArray([...uniqueColors]);
  const iA = colorIndices(colors, cX);
  // Verificar que 'primo' contribui setores fora de cY (senão "ou primo" é enganoso)
  const iCY = colorIndices(colors, cY);
  const iPrime = propertyIndices(sn, 'primo');
  const primeOutsideCY = iPrime.filter(i => !iCY.includes(i));
  if (iA.length === 0 || iCY.length === 0 || primeOutsideCY.length === 0) return null;
  const iB = colorOrPropertyIndices(colors, cY, sn, 'primo');
  const iC = colorAndPropertyIndices(colors, cZ, sn, 'par');
  if (iA.length === 0 || iB.length === 0 || iC.length === 0) return null;
  if (!mutuallyExclusiveGroups([iA, iB, iC])) return null;
  if (iA.length + iB.length + iC.length >= n) return null;
  return {
    events: [
      createEvent('A', `ocorrer a cor ${cX}`, iA, n),
      createEvent('B', `ocorrer ${cY} ou número primo`, iB, n),
      createEvent('C', `ocorrer ${cZ} e número par`, iC, n)
    ],
    needsNumbers: true
  };
};

// R30: 4+ eventos — cores + "(cor e prop)" mistos
const recipeNMixedColorAndProp: RecipeFn = (_s, sn, colors, uniqueColors, n) => {
  if (uniqueColors.length < 3) return null;
  const shuffled = shuffleArray([...uniqueColors]);
  const events: UnionEvent[] = [];
  const usedIndices = new Set<number>();

  // Primeiro evento: cor simples
  const iFirst = colorIndices(colors, shuffled[0]);
  if (iFirst.length === 0) return null;
  events.push(createEvent('A', `ocorrer a cor ${shuffled[0]}`, iFirst, n));
  iFirst.forEach(i => usedIndices.add(i));

  // Eventos seguintes: alternar entre cor simples e cor∧prop
  const propsAvail = shuffleArray(UNION_SIMPLE_NUM_PROPS);
  for (let k = 1; k < shuffled.length && events.length < 6; k++) {
    const color = shuffled[k];
    const useProperty = Math.random() < 0.5 && propsAvail.length > 0;
    let indices: number[];
    let desc: string;

    if (useProperty) {
      const prop = propsAvail.pop() || 'par';
      indices = colorAndPropertyIndices(colors, color, sn, prop);
      desc = `ocorrer ${color} e número ${prop}`;
    } else {
      indices = colorIndices(colors, color);
      desc = `ocorrer a cor ${color}`;
    }

    // Verificar que não sobrepõe
    const cleaned = indices.filter(i => !usedIndices.has(i));
    if (cleaned.length === 0) continue;
    // Para cor∧prop, usar limpos = mesmos que indices (cor diferente → sempre limpos)
    if (indices.every(i => !usedIndices.has(i)) && indices.length > 0) {
      events.push(createEvent(EVENT_LABELS[events.length], desc, indices, n));
      indices.forEach(i => usedIndices.add(i));
    }
  }

  if (events.length < 3) return null;
  const total = events.reduce((s, e) => s + e.sectorIndices.length, 0);
  if (total >= n) return null;
  return { events, needsNumbers: events.some(e => e.description.includes('número')) };
};

// Fallback seguro: selecionar subconjunto de cores (nunca todas)
function fallbackEvents(
  _sectors: RouletteSector[],
  numEvents: number,
  colors: string[],
  uniqueColors: string[],
  n: number
): { events: UnionEvent[], needsNumbers: boolean } {
  const shuffled = shuffleArray([...uniqueColors]);
  const maxColors = Math.min(numEvents, Math.max(1, shuffled.length - 1));
  const usedColors = shuffled.slice(0, maxColors);

  const events: UnionEvent[] = usedColors.map((color, i) =>
    createEvent(EVENT_LABELS[i], `ocorrer a cor ${color}`, colorIndices(colors, color), n)
  );

  return { events, needsNumbers: false };
}

// === GERADOR DO DESAFIO — UNIÃO DE EVENTOS (subStep 6.56) ===

// Pools de números para o desafio
const CH_DIV_OK = [2, 3, 5, 6, 10, 15, 30];
const CH_DIV_NO = [7, 11, 13, 17, 19, 23, 29];
const CH_PRIME_ODD = [3, 5, 7, 11, 13, 17, 19, 23, 29];
const CH_COMP_ODD = [9, 15, 21, 25, 27];
const CH_COMP_EVEN = [4, 6, 8, 10, 12, 14, 16, 18, 20];
const CH_MULT_OK: Record<number, number[]> = {
  2: [4, 6, 8, 10, 12, 14, 16, 18, 20],
  3: [6, 9, 12, 15, 18, 21, 24, 27, 30],
  5: [10, 15, 20, 25, 30],
};

type ChallengeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

interface ChallengeGenResult {
  values: number[];
  m: number | null;
  p: number | null;
  colorX: string | null;
  colorY: string | null;
  problemType: ChallengeType;
  events: UnionEvent[];
}

// Calcular o menor m = 2^a * 3^b * 5^c tal que todos os números dividam m
function computeMinM(nums: number[]): number {
  let a = 0, b = 0, c = 0;
  for (const v of nums) {
    let x = v, va = 0, vb = 0, vc = 0;
    while (x % 2 === 0) { va++; x /= 2; }
    while (x % 3 === 0) { vb++; x /= 3; }
    while (x % 5 === 0) { vc++; x /= 5; }
    if (x > 1) return -1; // possui fator primo > 5
    a = Math.max(a, va); b = Math.max(b, vb); c = Math.max(c, vc);
  }
  return Math.pow(2, a) * Math.pow(3, b) * Math.pow(5, c);
}

// Encontrar m = 2^a * 3^b * 5^c onde mustDivide divide m e mustNotDivide não divide
function findCompatibleM(mustDivide: number[], mustNotDivide: number[]): number | null {
  const candidates: number[] = [];
  for (let a = 0; a <= 5; a++) {
    for (let b = 0; b <= 5; b++) {
      for (let c = 0; c <= 5; c++) {
        const m = Math.pow(2, a) * Math.pow(3, b) * Math.pow(5, c);
        if (m < 2 || m > 3000) continue;
        if (mustDivide.length > 0 && !mustDivide.every(v => m % v === 0)) continue;
        if (mustNotDivide.length > 0 && !mustNotDivide.every(v => m % v !== 0)) continue;
        candidates.push(m);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Selecionar números distintos de um conjunto; permite repetições se o conjunto se esgotar
function pickDistinct(pool: number[], count: number): number[] {
  const shuffled = shuffleArray([...pool]);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

// Múltiplos seguros de p que NÃO dividem m
function safeMultiples(p: number, m: number): number[] {
  return CH_MULT_OK[p].filter(v => m % v !== 0);
}

// Números "nem um nem outro": não divisor de m, não múltiplo de p
function safeNeither(m: number | null, p: number | null): number[] {
  return CH_DIV_NO.filter(v => {
    if (m !== null && m % v === 0) return false;
    if (p !== null && v % p === 0) return false;
    return true;
  });
}

// Particionar índices do array em grupos aleatórios dos tamanhos fornecidos
function partitionIndices(indices: number[], sizes: number[]): number[][] {
  const shuffled = shuffleArray([...indices]);
  const groups: number[][] = [];
  let offset = 0;
  for (const sz of sizes) {
    groups.push(shuffled.slice(offset, offset + sz));
    offset += sz;
  }
  if (offset < shuffled.length) {
    groups.push(shuffled.slice(offset));
  }
  return groups;
}

// Obter tipos de desafio compatíveis para a configuração de setores
function getCompatibleChallengeTypes(sectors: RouletteSector[]): ChallengeType[] {
  const n = sectors.length;
  const colors = sectors.map(s => s.colorName);
  const uniqueColors = [...new Set(colors)];
  const nc = uniqueColors.length;
  const types: ChallengeType[] = [];

  // Tipos 2, 3: não precisa de cor, apenas n ≥ 2
  types.push(2, 3);

  // Verificar se alguma cor X tem ≥1 setor-X E ≥2 setores não-X
  const hasGoodSingleColor = nc >= 2 && uniqueColors.some(c => {
    const cx = colors.filter(cc => cc === c).length;
    return cx >= 1 && n - cx >= 2;
  });

  // Tipo 1: X ∨ div ∨ mult — precisa de ≥2 setores não-X
  if (hasGoodSingleColor) types.push(1);
  // Tipo 6: X ∧ div — precisa de X + outra cor
  if (nc >= 2) types.push(6);
  // Tipos 7, 9: ¬X ∧ prop + X — precisa de ≥2 setores não-X
  if (hasGoodSingleColor) types.push(7, 9);
  // Tipos 8, 10: ¬Y ∧ prop + Y — mesma estrutura
  if (hasGoodSingleColor) types.push(8, 10);

  // Tipos que precisam de ≥3 cores: X, Y e fora de X∪Y
  if (nc >= 3) {
    types.push(4, 5);
    // Tipos 11-14: precisa de ≥1 setor fora de X∪Y
    types.push(11, 12, 13, 14);
  }

  return types;
}

// === GERADORES ESPECÍFICOS POR TIPO ===

// Tipo 1: cor X OU divisor de m OU múltiplo de p
function genType1(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  const colorX = shuffleArray([...uniqueColors]).find(c => {
    const cx = colors.filter(cc => cc === c).length;
    return cx >= 1 && n - cx >= 2;
  });
  if (!colorX) return null;

  const idxX = colors.map((c, i) => c === colorX ? i : -1).filter(i => i >= 0);
  const idxRest = colors.map((c, i) => c !== colorX ? i : -1).filter(i => i >= 0);
  if (idxRest.length < 2) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];

  // Particionar restante: ≥1 div, ≥1 múlt, resto = nenhum (se possível)
  const numDiv = Math.max(1, Math.round(idxRest.length / 3));
  const numMult = Math.max(1, Math.round((idxRest.length - numDiv) / 2));
  const [idxDiv, idxMult, idxNeither] = partitionIndices(idxRest, [numDiv, numMult]);

  // Atribuir números divisores
  const divNums = pickDistinct(CH_DIV_OK, idxDiv.length);
  const m = computeMinM(divNums);
  if (m < 2) return null;

  // Filtrar múltiplos seguros de p que não dividem m
  const multPool = safeMultiples(p, m);
  if (multPool.length === 0) return null;
  const multNums = pickDistinct(multPool, idxMult.length);

  // X e nenhum: DIV_NO (primos > 5, nunca dividem m, nunca múltiplos de 2/3/5)
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  const neitherNums = pickDistinct(safeNeither(m, p), (idxNeither || []).length);

  const values: number[] = new Array(n).fill(0);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);
  idxDiv.forEach((idx, i) => values[idx] = divNums[i]);
  idxMult.forEach((idx, i) => values[idx] = multNums[i]);
  (idxNeither || []).forEach((idx, i) => values[idx] = neitherNums[i]);

  // Calcular os índices reais dos eventos
  const evA = idxX;
  const evB = values.map((v, i) => m % v === 0 ? i : -1).filter(i => i >= 0);
  const evC = values.map((v, i) => v % p === 0 ? i : -1).filter(i => i >= 0);
  if (evA.length === 0 || evB.length === 0 || evC.length === 0) return null;
  if (evA.some(i => evB.includes(i)) || evA.some(i => evC.includes(i)) || evB.some(i => evC.includes(i))) return null;
  if (n >= 4 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m, p, colorX, colorY: null, problemType: 1,
    events: [
      createEvent('A', `ocorrer a cor ${colorX}`, evA, n),
      createEvent('B', `obter número divisor de ${m}`, evB, n),
      createEvent('C', `obter número múltiplo de ${p}`, evC, n),
    ]
  };
}

// Tipo 2: par OU primo (ME: evitar 2 para que par ∩ primo = ∅)
function genType2(_s: RouletteSector[], _c: string[], _uc: string[], n: number): ChallengeGenResult | null {
  const indices = Array.from({ length: n }, (_, i) => i);
  // Precisa de ≥1 par, ≥1 primo, ≥1 nenhum para ser não-trivial (se n≥3)
  const numEven = Math.max(1, Math.round(n * 0.35));
  const numPrime = Math.max(1, Math.round((n - numEven) * 0.5));
  const [idxEven, idxPrime, idxNeither] = partitionIndices(indices, [numEven, numPrime]);

  const values: number[] = new Array(n).fill(0);
  const evenNums = pickDistinct(CH_COMP_EVEN, idxEven.length); // pares não-primos
  const primeNums = pickDistinct(CH_PRIME_ODD, idxPrime.length); // primos ímpares (sem 2!)
  const neitherNums = pickDistinct(CH_COMP_ODD, (idxNeither || []).length); // compostos ímpares

  idxEven.forEach((idx, i) => values[idx] = evenNums[i]);
  idxPrime.forEach((idx, i) => values[idx] = primeNums[i]);
  (idxNeither || []).forEach((idx, i) => values[idx] = neitherNums[i]);

  const evA = values.map((v, i) => v % 2 === 0 ? i : -1).filter(i => i >= 0);
  const evB = values.map((v, i) => isPrime(v) ? i : -1).filter(i => i >= 0);
  if (evA.length === 0 || evB.length === 0) return null;
  if (evA.some(i => evB.includes(i))) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m: null, p: null, colorX: null, colorY: null, problemType: 2,
    events: [
      createEvent('A', 'obter número par', evA, n),
      createEvent('B', 'obter número primo', evB, n),
    ]
  };
}

// Tipo 3: primo par OU ímpar composto
function genType3(_s: RouletteSector[], _c: string[], _uc: string[], n: number): ChallengeGenResult | null {
  const indices = Array.from({ length: n }, (_, i) => i);
  const [idxPrimeEven, idxCompOdd, idxNeither] = partitionIndices(indices, [1, Math.max(1, Math.round((n - 1) / 2))]);

  const values: number[] = new Array(n).fill(0);
  idxPrimeEven.forEach(idx => values[idx] = 2); // único primo par
  const compOddNums = pickDistinct(CH_COMP_ODD, idxCompOdd.length);
  idxCompOdd.forEach((idx, i) => values[idx] = compOddNums[i]);
  // Nenhum: primos ímpares (não 2) ou compostos pares
  const nPool = [...CH_PRIME_ODD.filter(v => v !== 2), ...CH_COMP_EVEN];
  const neitherNums = pickDistinct(nPool, (idxNeither || []).length);
  (idxNeither || []).forEach((idx, i) => values[idx] = neitherNums[i]);

  const evA = values.map((v, i) => v === 2 ? i : -1).filter(i => i >= 0);
  const evB = values.map((v, i) => (v % 2 !== 0 && v > 1 && !isPrime(v)) ? i : -1).filter(i => i >= 0);
  if (evA.length === 0 || evB.length === 0) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m: null, p: null, colorX: null, colorY: null, problemType: 3,
    events: [
      createEvent('A', 'obter número primo par', evA, n),
      createEvent('B', 'obter número ímpar composto', evB, n),
    ]
  };
}

// Tipo 4: cor X OU cor Y OU divisor de m
function genType4(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const values: number[] = new Array(n).fill(0);

  // Setores X e Y: números de DIV_NO (nunca dividem m)
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Setores externos: alguns divisores, alguns nenhum
  const numDiv = Math.max(1, Math.round(idxO.length / 2));
  const [idxDiv, idxNeith] = partitionIndices(idxO, [numDiv]);
  const divNums = pickDistinct(CH_DIV_OK, idxDiv.length);
  const m = computeMinM(divNums);
  if (m < 2) return null;
  idxDiv.forEach((idx, i) => values[idx] = divNums[i]);
  const nNums = pickDistinct(CH_DIV_NO, (idxNeith || []).length);
  (idxNeith || []).forEach((idx, i) => values[idx] = nNums[i]);

  const evA = idxX;
  const evB = idxY;
  const evC = values.map((v, i) => m % v === 0 ? i : -1).filter(i => i >= 0);
  if (evC.length === 0) return null;
  if (evA.some(i => evC.includes(i)) || evB.some(i => evC.includes(i))) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m, p: null, colorX, colorY, problemType: 4,
    events: [
      createEvent('A', `ocorrer a cor ${colorX}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
      createEvent('C', `obter número divisor de ${m}`, evC, n),
    ]
  };
}

// Tipo 5: cor X OU cor Y OU múltiplo de p
function genType5(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];
  const values: number[] = new Array(n).fill(0);

  // X e Y: não múltiplos de p → usar DIV_NO (todos > 5, ímpares, não múlt de 2/3/5)
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Externos: alguns múltiplos, alguns nenhum
  const numMult = Math.max(1, Math.round(idxO.length / 2));
  const [idxMult, idxNeith] = partitionIndices(idxO, [numMult]);
  const multNums = pickDistinct(CH_MULT_OK[p], idxMult.length);
  idxMult.forEach((idx, i) => values[idx] = multNums[i]);
  // Nenhum: não múltiplo de p
  const nPool = CH_DIV_NO.filter(v => v % p !== 0);
  const nNums = pickDistinct(nPool.length > 0 ? nPool : CH_DIV_NO, (idxNeith || []).length);
  (idxNeith || []).forEach((idx, i) => values[idx] = nNums[i]);

  const evA = idxX;
  const evB = idxY;
  const evC = values.map((v, i) => v % p === 0 ? i : -1).filter(i => i >= 0);
  if (evC.length === 0) return null;
  if (evA.some(i => evC.includes(i)) || evB.some(i => evC.includes(i))) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m: null, p, colorX, colorY, problemType: 5,
    events: [
      createEvent('A', `ocorrer a cor ${colorX}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
      createEvent('C', `obter número múltiplo de ${p}`, evC, n),
    ]
  };
}

// Tipo 6: cor X E divisor de m (pareado com cor Y)
function genType6(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 2) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  if (idxX.length === 0 || idxY.length === 0) return null;

  const values: number[] = new Array(n).fill(0);

  // Alguns setores X recebem divisores de m, outros recebem DIV_NO
  const numXDiv = Math.max(1, Math.round(idxX.length / 2));
  const [idxXDiv, idxXNo] = partitionIndices(idxX, [numXDiv]);
  const divNums = pickDistinct(CH_DIV_OK, idxXDiv.length);
  const m = computeMinM(divNums);
  if (m < 2) return null;
  idxXDiv.forEach((idx, i) => values[idx] = divNums[i]);
  const xNoNums = pickDistinct(CH_DIV_NO, (idxXNo || []).length);
  (idxXNo || []).forEach((idx, i) => values[idx] = xNoNums[i]);

  // Setores Y: DIV_NO (não divisores)
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Setores restantes: DIV_NO
  const idxRest = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  const rNums = pickDistinct(CH_DIV_NO, idxRest.length);
  idxRest.forEach((idx, i) => values[idx] = rNums[i]);

  const evA = values.map((v, i) => colors[i] === colorX && m % v === 0 ? i : -1).filter(i => i >= 0);
  const evB = idxY;
  if (evA.length === 0 || evB.length === 0) return null;
  if (evA.some(i => evB.includes(i))) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m, p: null, colorX, colorY, problemType: 6,
    events: [
      createEvent('A', `ocorrer ${colorX} e número divisor de ${m}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
    ]
  };
}

// Tipo 7: NÃO cor X E primo (pareado com cor X)
function genType7(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  const colorX = shuffleArray([...uniqueColors]).find(c => {
    const cx = colors.filter(cc => cc === c).length;
    return cx >= 1 && n - cx >= 2;
  });
  if (!colorX) return null;

  const idxX = colorIndices(colors, colorX);
  const idxNotX = colors.map((c, i) => c !== colorX ? i : -1).filter(i => i >= 0);
  if (idxNotX.length < 2) return null;

  const values: number[] = new Array(n).fill(0);

  // Setores X: números não-primos (para que NÃO estejam no evento A)
  const xNums = pickDistinct(CH_COMP_EVEN, idxX.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);

  // Não-X: alguns primos, alguns não-primos (para ser não-trivial)
  const numPrime = Math.max(1, Math.round(idxNotX.length * 0.5));
  const [idxPrime, idxNonPrime] = partitionIndices(idxNotX, [numPrime]);
  const primeNums = pickDistinct(CH_PRIME_ODD, idxPrime.length);
  idxPrime.forEach((idx, i) => values[idx] = primeNums[i]);
  const npNums = pickDistinct(CH_COMP_ODD, (idxNonPrime || []).length);
  (idxNonPrime || []).forEach((idx, i) => values[idx] = npNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorX && isPrime(v) ? i : -1).filter(i => i >= 0);
  const evB = idxX;
  if (evA.length === 0 || evB.length === 0) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m: null, p: null, colorX, colorY: null, problemType: 7,
    events: [
      createEvent('A', `não ocorrer ${colorX} e obter número primo`, evA, n),
      createEvent('B', `ocorrer a cor ${colorX}`, evB, n),
    ]
  };
}

// Tipo 8: NÃO cor Y E NÃO divisor de m (pareado com cor Y)
function genType8(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  const colorY = shuffleArray([...uniqueColors]).find(c => {
    const cy = colors.filter(cc => cc === c).length;
    return cy >= 1 && n - cy >= 2;
  });
  if (!colorY) return null;

  const idxY = colorIndices(colors, colorY);
  const idxNotY = colors.map((c, i) => c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxNotY.length < 2) return null;

  const values: number[] = new Array(n).fill(0);

  // Setores Y: quaisquer números
  const yNums = pickDistinct([...CH_DIV_OK, ...CH_DIV_NO], idxY.length);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Não-Y: alguns com DIV_NO (não divisores), alguns com DIV_OK (divisores)
  const numNonDiv = Math.max(1, Math.round(idxNotY.length * 0.5));
  const numDiv = Math.max(1, idxNotY.length - numNonDiv);
  const [idxNonDiv, idxDiv] = partitionIndices(idxNotY, [numNonDiv, numDiv]);

  const nonDivNums = pickDistinct(CH_DIV_NO, idxNonDiv.length);
  idxNonDiv.forEach((idx, i) => values[idx] = nonDivNums[i]);
  const divNums = pickDistinct(CH_DIV_OK, (idxDiv || []).length);
  (idxDiv || []).forEach((idx, i) => values[idx] = divNums[i]);

  // Encontrar m que funcione com os números divisores
  const actualDivNums = (idxDiv || []).map(idx => values[idx]);
  const allNonDivNums = [...idxNonDiv.map(idx => values[idx]), ...idxY.map(idx => values[idx])];
  const m = findCompatibleM(actualDivNums, allNonDivNums.filter(v => CH_DIV_OK.includes(v) || v <= 30));
  if (m === null) {
    // Fallback: m=30 e garantir que setores não-Y não-div tenham números DIV_NO
    const mFallback = 30;
    const evA = values.map((v, i) => colors[i] !== colorY && mFallback % v !== 0 ? i : -1).filter(i => i >= 0);
    const evB = idxY;
    if (evA.length === 0 || evB.length === 0) return null;
    if (n >= 3 && evA.length + evB.length >= n) return null;
    return {
      values, m: mFallback, p: null, colorX: null, colorY, problemType: 8,
      events: [
        createEvent('A', `não ocorrer ${colorY} e obter número que não é divisor de ${mFallback}`, evA, n),
        createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
      ]
    };
  }

  const evA = values.map((v, i) => colors[i] !== colorY && m % v !== 0 ? i : -1).filter(i => i >= 0);
  const evB = idxY;
  if (evA.length === 0 || evB.length === 0) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m, p: null, colorX: null, colorY, problemType: 8,
    events: [
      createEvent('A', `não ocorrer ${colorY} e obter número que não é divisor de ${m}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
    ]
  };
}

// Tipo 9: NÃO cor X E múltiplo de p (pareado com cor X)
function genType9(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  const colorX = shuffleArray([...uniqueColors]).find(c => {
    const cx = colors.filter(cc => cc === c).length;
    return cx >= 1 && n - cx >= 2;
  });
  if (!colorX) return null;

  const idxX = colorIndices(colors, colorX);
  const idxNotX = colors.map((c, i) => c !== colorX ? i : -1).filter(i => i >= 0);
  if (idxNotX.length < 2) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];
  const values: number[] = new Array(n).fill(0);

  // Setores X: não múltiplos de p → DIV_NO
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);

  // Não-X: alguns múltiplos de p, alguns não
  const numMult = Math.max(1, Math.round(idxNotX.length * 0.5));
  const [idxMult, idxNonMult] = partitionIndices(idxNotX, [numMult]);
  const multNums = pickDistinct(CH_MULT_OK[p], idxMult.length);
  idxMult.forEach((idx, i) => values[idx] = multNums[i]);
  const nmPool = CH_DIV_NO.filter(v => v % p !== 0);
  const nmNums = pickDistinct(nmPool.length > 0 ? nmPool : CH_DIV_NO, (idxNonMult || []).length);
  (idxNonMult || []).forEach((idx, i) => values[idx] = nmNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorX && v % p === 0 ? i : -1).filter(i => i >= 0);
  const evB = idxX;
  if (evA.length === 0 || evB.length === 0) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m: null, p, colorX, colorY: null, problemType: 9,
    events: [
      createEvent('A', `não ocorrer ${colorX} e obter número múltiplo de ${p}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorX}`, evB, n),
    ]
  };
}

// Tipo 10: NÃO cor Y E múltiplo de p (pareado com cor Y)
function genType10(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  const colorY = shuffleArray([...uniqueColors]).find(c => {
    const cy = colors.filter(cc => cc === c).length;
    return cy >= 1 && n - cy >= 2;
  });
  if (!colorY) return null;

  const idxY = colorIndices(colors, colorY);
  const idxNotY = colors.map((c, i) => c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxNotY.length < 2) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];
  const values: number[] = new Array(n).fill(0);

  // Setores Y: não múltiplos de p
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Não-Y: alguns múltiplos, alguns não
  const numMult = Math.max(1, Math.round(idxNotY.length * 0.5));
  const [idxMult, idxNonMult] = partitionIndices(idxNotY, [numMult]);
  const multNums = pickDistinct(CH_MULT_OK[p], idxMult.length);
  idxMult.forEach((idx, i) => values[idx] = multNums[i]);
  const nmPool = CH_DIV_NO.filter(v => v % p !== 0);
  const nmNums = pickDistinct(nmPool.length > 0 ? nmPool : CH_DIV_NO, (idxNonMult || []).length);
  (idxNonMult || []).forEach((idx, i) => values[idx] = nmNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorY && v % p === 0 ? i : -1).filter(i => i >= 0);
  const evB = idxY;
  if (evA.length === 0 || evB.length === 0) return null;
  if (n >= 3 && evA.length + evB.length >= n) return null;

  return {
    values, m: null, p, colorX: null, colorY, problemType: 10,
    events: [
      createEvent('A', `não ocorrer ${colorY} e obter número múltiplo de ${p}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorY}`, evB, n),
    ]
  };
}

// Tipo 11: NÃO (X ou Y) E divisor de m (+ cor X + cor Y)
function genType11(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const values: number[] = new Array(n).fill(0);

  // X e Y: DIV_NO
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Externos: alguns divisores, alguns nenhum
  const numDiv = Math.max(1, Math.round(idxO.length * 0.5));
  const [idxDiv, idxNeith] = partitionIndices(idxO, [numDiv]);
  const divNums = pickDistinct(CH_DIV_OK, idxDiv.length);
  const m = computeMinM(divNums);
  if (m < 2) return null;
  idxDiv.forEach((idx, i) => values[idx] = divNums[i]);
  const nNums = pickDistinct(CH_DIV_NO, (idxNeith || []).length);
  (idxNeith || []).forEach((idx, i) => values[idx] = nNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorX && colors[i] !== colorY && m % v === 0 ? i : -1).filter(i => i >= 0);
  const evB = idxX;
  const evC = idxY;
  if (evA.length === 0 || evB.length === 0 || evC.length === 0) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m, p: null, colorX, colorY, problemType: 11,
    events: [
      createEvent('A', `não ocorrer ${colorX} nem ${colorY} e obter divisor de ${m}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorX}`, evB, n),
      createEvent('C', `ocorrer a cor ${colorY}`, evC, n),
    ]
  };
}

// Tipo 12: NÃO (X ou Y) E múltiplo de p (+ cor X + cor Y)
function genType12(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];
  const values: number[] = new Array(n).fill(0);

  // X e Y: não múltiplos de p
  const xNums = pickDistinct(CH_DIV_NO, idxX.length);
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Externos: alguns múltiplos de p, alguns nenhum
  const numMult = Math.max(1, Math.round(idxO.length * 0.5));
  const [idxMult, idxNeith] = partitionIndices(idxO, [numMult]);
  const multNums = pickDistinct(CH_MULT_OK[p], idxMult.length);
  idxMult.forEach((idx, i) => values[idx] = multNums[i]);
  const nmPool = CH_DIV_NO.filter(v => v % p !== 0);
  const nNums = pickDistinct(nmPool.length > 0 ? nmPool : CH_DIV_NO, (idxNeith || []).length);
  (idxNeith || []).forEach((idx, i) => values[idx] = nNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorX && colors[i] !== colorY && v % p === 0 ? i : -1).filter(i => i >= 0);
  const evB = idxX;
  const evC = idxY;
  if (evA.length === 0 || evB.length === 0 || evC.length === 0) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m: null, p, colorX, colorY, problemType: 12,
    events: [
      createEvent('A', `não ocorrer ${colorX} nem ${colorY} e obter múltiplo de ${p}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorX}`, evB, n),
      createEvent('C', `ocorrer a cor ${colorY}`, evC, n),
    ]
  };
}

// Tipo 13: NÃO (X ou Y) E NÃO múltiplo de p (+ cor X + cor Y e primo)
function genType13(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const p = [2, 3, 5][Math.floor(Math.random() * 3)];
  const values: number[] = new Array(n).fill(0);

  // Setores X: quaisquer (evento B = cor X)
  const xNums = pickDistinct(CH_COMP_EVEN, idxX.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);

  // Setores Y: primos (evento C = cor Y e primo)
  const yPrimeNums = pickDistinct(CH_PRIME_ODD, idxY.length);
  idxY.forEach((idx, i) => values[idx] = yPrimeNums[i]);

  // Externos: alguns NÃO múlt de p (evento A), alguns múlt de p (nenhum)
  const numNotMult = Math.max(1, Math.round(idxO.length * 0.5));
  const [idxNotMult, idxMult] = partitionIndices(idxO, [numNotMult]);

  // Não múlt de p: usar números DIV_NO não divisíveis por p
  const nmPool = CH_DIV_NO.filter(v => v % p !== 0);
  const nmNums = pickDistinct(nmPool.length > 0 ? nmPool : CH_DIV_NO, idxNotMult.length);
  idxNotMult.forEach((idx, i) => values[idx] = nmNums[i]);

  // Múlt de p: estes são "nenhum" (fora de X∪Y mas SÃO múlt de p)
  const mNums = pickDistinct(CH_MULT_OK[p], (idxMult || []).length);
  (idxMult || []).forEach((idx, i) => values[idx] = mNums[i]);

  const evA = values.map((v, i) => colors[i] !== colorX && colors[i] !== colorY && v % p !== 0 ? i : -1).filter(i => i >= 0);
  const evB = idxX;
  const evC = values.map((v, i) => colors[i] === colorY && isPrime(v) ? i : -1).filter(i => i >= 0);
  if (evA.length === 0 || evB.length === 0 || evC.length === 0) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m: null, p, colorX, colorY, problemType: 13,
    events: [
      createEvent('A', `não ocorrer ${colorX} nem ${colorY} e obter número que não é múltiplo de ${p}`, evA, n),
      createEvent('B', `ocorrer a cor ${colorX}`, evB, n),
      createEvent('C', `ocorrer ${colorY} e número primo`, evC, n),
    ]
  };
}

// Tipo 14: NÃO (X ou Y) E NÃO divisor de m (+ cor X e par + cor Y)
function genType14(sectors: RouletteSector[], colors: string[], uniqueColors: string[], n: number): ChallengeGenResult | null {
  if (uniqueColors.length < 3) return null;
  const [colorX, colorY] = shuffleArray([...uniqueColors]);
  const idxX = colorIndices(colors, colorX);
  const idxY = colorIndices(colors, colorY);
  const idxO = colors.map((c, i) => c !== colorX && c !== colorY ? i : -1).filter(i => i >= 0);
  if (idxX.length === 0 || idxY.length === 0 || idxO.length === 0) return null;

  const values: number[] = new Array(n).fill(0);

  // Setores X: números pares (evento B = cor X e par)
  const xNums = pickDistinct(CH_COMP_EVEN, idxX.length);
  idxX.forEach((idx, i) => values[idx] = xNums[i]);

  // Setores Y: DIV_NO
  const yNums = pickDistinct(CH_DIV_NO, idxY.length);
  idxY.forEach((idx, i) => values[idx] = yNums[i]);

  // Externos: alguns não-divisores (evento A), alguns divisores (nenhum)
  const numNonDiv = Math.max(1, Math.round(idxO.length * 0.5));
  const [idxNonDiv, idxDiv] = partitionIndices(idxO, [numNonDiv]);

  const nonDivNums = pickDistinct(CH_DIV_NO, idxNonDiv.length);
  idxNonDiv.forEach((idx, i) => values[idx] = nonDivNums[i]);

  const divNums = pickDistinct(CH_DIV_OK, (idxDiv || []).length);
  (idxDiv || []).forEach((idx, i) => values[idx] = divNums[i]);

  // Encontrar m: números div devem dividir m, números não-div NÃO devem
  const actualDivNums = (idxDiv || []).map(idx => values[idx]);
  const m = actualDivNums.length > 0 ? computeMinM(actualDivNums) : 30;
  if (m < 2) return null;

  // Verificar que setores não-div e Y não dividem m
  const evACheck = [...idxNonDiv, ...idxY].every(idx => m % values[idx] !== 0);
  if (!evACheck) return null;

  const evA = values.map((v, i) => colors[i] !== colorX && colors[i] !== colorY && m % v !== 0 ? i : -1).filter(i => i >= 0);
  const evB = values.map((v, i) => colors[i] === colorX && v % 2 === 0 ? i : -1).filter(i => i >= 0);
  const evC = idxY;
  if (evA.length === 0 || evB.length === 0 || evC.length === 0) return null;
  if (n >= 5 && evA.length + evB.length + evC.length >= n) return null;

  return {
    values, m, p: null, colorX, colorY, problemType: 14,
    events: [
      createEvent('A', `não ocorrer ${colorX} nem ${colorY} e obter número que não é divisor de ${m}`, evA, n),
      createEvent('B', `ocorrer ${colorX} e número par`, evB, n),
      createEvent('C', `ocorrer a cor ${colorY}`, evC, n),
    ]
  };
}

// Gerador principal de desafios — tenta tipos compatíveis embaralhados com repetição
function generateUnionChallenge(
  sectors: RouletteSector[],
  problemType?: ChallengeType
): ChallengeGenResult | null {
  const colors = sectors.map(s => s.colorName);
  const uniqueColors = [...new Set(colors)];
  const n = sectors.length;
  const compatibleTypes = getCompatibleChallengeTypes(sectors);
  if (compatibleTypes.length === 0) return null;

  const generators: Record<number, (s: RouletteSector[], c: string[], uc: string[], n: number) => ChallengeGenResult | null> = {
    1: genType1, 2: genType2, 3: genType3, 4: genType4, 5: genType5,
    6: genType6, 7: genType7, 8: genType8, 9: genType9, 10: genType10,
    11: genType11, 12: genType12, 13: genType13, 14: genType14,
  };

  // Se tipo específico solicitado e compatível, tentar primeiro
  if (problemType && compatibleTypes.includes(problemType)) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = generators[problemType](sectors, colors, uniqueColors, n);
      if (result) return result;
    }
  }

  // Tentar todos os tipos compatíveis em ordem aleatória
  const shuffledTypes = shuffleArray([...compatibleTypes]);
  for (const type of shuffledTypes) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = generators[type](sectors, colors, uniqueColors, n);
      if (result) return result;
    }
  }

  return null;
}

// === GERADOR DO DESAFIO — INTERSEÇÃO DE EVENTOS ===

// Pool mestre de números candidatos (evitar 0 e 1)
const INTER_MASTER_POOL = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,25,27,29,30];
const INTER_SQUARES = [4,9,16,25];

// Spec de cada tipo: [cond1, cond2, needsM, needsP, needsK]
interface InterTypeSpec {
  c1: string; c2: string; mReq: boolean; pReq: boolean; kReq: boolean;
  desc: (m: number|null, p: number|null, k: number|null) => string;
}

function descDiv(m: number|null) { return `divisor de ${m}`; }
function descNDiv(m: number|null) { return `não divisor de ${m}`; }
function descMult(p: number|null) { return `múltiplo de ${p}`; }
function descNMult(p: number|null) { return `não múltiplo de ${p}`; }
function descMultK(k: number|null) { return `múltiplo de ${k}`; }

const INTER_TYPES: Record<number, InterTypeSpec> = {
  // A) Divisor de m + paridade/primalidade
  1:  { c1:'div',  c2:'even',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e par` },
  2:  { c1:'div',  c2:'odd',   mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e ímpar` },
  3:  { c1:'div',  c2:'prime', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e primo` },
  4:  { c1:'div',  c2:'comp',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e composto` },
  // B) NÃO divisor + paridade/primalidade
  5:  { c1:'!div', c2:'even',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e par` },
  6:  { c1:'!div', c2:'odd',   mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e ímpar` },
  7:  { c1:'!div', c2:'prime', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e primo` },
  8:  { c1:'!div', c2:'comp',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e composto` },
  // C) NÃO divisor + NÃO propriedade
  9:  { c1:'!div', c2:'!even', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e não par` },
  10: { c1:'!div', c2:'!odd',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e não ímpar` },
  11: { c1:'!div', c2:'!prime',mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e não primo` },
  12: { c1:'!div', c2:'!comp', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descNDiv(m)} e não composto` },
  // D) Múltiplo de p + paridade
  13: { c1:'multp',c2:'even',  mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descMult(p)} e par` },
  14: { c1:'multp',c2:'odd',   mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descMult(p)} e ímpar` },
  15: { c1:'!multp',c2:'even', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e par` },
  16: { c1:'!multp',c2:'odd',  mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e ímpar` },
  17: { c1:'!multp',c2:'!even',mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e não par` },
  18: { c1:'!multp',c2:'!odd', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e não ímpar` },
  // E) Divisor e múltiplo cruzados
  19: { c1:'div',  c2:'multp', mReq:true,  pReq:true,  kReq:false, desc:(m,p)=>`${descDiv(m)} e ${descMult(p)}` },
  20: { c1:'div',  c2:'!multp',mReq:true,  pReq:true,  kReq:false, desc:(m,p)=>`${descDiv(m)} e ${descNMult(p)}` },
  21: { c1:'!div', c2:'multp', mReq:true,  pReq:true,  kReq:false, desc:(m,p)=>`${descNDiv(m)} e ${descMult(p)}` },
  22: { c1:'!div', c2:'!multp',mReq:true,  pReq:true,  kReq:false, desc:(m,p)=>`${descNDiv(m)} e ${descNMult(p)}` },
  // F) Quadrados perfeitos
  23: { c1:'sq',   c2:'odd',   mReq:false, pReq:false, kReq:false, desc:()=>'quadrado perfeito e ímpar' },
  24: { c1:'sq',   c2:'even',  mReq:false, pReq:false, kReq:false, desc:()=>'quadrado perfeito e par' },
  // G) Primo/Par/Composto
  25: { c1:'prime',c2:'odd',   mReq:false, pReq:false, kReq:false, desc:()=>'primo e ímpar' },
  26: { c1:'prime',c2:'even',  mReq:false, pReq:false, kReq:false, desc:()=>'primo e par' },
  27: { c1:'comp', c2:'even',  mReq:false, pReq:false, kReq:false, desc:()=>'composto e par' },
  28: { c1:'comp', c2:'odd',   mReq:false, pReq:false, kReq:false, desc:()=>'composto e ímpar' },
  29: { c1:'!prime',c2:'even', mReq:false, pReq:false, kReq:false, desc:()=>'não primo e par' },
  30: { c1:'!prime',c2:'odd',  mReq:false, pReq:false, kReq:false, desc:()=>'não primo e ímpar' },
  // H) Divisor + negação de propriedade
  31: { c1:'div',  c2:'!even', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e não par` },
  32: { c1:'div',  c2:'!odd',  mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e não ímpar` },
  33: { c1:'div',  c2:'!prime',mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e não primo` },
  34: { c1:'div',  c2:'!comp', mReq:true,  pReq:false, kReq:false, desc:(m)=>`${descDiv(m)} e não composto` },
  // I) Múltiplo de p + primo/composto
  35: { c1:'multp',c2:'comp',  mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descMult(p)} e composto` },
  36: { c1:'multp',c2:'prime', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descMult(p)} e primo` },
  37: { c1:'!multp',c2:'prime',mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e primo` },
  38: { c1:'!multp',c2:'comp', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`${descNMult(p)} e composto` },
  // J) Quadrado perfeito cruzado
  39: { c1:'sq',   c2:'comp',  mReq:false, pReq:false, kReq:false, desc:()=>'quadrado perfeito e composto' },
  40: { c1:'sq',   c2:'multp', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`quadrado perfeito e ${descMult(p)}` },
  41: { c1:'sq',   c2:'div',   mReq:true,  pReq:false, kReq:false, desc:(m)=>`quadrado perfeito e ${descDiv(m)}` },
  42: { c1:'!sq',  c2:'multp', mReq:false, pReq:true,  kReq:false, desc:(_,p)=>`não quadrado perfeito e ${descMult(p)}` },
  // K) Múltiplo de k
  43: { c1:'multk',c2:'odd',   mReq:false, pReq:false, kReq:true,  desc:(_,__,k)=>`${descMultK(k)} e ímpar` },
  44: { c1:'multk',c2:'even',  mReq:false, pReq:false, kReq:true,  desc:(_,__,k)=>`${descMultK(k)} e par` },
  45: { c1:'multk',c2:'div',   mReq:true,  pReq:false, kReq:true,  desc:(m,_,k)=>`${descMultK(k)} e ${descDiv(m)}` },
};

// Avaliar um único predicado sobre um valor
function evalInterPred(v: number, pred: string, m: number|null, p: number|null, k: number|null): boolean {
  switch (pred) {
    case 'div':    return m !== null && m % v === 0;
    case '!div':   return m !== null && m % v !== 0;
    case 'multp':  return p !== null && v % p === 0;
    case '!multp': return p !== null && v % p !== 0;
    case 'multk':  return k !== null && v % k === 0;
    case '!multk': return k !== null && v % k !== 0;
    case 'even':   return v % 2 === 0;
    case '!even':  return v % 2 !== 0;
    case 'odd':    return v % 2 !== 0;
    case '!odd':   return v % 2 === 0;
    case 'prime':  return isPrime(v);
    case '!prime': return !isPrime(v);
    case 'comp':   return v > 1 && !isPrime(v);
    case '!comp':  return isPrime(v); // para v >= 2 (evitamos 1)
    case 'sq':     return INTER_SQUARES.includes(v);
    case '!sq':    return !INTER_SQUARES.includes(v);
    default:       return false;
  }
}

// Calcular o conjunto solução para um problema de interseção
function solveIntersectionSet(
  problemType: number, values: number[], m: number|null, p: number|null, k: number|null
): Set<number> {
  const spec = INTER_TYPES[problemType];
  if (!spec) return new Set();
  const result = new Set<number>();
  for (let i = 0; i < values.length; i++) {
    if (evalInterPred(values[i], spec.c1, m, p, k) && evalInterPred(values[i], spec.c2, m, p, k)) {
      result.add(i);
    }
  }
  return result;
}

// Validar que um problema está bem formulado
function validateIntersection(
  problemType: number, values: number[], m: number|null, p: number|null, k: number|null, n: number
): boolean {
  const sol = solveIntersectionSet(problemType, values, m, p, k);
  if (sol.size === 0) return false; // evento não pode ser vazio
  if (n >= 3 && sol.size >= n) return false; // evitar P=1 trivial quando N permite
  return true;
}

// Obter tipos de interseção compatíveis para um dado N
function getCompatibleInterTypes(): number[] {
  const types: number[] = [];
  for (let t = 1; t <= 45; t++) {
    // Tipo 26 (primo ∩ par) requer colocar 2 — viável se n >= 2 (sempre)
    // Tipo 36 (múlt ∩ primo) requer colocar p — sempre viável
    // Tipos 43-45 (k): sempre viáveis
    types.push(t);
  }
  return types;
}

// Encontrar números do pool mestre que satisfazem ambas as condições
function interSatisfyPool(c1: string, c2: string, m: number|null, p: number|null, k: number|null): number[] {
  return INTER_MASTER_POOL.filter(v =>
    evalInterPred(v, c1, m, p, k) && evalInterPred(v, c2, m, p, k)
  );
}

// Encontrar números do pool mestre que falham em pelo menos uma condição
function interFailPool(c1: string, c2: string, m: number|null, p: number|null, k: number|null): number[] {
  return INTER_MASTER_POOL.filter(v =>
    !evalInterPred(v, c1, m, p, k) || !evalInterPred(v, c2, m, p, k)
  );
}

// Gerar todos os valores candidatos de m (2^a * 3^b * 5^c, 2 ≤ m ≤ 3000)
function allCandidateM(): number[] {
  const ms: number[] = [];
  for (let a = 0; a <= 5; a++) {
    for (let b = 0; b <= 5; b++) {
      for (let c = 0; c <= 5; c++) {
        const m = Math.pow(2,a) * Math.pow(3,b) * Math.pow(5,c);
        if (m >= 2 && m <= 3000) ms.push(m);
      }
    }
  }
  return ms;
}

// Gerador principal
function generateIntersectionChallenge(
  sectors: RouletteSector[],
  requestedType?: number
): { values: number[]; m: number|null; p: number|null; k: number|null; problemType: number; description: string } | null {
  const n = sectors.length;
  const compatible = getCompatibleInterTypes();
  if (compatible.length === 0) return null;

  // Tentar tipo solicitado primeiro, depois fallback para aleatório
  const typesToTry: number[] = [];
  if (requestedType && compatible.includes(requestedType)) {
    typesToTry.push(requestedType);
  }
  // Adicionar tipos restantes embaralhados
  const remaining = shuffleArray(compatible.filter(t => t !== requestedType));
  typesToTry.push(...remaining);

  for (const pType of typesToTry) {
    const result = tryGenerateInterType(pType, n);
    if (result) return result;
  }
  return null;
}

function tryGenerateInterType(
  pType: number, n: number
): { values: number[]; m: number|null; p: number|null; k: number|null; problemType: number; description: string } | null {
  const spec = INTER_TYPES[pType];
  if (!spec) return null;

  // Determinar candidatos de parâmetros
  const mCandidates = spec.mReq ? shuffleArray(allCandidateM()).slice(0, 40) : [null];
  const pCandidates = spec.pReq ? shuffleArray([2, 3, 5]) : [null];
  const kCandidates = spec.kReq ? shuffleArray([3, 4, 6]) : [null];

  // Caso especial: tipo 26 (primo ∩ par) precisa do número 2
  // Caso especial: tipo 36 (múlt ∩ primo) precisa do próprio p como número

  let bestResult: { values: number[]; m: number|null; p: number|null; k: number|null; score: number } | null = null;

  for (const pVal of pCandidates) {
    for (const kVal of kCandidates) {
      for (const mVal of mCandidates) {
        const sat = interSatisfyPool(spec.c1, spec.c2, mVal, pVal, kVal);
        const fail = interFailPool(spec.c1, spec.c2, mVal, pVal, kVal);
        if (sat.length === 0) continue;
        if (n >= 3 && fail.length === 0) continue; // seria trivial

        // Construir valores: contagem-alvo de setores satisfatórios
        const target = n >= 4 ? 2 : 1;
        const numSat = Math.min(target, sat.length, n - (n >= 3 ? 1 : 0));
        const numFail = n - numSat;

        if (numSat <= 0) continue;
        if (n >= 3 && numFail <= 0) continue;

        // Selecionar números
        const satNums = pickDistinct(shuffleArray([...sat]), numSat);
        const failNums = pickDistinct(shuffleArray([...fail]), numFail);

        // Atribuir a posições aleatórias dos setores
        const indices = shuffleArray(Array.from({length: n}, (_, i) => i));
        const values: number[] = new Array(n).fill(0);
        for (let i = 0; i < numSat; i++) values[indices[i]] = satNums[i];
        for (let i = 0; i < numFail; i++) values[indices[numSat + i]] = failNums[i];

        // Validar
        if (!validateIntersection(pType, values, mVal, pVal, kVal, n)) continue;

        // Pontuar
        const solSize = solveIntersectionSet(pType, values, mVal, pVal, kVal).size;
        const score = -Math.abs(solSize - target) - (mVal !== null ? 0.0005 * mVal : 0);

        if (!bestResult || score > bestResult.score) {
          bestResult = { values, m: mVal, p: pVal, k: kVal, score };
        }

        // Saída antecipada se suficientemente bom
        if (score >= -0.5) break;
      }
      if (bestResult && bestResult.score >= -0.5) break;
    }
    if (bestResult && bestResult.score >= -0.5) break;
  }

  if (!bestResult) return null;

  const description = spec.desc(bestResult.m, bestResult.p, bestResult.k);
  return {
    values: bestResult.values,
    m: bestResult.m,
    p: bestResult.p,
    k: bestResult.k,
    problemType: pType,
    description,
  };
}

// ========== GERADOR DE EVENTOS COMPLEMENTARES (T1-T6) ==========

const COMP_PROPERTIES: string[] = [
  'par', 'ímpar', 'primo', 'composto',
  'divisível por 3', 'divisível por 5', 'múltiplo de 3',
];

function computeBitmask(indices: number[]): number {
  let mask = 0;
  for (const idx of indices) mask |= (1 << idx);
  return mask;
}

function getComplementText(prop: string): string {
  if (prop.startsWith('não ')) return prop.slice(4);
  return `não ${prop}`;
}

interface CompEventResult {
  textA: string;
  textAbar: string;
  indicesA: number[];
  indicesAbar: number[];
  needsNumbers: boolean;
  templateType: number;
}

// T1: Cor X
function tryCompT1(sectors: RouletteSector[], n: number, allIndices: number[]): CompEventResult | null {
  const colors = [...new Set(sectors.map(s => s.colorName))];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const indicesA = allIndices.filter(i => sectors[i].colorName === color);
  const indicesAbar = allIndices.filter(i => sectors[i].colorName !== color);
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `ocorrer a cor ${color}`,
    textAbar: `não ocorrer a cor ${color}`,
    indicesA, indicesAbar, needsNumbers: false, templateType: 1,
  };
}

// T2: Propriedade numérica P
function tryCompT2(sectors: RouletteSector[], sectorNumbers: number[], n: number, allIndices: number[]): CompEventResult | null {
  const prop = COMP_PROPERTIES[Math.floor(Math.random() * COMP_PROPERTIES.length)];
  const indicesA = allIndices.filter(i => checkProperty(sectorNumbers[i], prop));
  const indicesAbar = allIndices.filter(i => !checkProperty(sectorNumbers[i], prop));
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `obter número ${prop}`,
    textAbar: `obter número ${getComplementText(prop)}`,
    indicesA, indicesAbar, needsNumbers: true, templateType: 2,
  };
}

// T3: Cor X E propriedade P (interseção)
function tryCompT3(sectors: RouletteSector[], sectorNumbers: number[], n: number, allIndices: number[]): CompEventResult | null {
  const colors = [...new Set(sectors.map(s => s.colorName))];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const prop = COMP_PROPERTIES[Math.floor(Math.random() * COMP_PROPERTIES.length)];
  const indicesA = allIndices.filter(i =>
    sectors[i].colorName === color && checkProperty(sectorNumbers[i], prop)
  );
  const indicesAbar = allIndices.filter(i => !indicesA.includes(i));
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `ocorrer a cor ${color} e obter número ${prop}`,
    textAbar: `não ocorrer a cor ${color} ou obter número ${getComplementText(prop)}`,
    indicesA, indicesAbar, needsNumbers: true, templateType: 3,
  };
}

// T4: Cor X OU propriedade P (união)
function tryCompT4(sectors: RouletteSector[], sectorNumbers: number[], n: number, allIndices: number[]): CompEventResult | null {
  const colors = [...new Set(sectors.map(s => s.colorName))];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const prop = COMP_PROPERTIES[Math.floor(Math.random() * COMP_PROPERTIES.length)];
  const indicesA = allIndices.filter(i =>
    sectors[i].colorName === color || checkProperty(sectorNumbers[i], prop)
  );
  const indicesAbar = allIndices.filter(i => !indicesA.includes(i));
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `ocorrer a cor ${color} ou obter número ${prop}`,
    textAbar: `não ocorrer a cor ${color} e obter número ${getComplementText(prop)}`,
    indicesA, indicesAbar, needsNumbers: true, templateType: 4,
  };
}

// T5: (Cor X E P) OU (Cor Y E Q)
function tryCompT5(sectors: RouletteSector[], sectorNumbers: number[], n: number, allIndices: number[]): CompEventResult | null {
  const colors = [...new Set(sectors.map(s => s.colorName))];
  if (colors.length < 2) return null;
  const sc = [...colors].sort(() => Math.random() - 0.5);
  const cX = sc[0], cY = sc[1];
  const sp = [...COMP_PROPERTIES].sort(() => Math.random() - 0.5);
  const pP = sp[0], pQ = sp[1] || sp[0];
  // Cada ramo do OU deve ser realizável individualmente
  const branchX = allIndices.filter(i => sectors[i].colorName === cX && checkProperty(sectorNumbers[i], pP));
  const branchY = allIndices.filter(i => sectors[i].colorName === cY && checkProperty(sectorNumbers[i], pQ));
  if (branchX.length === 0 || branchY.length === 0) return null;
  const indicesA = [...new Set([...branchX, ...branchY])];
  const indicesAbar = allIndices.filter(i => !indicesA.includes(i));
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `(ocorrer a cor ${cX} e obter número ${pP}) ou (ocorrer a cor ${cY} e obter número ${pQ})`,
    textAbar: `(não ocorrer a cor ${cX} ou obter número ${getComplementText(pP)}) e (não ocorrer a cor ${cY} ou obter número ${getComplementText(pQ)})`,
    indicesA, indicesAbar, needsNumbers: true, templateType: 5,
  };
}

// T6: (Cor X OU P) E (Cor Y OU Q)
function tryCompT6(sectors: RouletteSector[], sectorNumbers: number[], n: number, allIndices: number[]): CompEventResult | null {
  const colors = [...new Set(sectors.map(s => s.colorName))];
  if (colors.length < 2) return null;
  const sc = [...colors].sort(() => Math.random() - 0.5);
  const cX = sc[0], cY = sc[1];
  const sp = [...COMP_PROPERTIES].sort(() => Math.random() - 0.5);
  const pP = sp[0], pQ = sp[1] || sp[0];
  // Cada ramo do E deve ser realizável individualmente
  const branchX = allIndices.filter(i => sectors[i].colorName === cX || checkProperty(sectorNumbers[i], pP));
  const branchY = allIndices.filter(i => sectors[i].colorName === cY || checkProperty(sectorNumbers[i], pQ));
  if (branchX.length === 0 || branchY.length === 0) return null;
  const indicesA = allIndices.filter(i => branchX.includes(i) && branchY.includes(i));
  const indicesAbar = allIndices.filter(i => !indicesA.includes(i));
  if (indicesA.length === 0 || indicesA.length === n) return null;
  return {
    textA: `(ocorrer a cor ${cX} ou obter número ${pP}) e (ocorrer a cor ${cY} ou obter número ${pQ})`,
    textAbar: `(não ocorrer a cor ${cX} e obter número ${getComplementText(pP)}) ou (não ocorrer a cor ${cY} e obter número ${getComplementText(pQ)})`,
    indicesA, indicesAbar, needsNumbers: true, templateType: 6,
  };
}

function generateComplementaryEvent(
  sectors: RouletteSector[],
  sectorNumbers: number[],
  usedBitmasks: number[],
  avoidHalf = false
): CompEventResult | null {
  const n = sectors.length;
  const allIndices = Array.from({ length: n }, (_, i) => i);

  interface Candidate extends CompEventResult { bitmask: number; score: number; }
  const candidates: Candidate[] = [];

  for (let attempt = 0; attempt < 20; attempt++) {
    const maxT = n >= 5 ? 6 : n >= 3 ? 4 : 2;
    const t = Math.floor(Math.random() * maxT) + 1;
    let r: CompEventResult | null = null;
    switch (t) {
      case 1: r = tryCompT1(sectors, n, allIndices); break;
      case 2: r = tryCompT2(sectors, sectorNumbers, n, allIndices); break;
      case 3: r = tryCompT3(sectors, sectorNumbers, n, allIndices); break;
      case 4: r = tryCompT4(sectors, sectorNumbers, n, allIndices); break;
      case 5: r = tryCompT5(sectors, sectorNumbers, n, allIndices); break;
      case 6: r = tryCompT6(sectors, sectorNumbers, n, allIndices); break;
    }
    if (!r) continue;
    if (r.indicesA.length === 0 || r.indicesA.length === n) continue;
    if (avoidHalf && n >= 3 && n <= 6 && n % 2 === 0 && r.indicesA.length === n / 2) continue;
    const bm = computeBitmask(r.indicesA);
    if (usedBitmasks.includes(bm)) continue;
    candidates.push({ ...r, bitmask: bm, score: 1 - Math.abs(r.indicesA.length / n - 0.5) });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ========== FIM GERADOR DE EVENTOS COMPLEMENTARES ==========

// ========== HELPERS ETAPA 2 — PROBABILIDADE NÃO EQUIPROVÁVEL ==========

// Divisores inteiros positivos de 360 (excluindo 360, pois geraria 1 setor só)
const DIVISORS_OF_360 = [
  1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180
];

// Ângulo mínimo permitido por k para garantir legibilidade em celular
// e existência matemática do vetor de inteiros distintos.
// k=2 → m≥120 | k=3 → m≥60 | k=4 → m≥36 | k=5 → m≥24 | k=6 → m≥15
function getMinM(k: number): number {
  switch (k) {
    case 2: return 120;
    case 3: return 60;
    case 4: return 36;
    case 5: return 24;
    case 6: return 15;
    default: return 120;
  }
}

function generateNonEquiprobableAngles(k: number): { m: number; S: number; ki: number[]; angles: number[] } {
  const minM = getMinM(k);
  const filtered = DIVISORS_OF_360.filter(d => d >= minM);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  for (const m of shuffled) {
    const S = 360 / m;
    const minSum = k * (k + 1) / 2;

    // Regra de robustez: S >= k(k+1)/2
    if (S < minSum) continue;

    // Gerar base [1, 2, ..., k]
    const base = Array.from({ length: k }, (_, i) => i + 1);
    const remaining = S - minSum;

    // Somar remaining no maior elemento para manter distinção
    base[k - 1] += remaining;

    // Embaralhar mas manter "1" presente
    const ki = [...base].sort(() => Math.random() - 0.5);

    // Calcular ângulos
    const angles = ki.map(v => v * m);

    // Validações obrigatórias
    const sumAngles = angles.reduce((a, b) => a + b, 0);
    const allDistinct = new Set(angles).size === k;
    const allIntegers = angles.every(a => Number.isInteger(a));
    const minAngle = Math.min(...angles);
    const allDivisible = angles.every(a => a % m === 0);

    if (sumAngles === 360 && allDistinct && allIntegers && minAngle === m && allDivisible) {
      return { m, S, ki, angles };
    }
  }

  // Fallback: lista filtrada esgotou sem solução válida — não deve ocorrer
  return generateNonEquiprobableAngles(k);
}

function weightedRandomColor(sectors: RouletteSector[]): string {
  const totalAngle = sectors.reduce((sum, s) => sum + s.angle, 0);
  const rand = Math.random() * totalAngle;
  let cumAngle = 0;
  for (const sector of sectors) {
    cumAngle += sector.angle;
    if (rand < cumAngle) return sector.colorName;
  }
  return sectors[sectors.length - 1].colorName;
}

// ===== ETAPA 3: Geração de roleta com cores repetidas =====
const S3_COLOR_POOL = ['Verde', 'Vermelho', 'Amarelo', 'Azul', 'Laranja', 'Roxo', 'Rosa', 'Ciano'];

// Estados válidos (partições) para n=7 e n=8.
// counts[0] = C1 (mais frequente, dispersa), counts[1] = C2 (segunda, agrupada),
// counts[2..] = cores de preenchimento (1 setor cada).
// Regra: com count2=k, maxRun(C1) < k → C1 pode ter run ≤ k-1.
// count2=2: C1 totalmente isolado → máx ⌈(n-2)/2⌉ = 3 para n=7/8 → count1 ≤ 3.
// count2=3: C1 run ≤ 2 → mais flexível.
// Estados [4,2,1] e [4,2,1,1] são impossíveis (count1=4 > 3 com count2=2).
const S3_STATES_8: number[][] = [
  [3, 2, 1, 1, 1], // 5 cores: C1×3 dispersa, C2×2 agrupada, 3 únicas
  [4, 3, 1],       // 3 cores: C1×4 dispersa (run≤2), C2×3 agrupada, 1 única
];

function s3RandInt(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function s3Shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Maior sequência circular contígua de uma cor */
function s3MaxRunCircular(arr: string[], color: string): number {
  const n = arr.length;
  let best = 0, cur = 0;
  for (let i = 0; i < 2 * n; i++) {
    if (arr[i % n] === color) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return Math.min(best, n);
}

/** Verifica se todos os setores de uma cor formam um único bloco circular contíguo */
function s3IsSingleCircularBlock(arr: string[], color: string): boolean {
  const n = arr.length;
  let transitions = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] === color && arr[(i + 1) % n] !== color) transitions++;
  }
  return transitions === 1 || arr.every(c => c === color);
}

/**
 * Gero disco da Etapa 3: 7 ou 8 setores iguais, cores repetidas, viés perceptivo.
 *
 * Garantias:
 *   - C1 (mais frequente) DISPERSA: não forma bloco único, run máxima < count2
 *   - C2 (segunda mais frequente) AGRUPADA: forma bloco único adjacente
 *   - count1 > count2, logo P(C1) > P(C2)
 *   - O viés perceptual faz C2 "parecer maior" por estar agrupada
 */
function generateS3Roulette(): {
  sectors: RouletteSector[];
  colorCounts: { [color: string]: number };
  mostFreqColor: string;
  secondFreqColor: string;
} {
  const n = 8;
  const states = S3_STATES_8;
  const counts = states[s3RandInt(0, states.length - 1)];

  // Atribuir cores: C1, C2, e cores de preenchimento
  const colors = s3Shuffle(S3_COLOR_POOL);
  const C1 = colors[0]; // mais frequente (dispersa)
  const C2 = colors[1]; // segunda (agrupada)
  const others = counts.slice(2).map((_, i) => colors[2 + i]);

  const count1 = counts[0];
  const count2 = counts[1];

  // Tentar gerar uma disposição válida (retry até 400×)
  for (let attempt = 0; attempt < 400; attempt++) {
    const wheel: (string | null)[] = Array(n).fill(null);

    // 1) Colocar C2 em bloco adjacente
    const start2 = s3RandInt(0, n - count2);
    for (let i = 0; i < count2; i++) wheel[start2 + i] = C2;

    // 2) Colocar C1 em posições vazias, evitando adjacência excessiva
    let left1 = count1;
    const empties = s3Shuffle(
      wheel.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
    );

    for (const pos of empties) {
      if (left1 === 0) break;
      wheel[pos] = C1;
      // Verificar que run circular de C1 não iguala ou supera count2
      const temp = wheel.map(x => x ?? '__');
      if (s3MaxRunCircular(temp, C1) >= count2) {
        wheel[pos] = null; // desfazer
        continue;
      }
      left1--;
    }
    if (left1 > 0) continue; // não conseguiu colocar todos — retry

    // 3) Preencher posições restantes com cores de preenchimento
    const seqOthers: string[] = [];
    for (let i = 0; i < others.length; i++) {
      for (let k = 0; k < counts[2 + i]; k++) seqOthers.push(others[i]);
    }
    let oi = 0;
    for (let i = 0; i < n; i++) {
      if (wheel[i] === null) wheel[i] = seqOthers[oi++];
    }

    const result = wheel as string[];

    // 4) Validações finais
    if (!s3IsSingleCircularBlock(result, C2)) continue;  // C2 deve ser bloco único
    if (s3IsSingleCircularBlock(result, C1)) continue;   // C1 NÃO pode ser bloco único
    if (s3MaxRunCircular(result, C1) >= count2) continue; // C1 nunca agrupa tanto quanto C2

    // Válido — montar setores
    const sectorAngle = 360 / n;
    const sectors: RouletteSector[] = result.map((color, i) => ({
      color,
      colorName: color,
      angle: sectorAngle,
      number: i + 1
    }));

    const colorCounts: { [color: string]: number } = {};
    colorCounts[C1] = count1;
    colorCounts[C2] = count2;
    others.forEach((c, i) => { colorCounts[c] = counts[2 + i]; });

    return { sectors, colorCounts, mostFreqColor: C1, secondFreqColor: C2 };
  }

  // Fallback (nunca deve acontecer) — configuração fixa [3,2,1,1,1] n=8 garantida
  // C1(0), F1(1), C1(2), C2(3), C2(4), C1(5), F2(6), F3(7) → C1 em {0,2,5} isolados; C2 em {3,4} agrupados
  const fallbackColors = s3Shuffle(S3_COLOR_POOL);
  const fb: string[] = [fallbackColors[0], fallbackColors[2], fallbackColors[0], fallbackColors[1], fallbackColors[1], fallbackColors[0], fallbackColors[3], fallbackColors[4]];
  const sectorAngle = 360 / 8;
  return {
    sectors: fb.map((c, i) => ({ color: c, colorName: c, angle: sectorAngle, number: i + 1 })),
    colorCounts: { [fallbackColors[0]]: 3, [fallbackColors[1]]: 2, [fallbackColors[2]]: 1, [fallbackColors[3]]: 1, [fallbackColors[4]]: 1 },
    mostFreqColor: fallbackColors[0],
    secondFreqColor: fallbackColors[1]
  };
}

// Conjunto F — Distractores (falsos) para reflexão conceitual Etapa 2
const S2_DISTRACTORS_F = [
  'A posição final do ponteiro determinou a cor sorteada.',
  'A cor escolhida previamente influenciou o resultado.',
  'A aparência visual da cor chamou mais atenção.',
  'A distribuição das cores no disco interferiu na chance.',
  'O resultado foi afetado pelo sentido do giro.',
  'A sequência dos resultados anteriores aumentou a probabilidade dessa cor.',
  'O momento em que o giro começou influenciou o resultado.',
  'O comportamento do ponteiro ao desacelerar definiu a cor sorteada.',
  'A escolha do setor antes do giro altera a chance de ocorrência.',
  'A disposição das cores no círculo muda a probabilidade de cada uma.'
];

// Conjunto V — Alternativas verdadeiras para reflexão conceitual Etapa 2
const S2_TRUE_OPTIONS_V = [
  'O setor correspondente possui o maior ângulo.',
  'A região ocupada por essa cor é a mais extensa.',
  'A parte do disco associada a essa cor tem maior área.',
  'Esse setor abrange a maior fração do círculo.',
  'A abertura angular desse setor é superior às demais.',
  'Essa porção do disco representa a maior medida angular.',
  'O arco correspondente a essa cor é o mais amplo.',
  'A extensão desse setor na circunferência é a maior.',
  'O setor de maior ângulo central tem maior área e portanto maior chance.'
];

// Conjunto F' — Distratores para questão conceitual de Razões Angulares (subStep 3)
const S2_RATIO_DISTRACTORS = [
  'ao raio',
  'ao ângulo inscrito',
  'à corda',
  'ao diâmetro',
  'ao ângulo de segmento',
  'ao centro',
  'ao número de giros',
  'à cor ainda não sorteada'
];

// Gera as 3 alternativas da questão conceitual (1 correta + 2 incorretas)
function generateS2ConceptOptions(): { options: { value: string; label: string }[]; correctValue: string } {
  const correct = { value: 'v_correct', label: 'ao ângulo central e à área' };

  // Embaralhar distratores
  const shuffled = [...S2_RATIO_DISTRACTORS].sort(() => Math.random() - 0.5);

  // Selecionar 4 termos distintos para as 2 alternativas incorretas (2 termos cada)
  const terms = shuffled.slice(0, 4);
  const wrong1 = { value: 'f_wrong1', label: `${terms[0]} e ${terms[1]}` };
  const wrong2 = { value: 'f_wrong2', label: `${terms[2]} e ${terms[3]}` };

  // Embaralhar as 3 alternativas
  const options = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5);
  return { options, correctValue: 'v_correct' };
}

// ========== FIM HELPERS ETAPA 2 ==========

// Interface para o estado do jogo
export interface GameState {
  stage: number;
  subStep: number;
  targetSectorCount: number;
  sectors: RouletteSector[];
  showDivisions: boolean;
  isSpinning: boolean;
  spinDuration: number;
  targetAngle: number;
  currentRotation: number;
  selectedColor: string | null;
  frequencies: { [color: string]: number };
  totalSpins: number;
  showAngles: boolean;
  showNumbers: boolean;
  stage2Available: boolean;
  stage3Available: boolean;
  pendingRegistration: boolean;
  isAutoSpinning: boolean;
  autoSpinBatches: number[];
  currentAutoBatchIndex: number;
  manualSpinsRequired: number;
  manualSpinsDone: number;
  predictionColor: string;
  predictionValue: string;
  ySpins: number;
  perfectPatternDetected: boolean;
  perfectPatternExtraSpinsDone: number;
  theoreticalK: number;
  correctAnswer: string;
  studentPrediction: string | null;
  compositeEventE: string[];
  // Estados para o exercício dinâmico (Aplicação do Teorema de Laplace)
  exerciseEventE: string[]; // Cores do evento E para o exercício
  selectedSectors: number[]; // Índices dos setores selecionados pelo aluno
  sectorNumbers: number[]; // Números aleatórios atribuídos aos setores (1 a n)
  // Estados para o Desafio Dinâmico 1 (Conectivo Lógico Variável)
  challenge1P: number; // Valor de p (n ≤ p ≤ 12) para geração de números
  challenge1SectorNumbers: number[]; // Números distintos atribuídos aos setores
  challenge1PropertyY: string; // Propriedade numérica sorteada
  challenge1ValueP: number; // Valor de p para propriedades "maior que p" / "menor que p"
  challenge1EventXColors: string[]; // Cores sorteadas para o evento X
  challenge1EventXText: string; // Texto formatado do evento X
  challenge1EventXType: 'inclusao' | 'exclusao'; // Tipo do evento X (cores inclusas ou excluída)
  challenge1Connective: 'e' | 'ou'; // Conectivo lógico sorteado (E / OU)
  // Campos adicionais para o gerador de interseção (null = desafio antigo)
  challenge1InterProblemType: number | null;
  challenge1InterM: number | null;
  challenge1InterP: number | null;
  challenge1InterK: number | null;
  // Eventos Complementares
  compEventA: {
    textA: string;
    textAbar: string;
    indicesA: number[];
    indicesAbar: number[];
    needsNumbers: boolean;
    templateType: number;
  } | null;
  // ===== ETAPA 2 — Probabilidade Não Equiprovável =====
  s2K: number;                   // Número de setores sorteado (2-6)
  s2M: number;                   // Menor ângulo (divisor base de 360)
  s2Ki: number[];                // Multiplicadores inteiros (razões angulares)
  s2Angles: number[];            // Ângulos θi = ki * m
  s2SumI: number;                // Soma dos ki = S = 360/m
  s2X: number;                   // x = 1/S (probabilidade do menor setor)
  s2TableIndex: number;          // Índice do campo atual em tabelas sequenciais
  s2ManualSpinsP: number;        // P ∈ [8,15] para giros manuais
  s2PredictionColor: string;     // Cor escolhida para previsão
  s2PredictionValue: string;     // Valor da previsão do aluno
  s2AutoBatches: number[];       // Blocos de giros automáticos
  s2AutoBatchIndex: number;      // Índice do bloco atual
  s2AngleProbDecimals: string[]; // Decimais já revelados na tabela θ/360
  s2AngleProbPercents: string[]; // Porcentagens já reveladas na tabela θ/360
}

// Interface para a pergunta atual
interface CurrentQuestion {
  question: string;
  options?: QuestionOption[];
  correctAnswer?: string;
}

// Função para gerar resposta correta com variação linguística
function generateCorrectAnswer(): string {
  const girar = SYNONYMS.girar[Math.floor(Math.random() * SYNONYMS.girar.length)];
  const observar = SYNONYMS.observar[Math.floor(Math.random() * SYNONYMS.observar.length)];
  const parou = SYNONYMS.parou[Math.floor(Math.random() * SYNONYMS.parou.length)];
  const daRegiao = SYNONYMS.daRegiao[Math.floor(Math.random() * SYNONYMS.daRegiao.length)];
  const ponteiro = SYNONYMS.ponteiro[Math.floor(Math.random() * SYNONYMS.ponteiro.length)];

  return `${girar.charAt(0).toUpperCase() + girar.slice(1)} o disco ao acaso e ${observar} a cor ${daRegiao} onde ${ponteiro} ${parou}.`;
}

// Função para selecionar distratores aleatórios
function selectRandomDistractors(count: number): string[] {
  const shuffled = [...DISTRACTORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Função para verificar equivalência de frações (validação matemática por produto cruzado)
// Aceita: frações (a/b), inteiros, decimais e porcentagens.
// Regra: a/b = c/d ⟺ a×d = b×c
function areFractionsEquivalent(input: string, expected: string): boolean {
  const parseFraction = (val: string): [number, number] | null => {
    val = val.trim().replace(/\s/g, '').replace(',', '.');

    // Porcentagem (ex: "33.3%")
    if (val.endsWith('%')) {
      const num = parseFloat(val.slice(0, -1));
      return isNaN(num) ? null : [num, 100];
    }

    // Fração (ex: "2/6", "1/3")
    if (val.includes('/')) {
      const parts = val.split('/');
      if (parts.length !== 2) return null;
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (isNaN(num) || isNaN(den) || den === 0) return null;
      return [num, den];
    }

    // Decimal ou inteiro (ex: "0.5", "1")
    const num = parseFloat(val);
    return isNaN(num) ? null : [num, 1];
  };

  const a = parseFraction(input);
  const b = parseFraction(expected);

  if (!a || !b) return false;

  // Produto cruzado: a[0]/a[1] = b[0]/b[1] ⟺ a[0]×b[1] = a[1]×b[0]
  const lhs = a[0] * b[1];
  const rhs = a[1] * b[0];

  // Se ambos os lados são inteiros, comparação exata (sem erro de ponto flutuante)
  if (Number.isInteger(a[0]) && Number.isInteger(a[1]) &&
      Number.isInteger(b[0]) && Number.isInteger(b[1])) {
    return lhs === rhs;
  }

  // Para decimais/porcentagens, tolerância relativa
  const maxVal = Math.max(1, Math.abs(lhs), Math.abs(rhs));
  return Math.abs(lhs - rhs) < 0.001 * maxVal;
}

// Função auxiliar para verificar equivalência de frações em campos separados (numerador e denominador)
// Aceita qualquer fração equivalente: 2/6 é aceito quando o esperado é 1/3
function areSplitFractionsEquivalent(num: number, den: number, expectedNum: number, expectedDen: number): boolean {
  if (isNaN(num) || isNaN(den) || den === 0 || isNaN(expectedNum) || isNaN(expectedDen) || expectedDen === 0) return false;
  return num * expectedDen === den * expectedNum;
}

// Função para validar o espaço amostral
// Exige formato S={cor1, cor2, ...} com vírgulas obrigatórias separando as cores
function validateSampleSpace(input: string, colors: string[]): boolean {
  // Normalizar a entrada (ignorar maiúsculas/minúsculas e espaços extras)
  const normalized = input.trim().toLowerCase();

  // Verificar se tem o formato S={...}
  const formatMatch = normalized.match(/^s\s*=\s*\{(.+)\}$/i);
  if (!formatMatch) return false;

  // Extrair conteúdo dentro das chaves
  const content = formatMatch[1];

  // Verificar se tem vírgulas separando (obrigatório para mais de uma cor)
  if (colors.length > 1 && !content.includes(',')) return false;

  // Separar por vírgula e normalizar (ignorar espaços)
  const inputColors = content.split(',').map(c => c.trim().toLowerCase()).filter(c => c.length > 0);

  // Normalizar cores esperadas
  const expectedColors = colors.map(c => c.toLowerCase());

  // Verificar se tem o mesmo número de elementos
  if (inputColors.length !== expectedColors.length) return false;

  // Verificar se todas as cores estão presentes (ordem não importa)
  const inputSet = new Set(inputColors);
  const expectedSet = new Set(expectedColors);

  if (inputSet.size !== expectedSet.size) return false;

  for (const color of inputSet) {
    if (!expectedSet.has(color)) return false;
  }

  return true;
}

// Tamanhos de blocos sequenciais para a simulação de convergência da Etapa 2
const CONVERGENCE_BLOCKS = [10, 500, 1000, 10000, 20000];

// Conjuntos de alternativas para questão diagnóstica da Etapa 3 (subStep 1.5)
// A = corretas (contagem de setores), B = viés visual (agrupamento), I = distratores diversos
const S3_DIAG_A = [
  'Escolhi a cor que aparece em mais setores, pois quanto maior o número de setores dessa cor, maior é a chance de ela ocorrer.',
  'Escolhi a cor que se repete mais vezes no disco, porque a probabilidade depende da quantidade de casos favoráveis.',
  'Escolhi a cor com maior número de setores, já que mais ocorrências aumentam a probabilidade de ser sorteada.',
  'Escolhi a cor que ocupa mais setores no disco, pois mais setores significam maior chance no sorteio.'
];
const S3_DIAG_B = [
  'Escolhi a cor cujos setores estão juntos, pois isso dá a impressão de que ela tem mais chance.',
  'Escolhi a cor porque seus setores aparecem agrupados, o que faz parecer que ela ocorre com maior frequência.',
  'Escolhi essa cor porque os setores da mesma cor estão próximos, dando a sensação de maior probabilidade.'
];
const S3_DIAG_I = [
  'Escolhi essa cor porque chamou mais minha atenção no disco.',
  'Escolhi essa cor porque o setor parecia estar em uma posição favorável para o ponteiro parar.',
  'Escolhi essa cor porque achei que todos os setores têm a mesma chance de serem sorteados.',
  'Escolhi essa cor apenas por preferência ou intuição.',
  'Escolhi aleatoriamente, sem nenhum critério. O disco é imprevisível de qualquer forma.',
  'Escolhi porque é a cor com menos setores — acredito que cores raras têm mais "sorte".',
  'Escolhi essa cor porque é minha cor favorita — isso influencia o resultado.'
];

export const useRouletteHooks = () => {
  // Estado principal do jogo
  const [gameState, setGameState] = useState<GameState>({
    stage: 1,
    subStep: 0, // 0 = configuração inicial
    targetSectorCount: 0,
    sectors: [],
    showDivisions: false,
    isSpinning: false,
    spinDuration: 3000,
    targetAngle: 0,
    currentRotation: 0,
    selectedColor: null,
    frequencies: {},
    totalSpins: 0,
    showAngles: false,
    showNumbers: false,
    stage2Available: false,
    stage3Available: false,
    pendingRegistration: false,
    isAutoSpinning: false,
    autoSpinBatches: [50, 100, 150, 200],
    currentAutoBatchIndex: 0,
    manualSpinsRequired: 0,
    manualSpinsDone: 0,
    predictionColor: '',
    predictionValue: '',
    ySpins: 0,
    perfectPatternDetected: false,
    perfectPatternExtraSpinsDone: 0,
    theoreticalK: 0,
    correctAnswer: '',
    studentPrediction: null,
    compositeEventE: [],
    exerciseEventE: [],
    selectedSectors: [],
    sectorNumbers: [],
    // Desafio Dinâmico 1
    challenge1P: 0,
    challenge1SectorNumbers: [],
    challenge1PropertyY: '',
    challenge1ValueP: 0,
    challenge1EventXColors: [],
    challenge1EventXText: '',
    challenge1EventXType: 'inclusao',
    challenge1Connective: 'ou',
    challenge1InterProblemType: null,
    challenge1InterM: null,
    challenge1InterP: null,
    challenge1InterK: null,
    compEventA: null,
    // Etapa 2
    s2K: 0,
    s2M: 0,
    s2Ki: [],
    s2Angles: [],
    s2SumI: 0,
    s2X: 0,
    s2TableIndex: 0,
    s2ManualSpinsP: 0,
    s2PredictionColor: '',
    s2PredictionValue: '',
    s2AutoBatches: [50, 100, 200, 500],
    s2AutoBatchIndex: 0,
    s2AngleProbDecimals: [],
    s2AngleProbPercents: []
  });

  // Estado do slider
  const [sliderValue, setSliderValue] = useState(1);

  // Estado da opção selecionada
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Estado da pergunta atual
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);

  // Inputs de texto
  const [sampleSpaceInput, setSampleSpaceInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false
  });

  const [sampleSpaceCountInput, setSampleSpaceCountInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false
  });

  // Cores aleatórias para a pergunta conceitual 2.4 (P(X ou Y) = 2/k?)
  const [s2RandomColors, setS2RandomColors] = useState<{ colorX: string; colorY: string }>({ colorX: '', colorY: '' });

  // Leitura progressiva antes da tabela θ/360 (subStep 7)
  // 0-3: trechos de leitura, 4: pergunta 90°, 5: tabela ativa
  const [s2AngleReadingStep, setS2AngleReadingStep] = useState(-1);

  const [probabilityInputs, setProbabilityInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [relativeFrequencyInputs, setRelativeFrequencyInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [convergenceInputs, setConvergenceInputs] = useState<{ [key: string]: TextInputInterface }>({});
  const [colorCountInputs, setColorCountInputs] = useState<{ [color: string]: TextInputInterface }>({});

  const [theoreticalQuestion1Input, setTheoreticalQuestion1Input] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setTheoreticalQuestion1Input(prev => ({ ...prev, value: val }))
  });

  const [theoreticalQuestion2Input, setTheoreticalQuestion2Input] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setTheoreticalQuestion2Input(prev => ({ ...prev, value: val }))
  });

  const [predictionInput, setPredictionInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    type: 'natural-number',
    setValue: (val: string) => setPredictionInput(prev => ({
      ...prev,
      value: val.replace(/\D/g, '').slice(0, 5),
    })),
  });

  const [favorableCasesInput, setFavorableCasesInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setFavorableCasesInput(prev => ({ ...prev, value: val }))
  });

  // Inputs para o exercício dinâmico (Aplicação do Teorema de Laplace)
  const [exerciseNEInput, setExerciseNEInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setExerciseNEInput(prev => ({ ...prev, value: val }))
  });

  const [exerciseNSInput, setExerciseNSInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setExerciseNSInput(prev => ({ ...prev, value: val }))
  });

  const [exercisePENumeratorInput, setExercisePENumeratorInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setExercisePENumeratorInput(prev => ({ ...prev, value: val }))
  });

  const [exercisePEDenominatorInput, setExercisePEDenominatorInput] = useState<TextInputInterface>({
    value: '',
    disabled: false,
    error: false,
    setValue: (val: string) => setExercisePEDenominatorInput(prev => ({ ...prev, value: val }))
  });

  // InfoBox state
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoBoxContent, setInfoBoxContent] = useState<{
    type: 'info' | 'warning' | 'success' | 'error' | 'concept';
    title: string;
    message: string;
  }>({
    type: 'concept',
    title: '',
    message: ''
  });

  // Estado para contar exemplos vistos (experimento determinístico e aleatório)
  const [deterministicExamplesViewed, setDeterministicExamplesViewed] = useState(1);
  const [randomExamplesViewed, setRandomExamplesViewed] = useState(1);

  // Estado para exemplos de eventos mutuamente exclusivos (disjuntos)
  const [disjointExamplesViewed, setDisjointExamplesViewed] = useState(0);
  const [lastDisjointMeta, setLastDisjointMeta] = useState<DisjointExampleMeta | null>(null);
  const [disjointNeedsNumbers, setDisjointNeedsNumbers] = useState(false);

  // Estado para exercício interativo de eventos disjuntos (4º exemplo)
  const [disjointExercisePhase, setDisjointExercisePhase] = useState<'none' | 'selecting_A' | 'selecting_B' | 'correct' | 'wrong'>('none');
  const [disjointUserSelectA, setDisjointUserSelectA] = useState<number[]>([]);
  const [disjointUserSelectB, setDisjointUserSelectB] = useState<number[]>([]);
  const [disjointCorrectA, setDisjointCorrectA] = useState<number[]>([]);
  const [disjointCorrectB, setDisjointCorrectB] = useState<number[]>([]);
  const [disjointExerciseTextA, setDisjointExerciseTextA] = useState('');
  const [disjointExerciseTextB, setDisjointExerciseTextB] = useState('');

  // Estado para a fase de Probabilidade da União (subStep 6.56)
  const [unionPhase, setUnionPhase] = useState<UnionPhase>('definition1');
  const [unionActivityNum, setUnionActivityNum] = useState(1);
  const [unionCurrentEventIdx, setUnionCurrentEventIdx] = useState(0);
  const [unionEvents, setUnionEvents] = useState<UnionEvent[]>([]);
  const [unionSelectedSectors, setUnionSelectedSectors] = useState<number[]>([]);
  const [unionProbNumInput, setUnionProbNumInput] = useState({ value: '', error: false });
  const [unionProbDenInput, setUnionProbDenInput] = useState({ value: '', error: false });
  const [unionFinalNumInput, setUnionFinalNumInput] = useState({ value: '', error: false });
  const [unionFinalDenInput, setUnionFinalDenInput] = useState({ value: '', error: false });
  const [unionSectorNumbers, setUnionSectorNumbers] = useState<number[]>([]);
  const [unionMaxActivities, setUnionMaxActivities] = useState(6);
  const [unionNeedsNumbers, setUnionNeedsNumbers] = useState(false);

  // Estados para Eventos Complementares (subSteps 6.70-6.95)
  const [compPhase, setCompPhase] = useState<
    'intro' | 'selecting_A' | 'wrong_A' | 'selecting_Abar' | 'wrong_Abar' | 'show_both'
    | 'formalize1' | 'formalize2' | 'formalize3' | 'formalize4'
    | 'calc_enunciado' | 'calc_selectA' | 'calc_pa' | 'calc_selectAbar' | 'calc_showBoth' | 'calc_chain'
  >('intro');
  const [compExamplesViewed, setCompExamplesViewed] = useState(0);
  const [compCalcExampleNum, setCompCalcExampleNum] = useState(0); // 0=guiado, 1-3=independente
  const [compUserSelectA, setCompUserSelectA] = useState<number[]>([]);
  const [compUserSelectAbar, setCompUserSelectAbar] = useState<number[]>([]);
  const [compIsGuided, setCompIsGuided] = useState(true);
  const [compUsedBitmasks, setCompUsedBitmasks] = useState<number[]>([]);
  const [compChainInputs, setCompChainInputs] = useState<{
    n1: string; d1: string; n2: string; d2: string;
    finalNum: string; finalDen: string;
    errN1: boolean; errD1: boolean; errN2: boolean; errD2: boolean;
    errFinalNum: boolean; errFinalDen: boolean;
  }>({
    n1: '', d1: '', n2: '', d2: '',
    finalNum: '', finalDen: '',
    errN1: false, errD1: false, errN2: false, errD2: false,
    errFinalNum: false, errFinalDen: false,
  });
  const [compChainResult, setCompChainResult] = useState<{ decimal: string; percentage: string } | null>(null);
  const [compPaInput, setCompPaInput] = useState<{ num: string; den: string; errNum: boolean; errDen: boolean }>({ num: '', den: '', errNum: false, errDen: false });
  // Passo a passo do cálculo guiado (0 = não iniciado, 1..5 = passos)
  const [compStepByStep, setCompStepByStep] = useState(0);

  // Interpretação dos Resultados (perguntas conceituais pós-Etapa 1)
  const [interpretationPhase, setInterpretationPhase] = useState<'q1' | 'q2' | 'q3' | 'feedback' | 'done'>('q1');
  const [interpretationSelected, setInterpretationSelected] = useState('');
  // Alternativas dinâmicas para q3: { alternatives: { id: string; text: string }[]; correctId: string }
  const [interpretationQ3, setInterpretationQ3] = useState<{ alternatives: { id: string; text: string }[]; correctId: string } | null>(null);

  // Frequência Absoluta — conceito + pergunta (subStep 8.5)
  const [freqAbsQuestion, setFreqAbsQuestion] = useState<{ color: string } | null>(null);
  const [freqAbsInput, setFreqAbsInput] = useState<{ value: string; error: boolean }>({ value: '', error: false });

  // Frequência Relativa — tela conceitual (subStep 8.6): 'definition' → 'example'
  const [freqRelConceptPhase, setFreqRelConceptPhase] = useState<'definition' | 'example'>('definition');

  // Frequência Relativa — verificação conceitual (subStep 9.5)
  const [freqRelQuestion, setFreqRelQuestion] = useState<{ color: string } | null>(null);
  const [freqRelInput, setFreqRelInput] = useState<{ value: string; error: boolean }>({ value: '', error: false });

  // Problemas de consolidação LGN (subStep 15)
  const [lgnPhase, setLgnPhase] = useState<'problem1' | 'problem2' | 'note' | 'explanation' | 'verbal'>('problem1');
  const [lgnVerbalInput, setLgnVerbalInput] = useState<{ value: string; error: boolean }>({ value: '', error: false });
  const [lgnN, setLgnN] = useState(0);
  const [lgnParams, setLgnParams] = useState<{ k: number; m: number; p: number; answer1: number; answer2: number; color: string } | null>(null);
  const [lgnInput, setLgnInput] = useState<{ value: string; error: boolean }>({ value: '', error: false });

  // Melhoria 10 — Descontextualização (dado de 6 faces)
  const [diceState, setDiceState] = useState<{ face: number; rolling: boolean; rolled: boolean; answered: boolean }>({ face: 0, rolling: false, rolled: false, answered: false });
  const [diceInput, setDiceInput] = useState<{ value: string; error: boolean }>({ value: '', error: false });

  // ===== ESTADOS ETAPA 2 =====
  const [s2RatioInputs, setS2RatioInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2IxInputs, setS2IxInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2SumEquationInput, setS2SumEquationInput] = useState<TextInputInterface>({
    value: '', disabled: false, error: false,
    setValue: (val: string) => setS2SumEquationInput(prev => ({ ...prev, value: val }))
  });
  const [s2XInput, setS2XInput] = useState<TextInputInterface>({
    value: '', disabled: false, error: false,
    setValue: (val: string) => setS2XInput(prev => ({ ...prev, value: val }))
  });
  const [s2NumProbInputs, setS2NumProbInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2AngleProbInputs, setS2AngleProbInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2PredictionInput, setS2PredictionInput] = useState<TextInputInterface>({
    value: '', disabled: false, error: false,
    setValue: (val: string) => setS2PredictionInput(prev => ({ ...prev, value: val }))
  });
  const [s2FreqAbsInputs, setS2FreqAbsInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2FreqRelInputs, setS2FreqRelInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [s2ConclusionInput, setS2ConclusionInput] = useState<TextInputInterface>({
    value: '', disabled: false, error: false,
    setValue: (val: string) => setS2ConclusionInput(prev => ({ ...prev, value: val }))
  });

  // ===== ESTADOS RAZÕES ANGULARES (subStep 3) — State Machine =====
  // STATE 0: init — roleta clicável, tabela oculta, questão oculta
  // STATE 1: unit_selected — setor-unidade destacado, questão conceitual visível
  // STATE 2: question_correct — tabela desbloqueada
  // STATE 3: table_checked — feedback por linha, avançar se tudo correto
  const [s2RatioPhase, setS2RatioPhase] = useState<
    'init' | 'unit_selected' |
    'ratio_question' | 'area_question' | 'prob_question' |
    'question_correct' | 'table_checked'
  >('init');
  const [s2ConceptQuestion, setS2ConceptQuestion] = useState<{ options: { value: string; label: string }[]; correctValue: string } | null>(null);
  const [s2ConceptSelected, setS2ConceptSelected] = useState<string>('');
  const [s2UnitSectorIndex, setS2UnitSectorIndex] = useState<number>(-1);
  const [s2TableAllCorrect, setS2TableAllCorrect] = useState<boolean>(false);

  // Sequência de raciocínio (razão → área → probabilidade) antes da tabela
  const [s2ReasoningColorY, setS2ReasoningColorY] = useState<string>('');
  const [s2ReasoningAngleY, setS2ReasoningAngleY] = useState<number>(0);
  const [s2ReasoningRatio, setS2ReasoningRatio] = useState<number>(0);
  const [s2ReasoningInput, setS2ReasoningInput] = useState<string>('');
  const [s2ReasoningErrors, setS2ReasoningErrors] = useState<number>(0);
  const [s2ReasoningShowHint, setS2ReasoningShowHint] = useState<boolean>(false);

  // ===== ESTADOS subStep 4 — Probabilidades i·p (state machine) =====
  // sum_question → pergunta sobre soma das probabilidades
  // filling_table → preenchendo a tabela i·p (campo a campo)
  // guided_calc → cálculo guiado passo a passo (Sp = 1 → p = 1/S)
  const [s2IxPhase, setS2IxPhase] = useState<'sum_question' | 'filling_table' | 'guided_calc'>('sum_question');
  const [s2IxSumSelected, setS2IxSumSelected] = useState<string>('');
  const [s2IxCalcStep, setS2IxCalcStep] = useState<number>(0);

  // ===== ESTADOS FASE DE TREINOS (Treino 1-4) =====
  const [trainingState, setTrainingState] = useState<{
    active: boolean;
    currentTraining: number;
    phase: 'idle' | 'identify_sector' | 'fill_ratios' | 'fill_ip' | 'fill_sum' | 'guided_calc' | 'fill_prob' | 'completed';
    k: number; m: number; ki: number[]; angles: number[]; S: number;
    sectors: RouletteSector[];
    usedKValues: number[];
    tableIndex: number;
    calcStep: number;
    originalSectors: RouletteSector[];
    originalK: number; originalM: number; originalKi: number[];
    originalAngles: number[]; originalSumI: number;
  }>({
    active: false, currentTraining: 0, phase: 'idle',
    k: 0, m: 0, ki: [], angles: [], S: 0, sectors: [],
    usedKValues: [], tableIndex: 0, calcStep: 0,
    originalSectors: [], originalK: 0, originalM: 0, originalKi: [], originalAngles: [], originalSumI: 0,
  });
  const [trainRatioInputs, setTrainRatioInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [trainIxInputs, setTrainIxInputs] = useState<{ [color: string]: TextInputInterface }>({});
  const [trainSumInput, setTrainSumInput] = useState<TextInputInterface>({
    value: '', disabled: true, error: false,
    setValue: (val: string) => setTrainSumInput(prev => ({ ...prev, value: val }))
  });
  const [trainProbInputs, setTrainProbInputs] = useState<{ [color: string]: TextInputInterface }>({});

  // ===== TREINOS DE FRAÇÃO (subStep 8 da Etapa 2) =====
  const [fracTraining, setFracTraining] = useState<{
    currentTraining: number;
    completedCount: number;
    k: number;
    angles: number[];
    colors: string[];
    allCorrect: boolean;
    usedKValues: number[];
    originalSectors: RouletteSector[];
  }>({
    currentTraining: 0, completedCount: 0,
    k: 0, angles: [], colors: [], allCorrect: false, usedKValues: [],
    originalSectors: []
  });
  const [fracThetaInputs, setFracThetaInputs] = useState<{
    [color: string]: { value: string; error: boolean; status: 'pending' | 'correct'; errorMsg: string }
  }>({});

  // ===== SIMULAÇÃO DE CONVERGÊNCIA (subStep 8.7 da Etapa 2) =====
  const [convergenceSim, setConvergenceSim] = useState<{
    currentBlock: number; // 0=pronto p/ "Girar 10", 1=10 feitos, 2=500 feitos, 3=1000 feitos, 4=10000 feitos, 5=tudo feito
    running: boolean;
    progress: number;
  }>({ currentBlock: 0, running: false, progress: 0 });

  // ===== ETAPA 3: Estado dedicado =====
  const [s3State, setS3State] = useState<{
    n: number;
    colorCounts: { [color: string]: number };
    mostFreqColor: string;
    secondFreqColor: string;
    predictionColor: string;
    betColor: string;
    betSector: number;
    countInputs: { [color: string]: { value: string; error: boolean; correct: boolean } };
    probInputs: { [color: string]: { num: string; den: string; errorNum: boolean; errorDen: boolean; status: 'pending' | 'correct'; errorMsg: string } };
    // Falácia do jogador — fase interativa (subSteps 8.1-8.5)
    spinHistory: string[];
    spinCount: number;
    perceptionAnswer: string;
    newBetColor: string;
  }>({
    n: 0, colorCounts: {}, mostFreqColor: '', secondFreqColor: '',
    predictionColor: '', betColor: '', betSector: -1, countInputs: {}, probInputs: {},
    spinHistory: [], spinCount: 0, perceptionAnswer: '', newBetColor: ''
  });

  // ===== ESTADOS FASE 2 GIROS REFLEXIVOS (subSteps 6.201-6.205) =====
  const [s2SpinReflection, setS2SpinReflection] = useState<{
    spin1Color: string;        // Cor do 1o giro
    spin2Color: string;        // Cor do 2o giro
    bet1Color: string;         // Cor apostada no 1o giro
    bet2Color: string;         // Cor apostada no 2o giro
    answer1: string;         // Resposta da pergunta após 1o giro
    answer2: string;         // Resposta da pergunta após 2o giro
    selectedOption: string;    // Opção selecionada na pergunta atual
    phase: 'betting' | 'spinning' | 'question' | 'done';
    betConstraint: 'none' | 'same' | 'not_same' | 'largest'; // Restrição na aposta do 2o giro
  }>({
    spin1Color: '', spin2Color: '',
    bet1Color: '', bet2Color: '',
    answer1: '', answer2: '',
    selectedOption: '',
    phase: 'betting',
    betConstraint: 'none',
  });

  // Estado para características do experimento aleatório (múltipla seleção)
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<number[]>([]);

  // Estados para a fase de experimentação (3 tentativas antes da questão)
  const [experimentationState, setExperimentationState] = useState<{
    wageredColor: string | null;
    wagers: string[];   // cor apostada em cada tentativa (1 por rodada)
    draws: string[];
    currentAttempt: number;
    waitingForConfirmation: boolean;
    internalDrawnColor: string | null;
    colorRevealed: boolean; // True quando o usuário confirmou corretamente
  }>({
    wageredColor: null,
    wagers: [],
    draws: [],
    currentAttempt: 1,
    waitingForConfirmation: false,
    internalDrawnColor: null,
    colorRevealed: false
  });
  const [suboptimalAttempts, setSuboptimalAttempts] = useState(0);
  const [progressiveReadingStep, setProgressiveReadingStep] = useState(0);

  // Estado de instruções
  const [instructions, setInstructions] = useState<string>('');

  // Estados de controle de botões
  const [disabledSpinButton, setDisabledSpinButton] = useState(true);
  const [disabledCheckButton, setDisabledCheckButton] = useState(false);
  const [disabledNextButton, setDisabledNextButton] = useState(true);
  const [showAutoSpinButtons, setShowAutoSpinButtons] = useState(false);

  // Hooks globais
  const { alerts, createAlert: _createAlert, updateAlert, deleteAlerts } = useAlerts();
  const { modal, updateModal } = useModal();

  // Trava síncrona da aposta na fase de experimentação. Evita race condition
  // entre o clique no disco e o setGameState (assíncrono) que muda subStep/
  // isSpinning. Setada ao clicar "Sortear"; liberada ao iniciar nova tentativa.
  const experimentBetLockedRef = useRef(false);

  // Trava síncrona da confirmação do resultado. Evita que cliques rápidos
  // consecutivos no setor correto disparem múltiplas vezes a transição de
  // tentativa (que só zera waitingForConfirmation após 1.5s no setTimeout).
  const resultConfirmationLockedRef = useRef(false);

  // Melhoria 12 — Wrapper de createAlert que loga tentativas automaticamente
  const gameStateRef = useRef<{ stage: number; subStep: number }>({ stage: 1, subStep: 0 });
  const createAlert = useCallback((title: string, message: string, type: AlertType, duration?: number) => {
    _createAlert(title, message, type, duration);
    // Logar tentativas baseado no tipo de alerta
    const s = gameStateRef.current;
    if (type === 'error') {
      logAttempt(s.stage, s.subStep, false, title);
    } else if (type === 'success') {
      logAttempt(s.stage, s.subStep, true, title);
    }
  }, [_createAlert]);

  // Refs
  const restartChallenge1Ref = useRef<() => void>(() => {});
  const initCompCalcExampleRef = useRef<(guided: boolean) => void>(() => {});
  const transitionToPredictionRef = useRef<() => void>(() => {});
  const initComplementaryPhaseRef = useRef<() => void>(() => {});
  const handleStartCompExerciseRef = useRef<() => void>(() => {});

  // Inicialização do jogo
  useEffect(() => {
    startGame();
  }, []);

  // Melhoria 12 — Log de desempenho: registrar transições de subStep
  const prevSubStepRef = useRef<number>(-1);
  const prevStageRef = useRef<number>(-1);
  useEffect(() => {
    gameStateRef.current = { stage: gameState.stage, subStep: gameState.subStep };
    if (prevSubStepRef.current !== gameState.subStep || prevStageRef.current !== gameState.stage) {
      if (prevSubStepRef.current >= 0) {
        logTransition(gameState.stage, gameState.subStep, prevSubStepRef.current);
      }
      prevSubStepRef.current = gameState.subStep;
      prevStageRef.current = gameState.stage;
    }
  }, [gameState.stage, gameState.subStep]);

  // Função para iniciar o jogo
  const startGame = useCallback(() => {
    // Sortear número de setores (2 a 6)
    const targetCount = Math.floor(Math.random() * 5) + 2; // 2 a 6

    setGameState(prev => ({
      ...prev,
      stage: 1,
      subStep: 0,
      targetSectorCount: targetCount,
      sectors: [],
      showDivisions: false,
      showAngles: false,
      showNumbers: false,
      isSpinning: false,
      targetAngle: 0,
      currentRotation: 0,
      selectedColor: null,
      frequencies: {},
      totalSpins: 0,
      stage2Available: false,
      stage3Available: false,
      pendingRegistration: false,
      isAutoSpinning: false,
      currentAutoBatchIndex: 0,
      manualSpinsRequired: targetCount,
      manualSpinsDone: 0,
      predictionColor: '',
      predictionValue: '',
      ySpins: 0,
      perfectPatternDetected: false,
      perfectPatternExtraSpinsDone: 0,
      correctAnswer: '',
      studentPrediction: null,
      compositeEventE: [],
      exerciseEventE: [],
      selectedSectors: [],
      sectorNumbers: []
    }));

    setSliderValue(1);
    setSelectedOption('');
    setCurrentQuestion(null);
    setSampleSpaceInput({ value: '', disabled: false, error: false });
    setSampleSpaceCountInput({ value: '', disabled: false, error: false });
    setProbabilityInputs({});
    setRelativeFrequencyInputs({});
    setConvergenceInputs({});
    setColorCountInputs({});
    setShowInfoBox(false);
    setDisabledSpinButton(true);
    setDisabledCheckButton(false);
    setDisabledNextButton(true);
    setShowAutoSpinButtons(false);

    // Resetar contadores de exemplos vistos
    setDeterministicExamplesViewed(1);
    setRandomExamplesViewed(1);

    setInstructions(`<p class="ds-body">Use o controle deslizante para dividir o disco em <strong>${targetCount}</strong> setores iguais e clique em <strong>Confirmar</strong>.</p>`);
  }, []);

  // Função para criar setores do disco
  const createSectors = useCallback((count: number): RouletteSector[] => {
    const anglePerSector = 360 / count;
    const colors = AVAILABLE_COLORS.slice(0, count);

    return colors.map((color, index) => ({
      color: color,
      colorName: color,
      angle: anglePerSector,
      number: index + 1
    }));
  }, []);

  // Função para girar o disco
  const spinRoulette = useCallback(() => {
    if (gameState.isSpinning || gameState.sectors.length === 0) return;

    const extraRotations = 5 + Math.floor(Math.random() * 5); // 5-10 rotações completas
    const randomAngle = Math.random() * 360;
    const newTargetAngle = gameState.currentRotation + (extraRotations * 360) + randomAngle;

    // Som do giro manual (igual ao automático)
    playSound("/sounds/nextChallenge.mp3");

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      targetAngle: newTargetAngle,
      spinDuration: 3000
    }));

    setDisabledSpinButton(true);
  }, [gameState.isSpinning, gameState.sectors.length, gameState.currentRotation]);

  // Função para determinar a cor onde o ponteiro parou
  const getColorAtAngle = useCallback((angle: number): string => {
    // Normalizar o ângulo para 0-360
    const normalizedAngle = ((360 - (angle % 360)) + 360) % 360;

    let currentAngle = 0;
    for (const sector of gameState.sectors) {
      if (normalizedAngle >= currentAngle && normalizedAngle < currentAngle + sector.angle) {
        return sector.colorName;
      }
      currentAngle += sector.angle;
    }

    return gameState.sectors[0]?.colorName || '';
  }, [gameState.sectors]);

  // Função chamada quando o giro termina
  const handleSpinEnd = useCallback(() => {
    const resultColor = getColorAtAngle(gameState.targetAngle);

    // Giros reflexivos da Etapa 2 (subSteps 6.201 e 6.202)
    if (gameState.stage === 2 && gameState.subStep === 6.201 && s2SpinReflection.phase === 'spinning') {
      const betColor = s2SpinReflection.bet1Color;
      const won = resultColor === betColor;
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        currentRotation: prev.targetAngle,
        selectedColor: resultColor,
        pendingRegistration: false,
        subStep: 6.202,
      }));
      setS2SpinReflection(prev => ({ ...prev, spin1Color: resultColor, selectedOption: '', phase: 'question' }));
      playSound(won ? "/sounds/correct.mp3" : "/sounds/incorrect.mp3");
      createAlert(won ? "Acertou!" : "Errou!", `Você apostou em ${betColor}. Foi sorteada a cor ${resultColor}.`, won ? "success" : "error", 3000);
      setInstructions(`<p class="ds-body"><strong>Resultado do giro</strong></p>
        <p class="ds-body">Você apostou em <strong>${betColor}</strong>. Foi sorteada a cor <strong>${resultColor}</strong>. Agora responda à pergunta abaixo.</p>`);
      return;
    }
    if (gameState.stage === 2 && gameState.subStep === 6.202 && s2SpinReflection.phase === 'spinning') {
      // Segundo giro: registra resposta1 e transiciona para 6.204
      const betColor = s2SpinReflection.bet2Color;
      const won = resultColor === betColor;
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        currentRotation: prev.targetAngle,
        selectedColor: resultColor,
        pendingRegistration: false,
        subStep: 6.204,
      }));
      setS2SpinReflection(prev => ({ ...prev, answer1: prev.selectedOption, spin2Color: resultColor, selectedOption: '', phase: 'question', bet2Color: '', betConstraint: 'none' }));
      playSound(won ? "/sounds/correct.mp3" : "/sounds/incorrect.mp3");
      createAlert(won ? "Acertou!" : "Errou!", `Você apostou em ${betColor}. Foi sorteada a cor ${resultColor}.`, won ? "success" : "error", 3000);
      setInstructions(`<p class="ds-body"><strong>Resultado do segundo giro</strong></p>
        <p class="ds-body">Você apostou em <strong>${betColor}</strong>. Foi sorteada a cor <strong>${resultColor}</strong>. Responda novamente à pergunta.</p>`);
      return;
    }

    // Etapa 3 subStep 8.1: spin controlado por spinRouletteS3 (setTimeout próprio)
    if (gameState.stage === 3 && gameState.subStep === 8.1) {
      return;
    }

    setGameState(prev => ({
      ...prev,
      isSpinning: false,
      currentRotation: prev.targetAngle,
      selectedColor: resultColor,
      pendingRegistration: true
    }));

    playSound("/sounds/correct.mp3");
  }, [gameState.targetAngle, gameState.stage, gameState.subStep, getColorAtAngle, s2SpinReflection]);

  // Função para registrar a cor manualmente
  const registerColor = useCallback((colorName: string) => {
    const expectedColor = gameState.selectedColor;

    if (colorName !== expectedColor) {
      createAlert("Ops!", `A cor sorteada foi ${expectedColor}. Registre a cor correta.`, "error", 4000);
      playSound("/sounds/incorrect.mp3");
      return;
    }

    // Atualizar frequências
    const newFrequencies = { ...gameState.frequencies };
    newFrequencies[colorName] = (newFrequencies[colorName] || 0) + 1;

    const newTotalSpins = gameState.totalSpins + 1;
    const newManualSpinsDone = gameState.manualSpinsDone + 1;

    setGameState(prev => ({
      ...prev,
      frequencies: newFrequencies,
      totalSpins: newTotalSpins,
      manualSpinsDone: newManualSpinsDone,
      pendingRegistration: false
    }));

    playSound("/sounds/correct.mp3");
    createAlert("Correto!", `Cor ${colorName} registrada.`, "success", 2000);
    logSpinResult(gameState.stage, gameState.subStep, colorName);

    // Verificar se completou os giros manuais da primeira rodada (subStep 7)
    if (gameState.subStep === 7 && newManualSpinsDone >= gameState.manualSpinsRequired) {
      // Verificar se o padrão é "perfeito" (cada cor apareceu exatamente uma vez)
      const uniqueColors = Object.keys(newFrequencies);
      const allOnce = uniqueColors.length === gameState.targetSectorCount &&
                      Object.values(newFrequencies).every(f => f === 1);

      if (allOnce) {
        // Padrão perfeito detectado - solicitar mais giros
        setGameState(prev => ({
          ...prev,
          perfectPatternDetected: true,
          subStep: 7.6,
          perfectPatternExtraSpinsDone: 0
        }));
        setInstructions(`<p class="ds-body"><strong>Padrão Interessante!</strong></p>
          <p class="ds-body">Você obteve cada cor exatamente uma vez. Isso acontece sempre?</p>
          <p class="ds-body">Continue girando o disco para observar o que acontece.</p>`);
        setDisabledSpinButton(false);
      } else {
        // Confronto previsão vs. resultado (Melhoria 4 — Artigue/Brousseau)
        // Mostrar InfoBox comparando a previsão do aluno com o resultado observado
        const predColor = gameState.predictionColor;
        const predVal = gameState.predictionValue;
        const observedCount = newFrequencies[predColor] || 0;
        const totalSpinsLocal = gameState.manualSpinsRequired;

        const match = parseInt(predVal, 10) === observedCount;
        setGameState(prev => ({ ...prev, subStep: 7.1 }));
        setDisabledSpinButton(true);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: match ? 'success' : 'info',
          title: 'Confronto: Previsão × Resultado',
          message: `Você previu que a cor <strong>${predColor}</strong> apareceria <strong>${predVal}</strong> vez(es) em ${totalSpinsLocal} giros.<br/><br/>Resultado observado: <strong>${predColor}</strong> apareceu <strong>${observedCount}</strong> vez(es).<br/><br/>${match
            ? 'Sua previsão coincidiu com o resultado! Mas isso <strong>sempre</strong> aconteceria se repetíssemos o experimento?'
            : 'Sua previsão não coincidiu com o resultado. Isso acontece porque cada giro é um <strong>experimento aleatório</strong> — não é possível prever com certeza o resultado.'}`
        });
        setInstructions(`<p class="ds-body"><strong>Confronto: Previsão × Resultado</strong></p>
          <p class="ds-body">Compare sua previsão com o que realmente aconteceu.</p>`);
      }
    }
    // SubStep 7.6 - giros extras após padrão perfeito
    else if (gameState.subStep === 7.6) {
      const newExtraSpins = gameState.perfectPatternExtraSpinsDone + 1;

      // Verificar se o padrão continua perfeito
      const stillPerfect = Object.keys(newFrequencies).length === gameState.targetSectorCount &&
                           Object.values(newFrequencies).every(f => f === Math.floor(newTotalSpins / gameState.targetSectorCount));

      if (!stillPerfect || newExtraSpins >= gameState.manualSpinsRequired) {
        // Confronto previsão vs. resultado (Melhoria 4 — Artigue/Brousseau)
        const predColor = gameState.predictionColor;
        const predVal = gameState.predictionValue;
        const observedCount = newFrequencies[predColor] || 0;

        const match = parseInt(predVal, 10) === observedCount;
        setGameState(prev => ({ ...prev, subStep: 7.1 }));
        setDisabledSpinButton(true);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: match ? 'success' : 'info',
          title: 'Confronto: Previsão × Resultado',
          message: `Você previu que a cor <strong>${predColor}</strong> apareceria <strong>${predVal}</strong> vez(es) em ${gameState.manualSpinsRequired} giros.<br/><br/>Resultado observado: <strong>${predColor}</strong> apareceu <strong>${observedCount}</strong> vez(es).<br/><br/>${match
            ? 'Sua previsão coincidiu com o resultado! Mas isso <strong>sempre</strong> aconteceria se repetíssemos o experimento?'
            : 'Sua previsão não coincidiu com o resultado. Isso acontece porque cada giro é um <strong>experimento aleatório</strong> — não é possível prever com certeza o resultado.'}`
        });
        setInstructions(`<p class="ds-body"><strong>Confronto: Previsão × Resultado</strong></p>
          <p class="ds-body">Compare sua previsão com o que realmente aconteceu.</p>`);
      } else {
        setGameState(prev => ({
          ...prev,
          perfectPatternExtraSpinsDone: newExtraSpins
        }));
        setInstructions(`<p class="ds-body"><strong>Continue girando!</strong></p>
          <p class="ds-body">Giros extras realizados: ${newExtraSpins}/${gameState.manualSpinsRequired}</p>
          <p class="ds-body">Clique em <strong>Sortear</strong> para continuar observando.</p>`);
        setDisabledSpinButton(false);
      }
    }
    // SubStep 8 - giros y para frequência relativa
    else if (gameState.subStep === 8 && newManualSpinsDone >= gameState.ySpins) {
      // Completou os y giros - mostrar conceito de frequência absoluta
      const colors = gameState.sectors.map(s => s.colorName);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setFreqAbsQuestion({ color: randomColor });
      setFreqAbsInput({ value: '', error: false });
      setGameState(prev => ({ ...prev, subStep: 8.5 }));
      setDisabledSpinButton(true);
      setInstructions(`<p class="ds-body"><strong>Frequência Absoluta</strong></p>
        <p class="ds-body">Leia o conceito abaixo e responda a pergunta.</p>`);
    }
    // STAGE 2 - SubStep 9: Giros manuais P
    else if (gameState.stage === 2 && gameState.subStep === 9 && newManualSpinsDone >= gameState.s2ManualSpinsP) {
      setDisabledSpinButton(true);
      setGameState(prev => ({ ...prev, subStep: 9.1 }));
      setInstructions(`<p class="ds-body"><strong>Frequência Absoluta</strong></p>
        <p class="ds-body">Preencha a tabela com a frequência absoluta de cada cor e clique em <strong>Conferir</strong>.</p>`);
    }
    else {
      setDisabledSpinButton(false);
    }
  }, [gameState, createAlert]);

  // Função para mostrar a pergunta de incerteza
  const showUncertaintyQuestion = useCallback(() => {
    const randomColor = AVAILABLE_COLORS[Math.floor(Math.random() * gameState.targetSectorCount)];
    const n = gameState.targetSectorCount;

    setGameState(prev => ({
      ...prev,
      subStep: 7.5,
      predictionColor: randomColor
    }));

    const options: QuestionOption[] = [
      { value: '0', label: '0' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
      { value: 'incerteza', label: 'Não se pode ter certeza' }
    ];

    setCurrentQuestion({
      question: `Se eu girar o disco ${n} vezes, quantas vezes você acha que sairá a cor ${randomColor}?`,
      options: options,
      correctAnswer: 'incerteza'
    });

    setSelectedOption('');
    setDisabledSpinButton(true);
    setInstructions(`<p class="ds-body"><strong>Reflexão sobre Previsibilidade</strong></p>
      <p class="ds-body">Responda a pergunta abaixo.</p>`);
  }, [gameState.targetSectorCount]);

  // Função para mover para entrada de frequência relativa
  const moveToRelativeFrequencyInput = useCallback(() => {
    const colors = gameState.sectors.map(s => s.colorName);
    const inputs: { [color: string]: TextInputInterface } = {};

    colors.forEach(color => {
      inputs[color] = {
        value: '',
        disabled: false,
        error: false,
        setValue: (val: string) => {
          setRelativeFrequencyInputs(prev => ({
            ...prev,
            [color]: { ...prev[color], value: val }
          }));
        }
      };
    });

    setRelativeFrequencyInputs(inputs);
    setGameState(prev => ({ ...prev, subStep: 9 }));
    setInstructions(`<p class="ds-body"><strong>Frequências Relativas: Comparando Proporções Observadas</strong></p>
      <p class="ds-body">Calcule a frequência relativa de cada cor (frequência absoluta / total de giros).</p>
      <p class="ds-body">Digite na forma de fração (ex: 3/${gameState.ySpins}).</p>`);
  }, [gameState.sectors, gameState.ySpins]);

  // Scroll suave para o topo da seção do disco após resposta correta
  const goToTopOfChallenge = () => {
    requestAnimationFrame(() => {
      document.getElementById("disco")?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // Ref para invocar checkAnswer fora da sua própria dependência circular
  // (usado pelo devSimulateAdvance, declarado mais abaixo).
  const checkAnswerRef = useRef<(() => void) | null>(null);
  // Ref para invocar handleInterpretationContinue (declarado após devSimulateAdvance).
  const handleInterpretationContinueRef = useRef<(() => void) | null>(null);

  // Função para verificar resposta
  const checkAnswer = useCallback(() => {
    goToTopOfChallenge();
    const { stage, subStep, targetSectorCount, sectors } = gameState;

    // TREINOS: lógica de verificação inline se treino ativo
    if (stage === 2 && trainingState.active) {
      const { phase, sectors: tSectors, ki: tKi, S: tS, m: tM, angles: tAngles, tableIndex: tIdx } = trainingState;
      const tColors = tSectors.map(s => s.colorName);

      if (phase === 'fill_ratios') {
        const color = tColors[tIdx];
        const input = trainRatioInputs[color];
        const expectedKi = tKi[tIdx];
        const userVal = (input?.value || '').trim();
        if (userVal === String(expectedKi)) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", `${tAngles[tIdx]}° ÷ ${tM}° = ${expectedKi}`, "success", 2000);
          setTrainRatioInputs(prev => ({ ...prev, [color]: { ...prev[color], value: userVal, disabled: true } }));
          const nextIdx = tIdx + 1;
          if (nextIdx >= tColors.length) {
            const ixInputs: { [c: string]: TextInputInterface } = {};
            tColors.forEach((c, i) => {
              ixInputs[c] = { value: '', disabled: i !== 0, error: false, setValue: (val: string) => setTrainIxInputs(prev => ({ ...prev, [c]: { ...prev[c], value: val } })) };
            });
            setTrainIxInputs(ixInputs);
            setTrainingState(prev => ({ ...prev, phase: 'fill_ip', tableIndex: 0 }));
            setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining}</strong></p><p class="ds-body">Agora atribua probabilidades a cada setor na tabela em função de p.</p>`);
          } else {
            setTrainRatioInputs(prev => ({ ...prev, [tColors[nextIdx]]: { ...prev[tColors[nextIdx]], disabled: false } }));
            setTrainingState(prev => ({ ...prev, tableIndex: nextIdx }));
          }
        } else {
          playSound("/sounds/incorrect.mp3");
          setTrainRatioInputs(prev => ({ ...prev, [color]: { ...prev[color], error: true } }));
          createAlert("Tente novamente.", `Divida ${tAngles[tIdx]}° por ${tM}°.`, "error", 3000);
        }
        return;
      }

      if (phase === 'fill_ip') {
        const color = tColors[tIdx];
        const input = trainIxInputs[color];
        const expectedI = tKi[tIdx];
        const userVal = (input?.value || '').trim().toLowerCase();
        const expectedStr = `${expectedI}p`;
        const isCorrect = userVal === expectedStr || (expectedI === 1 && userVal === 'p');
        if (isCorrect) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", `P(${color}) = ${expectedI === 1 ? 'p' : expectedStr}`, "success", 2000);
          setTrainIxInputs(prev => ({ ...prev, [color]: { ...prev[color], value: expectedI === 1 ? 'p' : expectedStr, disabled: true } }));
          const nextIdx = tIdx + 1;
          if (nextIdx >= tColors.length) {
            setTrainSumInput({ value: '', disabled: false, error: false, setValue: (val: string) => setTrainSumInput(prev => ({ ...prev, value: val })) });
            setTrainingState(prev => ({ ...prev, phase: 'fill_sum', tableIndex: tColors.length }));
            setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining}</strong></p><p class="ds-body">Preencha a soma das probabilidades de todos os setores.</p>`);
          } else {
            setTrainIxInputs(prev => ({ ...prev, [tColors[nextIdx]]: { ...prev[tColors[nextIdx]], disabled: false } }));
            setTrainingState(prev => ({ ...prev, tableIndex: nextIdx }));
          }
        } else {
          playSound("/sounds/incorrect.mp3");
          setTrainIxInputs(prev => ({ ...prev, [color]: { ...prev[color], error: true } }));
          createAlert("Tente novamente.", `A razão de ${color} é ${expectedI}. Escreva na forma ip.`, "error", 3000);
        }
        return;
      }

      if (phase === 'fill_sum') {
        const val = (trainSumInput.value || '').trim();
        if (areFractionsEquivalent(val, '1')) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", "A soma das probabilidades é igual a 1.", "success", 2000);
          setTrainSumInput(prev => ({ ...prev, value: '1', disabled: true }));
          setTrainingState(prev => ({ ...prev, phase: 'guided_calc', calcStep: 0 }));
          setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining}</strong></p><p class="ds-body">Acompanhe o cálculo passo a passo. Clique em <strong>Próximo</strong> para ver cada etapa.</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          setTrainSumInput(prev => ({ ...prev, error: true }));
          createAlert("Tente novamente.", "Qual deve ser a soma das probabilidades de todos os setores?", "error", 3000);
        }
        return;
      }

      if (phase === 'fill_prob') {
        const color = tColors[tIdx];
        const input = trainProbInputs[color];
        const expectedKi = tKi[tIdx];
        const expectedFrac = `${expectedKi}/${tS}`;
        if (areFractionsEquivalent(input?.value || '', expectedFrac)) {
          playSound("/sounds/correct.mp3");
          createAlert("Parabéns!", `P(${color}) = ${expectedKi}/${tS}`, "success", 2000);
          setTrainProbInputs(prev => ({ ...prev, [color]: { ...prev[color], value: input?.value || '', disabled: true } }));
          const nextIdx = tIdx + 1;
          if (nextIdx >= tColors.length) {
            playSound("/sounds/challengeFinished.mp3");
            createAlert("Treino concluído!", `Você completou o Treino ${trainingState.currentTraining}.`, "success", 3000);
            setTrainingState(prev => ({ ...prev, phase: 'completed' }));
            setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining} concluído!</strong></p><p class="ds-body">Você pode continuar para a próxima fase ou praticar mais.</p>`);
          } else {
            setTrainProbInputs(prev => ({ ...prev, [tColors[nextIdx]]: { ...prev[tColors[nextIdx]], disabled: false } }));
            setTrainingState(prev => ({ ...prev, tableIndex: nextIdx }));
          }
        } else {
          playSound("/sounds/incorrect.mp3");
          setTrainProbInputs(prev => ({ ...prev, [color]: { ...prev[color], error: true } }));
          createAlert("Tente novamente.", `Substitua p = 1/${tS} em ${expectedKi}·p.`, "error", 4000);
        }
        return;
      }

      return;
    }

    // STAGE 1 - SubStep 0: Verificar configuração do slider
    if (stage === 1 && subStep === 0) {
      if (sliderValue === targetSectorCount) {
        // Criar setores
        const newSectors = createSectors(targetSectorCount);
        const newFrequencies: { [color: string]: number } = {};
        newSectors.forEach(s => newFrequencies[s.colorName] = 0);

        // Gerar resposta correta para a próxima pergunta
        const correctAnswer = generateCorrectAnswer();

        setGameState(prev => ({
          ...prev,
          sectors: newSectors,
          showDivisions: true,
          frequencies: newFrequencies,
          subStep: 0.1, // Iniciar sequência de balões conceituais
          correctAnswer: correctAnswer
        }));

        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "O disco foi dividido corretamente!", "success", 3000);

        // Mostrar primeiro balão conceitual
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Experimento determinístico',
          message: `Procedimento que, ao ser repetido nas mesmas condições, produz sempre o mesmo resultado, podendo ser previsto com certeza.<br/><br/><strong>Exemplo:</strong> ${DETERMINISTIC_EXAMPLES[Math.floor(Math.random() * DETERMINISTIC_EXAMPLES.length)]}`
        });

        setInstructions(`<p class="ds-body"><strong>Conceitos Fundamentais</strong></p>
          <p class="ds-body">Leia o conteúdo do balão ao lado e clique no <strong>Botão</strong> para continuar.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", `O número correto é ${targetSectorCount}. Tente novamente.`, "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 1: Verificar identificação do experimento aleatório
    if (stage === 1 && subStep === 1) {
      if (selectedOption === 'correct') {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Você identificou corretamente o experimento aleatório!", "success", 3000);

        // Ir para a fase de experimentação (3 tentativas antes da questão)
        experimentBetLockedRef.current = false;
        setExperimentationState({
          wageredColor: null,
          wagers: [],
          draws: [],
          currentAttempt: 1,
          waitingForConfirmation: false,
          internalDrawnColor: null,
          colorRevealed: false
        });
        setGameState(prev => ({ ...prev, subStep: 1.1 }));
        setShowInfoBox(false);
        setDisabledSpinButton(true); // Botão Sortear desabilitado até apostar
        setInstructions(`<p class="ds-body"><strong>Experimentação — Tentativa 1 de 3</strong></p>
          <p class="ds-body">Antes de girar o disco, clique diretamente em uma cor do disco e aposte em qual resultado você acredita que irá ocorrer.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "⚠️ Atenção! Um experimento aleatório é o procedimento que pode ser repetido nas mesmas condições, mas cujo resultado não pode ser previsto antes de acontecer. Ele descreve o que é feito e o que será observado, e não cálculos, escolhas antecipadas ou análises dos resultados.", "error", 8000);
      }
      return;
    }

    // STAGE 1 - SubStep 1.17: Verificar confirmação do resultado (clique na cor correta)
    if (stage === 1 && subStep === 1.17) {
      // Esta verificação é feita pela função handleConfirmacaoResultado
      return;
    }

    // STAGE 1 - SubStep 1.25: Verificar características do experimento aleatório (todas devem estar marcadas)
    if (stage === 1 && subStep === 1.25) {
      const allChecked = selectedCharacteristics.length === RANDOM_EXPERIMENT_CHARACTERISTICS.length;

      if (allChecked) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Você identificou corretamente todas as características do experimento aleatório!", "success", 3000);

        // Limpa o resumo da experimentação (tabela das 3 tentativas) — agora
        // o foco passa a ser o balão conceitual de Espaço Amostral.
        setInstructions('');

        // Mostrar balão conceitual do espaço amostral
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Espaço Amostral',
          message: 'O espaço amostral é o conjunto de todos os resultados possíveis de um experimento aleatório. Cada elemento desse conjunto representa um resultado que pode ocorrer quando o experimento é realizado uma única vez.'
        });

        setGameState(prev => ({ ...prev, subStep: 1.5 })); // Estado intermediário para o balão
      } else if (selectedCharacteristics.length > 0) {
        // Algumas marcadas, mas não todas
        playSound("/sounds/incorrect.mp3");
        createAlert("Correto! Mas está incompleto.", "", "warning", 4000);
      } else {
        // Nenhuma marcada
        playSound("/sounds/incorrect.mp3");
        createAlert("Atenção!", "Marque as características que você considera verdadeiras.", "error", 3000);
      }
      return;
    }

    // STAGE 1 - SubStep 2: Verificar espaço amostral
    if (stage === 1 && subStep === 2) {
      const colors = sectors.map(s => s.colorName);
      if (validateSampleSpace(sampleSpaceInput.value || '', colors)) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Você identificou corretamente o espaço amostral!", "success", 3000);

        setGameState(prev => ({ ...prev, subStep: 3 }));
        setInstructions(`<p class="ds-body"><strong>Quantidade de Elementos</strong></p>
          <p class="ds-body">Quantos elementos possui o espaço amostral desse experimento aleatório?</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setSampleSpaceInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Quando gira o disco quais as possibilidades para o ponteiro indicar?", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 3: Verificar quantidade de elementos
    if (stage === 1 && subStep === 3) {
      const inputCount = parseInt(sampleSpaceCountInput.value || '');
      if (inputCount === targetSectorCount) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto!", "success", 3000);

        // Gerar eventos A e B dinamicamente (CONTRATO FORMAL)
        // Seja S o espaço amostral do disco atual (conjunto das cores)
        const availableColors = [...sectors.map(s => s.colorName)];

        // Sortear X: uma cor aleatória de S para o Exemplo 1 (A = {X})
        const idxX = Math.floor(Math.random() * availableColors.length);
        const X = availableColors[idxX];

        // Gerar B: subconjunto aleatório de S com |B| >= 2
        // Passo 1: Sortear k ∈ {2,...,n} para cardinalidade de B
        const n = sectors.length;
        const kOptions = [];
        for (let i = 2; i <= n; i++) kOptions.push(i);
        const k = kOptions[Math.floor(Math.random() * kOptions.length)];

        // Passo 2: Escolher k cores aleatórias distintas de S para formar B
        const colorsForB: string[] = [];
        const remainingColors = [...availableColors];
        for (let i = 0; i < k; i++) {
          const idx = Math.floor(Math.random() * remainingColors.length);
          colorsForB.push(remainingColors.splice(idx, 1)[0]);
        }
        const setB = colorsForB.join(', ');

        // Mostrar balão de definição de Evento (REGRA DE EXIBIÇÃO DIDÁTICA)
        // O texto apresenta a definição geral, não substitui pelo exemplo
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Evento',
          message: `Evento é qualquer subconjunto do espaço amostral.<br/><br/><strong>Exemplo 1:</strong><br/>A = {${X}}.<br/><br/><strong>Exemplo 2:</strong><br/>B = {${setB}}.`
        });

        setGameState(prev => ({ ...prev, subStep: 3.4 })); // Estado intermediário para o balão de Evento
      } else {
        playSound("/sounds/incorrect.mp3");
        setSampleSpaceCountInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Conte novamente quantas cores diferentes há no disco.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 4: Verificar reflexão sim/não sobre equiprobabilidade
    if (stage === 1 && subStep === 4) {
      if (selectedOption === 'nao') {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto! Os setores são iguais, então todas as cores têm a mesma chance.", "success", 3000);

        // Mostrar informação com n dinâmico
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'info',
          title: 'Informação',
          message: `Existem ${targetSectorCount} possibilidades para os resultados de um giro do disco. Como os setores são iguais e o giro é aleatório, cada resultado tem a mesma chance de ocorrer.`
        });

        setGameState(prev => ({ ...prev, subStep: 4.5 }));
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "Observe que todos os setores têm o mesmo tamanho (mesmo ângulo central). Não há razão para uma cor ter mais chance que outra.", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 5: Verificar classificação equiprovável/não equiprovável
    if (stage === 1 && subStep === 5) {
      if (selectedOption === 'equiprovavel') {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto! O espaço amostral é equiprovável.", "success", 3000);

        // Mostrar balão sobre evento certo
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Evento Certo',
          message: 'Em um experimento aleatório, chama-se <strong>evento certo</strong> o evento que sempre ocorre, independentemente do resultado observado. Ele corresponde ao conjunto de todos os resultados possíveis do experimento.<br/><br/>O evento certo corresponde exatamente ao espaço amostral do experimento aleatório.<br/><br/>Por exemplo, ao girar um disco, o evento "o ponteiro indicar alguma das cores presentes no disco" é um evento certo, pois qualquer giro resulta necessariamente em uma dessas cores.'
        });

        setGameState(prev => ({ ...prev, subStep: 5.5 }));
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "Como os setores são iguais, o espaço amostral é equiprovável.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 5.7: Verificar probabilidade do evento certo
    if (stage === 1 && subStep === 5.7) {
      const value = (theoreticalQuestion1Input.value || '').trim();
      if (areFractionsEquivalent(value, '1')) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto! A probabilidade do evento certo é 1 (ou 100%).", "success", 3000);

        // Mostrar balão de Definição de Probabilidade (subStep 5.75)
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Definição de Probabilidade',
          message: 'A <u>probabilidade de um evento</u> é um número real que mede a chance de esse evento ocorrer em um experimento aleatório.<br/><br/>Esse número assume valores entre 0 e 1, inclusive:<br/><br/>• Probabilidade 0 indica um evento impossível;<br/>• Probabilidade 1 indica um evento certo;<br/>• Valores entre 0 e 1 indicam diferentes graus de chance de ocorrência.<br/><br/>Considerando um evento A, sua probabilidade é indicada por P(A) e satisfaz a relação:<br/><br/><strong>0 ≤ P(A) ≤ 1</strong><br/><br/>Aqui, P(A) representa a probabilidade de o evento A ocorrer como resultado do experimento aleatório.'
        });

        setGameState(prev => ({ ...prev, subStep: 5.75 }));
      } else {
        playSound("/sounds/incorrect.mp3");
        setTheoreticalQuestion1Input(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "O evento certo sempre ocorre. Qual é a probabilidade de algo que sempre acontece?", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 6: Verificar probabilidades teóricas
    if (stage === 1 && subStep === 6) {
      const expectedProb = `1/${targetSectorCount}`;
      let allCorrect = true;

      const updatedInputs = { ...probabilityInputs };
      Object.keys(probabilityInputs).forEach(color => {
        const input = probabilityInputs[color];
        if (!areFractionsEquivalent(input.value || '', expectedProb)) {
          updatedInputs[color] = { ...input, error: true };
          allCorrect = false;
        }
      });

      if (allCorrect) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Todas as probabilidades estão corretas!", "success", 3000);

        // Gerar evento composto E dinamicamente (subconjunto com 2+ elementos)
        const availableColors = [...sectors.map(s => s.colorName)];
        const n = availableColors.length;

        // Sortear k entre 2 e n para cardinalidade de E
        const kOptions = [];
        for (let i = 2; i <= n; i++) kOptions.push(i);
        const k = kOptions[Math.floor(Math.random() * kOptions.length)];

        // Escolher k cores aleatórias distintas
        const eventE: string[] = [];
        const remainingColors = [...availableColors];
        for (let i = 0; i < k; i++) {
          const idx = Math.floor(Math.random() * remainingColors.length);
          eventE.push(remainingColors.splice(idx, 1)[0]);
        }

        setGameState(prev => ({
          ...prev,
          subStep: 6.1,
          compositeEventE: eventE
        }));

        // Limpar input de casos favoráveis
        setFavorableCasesInput({ value: '', disabled: false, error: false, setValue: (val: string) => setFavorableCasesInput(prev => ({ ...prev, value: val })) });

        setInstructions(`<p class="ds-body"><strong>Probabilidade do Evento Composto</strong></p>
          <p class="ds-body">Responda a pergunta abaixo.</p>`);
      } else {
        setProbabilityInputs(updatedInputs);
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "Verifique as probabilidades. Lembre-se: em um espaço equiprovável, cada resultado tem a mesma chance.", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.1: Verificar casos favoráveis do evento composto
    if (stage === 1 && subStep === 6.1) {
      const inputValue = parseInt(favorableCasesInput.value || '');
      const expectedValue = gameState.compositeEventE.length;

      if (inputValue === expectedValue) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", `Correto! O número de elementos do evento é dado por n(E) = ${expectedValue}.`, "success", 3000);

        // Mostrar texto explicativo com a fórmula
        const k = expectedValue;
        const n = targetSectorCount;

        // Função helper para criar fração HTML vertical
        const fractionHTML = (num: string | number, den: string | number) =>
          `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 2px;"><span style="padding: 0 4px;">${num}</span><span style="width: 100%; height: 1px; background: currentColor;"></span><span style="padding: 0 4px;">${den}</span></span>`;

        // Construir a expressão P(E) = P{cor1} + P{cor2} + ... = 1/n + 1/n + ... = k/n = decimal = porcentagem
        const eventColors = gameState.compositeEventE;
        const colorProbabilities = eventColors.map(color => `P{${color}}`).join(' + ');
        const addendsHTML = Array(k).fill(fractionHTML(1, n)).join(' + ');
        const resultDecimal = k / n;
        const resultPercentage = (resultDecimal * 100);
        // Formatar o decimal (remover zeros desnecessários)
        const formattedDecimal = Number.isInteger(resultDecimal)
          ? resultDecimal.toString()
          : resultDecimal.toFixed(4).replace(/\.?0+$/, '');
        // Formatar a porcentagem (remover zeros desnecessários)
        const formattedPercentage = Number.isInteger(resultPercentage)
          ? resultPercentage.toString()
          : resultPercentage.toFixed(2).replace(/\.?0+$/, '');

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Probabilidade do Evento Composto',
          message: `<strong>E = {${gameState.compositeEventE.join(', ')}}</strong><br/><br/>Como o espaço amostral do disco é equiprovável, cada setor possui a mesma chance de ocorrer.<br/><br/>Se o disco está dividido em <strong>${n}</strong> setores e o evento E é formado por <strong>${k}</strong> resultados simples distintos (ou seja, ${k} cores do disco), então a probabilidade de ocorrência do evento E é obtida somando as probabilidades dos eventos simples que o compõem.<br/><br/><strong style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">P(E) = ${colorProbabilities} = ${addendsHTML} = ${fractionHTML(k, n)} = ${formattedDecimal} = ${formattedPercentage}%</strong><br/><br/>Nessa expressão:<br/>• <strong>n = ${n}</strong> representa o número total de setores do disco (número de elementos do espaço amostral);<br/>• <strong>n(E) = ${k}</strong> representa o número de resultados simples favoráveis ao evento E;<br/>• <strong>P(E)</strong> = Probabilidade de ocorrência do evento E, ou seja, número que expressa a "chance" do Evento E ocorrer.<br/><br/>Assim, a probabilidade de um evento composto em um espaço amostral equiprovável é dada pela razão entre o número de casos favoráveis e o número total de resultados possíveis.`
        });

        setGameState(prev => ({ ...prev, subStep: 6.2 }));
      } else {
        playSound("/sounds/incorrect.mp3");
        setFavorableCasesInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Conte a quantidade de elementos que pertencem ao conjunto E.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.5: Registrar previsão do aluno
    if (stage === 1 && subStep === 6.5) {
      const predictionText = (predictionInput.value || '').trim();
      if (!predictionText) {
        playSound("/sounds/incorrect.mp3");
        setPredictionInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Digite sua previsão antes de verificar.", "error", 3000);
        return;
      }

      // Guardar a previsão e iniciar giros manuais
      setGameState(prev => ({
        ...prev,
        studentPrediction: predictionText,
        predictionValue: predictionText,
        subStep: 7,
        manualSpinsDone: 0,
        frequencies: Object.fromEntries(sectors.map(s => [s.colorName, 0])),
        pendingRegistration: false // Garantir que não mostra botões de registro antes do giro
      }));

      playSound("/sounds/correct.mp3");
      createAlert("Previsão registrada!", `Sua previsão: "${predictionText}". Vamos verificar!`, "info", 3000);
      logText(1, 6.5, 'prediction', `${gameState.predictionColor}: ${predictionText}`);

      setInstructions(`<p class="ds-body"><strong>Giros Manuais</strong></p>
        <p class="ds-body">Gire o disco ${targetSectorCount} vezes clicando em <strong>Sortear</strong>.</p>
        <p class="ds-body">Após cada giro, registre a cor que saiu clicando no botão correspondente.</p>
        <p class="ds-body">Giros realizados: 0/${targetSectorCount}</p>`);

      setDisabledSpinButton(false);
      return;
    }

    // STAGE 1 - SubStep 7.5: Verificar resposta de incerteza
    if (stage === 1 && subStep === 7.5) {
      if (selectedOption === 'incerteza') {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto! Não é possível prever com certeza quantas vezes cada cor aparecerá.", "success", 3000);

        // Sortear y entre 8 e 15 para a próxima rodada
        const ySpins = Math.floor(Math.random() * 8) + 8; // 8 a 15

        setGameState(prev => ({
          ...prev,
          subStep: 8,
          ySpins: ySpins,
          manualSpinsDone: 0,
          frequencies: Object.fromEntries(sectors.map(s => [s.colorName, 0])),
          totalSpins: 0,
          pendingRegistration: false // Garantir que não mostra botões de registro antes do giro
        }));

        setInstructions(`<p class="ds-body"><strong>Nova Rodada de Giros</strong></p>
          <p class="ds-body">Agora você fará <strong>${ySpins}</strong> giros e registrará as frequências.</p>
          <p class="ds-body">Clique em <strong>Sortear</strong> para começar.</p>
          <p class="ds-body">Giros realizados: 0/${ySpins}</p>`);

        setDisabledSpinButton(false);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "⚠️ Cuidado! Ter n resultados possíveis não garante que todos ocorram em n repetições, pois cada repetição é independente. Um mesmo resultado pode se repetir, enquanto outros podem não aparecer.", "error", 8000);
      }
      return;
    }

    // STAGE 1 - SubStep 8.5: Verificar pergunta de frequência absoluta
    if (stage === 1 && subStep === 8.5) {
      if (!freqAbsQuestion) return;
      const expected = gameState.frequencies[freqAbsQuestion.color];
      const userVal = parseInt(freqAbsInput.value, 10);

      if (!isNaN(userVal) && userVal === expected) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A frequência absoluta corresponde ao número de ocorrências observadas.", "success", 3000);
        // Ir para tela conceitual de frequência relativa
        setFreqRelConceptPhase('definition');
        setGameState(prev => ({ ...prev, subStep: 8.6 }));
        setInstructions(`<p class="ds-body"><strong>Frequência Relativa: Conceito e Exemplo</strong></p>
          <p class="ds-body">Leia o conceito abaixo.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setFreqAbsInput(prev => ({ ...prev, error: true }));
        createAlert("Incorreto", "Observe novamente a tabela: frequência absoluta é a quantidade de vezes que a cor apareceu.", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 9: Verificar frequências relativas
    if (stage === 1 && subStep === 9) {
      let allCorrect = true;
      const updatedInputs = { ...relativeFrequencyInputs };

      Object.keys(relativeFrequencyInputs).forEach(color => {
        const input = relativeFrequencyInputs[color];
        const expected = `${gameState.frequencies[color]}/${gameState.ySpins}`;

        if (!areFractionsEquivalent(input.value || '', expected)) {
          updatedInputs[color] = { ...input, error: true };
          allCorrect = false;
        }
      });

      if (allCorrect) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Frequências relativas corretas!", "success", 3000);

        // Ir para verificação conceitual de frequência relativa (subStep 9.5)
        const colors = sectors.map(s => s.colorName);
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setFreqRelQuestion({ color: randomColor });
        setFreqRelInput({ value: '', error: false });
        setGameState(prev => ({ ...prev, subStep: 9.5 }));
        setInstructions(`<p class="ds-body"><strong>Frequência Relativa</strong></p>
          <p class="ds-body">Leia o conceito abaixo e responda a pergunta.</p>`);
      } else {
        setRelativeFrequencyInputs(updatedInputs);
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", `Lembre-se: frequência relativa = frequência absoluta / total de giros (${gameState.ySpins}).`, "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 9.5: Verificar pergunta de frequência relativa (porcentagem)
    if (stage === 1 && subStep === 9.5) {
      if (!freqRelQuestion) return;
      const absFreq = gameState.frequencies[freqRelQuestion.color] || 0;
      const expectedPercent = (absFreq / gameState.ySpins) * 100;
      // Aceitar valor com vírgula ou ponto, com ou sem "%"
      const userStr = freqRelInput.value.trim().replace('%', '').replace(',', '.');
      const userVal = parseFloat(userStr);

      if (!isNaN(userVal) && Math.abs(userVal - expectedPercent) < 0.15) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A frequência relativa representa a porcentagem de ocorrências observadas.", "success", 3000);
        // Transição para Giros Automáticos (subStep 10)
        setGameState(prev => ({ ...prev, subStep: 10, currentAutoBatchIndex: 0 }));
        setShowAutoSpinButtons(true);
        setInstructions(`<p class="ds-body"><strong>Giros Automáticos</strong></p>
          <p class="ds-body">Agora você realizará giros automáticos para observar a <strong>Lei dos Grandes Números</strong>.</p>
          <p class="ds-body">Clique nos botões para executar os blocos de giros.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setFreqRelInput(prev => ({ ...prev, error: true }));
        createAlert("Incorreto", "Observe novamente a tabela: frequência relativa é a porcentagem de vezes que a cor apareceu.", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 15: Problemas de consolidação LGN
    if (stage === 1 && subStep === 15 && lgnParams) {
      if (lgnPhase === 'problem1') {
        const userVal = parseInt(lgnInput.value, 10);
        if (!isNaN(userVal) && userVal === lgnParams.answer1) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", `Como P(${lgnParams.color})=1/${lgnN}, a quantidade esperada é ${lgnParams.m}×(1/${lgnN}) = ${lgnParams.answer1}.`, "success", 5000);
          setLgnPhase('problem2');
          setLgnInput({ value: '', error: false });
          setInstructions(`<p class="ds-body"><strong>Problema 2: Medicamento</strong></p>
            <p class="ds-body">Leia o enunciado e responda.</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          setLgnInput(prev => ({ ...prev, error: true }));
          createAlert("Incorreto", `Use P(${lgnParams.color})=1/${lgnN} e calcule ${lgnParams.m}×(1/${lgnN}) = ${lgnParams.m}/${lgnN}.`, "error", 5000);
        }
        return;
      }
      if (lgnPhase === 'problem2') {
        const userVal = parseInt(lgnInput.value, 10);
        if (!isNaN(userVal) && userVal === lgnParams.answer2) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", `A chance ${lgnParams.p}% corresponde a ${lgnParams.p}/100. Logo, o esperado é ${lgnParams.m}×(${lgnParams.p}/100) = ${lgnParams.answer2}.`, "success", 5000);
          setLgnPhase('note');
          setInstructions(`<p class="ds-body"><strong>Reflexão</strong></p>
            <p class="ds-body">Leia a nota abaixo.</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          setLgnInput(prev => ({ ...prev, error: true }));
          createAlert("Incorreto", `Converta ${lgnParams.p}% em ${lgnParams.p}/100 e calcule ${lgnParams.m}×(${lgnParams.p}/100).`, "error", 5000);
        }
        return;
      }
    }

    // STAGE 1 - SubStep 11: Verificar pergunta de convergência
    if (stage === 1 && subStep === 11) {
      const expected = `1/${targetSectorCount}`;
      const input = convergenceInputs.convergence;

      if (input && areFractionsEquivalent(input.value || '', expected)) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto! As frequências relativas convergem para a probabilidade teórica!", "success", 3000);

        // Transição para InfoBox "Lei dos Grandes Números" (subStep 11.5)
        const n = targetSectorCount;
        const probPercent = ((1 / n) * 100).toFixed(1).replace('.', ',');
        setGameState(prev => ({ ...prev, subStep: 11.5 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Lei dos Grandes Números',
          message: `À medida que o número de giros aumenta, a frequência relativa de cada cor se estabiliza perto de <strong>1/${n}</strong> (≈${probPercent}%).<br/><br/>Esse fenômeno é descrito pela <strong>Lei dos Grandes Números</strong>: quanto mais vezes repetimos um experimento aleatório, mais a frequência relativa se aproxima da probabilidade teórica.`
        });
        setInstructions(`<p class="ds-body"><strong>Lei dos Grandes Números</strong></p>
          <p class="ds-body">Leia o conceito abaixo.</p>`);
      } else {
        if (input) {
          setConvergenceInputs(prev => ({ ...prev, convergence: { ...prev.convergence, error: true } }));
        }
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "Observe o histograma. Para qual valor as frequências relativas estão convergindo?", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 12: Verificar pergunta teórica 1
    if (stage === 1 && subStep === 12) {
      const expected = `1/${gameState.theoreticalK}`;

      if (areFractionsEquivalent(theoreticalQuestion1Input.value || '', expected)) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Correto!", "success", 3000);

        setGameState(prev => ({ ...prev, subStep: 13 }));
        setTheoreticalQuestion2Input({ value: '', disabled: false, error: false, setValue: (val: string) => setTheoreticalQuestion2Input(prev => ({ ...prev, value: val })) });

        setInstructions(`<p class="ds-body"><strong>Probabilidade Teórica</strong></p>
          <p class="ds-body">Responda a última pergunta.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setTheoreticalQuestion1Input(prev => ({ ...prev, error: true }));
        createAlert("Erro!", `Se o disco tem ${gameState.theoreticalK} setores iguais, qual é a probabilidade de cada um?`, "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 13: Verificar pergunta teórica 2
    if (stage === 1 && subStep === 13) {
      const expected = `1/${gameState.theoreticalK}`;

      if (areFractionsEquivalent(theoreticalQuestion2Input.value || '', expected)) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Agora vamos interpretar os resultados.", "success", 3000);

        setGameState(prev => ({ ...prev, subStep: 14 }));
        setInterpretationPhase('q1');
        setInterpretationSelected('');

        setInstructions(`<p class="ds-body"><strong>Interpretação dos Resultados</strong></p>
          <p class="ds-body">Responda as perguntas sobre os resultados observados.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setTheoreticalQuestion2Input(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "A probabilidade de cada setor é a mesma que a frequência relativa quando o número de giros é muito grande.", "error", 5000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.41: Verificar seleção dos setores (Interação 1 do Exercício)
    if (stage === 1 && subStep === 6.41) {
      const correctColors = gameState.exerciseEventE;
      const correctIndices = sectors
        .map((s, i) => correctColors.includes(s.colorName) ? i : -1)
        .filter(i => i !== -1);

      const selectedSorted = [...gameState.selectedSectors].sort((a, b) => a - b);
      const correctOnes = [...correctIndices].sort((a, b) => a - b);

      const allRight = selectedSorted.length === correctOnes.length &&
        selectedSorted.every((val, idx) => val === correctOnes[idx]);

      if (allRight) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Você identificou corretamente os casos favoráveis ao evento E.", "success", 3000);

        setGameState(prev => ({ ...prev, subStep: 6.42 }));

        setInstructions(`<p class="ds-body"><strong>Exercício — Aplicação do Modelo Probabilístico</strong></p>
          <p class="ds-body">Digite o número de casos favoráveis ao evento E.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Erro!", "Observe as cores que compõem o evento e clique nos setores correspondentes no disco.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.42: Verificar n(E) (Interação 2 do Exercício)
    if (stage === 1 && subStep === 6.42) {
      const inputValue = parseInt(exerciseNEInput.value || '');
      const expectedValue = gameState.exerciseEventE.length;

      if (inputValue === expectedValue) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `n(E) = ${expectedValue}`, "success", 2000);

        setGameState(prev => ({ ...prev, subStep: 6.43 }));

        setInstructions(`<p class="ds-body"><strong>Exercício — Aplicação do Modelo Probabilístico</strong></p>
          <p class="ds-body">Digite o número de resultados possíveis do experimento aleatório (número de elementos do espaço amostral).</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExerciseNEInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Conte a quantidade de elementos do evento E.", "error", 3000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.43: Verificar n(S) (Interação 3 do Exercício)
    if (stage === 1 && subStep === 6.43) {
      const inputValue = parseInt(exerciseNSInput.value || '');
      const expectedValue = sectors.length;

      if (inputValue === expectedValue) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `n(S) = ${expectedValue}`, "success", 2000);

        setGameState(prev => ({ ...prev, subStep: 6.44 }));

        setInstructions(`<p class="ds-body"><strong>Exercício — Aplicação do Modelo Probabilístico</strong></p>
          <p class="ds-body">Ao girar o disco uma única vez, qual a probabilidade de ocorrer o evento E?</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExerciseNSInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Observe quantos setores compõem o disco.", "error", 3000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.44: Verificar P(E) = n(E)/n(S) (Interação 4 do Exercício)
    if (stage === 1 && subStep === 6.44) {
      const numerator = parseInt(exercisePENumeratorInput.value || '');
      const denominator = parseInt(exercisePEDenominatorInput.value || '');
      const expectedNumerator = gameState.exerciseEventE.length;
      const expectedDenominator = sectors.length;

      if (areSplitFractionsEquivalent(numerator, denominator, expectedNumerator, expectedDenominator)) {
        playSound("/sounds/correct.mp3");

        // Calcular decimal e porcentagem
        const resultDecimal = expectedNumerator / expectedDenominator;
        const resultPercentage = resultDecimal * 100;
        const formattedDecimal = Number.isInteger(resultDecimal)
          ? resultDecimal.toString()
          : resultDecimal.toFixed(4).replace(/\.?0+$/, '');
        const formattedPercentage = Number.isInteger(resultPercentage)
          ? resultPercentage.toString()
          : resultPercentage.toFixed(2).replace(/\.?0+$/, '');

        setGameState(prev => ({ ...prev, subStep: 6.45 }));

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Parabéns!',
          message: `Você aplicou corretamente o modelo probabilístico de um espaço amostral equiprovável.<br/><br/><div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; flex-wrap: wrap;"><span>P(E) =</span><span style="display: inline-flex; flex-direction: column; align-items: center;"><span>n(E)</span><span style="width: 100%; height: 2px; background: currentColor;"></span><span>n(S)</span></span><span>=</span><span style="display: inline-flex; flex-direction: column; align-items: center;"><span>${expectedNumerator}</span><span style="width: 100%; height: 2px; background: currentColor;"></span><span>${expectedDenominator}</span></span><span>= ${formattedDecimal} = ${formattedPercentage}%</span></div>`
        });

        setInstructions(`<p class="ds-body"><strong>Exercício Concluído</strong></p>
          <p class="ds-body">Você aplicou corretamente o modelo probabilístico!</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExercisePENumeratorInput(prev => ({ ...prev, error: true }));
        setExercisePEDenominatorInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Revise os valores de n(E) e n(S) antes de calcular a probabilidade.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.6: Verificar seleção de setores no Desafio Dinâmico 1 (Conectivo Variável)
    if (stage === 1 && subStep === 6.6) {
      const { challenge1SectorNumbers, challenge1PropertyY, challenge1EventXColors, challenge1Connective, challenge1EventXType, challenge1ValueP, challenge1InterProblemType, challenge1InterM, challenge1InterP, challenge1InterK, selectedSectors } = gameState;

      // Calcular setores corretos baseado no conectivo
      let correctSectors: number[];

      if (challenge1InterProblemType !== null) {
        // Gerador de interseção controlado: usar solveIntersectionSet
        const solveSet = solveIntersectionSet(challenge1InterProblemType, challenge1SectorNumbers, challenge1InterM, challenge1InterP, challenge1InterK);
        correctSectors = Array.from(solveSet);
      } else {
        // Fluxo original (cor + propriedade numérica)
        correctSectors = [];
        sectors.forEach((sector, index) => {
          const colorSatisfies = challenge1EventXType === 'exclusao'
            ? !challenge1EventXColors.includes(sector.colorName)
            : challenge1EventXColors.includes(sector.colorName);
          const numberSatisfies = checkProperty(challenge1SectorNumbers[index], challenge1PropertyY, challenge1ValueP);

          if (challenge1Connective === 'ou') {
            if (colorSatisfies || numberSatisfies) {
              correctSectors.push(index);
            }
          } else {
            if (colorSatisfies && numberSatisfies) {
              correctSectors.push(index);
            }
          }
        });
      }

      // Verificar se a seleção do aluno está correta
      const sortedSelected = [...selectedSectors].sort((a, b) => a - b);
      const sortedCorrect = [...correctSectors].sort((a, b) => a - b);
      const won = sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((val, idx) => val === sortedCorrect[idx]);

      if (won) {
        playSound("/sounds/correct.mp3");

        setGameState(prev => ({ ...prev, subStep: 6.65 }));

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Correto!',
          message: `Você identificou corretamente os casos favoráveis ao evento.`
        });
      } else {
        playSound("/sounds/incorrect.mp3");
        if (challenge1InterProblemType !== null) {
          createAlert("Erro!", `Observe atentamente: o evento é definido por números que são ${challenge1PropertyY}. Verifique quais setores satisfazem ambas as condições simultaneamente.`, "error", 6000);
        } else {
          const connectiveText = challenge1Connective === 'ou' ? 'pelo menos uma das condições' : 'ambas as condições simultaneamente';
          createAlert("Erro!", `Observe atentamente: o evento é definido por ${gameState.challenge1EventXText} ${challenge1Connective.toUpperCase()} número ${challenge1PropertyY}. Verifique quais setores satisfazem ${connectiveText}.`, "error", 6000);
        }
      }
      return;
    }

    // STAGE 1 - SubStep 6.66: Verificar n(E) no Desafio Dinâmico 1
    if (stage === 1 && subStep === 6.66) {
      const inputValue = parseInt(exerciseNEInput.value || '');
      const { challenge1SectorNumbers, challenge1PropertyY, challenge1EventXColors, challenge1Connective, challenge1EventXType, challenge1ValueP, challenge1InterProblemType, challenge1InterM, challenge1InterP, challenge1InterK } = gameState;

      // Calcular n(E): quantidade de setores favoráveis
      let nE: number;

      if (challenge1InterProblemType !== null) {
        // Gerador de interseção controlado
        nE = solveIntersectionSet(challenge1InterProblemType, challenge1SectorNumbers, challenge1InterM, challenge1InterP, challenge1InterK).size;
      } else {
        // Fluxo original (cor + propriedade numérica)
        nE = 0;
        sectors.forEach((sector, index) => {
          const colorSatisfies = challenge1EventXType === 'exclusao'
            ? !challenge1EventXColors.includes(sector.colorName)
            : challenge1EventXColors.includes(sector.colorName);
          const numberSatisfies = checkProperty(challenge1SectorNumbers[index], challenge1PropertyY, challenge1ValueP);

          if (challenge1Connective === 'ou') {
            if (colorSatisfies || numberSatisfies) {
              nE++;
            }
          } else {
            if (colorSatisfies && numberSatisfies) {
              nE++;
            }
          }
        });
      }

      if (inputValue === nE) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `n(E) = ${nE}`, "success", 2000);

        setGameState(prev => ({ ...prev, subStep: 6.67 }));

        setInstructions(`<p class="ds-body"><strong>Desafio — Casos Possíveis</strong></p>
          <p class="ds-body">Digite o número de resultados possíveis do experimento.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExerciseNEInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Conte novamente os setores favoráveis ao evento. Cada setor favorável conta como 1.", "error", 4000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.67: Verificar n(S) no Desafio Dinâmico 1
    if (stage === 1 && subStep === 6.67) {
      const inputValue = parseInt(exerciseNSInput.value || '');
      const expectedValue = sectors.length;

      if (inputValue === expectedValue) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `n(S) = ${expectedValue}`, "success", 2000);

        setGameState(prev => ({ ...prev, subStep: 6.68 }));

        setInstructions(`<p class="ds-body"><strong>Desafio — Probabilidade</strong></p>
          <p class="ds-body">Agora calcule a probabilidade.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExerciseNSInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Observe quantos setores compõem o disco.", "error", 3000);
      }
      return;
    }

    // STAGE 1 - SubStep 6.68: Verificar P(E) no Desafio Dinâmico 1
    if (stage === 1 && subStep === 6.68) {
      const numerator = parseInt(exercisePENumeratorInput.value || '');
      const denominator = parseInt(exercisePEDenominatorInput.value || '');
      const { challenge1SectorNumbers, challenge1PropertyY, challenge1EventXColors, challenge1Connective, challenge1EventXType, challenge1ValueP, challenge1InterProblemType, challenge1InterM, challenge1InterP, challenge1InterK } = gameState;

      // Calcular n(E) (numerador esperado)
      let expectedNumerator: number;

      if (challenge1InterProblemType !== null) {
        // Gerador de interseção controlado
        expectedNumerator = solveIntersectionSet(challenge1InterProblemType, challenge1SectorNumbers, challenge1InterM, challenge1InterP, challenge1InterK).size;
      } else {
        // Fluxo original (cor + propriedade numérica)
        expectedNumerator = 0;
        sectors.forEach((sector, index) => {
          const colorSatisfies = challenge1EventXType === 'exclusao'
            ? !challenge1EventXColors.includes(sector.colorName)
            : challenge1EventXColors.includes(sector.colorName);
          const numberSatisfies = checkProperty(challenge1SectorNumbers[index], challenge1PropertyY, challenge1ValueP);

          if (challenge1Connective === 'ou') {
            if (colorSatisfies || numberSatisfies) {
              expectedNumerator++;
            }
          } else {
            if (colorSatisfies && numberSatisfies) {
              expectedNumerator++;
            }
          }
        });
      }
      const expectedDenominator = sectors.length;

      if (areSplitFractionsEquivalent(numerator, denominator, expectedNumerator, expectedDenominator)) {
        playSound("/sounds/correct.mp3");

        // Calcular decimal e porcentagem
        const resultDecimal = expectedNumerator / expectedDenominator;
        const resultPercentage = resultDecimal * 100;
        const formattedDecimal = Number.isInteger(resultDecimal)
          ? resultDecimal.toString()
          : resultDecimal.toFixed(4).replace(/\.?0+$/, '');
        const formattedPercentage = Number.isInteger(resultPercentage)
          ? resultPercentage.toString()
          : resultPercentage.toFixed(2).replace(/\.?0+$/, '');

        setGameState(prev => ({ ...prev, subStep: 6.69 }));

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Parabéns!',
          message: `Você aplicou a ideia de casos favoráveis / casos possíveis em um espaço equiprovável.<br/><br/><div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; flex-wrap: wrap;"><span>P(E) =</span><span style="display: inline-flex; flex-direction: column; align-items: center;"><span>${expectedNumerator}</span><span style="width: 100%; height: 2px; background: currentColor;"></span><span>${expectedDenominator}</span></span><span>= ${formattedDecimal} = ${formattedPercentage}%</span></div>`
        });

        setInstructions(`<p class="ds-body"><strong>Desafio Concluído</strong></p>
          <p class="ds-body">Você calculou corretamente a probabilidade!</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setExercisePENumeratorInput(prev => ({ ...prev, error: true }));
        setExercisePEDenominatorInput(prev => ({ ...prev, error: true }));
        createAlert("Erro!", "Conte corretamente quantos casos favoráveis ao evento E você marcou e conte quantos casos possíveis tem no disco: P(E) = número de casos favoráveis ao evento E / número de elementos do espaço amostral.", "error", 6000);
      }
      return;
    }

    // ========== EVENTOS COMPLEMENTARES — Cálculo (6.85-6.88 guiado, 6.90-6.93 independente) ==========

    // SubSteps 6.85 / 6.90: Selecionar setores de A
    if (stage === 1 && (subStep === 6.85 || subStep === 6.90) && compPhase === 'calc_selectA') {
      const ev = gameState.compEventA;
      if (!ev) return;
      const correctSet = new Set(ev.indicesA);
      const userSet = new Set(gameState.selectedSectors);
      if (correctSet.size === userSet.size && [...correctSet].every(i => userSet.has(i))) {
        playSound("/sounds/correct.mp3");
        if (subStep === 6.85) {
          // Guiado → vai direto para selectĀ
          setCompPhase('calc_selectAbar');
          setGameState(prev => ({ ...prev, subStep: 6.86 }));
          setCompUserSelectAbar([]);
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Evento A correto!',
            message: `Agora marque no disco o evento complementar de A (<strong>Ā</strong>).`
          });
          setInstructions(`<p class="ds-body"><strong>Cálculo Guiado — Eventos Complementares</strong></p>
            <p class="ds-body">Selecione os setores do evento Ā no disco e clique em Conferir.</p>`);
        } else {
          // Independente (6.90) → vai para P(A) fração antes de selectĀ
          setCompPhase('calc_pa');
          setCompPaInput({ num: '', den: '', errNum: false, errDen: false });
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Evento A correto!',
            message: `Agora informe a probabilidade de A como fração.`
          });
          setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
            <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto", "Verifique quais setores correspondem ao evento A e tente novamente.", "error", 4000);
        setGameState(prev => ({ ...prev, selectedSectors: [] }));
      }
      return;
    }

    // SubStep 6.90: Validar P(A) fração (independente apenas)
    if (stage === 1 && subStep === 6.90 && compPhase === 'calc_pa') {
      const ev = gameState.compEventA;
      if (!ev) return;
      const m = ev.indicesA.length;
      const n = gameState.sectors.length;
      const numVal = parseInt(compPaInput.num);
      const denVal = parseInt(compPaInput.den);
      let hasErr = false;
      const errs = { errNum: false, errDen: false };
      if (!areSplitFractionsEquivalent(numVal, denVal, m, n)) {
        errs.errNum = true; errs.errDen = true; hasErr = true;
      }
      if (hasErr) {
        playSound("/sounds/incorrect.mp3");
        setCompPaInput(prev => ({ ...prev, ...errs }));
        createAlert("Incorreto", "Verifique o numerador (setores favoráveis) e o denominador (total de setores).", "error", 4000);
        return;
      }
      // P(A) correto → transicionar para selectĀ
      playSound("/sounds/correct.mp3");
      setCompPhase('calc_selectAbar');
      setGameState(prev => ({ ...prev, subStep: 6.91 }));
      setCompUserSelectAbar([]);
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'success',
        title: 'P(A) correto!',
        message: `Agora marque no disco o evento complementar de A (<strong>Ā</strong>).`
      });
      setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
        <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
      return;
    }

    // SubSteps 6.86 / 6.91: Selecionar setores de Ā
    if (stage === 1 && (subStep === 6.86 || subStep === 6.91)) {
      const ev = gameState.compEventA;
      if (!ev) return;
      const correctSet = new Set(ev.indicesAbar);
      const userSet = new Set(compUserSelectAbar);
      if (correctSet.size === userSet.size && [...correctSet].every(i => userSet.has(i))) {
        playSound("/sounds/correct.mp3");
        setCompPhase('calc_showBoth');
        setGameState(prev => ({ ...prev, subStep: subStep === 6.86 ? 6.87 : 6.92 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Muito bem!',
          message: `Observe que <strong style="color:#FFD700">A</strong> (dourado) e <strong style="color:#00E5FF">Ā</strong> (ciano) não possuem setores em comum e juntos formam todo o espaço amostral.`
        });
        if (compIsGuided) {
          setInstructions(`<p class="ds-body"><strong>Cálculo Guiado — Eventos Complementares</strong></p>
            <p class="ds-body">Observe os setores de A e Ā no disco.</p>`);
        } else {
          setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
            <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto", "Verifique quais setores NÃO pertencem ao evento A e tente novamente.", "error", 4000);
        setCompUserSelectAbar([]);
      }
      return;
    }

    // SubSteps 6.88 / 6.93: Cadeia de cálculo P(Ā) = 1 − P(A) = n/n − m/n = (n−m)/n
    if (stage === 1 && (subStep === 6.88 || subStep === 6.93)) {
      const ev = gameState.compEventA;
      if (!ev) return;
      const m = ev.indicesA.length;
      const n = gameState.sectors.length;

      const v = compChainInputs;
      const n1 = parseInt(v.n1); const d1 = parseInt(v.d1);
      const n2 = parseInt(v.n2); const d2 = parseInt(v.d2);
      const fn = parseInt(v.finalNum); const fd = parseInt(v.finalDen);

      let hasError = false;
      const errs = { errN1: false, errD1: false, errN2: false, errD2: false, errFinalNum: false, errFinalDen: false };
      const msgs: string[] = [];

      // Aceita frações equivalentes via produto cruzado: a/b == p/q ⇔ a*q == b*p.
      // Cada slot tem um alvo (1 = n/n, P(A) = m/n, P(Ā) = (n-m)/n) e qualquer
      // forma equivalente — incluindo reduzida — é considerada correta.
      const isEqualFraction = (an: number, ad: number, tn: number, td: number) =>
        Number.isInteger(an) && Number.isInteger(ad) && ad !== 0 && an * td === ad * tn;

      const frac1Ok = isEqualFraction(n1, d1, n, n); // representa 1
      const frac2Ok = isEqualFraction(n2, d2, m, n); // representa P(A)
      const fracFOk = isEqualFraction(fn, fd, n - m, n); // representa P(Ā)

      if (!frac1Ok) { errs.errN1 = true; errs.errD1 = true; hasError = true; }
      if (!frac2Ok) { errs.errN2 = true; errs.errD2 = true; hasError = true; }
      if (!fracFOk) { errs.errFinalNum = true; errs.errFinalDen = true; hasError = true; }

      if (hasError) {
        playSound("/sounds/incorrect.mp3");
        setCompChainInputs(prev => ({ ...prev, ...errs }));
        if (!frac1Ok) msgs.push('A primeira fração deve representar o número 1 (qualquer forma equivalente, ex.: n/n).');
        if (!frac2Ok) msgs.push('A segunda fração deve representar P(A) (qualquer forma equivalente a m/n).');
        if (!fracFOk) msgs.push('A fração final deve representar P(Ā) (qualquer forma equivalente ao resultado da subtração).');
        createAlert("Incorreto", msgs.join(' '), "error", 5000);
        return;
      }

      // Tudo correto — calcular decimal e percentual automaticamente
      playSound("/sounds/correct.mp3");
      const decimal = (n - m) / n;
      const decimalStr = decimal % 1 === 0 ? String(decimal) : decimal.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      const percentStr = (decimal * 100) % 1 === 0
        ? `${decimal * 100}%`
        : `${(decimal * 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
      setCompChainResult({ decimal: decimalStr, percentage: percentStr });

      if (subStep === 6.88) {
        // Guiado → iniciar independente
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Parabéns!',
          message: `P(Ā) = ${n - m}/${n} = ${decimalStr} = ${percentStr}.<br/>Agora pratique sozinho!`
        });
        setTimeout(() => {
          initCompCalcExampleRef.current(false);
        }, 1500);
      } else {
        // Independente (6.93) → próximo exemplo ou transição
        if (compCalcExampleNum >= 3) {
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Excelente!',
            message: `Você dominou o cálculo de P(Ā) = 1 − P(A)! Vamos seguir em frente.`
          });
          setTimeout(() => {
            transitionToPredictionRef.current();
          }, 1500);
        } else {
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Correto!',
            message: `P(Ā) = ${n - m}/${n} = ${decimalStr} = ${percentStr}. Vamos para o próximo exemplo!`
          });
          setTimeout(() => {
            initCompCalcExampleRef.current(false);
          }, 1500);
        }
      }
      return;
    }
    // ===== ETAPA 2 =====

    // STAGE 2 - SubStep 0: Verificar slider (k setores)
    if (stage === 2 && subStep === 0) {
      if (sliderValue === gameState.s2K) {
        // Gerar ângulos não equiprováveis
        const result = generateNonEquiprobableAngles(gameState.s2K);
        const k = gameState.s2K;
        const { m, S, ki, angles } = result;

        // Selecionar k cores aleatórias
        const shuffledColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
        const selectedColors = shuffledColors.slice(0, k);

        // Criar setores
        const newSectors: RouletteSector[] = selectedColors.map((color, index) => ({
          color: color,
          colorName: color,
          angle: angles[index]
        }));

        const newFrequencies: { [color: string]: number } = {};
        newSectors.forEach(s => newFrequencies[s.colorName] = 0);

        const x = 1 / S;

        setGameState(prev => ({
          ...prev,
          sectors: newSectors,
          showDivisions: true,
          showAngles: true,
          frequencies: newFrequencies,
          subStep: 0.15,
          s2M: m,
          s2Ki: ki,
          s2Angles: angles,
          s2SumI: S,
          s2X: x,
          s2TableIndex: 0,
          s2AngleProbDecimals: Array(k).fill(''),
          s2AngleProbPercents: Array(k).fill('')
        }));

        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "O disco foi dividido corretamente!", "success", 3000);

        // Setup fase de aposta (investigação inicial)
        setExperimentationState({
          wageredColor: null,
          wagers: [],
          draws: [],
          currentAttempt: 1,
          waitingForConfirmation: false,
          internalDrawnColor: null,
          colorRevealed: false
        });
        setDisabledSpinButton(true);

        setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
          <p class="ds-body">Girando-se aleatoriamente o disco, em qual cor você apostaria para ter mais chance de ganhar?</p>
          <p class="ds-body">Clique no setor que você acredita que o ponteiro irá indicar.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", `Observe o disco e selecione o número correto de setores.`, "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 0.17: Botão "Continuar" na comparação (4 cenários de feedback)
    if (stage === 2 && subStep === 0.17) {
      if (showInfoBox) return;

      const maxAngle = Math.max(...gameState.s2Angles);
      const maxIdx = gameState.s2Angles.indexOf(maxAngle);
      const maxColor = gameState.sectors[maxIdx]?.colorName || '';
      const wagered = experimentationState.wageredColor || '';
      const drawnColor = experimentationState.internalDrawnColor || '';

      const betOnLargest = wagered === maxColor;
      const won = drawnColor === wagered;

      if (betOnLargest && won) {
        // CASO 1: Ganhou + apostou no maior → sem alerta, pergunta direto
        setSuboptimalAttempts(0);
        const shuffledF = [...S2_DISTRACTORS_F].sort(() => Math.random() - 0.5);
        const selected4F = shuffledF.slice(0, 4);
        const selectedV = S2_TRUE_OPTIONS_V[Math.floor(Math.random() * S2_TRUE_OPTIONS_V.length)];

        const allOptions = [
          ...selected4F.map((f, i) => ({ value: `f_${i}`, label: f, isCorrect: false })),
          { value: 'v_correct', label: selectedV, isCorrect: true }
        ].sort(() => Math.random() - 0.5);

        setCurrentQuestion({
          question: `Por que a cor ${maxColor} tem maior chance de ser sorteada?`,
          options: allOptions,
          correctAnswer: 'v_correct'
        });
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 0.19 }));
        setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
          <p class="ds-body">Responda a pergunta abaixo.</p>`);

      } else if (!betOnLargest && won) {
        // CASO 2: Ganhou, mas NÃO era o setor mais provável → feedback + nova aposta
        const newAttempts = suboptimalAttempts + 1;
        setSuboptimalAttempts(newAttempts);
        playSound("/sounds/incorrect.mp3");
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'warning',
          title: 'Observe',
          message: newAttempts >= 2
            ? 'Você ganhou! Mas já tentou duas vezes. Antes do próximo giro, observe critérios que podem indicar maior chance, como área, ângulo ou comprimento de arco.'
            : 'Você ganhou! Mas tem alguma forma de apostar com maior chance? Tente a melhor estratégia no próximo giro.'
        });

      } else if (!betOnLargest && !won) {
        // CASO 3: Perdeu + NÃO era o setor mais provável → feedback + nova aposta
        const newAttempts = suboptimalAttempts + 1;
        setSuboptimalAttempts(newAttempts);
        playSound("/sounds/incorrect.mp3");
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'warning',
          title: 'Observe',
          message: newAttempts >= 2
            ? 'Você perdeu! Já tentou duas vezes. Antes do próximo giro, observe critérios que podem indicar maior chance, como área, ângulo ou comprimento de arco.'
            : 'Você perdeu! Mas tem alguma forma de apostar com maior chance? Tente a melhor estratégia no próximo giro.'
        });

      } else {
        // CASO 4: Perdeu, mas apostou no maior setor → feedback de aleatoriedade → prossegue
        setSuboptimalAttempts(0);
        setGameState(prev => ({ ...prev, subStep: 0.18 }));
        playSound("/sounds/nextChallenge.mp3");
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'info',
          title: 'Reflita',
          message: 'Mesmo sendo o setor mais provável, ele não foi sorteado desta vez.<br/>Na probabilidade, o resultado pode variar, mas a chance continua sendo maior.'
        });
        setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
          <p class="ds-body">Leia a observação e clique em <strong>Li.</strong></p>`);
      }
      return;
    }

    // STAGE 2 - SubStep 0.19: Reflexão conceitual (múltipla escolha F/V)
    if (stage === 2 && subStep === 0.19) {
      if (selectedOption === 'v_correct') {
        playSound("/sounds/correct.mp3");
        createAlert("Exatamente!", "A probabilidade está relacionada à medida do setor.", "success", 3000);

        // Melhoria 8 — Nomear o viés de equiprobabilidade (Almouloud/Saddo, Lecoutre 1992)
        setGameState(prev => ({ ...prev, subStep: 0.191 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Viés de Equiprobabilidade',
          message: 'O erro de pensar que todos os resultados têm a mesma chance, mesmo quando as condições são diferentes, é chamado de <strong>viés de equiprobabilidade</strong> (Lecoutre, 1992).<br/><br/>Na Etapa 1, essa suposição era correta — os setores tinham o mesmo tamanho. Mas agora, com setores de tamanhos diferentes, <strong>a probabilidade de cada cor depende da área que ela ocupa no disco</strong>.<br/><br/>Nomear esse erro ajuda a reconhecê-lo e evitá-lo.'
        });
        setInstructions(`<p class="ds-body"><strong>Conceito Importante</strong></p>
          <p class="ds-body">Leia o conceito sobre o viés de equiprobabilidade.</p>`);
      } else if (selectedOption) {
        // Erro: micro-feedback perceptivo + obrigar novo giro
        playSound("/sounds/incorrect.mp3");
        setSelectedOption('');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'info',
          title: 'Observe',
          message: 'Compare visualmente o tamanho dos setores.<br/>Vamos realizar um novo giro para observar novamente o resultado.'
        });
      }
      return;
    }

    // STAGE 2 - SubStep 2: Espaço amostral S={cores}
    if (stage === 2 && subStep === 2) {
      const colors = gameState.sectors.map(s => s.colorName);
      if (validateSampleSpace(sampleSpaceInput.value || '', colors)) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Espaço amostral identificado corretamente.", "success", 3000);

        setSampleSpaceCountInput({ value: '', disabled: false, error: false });
        setGameState(prev => ({ ...prev, subStep: 2.1 }));
        setInstructions(`<p class="ds-body"><strong>Espaço Amostral</strong></p>
          <p class="ds-body">Quantos elementos possui o espaço amostral desse experimento?</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setSampleSpaceInput(prev => ({ ...prev, error: true }));

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'warning',
          title: 'Dica',
          message: 'O espaço amostral é o conjunto de todos os resultados possíveis.'
        });
      }
      return;
    }

    // STAGE 2 - SubStep 2.1: Quantos elementos
    if (stage === 2 && subStep === 2.1) {
      const inputCount = parseInt(sampleSpaceCountInput.value || '');
      if (inputCount === gameState.s2K) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `O espaço amostral possui ${gameState.s2K} elementos.`, "success", 3000);

        // Pergunta 1: Cada setor tem probabilidade 1/k?
        const k = gameState.s2K;
        setCurrentQuestion({
          question: `Cada setor desse disco tem a mesma probabilidade de 1/${k} de ser sorteado?`,
          options: [
            { value: 'sim', label: 'Sim', isCorrect: false },
            { value: 'nao', label: 'Não', isCorrect: true }
          ],
          correctAnswer: 'nao'
        });
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 2.2 }));
        setInstructions(`<p class="ds-body"><strong>Probabilidade Individual</strong></p>
          <p class="ds-body">Analise se cada setor tem a mesma probabilidade.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setSampleSpaceCountInput(prev => ({ ...prev, error: true }));
        createAlert("Tente novamente.", "Conte quantas cores diferentes há no disco.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 2.2: Cada setor tem probabilidade 1/k?
    if (stage === 2 && subStep === 2.2) {
      if (selectedOption === 'nao') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Como os setores têm tamanhos diferentes, eles não possuem a mesma probabilidade.", "success", 3000);

        const k = gameState.s2K;

        // Com k=2, P(cor A ou cor B) = 2/2 = 1, pergunta trivial → pular para 2.4
        if (k === 2) {
          const colorNames = gameState.sectors.map(s => s.colorName);
          setS2RandomColors({ colorX: colorNames[0], colorY: colorNames[1] });

          setCurrentQuestion({
            question: 'Aqui não vale a Probabilidade Laplaciana onde P{Evento} = número de casos favoráveis ao evento / número de casos possíveis, pois: o espaço amostral desse experimento é:',
            options: [
              { value: 'equiprovavel', label: 'Equiprovável', isCorrect: false },
              { value: 'nao_equiprovavel', label: 'Não equiprovável', isCorrect: true }
            ],
            correctAnswer: 'nao_equiprovavel'
          });
          setSelectedOption('');
          setGameState(prev => ({ ...prev, subStep: 2.4 }));
          setInstructions(`<p class="ds-body"><strong>Probabilidade Laplaciana</strong></p>
            <p class="ds-body">Complete a afirmação abaixo.</p>`);
        } else {
          // Sortear 2 cores aleatórias do disco
          const colorNames = gameState.sectors.map(s => s.colorName);
          const shuffled = [...colorNames].sort(() => Math.random() - 0.5);
          const colorX = shuffled[0];
          const colorY = shuffled[1];
          setS2RandomColors({ colorX, colorY });

          // Pergunta 2: P(Cor X ou Cor Y) = 2/k?
          setCurrentQuestion({
            question: `A probabilidade de ocorrer um setor de Cor ${colorX} ou Cor ${colorY} é 2/${k}?`,
            options: [
              { value: 'sim', label: 'Sim', isCorrect: false },
              { value: 'nao', label: 'Não', isCorrect: true }
            ],
            correctAnswer: 'nao'
          });
          setSelectedOption('');
          setGameState(prev => ({ ...prev, subStep: 2.3 }));
          setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Compostos</strong></p>
            <p class="ds-body">Analise se a probabilidade segue a regra clássica.</p>`);
        }
      } else if (selectedOption === 'sim') {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Os setores possuem ângulos centrais diferentes, portanto suas probabilidades não são iguais.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 2.3: P(Cor X ou Cor Y) = 2/k?
    if (stage === 2 && subStep === 2.3) {
      if (selectedOption === 'nao') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A probabilidade não pode ser calculada assim nesse caso.", "success", 3000);

        // Tela Laplaciana (2.4)
        setCurrentQuestion({
          question: 'Aqui não vale a Probabilidade Laplaciana onde P{Evento} = número de casos favoráveis ao evento / número de casos possíveis, pois: o espaço amostral desse experimento é:',
          options: [
            { value: 'equiprovavel', label: 'Equiprovável', isCorrect: false },
            { value: 'nao_equiprovavel', label: 'Não equiprovável', isCorrect: true }
          ],
          correctAnswer: 'nao_equiprovavel'
        });
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 2.4 }));
        setInstructions(`<p class="ds-body"><strong>Probabilidade Laplaciana</strong></p>
          <p class="ds-body">Complete a afirmação abaixo.</p>`);
      } else if (selectedOption === 'sim') {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Lembre-se: os setores não possuem a mesma área, logo a soma de probabilidades individuais iguais não vale aqui.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 2.4: Probabilidade Laplaciana não se aplica
    if (stage === 2 && subStep === 2.4) {
      if (selectedOption === 'nao_equiprovavel') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A Probabilidade Laplaciana exige um espaço amostral equiprovável.", "success", 3000);

        // Ir para leitura progressiva antes da tabela de razões
        setProgressiveReadingStep(0);
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 2.9 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Razão entre as áreas dos setores',
          message: 'O setor mais provável de ser sorteado é aquele que possui maior área.'
        });
        setInstructions(`<p class="ds-body"><strong>Razão entre as áreas dos setores</strong></p>
          <p class="ds-body">Leia a observação e clique em <strong>Li.</strong></p>`);
      } else if (selectedOption === 'equiprovavel') {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Observe que os setores possuem tamanhos diferentes. O espaço amostral não é equiprovável.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 3: Razões angulares — state machine
    if (stage === 2 && subStep === 3) {

      // STATE unit_selected: Verificar questão conceitual MC
      if (s2RatioPhase === 'unit_selected') {
        if (s2ConceptSelected === 'v_correct') {
          playSound("/sounds/correct.mp3");
          createAlert("Correto.", "A probabilidade é proporcional à área do setor, que é determinada pelo ângulo central.", "success", 5000);

          // Escolher cor Y (diferente do menor setor)
          const minAngle = gameState.s2M;
          const nonMinSectors = gameState.sectors.filter((_, idx) => gameState.s2Angles[idx] !== minAngle);
          const chosen = nonMinSectors[Math.floor(Math.random() * nonMinSectors.length)];
          const chosenIdx = gameState.sectors.findIndex(s => s.colorName === chosen.colorName);
          const angleY = gameState.s2Angles[chosenIdx];
          const ratio = angleY / minAngle;

          setS2ReasoningColorY(chosen.colorName);
          setS2ReasoningAngleY(angleY);
          setS2ReasoningRatio(ratio);
          setS2ReasoningInput('');
          setS2ReasoningErrors(0);
          setS2ReasoningShowHint(false);
          setS2RatioPhase('ratio_question');

          const m = gameState.s2M;
          setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
            <p class="ds-body">Unidade = ${m}°</p>
            <p class="ds-body">Observe o disco. Vamos comparar o setor de cor <strong>${chosen.colorName}</strong> com o menor setor.</p>`);
        } else if (s2ConceptSelected) {
          playSound("/sounds/incorrect.mp3");
          createAlert("Tente novamente.", "A probabilidade depende da região ocupada no disco. Observe quais grandezas determinam a área do setor.", "error", 5000);
          setS2ConceptSelected('');
        }
        return;
      }

      // STATE ratio_question: Pergunta da razão dos ângulos
      if (s2RatioPhase === 'ratio_question') {
        const val = parseFloat(s2ReasoningInput.trim().replace(',', '.'));
        if (val === s2ReasoningRatio) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", "", "success", 3000);
          setS2ReasoningInput('');
          setS2ReasoningErrors(0);
          setS2ReasoningShowHint(false);
          setS2RatioPhase('area_question');

          const m = gameState.s2M;
          setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
            <p class="ds-body">Unidade = ${m}°</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          const newErrors = s2ReasoningErrors + 1;
          setS2ReasoningErrors(newErrors);
          if (newErrors >= 2) setS2ReasoningShowHint(true);
          createAlert("Errado.", `Divida a medida do ângulo do setor de cor ${s2ReasoningColorY} pela medida do ângulo do menor setor.`, "error", 5000);
        }
        return;
      }

      // STATE area_question: Pergunta da razão das áreas
      if (s2RatioPhase === 'area_question') {
        const val = parseFloat(s2ReasoningInput.trim().replace(',', '.'));
        if (val === s2ReasoningRatio) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", "", "success", 3000);
          setS2ReasoningInput('');
          setS2ReasoningErrors(0);
          setS2ReasoningShowHint(false);
          setS2RatioPhase('prob_question');

          const m = gameState.s2M;
          setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
            <p class="ds-body">Unidade = ${m}°</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          const newErrors = s2ReasoningErrors + 1;
          setS2ReasoningErrors(newErrors);
          if (newErrors >= 2) setS2ReasoningShowHint(true);
          createAlert("Errado.", "Observe que setores com o mesmo raio têm áreas proporcionais aos ângulos.", "error", 5000);
        }
        return;
      }

      // STATE prob_question: Pergunta da probabilidade
      if (s2RatioPhase === 'prob_question') {
        const raw = s2ReasoningInput.trim().toLowerCase().replace(/\s/g, '');
        const r = s2ReasoningRatio;
        // Aceitar: "3p", "3·p", "3*p", "p*3", "p·3"
        const validForms = [
          `${r}p`, `${r}*p`, `${r}·p`,
          `p*${r}`, `p·${r}`, `p${r}`,
          `${r}.p`, `p.${r}`
        ];
        // Se ratio é inteiro, aceitar também sem separador
        const isCorrect = validForms.includes(raw);

        if (isCorrect) {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", "Observe que a probabilidade cresce na mesma razão que a área do setor.", "success", 5000);

          // Liberar tabela → STATE question_correct
          const colors = gameState.sectors.map(s => s.colorName);
          const inputs: { [color: string]: { value: string; disabled: boolean; error: boolean; setValue: (val: string) => void } } = {};
          colors.forEach((color) => {
            inputs[color] = {
              value: '',
              disabled: false,
              error: false,
              setValue: (val: string) => {
                setS2RatioInputs(prev => ({
                  ...prev,
                  [color]: { ...prev[color], value: val }
                }));
              }
            };
          });
          setS2RatioInputs(inputs);
          setS2RatioPhase('question_correct');
          setS2TableAllCorrect(false);

          const m = gameState.s2M;
          setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
            <p class="ds-body">Unidade = ${m}°</p>
            <p class="ds-body">O menor ângulo do disco é ${m}°. Para cada cor, divida o ângulo do setor por ${m} e digite o resultado.</p>`);
        } else {
          playSound("/sounds/incorrect.mp3");
          const newErrors = s2ReasoningErrors + 1;
          setS2ReasoningErrors(newErrors);
          if (newErrors >= 2) setS2ReasoningShowHint(true);
          createAlert("Errado.", "A probabilidade é proporcional à área do setor. Multiplique p pela razão encontrada.", "error", 5000);
        }
        return;
      }

      // STATE question_correct / table_checked: Verificar tabela de razões angulares
      if (s2RatioPhase === 'question_correct' || s2RatioPhase === 'table_checked') {
        const colors = gameState.sectors.map(s => s.colorName);
        let allCorrect = true;
        const updatedInputs = { ...s2RatioInputs };

        colors.forEach((color, idx) => {
          const input = s2RatioInputs[color];
          const expected = gameState.s2Ki[idx];
          const val = parseFloat((input?.value || '').trim().replace(',', '.'));

          if (val === expected) {
            updatedInputs[color] = { ...updatedInputs[color], error: false, disabled: true };
          } else {
            updatedInputs[color] = { ...updatedInputs[color], error: true, disabled: false };
            allCorrect = false;
          }
        });

        setS2RatioInputs(updatedInputs);

        if (allCorrect) {
          playSound("/sounds/correct.mp3");
          createAlert("Parabéns!", "Todas as razões estão corretas!", "success", 3000);
          setS2TableAllCorrect(true);
          setS2RatioPhase('table_checked');
        } else {
          playSound("/sounds/incorrect.mp3");
          createAlert("Verifique os campos destacados.", "Recalcule as linhas em vermelho.", "error", 4000);
          setS2RatioPhase('table_checked');
        }
        return;
      }

      return;
    }

    // STAGE 2 - SubStep 4: Probabilidades i·p (state machine TPACK)
    if (stage === 2 && subStep === 4) {
      // Phase: sum_question — pergunta sobre soma das probabilidades
      if (s2IxPhase === 'sum_question') {
        if (s2IxSumSelected === 'deve_dar_1') {
          playSound("/sounds/correct.mp3");
          createAlert("Isso mesmo!", "A soma das probabilidades de todos os resultados possíveis é sempre 1.", "success", 4000);
          setS2IxPhase('filling_table');
          setInstructions(`<p class="ds-body"><strong>Distribuindo a probabilidade entre todos os setores</strong></p>
            <p class="ds-body">Cada setor recebe uma quantidade proporcional à sua área. Seja <strong>p</strong> a probabilidade do setor de menor ângulo central ser sorteado.</p>
            <p class="ds-body">Vamos determinar o valor de <strong>p</strong>. Atribua probabilidades a cada setor na tabela em função de <strong>p</strong>.</p>`);
        } else if (s2IxSumSelected) {
          playSound("/sounds/incorrect.mp3");
          createAlert("Pense novamente.", "O disco sempre para em algum setor.", "error", 3000);
        }
        return;
      }

      // Phase: filling_table — preenchimento campo a campo + soma
      if (s2IxPhase === 'filling_table') {
        const colors = gameState.sectors.map(s => s.colorName);
        const idx = gameState.s2TableIndex;

        // Verificação da soma (após todos os i·p preenchidos)
        if (idx >= colors.length) {
          const val = (s2SumEquationInput.value || '').trim();
          if (areFractionsEquivalent(val, '1')) {
            playSound("/sounds/correct.mp3");
            createAlert("Correto!", "A soma das probabilidades de todos os setores é 1.", "success", 3000);
            setS2SumEquationInput(prev => ({ ...prev, disabled: true, error: false }));
            setS2IxPhase('guided_calc');
            setS2IxCalcStep(0);
            setInstructions(`<p class="ds-body"><strong>Distribuindo a probabilidade entre todos os setores</strong></p>
              <p class="ds-body">Acompanhe o cálculo passo a passo. Clique em <strong>Próximo</strong> para ver cada etapa.</p>`);
          } else {
            playSound("/sounds/incorrect.mp3");
            setS2SumEquationInput(prev => ({ ...prev, error: true }));
            createAlert("Pense novamente.", "Qual deve ser a soma de todas as probabilidades?", "error", 3000);
          }
          return;
        }

        // Verificação do campo i·p
        const color = colors[idx];
        const input = s2IxInputs[color];
        const expectedI = gameState.s2Ki[idx];
        const expectedStr = `${expectedI}p`;

        const userVal = (input?.value || '').trim().toLowerCase().replace(/\s/g, '').replace('·', '').replace('*', '');
        const isCorrect = userVal === expectedStr || userVal === `${expectedI}p` || (expectedI === 1 && userVal === 'p');
        if (isCorrect) {
          playSound("/sounds/correct.mp3");
          createAlert("Parabéns!", `Correto! P(${color}) = ${expectedI}p.`, "success", 2000);

          const nextIdx = idx + 1;
          if (nextIdx >= colors.length) {
            // Todos i·p preenchidos → habilitar campo da soma
            setS2SumEquationInput(prev => ({ ...prev, value: '', disabled: false, error: false }));
            setGameState(prev => ({ ...prev, s2TableIndex: colors.length }));
            setInstructions(`<p class="ds-body"><strong>Distribuindo a probabilidade entre todos os setores</strong></p>
              <p class="ds-body">Todas as probabilidades foram atribuídas. Qual deve ser a soma de todas as probabilidades?</p>`);
          } else {
            setS2IxInputs(prev => {
              const updated = { ...prev };
              const nextColor = colors[nextIdx];
              updated[nextColor] = { ...updated[nextColor], disabled: false };
              return updated;
            });
            setGameState(prev => ({ ...prev, s2TableIndex: nextIdx }));
          }
        } else {
          playSound("/sounds/incorrect.mp3");
          setS2IxInputs(prev => ({
            ...prev,
            [color]: { ...prev[color], error: true }
          }));
          createAlert("Tente novamente.", `A razão angular de ${color} é ${expectedI}. Escreva na forma ip.`, "error", 4000);
        }
        return;
      }

      return;
    }

    // STAGE 2 - SubStep 5: Soma = 1
    if (stage === 2 && subStep === 5) {
      const val = (s2SumEquationInput.value || '').trim();
      if (areFractionsEquivalent(val, '1')) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A soma das probabilidades de todos os eventos simples é igual a 1.", "success", 3000);

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Princípio Fundamental',
          message: 'Em um espaço amostral a soma das probabilidades dos eventos simples é igual a 1.'
        });

        setGameState(prev => ({ ...prev, subStep: 5.1 }));
        setInstructions(`<p class="ds-body"><strong>Princípio Fundamental</strong></p>
          <p class="ds-body">Leia o conceito e clique em <strong>Li.</strong> para continuar.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2SumEquationInput(prev => ({ ...prev, error: true }));
        createAlert("Tente novamente!", "Qual a probabilidade de o ponteiro parar em qualquer uma das cores do disco?", "error", 5000);
      }
      return;
    }

    // STAGE 2 - SubStep 5.2: Resolver equação e determinar x
    if (stage === 2 && subStep === 5.2) {
      const S = gameState.s2SumI;
      const expectedFrac = `1/${S}`;

      if (areFractionsEquivalent(s2XInput.value || '', expectedFrac)) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `x = 1/${S}`, "success", 3000);

        // Inicializar tabela de probabilidades numéricas
        const colors = gameState.sectors.map(s => s.colorName);
        const inputs: { [color: string]: TextInputInterface } = {};
        colors.forEach((c, i) => {
          inputs[c] = {
            value: '',
            disabled: i !== 0,
            error: false,
            setValue: (val: string) => {
              setS2NumProbInputs(prev => ({
                ...prev,
                [c]: { ...prev[c], value: val }
              }));
            }
          };
        });
        setS2NumProbInputs(inputs);
        setGameState(prev => ({ ...prev, subStep: 6, s2TableIndex: 0 }));

        setInstructions(`<p class="ds-body"><strong>Probabilidades Numéricas</strong></p>
          <p class="ds-body">Substitua x = 1/${S} em cada expressão i·x e calcule a probabilidade numérica de cada cor.</p>
          <p class="ds-body">Digite na forma de fração (ex: a/b).</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2XInput(prev => ({ ...prev, error: true }));
        const equationTerms = gameState.s2Ki.map(ki => `${ki}x`).join(' + ');
        createAlert("Erro! Tente novamente!", `Resolva ${equationTerms} = 1 para encontrar x.`, "error", 5000);
      }
      return;
    }

    // STAGE 2 - SubStep 6: Probabilidades numéricas i·p (campo a campo)
    if (stage === 2 && subStep === 6) {
      const colors = gameState.sectors.map(s => s.colorName);
      const idx = gameState.s2TableIndex;
      const color = colors[idx];
      const input = s2NumProbInputs[color];
      const ki = gameState.s2Ki[idx];
      const S = gameState.s2SumI;
      const expectedFrac = `${ki}/${S}`;

      if (areFractionsEquivalent(input?.value || '', expectedFrac)) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", `P(${color}) = ${ki}/${S}`, "success", 2000);

        const nextIdx = idx + 1;
        if (nextIdx >= colors.length) {
          // Todos P(cor) preenchidos → iniciar fase de treinos (inline)
          const origK = gameState.s2K;
          const availKs = [2, 3, 4, 5, 6].filter(kv => kv !== origK);
          const trainK = availKs[Math.floor(Math.random() * availKs.length)];
          const result = generateNonEquiprobableAngles(trainK);
          const shuffColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
          const selColors = shuffColors.slice(0, trainK);
          const newSectors: RouletteSector[] = selColors.map((c, i) => ({ color: c, colorName: c, angle: result.angles[i] }));

          setTrainingState({
            active: true, currentTraining: 1, phase: 'identify_sector',
            k: trainK, m: result.m, ki: result.ki, angles: result.angles, S: result.S,
            sectors: newSectors, usedKValues: [origK, trainK],
            tableIndex: 0, calcStep: 0,
            originalSectors: [...gameState.sectors], originalK: gameState.s2K,
            originalM: gameState.s2M, originalKi: [...gameState.s2Ki],
            originalAngles: [...gameState.s2Angles], originalSumI: gameState.s2SumI,
          });
          setTrainRatioInputs({});
          setTrainIxInputs({});
          setTrainSumInput({ value: '', disabled: true, error: false, setValue: (val: string) => setTrainSumInput(prev => ({ ...prev, value: val })) });
          setTrainProbInputs({});
          setGameState(prev => ({
            ...prev, subStep: 6.101, sectors: newSectors, showAngles: true,
            s2K: trainK, s2M: result.m, s2Ki: result.ki, s2Angles: result.angles, s2SumI: result.S, s2TableIndex: 0,
          }));
          setInstructions(`<p class="ds-body"><strong>Treino 1</strong></p>
            <p class="ds-body">Girando-se o disco abaixo ao acaso, determine a probabilidade de o ponteiro indicar cada uma das cores do disco.</p>
            <p class="ds-body">Clique no setor com o <strong>menor ângulo central</strong>.</p>`);
        } else {
          setS2NumProbInputs(prev => {
            const updated = { ...prev };
            const nextColor = colors[nextIdx];
            updated[nextColor] = { ...updated[nextColor], disabled: false };
            return updated;
          });
          setGameState(prev => ({ ...prev, s2TableIndex: nextIdx }));
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2NumProbInputs(prev => ({
          ...prev,
          [color]: { ...prev[color], error: true }
        }));
        createAlert("Tente novamente.", `Substitua p = 1/${S} em ${ki}·p.`, "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 6.202: Nenhum checkAnswer — a seleção do radio controla o disco diretamente via handleReflectionOptionChange

    // STAGE 2 - SubStep 6.204: Pergunta após 2o giro reflexivo
    if (stage === 2 && subStep === 6.204) {
      if (!s2SpinReflection.selectedOption) return;
      setS2SpinReflection(prev => ({ ...prev, answer2: prev.selectedOption }));
      // Ir para síntese
      setGameState(prev => ({ ...prev, subStep: 6.205 }));
      setInstructions(`<p class="ds-body"><strong>Suas decisões</strong></p>
        <p class="ds-body">Veja abaixo o resumo das suas escolhas e reflita.</p>`);
      return;
    }

    // STAGE 2 - SubStep 7: Pergunta de ativação cognitiva (90°)
    if (stage === 2 && subStep === 7 && s2AngleReadingStep === 4) {
      if (selectedOption === '90/360') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Estamos comparando a parte com o todo.", "success", 3000);
        setSelectedOption('');
        // Avançar para inicializar tabela
        handleAngleReadingNext();
      } else if (selectedOption) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Estamos comparando a parte (ângulo do setor) com o todo (360°).", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 7: Probabilidade angular θ/360 (campo a campo)
    if (stage === 2 && subStep === 7) {
      const colors = gameState.sectors.map(s => s.colorName);
      const idx = gameState.s2TableIndex;
      const color = colors[idx];
      const input = s2AngleProbInputs[color];
      const angle = gameState.s2Angles[idx];
      const expectedFrac = `${angle}/360`;

      if (areFractionsEquivalent(input?.value || '', expectedFrac)) {
        playSound("/sounds/correct.mp3");

        // Calcular e exibir decimal e porcentagem
        const decimal = (angle / 360);
        const decimalStr = decimal.toFixed(4).replace(/\.?0+$/, '');
        const percentStr = (decimal * 100).toFixed(2).replace(/\.?0+$/, '') + '%';

        createAlert("Parabéns!", `P(${color}) = ${angle}/360 = ${decimalStr} = ${percentStr}`, "success", 3000);

        // Atualizar decimais e porcentagens reveladas
        const newDecimals = [...gameState.s2AngleProbDecimals];
        const newPercents = [...gameState.s2AngleProbPercents];
        newDecimals[idx] = decimalStr;
        newPercents[idx] = percentStr;

        const nextIdx = idx + 1;
        if (nextIdx >= colors.length) {
          // Ir para Treinos de Fração θ/360
          const savedSectors = [...gameState.sectors];
          const trainK = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
          const result = generateNonEquiprobableAngles(trainK);
          const shuffledColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
          const trainColors = shuffledColors.slice(0, trainK);

          // Montar setores reais para o disco visual
          const trainSectors: RouletteSector[] = trainColors.map((c, i) => ({
            color: c, colorName: c, angle: result.angles[i], number: i + 1
          }));

          setFracTraining({
            currentTraining: 1, completedCount: 0,
            k: trainK, angles: result.angles, colors: trainColors,
            allCorrect: false, usedKValues: [trainK],
            originalSectors: savedSectors
          });
          setFracThetaInputs(Object.fromEntries(trainColors.map(c => [c, { value: '', error: false, status: 'pending' as const, errorMsg: '' }])));

          setGameState(prev => ({
            ...prev,
            subStep: 8,
            s2TableIndex: 0,
            s2AngleProbDecimals: newDecimals,
            s2AngleProbPercents: newPercents,
            sectors: trainSectors,
            currentRotation: 0
          }));

          setInstructions(`<p class="ds-body"><strong>Frequência Relativa e Probabilidade</strong></p>
            <p class="ds-body">Treino 1 de 5 — Determine a fração θ/360 de cada cor observando o disco.</p>`);
        } else {
          setS2AngleProbInputs(prev => {
            const updated = { ...prev };
            const nextColor = colors[nextIdx];
            updated[nextColor] = { ...updated[nextColor], disabled: false };
            return updated;
          });
          setGameState(prev => ({
            ...prev,
            s2TableIndex: nextIdx,
            s2AngleProbDecimals: newDecimals,
            s2AngleProbPercents: newPercents
          }));
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2AngleProbInputs(prev => ({
          ...prev,
          [color]: { ...prev[color], error: true }
        }));
        createAlert("Tente novamente.", `Divida o ângulo ${angle}° por 360.`, "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 8: Treinos de Fração θ/360
    if (stage === 2 && subStep === 8) {
      const { angles: ftAngles, colors: ftColors } = fracTraining;
      let allOk = true;
      const upd = { ...fracThetaInputs };

      ftColors.forEach((ftColor, ftIdx) => {
        const inp = fracThetaInputs[ftColor];
        if (!inp || inp.status === 'correct') return;

        const angle = ftAngles[ftIdx];
        const val = (inp.value || '').trim().replace(/\s/g, '');

        if (!val || !val.includes('/') || val.includes('%') || val.includes(',') || val.includes('.')) {
          upd[ftColor] = { ...inp, error: true, errorMsg: 'Use uma fração a/b.' };
          allOk = false;
          return;
        }

        const parts = val.split('/');
        if (parts.length !== 2) {
          upd[ftColor] = { ...inp, error: true, errorMsg: 'Use uma fração a/b.' };
          allOk = false;
          return;
        }

        const num = parseInt(parts[0]), den = parseInt(parts[1]);
        if (isNaN(num) || isNaN(den) || den <= 0) {
          upd[ftColor] = { ...inp, error: true, errorMsg: 'Use uma fração a/b.' };
          allOk = false;
          return;
        }

        if (num * 360 === den * angle) {
          // Correto (fração exata ou equivalente)
          upd[ftColor] = { ...inp, error: false, status: 'correct', errorMsg: '' };
        } else {
          upd[ftColor] = { ...inp, error: true, errorMsg: 'Verifique o ângulo do setor no disco.' };
          allOk = false;
        }
      });

      setFracThetaInputs(upd);

      const everyRowDone = ftColors.every((c) => upd[c]?.status === 'correct');

      if (everyRowDone) {
        playSound("/sounds/correct.mp3");
        const completed = fracTraining.completedCount + 1;
        createAlert("Correto!", `Treino ${fracTraining.currentTraining} concluído!`, "success", 3000);
        setFracTraining(prev => ({ ...prev, completedCount: completed, allCorrect: true }));
      } else if (!allOk) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Verifique o ângulo de cada setor no disco e use a forma a/b.", "error", 4000);
      } else {
        playSound("/sounds/correct.mp3");
        createAlert("Continue!", "Preencha os setores restantes para concluir o treino.", "info", 3000);
      }
      return;
    }

    // STAGE 2 - SubStep 9.1: Verificar frequências absolutas
    if (stage === 2 && subStep === 9.1) {
      const colors = gameState.sectors.map(s => s.colorName);
      let allCorrect = true;
      const updated = { ...s2FreqAbsInputs };

      colors.forEach(color => {
        const input = s2FreqAbsInputs[color];
        const expected = gameState.frequencies[color] || 0;
        const val = parseInt((input?.value || '').trim());
        if (isNaN(val) || val !== expected) {
          updated[color] = { ...updated[color], error: true };
          allCorrect = false;
        }
      });

      if (allCorrect) {
        playSound("/sounds/correct.mp3");
        createAlert("Parabéns!", "Frequências absolutas corretas.", "success", 3000);

        // Pergunta conceitual obrigatória
        const predColor = gameState.s2PredictionColor;
        const z = gameState.s2K;
        const options: QuestionOption[] = [];
        for (let i = 0; i <= z; i++) {
          options.push({ value: `${i}`, label: `${i}` });
        }
        options.push({ value: 'incerteza', label: 'Não se pode ter certeza' });

        setCurrentQuestion({
          question: `Quantas vezes você acha que sairá a cor ${predColor}?`,
          options,
          correctAnswer: 'incerteza'
        });
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 9.2 }));
        setInstructions(`<p class="ds-body"><strong>Reflexão</strong></p>
          <p class="ds-body">Responda a pergunta abaixo.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2FreqAbsInputs(updated);
        createAlert("Tente novamente.", "Verifique a contagem de cada cor.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 9.2: Pergunta de incerteza
    if (stage === 2 && subStep === 9.2) {
      if (selectedOption === 'incerteza') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Não é possível prever com certeza.", "success", 3000);

        // Inicializar freq rel inputs
        const colors = gameState.sectors.map(s => s.colorName);
        const P = gameState.s2ManualSpinsP;
        const relInputs: { [color: string]: TextInputInterface } = {};
        colors.forEach((c, i) => {
          relInputs[c] = {
            value: '',
            disabled: i !== 0,
            error: false,
            setValue: (val: string) => {
              setS2FreqRelInputs(prev => ({
                ...prev,
                [c]: { ...prev[c], value: val }
              }));
            }
          };
        });
        setS2FreqRelInputs(relInputs);
        setGameState(prev => ({ ...prev, subStep: 9.3, s2TableIndex: 0 }));
        setSelectedOption('');

        setInstructions(`<p class="ds-body"><strong>Frequência Relativa</strong></p>
          <p class="ds-body">Calcule a frequência relativa de cada cor (frequência absoluta / ${P}).</p>
          <p class="ds-body">Digite na forma de fração (ex: a/${P}).</p>`);
      } else if (selectedOption) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Tente novamente.", "Cada giro é independente. Não se pode prever o resultado exato.", "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 9.3: Frequência relativa (campo a campo)
    if (stage === 2 && subStep === 9.3) {
      const colors = gameState.sectors.map(s => s.colorName);
      const idx = gameState.s2TableIndex;
      const color = colors[idx];
      const input = s2FreqRelInputs[color];
      const freq = gameState.frequencies[color] || 0;
      const P = gameState.s2ManualSpinsP;
      const expectedFrac = `${freq}/${P}`;

      if (areFractionsEquivalent(input?.value || '', expectedFrac)) {
        playSound("/sounds/correct.mp3");

        const percent = ((freq / P) * 100).toFixed(1) + '%';
        createAlert("Parabéns!", `FR(${color}) = ${freq}/${P} = ${percent}`, "success", 2000);

        const nextIdx = idx + 1;
        if (nextIdx >= colors.length) {
          // Liberar giros automáticos
          setShowAutoSpinButtons(true);
          setGameState(prev => ({ ...prev, subStep: 10, s2AutoBatchIndex: 0 }));
          setInstructions(`<p class="ds-body"><strong>Giros Automáticos</strong></p>
            <p class="ds-body">Clique nos botões abaixo para realizar giros automáticos e observar a convergência.</p>`);
        } else {
          setS2FreqRelInputs(prev => {
            const updated = { ...prev };
            const nextColor = colors[nextIdx];
            updated[nextColor] = { ...updated[nextColor], disabled: false };
            return updated;
          });
          setGameState(prev => ({ ...prev, s2TableIndex: nextIdx }));
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2FreqRelInputs(prev => ({
          ...prev,
          [color]: { ...prev[color], error: true }
        }));
        createAlert("Tente novamente.", `Divida a frequência absoluta de ${color} pelo total de giros (${P}).`, "error", 4000);
      }
      return;
    }

    // STAGE 2 - SubStep 11: Conclusão
    if (stage === 2 && subStep === 11) {
      const val = (s2ConclusionInput.value || '').trim().toLowerCase();
      const acceptable = ['das probabilidades teóricas', 'probabilidades teóricas', 'das probabilidades teoricas', 'probabilidades teoricas', 'probabilidade teórica', 'probabilidade teorica'];

      if (acceptable.some(a => val.includes(a)) || val.includes('teóric') || val.includes('teoric')) {
        playSound("/sounds/gameFinished.mp3");
        createAlert("Parabéns!", "Você completou a Etapa 2!", "success", 5000);

        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Lei dos Grandes Números',
          message: 'À medida que o número de repetições de um experimento aleatório aumenta, as frequências relativas de cada resultado tendem a se aproximar das respectivas probabilidades teóricas. Esse fenômeno é descrito pela Lei dos Grandes Números.'
        });

        setGameState(prev => ({ ...prev, subStep: 12, stage3Available: true }));
        setDisabledNextButton(false);
        setInstructions(`<p class="ds-body"><strong>Etapa 2 Concluída!</strong></p>
          <p class="ds-body">Clique em <strong>Etapa 3</strong> para continuar.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        setS2ConclusionInput(prev => ({ ...prev, error: true }));
        createAlert("Tente novamente.", "Observe o gráfico: para quais valores as frequências relativas convergem?", "error", 5000);
      }
      return;
    }

    // ======================== STAGE 3 ========================

    // STAGE 3 - SubStep 1.5: Questão diagnóstica (justificativa da aposta)
    if (stage === 3 && subStep === 1.5) {
      // A opção correta pode estar em qualquer posição (A, B ou C)
      const correctVal = currentQuestion?.correctAnswer || 'A';
      const chosenOpt = currentQuestion?.options?.find((o: { value: string }) => o.value === selectedOption);
      if (selectedOption === correctVal) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A probabilidade depende do número de casos favoráveis em relação ao total.", "success", 4000);
      } else if (chosenOpt && chosenOpt.label && (
        chosenOpt.label.includes('agrupados') || chosenOpt.label.includes('juntos') || chosenOpt.label.includes('próximos')
      )) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Atenção!", "A sequência visual dos setores pode dar uma falsa impressão. O que realmente importa é a contagem dos setores de cada cor.", "error", 6000);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Atenção!", "Fatores como intuição, preferência ou posição do ponteiro não influenciam a probabilidade. O que importa é quantos setores cada cor possui.", "error", 6000);
      }

      // Preparar contagem de setores (subStep 1.75)
      const distinctColors = Object.keys(s3State.colorCounts);
      const countInputs: { [color: string]: { value: string; error: boolean; correct: boolean } } = {};
      distinctColors.forEach(c => {
        countInputs[c] = { value: '', error: false, correct: false };
      });
      setS3State(prev => ({ ...prev, countInputs }));

      setGameState(prev => ({ ...prev, subStep: 1.75 }));
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Observe os setores</strong></p>
        <p class="ds-body">Conte quantos setores de cada cor existem no disco.</p>`);
      return;
    }

    // STAGE 3 - SubStep 1.75: Contagem de setores por cor
    if (stage === 3 && subStep === 1.75) {
      const { colorCounts, countInputs } = s3State;
      let allCorrect = true;
      const updCount = { ...countInputs };

      Object.entries(colorCounts).forEach(([color, expectedCount]) => {
        const inp = updCount[color];
        if (!inp || inp.correct) return;
        const val = parseInt((inp.value || '').trim());
        if (isNaN(val) || val !== expectedCount) {
          updCount[color] = { ...inp, error: true, correct: false };
          allCorrect = false;
        } else {
          updCount[color] = { ...inp, error: false, correct: true };
        }
      });

      setS3State(prev => ({ ...prev, countInputs: updCount }));

      if (!allCorrect) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Observe novamente.", "Conte os setores de cada cor no disco com atenção.", "error", 5000);
        return;
      }

      playSound("/sounds/correct.mp3");
      createAlert("Isso mesmo!", "A probabilidade de cada cor depende do número de setores que ela ocupa.", "success", 5000);

      // Preparar tabela de P(cor) para subStep 2
      const distinctColors = Object.keys(colorCounts);
      const probInputs: { [color: string]: { num: string; den: string; errorNum: boolean; errorDen: boolean; status: 'pending' | 'correct'; errorMsg: string } } = {};
      distinctColors.forEach(c => {
        probInputs[c] = { num: '', den: '', errorNum: false, errorDen: false, status: 'pending', errorMsg: '' };
      });
      setS3State(prev => ({ ...prev, probInputs }));

      setGameState(prev => ({ ...prev, subStep: 2 }));
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Probabilidade de cada cor</strong></p>
        <p class="ds-body">Ao girar aleatoriamente o disco apresentado, calcule a probabilidade de o ponteiro parar em cada uma das cores indicadas.</p>`);
      return;
    }

    // STAGE 3 - SubStep 2: Tabela de P(cor) = a/b
    if (stage === 3 && subStep === 2) {
      const { colorCounts, n, probInputs } = s3State;
      let allOk = true;
      const upd = { ...probInputs };

      Object.entries(colorCounts).forEach(([color, count]) => {
        const inp = upd[color];
        if (!inp || inp.status === 'correct') return;
        const numVal = parseInt((inp.num || '').trim());
        const denVal = parseInt((inp.den || '').trim());
        let errNum = false;
        let errDen = false;
        let errMsg = '';

        if (isNaN(numVal) || isNaN(denVal)) {
          errNum = isNaN(numVal);
          errDen = isNaN(denVal);
          errMsg = 'Preencha numerador e denominador.';
          allOk = false;
        } else if (areSplitFractionsEquivalent(numVal, denVal, count, n)) {
          upd[color] = { ...inp, errorNum: false, errorDen: false, status: 'correct', errorMsg: '' };
          return;
        } else {
          errNum = true;
          errDen = true;
          errMsg = 'Observe quantos setores possuem essa cor e o total de setores do disco.';
          allOk = false;
        }
        upd[color] = { ...inp, errorNum: errNum, errorDen: errDen, errorMsg: errMsg };
      });
      setS3State(prev => ({ ...prev, probInputs: upd }));

      const everyDone = Object.keys(colorCounts).every(c => upd[c]?.status === 'correct');
      if (everyDone) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A probabilidade depende da quantidade de setores da cor.", "success", 3000);
        setGameState(prev => ({ ...prev, subStep: 3 }));
        setSelectedOption('');

        // Preparar questão subStep 3
        const n3 = s3State.n;
        setCurrentQuestion({
          question: `Considere o espaço amostral S₁ = {1, 2, 3, …, ${n3}}. Qual é a probabilidade de sair um setor específico?`,
          options: [
            { value: 'A', label: `1/${n3}`, isCorrect: true },
            { value: 'B', label: 'Depende da cor do setor', isCorrect: false },
            { value: 'C', label: 'Depende do tamanho da cor', isCorrect: false },
            { value: 'D', label: 'Não é possível determinar', isCorrect: false }
          ],
          correctAnswer: 'A'
        });
        setInstructions(`<p class="ds-body"><strong>Espaço Amostral dos Setores</strong></p>
          <p class="ds-body">Considere os setores numerados de 1 a ${n3}.</p>`);
      } else if (!allOk) {
        playSound("/sounds/incorrect.mp3");
      } else {
        playSound("/sounds/correct.mp3");
      }
      return;
    }

    // STAGE 3 - SubStep 3: P(setor) = 1/n
    if (stage === 3 && subStep === 3) {
      const feedbacks: { [key: string]: string } = {
        'B': 'Cada setor individual tem o mesmo tamanho angular. A cor é um atributo do setor, mas não altera sua probabilidade individual.',
        'C': 'A probabilidade de um setor individual depende apenas da geometria (tamanho angular), não da cor que o setor possui.',
        'D': 'Você já tem toda a informação necessária: todos os setores são iguais, logo cada um tem probabilidade 1/n.'
      };

      if (selectedOption === 'A') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `Cada setor tem probabilidade 1/${s3State.n}, pois todos são do mesmo tamanho.`, "success", 4000);

        setGameState(prev => ({ ...prev, subStep: 4 }));
        setSelectedOption('');
        setCurrentQuestion({
          question: 'Qual espaço amostral é equiprovável?',
          options: [
            { value: 'A', label: 'Apenas o espaço dos setores numerados', isCorrect: true },
            { value: 'B', label: 'Apenas o espaço das cores', isCorrect: false },
            { value: 'C', label: 'Ambos são equiprováveis', isCorrect: false },
            { value: 'D', label: 'Nenhum é equiprovável', isCorrect: false }
          ],
          correctAnswer: 'A'
        });
        setInstructions(`<p class="ds-body"><strong>Comparação dos Espaços Amostrais</strong></p>
          <p class="ds-body">Agora compare o espaço dos setores numerados com o espaço das cores.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto.", feedbacks[selectedOption] || 'Tente novamente.', "error", 6000);
      }
      return;
    }

    // STAGE 3 - SubStep 4: Comparação dos espaços
    if (stage === 3 && subStep === 4) {
      const feedbacks: { [key: string]: string } = {
        'B': 'Repare que todos os setores têm o mesmo tamanho, mas as cores não aparecem na mesma quantidade.',
        'C': 'Os setores individuais são equiprováveis, mas as cores agrupam quantidades diferentes de setores — logo o espaço das cores não é equiprovável.',
        'D': 'Todos os setores têm o mesmo tamanho (mesmo ângulo central), portanto o espaço dos setores é, sim, equiprovável.'
      };

      if (selectedOption === 'A') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Cada setor individual tem a mesma chance, mas as cores agrupam quantidades diferentes de setores.", "success", 5000);

        setGameState(prev => ({ ...prev, subStep: 5 }));
        setSelectedOption('');
        const mfc = s3State.mostFreqColor;
        setCurrentQuestion({
          question: `Imagine que o disco foi girado 3 vezes e nas 3 vezes o ponteiro parou na cor ${mfc}. O que acontece com a probabilidade de sair essa mesma cor no próximo giro?`,
          options: [
            { value: 'A', label: `Aumenta, pois o disco está "tendendo" para essa cor.`, isCorrect: false },
            { value: 'B', label: `Diminui, pois as outras cores "precisam" aparecer para equilibrar.`, isCorrect: false },
            { value: 'C', label: 'Não se altera, pois cada giro é independente dos anteriores.', isCorrect: true },
            { value: 'D', label: 'Depende de quantas vezes o disco já foi girado no total.', isCorrect: false }
          ],
          correctAnswer: 'C'
        });
        setInstructions(`<p class="ds-body"><strong>Independência de Eventos</strong></p>
          <p class="ds-body">Considere a seguinte situação hipotética envolvendo a cor ${mfc}.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto.", feedbacks[selectedOption] || 'Tente novamente.', "error", 6000);
      }
      return;
    }

    // STAGE 3 - SubStep 5: Falácia do jogador
    if (stage === 3 && subStep === 5) {
      const feedbacks: { [key: string]: string } = {
        'A': 'Cuidado: o disco não tem memória. Resultados anteriores não criam uma "tendência". Cada giro recomeça do zero com as mesmas probabilidades.',
        'B': 'Essa é a chamada falácia do jogador: a crença de que resultados passados "compensam" no futuro. Mas o disco não sabe o que saiu antes — cada giro é independente.',
        'D': 'A Lei dos Grandes Números diz que as frequências se aproximam das probabilidades após muitos giros, mas isso não permite prever o resultado de um giro específico. Cada giro individual mantém a mesma probabilidade.'
      };

      if (selectedOption === 'C') {
        playSound("/sounds/correct.mp3");
        createAlert("Exatamente!", "Cada giro do disco é um experimento independente. O resultado anterior não influencia o próximo.", "success", 5000);

        setGameState(prev => ({ ...prev, subStep: 6 }));
        setSelectedOption('');
        const n6 = s3State.n;
        setCurrentQuestion({
          question: `O setor 1 e o setor ${n6} têm a mesma probabilidade de serem selecionados?`,
          options: [
            { value: 'A', label: 'Sim, pois todos os setores têm o mesmo tamanho angular.', isCorrect: true },
            { value: 'B', label: 'Não, pois o setor 1 é o primeiro e tem mais chance de ser selecionado.', isCorrect: false },
            { value: 'C', label: 'Não, pois depende da cor de cada setor.', isCorrect: false },
            { value: 'D', label: 'Sim, mas apenas se forem da mesma cor.', isCorrect: false }
          ],
          correctAnswer: 'A'
        });
        setInstructions(`<p class="ds-body"><strong>Numeração e Probabilidade</strong></p>
          <p class="ds-body">Analise se a numeração dos setores influencia as probabilidades.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto.", feedbacks[selectedOption] || 'Tente novamente.', "error", 6000);
      }
      return;
    }

    // STAGE 3 - SubStep 6: Ancoragem numérica
    if (stage === 3 && subStep === 6) {
      const feedbacks: { [key: string]: string } = {
        'B': 'A numeração dos setores é apenas uma identificação. O setor 1 não é "primeiro a ser sorteado" — todos os setores competem simultaneamente a cada giro.',
        'C': 'A cor é um atributo do setor, mas não altera o tamanho dele. Cada setor individual, independentemente da cor, tem probabilidade 1/n.',
        'D': 'A probabilidade de um setor individual depende apenas da geometria do disco (tamanho do setor), não da cor. Setores de cores diferentes mas de mesmo tamanho têm a mesma probabilidade.'
      };

      if (selectedOption === 'A') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "A numeração é apenas um rótulo — não altera chances. Todos os setores têm o mesmo tamanho angular.", "success", 5000);

        setGameState(prev => ({ ...prev, subStep: 7 }));
        setSelectedOption('');
        const n7 = s3State.n;
        setCurrentQuestion({
          question: `Se um novo disco tivesse ${n7} setores, cada um com uma cor diferente (sem repetição), o espaço das cores seria equiprovável?`,
          options: [
            { value: 'A', label: 'Sim, pois cada cor teria exatamente um setor.', isCorrect: true },
            { value: 'B', label: 'Não, pois cores são sempre não equiprováveis em discos.', isCorrect: false },
            { value: 'C', label: 'Depende de quais cores são utilizadas.', isCorrect: false },
            { value: 'D', label: 'Sim, mas apenas se os setores forem do mesmo tamanho.', isCorrect: false }
          ],
          correctAnswer: 'A'
        });
        setInstructions(`<p class="ds-body"><strong>Generalização</strong></p>
          <p class="ds-body">Pense em um disco hipotético com ${n7} setores e ${n7} cores distintas.</p>`);
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto.", feedbacks[selectedOption] || 'Tente novamente.', "error", 6000);
      }
      return;
    }

    // STAGE 3 - SubStep 7: Generalização
    if (stage === 3 && subStep === 7) {
      const feedbacks: { [key: string]: string } = {
        'B': 'Cuidado com a generalização. Neste disco as cores não são equiprováveis porque uma cor ocupa mais setores. Mas se cada cor tivesse exatamente um setor, todas teriam a mesma probabilidade.',
        'C': 'A identidade da cor (vermelho, azul, etc.) não afeta probabilidades. O que importa é quantos setores cada cor ocupa.',
        'D': 'A condição "setores do mesmo tamanho" já está dada no enunciado. O ponto essencial é que cada cor ocupa exatamente um setor — isso é o que garante a equiprobabilidade.'
      };

      if (selectedOption === 'A') {
        playSound("/sounds/correct.mp3");
        createAlert("Exatamente!", "Se cada cor ocupa exatamente um setor, o espaço das cores herda a equiprobabilidade do espaço dos setores.", "success", 5000);

        // Preparar autoconfrontação (subStep 8)
        const betColor = s3State.betColor;
        const mfc = s3State.mostFreqColor;
        const sfc = s3State.secondFreqColor;
        const pred = s3State.predictionColor;
        const isCorrectBet = betColor === mfc;
        const n8 = s3State.n;
        const betCount = s3State.colorCounts[betColor] || 0;
        const mfcCount = s3State.colorCounts[mfc] || 0;
        const sfcCount = s3State.colorCounts[sfc] || 0;

        // Texto sobre a previsão visual
        let predText = '';
        if (pred === 'iguais') {
          predText = `<p class="ds-body">Na sua previsão inicial, você indicou que todas as cores pareciam ocupar o mesmo espaço no disco.</p>`;
        } else if (pred === sfc) {
          predText = `<p class="ds-body">Na sua previsão inicial, você indicou que <strong>${pred}</strong> parecia ocupar mais espaço — essa cor tem ${sfcCount} setores agrupados, o que cria uma impressão visual de maior área. Porém, <strong>${mfc}</strong> possui ${mfcCount} setores (dispersos) e é, de fato, a cor mais provável.</p>`;
        } else if (pred === mfc) {
          predText = `<p class="ds-body">Na sua previsão inicial, você indicou que <strong>${pred}</strong> parecia ocupar mais espaço — e essa é, de fato, a cor com mais setores (${mfcCount}), embora estejam dispersos pelo disco.</p>`;
        } else {
          predText = `<p class="ds-body">Na sua previsão inicial, você indicou que <strong>${pred}</strong> parecia ocupar mais espaço. Essa cor tem ${s3State.colorCounts[pred] || 0} setor(es). A cor com mais setores é <strong>${mfc}</strong>, com ${mfcCount}.</p>`;
        }

        setGameState(prev => ({ ...prev, subStep: 8 }));
        setSelectedOption('');

        if (isCorrectBet) {
          // Cenário A — apostou na cor certa
          setCurrentQuestion({
            question: 'Mesmo tendo acertado, o que realmente garantiu que sua escolha era a melhor?',
            options: [
              { value: 'A', label: 'Minha intuição — eu "senti" que era a cor certa.', isCorrect: false },
              { value: 'B', label: 'O cálculo da probabilidade com base na contagem dos setores.', isCorrect: true },
              { value: 'C', label: 'A posição dos setores no disco.', isCorrect: false },
              { value: 'D', label: 'O fato de essa cor ser minha favorita.', isCorrect: false }
            ],
            correctAnswer: 'B'
          });
          setInstructions(`<p class="ds-body"><strong>Autoconfrontação</strong></p>
            ${predText}
            <p class="ds-body">Você apostou na cor <strong>${betColor}</strong>. Essa é, de fato, a cor com maior probabilidade: P(${betColor}) = ${mfcCount}/${n8}. Sua intuição estava alinhada com o cálculo!</p>`);
        } else {
          // Cenário B — apostou na cor errada
          setCurrentQuestion({
            question: 'O que pode ter influenciado sua escolha inicial?',
            options: [
              { value: 'A', label: 'A disposição visual dos setores — a cor que escolhi parecia ocupar mais espaço.', isCorrect: true },
              { value: 'B', label: 'Eu não contei os setores antes de decidir.', isCorrect: true },
              { value: 'C', label: 'A cor que escolhi é minha cor preferida.', isCorrect: false },
              { value: 'D', label: 'Minha escolha foi igualmente válida, pois todas as cores têm a mesma chance.', isCorrect: false }
            ],
            correctAnswer: 'A'
          });
          setInstructions(`<p class="ds-body"><strong>Autoconfrontação</strong></p>
            ${predText}
            <p class="ds-body">Você apostou na cor <strong>${betColor}</strong>, que tem probabilidade P(${betColor}) = ${betCount}/${n8}. Porém, a cor com maior probabilidade era <strong>${mfc}</strong>, com P(${mfc}) = ${mfcCount}/${n8}.</p>`);
        }
      } else {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto.", feedbacks[selectedOption] || 'Tente novamente.', "error", 6000);
      }
      return;
    }

    // STAGE 3 - SubStep 8: Autoconfrontação
    if (stage === 3 && subStep === 8) {
      const betColor = s3State.betColor;
      const mfc = s3State.mostFreqColor;
      const isCorrectBet = betColor === mfc;

      if (isCorrectBet) {
        // Cenário A
        if (selectedOption === 'B') {
          playSound("/sounds/correct.mp3");
          createAlert("Correto!", "Mesmo quando a intuição acerta, é o cálculo que confirma a decisão. Na Matemática, calcular é mais confiável do que estimar visualmente.", "success", 6000);
        } else {
          playSound("/sounds/incorrect.mp3");
          const fb: { [k: string]: string } = {
            'A': 'A intuição pode coincidir com o resultado correto, mas não é uma ferramenta confiável. O cálculo da probabilidade é o que fundamenta a decisão.',
            'C': 'A posição dos setores é um fator visual, não probabilístico. O que determina a melhor escolha é a contagem dos setores por cor.',
            'D': 'Preferência pessoal não tem relação com probabilidade. A melhor aposta é fundamentada no cálculo.'
          };
          createAlert("Reflita.", fb[selectedOption] || 'Tente novamente.', "error", 5000);
          return;
        }
      } else {
        // Cenário B — A, B são aceitáveis; C é neutra; D é erro
        if (selectedOption === 'D') {
          playSound("/sounds/incorrect.mp3");
          createAlert("Atenção!", "Você já calculou que as probabilidades são diferentes. As cores NÃO têm a mesma chance, pois ocupam quantidades diferentes de setores.", "error", 6000);
          return;
        } else {
          playSound("/sounds/correct.mp3");
          createAlert("Reflexão válida!", "Fatores visuais e pessoais podem nos afastar da escolha matematicamente mais vantajosa. Contar os setores e calcular a probabilidade antes de decidir é a estratégia mais confiável.", "success", 6000);
        }
      }

      // Avançar para fase interativa: Falácia do Jogador
      setS3State(prev => ({ ...prev, spinHistory: [], spinCount: 0, perceptionAnswer: '', newBetColor: '' }));
      setGameState(prev => ({ ...prev, subStep: 8.1 }));
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Observe os resultados do disco</strong></p>
        <p class="ds-body">Você havia escolhido a cor <strong>${s3State.betColor}</strong>.</p>
        <p class="ds-body">Agora você terá a oportunidade de mudar sua aposta, caso queira.</p>
        <p class="ds-body">Antes disso, observe alguns resultados do disco. Gire o disco <strong>5 vezes</strong> e observe o histórico.</p>`);
      return;
    }

    // STAGE 3 - SubStep 8.2: Percepção do padrão (registrar resposta, sem certo/errado)
    if (stage === 3 && subStep === 8.2) {
      if (!selectedOption) return;
      // Registrar percepção e avançar para re-aposta
      setS3State(prev => ({ ...prev, perceptionAnswer: selectedOption === 'A' ? 'sim' : selectedOption === 'B' ? 'nao' : 'naosei' }));
      playSound("/sounds/correct.mp3");
      createAlert("Resposta registrada!", "Sua percepção foi anotada. Agora você pode decidir se mantém ou muda sua aposta.", "info", 4000);
      setGameState(prev => ({ ...prev, subStep: 8.3 }));
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Faça sua aposta novamente</strong></p>
        <p class="ds-body">Com base nos resultados observados, você pode manter ou mudar sua aposta.</p>
        <p class="ds-body">Sua aposta anterior: <strong>${s3State.betColor}</strong></p>`);
      return;
    }

    // STAGE 3 - SubStep 8.4: Conflito cognitivo
    if (stage === 3 && subStep === 8.4) {
      if (!selectedOption) return;
      if (selectedOption === 'A') {
        // Respondeu "Sim" — feedback educativo
        playSound("/sounds/incorrect.mp3");
        createAlert("Atenção!", "Cada giro do disco é independente. Resultados anteriores não alteram a probabilidade do próximo resultado.", "error", 6000);
      } else {
        // Respondeu "Não" — correto
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Em experimentos aleatórios independentes, resultados anteriores não influenciam os próximos resultados.", "success", 5000);
      }
      // Ambas respostas avançam para institucionalização da falácia
      setGameState(prev => ({ ...prev, subStep: 8.5 }));
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Falácia do Jogador</strong></p>
        <p class="ds-body">Leia o conceito abaixo com atenção.</p>`);
      return;
    }

  }, [
    gameState, sliderValue, selectedOption, sampleSpaceInput, sampleSpaceCountInput,
    probabilityInputs, relativeFrequencyInputs, convergenceInputs, theoreticalQuestion1Input,
    theoreticalQuestion2Input, predictionInput, favorableCasesInput,
    exerciseNEInput, exerciseNSInput, exercisePENumeratorInput, exercisePEDenominatorInput,
    createSectors, createAlert, selectedCharacteristics,
    compPhase, compIsGuided, compCalcExampleNum, compChainInputs, compUserSelectAbar, compPaInput,
    freqAbsQuestion, freqAbsInput,
    freqRelQuestion, freqRelInput,
    lgnPhase, lgnN, lgnParams, lgnInput,
    s2RatioInputs, s2IxInputs, s2SumEquationInput, s2XInput,
    s2NumProbInputs, s2AngleProbInputs, s2PredictionInput,
    s2FreqAbsInputs, s2FreqRelInputs, s2ConclusionInput,
    s2RatioPhase, s2ConceptSelected,
    s2ReasoningColorY, s2ReasoningAngleY, s2ReasoningRatio, s2ReasoningInput, s2ReasoningErrors,
    s2IxPhase, s2IxSumSelected, s2IxCalcStep,
    trainingState, trainRatioInputs, trainIxInputs, trainSumInput, trainProbInputs,
    s2SpinReflection,
    fracTraining, fracThetaInputs,
    s3State
  ]);

  // Função para alternar seleção de setor no exercício dinâmico
  const toggleSectorSelection = useCallback((sectorIndex: number) => {
    setGameState(prev => {
      const isSelected = prev.selectedSectors.includes(sectorIndex);
      const newSelected = isSelected
        ? prev.selectedSectors.filter(i => i !== sectorIndex)
        : [...prev.selectedSectors, sectorIndex];
      return { ...prev, selectedSectors: newSelected };
    });
  }, []);

  // Função para alternar seleção de característica do experimento aleatório
  const toggleCharacteristic = useCallback((characteristicIndex: number) => {
    setSelectedCharacteristics(prev => {
      const isSelected = prev.includes(characteristicIndex);
      return isSelected
        ? prev.filter(i => i !== characteristicIndex)
        : [...prev, characteristicIndex];
    });
  }, []);

  // Função para fazer aposta na fase de experimentação (clique no disco)
  const handleExperimentationBet = useCallback((clickedColor: string) => {
    const { subStep, isSpinning } = gameState;

    // Trava síncrona: depois que o aluno clicou em "Sortear", nenhum clique
    // no disco pode mais alterar a aposta — vale mesmo durante a janela de
    // 300ms entre o fim visual do giro e a transição de estado para 1.17.
    if (experimentBetLockedRef.current) return;

    // Só permite aposta no subStep 1.1 (fase de aposta) e quando o disco
    // NÃO está girando — após o aluno mandar sortear, a aposta fica travada.
    if (subStep !== 1.1 || isSpinning) return;

    playSound("/sounds/click.mp3");
    logBet(gameState.stage, gameState.subStep, clickedColor);

    setExperimentationState(prev => ({
      ...prev,
      wageredColor: clickedColor
    }));

    setDisabledSpinButton(false); // Habilitar botão Sortear após aposta

    const attempt = experimentationState.currentAttempt;
    setInstructions(`<p class="ds-body"><strong>Experimentação — Tentativa ${attempt} de 3</strong></p>
      <p class="ds-body"><strong>Cor apostada: ${clickedColor}</strong></p>
      <p class="ds-body">Agora clique em <strong>Sortear</strong> para girar o disco.</p>`);
  }, [gameState, experimentationState.currentAttempt]);

  // Função para confirmar o resultado na fase de experimentação (clique na cor onde parou)
  const handleResultConfirmation = useCallback((clickedColor: string) => {
    goToTopOfChallenge();
    const { subStep } = gameState;

    // Só permite confirmação no subStep 1.17 (aguardando confirmação)
    if (subStep !== 1.17 || !experimentationState.waitingForConfirmation) return;
    // Bloqueia cliques múltiplos durante a janela de 1.5s do setTimeout abaixo.
    if (resultConfirmationLockedRef.current) return;

    const correctColor = experimentationState.internalDrawnColor;

    if (clickedColor === correctColor) {
      resultConfirmationLockedRef.current = true;
      // Acertou a confirmação - revelar a cor sorteada
      playSound("/sounds/correct.mp3");
      createAlert("✅ Cor confirmada!", "", "success", 2000);

      // Revelar a cor sorteada no indicador
      setExperimentationState(prev => ({
        ...prev,
        colorRevealed: true
      }));

      const newDraws = [...experimentationState.draws, correctColor!];
      const newWagers = [...experimentationState.wagers, experimentationState.wageredColor!];
      const wonBet = experimentationState.wageredColor === correctColor;
      const currentAttempt = experimentationState.currentAttempt;

      // Aguardar 1.5s para o usuário ver a cor revelada antes de prosseguir
      setTimeout(() => {
        // Libera o lock de confirmação para a próxima rodada (ou fim).
        resultConfirmationLockedRef.current = false;
        if (currentAttempt < 3) {
          // Ainda há mais tentativas — libera o lock para o aluno
          // poder apostar de novo na próxima rodada.
          experimentBetLockedRef.current = false;
          setExperimentationState(prev => ({
            ...prev,
            draws: newDraws,
            wagers: newWagers,
            currentAttempt: prev.currentAttempt + 1,
            waitingForConfirmation: false,
            internalDrawnColor: null,
            wageredColor: null,
            colorRevealed: false
          }));

          setGameState(prev => ({ ...prev, subStep: 1.1 }));
          setDisabledSpinButton(true);

          const nextAttempt = currentAttempt + 1;
          setInstructions(`<p class="ds-body"><strong>Experimentação — Tentativa ${nextAttempt} de 3</strong></p>
            <p class="ds-body"><strong>Resultado da tentativa ${currentAttempt}:</strong></p>
            <p class="ds-small">Cor sorteada: ${correctColor} | Sua aposta: ${experimentationState.wageredColor} | Acertou? ${wonBet ? 'Sim' : 'Não'}</p>
            <p class="ds-body mt-micro">Repita o experimento aleatório: clique em uma cor do disco para fazer sua aposta.</p>`);
        } else {
          // Completou as 3 tentativas
          setExperimentationState(prev => ({
            ...prev,
            draws: newDraws,
            wagers: newWagers,
            waitingForConfirmation: false,
            colorRevealed: false,
            wageredColor: null,
            internalDrawnColor: null
          }));

          // Mostrar resumo e ir para a questão das características
          setSelectedCharacteristics([]);
          setGameState(prev => ({ ...prev, subStep: 1.25 }));
          setDisabledSpinButton(true);

          setInstructions(`<p class="ds-body"><strong>Experimentação Concluída!</strong></p>
            <p class="ds-body"><strong>Resumo das 3 tentativas:</strong></p>
            <table class="border-collapse mt-micro ds-small">
              <thead>
                <tr class="bg-brand-otimath-pure text-neutral-white">
                  <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Tentativa</th>
                  <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Apostou</th>
                  <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Sorteada</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>1ª</strong></td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newWagers[0]}</td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newDraws[0]}</td>
                </tr>
                <tr class="bg-neutral-lightest">
                  <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>2ª</strong></td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newWagers[1]}</td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newDraws[1]}</td>
                </tr>
                <tr>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>3ª</strong></td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newWagers[2]}</td>
                  <td class="py-quarck px-micro border border-neutral-lighter text-center">${newDraws[2]}</td>
                </tr>
              </tbody>
            </table>`);

          playSound("/sounds/challengeFinished.mp3");
          createAlert("Experimentação concluída!", "Agora responda à questão sobre as características do experimento aleatório.", "success", 4000);
        }
      }, 1500); // 1.5 segundos para ver a cor revelada
    } else {
      // Errou a confirmação
      playSound("/sounds/incorrect.mp3");
      createAlert("❌ Essa não é a cor em que o ponteiro parou.", "Observe o ponteiro e clique novamente na cor correta.", "error", 4000);
    }
  }, [gameState, experimentationState, createAlert]);

  // Função para girar o disco na fase de experimentação
  const spinRouletteExperimentation = useCallback(() => {
    const { subStep, sectors, isSpinning } = gameState;

    // Só permite giro no subStep 1.1 com aposta feita
    if (subStep !== 1.1 || isSpinning || !experimentationState.wageredColor) return;

    // Trava a aposta SINCRONAMENTE — qualquer clique no disco a partir daqui
    // (incluindo durante o giro e na janela curta antes da transição para
    // o subStep 1.17) será rejeitado por handleExperimentationBet.
    experimentBetLockedRef.current = true;

    // Sortear um ÍNDICE de setor aleatório (não apenas a cor, para evitar bug com cores repetidas)
    const sectorIndex = Math.floor(Math.random() * sectors.length);
    const drawnColor = sectors[sectorIndex].colorName;

    // Calcular ângulo para o setor sorteado (usando o índice direto)
    const anglePerSector = 360 / sectors.length;
    // Margem de segurança: 25% de cada lado do setor (para nunca ficar na borda)
    const margin = anglePerSector * 0.25;
    // Posição aleatória dentro da zona segura do setor (entre 25% e 75% do setor)
    const randomOffset = margin + Math.random() * (anglePerSector - 2 * margin);
    const targetSectorAngle = sectorIndex * anglePerSector + randomOffset;

    // Calcular a rotação final desejada (mod 360) que coloca o setor no topo
    const desiredFinalRotation = (360 - targetSectorAngle + 360) % 360;

    // Calcular quanto precisamos girar a partir da posição atual
    const currentMod360 = (gameState.currentRotation || 0) % 360;
    let deltaToTarget = (desiredFinalRotation - currentMod360 + 360) % 360;
    if (deltaToTarget < 30) deltaToTarget += 360; // Garantir rotação mínima visível

    const extraRotations = 2; // Duas voltas completas antes de parar
    const newTargetAngle = (gameState.currentRotation || 0) + deltaToTarget + extraRotations * 360;

    const spinDuration = 2000; // 2 segundos para dar duas voltas visíveis

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      targetAngle: newTargetAngle,
      spinDuration: spinDuration
    }));

    setExperimentationState(prev => ({
      ...prev,
      internalDrawnColor: drawnColor
    }));

    setDisabledSpinButton(true);

    const attempt = experimentationState.currentAttempt;
    setInstructions(`<p class="ds-body"><strong>Experimentação — Tentativa ${attempt} de 3</strong></p>
      <p class="ds-body">Girando o disco...</p>`);

    // Tocar som repetidamente durante o giro (usando nextChallenge.mp3 como som de giro)
    playSound("/sounds/nextChallenge.mp3");
    const soundInterval = setInterval(() => {
      playSound("/sounds/nextChallenge.mp3");
    }, 400); // Tocar a cada 400ms

    // Após o giro completo, parar o som e entrar no modo de confirmação
    setTimeout(() => {
      clearInterval(soundInterval); // Parar o som

      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        currentRotation: newTargetAngle,
        selectedColor: drawnColor,
        subStep: 1.17 // Ir para modo de confirmação
      }));

      setExperimentationState(prev => ({
        ...prev,
        waitingForConfirmation: true
      }));

      setInstructions(`<p class="ds-body"><strong>Experimentação — Tentativa ${attempt} de 3</strong></p>
        <p class="ds-body">O disco parou. Agora clique no disco exatamente na cor em que o ponteiro parou para confirmar o resultado.</p>`);
    }, spinDuration + 300); // Tempo do giro + pausa de 300ms
  }, [gameState, experimentationState]);

  // ========== ETAPA 2 — HANDLERS INVESTIGAÇÃO INICIAL ==========

  // Handler: aposta por clique no setor (Etapa 2, subStep 0.15)
  const handleS2Bet = useCallback((clickedColor: string) => {
    if (gameState.stage !== 2 || gameState.subStep !== 0.15) return;

    playSound("/sounds/click.mp3");
    logBet(gameState.stage, gameState.subStep, clickedColor);

    setExperimentationState(prev => ({
      ...prev,
      wageredColor: clickedColor
    }));

    setDisabledSpinButton(false);

    setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
      <p class="ds-body"><strong>Aposta registrada: ${clickedColor}</strong></p>
      <p class="ds-body">Agora clique em <strong>Sortear</strong> para girar o disco.</p>`);
  }, [gameState.stage, gameState.subStep]);

  // Handler: giro do disco na investigação (Etapa 2, subStep 0.15)
  const spinRouletteS2 = useCallback(() => {
    const { stage, subStep, sectors, isSpinning } = gameState;
    if (stage !== 2 || subStep !== 0.15 || isSpinning || !experimentationState.wageredColor) return;

    // Sortear setor ponderado pelo ângulo (acumular ângulos desiguais)
    const rand = Math.random() * 360;
    let cumAngle = 0;
    let sectorIndex = 0;
    for (let i = 0; i < sectors.length; i++) {
      cumAngle += sectors[i].angle;
      if (rand < cumAngle) {
        sectorIndex = i;
        break;
      }
    }
    const drawnColor = sectors[sectorIndex].colorName;

    // Calcular ângulo de aterrissagem (considerar setores de tamanhos diferentes)
    let startAngle = 0;
    for (let i = 0; i < sectorIndex; i++) {
      startAngle += sectors[i].angle;
    }
    const margin = sectors[sectorIndex].angle * 0.25;
    const randomOffset = margin + Math.random() * (sectors[sectorIndex].angle - 2 * margin);
    const targetSectorAngle = startAngle + randomOffset;

    const desiredFinalRotation = (360 - targetSectorAngle + 360) % 360;
    const currentMod360 = (gameState.currentRotation || 0) % 360;
    let deltaToTarget = (desiredFinalRotation - currentMod360 + 360) % 360;
    if (deltaToTarget < 30) deltaToTarget += 360;

    const extraRotations = 2;
    const newTargetAngle = (gameState.currentRotation || 0) + deltaToTarget + extraRotations * 360;
    const spinDuration = 2000;

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      targetAngle: newTargetAngle,
      spinDuration: spinDuration
    }));

    setExperimentationState(prev => ({
      ...prev,
      internalDrawnColor: drawnColor
    }));

    setDisabledSpinButton(true);

    setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
      <p class="ds-body">Girando o disco...</p>`);

    playSound("/sounds/nextChallenge.mp3");
    const soundInterval = setInterval(() => {
      playSound("/sounds/nextChallenge.mp3");
    }, 400);

    setTimeout(() => {
      clearInterval(soundInterval);

      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        currentRotation: newTargetAngle,
        selectedColor: drawnColor,
        subStep: 0.16
      }));

      setExperimentationState(prev => ({
        ...prev,
        waitingForConfirmation: true
      }));

      setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
        <p class="ds-body">O disco parou. Clique na cor em que o ponteiro parou.</p>`);
    }, spinDuration + 300);
  }, [gameState, experimentationState]);

  // Handler: girar roleta na fase Falácia do Jogador (Etapa 3, subStep 8.1)
  const spinRouletteS3 = useCallback(() => {
    const { stage, subStep, sectors, isSpinning } = gameState;
    if (stage !== 3 || subStep !== 8.1 || isSpinning || s3State.spinCount >= 5) return;

    // Sortear setor ponderado pelo ângulo
    const rand = Math.random() * 360;
    let cumAngle = 0;
    let sectorIndex = 0;
    for (let i = 0; i < sectors.length; i++) {
      cumAngle += sectors[i].angle;
      if (rand < cumAngle) {
        sectorIndex = i;
        break;
      }
    }
    const drawnColor = sectors[sectorIndex].colorName;

    // Calcular ângulo de aterrissagem (zona segura 25-75% do setor)
    let startAngle = 0;
    for (let i = 0; i < sectorIndex; i++) {
      startAngle += sectors[i].angle;
    }
    const margin = sectors[sectorIndex].angle * 0.25;
    const randomOffset = margin + Math.random() * (sectors[sectorIndex].angle - 2 * margin);
    const targetSectorAngle = startAngle + randomOffset;

    const desiredFinalRotation = (360 - targetSectorAngle + 360) % 360;
    const currentMod360 = (gameState.currentRotation || 0) % 360;
    let deltaToTarget = (desiredFinalRotation - currentMod360 + 360) % 360;
    if (deltaToTarget < 30) deltaToTarget += 360;

    const extraRotations = 2;
    const newTargetAngle = (gameState.currentRotation || 0) + deltaToTarget + extraRotations * 360;
    const spinDuration = 2000;

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      targetAngle: newTargetAngle,
      spinDuration: spinDuration
    }));

    playSound("/sounds/nextChallenge.mp3");
    const soundInterval = setInterval(() => {
      playSound("/sounds/nextChallenge.mp3");
    }, 400);

    const newCount = s3State.spinCount + 1;

    setTimeout(() => {
      clearInterval(soundInterval);

      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        currentRotation: newTargetAngle
      }));

      setS3State(prev => ({
        ...prev,
        spinHistory: [...prev.spinHistory, drawnColor],
        spinCount: prev.spinCount + 1
      }));

      if (newCount < 5) {
        setInstructions(`<p class="ds-body"><strong>Observe os resultados do disco</strong></p>
          <p class="ds-body">Giro ${newCount} de 5 realizado. Continue girando.</p>`);
      } else {
        setInstructions(`<p class="ds-body"><strong>Observe os resultados do disco</strong></p>
          <p class="ds-body">Todos os 5 giros foram realizados. Observe o histórico e clique em Continuar.</p>`);
      }
    }, spinDuration + 300);
  }, [gameState, s3State.spinCount]);

  // Handler: continuar da fase 8.1 para 8.2 (percepção do padrão)
  const handleS3FallacyContinue = useCallback(() => {
    if (s3State.spinCount < 5) return;
    setGameState(prev => ({ ...prev, subStep: 8.2 }));
    setSelectedOption('');
    setCurrentQuestion({
      question: 'Observe os resultados obtidos. Você acha que uma cor que apareceu muitas vezes tem menos chance de sair agora?',
      options: [
        { value: 'A', label: 'Sim', isCorrect: false },
        { value: 'B', label: 'Não', isCorrect: true },
        { value: 'C', label: 'Não sei', isCorrect: false }
      ],
      correctAnswer: 'B'
    });
    setInstructions(`<p class="ds-body"><strong>Percepção do padrão</strong></p>
      <p class="ds-body">Reflita sobre os resultados observados.</p>`);
  }, [s3State.spinCount]);

  // Handler: confirmar nova aposta na fase 8.3
  const handleS3NewBetConfirm = useCallback(() => {
    if (!s3State.newBetColor) return;
    const n = s3State.n;
    setGameState(prev => ({ ...prev, subStep: 8.4 }));
    setSelectedOption('');
    setCurrentQuestion({
      question: 'O resultado do próximo giro depende dos resultados anteriores?',
      options: [
        { value: 'A', label: 'Sim', isCorrect: false },
        { value: 'B', label: 'Não', isCorrect: true }
      ],
      correctAnswer: 'B'
    });
    setInstructions(`<p class="ds-body"><strong>Conflito Cognitivo</strong></p>
      <p class="ds-body">O disco é justo. Todos os ${n} setores possuem o mesmo tamanho. P(setor) = 1/${n}.</p>
      <p class="ds-body">Cada giro é um evento independente.</p>`);
  }, [s3State.newBetColor, s3State.n]);

  // Handler: avançar da institucionalização da falácia (8.5) para o resumo (9)
  const handleS3FallacyFinish = useCallback(() => {
    setGameState(prev => ({ ...prev, subStep: 9 }));
    setInstructions(`<p class="ds-body"><strong>Institucionalização Final</strong></p>
      <p class="ds-body">Leia o resumo dos conceitos explorados nesta etapa.</p>`);
  }, []);

  // Handler: confirmação do resultado por clique no setor (Etapa 2, subStep 0.16)
  const handleS2Confirmation = useCallback((clickedColor: string) => {
    const isInvestigation = gameState.stage === 2 && gameState.subStep === 0.16 && experimentationState.waitingForConfirmation;
    const isReflectionRetry = gameState.stage === 2 && gameState.subStep === 0.195 && experimentationState.waitingForConfirmation;

    if (!isInvestigation && !isReflectionRetry) return;

    const correctColor = experimentationState.internalDrawnColor;

    if (clickedColor === correctColor) {
      playSound("/sounds/correct.mp3");
      createAlert("Correto!", "Esse foi o resultado do sorteio.", "success", 2000);

      setExperimentationState(prev => ({
        ...prev,
        colorRevealed: true
      }));

      if (isInvestigation) {
        // Primeiro giro: Após 1.5s → exibir quadro comparação
        setTimeout(() => {
          const wagered = experimentationState.wageredColor || '';
          const won = wagered === correctColor;

          setGameState(prev => ({ ...prev, subStep: 0.17 }));

          setInstructions(`<p class="ds-body"><strong>Resultado da Aposta</strong></p>
            <p class="ds-body"><strong>Aposta:</strong> ${wagered} | <strong>Resultado:</strong> ${correctColor}</p>
            <p class="ds-body">${won ? 'Você ganhou a aposta!' : 'Você não ganhou desta vez.'}</p>
            <p class="ds-body">Clique em <strong>Continuar</strong> para prosseguir.</p>`);
        }, 1500);
      } else {
        // Retry após erro na reflexão: regenerar alternativas e voltar à pergunta
        setTimeout(() => {
          const retryMaxAngle = Math.max(...gameState.s2Angles);
          const retryMaxIdx = gameState.s2Angles.indexOf(retryMaxAngle);
          const retryMaxColor = gameState.sectors[retryMaxIdx]?.colorName || '';

          const shuffledF = [...S2_DISTRACTORS_F].sort(() => Math.random() - 0.5);
          const selected4F = shuffledF.slice(0, 4);
          const selectedV = S2_TRUE_OPTIONS_V[Math.floor(Math.random() * S2_TRUE_OPTIONS_V.length)];

          const allOptions = [
            ...selected4F.map((f, i) => ({ value: `f_${i}`, label: f, isCorrect: false })),
            { value: 'v_correct', label: selectedV, isCorrect: true }
          ].sort(() => Math.random() - 0.5);

          setCurrentQuestion({
            question: `Por que a cor ${retryMaxColor} tem maior chance de ser sorteada?`,
            options: allOptions,
            correctAnswer: 'v_correct'
          });
          setSelectedOption('');
          setGameState(prev => ({ ...prev, subStep: 0.19 }));
          setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
            <p class="ds-body">Responda a pergunta abaixo.</p>`);
        }, 1500);
      }
    } else {
      playSound("/sounds/incorrect.mp3");
      createAlert("Observe novamente onde o ponteiro parou.", "", "error", 4000);
    }
  }, [gameState, experimentationState, createAlert]);

  // Handler: seleção na paleta de cores (Etapa 2, subStep 0.185)
  const handleColorPaletteSelect = useCallback((paletteColor: string) => {
    if (gameState.stage !== 2 || gameState.subStep !== 0.185 || showInfoBox) return;

    const maxAngle = Math.max(...gameState.s2Angles);
    const maxIdx = gameState.s2Angles.indexOf(maxAngle);
    const maxColor = gameState.sectors[maxIdx]?.colorName || '';

    if (paletteColor === maxColor) {
      playSound("/sounds/correct.mp3");
      createAlert("Isso mesmo!", "A maior probabilidade está associada ao maior setor, mesmo que ele não tenha sido o resultado.", "success", 5000);

      // Gerar alternativas e avançar para reflexão conceitual
      setTimeout(() => {
        const shuffledF = [...S2_DISTRACTORS_F].sort(() => Math.random() - 0.5);
        const selected4F = shuffledF.slice(0, 4);
        const selectedV = S2_TRUE_OPTIONS_V[Math.floor(Math.random() * S2_TRUE_OPTIONS_V.length)];

        const allOptions = [
          ...selected4F.map((f, i) => ({ value: `f_${i}`, label: f, isCorrect: false })),
          { value: 'v_correct', label: selectedV, isCorrect: true }
        ].sort(() => Math.random() - 0.5);

        setCurrentQuestion({
          question: `Por que a cor ${maxColor} tem maior chance de ser sorteada?`,
          options: allOptions,
          correctAnswer: 'v_correct'
        });
        setSelectedOption('');
        setGameState(prev => ({ ...prev, subStep: 0.19 }));
        setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
          <p class="ds-body">Responda a pergunta abaixo.</p>`);
      }, 1500);
    } else {
      playSound("/sounds/incorrect.mp3");
      createAlert("Observe novamente", "Compare os tamanhos dos setores.", "error", 3000);
    }
  }, [gameState, showInfoBox, createAlert]);

  // ========== HANDLER: Clique no setor para identificar o menor (subStep 3, STATE 0) ==========
  const handleRatioSectorClick = useCallback((index: number) => {
    if (gameState.stage !== 2 || gameState.subStep !== 3 || s2RatioPhase !== 'init') return;

    const minAngle = gameState.s2M;
    const clickedAngle = gameState.s2Angles[index];

    if (clickedAngle === minAngle) {
      // Correto → STATE 1: unit_selected
      playSound("/sounds/correct.mp3");
      createAlert("Correto!", `O setor de ${minAngle}° é o menor ângulo.`, "success", 3000);
      setS2UnitSectorIndex(index);

      // Gerar questão conceitual
      const conceptQ = generateS2ConceptOptions();
      setS2ConceptQuestion(conceptQ);
      setS2ConceptSelected('');
      setS2RatioPhase('unit_selected');
      setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
        <p class="ds-body">Unidade = ${minAngle}°</p>`);
    } else {
      // Errado → permanece em STATE 0 com feedback
      playSound("/sounds/incorrect.mp3");
      createAlert("Observe qual setor tem o menor ângulo.", "", "error", 3000);
    }
  }, [gameState, s2RatioPhase, createAlert]);

  // Handler: avançar da tabela de razões para subStep 4 (i·x)
  const handleRatioTableContinue = useCallback(() => {
    if (gameState.stage !== 2 || gameState.subStep !== 3 || !s2TableAllCorrect) return;

    const colors = gameState.sectors.map(s => s.colorName);
    const ixInputs: { [color: string]: TextInputInterface } = {};
    colors.forEach((c, i) => {
      ixInputs[c] = {
        value: '',
        disabled: i !== 0,
        error: false,
        setValue: (val: string) => {
          setS2IxInputs(prev => ({
            ...prev,
            [c]: { ...prev[c], value: val }
          }));
        }
      };
    });
    setS2IxInputs(ixInputs);
    setS2IxPhase('sum_question');
    setS2IxSumSelected('');
    setS2IxCalcStep(0);
    setS2SumEquationInput(prev => ({ ...prev, value: '', disabled: true, error: false }));
    setGameState(prev => ({ ...prev, subStep: 4, s2TableIndex: 0 }));

    setInstructions(`<p class="ds-body"><strong>Distribuindo a probabilidade entre todos os setores</strong></p>
      <p class="ds-body">Cada setor recebe uma quantidade proporcional à sua área. Antes de preencher a tabela, responda à pergunta abaixo.</p>`);
  }, [gameState, s2TableAllCorrect]);

  // Handler: avançar passo no cálculo guiado (subStep 4, guided_calc)
  const handleIxCalcNext = useCallback(() => {
    if (gameState.stage !== 2 || gameState.subStep !== 4 || s2IxPhase !== 'guided_calc') return;

    const S = gameState.s2SumI;

    if (s2IxCalcStep < 2) {
      const next = s2IxCalcStep + 1;
      setS2IxCalcStep(next);
      if (next === 2) {
        playSound("/sounds/correct.mp3");
      }
    } else {
      // Passo 2 (p = 1/S) → avançar para subStep 6 (tela separada de probabilidades numéricas)
      const colors = gameState.sectors.map(s => s.colorName);
      const numInputs: { [color: string]: TextInputInterface } = {};
      colors.forEach((c, i) => {
        numInputs[c] = {
          value: '',
          disabled: i !== 0,
          error: false,
          setValue: (val: string) => {
            setS2NumProbInputs(prev => ({
              ...prev,
              [c]: { ...prev[c], value: val }
            }));
          }
        };
      });
      setS2NumProbInputs(numInputs);
      setGameState(prev => ({ ...prev, subStep: 6, s2TableIndex: 0 }));
      setInstructions(`<p class="ds-body"><strong>Probabilidades Numéricas</strong></p>
        <p class="ds-body">Agora substitua p = 1/${S} e calcule a probabilidade numérica de cada setor.</p>
        <p class="ds-body">Digite na forma de fração (ex: a/b).</p>`);
    }
  }, [gameState, s2IxPhase, s2IxCalcStep]);

  // ========== HANDLERS FASE DE TREINOS (Treino 1-4) ==========

  // Handler: clique no setor durante treino (identify_sector)
  const handleTrainingSectorClick = useCallback((index: number) => {
    if (!trainingState.active || trainingState.phase !== 'identify_sector') return;

    const clickedAngle = trainingState.angles[index];
    if (clickedAngle === trainingState.m) {
      playSound("/sounds/correct.mp3");
      createAlert("Correto!", `O setor de ${trainingState.m}° é o menor ângulo.`, "success", 3000);

      // Inicializar inputs de razão
      const inputs: { [color: string]: TextInputInterface } = {};
      trainingState.sectors.forEach((s, i) => {
        inputs[s.colorName] = {
          value: '',
          disabled: i !== 0,
          error: false,
          setValue: (val: string) => setTrainRatioInputs(prev => ({
            ...prev,
            [s.colorName]: { ...prev[s.colorName], value: val }
          }))
        };
      });
      setTrainRatioInputs(inputs);

      setTrainingState(prev => ({ ...prev, phase: 'fill_ratios', tableIndex: 0 }));
      setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining}</strong></p>
        <p class="ds-body">Divida todos os ângulos pelo menor (${trainingState.m}°) e preencha a tabela.</p>`);
    } else {
      playSound("/sounds/incorrect.mp3");
      createAlert("Tente novamente.", "Observe qual setor tem o menor ângulo central.", "error", 3000);
    }
  }, [trainingState]);

  // Handler: avançar passo do cálculo guiado do treino
  const handleTrainingCalcNext = useCallback(() => {
    if (!trainingState.active || trainingState.phase !== 'guided_calc') return;

    if (trainingState.calcStep < 2) {
      const next = trainingState.calcStep + 1;
      setTrainingState(prev => ({ ...prev, calcStep: next }));
      if (next === 2) playSound("/sounds/correct.mp3");
    } else {
      // Passo 2 → iniciar preenchimento P(cor) numérico
      const colors = trainingState.sectors.map(s => s.colorName);
      const probInputs: { [color: string]: TextInputInterface } = {};
      colors.forEach((c, i) => {
        probInputs[c] = {
          value: '',
          disabled: i !== 0,
          error: false,
          setValue: (val: string) => setTrainProbInputs(prev => ({
            ...prev,
            [c]: { ...prev[c], value: val }
          }))
        };
      });
      setTrainProbInputs(probInputs);
      setTrainingState(prev => ({ ...prev, phase: 'fill_prob', tableIndex: 0 }));
      setInstructions(`<p class="ds-body"><strong>Treino ${trainingState.currentTraining} — Probabilidades Numéricas</strong></p>
        <p class="ds-body">Agora substitua p = 1/${trainingState.S} e calcule a probabilidade numérica de cada setor.</p>
        <p class="ds-body">Digite na forma de fração (ex: a/b).</p>`);
    }
  }, [trainingState]);

  // Handler: "Próximo" — sair do treino e ir para subStep 7
  const handleTrainingNext = useCallback(() => {
    if (!trainingState.active || trainingState.phase !== 'completed') return;

    // Restaurar roleta original e ir para fase de 2 giros reflexivos
    setGameState(prev => ({
      ...prev,
      subStep: 6.201,
      sectors: trainingState.originalSectors,
      s2K: trainingState.originalK,
      s2M: trainingState.originalM,
      s2Ki: trainingState.originalKi,
      s2Angles: trainingState.originalAngles,
      s2SumI: trainingState.originalSumI,
      s2TableIndex: 0,
      isSpinning: false,
      pendingRegistration: false,
      selectedColor: null,
    }));

    setTrainingState(prev => ({ ...prev, active: false, phase: 'idle' }));
    setS2SpinReflection({ spin1Color: '', spin2Color: '', bet1Color: '', bet2Color: '', answer1: '', answer2: '', selectedOption: '', phase: 'betting', betConstraint: 'none' });
    setDisabledSpinButton(false);

    setInstructions(`<p class="ds-body"><strong>Antes de calcular as probabilidades…</strong></p>
      <p class="ds-body">Vamos girar o disco e refletir sobre os resultados. Clique no setor da cor em que deseja apostar.</p>`);
  }, [trainingState]);

  // Handler: "Continuar Treino" — próximo treino com novo disco
  const handleTrainingContinue = useCallback(() => {
    if (!trainingState.active || trainingState.phase !== 'completed') return;

    const nextTraining = trainingState.currentTraining + 1;
    if (nextTraining > 4) return;

    // Sortear novo k não usado
    const availableKs = [2, 3, 4, 5, 6].filter(k => !trainingState.usedKValues.includes(k));
    let trainK: number;
    if (availableKs.length > 0) {
      trainK = availableKs[Math.floor(Math.random() * availableKs.length)];
    } else {
      const fallback = [2, 3, 4, 5, 6].filter(k => k !== trainingState.originalK);
      trainK = fallback[Math.floor(Math.random() * fallback.length)];
    }

    const result = generateNonEquiprobableAngles(trainK);
    const shuffledColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, trainK);
    const newSectors: RouletteSector[] = selectedColors.map((color, index) => ({
      color: color,
      colorName: color,
      angle: result.angles[index]
    }));

    const trainSubSteps: { [n: number]: number } = { 2: 6.102, 3: 6.103, 4: 6.104 };

    setGameState(prev => ({
      ...prev,
      subStep: trainSubSteps[nextTraining],
      sectors: newSectors,
      showAngles: true,
      s2K: trainK,
      s2M: result.m,
      s2Ki: result.ki,
      s2Angles: result.angles,
      s2SumI: result.S,
      s2TableIndex: 0,
    }));

    setTrainingState(prev => ({
      ...prev,
      currentTraining: nextTraining,
      phase: 'identify_sector',
      k: trainK, m: result.m, ki: result.ki, angles: result.angles, S: result.S,
      sectors: newSectors,
      usedKValues: [...prev.usedKValues, trainK],
      tableIndex: 0,
      calcStep: 0,
    }));

    setTrainRatioInputs({});
    setTrainIxInputs({});
    setTrainSumInput({ value: '', disabled: true, error: false, setValue: (val: string) => setTrainSumInput(prev => ({ ...prev, value: val })) });
    setTrainProbInputs({});

    setInstructions(`<p class="ds-body"><strong>Treino ${nextTraining}</strong></p>
      <p class="ds-body">Girando-se o disco abaixo ao acaso, determine a probabilidade de o ponteiro indicar cada uma das cores do disco.</p>
      <p class="ds-body">Clique no setor com o <strong>menor ângulo central</strong>.</p>`);
  }, [trainingState]);

  // Handler: próximo exercício de fração θ/360
  const handleFracTrainingNext = useCallback(() => {
    if (fracTraining.currentTraining >= 5) return;

    const next = fracTraining.currentTraining + 1;
    const availableKs = [2, 3, 4, 5, 6].filter(k => !fracTraining.usedKValues.includes(k));
    let trainK: number;
    if (availableKs.length > 0) {
      trainK = availableKs[Math.floor(Math.random() * availableKs.length)];
    } else {
      trainK = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
    }
    const result = generateNonEquiprobableAngles(trainK);
    const shuffledColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
    const trainColors = shuffledColors.slice(0, trainK);

    // Atualizar setores do disco visual
    const trainSectors: RouletteSector[] = trainColors.map((c, i) => ({
      color: c, colorName: c, angle: result.angles[i], number: i + 1
    }));

    setFracThetaInputs(Object.fromEntries(trainColors.map(c => [c, { value: '', error: false, status: 'pending' as const, errorMsg: '' }])));

    setFracTraining(prev => ({
      ...prev,
      currentTraining: next,
      k: trainK, angles: result.angles, colors: trainColors,
      allCorrect: false, usedKValues: [...prev.usedKValues, trainK]
    }));

    setGameState(prev => ({
      ...prev,
      sectors: trainSectors,
      currentRotation: 0
    }));

    setInstructions(`<p class="ds-body"><strong>Frequência Relativa e Probabilidade</strong></p>
      <p class="ds-body">Treino ${next} de 5 — Determine a fração θ/360 de cada cor observando o disco.</p>`);
  }, [fracTraining]);

  // Handler: mudar de fase (sair dos treinos de fração → simulação de convergência)
  const handleFracTrainingChangePhase = useCallback(() => {
    const restoredSectors = fracTraining.originalSectors;
    const colors = restoredSectors.map(s => s.colorName);

    setConvergenceSim({ currentBlock: 0, running: false, progress: 0 });

    setGameState(prev => ({
      ...prev,
      subStep: 8.7,
      sectors: restoredSectors,
      currentRotation: 0,
      isAutoSpinning: false,
      frequencies: Object.fromEntries(colors.map(c => [c, 0])),
      totalSpins: 0
    }));

    setInstructions(`<p class="ds-body"><strong>Simulação e Convergência</strong></p>
      <p class="ds-body">Observe a convergência das frequências relativas para as probabilidades teóricas.</p>`);
  }, [fracTraining.originalSectors]);

  // Simulação de convergência — blocos sequenciais controlados pelo aluno
  const handleConvergenceBlock = useCallback(() => {
    const blockIdx = convergenceSim.currentBlock;
    if (blockIdx >= CONVERGENCE_BLOCKS.length || convergenceSim.running) return;

    const blockSize = CONVERGENCE_BLOCKS[blockIdx];
    const sectors = gameState.sectors;

    setConvergenceSim(prev => ({ ...prev, running: true, progress: 0 }));

    if (blockIdx === 0) {
      // ─── BLOCO 1: 10 giros individuais com animação + som ───
      let done = 0;
      setGameState(prev => ({ ...prev, isAutoSpinning: true }));

      const doSpin = () => {
        if (done >= 10) {
          setConvergenceSim({ currentBlock: 1, running: false, progress: 100 });
          setGameState(prev => ({ ...prev, isAutoSpinning: false }));
          return;
        }

        const color = weightedRandomColor(sectors);
        done++;
        playSound("/sounds/nextChallenge.mp3", 0.3);

        setGameState(prev => {
          const newFreqs = { ...prev.frequencies };
          newFreqs[color] = (newFreqs[color] || 0) + 1;
          const ci = sectors.findIndex(s => s.colorName === color);
          let acc = 0;
          for (let i = 0; i < ci; i++) acc += sectors[i].angle;
          const mid = acc + sectors[ci].angle / 2;
          const ta = prev.currentRotation + 360 + (360 - mid);
          return { ...prev, frequencies: newFreqs, totalSpins: prev.totalSpins + 1, targetAngle: ta, currentRotation: ta, spinDuration: 300 };
        });

        setConvergenceSim(prev => ({ ...prev, progress: Math.round((done / 10) * 100) }));
        setTimeout(doSpin, 600);
      };

      doSpin();
    } else {
      // ─── BLOCOS GRANDES: computação em batches com atualização progressiva ───
      let batchSize: number, delay: number;
      if (blockSize === 500) { batchSize = 50; delay = 400; }
      else if (blockSize === 1000) { batchSize = 100; delay = 500; }
      else if (blockSize === 10000) { batchSize = 500; delay = 300; }
      else { batchSize = 1000; delay = 400; } // 20000

      let done = 0;
      setGameState(prev => ({ ...prev, isAutoSpinning: true }));

      const doBatch = () => {
        const count = Math.min(batchSize, blockSize - done);
        const results: string[] = [];
        for (let i = 0; i < count; i++) results.push(weightedRandomColor(sectors));
        done += count;

        setGameState(prev => {
          const newFreqs = { ...prev.frequencies };
          results.forEach(c => { newFreqs[c] = (newFreqs[c] || 0) + 1; });
          return {
            ...prev,
            frequencies: newFreqs,
            totalSpins: prev.totalSpins + count,
            targetAngle: prev.currentRotation + 360,
            currentRotation: prev.currentRotation + 360,
            spinDuration: 50
          };
        });

        setConvergenceSim(prev => ({ ...prev, progress: Math.round((done / blockSize) * 100) }));

        if (done < blockSize) {
          setTimeout(doBatch, delay);
        } else {
          const nextBlock = blockIdx + 1;
          setConvergenceSim({ currentBlock: nextBlock, running: false, progress: 100 });
          setGameState(prev => ({ ...prev, isAutoSpinning: false }));
          if (nextBlock >= CONVERGENCE_BLOCKS.length) {
            playSound("/sounds/challengeFinished.mp3");
          }
        }
      };

      doBatch();
    }
  }, [convergenceSim.currentBlock, convergenceSim.running, gameState.sectors]);

  // Handler: continuar após simulação → subStep 9 (giros manuais)
  const handleConvergenceContinue = useCallback(() => {
    playSound("/sounds/gameFinished.mp3");
    createAlert("Parabéns!", "Você completou a Etapa 2!", "success", 5000);

    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'success',
      title: 'Lei dos Grandes Números',
      message: 'À medida que o número de repetições de um experimento aleatório aumenta, as frequências relativas de cada resultado tendem a se aproximar das respectivas probabilidades teóricas. Esse fenômeno é descrito pela Lei dos Grandes Números.'
    });

    setGameState(prev => ({ ...prev, subStep: 12, stage3Available: true }));
    setDisabledNextButton(false);
    setInstructions(`<p class="ds-body"><strong>Etapa 2 Concluída!</strong></p>
      <p class="ds-body">Clique em <strong>Etapa 3</strong> para continuar.</p>`);
  }, [createAlert]);

  // Handler: mudança de alternativa na pergunta reflexiva (subStep 6.202 / 6.204)
  // Atualiza constraint + auto-bet em tempo real conforme a opção selecionada
  const handleReflectionOptionChange = useCallback((option: string) => {
    if (gameState.stage !== 2 || (gameState.subStep !== 6.202 && gameState.subStep !== 6.204)) return;

    if (option === 'apostar_mesma') {
      // Auto-aposta na mesma cor sorteada
      const drawnColor = gameState.subStep === 6.202 ? s2SpinReflection.spin1Color : s2SpinReflection.spin2Color;
      setS2SpinReflection(prev => ({
        ...prev, selectedOption: option,
        bet2Color: drawnColor, phase: 'spinning',
        betConstraint: 'same',
      }));
      setDisabledSpinButton(false);
    } else if (option === 'nao_apostar' || option === 'apostar_outra') {
      // Libero disco, bloqueia cor sorteada
      setS2SpinReflection(prev => ({
        ...prev, selectedOption: option,
        bet2Color: '', phase: 'betting',
        betConstraint: 'not_same',
      }));
    } else if (option === 'maior_setor') {
      // Auto-aposta no setor de maior ângulo
      const maxAngle = Math.max(...gameState.s2Angles);
      const maxIdx = gameState.s2Angles.indexOf(maxAngle);
      const biggerColor = gameState.sectors[maxIdx]?.colorName || '';
      setS2SpinReflection(prev => ({
        ...prev, selectedOption: option,
        bet2Color: biggerColor, phase: 'spinning',
        betConstraint: 'largest',
      }));
      setDisabledSpinButton(false);
    }
  }, [gameState, s2SpinReflection.spin1Color, s2SpinReflection.spin2Color]);

  // Handler: clique em setor durante 6.202 betting (not_same)
  const handleReflectionBetClick = useCallback((index: number) => {
    if (gameState.stage !== 2 || gameState.subStep !== 6.202 || s2SpinReflection.phase !== 'betting') return;
    const clickedColor = gameState.sectors[index]?.colorName;
    if (!clickedColor) return;
    // Bloqueia mesma cor do 1o giro
    if (s2SpinReflection.betConstraint === 'not_same' && clickedColor === s2SpinReflection.spin1Color) return;
    setS2SpinReflection(prev => ({ ...prev, bet2Color: clickedColor, phase: 'spinning' }));
    setDisabledSpinButton(false);
  }, [gameState, s2SpinReflection]);

  // Handler: "Vamos calcular as probabilidades" — da síntese para subStep 7
  const handleSpinReflectionContinue = useCallback(() => {
    if (gameState.stage !== 2 || gameState.subStep !== 6.205) return;

    // Iniciar leitura progressiva (tabela será inicializada após a leitura)
    setS2AngleReadingStep(0);
    setGameState(prev => ({ ...prev, subStep: 7, pendingRegistration: false }));
    setDisabledSpinButton(true);
    setInstructions(`<p class="ds-body"><strong>Probabilidade Angular</strong></p>
      <p class="ds-body">Leia o texto e clique em <strong>Li.</strong> para avançar.</p>`);
  }, [gameState]);

  // Handler: avançar leitura progressiva da probabilidade angular (subStep 7)
  const handleAngleReadingNext = useCallback(() => {
    const nextStep = s2AngleReadingStep + 1;

    if (nextStep <= 3) {
      // Avançar para próximo trecho (0→1→2→3)
      setS2AngleReadingStep(nextStep);
    } else if (nextStep === 4) {
      // Após último trecho → pergunta de ativação cognitiva (90°)
      setS2AngleReadingStep(4);
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Probabilidade Angular</strong></p>
        <p class="ds-body">Responda à pergunta abaixo.</p>`);
    } else {
      // Após pergunta → inicializar tabela
      const colors = gameState.sectors.map(s => s.colorName);
      const apInputs: { [color: string]: TextInputInterface } = {};
      colors.forEach((c, i) => {
        apInputs[c] = {
          value: '',
          disabled: i !== 0,
          error: false,
          setValue: (val: string) => setS2AngleProbInputs(prev => ({
            ...prev,
            [c]: { ...prev[c], value: val }
          }))
        };
      });
      setS2AngleProbInputs(apInputs);
      setS2AngleReadingStep(5);
      setGameState(prev => ({ ...prev, s2TableIndex: 0 }));
      setInstructions(`<p class="ds-body"><strong>Girando-se um disco inteiramente ao acaso, calcule a probabilidade de o ponteiro indicar cada uma das cores dos setores.</strong></p>
        <p class="ds-body">Digite a probabilidade de cada cor calculando a razão entre o ângulo do setor e 360°.</p>
        <p class="ds-body">Digite na forma de fração (ex: a/b).</p>`);
    }
  }, [s2AngleReadingStep, gameState.sectors]);

  // ========== FIM HANDLERS INVESTIGAÇÃO ETAPA 2 ==========

  // Função para configurar a pergunta do experimento aleatório
  const setupExperimentQuestion = useCallback((correctAnswer: string) => {
    const distractors = selectRandomDistractors(4);
    const allOptions = [
      { value: 'correct', label: correctAnswer, isCorrect: true },
      ...distractors.map((d, i) => ({ value: `distractor_${i}`, label: d, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      question: 'Tem-se um disco dividido em setores coloridos. Em cada experimento, o disco é girado ao acaso e, ao parar, o ponteiro fixo indica uma das cores. Qual é o experimento aleatório presente nesse contexto?',
      options: allOptions,
      correctAnswer: 'correct'
    });

    setSelectedOption('');
    setInstructions(`<p class="ds-body"><strong>Identificação do Experimento Aleatório</strong></p>
      <p class="ds-body">Leia a situação e selecione a alternativa que descreve corretamente o experimento aleatório.</p>`);
  }, []);

  // Função para mostrar mais exemplos de experimento determinístico
  const handleSeeMoreDeterministicExamples = useCallback(() => {
    const newExample = DETERMINISTIC_EXAMPLES[Math.floor(Math.random() * DETERMINISTIC_EXAMPLES.length)];
    setInfoBoxContent({
      type: 'concept',
      title: 'Experimento determinístico',
      message: `Procedimento que, ao ser repetido nas mesmas condições, produz sempre o mesmo resultado, podendo ser previsto com certeza.<br/><br/><strong>Exemplo:</strong> ${newExample}`
    });
    setDeterministicExamplesViewed(prev => prev + 1);
  }, []);

  // Função para mostrar mais exemplos de experimento aleatório
  const handleSeeMoreRandomExamples = useCallback(() => {
    const newExample = RANDOM_EXAMPLES[Math.floor(Math.random() * RANDOM_EXAMPLES.length)];
    setInfoBoxContent({
      type: 'concept',
      title: 'Experimento aleatório',
      message: `Ação que pode ser repetida do mesmo jeito várias vezes, mas cujo resultado não é possível saber com certeza antes de acontecer, mesmo conhecendo todas as possibilidades.<br/><br/><strong>Exemplo:</strong> ${newExample}`
    });
    setRandomExamplesViewed(prev => prev + 1);
  }, []);

  // Função para ver mais exemplos de eventos disjuntos (subStep 6.55)
  const handleSeeMoreDisjointExamples = useCallback(() => {
    const { sectors } = gameState;
    const n = sectors.length;

    // Gerar NOVOS números para cada exemplo (roleta se atualiza)
    const pMin = n;
    const pMax = 12;
    const pTemp = pMin + Math.floor(Math.random() * (pMax - pMin + 1));
    const newNums = generateSectorNumbers(n, pTemp);

    // Gerar exemplo usando o histórico anti-repetição
    const exampleText = generateDisjointExample(sectors, newNums, lastDisjointMeta);

    // Atualizar números no disco
    setGameState(prev => ({
      ...prev,
      challenge1SectorNumbers: newNums
    }));
    setDisjointNeedsNumbers(exampleText.needsNumbers);

    setInfoBoxContent({
      type: 'concept',
      title: 'Eventos Mutuamente Exclusivos',
      message: `Dois eventos A e B são <strong>mutuamente exclusivos</strong> (ou disjuntos) quando não podem acontecer ao mesmo tempo no mesmo experimento.<br/><br/>Em outras palavras: se A acontece, B não acontece (e vice-versa). Dizemos que eles não têm resultados em comum.<br/><br/>Na notação: <strong>A ∩ B = <span style="font-size: 1.4em;">∅</span></strong> (a interseção é vazia).<br/><br/><hr style="margin: 8px 0;"/><strong>Exemplo no disco:</strong><br/>A = ${exampleText.textA} → ${exampleText.setA}<br/>B = ${exampleText.textB} → ${exampleText.setB}<br/><br/><strong>A ∩ B = <span style="font-size: 1.4em;">∅</span></strong> (nenhum resultado em comum)`
    });

    setLastDisjointMeta(exampleText.meta);
    setDisjointExamplesViewed(prev => prev + 1);
  }, [gameState, lastDisjointMeta]);

  // Iniciar exercício interativo de eventos disjuntos (4º exemplo)
  const handleStartDisjointExercise = useCallback(() => {
    const { sectors } = gameState;
    const n = sectors.length;

    // Gerar novos números
    const pMin = n;
    const pMax = 12;
    const pTemp = pMin + Math.floor(Math.random() * (pMax - pMin + 1));
    const newNums = generateSectorNumbers(n, pTemp);

    // Gerar exemplo
    const exampleText = generateDisjointExample(sectors, newNums, lastDisjointMeta);

    // Atualizar roleta
    setGameState(prev => ({
      ...prev,
      challenge1SectorNumbers: newNums
    }));
    setDisjointNeedsNumbers(exampleText.needsNumbers);
    setLastDisjointMeta(exampleText.meta);

    // Guardar resposta correta e textos
    setDisjointCorrectA([...exampleText.indicesA].sort((a, b) => a - b));
    setDisjointCorrectB([...exampleText.indicesB].sort((a, b) => a - b));
    setDisjointExerciseTextA(exampleText.textA);
    setDisjointExerciseTextB(exampleText.textB);

    // Limpar seleções do usuário
    setDisjointUserSelectA([]);
    setDisjointUserSelectB([]);

    // Entrar na fase de seleção de A
    setDisjointExercisePhase('selecting_A');

    // Atualizar InfoBox com instrução
    setInfoBoxContent({
      type: 'concept',
      title: 'Sua vez!',
      message: `Agora é a sua vez de identificar eventos mutuamente exclusivos no disco!<br/><br/><strong>A = ${exampleText.textA}</strong><br/><strong>B = ${exampleText.textB}</strong><br/><br/><hr style="margin: 8px 0;"/>Clique nos setores do disco que pertencem ao <strong>evento A</strong>.`
    });

    setInstructions(`<p class="ds-body"><strong>Exercício: Eventos Mutuamente Exclusivos</strong></p>
      <p class="ds-body">Clique nos setores que pertencem ao <strong>evento A</strong> (${exampleText.textA}).</p>`);
  }, [gameState, lastDisjointMeta]);

  // Handler de clique em setor durante exercício de disjuntos
  const handleDisjointSectorClick = useCallback((index: number) => {
    if (disjointExercisePhase === 'selecting_A') {
      setDisjointUserSelectA(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else if (disjointExercisePhase === 'selecting_B') {
      // Não permitir selecionar setores já marcados como A
      if (disjointUserSelectA.includes(index)) return;
      setDisjointUserSelectB(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    }
  }, [disjointExercisePhase, disjointUserSelectA]);

  // Confirmar seleção do evento A → passar para B
  const handleDisjointConfirmA = useCallback(() => {
    if (disjointUserSelectA.length === 0) {
      playSound("/sounds/incorrect.mp3");
      createAlert("Selecione ao menos um setor", `Clique nos setores do disco que pertencem ao evento A (${disjointExerciseTextA}) antes de confirmar.`, "error", 4000);
      return;
    }
    setDisjointExercisePhase('selecting_B');

    setInfoBoxContent({
      type: 'concept',
      title: 'Sua vez!',
      message: `<strong>A = ${disjointExerciseTextA}</strong><br/><strong>B = ${disjointExerciseTextB}</strong><br/><br/><hr style="margin: 8px 0;"/>Ótimo! Agora clique nos setores que pertencem ao <strong>evento B</strong>.`
    });

    setInstructions(`<p class="ds-body"><strong>Exercício: Eventos Mutuamente Exclusivos</strong></p>
      <p class="ds-body">Agora clique nos setores que pertencem ao <strong>evento B</strong> (${disjointExerciseTextB}).</p>`);
  }, [disjointUserSelectA, disjointExerciseTextA, disjointExerciseTextB, createAlert]);

  // Confirmar seleção do evento B → validar
  const handleDisjointConfirmB = useCallback(() => {
    if (disjointUserSelectB.length === 0) {
      playSound("/sounds/incorrect.mp3");
      createAlert("Selecione ao menos um setor", `Clique nos setores do disco que pertencem ao evento B (${disjointExerciseTextB}) antes de confirmar.`, "error", 4000);
      return;
    }

    const sortedUserA = [...disjointUserSelectA].sort((a, b) => a - b);
    const sortedUserB = [...disjointUserSelectB].sort((a, b) => a - b);

    const correctA = JSON.stringify(disjointCorrectA) === JSON.stringify(sortedUserA);
    const correctB = JSON.stringify(disjointCorrectB) === JSON.stringify(sortedUserB);

    if (correctA && correctB) {
      playSound("/sounds/correct.mp3");
      setDisjointExercisePhase('correct');
      setDisjointExamplesViewed(prev => prev + 1);
      setInfoBoxContent({
        type: 'success',
        title: 'Parabéns!',
        message: `Você identificou corretamente os eventos mutuamente exclusivos!<br/><br/><strong>A = ${disjointExerciseTextA}</strong><br/><strong>B = ${disjointExerciseTextB}</strong><br/><br/><strong>A ∩ B = <span style="font-size: 1.4em;">∅</span></strong> ✓<br/><br/><hr style="margin: 8px 0;"/>Note que, em um único giro, apenas um setor acontece. Repare também que as regiões marcadas de A e B não se sobrepõem: nenhum setor foi marcado ao mesmo tempo em A e em B (não há setor em comum).`
      });
      setInstructions(`<p class="ds-body"><strong>Correto!</strong></p>
        <p class="ds-body">Você marcou corretamente os eventos A e B no disco.</p>`);
    } else {
      playSound("/sounds/incorrect.mp3");
      setDisjointExercisePhase('wrong');
      const errorText = !correctA && !correctB
        ? 'Os setores selecionados para A e B estão incorretos.'
        : !correctA
          ? 'Os setores selecionados para o evento A estão incorretos.'
          : 'Os setores selecionados para o evento B estão incorretos.';
      createAlert("Resposta incorreta", errorText, "error", 4000);
      setInfoBoxContent({
        type: 'error',
        title: 'Tente novamente',
        message: `${errorText}<br/><br/><strong>A = ${disjointExerciseTextA}</strong><br/><strong>B = ${disjointExerciseTextB}</strong><br/><br/>Observe o disco e tente novamente.`
      });
      setInstructions(`<p class="ds-body"><strong>Resposta incorreta</strong></p>
        <p class="ds-body">Tente novamente. Clique em "Tentar novamente" para recomeçar.</p>`);
    }
  }, [disjointUserSelectA, disjointUserSelectB, disjointCorrectA, disjointCorrectB, disjointExerciseTextA, disjointExerciseTextB, createAlert]);

  // Tentar novamente o exercício de disjuntos (mesmos eventos, limpar seleções)
  const handleDisjointRetry = useCallback(() => {
    setDisjointUserSelectA([]);
    setDisjointUserSelectB([]);
    setDisjointExercisePhase('selecting_A');

    setInfoBoxContent({
      type: 'concept',
      title: 'Sua vez!',
      message: `<strong>A = ${disjointExerciseTextA}</strong><br/><strong>B = ${disjointExerciseTextB}</strong><br/><br/><hr style="margin: 8px 0;"/>Clique nos setores do disco que pertencem ao <strong>evento A</strong>.`
    });

    setInstructions(`<p class="ds-body"><strong>Exercício: Eventos Mutuamente Exclusivos</strong></p>
      <p class="ds-body">Clique nos setores que pertencem ao <strong>evento A</strong> (${disjointExerciseTextA}).</p>`);
  }, [disjointExerciseTextA, disjointExerciseTextB]);

  // === Handlers para a fase de Probabilidade da União (subStep 6.56) ===

  const initUnionActivity = useCallback((activityNum: number) => {
    const { sectors } = gameState;
    const n = sectors.length;
    const isChallenge = activityNum >= unionMaxActivities;

    let events: UnionEvent[];
    let needsNumbers: boolean;
    let numbers: number[];

    if (isChallenge) {
      // DESAFIO: usar gerador controlado que garante eventos válidos e não-triviais
      const challenge = generateUnionChallenge(sectors);
      if (challenge) {
        numbers = challenge.values;
        events = challenge.events;
        needsNumbers = true; // desafio sempre mostra números
      } else {
        // Fallback: geração normal se o desafio falhar
        numbers = generateInterestingNumbers(n);
        const numEvents = Math.min(activityNum + 1, n);
        const result = generateUnionEvents(sectors, numEvents, numbers);
        events = result.events;
        needsNumbers = result.needsNumbers;
      }
    } else {
      // Atividades normais: geração padrão
      const numEvents = Math.min(activityNum + 1, n);
      numbers = generateInterestingNumbers(n);
      const result = generateUnionEvents(sectors, numEvents, numbers);
      events = result.events;
      needsNumbers = result.needsNumbers;
    }

    setUnionSectorNumbers(numbers);
    setUnionEvents(events);
    setUnionCurrentEventIdx(0);
    setUnionSelectedSectors([]);
    setUnionPhase('selecting');
    setUnionNeedsNumbers(needsNumbers);
    setUnionProbNumInput({ value: '', error: false });
    setUnionProbDenInput({ value: '', error: false });
    setUnionFinalNumInput({ value: '', error: false });
    setUnionFinalDenInput({ value: '', error: false });

    const activityTitle = isChallenge ? 'Desafio Final' : `Atividade ${activityNum}`;
    const unionLabel = events.map(e => e.label).join(' ∪ ');

    setInstructions(`<p class="ds-body"><strong>${activityTitle}: P(${unionLabel})</strong></p>
      <p class="ds-body">Clique nos setores que pertencem ao <strong>evento ${events[0].label}</strong> (${events[0].description}).</p>`);
  }, [gameState, unionMaxActivities]);

  const handleUnionSectorClick = useCallback((index: number) => {
    if (unionPhase !== 'selecting') return;

    // Bloquear setores de eventos já confirmados
    const confirmedIndices = unionEvents
      .filter(e => e.completed)
      .flatMap(e => e.sectorIndices);
    if (confirmedIndices.includes(index)) return;

    setUnionSelectedSectors(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, [unionPhase, unionEvents]);

  const handleUnionConfirmSelection = useCallback(() => {
    if (unionSelectedSectors.length === 0) return;
    goToTopOfChallenge();

    const currentEvent = unionEvents[unionCurrentEventIdx];
    const sortedUser = [...unionSelectedSectors].sort((a, b) => a - b);
    const sortedCorrect = [...currentEvent.sectorIndices].sort((a, b) => a - b);

    const won = sortedUser.length === sortedCorrect.length &&
      sortedUser.every((val, idx) => val === sortedCorrect[idx]);

    if (won) {
      playSound("/sounds/correct.mp3");
      setUnionPhase('filling_prob');
      setUnionProbNumInput({ value: '', error: false });
      setUnionProbDenInput({ value: '', error: false });

      createAlert("Correto!", `Setores do evento ${currentEvent.label} identificados!`, "success", 2000);
      setInstructions(`<p class="ds-body"><strong>Correto!</strong> Agora calcule P(${currentEvent.label}) como fração.</p>`);
    } else {
      playSound("/sounds/incorrect.mp3");
      createAlert("Erro!", `Verifique quais setores pertencem ao evento ${currentEvent.label}: ${currentEvent.description}. Tente novamente.`, "error", 5000);
    }
  }, [unionSelectedSectors, unionEvents, unionCurrentEventIdx, createAlert]);

  const handleUnionConfirmProb = useCallback(() => {
    goToTopOfChallenge();
    const numerator = parseInt(unionProbNumInput.value || '');
    const denominator = parseInt(unionProbDenInput.value || '');

    const currentEvent = unionEvents[unionCurrentEventIdx];
    const expectedNum = currentEvent.sectorIndices.length;
    const expectedDen = gameState.sectors.length;

    if (areSplitFractionsEquivalent(numerator, denominator, expectedNum, expectedDen)) {
      playSound("/sounds/correct.mp3");

      const updatedEvents = unionEvents.map((e, i) =>
        i === unionCurrentEventIdx
          ? { ...e, completed: true, probNumerator: expectedNum, probDenominator: expectedDen }
          : e
      );
      setUnionEvents(updatedEvents);

      const nextIdx = unionCurrentEventIdx + 1;

      if (nextIdx < unionEvents.length) {
        // Próximo evento
        setUnionCurrentEventIdx(nextIdx);
        setUnionSelectedSectors([]);
        setUnionPhase('selecting');

        const nextEvent = unionEvents[nextIdx];
        createAlert("Correto!", `P(${currentEvent.label}) = ${expectedNum}/${expectedDen}`, "success", 2000);
        setInstructions(`<p class="ds-body"><strong>P(${currentEvent.label}) = ${expectedNum}/${expectedDen} ✓</strong></p>
          <p class="ds-body">Agora marque os setores do <strong>evento ${nextEvent.label}</strong> (${nextEvent.description}).</p>`);
      } else {
        // Todos os eventos confirmados → cálculo final
        setUnionPhase('final_calc');
        setUnionFinalNumInput({ value: '', error: false });
        setUnionFinalDenInput({ value: '', error: false });

        const unionLabel = updatedEvents.map(e => e.label).join('∪');
        const probList = updatedEvents.map(e => `P(${e.label}) = ${e.probNumerator}/${e.probDenominator}`).join(', ');
        createAlert("Correto!", `P(${currentEvent.label}) = ${expectedNum}/${expectedDen}`, "success", 2000);
        setInstructions(`<p class="ds-body"><strong>Probabilidades individuais confirmadas!</strong></p>
          <p class="ds-body">${probList}</p>
          <p class="ds-body">Agora calcule <strong>P(${unionLabel})</strong>.</p>`);
      }
    } else {
      playSound("/sounds/incorrect.mp3");
      setUnionProbNumInput(prev => ({ ...prev, error: true }));
      setUnionProbDenInput(prev => ({ ...prev, error: true }));
      createAlert("Erro!", `P(${currentEvent.label}) = n(${currentEvent.label}) / n(S). Conte quantos setores pertencem ao evento e quantos setores tem o disco.`, "error", 5000);
    }
  }, [unionProbNumInput, unionProbDenInput, unionEvents, unionCurrentEventIdx, gameState.sectors, createAlert]);

  const handleUnionConfirmFinal = useCallback(() => {
    goToTopOfChallenge();
    const numerator = parseInt(unionFinalNumInput.value || '');
    const denominator = parseInt(unionFinalDenInput.value || '');

    const expectedNum = unionEvents.reduce((sum, e) => sum + e.probNumerator, 0);
    const expectedDen = gameState.sectors.length;

    if (areSplitFractionsEquivalent(numerator, denominator, expectedNum, expectedDen)) {
      playSound("/sounds/challengeFinished.mp3");

      const unionLabel = unionEvents.map(e => e.label).join('∪');
      const probSum = unionEvents.map(e => `${e.probNumerator}/${e.probDenominator}`).join(' + ');
      const decimal = (expectedNum / expectedDen).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      const percentageVal = ((expectedNum / expectedDen) * 100).toFixed(1).replace(/\.0$/, '');

      const isLastActivity = unionActivityNum >= unionMaxActivities;

      setShowInfoBox(true);
      if (isLastActivity) {
        setInfoBoxContent({
          type: 'success',
          title: 'Parabéns! Fase concluída!',
          message: `Você aplicou corretamente a regra da união para eventos mutuamente exclusivos!<br/><br/><strong>P(${unionLabel}) = ${probSum} = ${expectedNum}/${expectedDen} = ${decimal} = ${percentageVal}%</strong><br/><br/>Como os eventos são mutuamente exclusivos (não compartilham resultados), a probabilidade da união é simplesmente a <strong>soma</strong> das probabilidades individuais.`
        });
        setUnionPhase('all_done');
      } else {
        setInfoBoxContent({
          type: 'success',
          title: 'Correto!',
          message: `<strong>P(${unionLabel}) = ${probSum} = ${expectedNum}/${expectedDen} = ${decimal} = ${percentageVal}%</strong><br/><br/>A regra funciona: para eventos mutuamente exclusivos, a probabilidade da união é a soma das probabilidades individuais.`
        });
        setUnionPhase('activity_success');
      }

      setInstructions(`<p class="ds-body"><strong>Atividade ${unionActivityNum} concluída!</strong></p>`);
    } else {
      playSound("/sounds/incorrect.mp3");
      setUnionFinalNumInput(prev => ({ ...prev, error: true }));
      setUnionFinalDenInput(prev => ({ ...prev, error: true }));
      const probSum = unionEvents.map(e => `P(${e.label})`).join(' + ');
      createAlert("Erro!", `Para eventos mutuamente exclusivos: P(${unionEvents.map(e => e.label).join('∪')}) = ${probSum}. Some os numeradores e mantenha o denominador.`, "error", 6000);
    }
  }, [unionFinalNumInput, unionFinalDenInput, unionEvents, unionActivityNum, unionMaxActivities, gameState.sectors, createAlert]);

  const handleUnionNextActivity = useCallback(() => {
    const nextActivity = unionActivityNum + 1;
    setUnionActivityNum(nextActivity);
    setShowInfoBox(false);
    initUnionActivity(nextActivity);
  }, [unionActivityNum, initUnionActivity]);

  // Função para lidar com confirmação do InfoBox
  const handleInfoBoxConfirm = useCallback(() => {
    goToTopOfChallenge();
    setShowInfoBox(false);

    const { stage, subStep, sectors, targetSectorCount } = gameState;

    // ===== CONFRONTO PREVISÃO × RESULTADO (Melhoria 4 — Artigue/Brousseau) =====

    // Stage 1 - SubStep 7.1: Após confronto, avançar para pergunta de incerteza
    if (stage === 1 && subStep === 7.1) {
      showUncertaintyQuestion();
      return;
    }

    // ===== CONSOLIDAÇÃO VERBAL (Melhoria 7 — Almouloud/Duval) =====

    // Stage 1 - SubStep 15.5: Após InfoBox de reforço verbal → descontextualização (dado)
    if (stage === 1 && subStep === 15.5) {
      setGameState(prev => ({ ...prev, subStep: 15.6 }));
      setDiceState({ face: 0, rolling: false, rolled: false, answered: false });
      setDiceInput({ value: '', error: false });
      setInstructions(`<p class="ds-body"><strong>Generalização</strong></p>
        <p class="ds-body">A Lei dos Grandes Números vale apenas para o disco? Vamos testar com outro objeto.</p>`);
      return;
    }

    // Stage 1 - SubStep 15.7: Após InfoBox de reforço do dado → celebração Etapa 1
    if (stage === 1 && subStep === 15.7) {
      playSound("/sounds/gameFinished.mp3");
      createAlert("Parabéns!", "Você completou a Etapa 1! A Etapa 2 foi desbloqueada.", "success", 5000);
      setGameState(prev => ({ ...prev, subStep: 16, stage2Available: true }));
      setDisabledNextButton(false);
      setInstructions(`<p class="ds-body"><strong>Etapa 1 Concluída!</strong></p>
        <p class="ds-body">Você aprendeu sobre probabilidade equiprovável e a Lei dos Grandes Números.</p>
        <p class="ds-body">Clique em <strong>Próxima Etapa</strong> para continuar.</p>`);
      return;
    }

    // ===== TRANSIÇÕES — InfoBox de ruptura do contrato didático (Brousseau) =====

    // Stage 2 - SubStep 0: Transição E1→E2 → apenas fechar InfoBox
    if (stage === 2 && subStep === 0) {
      return;
    }

    // Stage 3 - SubStep 0.5: Transição E2→E3 → apenas fechar InfoBox
    if (stage === 3 && subStep === 0.5) {
      return;
    }

    // ===== ETAPA 2 — handleInfoBoxConfirm =====

    // Stage 2 - SubStep 2.9: Leitura progressiva → avançar frase ou ir para tabela
    if (stage === 2 && subStep === 2.9) {
      const PROGRESSIVE_PHRASES = [
        'O setor mais provável de ser sorteado é aquele que possui maior área.',
        'Em uma mesma circunferência, as áreas dos setores são diretamente proporcionais às medidas de seus ângulos centrais.',
        'Para comparar os setores, vamos usar o menor setor como referência.',
        'Determine quantas vezes a área de cada setor é maior que a área do menor setor, calculando a razão entre seus ângulos centrais.',
        'Na tabela que aparecerá mais adiante, divida a medida de cada ângulo central pela medida do menor ângulo central, digitando o resultado.'
      ];

      const nextStep = progressiveReadingStep + 1;

      if (nextStep < PROGRESSIVE_PHRASES.length) {
        // Avançar para próxima frase
        setProgressiveReadingStep(nextStep);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Razão entre as áreas dos setores',
          message: PROGRESSIVE_PHRASES[nextStep]
        });
      } else if (nextStep === PROGRESSIVE_PHRASES.length) {
        // Passo de destaque: destacar o menor setor como referência
        const minAngle = gameState.s2M;
        const minIdx = gameState.s2Angles.indexOf(minAngle);
        const minColor = sectors[minIdx]?.colorName || '';
        setProgressiveReadingStep(nextStep);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Setor de referência',
          message: `O setor <strong>${minColor}</strong> (${minAngle}°) é o menor setor do disco. Este setor será a unidade de comparação.`
        });
      } else {
        // Última frase lida → entrar em subStep 3, STATE 0 (init)
        // Roleta clicável, tabela oculta, questão oculta
        setS2RatioPhase('init');
        setS2UnitSectorIndex(-1);
        setS2ConceptQuestion(null);
        setS2ConceptSelected('');
        setS2TableAllCorrect(false);
        setGameState(prev => ({ ...prev, subStep: 3, s2TableIndex: 0 }));
        setInstructions(`<p class="ds-body"><strong>Razões angulares</strong></p>
          <p class="ds-body">Clique no setor de menor ângulo para defini-lo como unidade.</p>`);
      }
      return;
    }

    // Stage 2 - SubStep 0.17: Conflito cognitivo "Li" → nova aposta
    if (stage === 2 && subStep === 0.17) {
      // Resetar estado de experimentação e voltar à fase de aposta
      setExperimentationState({
        wageredColor: null,
        wagers: [],
        draws: [],
        currentAttempt: 1,
        waitingForConfirmation: false,
        internalDrawnColor: null,
        colorRevealed: false
      });
      setDisabledSpinButton(true);
      setGameState(prev => ({ ...prev, subStep: 0.15 }));
      setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
        <p class="ds-body">Girando-se aleatoriamente o disco, em qual cor você apostaria para ter mais chance de ganhar?</p>
        <p class="ds-body">Clique no setor que você acredita que o ponteiro irá indicar.</p>`);
      return;
    }

    // Stage 2 - SubStep 0.185: "Li" na afirmação conceitual → mostrar paleta de cores
    if (stage === 2 && subStep === 0.185) {
      setInstructions(`<p class="ds-body"><strong>Investigação Inicial</strong></p>
        <p class="ds-body">Clique na cor que possui a <strong>maior chance</strong> de ser sorteada.</p>`);
      return;
    }

    // Stage 2 - SubStep 0.18: Modal transição → reflexão conceitual
    if (stage === 2 && subStep === 0.18) {
      const s2MaxAngle = Math.max(...gameState.s2Angles);
      const s2MaxIdx = gameState.s2Angles.indexOf(s2MaxAngle);
      const s2MaxColor = gameState.sectors[s2MaxIdx]?.colorName || '';

      // Gerar alternativas: 4 de F + 1 de V, embaralhadas
      const shuffledF = [...S2_DISTRACTORS_F].sort(() => Math.random() - 0.5);
      const selected4F = shuffledF.slice(0, 4);
      const selectedV = S2_TRUE_OPTIONS_V[Math.floor(Math.random() * S2_TRUE_OPTIONS_V.length)];

      const allOptions = [
        ...selected4F.map((f, i) => ({ value: `f_${i}`, label: f, isCorrect: false })),
        { value: 'v_correct', label: selectedV, isCorrect: true }
      ].sort(() => Math.random() - 0.5);

      setCurrentQuestion({
        question: `Por que a cor ${s2MaxColor} tem maior chance de ser sorteada?`,
        options: allOptions,
        correctAnswer: 'v_correct'
      });
      setSelectedOption('');
      setGameState(prev => ({ ...prev, subStep: 0.19 }));
      setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
        <p class="ds-body">Responda a pergunta abaixo.</p>`);
      return;
    }

    // Stage 2 - SubStep 0.191: Viés de equiprobabilidade lido → avançar para espaço amostral
    if (stage === 2 && subStep === 0.191) {
      setSampleSpaceInput({ value: '', disabled: false, error: false });
      setGameState(prev => ({ ...prev, subStep: 2 }));
      setInstructions(`<p class="ds-body"><strong>Espaço Amostral</strong></p>
        <p class="ds-body"><strong>Gira-se o disco, que está dividido em setores coloridos. Quando ele para, observa-se a cor do setor indicado pelo ponteiro.</strong></p>`);
      return;
    }

    // Stage 2 - SubStep 0.19: "Girar novamente" após erro na reflexão → executar spin
    if (stage === 2 && subStep === 0.19) {
      // Executar novo giro (mesma lógica de spinRouletteS2)
      const rand = Math.random() * 360;
      let cumAngle = 0;
      let sectorIndex = 0;
      for (let i = 0; i < sectors.length; i++) {
        cumAngle += sectors[i].angle;
        if (rand < cumAngle) {
          sectorIndex = i;
          break;
        }
      }
      const drawnColor = sectors[sectorIndex].colorName;

      let startAngle = 0;
      for (let i = 0; i < sectorIndex; i++) {
        startAngle += sectors[i].angle;
      }
      const margin = sectors[sectorIndex].angle * 0.25;
      const randomOffset = margin + Math.random() * (sectors[sectorIndex].angle - 2 * margin);
      const targetSectorAngle = startAngle + randomOffset;

      const desiredFinalRotation = (360 - targetSectorAngle + 360) % 360;
      const currentMod360 = (gameState.currentRotation || 0) % 360;
      let deltaToTarget = (desiredFinalRotation - currentMod360 + 360) % 360;
      if (deltaToTarget < 30) deltaToTarget += 360;

      const extraRotations = 2;
      const newTargetAngle = (gameState.currentRotation || 0) + deltaToTarget + extraRotations * 360;
      const spinDuration = 2000;

      setGameState(prev => ({
        ...prev,
        isSpinning: true,
        targetAngle: newTargetAngle,
        spinDuration: spinDuration
      }));

      setExperimentationState(prev => ({
        ...prev,
        internalDrawnColor: drawnColor,
        colorRevealed: false,
        waitingForConfirmation: false
      }));

      setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
        <p class="ds-body">Girando o disco...</p>`);

      playSound("/sounds/nextChallenge.mp3");
      const soundInterval = setInterval(() => {
        playSound("/sounds/nextChallenge.mp3");
      }, 400);

      setTimeout(() => {
        clearInterval(soundInterval);

        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          currentRotation: newTargetAngle,
          selectedColor: drawnColor,
          subStep: 0.195
        }));

        setExperimentationState(prev => ({
          ...prev,
          waitingForConfirmation: true
        }));

        setInstructions(`<p class="ds-body"><strong>Reflexão Conceitual</strong></p>
          <p class="ds-body">O disco parou. Clique na cor em que o ponteiro parou.</p>`);
      }, spinDuration + 300);

      return;
    }

    // Etapa 2 - SubStep 2: Info box dica espaço amostral (fechar e tentar novamente)
    if (stage === 2 && subStep === 2) {
      // Apenas fechar info box, aluno tenta novamente
      return;
    }

    // Stage 2 - SubStep 5.1: Info "soma = 1" → determinar x
    if (stage === 2 && subStep === 5.1) {
      const equationTerms = gameState.s2Ki.map(ki => `${ki}x`).join(' + ');
      setS2XInput({ value: '', disabled: false, error: false, setValue: (val: string) => setS2XInput(prev => ({ ...prev, value: val })) });
      setGameState(prev => ({ ...prev, subStep: 5.2 }));
      setInstructions(`<p class="ds-body"><strong>Determinação de x</strong></p>
        <p class="ds-body">Resolva a equação <strong>${equationTerms} = 1</strong> e determine x.</p>
        <p class="ds-body">Digite na forma de fração (ex: 1/a) ou decimal.</p>`);
      return;
    }

    // Stage 2 - SubStep 12: Conclusão info → done
    if (stage === 2 && subStep === 12) {
      return;
    }

    // ===== FIM ETAPA 2 handleInfoBoxConfirm =====

    // Balão 1 → Balão 2 (subStep 0.1 → 0.2)
    if (stage === 1 && subStep === 0.1) {
      setGameState(prev => ({ ...prev, subStep: 0.2 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Acaso / Aleatoriedade',
        message: 'Impossibilidade de prever com certeza qual será o resultado de um fenômeno antes que ele aconteça.'
      });
      return;
    }

    // Balão 2 → Balão 3 (subStep 0.2 → 0.3)
    if (stage === 1 && subStep === 0.2) {
      setGameState(prev => ({ ...prev, subStep: 0.3 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Experimento aleatório',
        message: `Ação que pode ser repetida do mesmo jeito várias vezes, mas cujo resultado não é possível saber com certeza antes de acontecer, mesmo conhecendo todas as possibilidades.<br/><br/><strong>Exemplo:</strong> ${RANDOM_EXAMPLES[Math.floor(Math.random() * RANDOM_EXAMPLES.length)]}`
      });
      return;
    }

    // Balão 3 → Balão 4 (subStep 0.3 → 0.4)
    if (stage === 1 && subStep === 0.3) {
      setGameState(prev => ({ ...prev, subStep: 0.4 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Exemplo',
        message: 'Ao girar um disco, sabemos quais cores podem sair, mas não sabemos qual delas aparecerá em cada giro.'
      });
      return;
    }

    // Balão 4 → Balão 5 (subStep 0.4 → 0.5)
    if (stage === 1 && subStep === 0.4) {
      setGameState(prev => ({ ...prev, subStep: 0.5 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Foco da Probabilidade',
        message: 'Em Probabilidade, interessam apenas os fenômenos aleatórios.'
      });
      return;
    }

    // Balão 5 → Balão 6 (subStep 0.5 → 0.6)
    if (stage === 1 && subStep === 0.5) {
      setGameState(prev => ({ ...prev, subStep: 0.6 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Observação',
        message: 'A cada giro do disco, realizamos um novo experimento aleatório e observamos apenas o resultado final indicado pelo ponteiro.'
      });
      return;
    }

    // Balão 6 → Pergunta do experimento aleatório (subStep 0.6 → 1)
    if (stage === 1 && subStep === 0.6) {
      setGameState(prev => ({ ...prev, subStep: 1 }));
      setupExperimentQuestion(gameState.correctAnswer);
      return;
    }

    // Após balão do espaço amostral (subStep 1.5)
    if (stage === 1 && subStep === 1.5) {
      setGameState(prev => ({ ...prev, subStep: 2 }));
      setInstructions(`<p class="ds-body"><strong>Identificação do Espaço Amostral</strong></p>
        <p class="ds-body">Qual é o espaço amostral desse experimento aleatório?</p>
        <p class="ds-small">Dica: As cores do disco são: {cor1, cor2,...}</p>`);
      return;
    }

    // Após balão de Evento (subStep 3.4) → Balão de Evento Composto (subStep 3.45)
    if (stage === 1 && subStep === 3.4) {
      // Gerar conjuntos para exemplo de evento composto
      const availableColors = [...sectors.map(s => s.colorName)];
      const n = availableColors.length;

      // Função para gerar um subconjunto aleatório com k >= 2 elementos
      const generateSubset = (colors: string[]): string[] => {
        const kOptions = [];
        for (let i = 2; i <= colors.length; i++) kOptions.push(i);
        const k = kOptions[Math.floor(Math.random() * kOptions.length)];

        const result: string[] = [];
        const available = [...colors];
        for (let i = 0; i < k; i++) {
          const idx = Math.floor(Math.random() * available.length);
          result.push(available.splice(idx, 1)[0]);
        }
        return result;
      };

      // Gerar A
      const setA = generateSubset(availableColors);
      const strA = setA.join(', ');

      // Se o disco tem apenas 2 setores, mostrar apenas o evento A
      // (só existe um único evento composto possível com 2 elementos)
      if (n === 2) {
        setGameState(prev => ({ ...prev, subStep: 3.45 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Evento composto',
          message: `Evento composto é aquele formado por dois ou mais resultados simples de um experimento aleatório, isto é, corresponde a um subconjunto do espaço amostral que contém mais de um elemento.<br/><br/><strong>Exemplo:</strong><br/>A = {${strA}}.`
        });
        return;
      }

      // Gerar B com pelo menos um elemento distinto de A
      // (A e B não podem ser idênticos - devem ter pelo menos uma diferença)
      let setB: string[] = [];
      let attempts = 0;
      const areSetsEqual = (a: string[], b: string[]): boolean => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((el, i) => el === sortedB[i]);
      };

      do {
        setB = generateSubset(availableColors);
        attempts++;
      } while (areSetsEqual(setA, setB) && attempts < 20);

      // Se ainda forem iguais após tentativas, forçar diferença
      if (areSetsEqual(setA, setB)) {
        // Adicionar ou remover um elemento para garantir diferença
        const elementsOutsideA = availableColors.filter(c => !setA.includes(c));
        if (elementsOutsideA.length > 0) {
          // Substituir um elemento de B por um que não está em A
          setB[0] = elementsOutsideA[Math.floor(Math.random() * elementsOutsideA.length)];
        } else if (setB.length > 2) {
          // Se não há elementos fora de A, remover um elemento de B
          setB.pop();
        }
      }

      const strB = setB.join(', ');

      setGameState(prev => ({ ...prev, subStep: 3.45 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Evento composto',
        message: `Evento composto é aquele formado por dois ou mais resultados simples de um experimento aleatório, isto é, corresponde a um subconjunto do espaço amostral que contém mais de um elemento.<br/><br/><strong>Exemplo:</strong><br/>A = {${strA}}.<br/>B = {${strB}}.`
      });
      return;
    }

    // Após balão de Evento Composto (subStep 3.45) → Balão de Espaço Amostral Equiprovável (subStep 3.5)
    if (stage === 1 && subStep === 3.45) {
      setGameState(prev => ({ ...prev, subStep: 3.5 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Espaço Amostral Equiprovável',
        message: 'O espaço amostral é <strong>equiprovável</strong> quando todos os resultados possíveis têm a mesma chance de ocorrer, como em um disco com setores iguais, girado ao acaso.<br/><br/>Ele é <strong>não equiprovável</strong> quando alguns resultados têm chances diferentes, por exemplo, se os setores do disco têm tamanhos distintos.'
      });
      return;
    }

    // Após balão de equiprovável/não equiprovável (subStep 3.5)
    if (stage === 1 && subStep === 3.5) {
      // Mostrar balão de reflexão sobre simetria
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Pense antes de responder',
        message: 'Os setores são iguais, pois possuem a mesma medida do ângulo central e pertencem à mesma circunferência. Além disso, o ponteiro não encosta na superfície dos setores, garantindo que todos os elementos de simetria estejam presentes.'
      });
      setGameState(prev => ({ ...prev, subStep: 3.6 }));
      return;
    }

    // Após balão de reflexão sobre simetria (subStep 3.6)
    if (stage === 1 && subStep === 3.6) {
      setGameState(prev => ({ ...prev, subStep: 4 }));
      setCurrentQuestion({
        question: 'Há alguma razão para você acreditar que uma cor tem maior chance de ocorrer do que as outras?',
        correctAnswer: 'nao'
      });
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Reflexão sobre Equiprobabilidade</strong></p>
        <p class="ds-body">Responda a pergunta abaixo.</p>`);
      return;
    }

    // Após informação com n dinâmico (subStep 4.5)
    if (stage === 1 && subStep === 4.5) {
      setGameState(prev => ({ ...prev, subStep: 5 }));
      setCurrentQuestion({
        question: 'O espaço amostral do problema desso disco é:',
        options: [
          { value: 'equiprovavel', label: 'Equiprovável', isCorrect: true },
          { value: 'nao_equiprovavel', label: 'Não equiprovável', isCorrect: false }
        ],
        correctAnswer: 'equiprovavel'
      });
      setSelectedOption('');
      setInstructions(`<p class="ds-body"><strong>Classificação do Espaço Amostral</strong></p>
        <p class="ds-body">Com base nas informações, classifique o espaço amostral.</p>`);
      return;
    }

    // Após balão de evento certo (subStep 5.5) → Balão de Evento Impossível (subStep 5.55)
    if (stage === 1 && subStep === 5.5) {
      // Encontrar uma cor que NÃO está no espaço amostral atual
      const colorsInRoulette = sectors.map(s => s.colorName);
      const allColors = ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Roxo', 'Rosa', 'Laranja', 'Marrom', 'Preto', 'Branco', 'Cinza'];
      const colorsOutsideRoulette = allColors.filter(c => !colorsInRoulette.includes(c));
      const impossibleColor = colorsOutsideRoulette[Math.floor(Math.random() * colorsOutsideRoulette.length)];

      setGameState(prev => ({ ...prev, subStep: 5.55 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Evento impossível',
        message: `Evento impossível é aquele que não corresponde a nenhum resultado que possa ocorrer em um experimento aleatório.<br/><br/>Isso significa que nenhum resultado do espaço amostral leva à ocorrência desse evento.<br/><br/>No caso do disco, um evento impossível ocorre quando se considera uma cor que não está presente entre os setores do disco.<br/><br/>Por exemplo, após girar aleatoriamente o disco, considere o evento<br/><br/>E = {${impossibleColor}}.`
      });
      return;
    }

    // Após balão de evento impossível (subStep 5.55) → Pergunta sobre probabilidade do evento certo (subStep 5.7)
    if (stage === 1 && subStep === 5.55) {
      setGameState(prev => ({ ...prev, subStep: 5.7 }));
      setTheoreticalQuestion1Input({ value: '', disabled: false, error: false, setValue: (val: string) => setTheoreticalQuestion1Input(prev => ({ ...prev, value: val })) });
      setInstructions(`<p class="ds-body"><strong>Probabilidade do Evento Certo</strong></p>
        <p class="ds-body">Responda a pergunta abaixo.</p>`);
      return;
    }

    // Após balão de Definição de Probabilidade (subStep 5.75) → Modelo Probabilístico do Espaço Amostral Equiprovável (subStep 5.8)
    if (stage === 1 && subStep === 5.75) {
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Modelo Probabilístico do Espaço Amostral Equiprovável',
        message: 'A probabilidade de cada setor do disco ser sorteado pode ser determinada com base na presença de elementos de simetria que garantem que cada resultado do experimento aleatório tenha a mesma probabilidade de ocorrer.<br/><br/>Para que o espaço amostral do disco seja equiprovável, devem estar presentes:<br/><br/>• Setores com o mesmo tamanho, isto é, com a mesma medida angular;<br/>• Setores com a mesma forma geométrica e pertencentes à mesma circunferência;<br/>• Um ponteiro fixo e um disco que gira livremente, sem atrito entre o ponteiro e o disco;<br/>• Ausência de irregularidades ou mecanismos que favoreçam algum setor;<br/>• Procedimento de giro sempre igual em todas as repetições do experimento;<br/>• Um único resultado associado a cada setor do disco.'
      });
      setGameState(prev => ({ ...prev, subStep: 5.8 }));
      return;
    }

    // Após explicação sobre probabilidade teórica por simetria (subStep 5.8)
    if (stage === 1 && subStep === 5.8) {
      playSound("/sounds/nextChallenge.mp3");
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'info',
        title: 'Divisão da Probabilidade',
        message: `Como o espaço amostral do experimento de girar o disco é equiprovável, a probabilidade do evento certo (igual a 1 ou 100%) pode ser dividida em ${targetSectorCount} partes iguais, correspondendo a uma mesma fração para cada setor ou a 100% dividido por ${targetSectorCount}.`
      });
      setGameState(prev => ({ ...prev, subStep: 5.9 }));
      return;
    }

    // Após explicação sobre divisão da probabilidade (subStep 5.9)
    if (stage === 1 && subStep === 5.9) {
      // Configurar inputs de probabilidade
      const colors = sectors.map(s => s.colorName);
      const inputs: { [color: string]: TextInputInterface } = {};

      colors.forEach(color => {
        inputs[color] = {
          value: '',
          disabled: false,
          error: false,
          setValue: (val: string) => {
            setProbabilityInputs(prev => ({
              ...prev,
              [color]: { ...prev[color], value: val }
            }));
          }
        };
      });

      setProbabilityInputs(inputs);
      setGameState(prev => ({ ...prev, subStep: 6 }));
      setInstructions(`<p class="ds-body"><strong>Probabilidade de Cada Cor</strong></p>
        <p class="ds-body">Baseando-se em elementos de simetria, atribua as probabilidades de o ponteiro parar em cada cor do disco.</p>
        <p class="ds-body">Digite na forma de fração (ex: a/b).</p>`);
      return;
    }

    // Após texto explicativo da probabilidade do evento composto (subStep 6.2) → Generalização do Teorema de Laplace (subStep 6.3)
    if (stage === 1 && subStep === 6.2) {
      setGameState(prev => ({ ...prev, subStep: 6.3 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `Seja <strong>E</strong> um evento associado a um experimento aleatório.<br/><br/>Denotamos por <strong>n(E)</strong> o número de elementos do evento E, isto é, o número de casos favoráveis à ocorrência do evento.<br/><br/>Considere um espaço amostral equiprovável <strong>S</strong>, isto é, um conjunto de resultados possíveis em que todos os resultados têm a mesma probabilidade de ocorrer.<br/><br/>Denotamos por <strong>n(S)</strong> o número de resultados possíveis do experimento aleatório, ou seja, o número total de elementos do espaço amostral.<br/><br/>Nessas condições, a probabilidade de ocorrência do evento E é dada pela razão entre o número de casos favoráveis e o número total de resultados possíveis.`
      });
      return;
    }

    // Após texto conceitual (subStep 6.3) → Fórmula simbólica (subStep 6.35)
    if (stage === 1 && subStep === 6.3) {
      setGameState(prev => ({ ...prev, subStep: 6.35 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `<div style="text-align: center; font-size: 1.5em; margin: 20px 0;"><strong>P(E) = <span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="border-bottom: 2px solid currentColor; display: block; padding-bottom: 2px;">n(E)</span><span style="display: block; padding-top: 2px;">n(S)</span></span></strong></div>`
      });
      return;
    }

    // Após fórmula simbólica (subStep 6.35) → Destaque n(E) (subStep 6.36)
    if (stage === 1 && subStep === 6.35) {
      setGameState(prev => ({ ...prev, subStep: 6.36 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `<div style="text-align: center; font-size: 1.5em; margin: 20px 0;"><strong>P(E) = <span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="border-bottom: 2px solid currentColor; display: block; padding-bottom: 2px; color: #2563eb; text-decoration: underline;">n(E)</span><span style="display: block; padding-top: 2px;">n(S)</span></span></strong></div><div style="text-align: center; margin-top: 15px; padding: 10px; background-color: #dbeafe; border-radius: 8px;"><strong style="color: #2563eb;">n(E)</strong> = número de casos favoráveis ao evento E</div>`
      });
      return;
    }

    // Após destaque n(E) (subStep 6.36) → Destaque n(S) (subStep 6.37)
    if (stage === 1 && subStep === 6.36) {
      setGameState(prev => ({ ...prev, subStep: 6.37 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `<div style="text-align: center; font-size: 1.5em; margin: 20px 0;"><strong><span style="color: #7c3aed;">P(E)</span> = <span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="border-bottom: 2px solid currentColor; display: block; padding-bottom: 2px; color: #2563eb;">n(E)</span><span style="display: block; padding-top: 2px; color: #16a34a;">n(S)</span></span></strong></div><div style="text-align: center; margin-top: 15px; padding: 10px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 10px;"><strong style="color: #2563eb;">n(E)</strong> = número de casos favoráveis ao evento E</div><div style="text-align: center; padding: 10px; background-color: #dcfce7; border-radius: 8px; margin-bottom: 10px;"><strong style="color: #16a34a;">n(S)</strong> = número de casos possíveis no experimento aleatório</div><div style="text-align: center; padding: 10px; background-color: #ede9fe; border-radius: 8px;"><strong style="color: #7c3aed;">P(E)</strong> = probabilidade de ocorrer o evento E</div>`
      });
      return;
    }

    // Após destaque n(S) (subStep 6.37) → Fórmula descritiva completa (subStep 6.38)
    if (stage === 1 && subStep === 6.37) {
      setGameState(prev => ({ ...prev, subStep: 6.38 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `<div style="text-align: center; font-size: 1.2em; margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;"><strong>P(E) = <span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="border-bottom: 2px solid currentColor; display: block; padding-bottom: 4px; color: #2563eb;">número de casos favoráveis ao evento E</span><span style="display: block; padding-top: 4px; color: #16a34a;">número de casos possíveis no experimento</span></span></strong></div>`
      });
      return;
    }

    // Após fórmula descritiva (subStep 6.38) → Texto explicativo complementar (subStep 6.4)
    if (stage === 1 && subStep === 6.38) {
      setGameState(prev => ({ ...prev, subStep: 6.4 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Generalização do Teorema de Laplace',
        message: `<div style="text-align: center; font-size: 1.2em; margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;"><strong>P(E) = <span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="border-bottom: 2px solid currentColor; display: block; padding-bottom: 4px;">n(E)</span><span style="display: block; padding-top: 4px;">n(S)</span></span></strong></div><p style="text-align: justify;">Essa expressão mostra que, em um espaço amostral equiprovável, a probabilidade de um evento depende apenas da proporção entre os casos favoráveis e o total de resultados possíveis, independentemente da natureza do experimento.</p>`
      });
      return;
    }

    // Após texto complementar (subStep 6.4) → Exercício Dinâmico - Seleção de setores (subStep 6.41)
    if (stage === 1 && subStep === 6.4) {
      // Gerar evento E dinâmico para o exercício
      const n = sectors.length;
      const availableColors = sectors.map(s => s.colorName);

      // Algoritmo de seleção de k (número de cores no evento E):
      // - k varia de 2 a n
      // - k = n (evento certo) aparece com ~5% de frequência
      // - k de 2 a n-1 tem distribuição uniforme nos 95% restantes
      let k: number;
      const chanceCertainEvent = 0.05; // 5% de chance de evento certo

      if (n === 2) {
        // Se roleta tem apenas 2 cores, só pode ser k=2
        k = 2;
      } else if (Math.random() < chanceCertainEvent) {
        // ~5% de chance: evento certo (todas as cores)
        k = n;
      } else {
        // ~95% de chance: distribuição uniforme entre 2 e n-1
        k = 2 + Math.floor(Math.random() * (n - 2));
      }

      // Selecionar k cores aleatórias para o evento E
      const shuffledColors = [...availableColors].sort(() => Math.random() - 0.5);
      const exerciseE = shuffledColors.slice(0, k);

      // Gerar números aleatórios para os setores (1 a n)
      const nums = Array.from({ length: n }, (_, i) => i + 1);
      const shuffledNums = nums.sort(() => Math.random() - 0.5);

      setGameState(prev => ({
        ...prev,
        subStep: 6.41,
        exerciseEventE: exerciseE,
        selectedSectors: [],
        sectorNumbers: shuffledNums
      }));

      // Limpar inputs do exercício
      setExerciseNEInput(prev => ({ ...prev, value: '', error: false }));
      setExerciseNSInput(prev => ({ ...prev, value: '', error: false }));
      setExercisePENumeratorInput(prev => ({ ...prev, value: '', error: false }));
      setExercisePEDenominatorInput(prev => ({ ...prev, value: '', error: false }));

      const colorsText = exerciseE.join(' ou ');
      setInstructions(`<p class="ds-body"><strong>Exercício — Aplicação do Modelo Probabilístico</strong></p>
        <p class="ds-body">Clique nos casos favoráveis ao evento</p>
        <p class="ds-body"><strong>E = ocorre ${colorsText}</strong></p>`);

      setShowInfoBox(false);
      return;
    }

    // SubStep 6.45 → Ir para conceito de Eventos Mutuamente Exclusivos (subStep 6.55)
    if (stage === 1 && subStep === 6.45) {
      // Gerar números temporários para os exemplos de eventos disjuntos
      const n = sectors.length;
      const pMin = n;
      const pMax = 12;
      const pTemp = pMin + Math.floor(Math.random() * (pMax - pMin + 1));
      const tempNums = generateSectorNumbers(n, pTemp);

      // Gerar primeiro exemplo disjunto com algoritmo anti-clichê
      const exampleText = generateDisjointExample(sectors, tempNums, null);

      setGameState(prev => ({
        ...prev,
        subStep: 6.55,
        challenge1SectorNumbers: tempNums
      }));

      setDisjointExamplesViewed(1);
      setLastDisjointMeta(exampleText.meta);
      setDisjointNeedsNumbers(exampleText.needsNumbers);

      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Eventos Mutuamente Exclusivos',
        message: `Dois eventos A e B são <strong>mutuamente exclusivos</strong> (ou disjuntos) quando não podem acontecer ao mesmo tempo no mesmo experimento.<br/><br/>Em outras palavras: se A acontece, B não acontece (e vice-versa). Dizemos que eles não têm resultados em comum.<br/><br/>Na notação: <strong>A ∩ B = <span style="font-size: 1.4em;">∅</span></strong> (a interseção é vazia).<br/><br/><hr style="margin: 8px 0;"/><strong>Exemplo no disco:</strong><br/>A = ${exampleText.textA} → ${exampleText.setA}<br/>B = ${exampleText.textB} → ${exampleText.setB}<br/><br/><strong>A ∩ B = <span style="font-size: 1.4em;">∅</span></strong> (nenhum resultado em comum)`
      });

      setInstructions(`<p class="ds-body"><strong>Conceito: Eventos Mutuamente Exclusivos</strong></p>
        <p class="ds-body">Leia a definição e observe os exemplos no card ao lado.</p>`);

      return;
    }

    // SubStep 6.55 → Após ler conceito de Eventos Disjuntos, ir para Probabilidade da União (subStep 6.56)
    if (stage === 1 && subStep === 6.55) {
      // Resetar estado do exercício interativo de disjuntos
      setDisjointExercisePhase('none');
      setDisjointUserSelectA([]);
      setDisjointUserSelectB([]);
      setDisjointNeedsNumbers(false);

      // Iniciar fase de Probabilidade da União
      const maxAct = Math.min(6, sectors.length);
      setUnionMaxActivities(maxAct);
      setUnionPhase('definition1');
      setUnionActivityNum(1);
      setUnionEvents([]);
      setUnionSelectedSectors([]);

      setGameState(prev => ({ ...prev, subStep: 6.56 }));

      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Probabilidade da União de Eventos Mutuamente Exclusivos',
        message: `Você aprendeu que dois eventos A e B são <strong>mutuamente exclusivos</strong> quando <strong>A ∩ B = ∅</strong> (não têm resultados em comum).<br/><br/>A <strong>união</strong> de dois eventos, A ∪ B, é o evento que ocorre quando <strong>A acontece, ou B acontece, ou ambos</strong>.<br/><br/>Mas, se os eventos forem mutuamente exclusivos, o caso "ambos" <strong>não existe</strong>. Logo, <strong>A ∪ B</strong> significa simplesmente "A ou B".`
      });

      setInstructions(`<p class="ds-body"><strong>Probabilidade da União</strong></p>
        <p class="ds-body">Leia a definição no card ao lado.</p>`);
      return;
    }

    // SubStep 6.56 → Probabilidade da União: definições e exercícios
    if (stage === 1 && subStep === 6.56) {
      if (unionPhase === 'definition1') {
        setUnionPhase('definition2');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Probabilidade da União de Eventos Mutuamente Exclusivos',
          message: `<strong>Regra:</strong> Se A e B são mutuamente exclusivos, então:<br/><br/><div style="text-align: center; font-size: 1.1em;"><strong>P(A ∪ B) = P(A) + P(B)</strong></div><br/>De forma geral, para qualquer quantidade de eventos mutuamente exclusivos:<br/><br/><div style="text-align: center; font-size: 1.1em;"><strong>P(A ∪ B ∪ C ∪ ⋯) = P(A) + P(B) + P(C) + ⋯</strong></div><br/><hr style="margin: 8px 0;"/><strong>Observação (Laplace):</strong> Como os eventos não compartilham resultados:<br/><div style="text-align: center;"><strong>n(A ∪ B ∪ ⋯) = n(A) + n(B) + ⋯</strong></div><br/>Daí vem naturalmente a soma das probabilidades.`
        });
        return;
      }

      if (unionPhase === 'definition2') {
        setShowInfoBox(false);
        setUnionActivityNum(1);
        initUnionActivity(1);
        return;
      }

      if (unionPhase === 'activity_success') {
        handleUnionNextActivity();
        return;
      }

      if (unionPhase === 'all_done') {
        // Resetar estado da união
        setUnionPhase('definition1');
        setUnionEvents([]);
        setUnionSelectedSectors([]);
        setShowInfoBox(false);

        // Transição para Desafio Dinâmico 1 (subStep 6.6) — reusar restartDesafio1
        restartChallenge1Ref.current();
        return;
      }

      return;
    }

    // SubStep 6.65 → Após acertar seleção, ir para contagem n(E) (subStep 6.66)
    if (stage === 1 && subStep === 6.65) {
      setGameState(prev => ({
        ...prev,
        subStep: 6.66
      }));

      // Limpar input n(E)
      setExerciseNEInput(prev => ({ ...prev, value: '', error: false }));

      setShowInfoBox(false);

      setInstructions(`<p class="ds-body"><strong>Desafio — Contagem de Casos</strong></p>
        <p class="ds-body">Digite o número de casos favoráveis ao evento.</p>`);
      return;
    }

    // SubStep 6.66 → Após acertar n(E), ir para n(S) (subStep 6.67)
    if (stage === 1 && subStep === 6.66) {
      setGameState(prev => ({
        ...prev,
        subStep: 6.67
      }));

      // Limpar input n(S)
      setExerciseNSInput(prev => ({ ...prev, value: '', error: false }));

      setShowInfoBox(false);

      setInstructions(`<p class="ds-body"><strong>Desafio — Casos Possíveis</strong></p>
        <p class="ds-body">Digite o número de resultados possíveis do experimento.</p>`);
      return;
    }

    // SubStep 6.67 → Após acertar n(S), ir para P(E) (subStep 6.68)
    if (stage === 1 && subStep === 6.67) {
      setGameState(prev => ({
        ...prev,
        subStep: 6.68
      }));

      // Limpar inputs de P(E)
      setExercisePENumeratorInput(prev => ({ ...prev, value: '', error: false }));
      setExercisePEDenominatorInput(prev => ({ ...prev, value: '', error: false }));

      setShowInfoBox(false);

      setInstructions(`<p class="ds-body"><strong>Desafio — Probabilidade</strong></p>
        <p class="ds-body">Agora calcule a probabilidade.</p>`);
      return;
    }

    // SubStep 6.69 → Após parabéns do desafio, ir para Eventos Complementares (6.70)
    if (stage === 1 && subStep === 6.69) {
      initComplementaryPhaseRef.current();
      return;
    }

    // SubStep 6.70 — Eventos Complementares (Parte 1)
    if (stage === 1 && subStep === 6.70) {
      if (compPhase === 'intro') {
        // Após ler conceito, ir para exercício interativo
        handleStartCompExerciseRef.current();
        return;
      }
      if (compPhase === 'show_both' && compExamplesViewed >= 3) {
        // Após 3+ exemplos, avançar para formalização
        setGameState(prev => ({ ...prev, subStep: 6.80 }));
        setCompPhase('formalize1');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Formalização — Passo 1',
          message: `Como os eventos <span style="white-space:nowrap">A e Ā</span> (complementar de A) cobrem todo o espaço amostral sem sobreposição, temos:<br/><br/><strong>P(A ∪ Ā) = P(S)</strong><br/><br/>A probabilidade de A ou Ā ocorrer é a probabilidade do espaço amostral inteiro.<br/><br/><span class="ds-body" style="font-weight:bold;color:#000"><span style="white-space:nowrap">A e Ā</span> são eventos complementares, pois <span style="white-space:nowrap">A ∪ Ā = S (espaço amostral)</span> e <span style="white-space:nowrap">A ∩ Ā = ∅</span>.</span>`
        });
        setInstructions(`<p class="ds-body"><strong>Formalização – Probabilidade de Eventos Complementares</strong></p>
          <p class="ds-body">Leia a formalização no balão ao lado.</p>`);
        return;
      }
    }

    // SubStep 6.80 — Formalização progressiva
    if (stage === 1 && subStep === 6.80) {
      if (compPhase === 'formalize1') {
        setCompPhase('formalize2');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Formalização — Passo 2',
          message: `Como o espaço amostral contém todos os resultados possíveis:<br/><br/><strong>P(S) = P(A ∪ Ā) = 1</strong> (Probabilidade do Evento Certo)<br/><br/>A probabilidade de algum resultado do espaço amostral (S) é 1 (Certeza).`
        });
        return;
      }
      if (compPhase === 'formalize2') {
        setCompPhase('formalize3');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Formalização — Passo 3',
          message: `Como A e Ā são mutuamente exclusivos (não podem ocorrer ao mesmo tempo):<br/><br/><strong>P(A ∪ Ā) = P(A) + P(Ā) = 1</strong><br/><br/>A probabilidade da união de dois eventos complementares é a soma das probabilidades de cada um dos eventos ocorrer separadamente.`
        });
        return;
      }
      if (compPhase === 'formalize3') {
        setCompPhase('formalize4');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Formalização — Resultado Final',
          message: `Combinando os passos anteriores:<br/><br/>P(A) + P(Ā) = 1<br/><br/>Portanto:<br/><br/><strong style="font-size:1.2em">P(Ā) = 1 − P(A)</strong><br/><br/>A probabilidade do complementar de A é 1 menos a probabilidade de A.`
        });
        setInstructions(`<p class="ds-body"><strong>Cálculo da Probabilidade de Eventos Complementares</strong></p>
          <p class="ds-body">Leia a formalização no balão ao lado.</p>`);
        return;
      }
      if (compPhase === 'formalize4') {
        // Avançar para cálculo guiado (Parte 3)
        initCompCalcExampleRef.current(true);
        return;
      }
    }

    // SubSteps 6.85 / 6.90 — Calc: enunciado → selecionar setores de A
    if (stage === 1 && (subStep === 6.85 || subStep === 6.90) && compPhase === 'calc_enunciado') {
      const ev = gameState.compEventA;
      if (!ev) return;
      setCompPhase('calc_selectA');
      if (compIsGuided) {
        setShowInfoBox(false);
        setInstructions(`<p class="ds-body"><strong>Cálculo da Probabilidade de Eventos Complementares</strong></p>
          <p class="ds-body">Selecione os setores do evento A no disco e clique em Conferir.</p>`);
      } else {
        setShowInfoBox(false);
        setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
          <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
      }
      return;
    }

    // SubSteps 6.87 / 6.92 — Calc: showBoth → cadeia de cálculo
    if (stage === 1 && (subStep === 6.87 || subStep === 6.92)) {
      if (compPhase === 'calc_showBoth') {
        const guided = subStep === 6.87;
        setCompPhase('calc_chain');
        setGameState(prev => ({ ...prev, subStep: guided ? 6.88 : 6.93 }));
        setCompChainInputs({
          n1: '', d1: '', n2: '', d2: '',
          finalNum: '', finalDen: '',
          errN1: false, errD1: false, errN2: false, errD2: false,
          errFinalNum: false, errFinalDen: false,
        });
        setCompChainResult(null);
        if (guided) {
          setShowInfoBox(false);
          setInstructions(`<p class="ds-body"><strong>Cálculo da probabilidade do complementar a partir de P(A)</strong></p>
            <p class="ds-body">Preencha as frações para calcular P(Ā) = 1 − P(A).</p>`);
        } else {
          playSound("/sounds/nextChallenge.mp3");
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'info',
            title: 'Cálculo de P(Ā)',
            message: `Continue com o cálculo do complementar de A.`
          });
          setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
            <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
        }
        return;
      }
    }

    // SubStep 11.5 — Lei dos Grandes Números → Definição de Probabilidade (subStep 11.6)
    if (stage === 1 && subStep === 11.5) {
      const n = targetSectorCount;
      setGameState(prev => ({ ...prev, subStep: 11.6 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Definição Frequentista de Probabilidade',
        message: `A probabilidade de um evento é um número entre 0 e 1 que indica a chance de ele ocorrer e corresponde ao valor para o qual a frequência relativa desse evento se aproxima quando o experimento é repetido um número muito grande de vezes, nas mesmas condições.<br/><br/>Neste exemplo, a probabilidade de o ponteiro indicar um determinado setor após girar o disco é <strong>1/${n}</strong>.`
      });
      return;
    }

    // SubStep 11.6 — Definição de Probabilidade → Generalização (subStep 12)
    if (stage === 1 && subStep === 11.6) {
      // Sortear k para pergunta teórica
      const k = Math.floor(Math.random() * 41) + 10; // 10 a 50

      setGameState(prev => ({ ...prev, subStep: 12, theoreticalK: k }));
      setTheoreticalQuestion1Input({ value: '', disabled: false, error: false, setValue: (val: string) => setTheoreticalQuestion1Input(prev => ({ ...prev, value: val })) });

      setInstructions(`<p class="ds-body"><strong>Generalização</strong></p>
        <p class="ds-body">Responda a pergunta teórica abaixo.</p>`);
      return;
    }
  }, [gameState, unionPhase, initUnionActivity, handleUnionNextActivity, compPhase, compIsGuided, compExamplesViewed, compCalcExampleNum, progressiveReadingStep, showUncertaintyQuestion]);

  // Função para iniciar giros automáticos
  const startAutoSpins = useCallback((batchSize: number) => {
    if (gameState.isAutoSpinning) return;

    setGameState(prev => ({ ...prev, isAutoSpinning: true, isSpinning: true }));
    setDisabledSpinButton(true);

    let spinsCompleted = 0;
    const targetSpins = batchSize;
    const spinDuration = 300; // 300ms por giro
    const pauseDuration = 300; // 300ms de pausa entre giros

    // Som contínuo durante os giros
    playSound("/sounds/nextChallenge.mp3");

    const doSpin = () => {
      if (spinsCompleted >= targetSpins) {
        setGameState(prev => {
          const isS2 = prev.stage === 2;
          const newBatchIndex = isS2 ? prev.s2AutoBatchIndex + 1 : prev.currentAutoBatchIndex + 1;
          return {
            ...prev,
            isAutoSpinning: false,
            isSpinning: false,
            ...(isS2 ? { s2AutoBatchIndex: newBatchIndex, currentAutoBatchIndex: newBatchIndex } : { currentAutoBatchIndex: newBatchIndex })
          };
        });

        playSound("/sounds/challengeFinished.mp3");

        // Verificar se completou todos os blocos
        const batches = gameState.stage === 2 ? gameState.s2AutoBatches : gameState.autoSpinBatches;
        const batchIdx = gameState.stage === 2 ? gameState.s2AutoBatchIndex : gameState.currentAutoBatchIndex;
        if (batchIdx + 1 >= batches.length) {
          // Completou todos os giros automáticos
          setShowAutoSpinButtons(false);
          if (gameState.stage === 2) {
            // Stage 2: pergunta de conclusão
            setGameState(prev => ({ ...prev, subStep: 11 }));
            setInstructions(`<p class="ds-body"><strong>Conclusão</strong></p>
              <p class="ds-body">À medida que o número de giros aumenta, as frequências relativas se aproximam de quais valores?</p>`);
          } else {
            setConvergenceInputs({
              convergence: {
                value: '',
                disabled: false,
                error: false,
                setValue: (val: string) => setConvergenceInputs(prev => ({
                  ...prev,
                  convergence: { ...prev.convergence, value: val }
                }))
              }
            });
            setGameState(prev => ({ ...prev, subStep: 11 }));
            setInstructions(`<p class="ds-body"><strong>Convergência das Frequências Relativas</strong></p>
              <p class="ds-body">Observe o histograma e responda a pergunta abaixo.</p>`);
          }
        }

        return;
      }

      // Simular giro rápido com animação do disco
      // Stage 2: usar seleção ponderada pelo ângulo; Stage 1: equiprovável
      const randomColor = gameState.stage === 2
        ? weightedRandomColor(gameState.sectors)
        : gameState.sectors[Math.floor(Math.random() * gameState.sectors.length)].colorName;

      // Calcular ângulo para a cor sorteada
      const colorIndex = gameState.sectors.findIndex(s => s.colorName === randomColor);
      // Calcular ângulo acumulado até o meio do setor
      let accAngle = 0;
      for (let i = 0; i < colorIndex; i++) accAngle += gameState.sectors[i].angle;
      const targetSectorAngle = accAngle + gameState.sectors[colorIndex].angle / 2;
      const extraRotations = 1; // Uma volta completa

      setGameState(prev => {
        const newFrequencies = { ...prev.frequencies };
        newFrequencies[randomColor] = (newFrequencies[randomColor] || 0) + 1;
        // Calcula a rotação final desejada (mod 360) que coloca o setor no topo
        // e soma o delta a partir da rotação atual — sem isso, ao acumular giros
        // a roleta pára visualmente em uma cor diferente da `selectedColor`.
        const desiredFinalRotation = (360 - targetSectorAngle + 360) % 360;
        const currentMod360 = ((prev.currentRotation || 0) % 360 + 360) % 360;
        const deltaToTarget = (desiredFinalRotation - currentMod360 + 360) % 360;
        const newTargetAngle = (prev.currentRotation || 0) + extraRotations * 360 + deltaToTarget;

        return {
          ...prev,
          frequencies: newFrequencies,
          totalSpins: prev.totalSpins + 1,
          selectedColor: randomColor,
          targetAngle: newTargetAngle,
          currentRotation: newTargetAngle,
          spinDuration: spinDuration
        };
      });

      spinsCompleted++;

      // Próximo giro após duração do giro (300ms) + pausa (300ms) = 600ms total
      setTimeout(doSpin, spinDuration + pauseDuration);
    };

    doSpin();
  }, [gameState]);

  // Função para obter dados de frequência para a tabela
  const getFrequencyData = useCallback((): FrequencyData[] => {
    const { stage, sectors, frequencies, totalSpins, targetSectorCount, s2Angles } = gameState;

    return sectors.map((sector, idx) => {
      const absFreq = frequencies[sector.colorName] || 0;
      const relFreq = totalSpins > 0 ? absFreq / totalSpins : 0;
      const relFreqPercent = totalSpins > 0 ? (relFreq * 100).toFixed(1) + '%' : '-';

      // Stage 2: probabilidade teórica = θ/360
      const theorProb = stage === 2 && s2Angles.length > idx
        ? `${s2Angles[idx]}/360`
        : `1/${targetSectorCount}`;
      const theorProbVal = stage === 2 && s2Angles.length > idx
        ? s2Angles[idx] / 360
        : 1 / targetSectorCount;
      const theorProbPercent = (theorProbVal * 100).toFixed(1) + '%';

      return {
        colorName: sector.colorName,
        absoluteFrequency: absFreq,
        relativeFrequency: totalSpins > 0 ? `${absFreq}/${totalSpins}` : '-',
        relativeFrequencyPercent: relFreqPercent,
        theoreticalProbability: theorProb,
        theoreticalProbabilityPercent: theorProbPercent
      };
    });
  }, [gameState]);

  // Função para obter dados do gráfico
  const getChartData = useCallback((): ChartData[] => {
    const { stage, sectors, frequencies, totalSpins, targetSectorCount, s2Angles } = gameState;

    return sectors.map((sector, idx) => {
      const absFreq = frequencies[sector.colorName] || 0;
      const relFreq = totalSpins > 0 ? absFreq / totalSpins : 0;

      const theorProb = stage === 2 && s2Angles.length > idx
        ? s2Angles[idx] / 360
        : 1 / targetSectorCount;

      return {
        colorName: sector.colorName,
        relativeFrequency: relFreq,
        theoreticalProbability: theorProb,
        absoluteFrequency: absFreq,
        relativeFrequencyLabel: totalSpins > 0 ? `${absFreq}/${totalSpins}` : '-'
      };
    });
  }, [gameState]);

  // Função para próximo passo
  const nextStep = useCallback(() => {
    if (gameState.stage === 1 && gameState.stage2Available) {
      startStage2();
    }
  }, [gameState]);

  // Função para iniciar Etapa 2
  const startStage2 = useCallback(() => {
    // Sortear k ∈ {2,3,4,5,6}
    const targetK = Math.floor(Math.random() * 5) + 2;

    // Resetar todos os inputs da Etapa 2
    setS2RatioInputs({});
    setS2IxInputs({});
    setS2SumEquationInput({ value: '', disabled: false, error: false, setValue: (val: string) => setS2SumEquationInput(prev => ({ ...prev, value: val })) });
    setS2XInput({ value: '', disabled: false, error: false, setValue: (val: string) => setS2XInput(prev => ({ ...prev, value: val })) });
    setS2NumProbInputs({});
    setS2AngleProbInputs({});
    setS2PredictionInput({ value: '', disabled: false, error: false, setValue: (val: string) => setS2PredictionInput(prev => ({ ...prev, value: val })) });
    setS2FreqAbsInputs({});
    setS2FreqRelInputs({});
    setS2ConclusionInput({ value: '', disabled: false, error: false, setValue: (val: string) => setS2ConclusionInput(prev => ({ ...prev, value: val })) });
    setSliderValue(1);
    setSelectedOption('');
    setCurrentQuestion(null);
    setSampleSpaceInput({ value: '', disabled: false, error: false });
    setSampleSpaceCountInput({ value: '', disabled: false, error: false });
    setShowInfoBox(false);
    setDisabledSpinButton(true);
    setDisabledCheckButton(false);
    setDisabledNextButton(true);
    setShowAutoSpinButtons(false);
    setSuboptimalAttempts(0);
    // Reset treinos
    setTrainingState({
      active: false, currentTraining: 0, phase: 'idle',
      k: 0, m: 0, ki: [], angles: [], S: 0, sectors: [],
      usedKValues: [], tableIndex: 0, calcStep: 0,
      originalSectors: [], originalK: 0, originalM: 0, originalKi: [], originalAngles: [], originalSumI: 0,
    });
    setTrainRatioInputs({});
    setTrainIxInputs({});
    setTrainSumInput({ value: '', disabled: true, error: false, setValue: (val: string) => setTrainSumInput(prev => ({ ...prev, value: val })) });
    setTrainProbInputs({});
    // Reset treinos de fração
    setFracTraining({
      currentTraining: 0, completedCount: 0,
      k: 0, angles: [], colors: [], allCorrect: false, usedKValues: [],
      originalSectors: []
    });
    setFracThetaInputs({});
    setConvergenceSim({ currentBlock: 0, running: false, progress: 0 });
    setS2SpinReflection({ spin1Color: '', spin2Color: '', bet1Color: '', bet2Color: '', answer1: '', answer2: '', selectedOption: '', phase: 'betting', betConstraint: 'none' });

    setGameState(prev => ({
      ...prev,
      stage: 2,
      subStep: 0,
      targetSectorCount: targetK,
      sectors: [],
      showDivisions: false,
      isSpinning: false,
      targetAngle: 0,
      currentRotation: 0,
      selectedColor: null,
      frequencies: {},
      totalSpins: 0,
      showAngles: true,
      showNumbers: false,
      pendingRegistration: false,
      isAutoSpinning: false,
      autoSpinBatches: [50, 100, 150, 200],
      currentAutoBatchIndex: 0,
      manualSpinsDone: 0,
      selectedSectors: [],
      // Etapa 2 fields
      s2K: targetK,
      s2M: 0,
      s2Ki: [],
      s2Angles: [],
      s2SumI: 0,
      s2X: 0,
      s2TableIndex: 0,
      s2ManualSpinsP: 0,
      s2PredictionColor: '',
      s2PredictionValue: '',
      s2AutoBatches: [50, 100, 200, 500],
      s2AutoBatchIndex: 0,
      s2AngleProbDecimals: [],
      s2AngleProbPercents: []
    }));

    setInstructions(`<p class="ds-body"><strong>Etapa 2 — Probabilidade Não Equiprovável</strong></p>
      <p class="ds-body">Use o controle deslizante para dividir o disco em <strong>${targetK}</strong> setores e clique em <strong>Confirmar</strong>.</p>`);

    // InfoBox de transição: ruptura do contrato didático (Brousseau)
    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'concept',
      title: 'Transição para a Etapa 2',
      message: 'Na etapa anterior, você trabalhou com um disco dividido em <strong>setores de mesmo tamanho</strong>. Por isso, todas as cores tinham a <strong>mesma probabilidade</strong> de serem sorteadas.<br/><br/>Na próxima etapa, os setores terão <strong>tamanhos diferentes</strong>. Observe com atenção: <strong>como isso pode afetar as chances de cada cor?</strong>'
    });
  }, []);

  // Função para iniciar Etapa 3
  const startStage3 = useCallback(() => {
    const roulette = generateS3Roulette();
    const distinctColors = Object.keys(roulette.colorCounts);

    // Inicializar inputs de probabilidade
    const probInputs: { [color: string]: { num: string; den: string; errorNum: boolean; errorDen: boolean; status: 'pending' | 'correct'; errorMsg: string } } = {};
    distinctColors.forEach(c => {
      probInputs[c] = { num: '', den: '', errorNum: false, errorDen: false, status: 'pending', errorMsg: '' };
    });

    setS3State({
      n: roulette.sectors.length,
      colorCounts: roulette.colorCounts,
      mostFreqColor: roulette.mostFreqColor,
      secondFreqColor: roulette.secondFreqColor,
      predictionColor: '',
      betColor: '',
      betSector: -1,
      countInputs: {},
      probInputs,
      spinHistory: [], spinCount: 0, perceptionAnswer: '', newBetColor: ''
    });

    setGameState(prev => ({
      ...prev,
      stage: 3,
      subStep: 0.5,
      sectors: roulette.sectors,
      currentRotation: 0,
      selectedSectors: [],
      isSpinning: false,
      isAutoSpinning: false,
      showDivisions: true,
      showNumbers: true,
      showAngles: false
    }));

    setSelectedOption('');
    setShowInfoBox(false);
    playSound("/sounds/nextChallenge.mp3");

    setInstructions(`<p class="ds-body"><strong>Etapa 3 — Espaços Amostrais e Vieses Cognitivos</strong></p>
      <p class="ds-body">Observe o disco com atenção antes de prosseguir.</p>`);

    // InfoBox de transição: ruptura do contrato didático (Brousseau)
    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'concept',
      title: 'Transição para a Etapa 3',
      message: 'Nas etapas anteriores, cada cor aparecia em <strong>apenas um setor</strong> do disco. Na Etapa 1, os setores tinham o mesmo tamanho; na Etapa 2, tamanhos diferentes.<br/><br/>Na próxima etapa, os setores terão o <strong>mesmo tamanho</strong>, mas <strong>algumas cores se repetirão</strong> em mais de um setor. Isso muda as chances de cada cor?'
    });
  }, []);

  // Handler: confirmar previsão visual (subStep 0.5 → subStep 1)
  const handleS3ConfirmPrediction = useCallback((predictionColor: string) => {
    setS3State(prev => ({ ...prev, predictionColor }));
    setGameState(prev => ({ ...prev, subStep: 1 }));
    setInstructions(`<p class="ds-body"><strong>Etapa 3 — Espaços Amostrais e Vieses Cognitivos</strong></p>
      <p class="ds-body">Agora, se você pudesse apostar antes de girar, em qual cor apostaria?</p>
      <p class="ds-body"><strong>Clique no setor do disco</strong> para fazer sua aposta.</p>`);
  }, []);

  // Handler: aluno clica num setor para apostar (Etapa 3, subStep 1)
  const handleS3SectorBet = useCallback((sectorIndex: number) => {
    if (gameState.stage !== 3 || gameState.subStep !== 1) return;
    const sector = gameState.sectors[sectorIndex];
    if (!sector) return;

    logBet(gameState.stage, gameState.subStep, sector.colorName);

    setS3State(prev => ({
      ...prev,
      betColor: sector.colorName,
      betSector: sectorIndex
    }));

    setGameState(prev => ({
      ...prev,
      selectedSectors: [sectorIndex]
    }));
  }, [gameState.stage, gameState.subStep, gameState.sectors]);

  // Handler: confirmar aposta → avançar para questão diagnóstica
  const handleS3ConfirmBet = useCallback(() => {
    if (!s3State.betColor) return;

    playSound("/sounds/correct.mp3");
    createAlert("Aposta registrada!", `Você apostou na cor ${s3State.betColor}. Agora justifique sua escolha.`, "success", 3000);
    setGameState(prev => ({
      ...prev,
      subStep: 1.5,
      selectedSectors: []
    }));
    setSelectedOption('');

    // Verificar empate
    const maxCount = Math.max(...Object.values(s3State.colorCounts));
    const maxColors = Object.entries(s3State.colorCounts).filter(([, c]) => c === maxCount).map(([color]) => color);
    const hasTie = maxColors.length > 1;

    // Sortear 1 frase de cada conjunto
    const phraseA = S3_DIAG_A[Math.floor(Math.random() * S3_DIAG_A.length)];
    const phraseB = S3_DIAG_B[Math.floor(Math.random() * S3_DIAG_B.length)];
    const phraseI = S3_DIAG_I[Math.floor(Math.random() * S3_DIAG_I.length)];

    // Montar 3 opções com tipo identificado, embaralhar posições
    const opts: { label: string; isCorrect: boolean; kind: 'A' | 'B' | 'I' }[] = [
      { label: phraseA, isCorrect: true, kind: 'A' },
      { label: phraseB, isCorrect: false, kind: 'B' },
      { label: phraseI, isCorrect: false, kind: 'I' }
    ];
    // Fisher-Yates shuffle para embaralhar as 3 posições
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    // Atribuir values A, B, C conforme posição final e identificar a correctAnswer
    const values = ['A', 'B', 'C'];
    let correctValue = 'A';
    const finalOptions = opts.map((o, idx) => {
      if (o.isCorrect) correctValue = values[idx];
      return { value: values[idx], label: o.label, isCorrect: o.isCorrect };
    });

    const currentQ = {
      question: 'Qual foi o principal motivo da sua escolha?',
      options: finalOptions,
      correctAnswer: correctValue
    };
    setCurrentQuestion(currentQ);

    let instrHtml = `<p class="ds-body"><strong>Questão Diagnóstica</strong></p>
      <p class="ds-body">Você apostou na cor <strong>${s3State.betColor}</strong> (Setor ${s3State.betSector + 1}).</p>`;
    if (hasTie) {
      instrHtml += `<p class="ds-body"><em>Observação: Mais de uma cor possui a maior quantidade de setores, portanto existem várias escolhas igualmente vantajosas.</em></p>`;
    }
    instrHtml += `<p class="ds-body">Selecione a alternativa que melhor justifica sua escolha.</p>`;
    setInstructions(instrHtml);
  }, [s3State]);

  // Handler: finalizar Etapa 3 (institucionalização)
  const handleS3Finalize = useCallback(() => {
    playSound("/sounds/gameFinished.mp3");
    createAlert("Parabéns!", "Você concluiu todas as etapas do Simulador Probabilístico com Disco Aleatório!", "success", 6000);
    setGameState(prev => ({ ...prev, subStep: 10 }));
    setInstructions(`<p class="ds-body"><strong>Atividade Finalizada!</strong></p>
      <p class="ds-body">Você completou todas as 3 etapas do simulador. Parabéns!</p>`);
  }, [createAlert]);

  // Handler: avançar para reflexão de ponte com OVA 2 (subStep 11)
  const handleS3GoToReflection = useCallback(() => {
    setGameState(prev => ({ ...prev, subStep: 11 }));
    setInstructions(`<p class="ds-body"><strong>Reflexão para o próximo desafio</strong></p>`);
  }, []);

  // Função para iniciar Etapa 1
  const startStage1 = useCallback(() => {
    startGame();
  }, [startGame]);

  // Função para reiniciar o exercício dinâmico (treinar novamente)
  const restartExercise = useCallback(() => {
    // Limpar seleções e inputs
    setExerciseNEInput(prev => ({ ...prev, value: '', error: false }));
    setExerciseNSInput(prev => ({ ...prev, value: '', error: false }));
    setExercisePENumeratorInput(prev => ({ ...prev, value: '', error: false }));
    setExercisePEDenominatorInput(prev => ({ ...prev, value: '', error: false }));
    setShowInfoBox(false);

    // Gerar novo evento E diretamente aqui, garantindo cardinalidade diferente do anterior
    setGameState(prev => {
      const n = prev.sectors.length;
      const availableColors = prev.sectors.map(s => s.colorName);
      const previousCardinality = prev.exerciseEventE.length;

      let k: number;

      if (n === 2) {
        // Roleta com 2 partes: primeira vez foi k=2, segunda vez deve ser k=1
        k = 1;
      } else {
        // Para n > 2: escolher uma cardinalidade diferente da anterior
        // Possíveis valores: 1 a n, excluindo a cardinalidade anterior
        const possibleK = [];
        for (let i = 1; i <= n; i++) {
          if (i !== previousCardinality) {
            possibleK.push(i);
          }
        }
        // Escolher aleatoriamente entre os possíveis valores
        k = possibleK[Math.floor(Math.random() * possibleK.length)];
      }

      // Selecionar k cores aleatórias
      const shuffledColors = [...availableColors].sort(() => Math.random() - 0.5);
      const newEventE = shuffledColors.slice(0, k);

      // Gerar novos números aleatórios para os setores
      const nums = Array.from({ length: n }, (_, i) => i + 1);
      const shuffledNums = nums.sort(() => Math.random() - 0.5);

      // Atualizar instruções (singular se apenas uma cor)
      const colorsText = newEventE.length === 1
        ? newEventE[0]
        : newEventE.join(' ou ');
      setInstructions(`<p class="ds-body"><strong>Exercício — Aplicação do Modelo Probabilístico</strong></p>
        <p class="ds-body">Clique nos casos favoráveis ao evento</p>
        <p class="ds-body"><strong>E = ocorre ${colorsText}</strong></p>`);

      return {
        ...prev,
        subStep: 6.41,
        selectedSectors: [],
        exerciseEventE: newEventE,
        sectorNumbers: shuffledNums
      };
    });
  }, []);

  // Função para reiniciar o Desafio Dinâmico 1 (treinar novamente)
  const restartChallenge1 = useCallback(() => {
    // Limpar seleções e inputs
    setExerciseNEInput(prev => ({ ...prev, value: '', error: false }));
    setExerciseNSInput(prev => ({ ...prev, value: '', error: false }));
    setExercisePENumeratorInput(prev => ({ ...prev, value: '', error: false }));
    setExercisePEDenominatorInput(prev => ({ ...prev, value: '', error: false }));
    setShowInfoBox(false);

    // Gerar novo desafio com conectivo variável
    setGameState(prev => {
      const n = prev.sectors.length;

      // Definir p tal que n ≤ p ≤ 12 (para geração de números)
      const pMin = n;
      const pMax = 12;
      const pNums = pMin + Math.floor(Math.random() * (pMax - pMin + 1));

      // Sortear conectivo lógico (e / ou)
      const connective: 'e' | 'ou' = Math.random() < 0.5 ? 'e' : 'ou';

      // Função para verificar se existe caso favorável baseado no conectivo
      const verifyEventValid = (
        sectorNums: number[],
        propertyY: string,
        colorsX: string[],
        typeX: 'inclusao' | 'exclusao',
        connective: 'e' | 'ou',
        valueP: number
      ): boolean => {
        let foundFavorable = false;
        prev.sectors.forEach((sector, index) => {
          // Para tipo 'exclusao', cores em X são as que NÃO estão na lista
          const colorSatisfies = typeX === 'inclusao'
            ? colorsX.includes(sector.colorName)
            : !colorsX.includes(sector.colorName);
          const numberSatisfies = checkProperty(sectorNums[index], propertyY, valueP);

          if (connective === 'ou') {
            if (colorSatisfies || numberSatisfies) {
              foundFavorable = true;
            }
          } else {
            if (colorSatisfies && numberSatisfies) {
              foundFavorable = true;
            }
          }
        });
        return foundFavorable;
      };

      // Função para gerar o desafio garantindo evento não-vazio
      const generateValidChallenge = () => {
        let attempts = 0;
        const maxAttempts = 200;

        while (attempts < maxAttempts) {
          // Gerar números distintos para os setores
          const sectorNums = generateSectorNumbers(n, pNums);

          // Sortear propriedade Y
          let propertyY = NUMERIC_PROPERTIES[Math.floor(Math.random() * NUMERIC_PROPERTIES.length)];

          // Se for "maior que p" ou "menor que p", sortear valor de p (2 a 11)
          let valueP = 0;
          if (propertyY === 'maior que p' || propertyY === 'menor que p') {
            // p ∈ {2, 3, 4, 5, 6, 7, 8, 9, 10, 11}
            valueP = 2 + Math.floor(Math.random() * 10);

            // Verificar se existe pelo menos um caso favorável para essa propriedade
            if (!hasFavorableCase(sectorNums, propertyY, valueP)) {
              attempts++;
              continue; // Tentar novamente
            }

            // Atualizar texto da propriedade com o valor de p
            propertyY = propertyY === 'maior que p' ? `maior que ${valueP}` : `menor que ${valueP}`;
          } else {
            // Verificar se existe pelo menos um caso favorável para Y
            if (!hasFavorableCase(sectorNums, propertyY)) {
              attempts++;
              continue;
            }
          }

          // Construção dinâmica de X (evento de cores)
          const availableColors = prev.sectors.map(s => s.colorName);
          const maxK = Math.min(4, n);
          const k = 1 + Math.floor(Math.random() * maxK);

          // Sortear k cores distintas
          const shuffledColors = [...availableColors].sort(() => Math.random() - 0.5);
          const drawnColors = shuffledColors.slice(0, k);

          // Sortear forma textual de X
          // IMPORTANTE: Quando conectivo é "E", usar apenas formas sem "ou" no texto
          let effectiveColors: string[];
          let typeX: 'inclusao' | 'exclusao';
          let eventXText: string;

          if (connective === 'e') {
            // Nova geração via generateIntersectionChallenge — será tratada fora do loop
            // Usar fallback simples aqui (será substituído abaixo)
            effectiveColors = [drawnColors[0]];
            typeX = 'inclusao';
            eventXText = `a cor ${drawnColors[0]}`;
          } else {
            // Para conectivo "OU": pode usar qualquer forma (incluindo múltiplas cores)
            const totalForms = k + 1; // k formas de inclusão + 1 de exclusão
            const formIndex = Math.floor(Math.random() * totalForms);

            if (formIndex < k) {
              // Formas de inclusão (a cor X, a cor X ou Y, etc.)
              effectiveColors = drawnColors.slice(0, formIndex + 1);
              typeX = 'inclusao';
              const textualForms = [
                (colors: string[]) => `a cor ${colors[0]}`,
                (colors: string[]) => `a cor ${colors[0]} ou a cor ${colors[1]}`,
                (colors: string[]) => `a cor ${colors[0]} ou a cor ${colors[1]} ou a cor ${colors[2]}`,
                (colors: string[]) => `a cor ${colors[0]} ou a cor ${colors[1]} ou a cor ${colors[2]} ou a cor ${colors[3]}`
              ];
              eventXText = textualForms[formIndex](effectiveColors);
            } else {
              // Forma de exclusão: "uma cor diferente de cor1"
              effectiveColors = [drawnColors[0]]; // A cor excluída
              typeX = 'exclusao';
              eventXText = `uma cor diferente de ${drawnColors[0]}`;
            }
          }

          // Verificar se o evento é válido (não-vazio) para o conectivo escolhido
          if (verifyEventValid(sectorNums, propertyY, effectiveColors, typeX, connective, valueP)) {
            return { sectorNums, propertyY, effectiveColors, typeX, eventXText, valueP };
          }

          attempts++;
        }

        // Fallback: gerar evento simples que sempre funciona
        const sectorNums = generateSectorNumbers(n, pNums);
        const propertyY = 'par';
        if (!hasFavorableCase(sectorNums, propertyY)) {
          sectorNums[0] = 2;
        }
        const effectiveColors = [prev.sectors[0].colorName];
        const typeX: 'inclusao' | 'exclusao' = 'inclusao';
        const eventXText = `a cor ${prev.sectors[0].colorName}`;
        return { sectorNums, propertyY, effectiveColors, typeX, eventXText, valueP: 0 };
      };

      const { sectorNums, propertyY, effectiveColors, typeX, eventXText, valueP } = generateValidChallenge();

      // --- Interseção: substituir por gerador controlado ---
      if (connective === 'e') {
        const interResult = generateIntersectionChallenge(prev.sectors);
        if (interResult) {
          const challengeTitle = 'Desafio — Interseção de Eventos';
          setInstructions(`<p class="ds-body"><strong>${challengeTitle}</strong></p>
            <p class="ds-body">Calcule a probabilidade de, ao girar o disco uma única vez, obter um número <strong>${interResult.description}</strong>.</p>
            <p class="ds-body">Clique nos setores que são casos favoráveis ao evento.</p>`);

          return {
            ...prev,
            subStep: 6.6,
            challenge1P: pNums,
            challenge1SectorNumbers: interResult.values,
            challenge1PropertyY: interResult.description,
            challenge1ValueP: 0,
            challenge1EventXColors: [],
            challenge1EventXText: '',
            challenge1EventXType: 'inclusao' as const,
            challenge1Connective: connective,
            challenge1InterProblemType: interResult.problemType,
            challenge1InterM: interResult.m,
            challenge1InterP: interResult.p,
            challenge1InterK: interResult.k,
            selectedSectors: []
          };
        }
        // Se generateIntersectionChallenge falhou, cai no fluxo antigo abaixo
      }

      // --- União ou fallback da interseção: fluxo original ---
      const challengeTitle = connective === 'ou' ? 'Desafio — União de Eventos' : 'Desafio — Interseção de Eventos';

      // Atualizar instruções
      setInstructions(`<p class="ds-body"><strong>${challengeTitle}</strong></p>
        <p class="ds-body">Calcule a probabilidade de, ao girar o disco uma única vez, ocorrer <strong>${eventXText}</strong> ${connective.toUpperCase()} ocorrer um número <strong>${propertyY}</strong>.</p>
        <p class="ds-body">Clique nos setores que são casos favoráveis ao evento.</p>`);

      return {
        ...prev,
        subStep: 6.6,
        challenge1P: pNums,
        challenge1SectorNumbers: sectorNums,
        challenge1PropertyY: propertyY,
        challenge1ValueP: valueP,
        challenge1EventXColors: effectiveColors,
        challenge1EventXText: eventXText,
        challenge1EventXType: typeX,
        challenge1Connective: connective,
        challenge1InterProblemType: null,
        challenge1InterM: null,
        challenge1InterP: null,
        challenge1InterK: null,
        selectedSectors: []
      };
    });
  }, []);
  restartChallenge1Ref.current = restartChallenge1;

  // ========== HANDLERS EVENTOS COMPLEMENTARES ==========

  // Resetar estados complementares
  const resetCompState = useCallback(() => {
    setCompPhase('intro');
    setCompExamplesViewed(0);
    setCompCalcExampleNum(0);
    setCompUserSelectA([]);
    setCompUserSelectAbar([]);
    setCompIsGuided(true);
    setCompUsedBitmasks([]);
    setCompChainInputs({
      n1: '', d1: '', n2: '', d2: '',
      finalNum: '', finalDen: '',
      errN1: false, errD1: false, errN2: false, errD2: false,
      errFinalNum: false, errFinalDen: false,
    });
    setCompChainResult(null);
    setCompPaInput({ num: '', den: '', errNum: false, errDen: false });
    setCompStepByStep(0);
  }, []);

  // 1. Inicializar fase complementar (gera 1º exemplo passivo)
  const initComplementaryPhase = useCallback(() => {
    const { sectors } = gameState;
    const n = sectors.length;
    const pNum = n + Math.floor(Math.random() * (12 - n + 1));
    const nums = generateSectorNumbers(n, pNum);

    const ev = generateComplementaryEvent(sectors, nums, []);
    if (!ev) return;

    const bm = computeBitmask(ev.indicesA);

    setGameState(prev => ({
      ...prev,
      subStep: 6.70,
      challenge1SectorNumbers: nums,
      compEventA: {
        textA: ev.textA,
        textAbar: ev.textAbar,
        indicesA: ev.indicesA,
        indicesAbar: ev.indicesAbar,
        needsNumbers: ev.needsNumbers,
        templateType: ev.templateType,
      },
      selectedSectors: [],
      showNumbers: ev.needsNumbers,
    }));

    setCompPhase('intro');
    setCompExamplesViewed(1);
    setCompUsedBitmasks([bm]);
    setCompUserSelectA([]);
    setCompUserSelectAbar([]);

    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'concept',
      title: 'Eventos Complementares',
      message: `Dado um evento <strong>A</strong>, o <strong>evento complementar</strong> Ā (lê-se "A barra") contém todos os resultados do espaço amostral que <strong>não</strong> pertencem a A.<br/><br/>Exemplo: seja <strong>A = "${ev.textA}"</strong>.<br/>Então <strong>Ā = "${ev.textAbar}"</strong>.<br/><br/>No disco, os setores de <strong style="color:#FFD700">A</strong> estão em dourado e os de <strong style="color:#00E5FF">Ā</strong> estão em ciano.`
    });

    setInstructions(`<p class="ds-body"><strong>Eventos Complementares</strong></p>
      <p class="ds-body">Leia o conceito no balão ao lado e observe os setores destacados no disco.</p>`);
  }, [gameState]);

  // 2. Iniciar exercício interativo de identificação (selecting_A)
  const handleStartCompExercise = useCallback(() => {
    const { sectors, challenge1SectorNumbers } = gameState;

    let ev = generateComplementaryEvent(sectors, challenge1SectorNumbers, compUsedBitmasks);
    // Se esgotou bitmasks, limpar e tentar novamente
    if (!ev) {
      setCompUsedBitmasks([]);
      ev = generateComplementaryEvent(sectors, challenge1SectorNumbers, []);
    }
    if (!ev) return;

    const bm = computeBitmask(ev.indicesA);
    setCompUsedBitmasks(prev => [...prev, bm]);

    setGameState(prev => ({
      ...prev,
      compEventA: {
        textA: ev.textA,
        textAbar: ev.textAbar,
        indicesA: ev.indicesA,
        indicesAbar: ev.indicesAbar,
        needsNumbers: ev.needsNumbers,
        templateType: ev.templateType,
      },
      showNumbers: ev.needsNumbers,
      selectedSectors: [],
    }));

    setCompPhase('selecting_A');
    setCompUserSelectA([]);
    setCompUserSelectAbar([]);
    playSound("/sounds/nextChallenge.mp3");
    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'info',
      title: 'Identifique o evento A',
      message: `Evento A = "<strong>${ev.textA}</strong>".<br/>Clique nos setores do disco que pertencem ao evento A e depois confirme.`
    });
    setInstructions(`<p class="ds-body"><strong>Eventos Complementares — Identificação</strong></p>
      <p class="ds-body">Selecione os setores do evento A no disco.</p>`);
  }, [gameState, compUsedBitmasks]);

  // 3. Toggle setor na seleção complementar (parte 1)
  const handleCompSectorClick = useCallback((index: number) => {
    if (compPhase === 'selecting_A') {
      setCompUserSelectA(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else if (compPhase === 'selecting_Abar' || compPhase === 'calc_selectAbar') {
      setCompUserSelectAbar(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    }
  }, [compPhase]);

  // 4. Confirmar seleção de A
  const handleCompConfirmA = useCallback(() => {
    const ev = gameState.compEventA;
    if (!ev) return;

    const correctSet = new Set(ev.indicesA);
    const userSet = new Set(compUserSelectA);

    if (correctSet.size === userSet.size && [...correctSet].every(i => userSet.has(i))) {
      // Correto — avançar para selecting_Abar
      playSound("/sounds/correct.mp3");
      setCompPhase('selecting_Abar');
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'success',
        title: 'Evento A correto!',
        message: `Agora identifique o evento complementar <strong>Ā = "${ev.textAbar}"</strong>.<br/>Clique nos setores que pertencem a Ā e depois confirme.`
      });
    } else {
      playSound("/sounds/incorrect.mp3");
      setCompPhase('wrong_A');
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'error',
        title: 'Incorreto',
        message: `Revise quais setores correspondem ao evento A = "<strong>${ev.textA}</strong>". Tente novamente.`
      });
    }
  }, [gameState.compEventA, compUserSelectA]);

  // 5. Confirmar seleção de Ā
  const handleCompConfirmAbar = useCallback(() => {
    const ev = gameState.compEventA;
    if (!ev) return;

    const correctSet = new Set(ev.indicesAbar);
    const userSet = new Set(compUserSelectAbar);

    if (correctSet.size === userSet.size && [...correctSet].every(i => userSet.has(i))) {
      // Correto — mostrar ambos
      playSound("/sounds/correct.mp3");
      setCompPhase('show_both');
      setCompExamplesViewed(prev => prev + 1);
      setShowInfoBox(true);

      const total = compExamplesViewed + 1; // +1 contando este
      if (total < 3) {
        setInfoBoxContent({
          type: 'success',
          title: 'Muito bem!',
          message: `Você identificou corretamente A e Ā. Observe: os setores dourados são A e os cianos são Ā. Juntos, cobrem toda o disco!`
        });
      } else {
        setInfoBoxContent({
          type: 'success',
          title: 'Excelente!',
          message: `Você identificou corretamente A e Ā. Observe: A (dourado) e Ā (ciano) cobrem toda o disco, sem sobreposição. Isso é a essência dos eventos complementares!`
        });
      }
    } else {
      playSound("/sounds/incorrect.mp3");
      setCompPhase('wrong_Abar');
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'error',
        title: 'Incorreto',
        message: `O evento complementar ocorre quando A não ocorre. Marque as possibilidades do evento A não ocorrer no disco.`
      });
    }
  }, [gameState.compEventA, compUserSelectAbar, compExamplesViewed]);

  // 6. Retry após erro
  const handleCompRetry = useCallback(() => {
    if (compPhase === 'wrong_A') {
      setCompPhase('selecting_A');
      setCompUserSelectA([]);
      playSound("/sounds/nextChallenge.mp3");
      setShowInfoBox(true);
      const ev = gameState.compEventA;
      setInfoBoxContent({
        type: 'info',
        title: 'Tente novamente',
        message: `Evento A = "<strong>${ev?.textA}</strong>".<br/>Clique nos setores que pertencem ao evento A.`
      });
    } else if (compPhase === 'wrong_Abar') {
      setCompPhase('selecting_Abar');
      setCompUserSelectAbar([]);
      playSound("/sounds/nextChallenge.mp3");
      setShowInfoBox(true);
      const ev = gameState.compEventA;
      setInfoBoxContent({
        type: 'info',
        title: 'Tente novamente',
        message: `Evento Ā = "<strong>${ev?.textAbar}</strong>".<br/>Clique nos setores que pertencem ao evento complementar Ā.`
      });
    }
  }, [compPhase, gameState.compEventA]);

  // 7. Ver mais exemplos (após 3 obrigatórios)
  const handleCompSeeMoreExamples = useCallback(() => {
    handleStartCompExercise();
  }, [handleStartCompExercise]);

  // 8. Iniciar exemplo de cálculo (guiado ou independente)
  const initCompCalcExample = useCallback((guided: boolean) => {
    const { sectors } = gameState;
    const n = sectors.length;
    const pNum = n + Math.floor(Math.random() * (12 - n + 1));
    const nums = generateSectorNumbers(n, pNum);

    // Nos treinos 1 e 2, forçar P(A) ≠ P(Ā) (evitar 50/50)
    const avoidHalf = !guided && compCalcExampleNum < 2;
    let ev = generateComplementaryEvent(sectors, nums, compUsedBitmasks, avoidHalf);
    // Se esgotou bitmasks, limpar e tentar novamente
    if (!ev) {
      setCompUsedBitmasks([]);
      ev = generateComplementaryEvent(sectors, nums, [], avoidHalf);
    }
    if (!ev) return;

    const bm = computeBitmask(ev.indicesA);
    setCompUsedBitmasks(prev => [...prev, bm]);

    setGameState(prev => ({
      ...prev,
      subStep: guided ? 6.85 : 6.90,
      challenge1SectorNumbers: nums,
      compEventA: {
        textA: ev.textA,
        textAbar: ev.textAbar,
        indicesA: ev.indicesA,
        indicesAbar: ev.indicesAbar,
        needsNumbers: ev.needsNumbers,
        templateType: ev.templateType,
      },
      selectedSectors: [],
      showNumbers: true,
    }));

    setCompPhase('calc_enunciado');
    setCompIsGuided(guided);
    if (!guided) {
      setCompCalcExampleNum(prev => prev + 1);
    }

    // Resetar entradas de cálculo
    setCompUserSelectAbar([]);
    setCompChainInputs({
      n1: '', d1: '', n2: '', d2: '',
      finalNum: '', finalDen: '',
      errN1: false, errD1: false, errN2: false, errD2: false,
      errFinalNum: false, errFinalDen: false,
    });
    setCompChainResult(null);
    setCompPaInput({ num: '', den: '', errNum: false, errDen: false });
    setCompStepByStep(0);

    // Tela de enunciado antes do cálculo
    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'concept',
      title: 'Probabilidade de Eventos Complementares',
      message: `Ao girar o disco uma única vez, determine a probabilidade de <strong>não</strong> ocorrer o evento A = "<strong>${ev.textA}</strong>" utilizando o valor da probabilidade de A.`
    });
    setInstructions(`<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
      <p class="ds-body">Leia o enunciado do problema ao lado.</p>`);
  }, [gameState, compUsedBitmasks, compCalcExampleNum]);

  // 9. Transição para Previsão (6.5)
  const transitionToPrediction = useCallback(() => {
    const { sectors, targetSectorCount } = gameState;
    const randomColor = sectors[Math.floor(Math.random() * sectors.length)].colorName;
    setGameState(prev => ({
      ...prev,
      subStep: 6.5,
      predictionColor: randomColor,
      showNumbers: false,
    }));

    setPredictionInput(prev => ({ ...prev, value: '', error: false }));

    setCurrentQuestion({
      question: `Se você girar o disco ${targetSectorCount} vezes, quantas vezes você acha que a cor <strong>${randomColor}</strong> vai aparecer?`,
      correctAnswer: ''
    });

    setShowInfoBox(false);
    setInstructions(`<p class="ds-body"><strong>Faça uma Previsão!</strong></p>
      <p class="ds-body">Responda a pergunta ao lado baseando-se nas probabilidades que você aprendeu.</p>`);
  }, [gameState]);

  initCompCalcExampleRef.current = initCompCalcExample;
  transitionToPredictionRef.current = transitionToPrediction;
  initComplementaryPhaseRef.current = initComplementaryPhase;
  handleStartCompExerciseRef.current = handleStartCompExercise;

  // ========== FIM HANDLERS EVENTOS COMPLEMENTARES ==========

  // Atualizar instruções durante giros manuais
  useEffect(() => {
    if (gameState.subStep === 7 && !gameState.pendingRegistration) {
      setInstructions(`<p class="ds-body"><strong>Giros Manuais</strong></p>
        <p class="ds-body">Gire o disco ${gameState.manualSpinsRequired} vezes clicando em <strong>Sortear</strong>.</p>
        <p class="ds-body">Após cada giro, registre a cor que saiu clicando no botão correspondente.</p>
        <p class="ds-body">Giros realizados: ${gameState.manualSpinsDone}/${gameState.manualSpinsRequired}</p>`);
    }

    if (gameState.subStep === 8 && !gameState.pendingRegistration) {
      setInstructions(`<p class="ds-body"><strong>Experimento Aleatório: Registro das Ocorrências dos Giros</strong></p>
        <p class="ds-body">Realize ${gameState.ySpins} giros e registre as frequências.</p>
        <p class="ds-body">Giros realizados: ${gameState.manualSpinsDone}/${gameState.ySpins}</p>`);
    }

    // Stage 2 - SubStep 9: Giros manuais P
    if (gameState.stage === 2 && gameState.subStep === 9 && !gameState.pendingRegistration) {
      setInstructions(`<p class="ds-body"><strong>Giros Manuais</strong></p>
        <p class="ds-body">Gire o disco <strong>${gameState.s2ManualSpinsP}</strong> vezes clicando em <strong>Sortear</strong>.</p>
        <p class="ds-body">Após cada giro, registre a cor clicando no botão correspondente.</p>
        <p class="ds-body">Giros realizados: ${gameState.manualSpinsDone}/${gameState.s2ManualSpinsP}</p>`);
    }
  }, [gameState.subStep, gameState.manualSpinsDone, gameState.manualSpinsRequired, gameState.ySpins, gameState.pendingRegistration, gameState.stage, gameState.s2ManualSpinsP]);

  // Handler para perguntas de Interpretação dos Resultados (subStep 14)
  // Handler: "Li." na tela conceitual de frequência relativa (subStep 8.6)
  const handleFreqRelConceptLi = useCallback(() => {
    setFreqRelConceptPhase('example');
  }, []);

  // Handler: "Continuar" na tela conceitual de frequência relativa (subStep 8.6)
  const handleFreqRelConceptContinue = useCallback(() => {
    moveToRelativeFrequencyInput();
  }, [moveToRelativeFrequencyInput]);

  const handleInterpretationCheck = useCallback(() => {
    const n = gameState.targetSectorCount;
    const probPercent = ((1 / n) * 100).toFixed(1).replace('.', ',');

    if (interpretationPhase === 'q1') {
      if (interpretationSelected === 'nao') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "De fato, as frequências relativas variaram entre os setores.", "success", 3000);
        setInterpretationPhase('q2');
        setInterpretationSelected('');
      } else if (interpretationSelected) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto", "Observe os valores na coluna de frequência relativa. Eles são todos iguais?", "error", 4000);
      }
      return;
    }

    if (interpretationPhase === 'q2') {
      if (interpretationSelected === 'nao') {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", `As frequências relativas ficaram próximas, mas não exatamente iguais a 1/${n} (≈${probPercent}%).`, "success", 3000);

        // Gerar alternativas dinâmicas para q3
        const setA = [
          'Porque o tamanho da amostra ainda não é suficientemente grande para que a frequência relativa se aproxime do valor teórico.',
          'Porque o número de repetições do experimento ainda é pequeno para reduzir as flutuações aleatórias observadas.',
          'Porque a quantidade de ensaios não foi suficiente para que ocorra a estabilização das frequências relativas.',
          'Porque o experimento ainda não atingiu um número de tentativas capaz de evidenciar a convergência para a probabilidade teórica (1/n).',
          'Porque a amostra observada ainda é limitada, mantendo as oscilações probabilísticas naturais.',
          'Porque o número de realizações do experimento não é grande o bastante para minimizar a variabilidade amostral.',
          'Porque ainda não há repetições suficientes para que a frequência relativa se estabilize em torno do valor esperado.',
          'Porque o total de giros ainda é pequeno para que as proporções observadas reflitam a tendência prevista pela Lei dos Grandes Números.'
        ];
        const setE = [
          'Porque a frequência relativa só coincidiria com o valor teórico se o número de giros fosse múltiplo de n.',
          'Porque a frequência relativa deveria convergir exatamente ao valor teórico ao final do experimento realizado.',
          'Porque cada experimento concreto possui uma probabilidade real ligeiramente diferente da probabilidade teórica.',
          'Porque a probabilidade teórica funciona apenas como referência aproximada e não como limite do comportamento observado.',
          'Porque a frequência relativa depende da ordem em que os resultados aparecem ao longo do experimento.',
          'Porque a sequência inicial de resultados influencia permanentemente a proporção final observada.',
          'Porque diferenças em relação ao valor teórico indicam pequenas imperfeições inevitáveis no mecanismo do disco.',
          'Porque a frequência relativa pode se estabilizar em um valor diferente do teórico ao longo do experimento.'
        ];

        // Substituir 1/n e n isolado pelo valor real
        const replaceN = (s: string) => s.replace(/1\/n/g, `1/${n}`).replace(/(?<![a-zA-ZÀ-ÿ])n(?![a-zA-ZÀ-ÿ])/g, `${n}`);

        // 1 alternativa correta do conjunto A
        const idxA = Math.floor(Math.random() * setA.length);
        const correctText = replaceN(setA[idxA]);

        // 4 distratores do conjunto E (sem repetição)
        const shuffledE = [...setE].sort(() => Math.random() - 0.5);
        const distractors = shuffledE.slice(0, 4).map(t => replaceN(t));

        // Montar e embaralhar 5 alternativas
        const alts = [
          { id: 'correct', text: correctText },
          ...distractors.map((t, i) => ({ id: `e${i}`, text: t }))
        ].sort(() => Math.random() - 0.5);

        setInterpretationQ3({ alternatives: alts, correctId: 'correct' });
        setInterpretationPhase('q3');
        setInterpretationSelected('');
      } else if (interpretationSelected) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto", `Compare os valores percentuais com ${probPercent}%. São realmente muito próximos?`, "error", 4000);
      }
      return;
    }

    if (interpretationPhase === 'q3') {
      if (interpretationQ3 && interpretationSelected === interpretationQ3.correctId) {
        playSound("/sounds/correct.mp3");
        createAlert("Correto!", "Diferenças em relação ao valor teórico são esperadas devido à variabilidade amostral quando o número de repetições ainda é limitado.", "success", 4000);
        setInterpretationPhase('feedback');
        setInterpretationSelected('');
      } else if (interpretationSelected) {
        playSound("/sounds/incorrect.mp3");
        createAlert("Incorreto", "As frequências relativas tendem ao valor teórico quando o número de repetições aumenta, mas não precisam coincidir exatamente em um experimento finito.", "error", 5000);
      }
      return;
    }
  }, [gameState.targetSectorCount, interpretationPhase, interpretationSelected, interpretationQ3, createAlert]);

  // Gerador de parâmetros para os problemas LGN
  const generateLgnParams = useCallback((n: number, sectors: { colorName: string }[]) => {
    const multipliers = [100000, 200000, 300000, 400000, 500000];
    const pOptions = [5, 10, 20, 25, 40, 50, 75];
    const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    const m = multiplier * n;
    const k = multiplier; // m/n = multiplier
    const p = pOptions[Math.floor(Math.random() * pOptions.length)];
    const color = sectors[Math.floor(Math.random() * sectors.length)].colorName;
    return { k, m, p, answer1: k, answer2: (m * p) / 100, color };
  }, []);

  // Handler para "Quero saber!" na nota obrigatória
  const handleLgnWantToKnow = useCallback(() => {
    setLgnPhase('explanation');
    setInstructions(`<p class="ds-body"><strong>Lei dos Grandes Números</strong></p>
      <p class="ds-body">Leia a explicação abaixo.</p>`);
  }, []);

  // Handler para "Continuar" após explicação → consolidação verbal (Melhoria 7)
  const handleLgnContinue = useCallback(() => {
    setLgnPhase('verbal');
    setLgnVerbalInput({ value: '', error: false });
    setInstructions(`<p class="ds-body"><strong>Consolidação</strong></p>
      <p class="ds-body">Responda a pergunta abaixo com suas próprias palavras.</p>`);
  }, []);

  // Handler para confirmar resposta verbal → celebração Etapa 1
  const handleLgnVerbalConfirm = useCallback(() => {
    const text = lgnVerbalInput.value.trim();
    if (text.length < 10) {
      playSound("/sounds/incorrect.mp3");
      setLgnVerbalInput(prev => ({ ...prev, error: true }));
      createAlert("Resposta muito curta", "Escreva uma explicação com pelo menos 10 caracteres.", "error", 3000);
      return;
    }

    // Melhoria 12 — Logar resposta textual
    logText(1, 15, 'consolidacao_verbal_lgn', text);

    playSound("/sounds/correct.mp3");
    setShowInfoBox(true);
    setInfoBoxContent({
      type: 'concept',
      title: 'Lei dos Grandes Números',
      message: 'O fenômeno que você descreveu é a <strong>Lei dos Grandes Números</strong>: quanto maior o número de repetições de um experimento aleatório, mais a frequência relativa se aproxima da probabilidade teórica.<br/><br/>Esse é um dos resultados mais importantes da teoria da probabilidade.'
    });
    setLgnPhase('verbal'); // manter na fase verbal para o InfoBox
    setGameState(prev => ({ ...prev, subStep: 15.5 })); // subStep intermediário para o InfoBox
    setInstructions(`<p class="ds-body"><strong>Lei dos Grandes Números</strong></p>
      <p class="ds-body">Leia a formalização do conceito.</p>`);
  }, [lgnVerbalInput.value, createAlert]);

  // Melhoria 10 — Handlers do dado de 6 faces (descontextualização)
  const handleDiceRoll = useCallback(() => {
    if (diceState.rolling) return;
    const finalFace = Math.floor(Math.random() * 6) + 1;
    // Iniciar rotação 3D — definir face final e ativar rolling
    setDiceState({ face: finalFace, rolling: true, rolled: false, answered: false });
    playSound("/sounds/nextChallenge.mp3");

    // Após a animação CSS (1.2s), marcar como concluído
    setTimeout(() => {
      setDiceState(prev => ({ ...prev, rolling: false, rolled: true }));
      setInstructions(`<p class="ds-body"><strong>Generalização</strong></p>
        <p class="ds-body">O dado caiu na face <strong>${finalFace}</strong>. Agora responda a pergunta.</p>`);
    }, 1300);
  }, [diceState.rolling]);

  const handleDiceAnswer = useCallback(() => {
    const val = diceInput.value.trim();
    if (areFractionsEquivalent(val, '1/6')) {
      playSound("/sounds/correct.mp3");
      logText(1, 15.6, 'descontextualizacao_dado', val);
      setDiceState(prev => ({ ...prev, answered: true }));
      setGameState(prev => ({ ...prev, subStep: 15.7 }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'success',
        title: 'Generalização',
        message: 'A Lei dos Grandes Números não se limita ao disco colorido. Para <strong>qualquer</strong> experimento aleatório com resultados equiprováveis, a frequência relativa se aproxima da probabilidade teórica quando o número de repetições é grande.<br/><br/>O dado tem 6 faces iguais, então cada face tem probabilidade <strong>1/6</strong>. Após 10.000 lançamentos, a frequência relativa de cada face se aproximaria desse valor.'
      });
      setInstructions(`<p class="ds-body"><strong>Generalização</strong></p>
        <p class="ds-body">Leia a conclusão.</p>`);
    } else {
      playSound("/sounds/incorrect.mp3");
      setDiceInput(prev => ({ ...prev, error: true }));
      createAlert("Tente novamente", "Pense: o dado tem 6 faces iguais. Qual a probabilidade de cada face? Use a notação de fração.", "error", 5000);
    }
  }, [diceInput.value, createAlert]);

  // ─────────────────────────────────────────────────────────────────
  // SNAPSHOT DEV — captura/restaura todo o estado relevante para que o
  // botão "voltar" do painel de DEV consiga restaurar fielmente uma
  // cena anterior (incluindo InfoBox, instruções, inputs, fase de
  // experimentação, etc.). Sem isso, restaurar só o `gameState` deixa
  // estado dependente "vazado" das cenas posteriores.
  // ─────────────────────────────────────────────────────────────────
  // ID único da cena atual: usado pelo painel DEV para contar e detectar
  // transições de sub-cenas (compPhase, unionPhase, freqRelConceptPhase,
  // interpretationPhase, lgnPhase, disjointExercisePhase) que NÃO mudam
  // o subStep. Sem isso, avançar de "intro → selecting_A" dentro de 6.70
  // não dispararia novo snapshot/contador.
  const getDevCenaId = useCallback((): string => {
    const { subStep } = gameState;
    const parts: string[] = [`s${subStep}`];
    if (subStep === 6.55) parts.push(`disj=${disjointExercisePhase}`);
    if (subStep === 6.56) parts.push(`uni=${unionPhase}`);
    if (subStep === 6.70) parts.push(`comp=${compPhase}`, `ex=${compExamplesViewed}`);
    if (subStep >= 6.85 && subStep <= 6.93) parts.push(`comp=${compPhase}`);
    if (subStep === 0.1) parts.push(`detEx=${deterministicExamplesViewed}`);
    if (subStep === 0.3) parts.push(`randEx=${randomExamplesViewed}`);
    if (subStep === 8.6) parts.push(`freqRel=${freqRelConceptPhase}`);
    if (subStep === 14) parts.push(`interp=${interpretationPhase}`);
    if (subStep === 15) parts.push(`lgn=${lgnPhase}`);
    if (showInfoBox) parts.push(`info=${infoBoxContent.title || ''}`);
    return parts.join('|');
  }, [gameState, disjointExercisePhase, unionPhase, compPhase, compExamplesViewed, deterministicExamplesViewed, randomExamplesViewed, freqRelConceptPhase, interpretationPhase, lgnPhase, showInfoBox, infoBoxContent]);

  const getDevSnapshot = useCallback(() => ({
    gameState,
    showInfoBox,
    infoBoxContent,
    instructions,
    experimentationState,
    selectedOption,
    sliderValue,
    selectedCharacteristics,
    sampleSpaceInput,
    sampleSpaceCountInput,
    probabilityInputs,
    theoreticalQuestion1Input,
    theoreticalQuestion2Input,
    favorableCasesInput,
    predictionInput,
    exerciseNEInput,
    exerciseNSInput,
    exercisePENumeratorInput,
    exercisePEDenominatorInput,
    disabledSpinButton,
    disabledCheckButton,
    disabledNextButton,
    showAutoSpinButtons,
    // Comp/Desafio/Frequências/Convergência/Interpretação/LGN
    compPhase,
    compUserSelectAbar,
    compChainInputs,
    compPaInput,
    freqAbsInput,
    freqRelInput,
    convergenceInputs,
    interpretationPhase,
    interpretationSelected,
    interpretationQ3,
    lgnPhase,
    lgnParams,
    lgnInput,
  }), [
    gameState, showInfoBox, infoBoxContent, instructions, experimentationState,
    selectedOption, sliderValue, selectedCharacteristics,
    sampleSpaceInput, sampleSpaceCountInput, probabilityInputs,
    theoreticalQuestion1Input, theoreticalQuestion2Input, favorableCasesInput,
    predictionInput, exerciseNEInput, exerciseNSInput,
    exercisePENumeratorInput, exercisePEDenominatorInput,
    disabledSpinButton, disabledCheckButton, disabledNextButton, showAutoSpinButtons,
    compPhase, compUserSelectAbar, compChainInputs, compPaInput,
    freqAbsInput, freqRelInput, convergenceInputs,
    interpretationPhase, interpretationSelected, interpretationQ3,
    lgnPhase, lgnParams, lgnInput,
  ]);
  type DevSnapshot = ReturnType<typeof getDevSnapshot>;

  const applyDevSnapshot = useCallback((snap: DevSnapshot) => {
    setGameState(snap.gameState);
    setShowInfoBox(snap.showInfoBox);
    setInfoBoxContent(snap.infoBoxContent);
    setInstructions(snap.instructions);
    setExperimentationState(snap.experimentationState);
    setSelectedOption(snap.selectedOption);
    setSliderValue(snap.sliderValue);
    setSelectedCharacteristics(snap.selectedCharacteristics);
    setSampleSpaceInput(snap.sampleSpaceInput);
    setSampleSpaceCountInput(snap.sampleSpaceCountInput);
    setProbabilityInputs(snap.probabilityInputs);
    setTheoreticalQuestion1Input(snap.theoreticalQuestion1Input);
    setTheoreticalQuestion2Input(snap.theoreticalQuestion2Input);
    setFavorableCasesInput(snap.favorableCasesInput);
    setPredictionInput(snap.predictionInput);
    setExerciseNEInput(snap.exerciseNEInput);
    setExerciseNSInput(snap.exerciseNSInput);
    setExercisePENumeratorInput(snap.exercisePENumeratorInput);
    setExercisePEDenominatorInput(snap.exercisePEDenominatorInput);
    setDisabledSpinButton(snap.disabledSpinButton);
    setDisabledCheckButton(snap.disabledCheckButton);
    setDisabledNextButton(snap.disabledNextButton);
    setShowAutoSpinButtons(snap.showAutoSpinButtons);
    setCompPhase(snap.compPhase);
    setCompUserSelectAbar(snap.compUserSelectAbar);
    setCompChainInputs(snap.compChainInputs);
    setCompPaInput(snap.compPaInput);
    setFreqAbsInput(snap.freqAbsInput);
    setFreqRelInput(snap.freqRelInput);
    setConvergenceInputs(snap.convergenceInputs);
    setInterpretationPhase(snap.interpretationPhase);
    setInterpretationSelected(snap.interpretationSelected);
    setInterpretationQ3(snap.interpretationQ3);
    setLgnPhase(snap.lgnPhase);
    setLgnParams(snap.lgnParams);
    setLgnInput(snap.lgnInput);
    // Libera locks síncronos para evitar travamentos pós-restore.
    experimentBetLockedRef.current = false;
    resultConfirmationLockedRef.current = false;
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // SIMULADOR DE AVANÇO — uso restrito ao painel de DEV da sequência
  // didática. Examina o estado atual e dispara a ação que um aluno
  // tomaria para acertar a cena, fazendo a transição natural com todas
  // as dependências (sectors, eventos, balões, etc.) configuradas.
  //
  // Cobre os principais subSteps do disco; para subSteps não cobertos,
  // faz fallback para incremento simples do subStep (estado herdado).
  // ─────────────────────────────────────────────────────────────────
  // Atualiza o ref para apontar sempre para a versão mais recente do checkAnswer.
  checkAnswerRef.current = checkAnswer;

  const devSimulateAdvance = useCallback(() => {
    const { stage, subStep, sectors, targetSectorCount } = gameState;

    // ── 6.70 — Cena complexa multi-fase. Cada compPhase é uma "ceninha"
    //    distinta com seu próprio botão de saída. Tratamos ANTES do check
    //    genérico de showInfoBox para garantir transições determinísticas
    //    entre as fases (intro → selecting_A → selecting_Abar → show_both
    //    → repetir 3x → 6.80). ──
    if (stage === 1 && subStep === 6.70) {
      const ev = gameState.compEventA;
      if (!ev) {
        initComplementaryPhaseRef.current?.();
        return;
      }
      if (compPhase === 'intro') {
        // Botão "Agora é sua vez!" → handleStartCompExercise
        handleStartCompExerciseRef.current?.();
        return;
      }
      if (compPhase === 'selecting_A' || compPhase === 'wrong_A') {
        playSound("/sounds/correct.mp3");
        createAlert("Evento A correto!", `A = "${ev.textA}"`, "success", 2500);
        setCompUserSelectA([...ev.indicesA]);
        setCompPhase('selecting_Abar');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Evento A correto!',
          message: `Agora identifique o evento complementar <strong>Ā = "${ev.textAbar}"</strong>.<br/>Clique nos setores que pertencem a Ā e depois confirme.`,
        });
        return;
      }
      if (compPhase === 'selecting_Abar' || compPhase === 'wrong_Abar') {
        playSound("/sounds/correct.mp3");
        const total = compExamplesViewed + 1;
        createAlert(total < 3 ? "Muito bem!" : "Excelente!", "A e Ā identificados.", "success", 2500);
        setCompUserSelectAbar([...ev.indicesAbar]);
        setCompPhase('show_both');
        setCompExamplesViewed(prev => prev + 1);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: total < 3 ? 'Muito bem!' : 'Excelente!',
          message: total < 3
            ? `Você identificou corretamente A e Ā. Observe: os setores dourados são A e os cianos são Ā. Juntos, cobrem todo o disco!`
            : `Você identificou corretamente A e Ā. Observe: A (dourado) e Ā (ciano) cobrem todo o disco, sem sobreposição. Isso é a essência dos eventos complementares!`,
        });
        return;
      }
      if (compPhase === 'show_both') {
        if (compExamplesViewed >= 3) {
          playSound("/sounds/nextChallenge.mp3");
          createAlert("Próximo passo!", "Vamos formalizar os eventos complementares.", "info", 2500);
          setGameState(prev => ({ ...prev, subStep: 6.80 }));
          setCompPhase('formalize1');
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'concept',
            title: 'Formalização — Passo 1',
            message: `Como os eventos <span style="white-space:nowrap">A e Ā</span> (complementar de A) cobrem todo o espaço amostral sem sobreposição, temos:<br/><br/><strong>P(A ∪ Ā) = P(S)</strong><br/><br/>A probabilidade de A ou Ā ocorrer é a probabilidade do espaço amostral inteiro.`,
          });
        } else {
          handleStartCompExerciseRef.current?.();
        }
        return;
      }
    }

    // ── 6.85/6.90 — Cálculo de complementares (guiado/independente).
    //    Cada compPhase é uma sub-cena. Tratamos antes do showInfoBox check
    //    para garantir transições determinísticas. ──
    if (stage === 1 && (subStep === 6.85 || subStep === 6.90)) {
      const ev = gameState.compEventA;
      if (!ev) {
        initCompCalcExampleRef.current?.(subStep === 6.85);
        return;
      }
      const guided = subStep === 6.85;
      if (compPhase === 'calc_enunciado') {
        playSound("/sounds/nextChallenge.mp3");
        setCompPhase('calc_selectA');
        setShowInfoBox(false);
        setInstructions(guided
          ? `<p class="ds-body"><strong>Cálculo da Probabilidade de Eventos Complementares</strong></p>
             <p class="ds-body">Selecione os setores do evento A no disco e clique em Conferir.</p>`
          : `<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
             <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
        return;
      }
      if (compPhase === 'calc_selectA') {
        playSound("/sounds/correct.mp3");
        createAlert("Evento A correto!", `A = "${ev.textA}"`, "success", 2500);
        if (guided) {
          setGameState(prev => ({ ...prev, selectedSectors: [...ev.indicesA], subStep: 6.86 }));
          setCompPhase('calc_selectAbar');
          setCompUserSelectAbar([]);
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Evento A correto!',
            message: `Agora marque no disco o evento complementar de A (<strong>Ā</strong>).`,
          });
        } else {
          setGameState(prev => ({ ...prev, selectedSectors: [...ev.indicesA] }));
          setCompPhase('calc_pa');
          setCompPaInput({ num: '', den: '', errNum: false, errDen: false });
          setShowInfoBox(true);
          setInfoBoxContent({
            type: 'success',
            title: 'Evento A correto!',
            message: `Agora informe a probabilidade de A como fração.`,
          });
        }
        return;
      }
      if (compPhase === 'calc_pa') {
        playSound("/sounds/correct.mp3");
        const m = ev.indicesA.length;
        const n = sectors.length;
        createAlert("P(A) correto!", `P(A) = ${m}/${n}`, "success", 2500);
        setCompPaInput({ num: String(m), den: String(n), errNum: false, errDen: false });
        setGameState(prev => ({ ...prev, subStep: 6.91 }));
        setCompPhase('calc_selectAbar');
        setCompUserSelectAbar([]);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'P(A) correto!',
          message: `Agora marque no disco o evento complementar de A (<strong>Ā</strong>).`,
        });
        return;
      }
    }
    if (stage === 1 && (subStep === 6.86 || subStep === 6.91)) {
      const ev = gameState.compEventA;
      if (!ev) return;
      if (compPhase === 'calc_selectAbar') {
        playSound("/sounds/correct.mp3");
        createAlert("Muito bem!", `Ā = "${ev.textAbar}"`, "success", 2500);
        const guided = subStep === 6.86;
        setCompUserSelectAbar([...ev.indicesAbar]);
        setCompPhase('calc_showBoth');
        setGameState(prev => ({ ...prev, subStep: guided ? 6.87 : 6.92 }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'success',
          title: 'Muito bem!',
          message: `Observe que <strong style="color:#FFD700">A</strong> (dourado) e <strong style="color:#00E5FF">Ā</strong> (ciano) não possuem setores em comum e juntos formam todo o espaço amostral.`,
        });
        return;
      }
    }
    if (stage === 1 && (subStep === 6.87 || subStep === 6.92)) {
      // Botão "Veja!" → avança para calc_chain (6.88/6.93)
      if (compPhase === 'calc_showBoth') {
        const guided = subStep === 6.87;
        setCompPhase('calc_chain');
        setGameState(prev => ({ ...prev, subStep: guided ? 6.88 : 6.93 }));
        setCompChainInputs({
          n1: '', d1: '', n2: '', d2: '',
          finalNum: '', finalDen: '',
          errN1: false, errD1: false, errN2: false, errD2: false,
          errFinalNum: false, errFinalDen: false,
        });
        setCompChainResult(null);
        setShowInfoBox(false);
        setInstructions(guided
          ? `<p class="ds-body"><strong>Cálculo da probabilidade do complementar a partir de P(A)</strong></p>
             <p class="ds-body">Preencha as frações para calcular P(Ā) = 1 − P(A).</p>`
          : `<p class="ds-body"><strong>Probabilidade de Eventos Complementares</strong></p>
             <p class="ds-body">Agora é a sua vez de treinar! Treino ${compCalcExampleNum} de 3.</p>`);
        return;
      }
    }
    if (stage === 1 && (subStep === 6.88 || subStep === 6.93)) {
      // Cadeia P(Ā) = 1 - P(A) = n/n - m/n = (n-m)/n
      if (compPhase === 'calc_chain') {
        const ev = gameState.compEventA;
        if (!ev) return;
        const m = ev.indicesA.length;
        const n = sectors.length;
        setCompChainInputs({
          n1: String(n), d1: String(n),
          n2: String(m), d2: String(n),
          finalNum: String(n - m), finalDen: String(n),
          errN1: false, errD1: false, errN2: false, errD2: false,
          errFinalNum: false, errFinalDen: false,
        });
        setTimeout(() => checkAnswerRef.current?.(), 50);
        return;
      }
    }

    // ── 0.1 (Experimento determinístico) e 0.3 (Experimento aleatório) —
    //    cada balão tem botão "Clique para ver mais exemplos!" enquanto não
    //    foram vistos 3 exemplos; depois disso o botão muda para "Li." e
    //    avança ao próximo conceito. Cada visualização de exemplo é uma
    //    sub-cena distinta no contador. ──
    if (stage === 1 && subStep === 0.1) {
      if (deterministicExamplesViewed < 3) {
        handleSeeMoreDeterministicExamples();
        return;
      }
      handleInfoBoxConfirm();
      return;
    }
    if (stage === 1 && subStep === 0.3) {
      if (randomExamplesViewed < 3) {
        handleSeeMoreRandomExamples();
        return;
      }
      handleInfoBoxConfirm();
      return;
    }

    // 1) InfoBox aberto → confirmar (avança balões/conceitos automaticamente)
    if (showInfoBox) {
      handleInfoBoxConfirm();
      return;
    }

    // 2) Pré-preenche o input correto e dispara checkAnswer no próximo tick.
    //    O setTimeout garante que o setState do input já foi flushado pelo
    //    React antes do checkAnswer ler o valor.
    const fillThenCheck = (fill: () => void) => {
      fill();
      setTimeout(() => checkAnswerRef.current?.(), 50);
    };

    // ── STAGE 1 ──
    if (stage === 1 && subStep === 0) {
      fillThenCheck(() => setSliderValue(targetSectorCount));
      return;
    }
    if (stage === 1 && subStep === 1) {
      fillThenCheck(() => setSelectedOption('correct'));
      return;
    }
    // Experimentação (1.1 = aposta, 1.17 = confirmação): a fase tem 3
    // tentativas com aposta + giro + confirmação. Em DEV simulamos os 3
    // sorteios animando rapidamente o disco e ao final exibimos a tabela
    // resumo, idêntica à do fluxo natural.
    if (stage === 1 && (subStep === 1.1 || subStep === 1.17)) {
      const colors = sectors.map(s => s.colorName);
      const pickRandom = () => colors[Math.floor(Math.random() * colors.length)];
      const draws = [pickRandom(), pickRandom(), pickRandom()];
      const wagers = [pickRandom(), pickRandom(), pickRandom()];
      const freqs: { [color: string]: number } = {};
      colors.forEach(c => { freqs[c] = 0; });
      draws.forEach(c => { freqs[c] = (freqs[c] || 0) + 1; });
      experimentBetLockedRef.current = false;
      resultConfirmationLockedRef.current = false;
      setExperimentationState({
        wageredColor: null,
        wagers,
        draws,
        currentAttempt: 3,
        waitingForConfirmation: false,
        internalDrawnColor: null,
        colorRevealed: false,
      });
      setSelectedCharacteristics([]);

      // Rotação visual de "3 giros consolidados" (uma volta extra para
      // sinalizar movimento) — não é a animação completa, mas dá feedback.
      setGameState(prev => ({
        ...prev,
        subStep: 1.25,
        frequencies: freqs,
        totalSpins: 3,
        isSpinning: true,
        spinDuration: 800,
        targetAngle: (prev.currentRotation || 0) + 360 * 3,
        currentRotation: (prev.currentRotation || 0) + 360 * 3,
      }));

      // Após o pequeno giro, finaliza isSpinning para liberar próximas ações.
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isSpinning: false }));
      }, 850);

      // Tabela resumo idêntica à exibida pelo fluxo natural ao concluir as
      // 3 tentativas (handleResultConfirmation, line ~7113).
      setInstructions(`<p class="ds-body"><strong>Experimentação Concluída!</strong></p>
        <p class="ds-body"><strong>Resumo das 3 tentativas:</strong></p>
        <table class="border-collapse mt-micro ds-small">
          <thead>
            <tr class="bg-brand-otimath-pure text-neutral-white">
              <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Tentativa</th>
              <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Apostou</th>
              <th class="py-quarck px-micro border border-brand-otimath-dark text-center">Sorteada</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>1ª</strong></td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${wagers[0]}</td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${draws[0]}</td>
            </tr>
            <tr class="bg-neutral-lightest">
              <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>2ª</strong></td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${wagers[1]}</td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${draws[1]}</td>
            </tr>
            <tr>
              <td class="py-quarck px-micro border border-neutral-lighter text-center"><strong>3ª</strong></td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${wagers[2]}</td>
              <td class="py-quarck px-micro border border-neutral-lighter text-center">${draws[2]}</td>
            </tr>
          </tbody>
        </table>`);

      setDisabledSpinButton(true);
      playSound("/sounds/challengeFinished.mp3");
      createAlert("Experimentação concluída!", "3 tentativas registradas. Veja a tabela resumo nas instruções.", "success", 3000);
      return;
    }
    if (stage === 1 && subStep === 1.25) {
      // Marca todas as 7 características (indices 0-6) como corretas e confere
      setSelectedCharacteristics(RANDOM_EXPERIMENT_CHARACTERISTICS.map((_, i) => i));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 2) {
      // validateSampleSpace exige formato exato "S = {cor1, cor2, ...}"
      const colors = sectors.map(s => s.colorName).join(', ');
      fillThenCheck(() => setSampleSpaceInput(prev => ({ ...prev, value: `S = {${colors}}` })));
      return;
    }
    if (stage === 1 && subStep === 3) {
      fillThenCheck(() => setSampleSpaceCountInput(prev => ({ ...prev, value: String(targetSectorCount) })));
      return;
    }
    if (stage === 1 && subStep === 4) {
      fillThenCheck(() => setSelectedOption('nao'));
      return;
    }
    if (stage === 1 && subStep === 5) {
      fillThenCheck(() => setSelectedOption('equiprovavel'));
      return;
    }
    if (stage === 1 && subStep === 7.5) {
      // Pergunta de incerteza: opção correta é 'incerteza'
      fillThenCheck(() => setSelectedOption('incerteza'));
      return;
    }
    if (stage === 1 && subStep === 5.7) {
      fillThenCheck(() => setTheoreticalQuestion1Input(prev => ({ ...prev, value: '1' })));
      return;
    }
    if (stage === 1 && subStep === 6) {
      // Preenche cada cor com 1/n
      const expectedProb = `1/${targetSectorCount}`;
      const newInputs: typeof probabilityInputs = {};
      sectors.forEach(s => {
        const existing = probabilityInputs[s.colorName];
        newInputs[s.colorName] = existing
          ? { ...existing, value: expectedProb, error: false }
          : { value: expectedProb, disabled: false, error: false };
      });
      setProbabilityInputs(newInputs);
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 6.1) {
      // n(E) = compositeEventE.length
      fillThenCheck(() => setFavorableCasesInput(prev => ({ ...prev, value: String(gameState.compositeEventE.length) })));
      return;
    }
    if (stage === 1 && subStep === 6.41) {
      // Seleciona os setores correspondentes ao exerciseEventE no disco
      const correctIndices = sectors
        .map((s, i) => gameState.exerciseEventE.includes(s.colorName) ? i : -1)
        .filter(i => i !== -1);
      setGameState(prev => ({ ...prev, selectedSectors: correctIndices }));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 6.42) {
      fillThenCheck(() => setExerciseNEInput(prev => ({ ...prev, value: String(gameState.exerciseEventE.length) })));
      return;
    }
    if (stage === 1 && subStep === 6.43) {
      fillThenCheck(() => setExerciseNSInput(prev => ({ ...prev, value: String(sectors.length) })));
      return;
    }
    if (stage === 1 && subStep === 6.44) {
      // P(E) = n(E)/n(S)
      const num = String(gameState.exerciseEventE.length);
      const den = String(sectors.length);
      setExercisePENumeratorInput(prev => ({ ...prev, value: num }));
      setExercisePEDenominatorInput(prev => ({ ...prev, value: den }));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 6.5) {
      // Previsão livre — qualquer número não vazio é aceito
      fillThenCheck(() => setPredictionInput(prev => ({ ...prev, value: '1' })));
      return;
    }

    // ── Atividades de União (6.56) — DEV pula direto para o Desafio
    //    Dinâmico 1 (6.6) chamando restartChallenge1, que configura todo
    //    o estado challenge1* (PropertyY, EventXColors, Connective, etc.).
    //    Sem isso, ao chegar em 6.66 o nE recalculado dá 0 e a validação
    //    rejeita a resposta correta do aluno.
    if (stage === 1 && subStep === 6.56) {
      restartChallenge1Ref.current?.();
      return;
    }
    // ── Desafio Dinâmico 1 (6.6) — calcula os setores corretos
    //    usando o mesmo algoritmo do checkAnswer e simula a seleção. ──
    if (stage === 1 && subStep === 6.6) {
      // Garante que challenge1 está configurado; senão configura agora.
      if (!gameState.challenge1PropertyY) {
        restartChallenge1Ref.current?.();
        return;
      }
      const {
        challenge1SectorNumbers, challenge1PropertyY, challenge1EventXColors,
        challenge1Connective, challenge1EventXType, challenge1ValueP,
        challenge1InterProblemType, challenge1InterM, challenge1InterP, challenge1InterK,
      } = gameState;
      let correctSectors: number[];
      if (challenge1InterProblemType !== null) {
        correctSectors = Array.from(
          solveIntersectionSet(challenge1InterProblemType, challenge1SectorNumbers, challenge1InterM, challenge1InterP, challenge1InterK)
        );
      } else {
        correctSectors = [];
        sectors.forEach((sector, idx) => {
          const colorOk = challenge1EventXType === 'exclusao'
            ? !challenge1EventXColors.includes(sector.colorName)
            : challenge1EventXColors.includes(sector.colorName);
          const numOk = checkProperty(challenge1SectorNumbers[idx], challenge1PropertyY, challenge1ValueP);
          if (challenge1Connective === 'ou' ? (colorOk || numOk) : (colorOk && numOk)) {
            correctSectors.push(idx);
          }
        });
      }
      setGameState(prev => ({ ...prev, selectedSectors: correctSectors }));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }

    // ── Eventos Complementares: setup automático ao DEV chegar nessas cenas ──
    // Se o DEV pulou direto para 6.69/6.70/6.80/6.85+/6.90+ sem passar pelo
    // fluxo natural, compEventA pode estar null e compPhase indefinido.
    // Aqui inicializamos o comp* state e/ou ajustamos compPhase para que
    // os painéis JSX renderizem corretamente.
    if (stage === 1 && (subStep === 6.69 || subStep === 6.70 || subStep === 6.80 ||
                         subStep === 6.85 || subStep === 6.86 || subStep === 6.87 || subStep === 6.88 ||
                         subStep === 6.90 || subStep === 6.91 || subStep === 6.92 || subStep === 6.93)) {
      // Se compEventA ainda não foi gerado, inicializa toda a fase complementar.
      // Isso já leva ao subStep 6.70 com balão de intro.
      if (!gameState.compEventA) {
        initComplementaryPhaseRef.current?.();
        return;
      }
    }

    // ── 6.70 — Eventos Complementares (Parte 1): cicla por intro →
    //    selecting_A → selecting_Abar → show_both por exemplo, repete 3x.
    //    Cada DEV next avança UM passo do mini-fluxo interno. ──
    if (stage === 1 && subStep === 6.70) {
      const ev = gameState.compEventA;
      if (!ev) {
        initComplementaryPhaseRef.current?.();
        return;
      }
      if (compPhase === 'intro') {
        // Avança para selecting_A (mostra balão "Identifique o evento A")
        handleStartCompExerciseRef.current?.();
        return;
      }
      if (compPhase === 'selecting_A' || compPhase === 'wrong_A') {
        // Preenche seleção correta de A e confirma
        setCompUserSelectA([...ev.indicesA]);
        setTimeout(() => handleCompConfirmA(), 50);
        return;
      }
      if (compPhase === 'selecting_Abar' || compPhase === 'wrong_Abar') {
        // Preenche seleção correta de Ā e confirma
        setCompUserSelectAbar([...ev.indicesAbar]);
        setTimeout(() => handleCompConfirmAbar(), 50);
        return;
      }
      if (compPhase === 'show_both') {
        if (compExamplesViewed >= 3) {
          // Já viu 3+ exemplos → avança para formalização (6.80)
          handleInfoBoxConfirm();
          return;
        }
        // Próximo exemplo
        handleStartCompExerciseRef.current?.();
        return;
      }
    }

    // ── Eventos Complementares — cálculo guiado (6.85/6.86/6.87/6.88) e
    //    independente (6.90/6.91/6.92/6.93) ──
    if (stage === 1 && (subStep === 6.85 || subStep === 6.90)) {
      const ev = gameState.compEventA;
      if (!ev) return;
      // Se compPhase ainda não está em calc_selectA (DEV pulou direto), ajusta.
      if (compPhase !== 'calc_selectA') {
        setCompPhase('calc_selectA');
        setGameState(prev => ({ ...prev, selectedSectors: [] }));
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Marque o evento A',
          message: `Marque no disco os setores que pertencem ao evento <strong>A = "${ev.textA}"</strong>.`,
        });
        return;
      }
      setGameState(prev => ({ ...prev, selectedSectors: [...ev.indicesA] }));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 6.90 && compPhase === 'calc_pa') {
      const ev = gameState.compEventA;
      if (!ev) return;
      const m = ev.indicesA.length;
      const n = sectors.length;
      setCompPaInput({ num: String(m), den: String(n), errNum: false, errDen: false });
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && (subStep === 6.86 || subStep === 6.91)) {
      const ev = gameState.compEventA;
      if (!ev) return;
      if (compPhase !== 'calc_selectAbar') {
        setCompPhase('calc_selectAbar');
        setCompUserSelectAbar([]);
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Marque o evento Ā',
          message: `Marque no disco os setores que pertencem ao complementar <strong>Ā = "${ev.textAbar}"</strong>.`,
        });
        return;
      }
      setCompUserSelectAbar([...ev.indicesAbar]);
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    // ── 6.80 — formalize1/2/3/4: balão sequencial. Se compPhase ainda não
    //    está em formalize, inicializa formalize1 + balão. Senão, usa
    //    handleInfoBoxConfirm via showInfoBox check do topo. ──
    if (stage === 1 && subStep === 6.80) {
      const ev = gameState.compEventA;
      if (!ev) return;
      if (!compPhase.startsWith('formalize')) {
        setCompPhase('formalize1');
        setShowInfoBox(true);
        setInfoBoxContent({
          type: 'concept',
          title: 'Formalização — Passo 1',
          message: `Como os eventos <span style="white-space:nowrap">A e Ā</span> (complementar de A) cobrem todo o espaço amostral sem sobreposição, temos:<br/><br/><strong>P(A ∪ Ā) = P(S)</strong><br/><br/>A probabilidade de A ou Ā ocorrer é a probabilidade do espaço amostral inteiro.`,
        });
        return;
      }
    }
    if (stage === 1 && (subStep === 6.87 || subStep === 6.92)) {
      // 6.87/6.92 são apenas balões intermediários (showBoth) — confirma
      handleInfoBoxConfirm();
      return;
    }
    if (stage === 1 && (subStep === 6.88 || subStep === 6.93)) {
      // Cadeia P(Ā) = 1 - P(A) = n/n - m/n = (n-m)/n
      const ev = gameState.compEventA;
      if (!ev) return;
      const m = ev.indicesA.length;
      const n = sectors.length;
      setCompChainInputs({
        n1: String(n), d1: String(n),
        n2: String(m), d2: String(n),
        finalNum: String(n - m), finalDen: String(n),
        errN1: false, errD1: false, errN2: false, errD2: false,
        errFinalNum: false, errFinalDen: false,
      });
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }

    // ── Desafio Dinâmico 1 (6.6, 6.66, 6.67, 6.68) — usa challenge1* state ──
    if (stage === 1 && subStep === 6.66) {
      // Mesma lógica de 6.42 mas com expected vindo de gameState (já calculado pelo handler natural)
      // O handler de 6.66 espera exerciseNEInput igual ao número de setores favoráveis.
      // Como recálculo seria tedioso, deixamos o handler nativo validar com o valor que ele espera:
      // estratégia simplificada — preencher com selectedSectors.length (configurado em 6.6).
      fillThenCheck(() => setExerciseNEInput(prev => ({ ...prev, value: String(gameState.selectedSectors.length) })));
      return;
    }
    if (stage === 1 && subStep === 6.67) {
      fillThenCheck(() => setExerciseNSInput(prev => ({ ...prev, value: String(sectors.length) })));
      return;
    }
    if (stage === 1 && subStep === 6.68) {
      const num = String(gameState.selectedSectors.length);
      const den = String(sectors.length);
      setExercisePENumeratorInput(prev => ({ ...prev, value: num }));
      setExercisePEDenominatorInput(prev => ({ ...prev, value: den }));
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }

    // ── Frequência absoluta (8.5) e relativa (9.5) ──
    if (stage === 1 && subStep === 8.5 && freqAbsQuestion) {
      const expected = gameState.frequencies[freqAbsQuestion.color] || 0;
      setFreqAbsInput({ value: String(expected), error: false });
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 9.5 && freqRelQuestion) {
      const absFreq = gameState.frequencies[freqRelQuestion.color] || 0;
      const expectedPercent = (absFreq / gameState.ySpins) * 100;
      setFreqRelInput({ value: expectedPercent.toFixed(2).replace('.', ',') + '%', error: false });
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }

    // ── Convergência (11), questões teóricas (12, 13) ──
    if (stage === 1 && subStep === 11) {
      const expected = `1/${targetSectorCount}`;
      // Garante que convergenceInputs.convergence existe (com setValue válido).
      const existing = convergenceInputs.convergence;
      setConvergenceInputs({
        convergence: existing
          ? { ...existing, value: expected, error: false }
          : {
              value: expected, disabled: false, error: false,
              setValue: (v: string) => setConvergenceInputs(prev => ({
                ...prev, convergence: { ...prev.convergence, value: v },
              })),
            },
      });
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    if (stage === 1 && subStep === 12) {
      // theoreticalK pode não ter sido setado se DEV pulou — usar fallback.
      const k = gameState.theoreticalK || targetSectorCount;
      if (!gameState.theoreticalK) {
        setGameState(prev => ({ ...prev, theoreticalK: k }));
      }
      fillThenCheck(() => setTheoreticalQuestion1Input(prev => ({ ...prev, value: `1/${k}` })));
      return;
    }
    if (stage === 1 && subStep === 13) {
      const k = gameState.theoreticalK || targetSectorCount;
      fillThenCheck(() => setTheoreticalQuestion2Input(prev => ({ ...prev, value: `1/${k}` })));
      return;
    }

    // ── Interpretação (14) — q1/q2/q3 com handleInterpretationCheck ──
    if (stage === 1 && subStep === 14) {
      // Se interpretationPhase ainda não foi inicializado (DEV pulou), inicia em q1.
      if (interpretationPhase === 'done') {
        setInterpretationPhase('q1');
        setInterpretationSelected('');
        return;
      }
      if (interpretationPhase === 'q1' || interpretationPhase === 'q2') {
        setInterpretationSelected('nao');
        setTimeout(() => handleInterpretationCheck(), 50);
        return;
      }
      if (interpretationPhase === 'q3' && interpretationQ3) {
        setInterpretationSelected(interpretationQ3.correctId);
        setTimeout(() => handleInterpretationCheck(), 50);
        return;
      }
      if (interpretationPhase === 'feedback') {
        handleInterpretationContinueRef.current?.();
        return;
      }
    }

    // ── LGN (15) — fluxo de 5 fases: problem1 → problem2 → note →
    //    explanation → verbal. Cada DEV next executa a transição que o
    //    botão correspondente da OVA faria. ──
    if (stage === 1 && subStep === 15) {
      if (!lgnParams) {
        handleInterpretationContinueRef.current?.();
        return;
      }
      if (lgnPhase === 'problem1' || lgnPhase === 'problem2') {
        const expected = lgnPhase === 'problem1' ? lgnParams.answer1 : lgnParams.answer2;
        fillThenCheck(() => setLgnInput({ value: String(expected), error: false }));
        return;
      }
      if (lgnPhase === 'note') {
        // Botão "Quero saber!" → handleLgnWantToKnow
        handleLgnWantToKnow();
        return;
      }
      if (lgnPhase === 'explanation') {
        // Botão "Continuar" → handleLgnContinue (vai para fase verbal)
        handleLgnContinue();
        return;
      }
      if (lgnPhase === 'verbal') {
        // Preenche resposta dummy + dispara handleLgnVerbalConfirm
        // (que valida 10+ chars e avança para subStep 15.5).
        setLgnVerbalInput({
          value: 'Porque cada repetição é independente e a frequência só se aproxima da probabilidade teórica em muitas repetições.',
          error: false,
        });
        setTimeout(() => handleLgnVerbalConfirm(), 50);
        return;
      }
    }

    // ── Giros manuais (7) e novos giros (8): pula com frequências
    //    sintetizadas (distribuição equiprovável) para a tabela aparecer. ──
    if (stage === 1 && subStep === 7) {
      const total = gameState.manualSpinsRequired || sectors.length;
      const freqs: { [color: string]: number } = {};
      const per = Math.floor(total / sectors.length);
      let rem = total - per * sectors.length;
      sectors.forEach(s => {
        freqs[s.colorName] = per + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      });
      setGameState(prev => ({
        ...prev,
        subStep: 7.1,
        manualSpinsDone: total,
        frequencies: freqs,
        totalSpins: (prev.totalSpins || 0) + total,
      }));
      setShowInfoBox(true);
      setInfoBoxContent({
        type: 'concept',
        title: 'Resultados dos Giros',
        message: `Você completou os ${total} giros manuais. Compare com sua previsão e siga para a próxima etapa.`,
      });
      playSound("/sounds/challengeFinished.mp3");
      return;
    }
    if (stage === 1 && subStep === 8) {
      const total = gameState.ySpins || 10;
      const freqs: { [color: string]: number } = { ...gameState.frequencies };
      const per = Math.floor(total / sectors.length);
      let rem = total - per * sectors.length;
      sectors.forEach(s => {
        freqs[s.colorName] = (freqs[s.colorName] || 0) + per + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      });
      // Configura freqAbsQuestion para que o painel de 8.5 renderize.
      const colorsArr = sectors.map(s => s.colorName);
      const randomColor = colorsArr[Math.floor(Math.random() * colorsArr.length)];
      setFreqAbsQuestion({ color: randomColor });
      setFreqAbsInput({ value: '', error: false });
      setGameState(prev => ({
        ...prev,
        subStep: 8.5,
        manualSpinsDone: total,
        frequencies: freqs,
        totalSpins: (prev.totalSpins || 0) + total,
      }));
      setInstructions(`<p class="ds-body"><strong>Frequência Absoluta</strong></p>
        <p class="ds-body">Leia o conceito abaixo e responda a pergunta.</p>`);
      playSound("/sounds/challengeFinished.mp3");
      createAlert("Giros concluídos!", `${total} giros registrados na tabela.`, "success", 2500);
      return;
    }
    // ── 8.6 (conceito frequência relativa) → 9 com inputs por cor configurados.
    if (stage === 1 && subStep === 8.6) {
      const inputs: { [color: string]: TextInputInterface } = {};
      sectors.forEach(s => {
        inputs[s.colorName] = {
          value: '', disabled: false, error: false,
          setValue: (val: string) => setRelativeFrequencyInputs(prev => ({
            ...prev, [s.colorName]: { ...prev[s.colorName], value: val },
          })),
        };
      });
      setRelativeFrequencyInputs(inputs);
      setGameState(prev => ({ ...prev, subStep: 9 }));
      setShowInfoBox(false);
      setInstructions(`<p class="ds-body"><strong>Frequências Relativas: Comparando Proporções Observadas</strong></p>
        <p class="ds-body">Calcule a frequência relativa de cada cor (frequência absoluta / total de giros).</p>
        <p class="ds-body">Digite na forma de fração (ex: 3/${gameState.ySpins || 10}).</p>`);
      playSound("/sounds/nextChallenge.mp3");
      return;
    }
    // ── 9 (frequências relativas por cor) — preenche cada input com freq/ySpins.
    if (stage === 1 && subStep === 9) {
      const ySpins = gameState.ySpins || Math.max(gameState.totalSpins || 1, 1);
      const filled: { [color: string]: TextInputInterface } = {};
      sectors.forEach(s => {
        const f = gameState.frequencies[s.colorName] || 0;
        const existing = relativeFrequencyInputs[s.colorName];
        filled[s.colorName] = existing
          ? { ...existing, value: `${f}/${ySpins}`, error: false }
          : { value: `${f}/${ySpins}`, disabled: false, error: false };
      });
      setRelativeFrequencyInputs(filled);
      setTimeout(() => checkAnswerRef.current?.(), 50);
      return;
    }
    // ── 16 (Etapa 1 concluída) — apenas garante que o botão "Próxima Etapa"
    //    está habilitado e dispara o som de conclusão se não foi disparado. ──
    if (stage === 1 && subStep === 16) {
      setDisabledNextButton(false);
      setGameState(prev => ({ ...prev, stage2Available: true }));
      return;
    }
    // ── Auto-spins (subStep 10 — 50/100/150/200): popula frequencies com
    //    500 giros equiprováveis (50+100+150+200) e avança para a pergunta
    //    de convergência (subStep 11). ──
    if (stage === 1 && subStep === 10) {
      const total = (gameState.autoSpinBatches || [50, 100, 150, 200]).reduce((s, v) => s + v, 0);
      const freqs: { [color: string]: number } = { ...gameState.frequencies };
      const per = Math.floor(total / sectors.length);
      let rem = total - per * sectors.length;
      sectors.forEach(s => {
        freqs[s.colorName] = (freqs[s.colorName] || 0) + per + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      });
      setGameState(prev => ({
        ...prev,
        subStep: 11,
        frequencies: freqs,
        totalSpins: (prev.totalSpins || 0) + total,
        currentAutoBatchIndex: (gameState.autoSpinBatches || []).length,
      }));
      setShowAutoSpinButtons(false);
      playSound("/sounds/challengeFinished.mp3");
      createAlert("Convergência observada!", `${total} giros automáticos concluídos.`, "success", 3000);
      return;
    }

    // ── Fallback genérico: bumpa subStep no array da etapa atual,
    //    herdando o resto do gameState. Se subStep atual não está no array
    //    (cena dinâmica fora do mapa), salta para o próximo subStep MAIOR
    //    do array — evita travamento quando o aluno chega a um estado não
    //    pré-mapeado (ex.: subSteps internos do treino comp/union/lgn). ──
    const phases = ROULETTE_STAGE_PHASES[stage] ?? [];
    const idx = phases.indexOf(subStep);
    if (idx >= 0 && idx < phases.length - 1) {
      setGameState(prev => ({ ...prev, subStep: phases[idx + 1] }));
      return;
    }
    if (idx === -1) {
      // subStep atual desconhecido — encontra próximo MAIOR no array.
      const nextHigher = phases.find(p => p > subStep);
      if (nextHigher !== undefined) {
        setGameState(prev => ({ ...prev, subStep: nextHigher }));
        return;
      }
    }
    // Final do array da etapa atual — equivale a chegar à tela de "Próxima
    // Etapa" da OVA. Configura o estado pós-conclusão e habilita o botão.
    if (stage === 1) {
      setGameState(prev => ({ ...prev, subStep: 16, stage2Available: true }));
      setDisabledNextButton(false);
      setInstructions(`<p class="ds-body"><strong>Etapa 1 Concluída!</strong></p>
        <p class="ds-body">Você aprendeu sobre probabilidade equiprovável e a Lei dos Grandes Números.</p>
        <p class="ds-body">Clique em <strong>Próxima Etapa</strong> para continuar.</p>`);
      return;
    }
    if (stage === 2) {
      setGameState(prev => ({ ...prev, stage3Available: true }));
      setDisabledNextButton(false);
      return;
    }
  }, [
    showInfoBox, handleInfoBoxConfirm, gameState,
    setSliderValue, setSelectedOption, setSampleSpaceInput, setSampleSpaceCountInput,
    setTheoreticalQuestion1Input, setTheoreticalQuestion2Input,
    probabilityInputs, setProbabilityInputs,
    setFavorableCasesInput, setExerciseNEInput, setExerciseNSInput,
    setExercisePENumeratorInput, setExercisePEDenominatorInput, setPredictionInput,
    compPhase, setCompPhase, setCompPaInput, setCompUserSelectA, setCompUserSelectAbar, setCompChainInputs,
    compExamplesViewed, setCompExamplesViewed,
    deterministicExamplesViewed, randomExamplesViewed,
    handleSeeMoreDeterministicExamples, handleSeeMoreRandomExamples,
    compCalcExampleNum, setCompChainResult, setInstructions,
    handleCompConfirmA, handleCompConfirmAbar,
    freqAbsQuestion, setFreqAbsQuestion, setFreqAbsInput, freqRelQuestion, setFreqRelInput,
    relativeFrequencyInputs, setRelativeFrequencyInputs,
    convergenceInputs, setConvergenceInputs,
    interpretationPhase, interpretationQ3, setInterpretationPhase, setInterpretationSelected, handleInterpretationCheck,
    lgnPhase, lgnParams, setLgnInput, setLgnVerbalInput,
    handleLgnWantToKnow, handleLgnContinue, handleLgnVerbalConfirm,
    setShowInfoBox, setInfoBoxContent,
  ]);

  // Handler para avançar do feedback para fase LGN (subStep 15)
  const handleInterpretationContinue = useCallback(() => {
    setInterpretationPhase('done');
    const n = gameState.targetSectorCount;
    const params = generateLgnParams(n, gameState.sectors);
    setLgnN(n);
    setLgnParams(params);
    setLgnPhase('problem1');
    setLgnInput({ value: '', error: false });
    setGameState(prev => ({ ...prev, subStep: 15 }));
    setInstructions(`<p class="ds-body"><strong>Problema 1: Disco</strong></p>
      <p class="ds-body">Leia o enunciado e responda.</p>`);
  }, [gameState.targetSectorCount, gameState.sectors, generateLgnParams]);

  // Atualiza o ref usado pelo devSimulateAdvance.
  handleInterpretationContinueRef.current = handleInterpretationContinue;

  return {
    // Game state
    gameState,
    sliderValue,
    setSliderValue,
    selectedOption,
    setSelectedOption,
    currentQuestion,

    // Inputs
    sampleSpaceInput,
    setSampleSpaceInput,
    sampleSpaceCountInput,
    setSampleSpaceCountInput,
    probabilityInputs,
    relativeFrequencyInputs,
    convergenceInputs,
    colorCountInputs,
    theoreticalQuestion1Input,
    theoreticalQuestion2Input,
    predictionInput,
    favorableCasesInput,
    exerciseNEInput,
    exerciseNSInput,
    exercisePENumeratorInput,
    exercisePEDenominatorInput,

    // Data
    getFrequencyData,
    getChartData,

    // Actions
    spinRoulette,
    handleSpinEnd,
    checkAnswer,
    nextStep,
    startAutoSpins,
    registerColor,
    startStage1,
    startStage2,
    startStage3,
    // Acesso direto ao state machine — uso restrito ao painel de DEV
    // da sequência didática para navegação manual entre ceninhas.
    setGameState,
    devSimulateAdvance,
    getDevSnapshot,
    applyDevSnapshot,
    getDevCenaId,
    toggleSectorSelection,
    restartExercise,
    restartChallenge1,

    // Info box
    showInfoBox,
    setShowInfoBox,
    infoBoxContent,
    handleInfoBoxConfirm,

    // Exemplos vistos (para controle de botões)
    deterministicExamplesViewed,
    randomExamplesViewed,
    handleSeeMoreDeterministicExamples,
    handleSeeMoreRandomExamples,

    // Exemplos de eventos disjuntos
    disjointExamplesViewed,
    handleSeeMoreDisjointExamples,
    disjointNeedsNumbers,

    // Exercício interativo de eventos disjuntos
    disjointExercisePhase,
    disjointUserSelectA,
    disjointUserSelectB,
    handleStartDisjointExercise,
    handleDisjointSectorClick,
    handleDisjointConfirmA,
    handleDisjointConfirmB,
    handleDisjointRetry,

    // Probabilidade da União de Eventos ME
    unionPhase,
    unionActivityNum,
    unionCurrentEventIdx,
    unionEvents,
    unionSelectedSectors,
    unionProbNumInput,
    unionProbDenInput,
    unionFinalNumInput,
    unionFinalDenInput,
    unionSectorNumbers,
    unionMaxActivities,
    unionNeedsNumbers,
    setUnionProbNumInput,
    setUnionProbDenInput,
    setUnionFinalNumInput,
    setUnionFinalDenInput,
    handleUnionSectorClick,
    handleUnionConfirmSelection,
    handleUnionConfirmProb,
    handleUnionConfirmFinal,
    handleUnionNextActivity,

    // Características do experimento aleatório (múltipla seleção)
    selectedCharacteristics,
    toggleCharacteristic,
    randomExperimentCharacteristics: RANDOM_EXPERIMENT_CHARACTERISTICS,

    // Fase de experimentação (3 tentativas)
    experimentationState,
    handleExperimentationBet,
    handleResultConfirmation,
    spinRouletteExperimentation,
    handleS2Bet,
    handleS2Confirmation,
    spinRouletteS2,
    handleColorPaletteSelect,
    progressiveReadingStep,

    // Razões Angulares — state machine (subStep 3)
    s2RatioPhase,
    s2ConceptQuestion,
    s2ConceptSelected, setS2ConceptSelected,
    s2UnitSectorIndex,
    s2TableAllCorrect,
    handleRatioSectorClick,
    handleRatioTableContinue,

    // Sequência de raciocínio (razão → área → probabilidade)
    s2ReasoningColorY,
    s2ReasoningAngleY,
    s2ReasoningRatio,
    s2ReasoningInput, setS2ReasoningInput,
    s2ReasoningErrors,
    s2ReasoningShowHint,

    // Probabilidades i·p — state machine (subStep 4)
    s2IxPhase,
    s2IxSumSelected, setS2IxSumSelected,
    s2IxCalcStep,
    handleIxCalcNext,

    // Fase de Treinos (Treino 1-4)
    trainingState,
    trainRatioInputs,
    trainIxInputs,
    trainSumInput,
    trainProbInputs,
    handleTrainingSectorClick,
    handleTrainingCalcNext,
    handleTrainingNext,
    handleTrainingContinue,

    // Perguntas conceituais pós-classificação (subSteps 2.3-2.5)
    s2RandomColors,

    // Leitura progressiva probabilidade angular (subStep 7)
    s2AngleReadingStep,
    handleAngleReadingNext,

    // Giros reflexivos (subSteps 6.201-6.205)
    s2SpinReflection, setS2SpinReflection,
    handleSpinReflectionContinue,
    handleReflectionOptionChange,
    handleReflectionBetClick,

    // Control states
    instructions,
    disabledSpinButton,
    disabledCheckButton,
    disabledNextButton,
    showAutoSpinButtons,

    // Alertas e Modal
    alerts,
    updateAlert,
    deleteAlerts,
    modal,
    updateModal,

    // Eventos Complementares
    compPhase,
    compExamplesViewed,
    compCalcExampleNum,
    compUserSelectA,
    compUserSelectAbar,
    compIsGuided,
    compChainInputs, setCompChainInputs,
    compChainResult,
    compPaInput, setCompPaInput,
    compStepByStep, setCompStepByStep,
    handleCompSectorClick,
    handleCompConfirmA,
    handleCompConfirmAbar,
    handleCompRetry,
    handleStartCompExercise,
    handleCompSeeMoreExamples,

    // Frequência Absoluta (subStep 8.5)
    freqAbsQuestion,
    freqAbsInput, setFreqAbsInput,

    // Frequência Relativa conceitual (subStep 8.6)
    freqRelConceptPhase,
    handleFreqRelConceptLi,
    handleFreqRelConceptContinue,

    // Frequência Relativa verificação (subStep 9.5)
    freqRelQuestion,
    freqRelInput, setFreqRelInput,

    // Interpretação dos Resultados
    interpretationPhase,
    interpretationSelected, setInterpretationSelected,
    interpretationQ3,
    handleInterpretationCheck,
    handleInterpretationContinue,

    // Problemas de consolidação LGN (subStep 15)
    lgnPhase,
    lgnN,
    lgnParams,
    lgnInput, setLgnInput,
    lgnVerbalInput, setLgnVerbalInput,
    handleLgnWantToKnow,
    handleLgnContinue,
    handleLgnVerbalConfirm,
    diceState, diceInput, setDiceInput,
    handleDiceRoll, handleDiceAnswer,

    // Etapa 2 — Probabilidade Não Equiprovável
    s2RatioInputs, setS2RatioInputs,
    s2IxInputs, setS2IxInputs,
    s2SumEquationInput, setS2SumEquationInput,
    s2XInput, setS2XInput,
    s2NumProbInputs, setS2NumProbInputs,
    s2AngleProbInputs, setS2AngleProbInputs,
    s2PredictionInput, setS2PredictionInput,
    s2FreqAbsInputs, setS2FreqAbsInputs,
    s2FreqRelInputs, setS2FreqRelInputs,
    s2ConclusionInput, setS2ConclusionInput,

    // Treinos de Fração θ/360 (subStep 8 da Etapa 2)
    fracTraining,
    fracThetaInputs, setFracThetaInputs,
    handleFracTrainingNext,
    handleFracTrainingChangePhase,

    // Simulação de Convergência (subStep 8.7 da Etapa 2)
    convergenceSim,
    handleConvergenceBlock,
    handleConvergenceContinue,

    // Etapa 3
    s3State,
    setS3State,
    handleS3ConfirmPrediction,
    handleS3SectorBet,
    handleS3ConfirmBet,
    handleS3Finalize,
    handleS3GoToReflection,
    spinRouletteS3,
    handleS3FallacyContinue,
    handleS3NewBetConfirm,
    handleS3FallacyFinish,

    // Melhoria 12 — Log de desempenho
    downloadLog,
    getLogSummary
  };
};
