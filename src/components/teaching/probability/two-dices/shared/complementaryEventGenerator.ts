/* ═══════════════════════════════════════════════════════════════
   complementaryEventGenerator — gerador paramétrico de problemas
   de probabilidade do evento complementar para o lançamento de
   dois dados honestos (verde + azul) sobre Ω = {1..6}².

   Intenção pedagógica:
     • Apresentar ao aluno um evento A com MUITOS casos favoráveis
       (n(A) ∈ [26, 33]) tornando a marcação direta trabalhosa.
     • Forçar a percepção de que calcular pelo COMPLEMENTAR (Ā,
       com n ∈ [3, 10]) é mais econômico — heurística de POLYA.
     • Materializar visualmente Ω = A ⊔ Ā via reveal dual (vermelho
       de Ā + verde de A preenchendo as 36 células).

   12 famílias paramétricas:
     P1  sumCompare      — soma comparada com limiar
     P2  extremeEq       — max/min = m
     P3  extremeCompare  — max/min comparado com limiar
     P4  productCompare  — produto comparado com limiar
     P5  productEq       — produto = p
     P6  singleDie       — propriedade de um único dado (só combinação)
     P7  atLeastOne      — pelo menos uma face com propriedade
     P8  noneFace        — nenhuma face com propriedade
     P9  exactlyOne      — exatamente uma face com propriedade
     P10 bothFaces       — ambas as faces com propriedade
     P11 absDiff         — |diferença| = d (só combinação)
     P12 compareDice     — comparação verde × azul (só combinação/filtro)

   Escalonamento por rodada (variável didática — ARTIGUE, 2014):
     round 0 → famílias simples (P1, P2, P3, P4, P5, P7, P8, P9, P10)
     round 1 → adiciona uniões 2-a-2 (Família 4 do prompt original)
     round ≥ 2 → adiciona uniões 3-a-3 (Família 7 do prompt original)
   ═══════════════════════════════════════════════════════════════ */

import {
  Event,
  AtomicEvent,
  ComplementaryEventData,
  computeCardinality,
  materializeSet,
  invertEvent,
  isPrimeFace,
  combineUnion,
  passesVisualDistribution,
  verifyComplementaryConsistency,
  LN,
  LN_NEG,
} from './eventBank';

// ─── Helpers de aleatoriedade ───────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Builder de AtomicEvent (encapsula cálculo de cardinalidade) ─

function buildAtom(description: string, complementaryDescription: string,
                   ruleText: string, validation: (g: number, b: number) => boolean): AtomicEvent {
  const event: Event = { description, complementaryDescription, validation };
  return { event, ruleText, cardinality: computeCardinality(event) };
}

// ════════════════════════════════════════════════════════════════
// PADRÕES PARAMÉTRICOS
// ════════════════════════════════════════════════════════════════

// ─── P1 — sumCompare ────────────────────────────────────────────

type SumOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

