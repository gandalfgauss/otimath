/* ═══════════════════════════════════════════════════════════════════
   twoDicesPhaseRegistry.ts — Catálogo descritivo das phases do OVA
   Dois Dados, com habilidades pedagógicas, habilidades BNCC, tópicos
   do Mapa Dr. OtiMath e bloco conceitual.

   Usado pela Tela de Fechamento Reflexiva (componente "desempenho por
   exercício") e pelo Painel de Histórico ao Vivo (visibilidade de
   estrutura — NIELSEN, 1994, heurística 1).

   Cada entrada descreve UMA phase canônica do `TwoDicesExperiment`,
   anotando:
     • shortLabel  — nome curto para chips/listas
     • title       — título completo para a Tela de Fechamento
     • block       — bloco conceitual (cenas 1–7, Corrida, Eventos
                     Complementares, Fundamentação da União, Ex1–Ex8)
     • topicsT     — códigos do Mapa Dr. OtiMath (T1–T8)
     • bnccCodes   — habilidades BNCC mapeadas (EM13MAT*)
     • abilities   — habilidades operacionais que o exercício mobiliza
                     (linguagem do estudante; o que ele FAZ na atividade)
   Habilidades BNCC seguem o Mapa de Tópicos do PROMPT_MESTRE_OTIMATH_v5.1
   (BRASIL, 2018).
   ─────────────────────────────────────────────────────────────────── */

export interface PhaseDescriptor {
  /** id canônico (== Phase do Experiment / 'corrida' agregado, etc.) */
  id: string;
  shortLabel: string;
  title: string;
  /** Bloco conceitual ao qual a phase pertence (agrupamento na Tela). */
  block:
    | 'apresentacao'
    | 'sistematizacaoTabular'
    | 'corrida'
    | 'eventosComplementares'
    | 'fundamentacaoUniao'
    | 'exercicios'
    | 'revisao'
    | 'fixacao'
    | 'fechamento';
  /** Tópicos do Mapa Dr. OtiMath (T1=Aleatoriedade, T2=Espaço amostral,
   *  T3=Probabilidade clássica, T4=Representação, T5=Complementar,
   *  T6=União/Interseção/Diferença, T7=P(união), T8=Frequência relativa). */
  topicsT: readonly string[];
  /** Códigos BNCC do Ensino Médio. */
  bnccCodes: readonly string[];
  /** Habilidades operacionais do estudante (frases curtas começando
   *  com verbo no infinitivo — linguagem de objetivo de aprendizagem). */
  abilities: readonly string[];
}

/* Descritivo do bloco — usado como cabeçalho na Tela de Fechamento. */
export const BLOCK_TITLES: Record<PhaseDescriptor['block'], string> = {
  apresentacao:           'Apresentação inicial',
  sistematizacaoTabular:  'Sistematização tabular do espaço amostral',
  corrida:                'Corrida dos Carrinhos',
  eventosComplementares:  'Eventos Complementares',
  fundamentacaoUniao:     'Fundamentação da União',
  exercicios:             'Exercícios de aplicação (Ex1–Ex5)',
  revisao:                'Revisão obrigatória (Ex6)',
  fixacao:                'Fixação opcional (Ex7 / Ex8)',
  fechamento:             'Fechamento',
};

