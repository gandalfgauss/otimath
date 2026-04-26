/* ═══════════════════════════════════════════════════════════════════
   exercise6Challenges.ts — Pools curados para o Exercício 6 (Revisão)

   PROPÓSITO
   ---------
   O Ex6-Revisão executa 2 rodadas: uma de União (∪) e uma de Interseção (∩).
   A ordem emerge do sorteio: a Rodada 1 é sorteada entre TODOS os 10
   candidatos curados (5 ∪ + 5 ∩); a Rodada 2 é sorteada entre os 5
   candidatos do POOL DA OPERAÇÃO OPOSTA. Garante-se cobertura das duas
   operações em qualquer execução, sem repetição.

   GARANTIAS MATEMÁTICAS (verificadas no boot por assertPoolIsHealthy)
   -------------------------------------------------------------------
     I1  Cada candidato é um par (aIndex, bIndex) com aIndex ≠ bIndex
     I2  Operação ∈ {Union, Intersection}
     I3  Cardinalidades n(A) e n(B) não-extremas (1..35)
     I4  A ⊄ B e B ⊄ A (a operação não trivializa)
     I5  Para União: A ∩ B ≠ ∅ (subtração de Venn não-vazia, fórmula da adição é necessária)
     I6  n(D) ∈ {1..35} (resposta P(D) não-degenerada)
     I7  reducedP é coerente com (favorable, total) por multiplicação cruzada
     I8  Pares (aIndex, bIndex) DISJUNTOS entre os dois pools — repetição
         de par entre rodadas é matematicamente impossível

   CURADORIA — índice dos eventos (vide useTwoDicesHooks.ts:41-103)
   ----------------------------------------------------------------
     0  E1  Soma maior que 8                  n=10
     1  E2  Menor face igual a 5              n=3
     2  E3  Face par no dado verde            n=18
     3  E4  Soma igual a 6                    n=5
     4  E5  Produto das faces maior que 15    n=11
     5  E6  Número primo no dado azul         n=18
     6  E7  Maior face igual a 4              n=5
     7  E8  Soma menor que 7                  n=15
     8  E9  Pelo menos uma face par           n=27
     9  E10 Pelo menos uma face múltipla de 3 n=20
    10  E11 Exatamente uma face par           n=18
    11  E12 Nenhuma face par                  n=9
   ═══════════════════════════════════════════════════════════════════ */

export type Ex6Operation = 'Union' | 'Intersection';

export interface Ex6Candidate {
  readonly id: string;
  readonly aIndex: number;
  readonly bIndex: number;
  readonly operation: Ex6Operation;
  readonly nA: number;
  readonly nB: number;
  readonly nIntersection: number;  // |A ∩ B|
  readonly nResult: number;        // |D| = |A∪B| ou |A∩B| conforme operation
  readonly reducedP: { readonly num: number; readonly den: number };
  readonly descriptionA: string;
  readonly descriptionB: string;
}

const TOTAL = 36;

export const EX6_UNION_POOL: readonly Ex6Candidate[] = [
  {
    id: 'U1', aIndex: 0, bIndex: 2, operation: 'Union',
    nA: 10, nB: 18, nIntersection: 6, nResult: 22,
    reducedP: { num: 11, den: 18 },
    descriptionA: 'Soma maior que 8', descriptionB: 'Face par no dado verde',
  },
  {
    id: 'U2', aIndex: 7, bIndex: 5, operation: 'Union',
    nA: 15, nB: 18, nIntersection: 8, nResult: 25,
    reducedP: { num: 25, den: 36 },
    descriptionA: 'Soma menor que 7', descriptionB: 'Número primo no dado azul',
  },
  {
    id: 'U3', aIndex: 3, bIndex: 11, operation: 'Union',
    nA: 5, nB: 9, nIntersection: 3, nResult: 11,
    reducedP: { num: 11, den: 36 },
    descriptionA: 'Soma igual a 6', descriptionB: 'Nenhuma face par',
  },
  {
    id: 'U4', aIndex: 10, bIndex: 9, operation: 'Union',
    nA: 18, nB: 20, nIntersection: 10, nResult: 28,
    reducedP: { num: 7, den: 9 },
    descriptionA: 'Exatamente uma face par', descriptionB: 'Pelo menos uma face múltipla de 3',
  },
  {
    id: 'U5', aIndex: 7, bIndex: 2, operation: 'Union',
    nA: 15, nB: 18, nIntersection: 6, nResult: 27,
    reducedP: { num: 3, den: 4 },
    descriptionA: 'Soma menor que 7', descriptionB: 'Face par no dado verde',
  },
];