function p1_sumCompare(): AtomicEvent | null {
  // Apenas variantes que entregam cardinalidade aproveitável (3..10 ou 26..33)
  const variants: Array<{ op: SumOp; k: number }> = [
    // gt / gte (Ā direto, n=3..10)
    { op: 'gt', k: 8 }, { op: 'gt', k: 9 }, { op: 'gt', k: 10 },
    { op: 'gte', k: 9 }, { op: 'gte', k: 10 }, { op: 'gte', k: 11 },
    // lt / lte (Ā direto)
    { op: 'lt', k: 4 }, { op: 'lt', k: 5 }, { op: 'lt', k: 6 },
    { op: 'lte', k: 3 }, { op: 'lte', k: 4 }, { op: 'lte', k: 5 },
    // eq (Ā direto, exceto s=7 que é antidiagonal pura — filtrado depois)
    { op: 'eq', k: 4 }, { op: 'eq', k: 5 }, { op: 'eq', k: 6 },
    { op: 'eq', k: 8 }, { op: 'eq', k: 9 }, { op: 'eq', k: 10 },
    // neq (A direto, n=30..33) — útil para combinações que precisam de A grande
    { op: 'neq', k: 4 }, { op: 'neq', k: 5 }, { op: 'neq', k: 6 },
    { op: 'neq', k: 7 }, { op: 'neq', k: 8 }, { op: 'neq', k: 9 }, { op: 'neq', k: 10 },
  ];
  const { op, k } = randomChoice(variants);

  const validation = (g: number, b: number) => {
    const s = g + b;
    switch (op) {
      case 'gt': return s > k;
      case 'gte': return s >= k;
      case 'lt': return s < k;
      case 'lte': return s <= k;
      case 'eq': return s === k;
      case 'neq': return s !== k;
    }
  };

  const map: Record<SumOp, [string, string]> = {
    gt: [LN.sumGt(k), LN_NEG.sumGt(k)],
    gte: [LN.sumGte(k), LN_NEG.sumGte(k)],
    lt: [LN.sumLt(k), LN_NEG.sumLt(k)],
    lte: [LN.sumLte(k), LN_NEG.sumLte(k)],
    eq: [LN.sumEq(k), LN_NEG.sumEq(k)],
    neq: [LN.sumNeq(k), LN.sumEq(k)],
  };
  const [desc, complDesc] = map[op];

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P2 — extremeEq (max/min = m) ───────────────────────────────

function p2_extremeEq(): AtomicEvent | null {
  const kind = randomChoice(['max', 'min'] as const);
  // Variantes em [3, 10]
  const validMs = kind === 'max' ? [2, 3, 4, 5] : [2, 3, 4, 5];
  const m = randomChoice(validMs);

  const validation = kind === 'max'
    ? (g: number, b: number) => Math.max(g, b) === m
    : (g: number, b: number) => Math.min(g, b) === m;

  const desc = kind === 'max' ? LN.maxEq(m) : LN.minEq(m);
  const complDesc = kind === 'max' ? LN_NEG.maxEq(m) : LN_NEG.minEq(m);

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P3 — extremeCompare (max/min comparado com limiar) ─────────

type ExtremeCompareOp = 'gt' | 'gte' | 'lt' | 'lte';

function p3_extremeCompare(): AtomicEvent | null {
  const kind = randomChoice(['max', 'min'] as const);
  const op = randomChoice(['gt', 'gte', 'lt', 'lte'] as const) as ExtremeCompareOp;

  // Limiares úteis (cardinalidade ∈ [3,10] ou [26,33])
  // n(max ≤ k) = k²  → max ≤ 2: 4; max ≤ 3: 9
  // n(max > k) = 36 - k²  → max > 3: 27; max > 2: 32
  // n(min ≥ k) = (7-k)²  → min ≥ 5: 4; min ≥ 4: 9
  // n(min < k) = 36 - (7-k)²  → min < 5: 32; min < 4: 27
  let k: number;
  if (kind === 'max') {
    k = op === 'gt' || op === 'gte'
      ? randomChoice([2, 3])              // max>2:n=32; max>3:n=27
      : randomChoice([2, 3]);              // max≤2:n=4; max≤3:n=9
  } else {
    k = op === 'gt' || op === 'gte'
      ? randomChoice([4, 5])              // min≥5:n=4; min≥4:n=9
      : randomChoice([4, 5]);              // min<5:n=32; min<4:n=27
  }

  const validation = (g: number, b: number) => {
    const v = kind === 'max' ? Math.max(g, b) : Math.min(g, b);
    switch (op) {
      case 'gt': return v > k;
      case 'gte': return v >= k;
      case 'lt': return v < k;
      case 'lte': return v <= k;
    }
  };

  const lnTable: Record<'max' | 'min', Record<ExtremeCompareOp, (k: number) => string>> = {
    max: { gt: LN.maxGt, gte: LN.maxGte, lt: LN.maxLt, lte: LN.maxLte },
    min: { gt: LN.minGt, gte: LN.minGte, lt: LN.minLt, lte: LN.minLte },
  };
  const desc = lnTable[kind][op](k);

  // Para complementaryDescription, gerar antônimo manual simples
  const complOp: ExtremeCompareOp =
    op === 'gt' ? 'lte' : op === 'gte' ? 'lt' : op === 'lt' ? 'gte' : 'gt';
  const complDesc = lnTable[kind][complOp](k);

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P4 — productCompare ────────────────────────────────────────

type ProductCompareOp = 'gt' | 'gte' | 'lt' | 'lte';

function p4_productCompare(): AtomicEvent | null {
  const op = randomChoice(['gt', 'lt', 'lte'] as const) as ProductCompareOp;
  // Limiares cuidadosamente escolhidos para n(evento) ∈ [3, 10]
  let k: number;
  if (op === 'gt') {
    k = randomChoice([20, 24, 25]);   // n=8, 6, 5
  } else if (op === 'lt') {
    k = randomChoice([4, 5, 6]);       // n=5, 8, 12 (12 fora — filtrado abaixo)
  } else {
    k = randomChoice([2, 3, 4, 5]);    // lte: n=3, 5, 8, 10
  }

  const validation = (g: number, b: number) => {
    const p = g * b;
    switch (op) {
      case 'gt': return p > k;
      case 'gte': return p >= k;
      case 'lt': return p < k;
      case 'lte': return p <= k;
    }
  };

  const lnTable: Record<ProductCompareOp, (k: number) => string> = {
    gt: LN.productGt, gte: LN.productGte, lt: LN.productLt, lte: LN.productLte,
  };
  const negTable: Record<ProductCompareOp, ProductCompareOp> = {
    gt: 'lte', gte: 'lt', lt: 'gte', lte: 'gt',
  };
  const desc = lnTable[op](k);
  const complDesc = lnTable[negTable[op]](k);

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P5 — productEq ─────────────────────────────────────────────

function p5_productEq(): AtomicEvent | null {
  const p = randomChoice([4, 6, 12]);  // únicos com cardinalidade 3 ou 4
  const validation = (g: number, b: number) => g * b === p;
  const desc = LN.productEq(p);
  const complDesc = LN_NEG.productEq(p);
  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P6 — singleDie (propriedade de um único dado, só combinação) ─

type SingleDieProp = 'even' | 'odd' | 'prime' | 'eqK' | 'gtK' | 'ltK';

function p6_singleDie(): AtomicEvent | null {
  const die = randomChoice(['green', 'blue'] as const);
  const prop = randomChoice(['even', 'odd', 'prime', 'eqK', 'gtK', 'ltK'] as const) as SingleDieProp;
  const k = (prop === 'eqK' || prop === 'gtK' || prop === 'ltK') ? randInt(2, 5) : 0;

  const dieValue = (g: number, b: number) => die === 'green' ? g : b;
  const validation = (g: number, b: number) => {
    const v = dieValue(g, b);
    switch (prop) {
      case 'even': return v % 2 === 0;
      case 'odd': return v % 2 === 1;
      case 'prime': return isPrimeFace(v);
      case 'eqK': return v === k;
      case 'gtK': return v > k;
      case 'ltK': return v < k;
    }
  };

  const dieLabel = die === 'green' ? 'verde' : 'azul';
  const propLabel = (() => {
    switch (prop) {
      case 'even': return 'é par';
      case 'odd': return 'é ímpar';
      case 'prime': return 'é primo';
      case 'eqK': return `é ${k}`;
      case 'gtK': return `é maior que ${k}`;
      case 'ltK': return `é menor que ${k}`;
    }
  })();
  const complPropLabel = (() => {
    switch (prop) {
      case 'even': return 'é ímpar';
      case 'odd': return 'é par';
      case 'prime': return 'não é primo';
      case 'eqK': return `é diferente de ${k}`;
      case 'gtK': return `é menor ou igual a ${k}`;
      case 'ltK': return `é maior ou igual a ${k}`;
    }
  })();
  const desc = `o dado ${dieLabel} ${propLabel}`;
  const complDesc = `o dado ${dieLabel} ${complPropLabel}`;

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P7 — atLeastOne ─────────────────────────────────────────────

type AtLeastOneProp = 'even' | 'odd' | 'prime' | 'gt3' | 'lt4';

function p7_atLeastOne(): AtomicEvent | null {
  const prop = randomChoice(['even', 'odd', 'prime', 'gt3', 'lt4'] as const) as AtLeastOneProp;

  const matches = (v: number): boolean => {
    switch (prop) {
      case 'even': return v % 2 === 0;
      case 'odd': return v % 2 === 1;
      case 'prime': return isPrimeFace(v);
      case 'gt3': return v > 3;
      case 'lt4': return v < 4;
    }
  };
  const validation = (g: number, b: number) => matches(g) || matches(b);

  const map: Record<AtLeastOneProp, [string, string]> = {
    even: [LN.atLeastOneEven, LN_NEG.atLeastOneEven],
    odd: [LN.atLeastOneOdd, LN_NEG.atLeastOneOdd],
    prime: [LN.atLeastOnePrime, LN_NEG.atLeastOnePrime],
    gt3: [LN.atLeastOneGt(3), 'as duas faces são menores ou iguais a 3'],
    lt4: [LN.atLeastOneLt(4), 'as duas faces são maiores ou iguais a 4'],
  };
  const [desc, complDesc] = map[prop];

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P8 — noneFace ───────────────────────────────────────────────

type NoneProp = 'even' | 'odd' | 'prime' | 'gt3' | 'lt4';

function p8_noneFace(): AtomicEvent | null {
  const prop = randomChoice(['even', 'odd', 'prime', 'gt3', 'lt4'] as const) as NoneProp;

  const matches = (v: number): boolean => {
    switch (prop) {
      case 'even': return v % 2 === 0;
      case 'odd': return v % 2 === 1;
      case 'prime': return isPrimeFace(v);
      case 'gt3': return v > 3;
      case 'lt4': return v < 4;
    }
  };
  const validation = (g: number, b: number) => !matches(g) && !matches(b);

  const map: Record<NoneProp, [string, string]> = {
    even: [LN.noneEven, LN_NEG.noneEven],
    odd: [LN.noneOdd, LN_NEG.noneOdd],
    prime: [LN.nonePrime, LN_NEG.atLeastOnePrime],
    gt3: [LN.noneGt(3), 'pelo menos uma das faces é maior que 3'],
    lt4: [LN.noneLt(4), 'pelo menos uma das faces é menor que 4'],
  };
  const [desc, complDesc] = map[prop];

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P9 — exactlyOne ─────────────────────────────────────────────

function p9_exactlyOne(): AtomicEvent | null {
  // Variantes com k ∈ {1} (n = 10): "exatamente uma é m" para m ∈ {1..6}
  // ou "exatamente uma é > 5" (= exatamente uma é 6, k=1, n=10)
  const variant = randomChoice(['eqM', 'gt5', 'lt2'] as const);
  let matches: (v: number) => boolean;
  let propLabel: string;
  let complLabel: string;

  if (variant === 'eqM') {
    const m = randInt(1, 6);
    matches = v => v === m;
    propLabel = `exatamente uma das faces é ${m}`;
    complLabel = `nenhuma ou ambas as faces são ${m}`;
  } else if (variant === 'gt5') {
    matches = v => v > 5;
    propLabel = 'exatamente uma das faces é maior que 5';
    complLabel = 'nenhuma ou ambas as faces são maiores que 5';
  } else {
    matches = v => v < 2;
    propLabel = 'exatamente uma das faces é menor que 2';
    complLabel = 'nenhuma ou ambas as faces são menores que 2';
  }

  const validation = (g: number, b: number) => {
    const a = matches(g);
    const c = matches(b);
    return (a && !c) || (!a && c);
  };

  return buildAtom(propLabel, complLabel, propLabel, validation);
}

// ─── P10 — bothFaces ─────────────────────────────────────────────

type BothProp = 'even' | 'odd' | 'prime' | 'gt3' | 'lt4' | 'mult3' | 'gt4' | 'lte2';

function p10_bothFaces(): AtomicEvent | null {
  const prop = randomChoice(
    ['even', 'odd', 'prime', 'gt3', 'lt4', 'mult3', 'gt4', 'lte2'] as const,
  ) as BothProp;

  const matches = (v: number): boolean => {
    switch (prop) {
      case 'even': return v % 2 === 0;
      case 'odd': return v % 2 === 1;
      case 'prime': return isPrimeFace(v);
      case 'gt3': return v > 3;
      case 'lt4': return v < 4;
      case 'mult3': return v % 3 === 0;
      case 'gt4': return v > 4;
      case 'lte2': return v <= 2;
    }
  };
  const validation = (g: number, b: number) => matches(g) && matches(b);

  const map: Record<BothProp, [string, string]> = {
    even: [LN.bothEven, LN_NEG.bothEven],
    odd: [LN.bothOdd, LN_NEG.bothOdd],
    prime: [LN.bothPrime, 'pelo menos uma das faces não é primo'],
    gt3: [LN.bothGt(3), 'pelo menos uma das faces é menor ou igual a 3'],
    lt4: [LN.bothLt(4), 'pelo menos uma das faces é maior ou igual a 4'],
    mult3: ['as duas faces são múltiplas de 3', 'pelo menos uma das faces não é múltipla de 3'],
    gt4: [LN.bothGt(4), 'pelo menos uma das faces é menor ou igual a 4'],
    lte2: ['as duas faces são menores ou iguais a 2', 'pelo menos uma das faces é maior que 2'],
  };
  const [desc, complDesc] = map[prop];

  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P11 — absDiff (só combinação) ──────────────────────────────

function p11_absDiff(): AtomicEvent | null {
  const d = randomChoice([2, 3, 4]);  // d=4 isolado tem n=4; combinações com filtros
  const validation = (g: number, b: number) => Math.abs(g - b) === d;
  const desc = LN.absDiffEq(d);
  const complDesc = `a diferença em módulo entre os dados é diferente de ${d}`;
  return buildAtom(desc, complDesc, desc, validation);
}

// ─── P12 — compareDice (só filtro/combinação) ───────────────────

function p12_compareDice(): AtomicEvent | null {
  const op = randomChoice(['eq', 'lt', 'gt'] as const);
  const validation = (g: number, b: number) => {
    switch (op) {
      case 'eq': return g === b;
      case 'lt': return g < b;
      case 'gt': return g > b;
    }
  };
  const map = {
    eq: [LN.diceEqual, LN.diceDifferent],
    lt: [LN.greenLessThanBlue, 'o dado verde é maior ou igual ao dado azul'],
    gt: [LN.greenGreaterThanBlue, 'o dado verde é menor ou igual ao dado azul'],
  } as const;
  const [desc, complDesc] = map[op];
  return buildAtom(desc, complDesc, desc, validation);
}

// ════════════════════════════════════════════════════════════════
// SELECTOR
// ════════════════════════════════════════════════════════════════

type SimplePattern =
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  | 'p7' | 'p8' | 'p9' | 'p10';

const SIMPLE_GENERATORS: Record<SimplePattern, () => AtomicEvent | null> = {
  p1: p1_sumCompare,
  p2: p2_extremeEq,
  p3: p3_extremeCompare,
  p4: p4_productCompare,
  p5: p5_productEq,
  p7: p7_atLeastOne,
  p8: p8_noneFace,
  p9: p9_exactlyOne,
  p10: p10_bothFaces,
};

const COMBINATION_INGREDIENTS: Array<() => AtomicEvent | null> = [
  p1_sumCompare,
  p2_extremeEq,
  p3_extremeCompare,
  p4_productCompare,
  p5_productEq,
  p6_singleDie,    // entra apenas em combinações
  p7_atLeastOne,
  p10_bothFaces,
  p11_absDiff,     // entra apenas em combinações
  p12_compareDice, // entra apenas em combinações
];

const MAX_ATTEMPTS_PER_FAMILY = 200;

/** Tenta uma família simples (P1..P10 exceto P6, P11, P12). */
function tryGenerateSimple(): AtomicEvent | null {
  const patterns = Object.keys(SIMPLE_GENERATORS) as SimplePattern[];
  for (const p of shuffle(patterns)) {
    const atom = SIMPLE_GENERATORS[p]();
    if (atom && atom.cardinality >= 1) return atom;
  }
  return null;
}

/** Tenta combinação de N átomos por união (Famílias 4/7 do prompt original). */
function tryGenerateCombination(n: 2 | 3): AtomicEvent | null {
  const atoms: AtomicEvent[] = [];
  const generators = shuffle(COMBINATION_INGREDIENTS);
  for (const gen of generators) {
    if (atoms.length >= n) break;
    const a = gen();
    if (a && a.cardinality >= 1 && a.cardinality <= 10) atoms.push(a);
  }
  if (atoms.length < n) return null;
  return combineUnion(...atoms.slice(0, n));
}

/** Decide se `atom` serve como nosso A direto, Ā direto, ou nenhum. */
function classifyAtom(atom: AtomicEvent): 'asA' | 'asComplement' | null {
  const n = atom.cardinality;
  if (n >= 26 && n <= 33) return 'asA';
  if (n >= 3 && n <= 10) return 'asComplement';
  return null;
}

/**
 * Sorteia um problema completo de probabilidade do evento complementar.
 *
 * @param round 0 = simples; 1 = adiciona combinações 2-a-2;
 *              ≥ 2 = adiciona combinações 3-a-3.
 */
export function selectComplementaryEvent(round: number): ComplementaryEventData {
  const allowCombo2 = round >= 1;
  const allowCombo3 = round >= 2;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_FAMILY; attempt++) {
    // Estratégia de sorteio por rodada:
    //   round 0: 100% simples
    //   round 1: 50% simples, 50% combo 2
    //   round ≥ 2: 35% simples, 35% combo 2, 30% combo 3
    let atom: AtomicEvent | null;
    const roll = Math.random();
    if (allowCombo3 && roll < 0.30) {
      atom = tryGenerateCombination(3);
    } else if (allowCombo2 && roll < 0.65) {
      atom = tryGenerateCombination(2);
    } else {
      atom = tryGenerateSimple();
    }
    if (!atom) continue;

    const role = classifyAtom(atom);
    if (!role) continue;

    let eventA: Event;
    let eventComplement: Event;
    if (role === 'asA') {
      eventA = atom.event;
      eventComplement = invertEvent(atom.event);
    } else {
      eventComplement = atom.event;
      eventA = invertEvent(atom.event);
    }

    const E = materializeSet(eventComplement);

    if (!passesVisualDistribution(E)) continue;

    const check = verifyComplementaryConsistency(eventA, eventComplement, E);
    if (!check.ok) continue;

    return {
      id: `comp-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      eventA,
      eventComplement,
      E,
      nA: 36 - E.size,
      nE: E.size,
      family: role === 'asA' ? 'A-direct' : 'comp-direct',
    };
  }

  // Fallback final — relaxa filtro visual se necessário (mas não a blindagem)
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_FAMILY; attempt++) {
    const atom = tryGenerateSimple();
    if (!atom) continue;
    const role = classifyAtom(atom);
    if (!role) continue;
    const eventA = role === 'asA' ? atom.event : invertEvent(atom.event);
    const eventComplement = role === 'asA' ? invertEvent(atom.event) : atom.event;
    const E = materializeSet(eventComplement);
    const check = verifyComplementaryConsistency(eventA, eventComplement, E);
    if (!check.ok) continue;
    return {
      id: `comp-fb-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      eventA,
      eventComplement,
      E,
      nA: 36 - E.size,
      nE: E.size,
      family: 'fallback',
    };
  }

  throw new Error('selectComplementaryEvent: pool paramétrico inesperadamente vazio');
}