export const PHASE_REGISTRY: readonly PhaseDescriptor[] = [
  {
    id: 'intro',
    shortLabel: 'Apresentação',
    title: 'Apresentação inicial — TwoDicesGame introdutório',
    block: 'apresentacao',
    topicsT: ['T1', 'T2', 'T3'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205'],
    abilities: [
      'Explorar o jogo dos dois dados como objeto exploratório autônomo',
      'Reconhecer aleatoriedade no lançamento de dois dados',
    ],
  },
  {
    id: 'tree',
    shortLabel: 'Árvore',
    title: 'Cena 1 — Árvore do espaço amostral',
    block: 'sistematizacaoTabular',
    topicsT: ['T2', 'T4'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Construir o espaço amostral S = {1,…,6}² via diagrama de árvore',
      'Compreender o produto cartesiano como base da contagem combinatória',
    ],
  },
  {
    id: 'ready',
    shortLabel: 'Cena 2 — Lançamento',
    title: 'Cena 2 — Primeiro lançamento concreto',
    block: 'sistematizacaoTabular',
    topicsT: ['T1', 'T2'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205'],
    abilities: [
      'Observar o resultado de um lançamento físico de dois dados',
      'Identificar par ordenado (verde, azul) como resultado elementar',
    ],
  },
  {
    id: 'pickPair',
    shortLabel: 'Cena 3 — Picker',
    title: 'Cena 3 — Picker do par ordenado',
    block: 'sistematizacaoTabular',
    topicsT: ['T2', 'T4'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Selecionar o par (verde, azul) que corresponde ao lançamento',
      'Distinguir (g, b) de (b, g) como pares ordenados diferentes',
    ],
  },
  {
    id: 'markTable',
    shortLabel: 'Cena 4 — Marcar tabela',
    title: 'Cena 4 — Marcar a célula correspondente na tabela 6×6',
    block: 'sistematizacaoTabular',
    topicsT: ['T2', 'T4'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Localizar células na tabela 6×6 dado um par ordenado',
      'Reconhecer a tabela como representação organizada de S',
    ],
  },
  {
    id: 'sumReveal',
    shortLabel: 'Cena 5 — Somas',
    title: 'Cena 5 — Distribuição triangular das somas',
    block: 'sistematizacaoTabular',
    topicsT: ['T2', 'T3', 'T8'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Identificar somas possíveis (2 a 12) e impossíveis (1 e 13)',
      'Reconhecer a distribuição triangular emergente das somas',
    ],
  },
  {
    id: 'probPair',
    shortLabel: 'Cena 6 — P(par)',
    title: 'Cena 6 — P(par ordenado) = 1/36 por equiprobabilidade',
    block: 'sistematizacaoTabular',
    topicsT: ['T3'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Aplicar a definição clássica P(A) = n(A)/n(S) num caso elementar',
      'Reconhecer a equiprobabilidade dos 36 pares ordenados',
    ],
  },
  {
    id: 'probSumReveal',
    shortLabel: 'Cena 7 — P(soma)',
    title: 'Cena 7 — P(soma) varia conforme a soma escolhida',
    block: 'sistematizacaoTabular',
    topicsT: ['T3', 'T4'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Calcular P(soma = k) contando favoráveis na tabela',
      'Comparar probabilidades de somas diferentes',
    ],
  },
  {
    id: 'raceBet',
    shortLabel: 'Corrida — Aposta',
    title: 'Corrida dos Carrinhos — aposta inicial',
    block: 'corrida',
    topicsT: ['T1', 'T3'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205'],
    abilities: [
      'Decidir uma aposta sob risco com base na distribuição triangular',
      'Reconhecer impossibilidade dos carrinhos 1 e 13',
    ],
  },
  {
    id: 'raceRunning',
    shortLabel: 'Corrida — Rodando',
    title: 'Corrida dos Carrinhos — execução com lançamentos repetidos',
    block: 'corrida',
    topicsT: ['T1', 'T8'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Observar variabilidade de curto prazo de uma sequência aleatória',
      'Coordenar resultado dos dados com soma e carrinho correspondente',
    ],
  },
  {
    id: 'raceFinished',
    shortLabel: 'Corrida — Resultado',
    title: 'Corrida dos Carrinhos — resultado e reflexão',
    block: 'corrida',
    topicsT: ['T1', 'T3', 'T8'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305'],
    abilities: [
      'Refletir sobre o resultado da corrida à luz da distribuição',
      'Reconhecer que aleatoriedade não é desordem',
    ],
  },
  {
    id: 'complementaryEvents',
    shortLabel: 'Eventos Complementares',
    title: 'Eventos Complementares — P(A) + P(Ā) = 1',
    block: 'eventosComplementares',
    topicsT: ['T3', 'T5'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205'],
    abilities: [
      'Construir o complementar Ā = S − A',
      'Verificar P(A) + P(Ā) = 1 em casos concretos',
    ],
  },
  {
    id: 'unionTheory',
    shortLabel: 'Fundamentação da União',
    title: 'Fundamentação da União — P(A∪B) = P(A) + P(B) − P(A∩B)',
    block: 'fundamentacaoUniao',
    topicsT: ['T6', 'T7'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Compreender a fórmula da inclusão-exclusão',
      'Distinguir A ∪ B de A ∩ B em registro tabular',
    ],
  },
  {
    id: 'unionExercises',
    shortLabel: 'Ex1 — União',
    title: 'Exercício 1 — Aplicação direta da união',
    block: 'exercicios',
    topicsT: ['T6', 'T7'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Aplicar P(A∪B) = P(A) + P(B) − P(A∩B) num caso simples',
    ],
  },
  {
    id: 'unionExercise2',
    shortLabel: 'Ex2 — União',
    title: 'Exercício 2 — União com novo par de eventos',
    block: 'exercicios',
    topicsT: ['T6', 'T7'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Reconhecer a estrutura da fórmula em contextos variados',
    ],
  },
  {
    id: 'unionExercise3',
    shortLabel: 'Ex3 — União',
    title: 'Exercício 3 — União em registro tabular',
    block: 'exercicios',
    topicsT: ['T4', 'T6', 'T7'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Articular registro tabular e registro fracionário',
    ],
  },
  {
    id: 'unionExercise4',
    shortLabel: 'Ex4 — Interseção',
    title: 'Exercício 4 — Interseção',
    block: 'exercicios',
    topicsT: ['T6'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Marcar células de A ∩ B usando o predicado conjunto',
      'Distinguir "e" matemático de "e" cotidiano',
    ],
  },
  {
    id: 'unionExercise5',
    shortLabel: 'Ex5 — Contingência',
    title: 'Exercício 5 — Tabela de contingência',
    block: 'exercicios',
    topicsT: ['T4', 'T6', 'T7'],
    bnccCodes: ['EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Ler probabilidades em tabela de contingência (registro cruzado)',
    ],
  },
  {
    id: 'unionExercise6',
    shortLabel: 'Ex6 — Revisão',
    title: 'Exercício 6 — Revisão obrigatória (∪ e ∩, sorteio)',
    block: 'revisao',
    topicsT: ['T3', 'T4', 'T5', 'T6', 'T7'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Marcar A → B → D em ordem na tabela 6×6',
      'Identificar a operação que gera D a partir de A e B',
      'Calcular P(D) com fração equivalente aceita',
      'Consultar verbetes do Menu de Revisão sob demanda',
    ],
  },
  {
    id: 'twoDicesGameFree',
    shortLabel: 'Ex7 — Fixação básica',
    title: 'Exercício 7 — Fixação básica (12 eventos fixos, opcional)',
    block: 'fixacao',
    topicsT: ['T3', 'T5', 'T6', 'T7'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Resolver autonomamente 7 desafios sorteados sobre 12 eventos',
      'Usar Marcar todos! + complementar como estratégia ergonômica',
    ],
  },
  {
    id: 'unionExercise8',
    shortLabel: 'Ex8 — Fixação avançada',
    title: 'Exercício 8 — Fixação avançada (~50 eventos parametrizados, opcional)',
    block: 'fixacao',
    topicsT: ['T3', 'T5', 'T6', 'T7'],
    bnccCodes: ['EM13MAT105', 'EM13MAT205', 'EM13MAT305', 'EM13MAT405'],
    abilities: [
      'Resolver desafios com pool ampliado de eventos parametrizados',
      'Aplicar progressão de dificuldade (slot 1 → slot 4)',
      'Marcar A → B → D sequencialmente nos compostos',
    ],
  },
  {
    id: 'finished',
    shortLabel: 'Fechamento',
    title: 'Fechamento — Tela Reflexiva',
    block: 'fechamento',
    topicsT: [],
    bnccCodes: [],
    abilities: [
      'Refletir sobre o próprio percurso',
      'Identificar conceitos consolidados e o que vem no próximo OVA',
    ],
  },
];

/** Lookup O(1) por id. */
const PHASE_BY_ID: Record<string, PhaseDescriptor> =
  Object.fromEntries(PHASE_REGISTRY.map((p) => [p.id, p]));

export function getPhaseDescriptor(id: string): PhaseDescriptor | undefined {
  return PHASE_BY_ID[id];
}

/** Agrupa o registry por bloco, preservando a ordem original dentro do bloco. */
export function groupByBlock(): Array<{ block: PhaseDescriptor['block']; items: PhaseDescriptor[] }> {
  const out = new Map<PhaseDescriptor['block'], PhaseDescriptor[]>();
  for (const p of PHASE_REGISTRY) {
    if (!out.has(p.block)) out.set(p.block, []);
    out.get(p.block)!.push(p);
  }
  return Array.from(out.entries()).map(([block, items]) => ({ block, items }));
}

/* ───────────────────────────────────────────────────────────────────
   BNCC — descrição completa das habilidades referenciadas, para
   apresentar legenda na Tela de Fechamento. Fonte: BNCC do Ensino
   Médio (BRASIL, 2018) — citamos apenas as habilidades efetivamente
   trabalhadas no OVA Dois Dados.
   ─────────────────────────────────────────────────────────────────── */

export const BNCC_DESCRIPTIONS: Record<string, string> = {
  EM13MAT105:
    'Utilizar as noções de probabilidade para interpretar informações estatísticas em diferentes contextos.',
  EM13MAT205:
    'Resolver problemas usando o princípio fundamental da contagem e a probabilidade clássica.',
  EM13MAT305:
    'Resolver e elaborar problemas envolvendo o cálculo de probabilidade de eventos compostos com ou sem reposição.',
  EM13MAT405:
    'Reconhecer e descrever situações de probabilidade condicional e operações entre eventos.',
};

/* ───────────────────────────────────────────────────────────────────
   Tópicos do Mapa Dr. OtiMath — descritivo curto.
   ─────────────────────────────────────────────────────────────────── */

export const TOPIC_DESCRIPTIONS: Record<string, string> = {
  T1: 'Aleatoriedade e experimento aleatório',
  T2: 'Espaço amostral e eventos',
  T3: 'Probabilidade clássica e equiprobabilidade',
  T4: 'Representação do espaço amostral',
  T5: 'Eventos complementares',
  T6: 'União, interseção e diferença',
  T7: 'Probabilidade da união (inclusão-exclusão)',
  T8: 'Frequência relativa e Lei dos Grandes Números',
};
