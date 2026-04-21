/* ═══════════════════════════════════════════════════════════════
   Gerador 100 % paramétrico de pares (A, B) de eventos
   MUTUAMENTE EXCLUSIVOS sobre S = {2, 3, ..., 12} — somas possíveis
   do lançamento de dois dados equilibrados.

   Invariantes garantidas em toda geração:
     (i)   A ⊂ S e B ⊂ S
     (ii)  A ≠ ∅ e B ≠ ∅
     (iii) A ∩ B = ∅ (por condição formal sobre os parâmetros)
     (iv)  Nenhum par fixo — apenas famílias paramétricas com
           restrições simbólicas de validade.

   Contexto didático: eventos mutuamente exclusivos → P(A∩B) = 0,
   logo P(A∪B) = P(A) + P(B) (caso particular da fórmula geral).

   ───────────────────────────────────────────────────────────────
   FAMÍLIAS IMPLEMENTADAS (com parâmetros livres e restrições)
   ───────────────────────────────────────────────────────────────

   1. CORTES SEPARADOS FECHADOS
        A_k = {x ∈ S : x ≤ k}
        B_m = {x ∈ S : x ≥ m}
        Parâmetros livres: k, m
        Restrições: 2 ≤ k ≤ 10, 4 ≤ m ≤ 12, k < m − 1
        Prova (A ∩ B = ∅):
          x ∈ A ⟹ x ≤ k < m − 1 < m ⟹ x < m ⟹ x ∉ B.
        Não-vacuidade:
          k ≥ 2 ⟹ 2 ∈ A   (pois 2 ∈ S e 2 ≤ k).
          m ≤ 12 ⟹ 12 ∈ B (pois 12 ∈ S e 12 ≥ m).

   2. INTERVALOS DISJUNTOS
        A_{p,q} = {x ∈ S : p ≤ x ≤ q}
        B_{r,s} = {x ∈ S : r ≤ x ≤ s}
        Parâmetros livres: p, q, r, s
        Restrições: 2 ≤ p ≤ q ≤ 10, 4 ≤ r ≤ s ≤ 12, q < r − 1
        Prova (A ∩ B = ∅):
          x ∈ A ⟹ x ≤ q < r − 1 < r ⟹ x ∉ B.
        Não-vacuidade: p ≤ q e p, q ∈ S ⟹ p ∈ A; r ≤ s e r, s ∈ S ⟹ r ∈ B.

   3. FAIXA BAIXA PAR × FAIXA ALTA ÍMPAR
        A_k = {x ∈ S : x < k e x é par}
        B_m = {x ∈ S : x > m e x é ímpar}
        Parâmetros livres: k, m
        Restrições: 4 ≤ k ≤ 10, 3 ≤ m ≤ 9, k ≤ m
        Prova (A ∩ B = ∅) — duas razões independentes, qualquer uma basta:
          a) Paridade: A ⊂ pares, B ⊂ ímpares ⟹ A ∩ B = ∅.
          b) Faixas: x ∈ A ⟹ x < k ≤ m, mas B exige x > m ⟹ x ∉ B.
        Não-vacuidade: k ≥ 4 garante 2 ∈ A (par, <k); m ≤ 9 garante 11 ∈ B.

   4. MÚLTIPLOS EMBAIXO × PRIMOS EM CIMA
        A_{d,t} = {x ∈ S : d | x e x ≤ t}
        B_u     = {x ∈ S : x é primo e x ≥ u}
        Primos em S: {2, 3, 5, 7, 11}
        Parâmetros livres: d, t, u
        Restrições: d ∈ {2, 3, 4, 5, 6}, 4 ≤ t ≤ 8, 7 ≤ u ≤ 11, t < u
        Prova (A ∩ B = ∅):
          x ∈ A ⟹ x ≤ t < u ⟹ x < u ⟹ x ∉ B.
        Não-vacuidade (verificada caso a caso):
          A_{d,t} pode ser vazio (ex.: d=5, t=4 → não há múltiplo de 5 em [2,4]∩S).
          Portanto a geração verifica explicitamente |A| ≥ 1 e |B| ≥ 1.

   5. BLOCO INICIAL E BLOCO FINAL
        A_k = {2, 3, ..., k}
        B_m = {m, m+1, ..., 12}
        Parâmetros livres: k, m
        Restrições: 2 ≤ k ≤ 10, 4 ≤ m ≤ 12, k < m − 1
        Prova (A ∩ B = ∅):
          idêntica à família 1 (esta é variante de notação explícita).
        Não-vacuidade: k ≥ 2 ⟹ 2 ∈ A; m ≤ 12 ⟹ 12 ∈ B.

   6. DESIGUALDADES ESTRITAS SEPARADAS
        A_k = {x ∈ S : x < k}
        B_m = {x ∈ S : x > m}
        Parâmetros livres: k, m
        Restrições: 3 ≤ k ≤ 11, 2 ≤ m ≤ 10, k ≤ m
        Prova (A ∩ B = ∅):
          x ∈ A ⟹ x < k ≤ m ⟹ x < m + 0 ⟹ x ≤ m, mas B exige x > m ⟹ x ∉ B.
        Não-vacuidade: k ≥ 3 ⟹ 2 ∈ A (pois 2 < 3 ≤ k); m ≤ 10 ⟹ 11 ∈ B.

   ───────────────────────────────────────────────────────────────
   CONSEQUÊNCIA PROBABILÍSTICA GLOBAL

   Para qualquer par (A, B) gerado por qualquer das 6 famílias:
        A ∩ B = ∅  ⟹  P(A ∩ B) = 0
        ⟹  P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = P(A) + P(B)

   Este caso particular da fórmula geral é o conteúdo didático
   do Exercício 2 — contraponto construtivo ao Exercício 1.
   ═══════════════════════════════════════════════════════════════ */

