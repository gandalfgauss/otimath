/* ═══════════════════════════════════════════════════════════════
   Gerador algorítmico paramétrico de pares de eventos (A, B)
   sobre o espaço amostral Ω = {1,...,6}² do lançamento de 2 dados.

   Utilizado em:
     - UnionProbabilityTheory (teoria, sub-etapas markA..probFormulaVerify)
     - UnionExercise1        (exercício opcional obrigatório da trilha)
     - (futuro) UnionExercise2..4, OVAs Bayes/Total

   Invariantes garantidas em cada par gerado:
     (i)   X_A ∩ X_B ≠ ∅       → força a necessidade da fórmula
     (ii)  X_A ≠ X_B            → eventos genuinamente distintos
     (iii) |A|, |B| ≥ 6          → evita probabilidades triviais
     (iv)  |A ∩ B| ≤ 16          → evita sobreposição quase total
     (v)   categoria controlada  → variável didática por rodada
     (vi)  inclusão X_A ⊂ X_B ou X_B ⊂ X_A permitida SÓ na rodada 3
   ═══════════════════════════════════════════════════════════════ */

// ─── Tipos de eventos ────────────────────────────────────────────

export interface EventDef {
  description: string;
  sumsDescription: string;
  predicate: (r: number, c: number) => boolean;
}

export interface EventPair {
  id: string;
  category: string;
  eventA: EventDef;
  eventB: EventDef;
}

export type SumCondition =
  | { kind: 'gt'; a: number }
  | { kind: 'gte'; a: number }
  | { kind: 'lt'; b: number }
  | { kind: 'lte'; b: number }
  | { kind: 'between'; a: number; b: number };

export type NumberProperty =
  | { kind: 'even' }
  | { kind: 'odd' }
  | { kind: 'prime' }
  | { kind: 'composite' }
  | { kind: 'multipleOf'; k: number }
  | { kind: 'divisorOf'; m: number };

export type EventCategory = 'strong_overlap' | 'central_overlap' | 'small_intersection' | 'inclusion';

// ─── Utilidades sobre somas ─────────────────────────────────────

export function sumMultiplicity(s: number): number {
  return 6 - Math.abs(7 - s);
}

export function evalSumCondition(c: SumCondition, s: number): boolean {
  switch (c.kind) {
    case 'gt': return s > c.a;
    case 'gte': return s >= c.a;
    case 'lt': return s < c.b;
    case 'lte': return s <= c.b;
    case 'between': return s > c.a && s < c.b;
  }
}

export function evalNumberProperty(p: NumberProperty, s: number): boolean {
  switch (p.kind) {
    case 'even': return s % 2 === 0;
    case 'odd': return s % 2 === 1;
    case 'prime': return [2, 3, 5, 7, 11].includes(s);
    case 'composite': return [4, 6, 8, 9, 10, 12].includes(s);
    case 'multipleOf': return s % p.k === 0;
    case 'divisorOf': return p.m % s === 0;
  }
}

function buildSumSet(c: SumCondition): Set<number> {
  const out = new Set<number>();
  for (let s = 2; s <= 12; s++) if (evalSumCondition(c, s)) out.add(s);
  return out;
}

function buildPropertySet(p: NumberProperty): Set<number> {
  const out = new Set<number>();
  for (let s = 2; s <= 12; s++) if (evalNumberProperty(p, s)) out.add(s);
  return out;
}

function eventCardinality(X: Set<number>): number {
  let n = 0;
  X.forEach(s => { n += sumMultiplicity(s); });
  return n;
}

function intersectSumSets(A: Set<number>, B: Set<number>): Set<number> {
  const out = new Set<number>();
  A.forEach(s => { if (B.has(s)) out.add(s); });
  return out;
}