export const EX6_INTERSECTION_POOL: readonly Ex6Candidate[] = [
  {
    id: 'I2', aIndex: 7, bIndex: 9, operation: 'Intersection',
    nA: 15, nB: 20, nIntersection: 5, nResult: 5,
    reducedP: { num: 5, den: 36 },
    descriptionA: 'Soma menor que 7', descriptionB: 'Pelo menos uma face múltipla de 3',
  },
  {
    id: 'I4', aIndex: 0, bIndex: 5, operation: 'Intersection',
    nA: 10, nB: 18, nIntersection: 4, nResult: 4,
    reducedP: { num: 1, den: 9 },
    descriptionA: 'Soma maior que 8', descriptionB: 'Número primo no dado azul',
  },
  {
    id: 'I-novo-1', aIndex: 4, bIndex: 9, operation: 'Intersection',
    nA: 11, nB: 20, nIntersection: 7, nResult: 7,
    reducedP: { num: 7, den: 36 },
    descriptionA: 'Produto das faces maior que 15', descriptionB: 'Pelo menos uma face múltipla de 3',
  },
  {
    id: 'I-novo-2', aIndex: 8, bIndex: 9, operation: 'Intersection',
    nA: 27, nB: 20, nIntersection: 15, nResult: 15,
    reducedP: { num: 5, den: 12 },
    descriptionA: 'Pelo menos uma face par', descriptionB: 'Pelo menos uma face múltipla de 3',
  },
  {
    id: 'I-novo-3', aIndex: 0, bIndex: 9, operation: 'Intersection',
    nA: 10, nB: 20, nIntersection: 7, nResult: 7,
    reducedP: { num: 7, den: 36 },
    descriptionA: 'Soma maior que 8', descriptionB: 'Pelo menos uma face múltipla de 3',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Sanity-check no boot: aborta o app se algum candidato violar
   invariantes I1..I7 (defesa contra erro humano de digitação na lista).
   ═══════════════════════════════════════════════════════════════════ */

function assertPoolIsHealthy(
  pool: readonly Ex6Candidate[],
  expectedOp: Ex6Operation,
  poolName: string,
): void {
  if (pool.length === 0) {
    throw new Error(`[exercise6Challenges] Pool ${poolName} está vazio`);
  }
  pool.forEach((c, i) => {
    const tag = `[exercise6Challenges] ${poolName}[${i}] (${c.id}, a=${c.aIndex}, b=${c.bIndex}, op=${c.operation})`;
    if (c.operation !== expectedOp) {
      throw new Error(`${tag}: operação ${c.operation} ≠ esperada ${expectedOp}`);
    }
    if (c.aIndex === c.bIndex) {
      throw new Error(`${tag}: aIndex === bIndex (eventos iguais)`);
    }
    if (c.nA <= 0 || c.nA >= TOTAL) {
      throw new Error(`${tag}: nA=${c.nA} fora de (0,${TOTAL})`);
    }
    if (c.nB <= 0 || c.nB >= TOTAL) {
      throw new Error(`${tag}: nB=${c.nB} fora de (0,${TOTAL})`);
    }
    if (c.nIntersection === c.nA) {
      throw new Error(`${tag}: A ⊂ B (operação trivializa)`);
    }
    if (c.nIntersection === c.nB) {
      throw new Error(`${tag}: B ⊂ A (operação trivializa)`);
    }
    if (c.operation === 'Union' && c.nIntersection === 0) {
      throw new Error(`${tag}: A ∩ B = ∅ na união (subtração de Venn vazia, fórmula da adição reduz à soma)`);
    }
    if (c.nResult <= 0 || c.nResult >= TOTAL) {
      throw new Error(`${tag}: nResult=${c.nResult} fora de (0,${TOTAL}) — P(D) degenerada`);
    }
    const expectedNResult = c.operation === 'Union'
      ? c.nA + c.nB - c.nIntersection
      : c.nIntersection;
    if (c.nResult !== expectedNResult) {
      throw new Error(`${tag}: nResult=${c.nResult} ≠ esperado ${expectedNResult} (operation=${c.operation})`);
    }
    if (c.reducedP.den <= 0) {
      throw new Error(`${tag}: reducedP.den=${c.reducedP.den} ≤ 0`);
    }
    if (c.reducedP.num < 0) {
      throw new Error(`${tag}: reducedP.num=${c.reducedP.num} < 0`);
    }
    if (c.reducedP.num * TOTAL !== c.reducedP.den * c.nResult) {
      throw new Error(`${tag}: reducedP ${c.reducedP.num}/${c.reducedP.den} não equivale a ${c.nResult}/${TOTAL}`);
    }
  });
}

function assertPoolsAreDisjoint(
  poolA: readonly Ex6Candidate[],
  poolB: readonly Ex6Candidate[],
): void {
  const pairKey = (c: Ex6Candidate) => `${Math.min(c.aIndex, c.bIndex)}-${Math.max(c.aIndex, c.bIndex)}`;
  const pairsA = new Set(poolA.map(pairKey));
  for (const c of poolB) {
    if (pairsA.has(pairKey(c))) {
      throw new Error(
        `[exercise6Challenges] Par (${c.aIndex},${c.bIndex}) aparece em ambos os pools — repetição entre rodadas torna-se possível`,
      );
    }
  }
}

assertPoolIsHealthy(EX6_UNION_POOL, 'Union', 'EX6_UNION_POOL');
assertPoolIsHealthy(EX6_INTERSECTION_POOL, 'Intersection', 'EX6_INTERSECTION_POOL');
assertPoolsAreDisjoint(EX6_UNION_POOL, EX6_INTERSECTION_POOL);

/* ═══════════════════════════════════════════════════════════════════
   buildEx6Session — orquestra o sorteio das 2 rodadas
   Rodada 1: sorteio equiprovável entre TODOS os 10 candidatos
   Rodada 2: sorteio entre os 5 candidatos do POOL DA OPERAÇÃO OPOSTA
   Garantia: uma rodada de cada operação (∪ e ∩), sem repetição de par.
   ═══════════════════════════════════════════════════════════════════ */

export interface Ex6Round {
  readonly index: 1 | 2;
  readonly operation: Ex6Operation;
  readonly candidate: Ex6Candidate;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildEx6Session(): readonly [Ex6Round, Ex6Round] {
  const all: readonly Ex6Candidate[] = [...EX6_UNION_POOL, ...EX6_INTERSECTION_POOL];
  const cand1 = pickRandom(all);
  const oppositePool = cand1.operation === 'Union' ? EX6_INTERSECTION_POOL : EX6_UNION_POOL;
  const cand2 = pickRandom(oppositePool);
  return [
    { index: 1, operation: cand1.operation, candidate: cand1 },
    { index: 2, operation: cand2.operation, candidate: cand2 },
  ] as const;
}

/* ═══════════════════════════════════════════════════════════════════
   validateFractionR14 — validação de fração R14-compliant (CLAUDE.md)
   Aceita QUALQUER fração matematicamente equivalente a favorable/total
   por comparação de multiplicação cruzada (sem ponto flutuante).
   Rejeita: vazio, não-inteiro, negativo, denominador zero.
   ═══════════════════════════════════════════════════════════════════ */

export function validateFractionR14(
  numStr: string | undefined,
  denStr: string | undefined,
  favorable: number,
  total: number,
): boolean {
  if (numStr === undefined || denStr === undefined) return false;
  const numTrim = numStr.trim();
  const denTrim = denStr.trim();
  if (numTrim === '' || denTrim === '') return false;
  if (!/^\d+$/.test(numTrim) || !/^\d+$/.test(denTrim)) return false;
  const num = Number.parseInt(numTrim, 10);
  const den = Number.parseInt(denTrim, 10);
  if (!Number.isInteger(num) || num < 0) return false;
  if (!Number.isInteger(den) || den <= 0) return false;
  return num * total === den * favorable;
}