import { EventPair } from './eventPair';

const SUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const PRIMES_IN_S = new Set([2, 3, 5, 7, 11]);

function formatSumsDescription(xs: Set<number>): string {
  return `{${Array.from(xs).sort((a, b) => a - b).join(', ')}}`;
}

// Descreve de forma natural um bloco inicial {2, 3, ..., end}.
// Evita notações absurdas como "{2, 3, ..., 2}" ou "{2, 3, ..., 3}".
function describeInitialBlock(end: number): string {
  if (end <= 2) return 'A soma é igual a 2';
  if (end === 3) return 'A soma é 2 ou 3';
  if (end === 4) return 'A soma é 2, 3 ou 4';
  return `A soma pertence ao conjunto {2, 3, ..., ${end}}`;
}

// Descreve de forma natural um bloco final {start, start+1, ..., 12}.
function describeFinalBlock(start: number): string {
  if (start >= 12) return 'A soma é igual a 12';
  if (start === 11) return 'A soma é 11 ou 12';
  if (start === 10) return 'A soma é 10, 11 ou 12';
  return `A soma pertence ao conjunto {${start}, ${start + 1}, ..., 12}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePair(
  xA: Set<number>, xB: Set<number>,
  descA: string, descB: string,
  family: string,
): EventPair {
  return {
    id: `excl-${family}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    category: `exclusive_${family}`,
    eventA: {
      description: descA,
      sumsDescription: formatSumsDescription(xA),
      predicate: (r, c) => xA.has(r + c),
    },
    eventB: {
      description: descB,
      sumsDescription: formatSumsDescription(xB),
      predicate: (r, c) => xB.has(r + c),
    },
  };
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 1 — Cortes separados fechados
//   Restrições: 2 ≤ k ≤ 10, 4 ≤ m ≤ 12, k < m − 1
// ────────────────────────────────────────────────────────────
function tryFamily1(): EventPair | null {
  const params: Array<[number, number]> = [];
  for (let k = 2; k <= 10; k++) {
    for (let m = 4; m <= 12; m++) {
      if (k < m - 1) params.push([k, m]);
    }
  }
  for (const [k, m] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x <= k));
    const xB = new Set<number>(SUMS.filter(x => x >= m));
    // Invariante: as restrições garantem |A| ≥ 1 e |B| ≥ 1, mas verifico por defesa.
    if (xA.size === 0 || xB.size === 0) continue;
    return makePair(
      xA, xB,
      `A soma é menor ou igual a ${k}`,
      `A soma é maior ou igual a ${m}`,
      'f1',
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 2 — Intervalos disjuntos
//   Restrições: 2 ≤ p ≤ q ≤ 10, 4 ≤ r ≤ s ≤ 12, q < r − 1
// ────────────────────────────────────────────────────────────
function tryFamily2(): EventPair | null {
  const params: Array<[number, number, number, number]> = [];
  for (let p = 2; p <= 10; p++) {
    for (let q = p; q <= 10; q++) {
      for (let r = 4; r <= 12; r++) {
        for (let s = r; s <= 12; s++) {
          if (q < r - 1) params.push([p, q, r, s]);
        }
      }
    }
  }
  for (const [p, q, r, s] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x >= p && x <= q));
    const xB = new Set<number>(SUMS.filter(x => x >= r && x <= s));
    if (xA.size === 0 || xB.size === 0) continue;
    const descA = p === q
      ? `A soma é igual a ${p}`
      : `A soma está entre ${p} e ${q}, inclusive`;
    const descB = r === s
      ? `A soma é igual a ${r}`
      : `A soma está entre ${r} e ${s}, inclusive`;
    return makePair(xA, xB, descA, descB, 'f2');
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 3 — Faixa baixa par × faixa alta ímpar
//   Restrições: 4 ≤ k ≤ 10, 3 ≤ m ≤ 9, k ≤ m
// ────────────────────────────────────────────────────────────
function tryFamily3(): EventPair | null {
  const params: Array<[number, number]> = [];
  for (let k = 4; k <= 10; k++) {
    for (let m = 3; m <= 9; m++) {
      if (k <= m) params.push([k, m]);
    }
  }
  for (const [k, m] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x < k && x % 2 === 0));
    const xB = new Set<number>(SUMS.filter(x => x > m && x % 2 === 1));
    if (xA.size === 0 || xB.size === 0) continue;
    return makePair(
      xA, xB,
      `A soma é par e menor que ${k}`,
      `A soma é ímpar e maior que ${m}`,
      'f3',
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 4 — Múltiplos embaixo × primos em cima
//   Restrições: d ∈ {2,3,4,5,6}, 4 ≤ t ≤ 8, 7 ≤ u ≤ 11, t < u
//   Requer verificação explícita de |A| ≥ 1 (múltiplos podem faltar)
// ────────────────────────────────────────────────────────────
function tryFamily4(): EventPair | null {
  const params: Array<[number, number, number]> = [];
  for (const d of [2, 3, 4, 5, 6]) {
    for (let t = 4; t <= 8; t++) {
      for (let u = 7; u <= 11; u++) {
        if (t < u) params.push([d, t, u]);
      }
    }
  }
  for (const [d, t, u] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x % d === 0 && x <= t));
    const xB = new Set<number>(SUMS.filter(x => PRIMES_IN_S.has(x) && x >= u));
    if (xA.size === 0 || xB.size === 0) continue;
    return makePair(
      xA, xB,
      `A soma é múltipla de ${d} e menor ou igual a ${t}`,
      `A soma é um número primo maior ou igual a ${u}`,
      'f4',
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 5 — Bloco inicial e bloco final
//   Restrições: 2 ≤ k ≤ 10, 4 ≤ m ≤ 12, k < m − 1
// ────────────────────────────────────────────────────────────
function tryFamily5(): EventPair | null {
  const params: Array<[number, number]> = [];
  for (let k = 2; k <= 10; k++) {
    for (let m = 4; m <= 12; m++) {
      if (k < m - 1) params.push([k, m]);
    }
  }
  for (const [k, m] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x >= 2 && x <= k));
    const xB = new Set<number>(SUMS.filter(x => x >= m && x <= 12));
    if (xA.size === 0 || xB.size === 0) continue;
    return makePair(
      xA, xB,
      describeInitialBlock(k),
      describeFinalBlock(m),
      'f5',
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// FAMÍLIA 6 — Desigualdades estritas separadas
//   Restrições: 3 ≤ k ≤ 11, 2 ≤ m ≤ 10, k ≤ m
// ────────────────────────────────────────────────────────────
function tryFamily6(): EventPair | null {
  const params: Array<[number, number]> = [];
  for (let k = 3; k <= 11; k++) {
    for (let m = 2; m <= 10; m++) {
      if (k <= m) params.push([k, m]);
    }
  }
  for (const [k, m] of shuffle(params)) {
    const xA = new Set<number>(SUMS.filter(x => x < k));
    const xB = new Set<number>(SUMS.filter(x => x > m));
    if (xA.size === 0 || xB.size === 0) continue;
    return makePair(
      xA, xB,
      `A soma é menor que ${k}`,
      `A soma é maior que ${m}`,
      'f6',
    );
  }
  return null;
}

const FAMILIES: Array<() => EventPair | null> = [
  tryFamily1, tryFamily2, tryFamily3, tryFamily4, tryFamily5, tryFamily6,
];

// Distribuição por rodada — variáveis didáticas (ARTIGUE, 2014):
//   rodada 0: cortes/blocos simples (famílias 1, 5)
//   rodada 1: intervalos disjuntos + desigualdades estritas (famílias 2, 6)
//   rodada 2: paridade + múltiplos/primos (famílias 3, 4)
const FAMILIES_BY_ROUND: number[][] = [
  [0, 4],      // famílias 1, 5
  [1, 5],      // famílias 2, 6
  [2, 3],      // famílias 3, 4
];
const FAMILY_FALLBACK: number[] = [0, 1, 2, 3, 4, 5];

/**
 * Seleciona um par (A, B) de eventos mutuamente exclusivos para a rodada.
 * Gerado por uma das 6 famílias paramétricas com restrições formais sobre
 * os parâmetros que garantem A ⊂ S, B ⊂ S, A ≠ ∅, B ≠ ∅ e A ∩ B = ∅.
 */
export function selectExclusivePairForRound(round: number, _usedIds?: Set<string>): EventPair {
  void _usedIds;
  const idx = Math.max(0, Math.min(round, FAMILIES_BY_ROUND.length - 1));
  for (const fi of shuffle([...FAMILIES_BY_ROUND[idx]])) {
    const pair = FAMILIES[fi]();
    if (pair) return pair;
  }
  for (const fi of shuffle([...FAMILY_FALLBACK])) {
    const pair = FAMILIES[fi]();
    if (pair) return pair;
  }
  throw new Error(
    'eventPairExclusive: falha ao gerar par mutuamente exclusivo — ' +
    'espaço paramétrico inesperadamente vazio',
  );
}