function sumSetsEqual(A: Set<number>, B: Set<number>): boolean {
  if (A.size !== B.size) return false;
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

function sumSubsetOf(A: Set<number>, B: Set<number>): boolean {
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

function sumConditionDescription(c: SumCondition): string {
  switch (c.kind) {
    case 'gt': return `A soma é maior que ${c.a}`;
    case 'gte': return `A soma é maior ou igual a ${c.a}`;
    case 'lt': return `A soma é menor que ${c.b}`;
    case 'lte': return `A soma é menor ou igual a ${c.b}`;
    case 'between': return `A soma está entre ${c.a} e ${c.b}`;
  }
}

function numberPropertyDescription(p: NumberProperty): string {
  switch (p.kind) {
    case 'even': return 'A soma é par';
    case 'odd': return 'A soma é ímpar';
    case 'prime': return 'A soma é um número primo';
    case 'composite': return 'A soma é um número composto';
    case 'multipleOf': return `A soma é múltipla de ${p.k}`;
    case 'divisorOf': return `A soma é divisor de ${p.m}`;
  }
}

function formatSumsDescription(X: Set<number>): string {
  return `{${Array.from(X).sort((a, b) => a - b).join(', ')}}`;
}

function enumerateSumConditions(): SumCondition[] {
  const out: SumCondition[] = [];
  for (let a = 2; a <= 12; a++) out.push({ kind: 'gt', a });
  for (let a = 2; a <= 12; a++) out.push({ kind: 'gte', a });
  for (let b = 2; b <= 12; b++) out.push({ kind: 'lt', b });
  for (let b = 2; b <= 12; b++) out.push({ kind: 'lte', b });
  for (let a = 2; a < 12; a++)
    for (let b = a + 1; b <= 12; b++)
      out.push({ kind: 'between', a, b });
  return out;
}

function enumerateNumberProperties(): NumberProperty[] {
  const out: NumberProperty[] = [
    { kind: 'even' },
    { kind: 'odd' },
    { kind: 'prime' },
    { kind: 'composite' },
  ];
  for (const k of [2, 3, 4, 6]) out.push({ kind: 'multipleOf', k });
  for (const m of [6, 8, 12]) out.push({ kind: 'divisorOf', m });
  return out;
}

const MIN_EVENT_CARDINALITY = 6;
const MAX_INTERSECTION_CARDINALITY = 16;

function categorizeIntersection(nI: number): EventCategory | null {
  if (nI <= 0) return null;
  if (nI <= 3) return 'small_intersection';
  if (nI <= 8) return 'central_overlap';
  if (nI <= MAX_INTERSECTION_CARDINALITY) return 'strong_overlap';
  return null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tryGeneratePair(category: EventCategory): EventPair | null {
  const conditions = shuffleArray(enumerateSumConditions());
  const properties = shuffleArray(enumerateNumberProperties());

  for (const condA of conditions) {
    const xA = buildSumSet(condA);
    const nA = eventCardinality(xA);
    if (nA < MIN_EVENT_CARDINALITY) continue;

    for (const propB of properties) {
      const xB = buildPropertySet(propB);
      const nB = eventCardinality(xB);
      if (nB < MIN_EVENT_CARDINALITY) continue;

      if (sumSetsEqual(xA, xB)) continue;

      const xI = intersectSumSets(xA, xB);
      if (xI.size === 0) continue;
      const nI = eventCardinality(xI);
      if (nI > MAX_INTERSECTION_CARDINALITY) continue;

      const hasInclusion = sumSubsetOf(xA, xB) || sumSubsetOf(xB, xA);

      if (category === 'inclusion') {
        if (!hasInclusion) continue;
      } else {
        if (hasInclusion) continue;
        if (categorizeIntersection(nI) !== category) continue;
      }

      return {
        id: `gen-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
        category,
        eventA: {
          description: sumConditionDescription(condA),
          sumsDescription: formatSumsDescription(xA),
          predicate: (r, c) => xA.has(r + c),
        },
        eventB: {
          description: numberPropertyDescription(propB),
          sumsDescription: formatSumsDescription(xB),
          predicate: (r, c) => xB.has(r + c),
        },
      };
    }
  }
  return null;
}

const CATEGORIES_BY_ROUND: EventCategory[][] = [
  ['strong_overlap', 'central_overlap'],
  ['central_overlap', 'small_intersection', 'strong_overlap'],
  ['inclusion'],
];
const CATEGORY_FALLBACK: EventCategory[] = [
  'central_overlap', 'strong_overlap', 'small_intersection', 'inclusion',
];

export function selectPairForRound(round: number, _usedIds?: Set<string>): EventPair {
  void _usedIds;
  const idx = Math.max(0, Math.min(round, CATEGORIES_BY_ROUND.length - 1));
  for (const cat of CATEGORIES_BY_ROUND[idx]) {
    const pair = tryGeneratePair(cat);
    if (pair) return pair;
  }
  for (const cat of CATEGORY_FALLBACK) {
    const pair = tryGeneratePair(cat);
    if (pair) return pair;
  }
  throw new Error('eventPair: falha ao gerar par — espaço paramétrico inesperadamente vazio');
}

// ─── Serialização para snapshot F5 ──────────────────────────────

export interface EventPairSerialized {
  id: string;
  category: string;
  eventA: { description: string; sumsDescription: string; predicatePairs: string[] };
  eventB: { description: string; sumsDescription: string; predicatePairs: string[] };
}

function serializeEventDef(ev: EventDef): { description: string; sumsDescription: string; predicatePairs: string[] } {
  const pairs: string[] = [];
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 6; c++) {
      if (ev.predicate(r, c)) pairs.push(`${r},${c}`);
    }
  }
  return { description: ev.description, sumsDescription: ev.sumsDescription, predicatePairs: pairs };
}

function deserializeEventDef(s: { description: string; sumsDescription: string; predicatePairs: string[] }): EventDef {
  const set = new Set(s.predicatePairs);
  return {
    description: s.description,
    sumsDescription: s.sumsDescription,
    predicate: (r, c) => set.has(`${r},${c}`),
  };
}

export function serializeEventPair(pair: EventPair): EventPairSerialized {
  return {
    id: pair.id,
    category: pair.category,
    eventA: serializeEventDef(pair.eventA),
    eventB: serializeEventDef(pair.eventB),
  };
}

export function deserializeEventPair(s: EventPairSerialized): EventPair {
  return {
    id: s.id,
    category: s.category,
    eventA: deserializeEventDef(s.eventA),
    eventB: deserializeEventDef(s.eventB),
  };
}

// ─── Utilitários de conjuntos no plano Ω = {1,...,6}² ───────────

export function pairsMatching(predicate: (r: number, c: number) => boolean): Set<string> {
  const s = new Set<string>();
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) if (predicate(r, c)) s.add(`${r},${c}`);
  return s;
}

export function setIntersection(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>();
  a.forEach(k => { if (b.has(k)) out.add(k); });
  return out;
}

export function setUnion(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>(a);
  b.forEach(k => out.add(k));
  return out;
}

export function enumerateKeys(keys: Set<string>): string {
  const list = Array.from(keys)
    .map(k => k.split(',').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => `(${r},${c})`);
  return list.join(', ');
}

// ─── Matriz de marcação 6×6 ─────────────────────────────────────

export type MarkMatrix = boolean[][];

export function createEmptyMatrix(): MarkMatrix {
  return Array.from({ length: 6 }, () => Array(6).fill(false));
}

export function matrixToKeySet(m: MarkMatrix): Set<string> {
  const s = new Set<string>();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (m[r][c]) s.add(`${r + 1},${c + 1}`);
  return s;
}

// ─── Blindagem: verificação matemática dos conjuntos ─────────────

export function verifyEventTableConsistency(
  eventA: EventDef,
  eventB: EventDef,
  sets: { A: Set<string>; B: Set<string>; I: Set<string>; U: Set<string> },
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 6; c++) {
      const key = `${r},${c}`;
      const pA = eventA.predicate(r, c);
      const pB = eventB.predicate(r, c);
      if (pA !== sets.A.has(key)) violations.push(`A:(${r},${c}) predA=${pA} mas ∈A=${sets.A.has(key)}`);
      if (pB !== sets.B.has(key)) violations.push(`B:(${r},${c}) predB=${pB} mas ∈B=${sets.B.has(key)}`);
      if ((pA && pB) !== sets.I.has(key)) violations.push(`A∩B:(${r},${c}) (predA∧predB)=${pA && pB} mas ∈I=${sets.I.has(key)}`);
      if ((pA || pB) !== sets.U.has(key)) violations.push(`A∪B:(${r},${c}) (predA∨predB)=${pA || pB} mas ∈U=${sets.U.has(key)}`);
    }
  }
  return { ok: violations.length === 0, violations };
}

// ─── Cores canônicas dos eventos ────────────────────────────────

export const EVENT_COLORS: Record<string, string> = {
  'A': '#2f6fea',
  'B': '#22a155',
  'A∩B': '#c79634',
  'A∪B': '#7d3c98',
  'A-B': '#d97706',
  'B-A': '#0891b2',
};

// ─── Validação R14 de fração equivalente ─────────────────────────
//
// Regra R14 do CLAUDE.md: aceita qualquer fração matematicamente equivalente
// via multiplicação cruzada, desde que numerador ≥ 0 e denominador > 0.
export function isEquivalentFraction(
  numStr: string, denStr: string,
  expectedNum: number, expectedDen: number,
): boolean {
  const num = parseInt(numStr.trim(), 10);
  const den = parseInt(denStr.trim(), 10);
  if (!Number.isInteger(num) || !Number.isInteger(den)) return false;
  if (num < 0 || den <= 0) return false;
  return num * expectedDen === den * expectedNum;
}
