/**
 * eventParametrization.ts — VERSÃO UNIFICADA DEFINITIVA
 * ----------------------------------------------------------------------------
 * Síntese das duas versões anteriores, retendo o que cada uma trouxe de mais
 * rigoroso e descartando redundâncias:
 *
 *   ┌─ DA VERSÃO COM FAMÍLIAS PARAMÉTRICAS ─────────────────────────────────┐
 *   │ • Pool gerado por famílias parametrizadas (≈ 52 eventos brutos).      │
 *   │ • removeExtensionallyDuplicateEvents (defesa em profundidade).        │
 *   │ • isValidSimplePair extraído como helper (DRY).                       │
 *   │ • Exportação de SAMPLE_SPACE_SIZE, shuffleArray, buildCompositeVal.   │
 *   │ • getCompoundDescription, createCompositeEvent, diagnosePool.         │
 *   └───────────────────────────────────────────────────────────────────────┘
 *   ┌─ DA VERSÃO ANTERIOR ──────────────────────────────────────────────────┐
 *   │ • isPrime generalizada (suporta soma de primos até 12).               │
 *   │ • pickValidPair com índice aleatório direto (sem shuffle redundante). │
 *   │ • findValidSimplePair sem double-shuffle.                             │
 *   │ • verifyExactProbability via produto cruzado (sem float).             │
 *   │ • sanitizeFraction com diagnóstico granular.                          │
 *   └───────────────────────────────────────────────────────────────────────┘
 *   ┌─ REFINAMENTOS ADICIONAIS ─────────────────────────────────────────────┐
 *   │ • Adição de "Soma é número primo" e "Soma é múltipla de 3" ao pool,   │
 *   │   aproveitando a generalização de isPrime para o intervalo [2, 12].   │
 *   │ • Memoização transparente (WeakMap) de countEvent e countComposite:   │
 *   │   primeira chamada O(36), subsequentes O(1).                          │
 *   └───────────────────────────────────────────────────────────────────────┘
 *
 * Autor: Rangel Freitas dos Santos — PROFMAT/UFVJM
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// 1. TIPOS
// ============================================================================

export interface Event {
  name?: string;
  description: string;
  complementaryDescription: string;
  /**
   * Metadado opcional de classificação. Identifica a "família" pedagógica
   * a que o evento pertence (ex.: "soma-maior", "produto-menor", "paridade").
   * Não influencia em nenhuma lógica de geração ou validação — serve
   * exclusivamente para auditoria de cobertura e análise estatística da
   * sequência didática. A ausência deste campo é tratada como "sem-familia".
   */
  family?: string;
  /**
   * Metadado opcional de complexidade pedagógica do evento, em quatro níveis:
   *   1 — leitura direta em um único dado (ex.: face par/ímpar).
   *   2 — propriedades de soma ou produto (ex.: soma > k, produto < k).
   *   3 — quantificadores ou min/max com igualdade (ex.: pelo menos uma par).
   *   4 — comparações entre as faces ou min/max com desigualdade.
   * Usado APENAS pela função buildProgressiveValidatedGameSetup para garantir
   * progressão didática. Não afeta buildValidatedGameSetup nem qualquer
   * validação matemática. A ausência é tratada como nível 2 (intermediário).
   */
  difficulty?: 1 | 2 | 3 | 4;
  validation: (greenDice: number, blueDice: number) => boolean;
}

export type Operation =
  | "Intersection"
  | "Union"
  | "Difference"
  | "ReverseDifference";

const DICE_FACES = 6;
export const SAMPLE_SPACE_SIZE = DICE_FACES * DICE_FACES; // |Ω| = 36

// ============================================================================
// 2. CARACTERIZAÇÃO EXTENSIVA E PREDICADOS ESTRUTURAIS
//
// Memoização interna por referência (WeakMap): como Event é imutável no nosso
// sistema, contagens podem ser cacheadas com segurança. A primeira chamada
// custa O(36); chamadas subsequentes são O(1). Esta otimização é transparente
// — não altera a API pública.
// ============================================================================

const _countEventCache = new WeakMap<Event, number>();
const _countCompositeCache =
  new WeakMap<Event, WeakMap<Event, Partial<Record<Operation, number>>>>();

const _computeEventCount = (event: Event): number => {
  let count = 0;
  for (let g = 1; g <= DICE_FACES; g++) {
    for (let b = 1; b <= DICE_FACES; b++) {
      if (event.validation(g, b)) count++;
    }
  }
  return count;
};

export const countEvent = (event: Event): number => {
  const cached = _countEventCache.get(event);
  if (cached !== undefined) return cached;
  const value = _computeEventCount(event);
  _countEventCache.set(event, value);
  return value;
};

export const buildCompositeValidation = (
  op: Operation,
  vA: (g: number, b: number) => boolean,
  vB: (g: number, b: number) => boolean
) => (g: number, b: number): boolean => {
  const a = vA(g, b);
  const b_ = vB(g, b);
  switch (op) {
    case "Intersection":      return a && b_;
    case "Union":             return a || b_;
    case "Difference":        return a && !b_;
    case "ReverseDifference": return !a && b_;
  }
};

export const countComposite = (
  A: Event,
  B: Event,
  op: Operation
): number => {
  // Lookup em cache aninhado: A → B → op → count.
  let mapA = _countCompositeCache.get(A);
  if (mapA) {
    const mapB = mapA.get(B);
    if (mapB) {
      const cached = mapB[op];
      if (cached !== undefined) return cached;
    }
  }

  const D = buildCompositeValidation(op, A.validation, B.validation);
  let count = 0;
  for (let g = 1; g <= DICE_FACES; g++) {
    for (let b = 1; b <= DICE_FACES; b++) {
      if (D(g, b)) count++;
    }
  }

  if (!mapA) { mapA = new WeakMap(); _countCompositeCache.set(A, mapA); }
  let mapB = mapA.get(B);
  if (!mapB) { mapB = {}; mapA.set(B, mapB); }
  mapB[op] = count;

  return count;
};

export const areSameEvent = (A: Event, B: Event): boolean => {
  for (let g = 1; g <= DICE_FACES; g++) {
    for (let b = 1; b <= DICE_FACES; b++) {
      if (A.validation(g, b) !== B.validation(g, b)) return false;
    }
  }
  return true;
};

export const areComplementary = (A: Event, B: Event): boolean => {
  for (let g = 1; g <= DICE_FACES; g++) {
    for (let b = 1; b <= DICE_FACES; b++) {
      if (A.validation(g, b) === B.validation(g, b)) return false;
    }
  }
  return true;
};

export const isValidSingleEvent = (A: Event): boolean => {
  const n = countEvent(A);
  return n > 0 && n < SAMPLE_SPACE_SIZE;
};

export const isValidSimplePair = (A: Event, B: Event): boolean => {
  if (!isValidSingleEvent(A) || !isValidSingleEvent(B)) return false;
  if (A === B) return false;
  if (areSameEvent(A, B)) return false;
  if (areComplementary(A, B)) return false;
  return true;
};

// ============================================================================
// 3. RESTRIÇÕES DE ADMISSIBILIDADE POR OPERAÇÃO
// ============================================================================

export const isValidPairForOperation = (
  A: Event,
  B: Event,
  operation: Operation
): boolean => {
  if (!isValidSimplePair(A, B)) return false;

  const nA = countEvent(A);
  const nB = countEvent(B);
  const nIntersection      = countComposite(A, B, "Intersection");
  const nUnion             = countComposite(A, B, "Union");
  const nDifference        = countComposite(A, B, "Difference");
  const nReverseDifference = countComposite(A, B, "ReverseDifference");

  switch (operation) {
    case "Intersection":
      return nIntersection >= 2
          && nIntersection < Math.min(nA, nB)
          && nIntersection <= 18;

    case "Union":
      return nUnion > Math.max(nA, nB)
          && nUnion >= 6
          && nUnion <= 30;

    case "Difference":
      return nDifference >= 2
          && nIntersection >= 1
          && nDifference < nA;

    case "ReverseDifference":
      return nReverseDifference >= 2
          && nIntersection >= 1
          && nReverseDifference < nB;
  }
};

// ============================================================================
// 4. EMBARALHAMENTO (Fisher–Yates)
// ============================================================================

export const shuffleArray = <T,>(arr: readonly T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ============================================================================
// 5. SELEÇÃO DE PARES — GREEDY + BACKTRACKING
// ============================================================================

export interface CompoundSlot {
  readonly A: Event;
  readonly B: Event;
  readonly operation: Operation;
}

export interface ValidatedSetup {
  readonly simpleEvents: readonly [Event, Event];
  readonly compoundSlots: readonly CompoundSlot[];
}

/**
 * Seleciona aleatoriamente um par admissível para a operação.
 * Usa índice aleatório direto (mais eficiente que embaralhar todo o array).
 */
export const pickValidPair = (
  availableEvents: readonly Event[],
  operation: Operation,
  usedEvents: ReadonlySet<Event>
): [Event, Event] => {
  const candidates: [Event, Event][] = [];
  for (const A of availableEvents) {
    if (usedEvents.has(A)) continue;
    for (const B of availableEvents) {
      if (A === B || usedEvents.has(B)) continue;
      if (isValidPairForOperation(A, B, operation)) candidates.push([A, B]);
    }
  }
  if (candidates.length === 0) {
    throw new Error(`Sem par admissível para a operação "${operation}".`);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Itera sobre o pool (na ordem fornecida) e retorna o primeiro par admissível
 * para os dois eventos simples. O caller deve embaralhar o pool previamente.
 */
const findFirstValidSimplePair = (
  pool: readonly Event[]
): [Event, Event] | null => {
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (isValidSimplePair(pool[i], pool[j])) return [pool[i], pool[j]];
    }
  }
  return null;
};

/** Versão pública que embaralha antes de buscar. */
export const pickValidSimplePair = (
  pool: readonly Event[]
): [Event, Event] | null => {
  return findFirstValidSimplePair(shuffleArray(pool));
};

const findCompoundAssignment = (
  availableEvents: readonly Event[],
  operationsRemaining: readonly Operation[],
  acc: readonly CompoundSlot[]
): CompoundSlot[] | null => {
  if (operationsRemaining.length === 0) return [...acc];

  const op = operationsRemaining[0];
  const restOps = operationsRemaining.slice(1);

  const localCandidates: [Event, Event][] = [];
  for (const A of availableEvents) {
    for (const B of availableEvents) {
      if (A === B) continue;
      if (isValidPairForOperation(A, B, op)) localCandidates.push([A, B]);
    }
  }

  for (const [A, B] of shuffleArray(localCandidates)) {
    const remaining = availableEvents.filter(e => e !== A && e !== B);
    const result = findCompoundAssignment(
      remaining, restOps, [...acc, { A, B, operation: op }]
    );
    if (result) return result;
  }
  return null;
};

/**
 * Greedy assignment com shuffle único. O findFirstValidSimplePair recebe
 * o pool já embaralhado, evitando double-shuffle.
 */
const greedyAssignment = (
  validPool: readonly Event[],
  operations: readonly Operation[]
): ValidatedSetup => {
  const shuffledPool = shuffleArray(validPool);
  const shuffledOps = shuffleArray(operations);

  const simplePair = findFirstValidSimplePair(shuffledPool);
  if (!simplePair) {
    throw new Error("Não foi possível selecionar dois eventos simples admissíveis.");
  }

  const usedEvents = new Set<Event>([simplePair[0], simplePair[1]]);
  const compoundSlots: CompoundSlot[] = [];

  for (const op of shuffledOps) {
    const [A, B] = pickValidPair(shuffledPool, op, usedEvents);
    usedEvents.add(A);
    usedEvents.add(B);
    compoundSlots.push({ A, B, operation: op });
  }

  return { simpleEvents: simplePair, compoundSlots };
};

/**
 * Construção em três níveis defensivos:
 *   (1) Greedy com retries — rápido e suficiente na esmagadora maioria.
 *   (2) Backtracking TOTALMENTE EXAUSTIVO — itera sobre TODOS os pares
 *       simples admissíveis e, para cada um, executa o backtracking
 *       completo dos quatro slots compostos. Se algum par simples bloquear
 *       a solução, o algoritmo automaticamente tenta o próximo.
 *   (3) Erro explícito — pool insuficiente ou mal balanceado.
 */
export const buildValidatedGameSetup = (
  pool: readonly Event[],
  operations: readonly Operation[],
  greedyRetries: number = 50
): ValidatedSetup => {
  const validPool = pool.filter(isValidSingleEvent);
  const minimumRequired = 2 + 2 * operations.length;

  if (validPool.length < minimumRequired) {
    throw new Error(
      `Pool válido insuficiente: requer ≥ ${minimumRequired} eventos, recebeu ${validPool.length}.`
    );
  }

  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try { return greedyAssignment(validPool, operations); } catch { /* retry */ }
  }

  // Fallback: backtracking exaustivo sobre simples E compostos.
  // Itera sobre todos os pares simples admissíveis. Para cada par, executa
  // findCompoundAssignment para os 4 slots compostos. Se um par simples
  // bloquear a solução dos compostos, o próximo par é tentado.
  const shuffledPool = shuffleArray(validPool);
  const shuffledOps = shuffleArray(operations);

  for (let i = 0; i < shuffledPool.length; i++) {
    for (let j = i + 1; j < shuffledPool.length; j++) {
      const simplePair: [Event, Event] = [shuffledPool[i], shuffledPool[j]];
      if (!isValidSimplePair(simplePair[0], simplePair[1])) continue;

      const remaining = shuffledPool.filter(
        e => e !== simplePair[0] && e !== simplePair[1]
      );
      const slots = findCompoundAssignment(remaining, shuffledOps, []);
      if (slots) {
        return { simpleEvents: simplePair, compoundSlots: slots };
      }
    }
  }

  throw new Error(
    "Pool não admite atribuição completa nem por backtracking exaustivo. " +
    "Revise as restrições ou amplie o pool."
  );
};

// ============================================================================
// 6. VALIDAÇÃO NUMÉRICA EXATA
// ============================================================================

export const fractionsEqual = (
  p: number, q: number, r: number, s: number
): boolean => {
  if (![p, q, r, s].every(Number.isFinite)) return false;
  if (![p, q, r, s].every(Number.isInteger)) return false;
  if (q === 0 || s === 0) return false;
  return p * s === r * q;
};

export type FractionInvalidReason =
  | "empty" | "non-integer" | "zero-denominator" | "negative" | "improper";

export interface SanitizedFraction {
  valid: boolean;
  numerator: number;
  denominator: number;
  reason?: FractionInvalidReason;
}

export const sanitizeFraction = (
  numStr: unknown,
  denStr: unknown,
  opts: { allowImproper?: boolean } = {}
): SanitizedFraction => {
  const { allowImproper = false } = opts;
  const ns = String(numStr ?? "").trim();
  const ds = String(denStr ?? "").trim();

  if (ns === "" || ds === "") {
    return { valid: false, numerator: NaN, denominator: NaN, reason: "empty" };
  }
  const n = Number(ns);
  const d = Number(ds);
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    return { valid: false, numerator: n, denominator: d, reason: "non-integer" };
  }
  if (d === 0) {
    return { valid: false, numerator: n, denominator: d, reason: "zero-denominator" };
  }
  if (n < 0 || d < 0) {
    return { valid: false, numerator: n, denominator: d, reason: "negative" };
  }
  if (!allowImproper && n > d) {
    return { valid: false, numerator: n, denominator: d, reason: "improper" };
  }
  return { valid: true, numerator: n, denominator: d };
};

export const verifyExactProbability = (
  numStr: unknown,
  denStr: unknown,
  favorableCount: number,
  sampleSpace: number = SAMPLE_SPACE_SIZE
): boolean => {
  const f = sanitizeFraction(numStr, denStr);
  if (!f.valid) return false;
  return fractionsEqual(f.numerator, f.denominator, favorableCount, sampleSpace);
};

export const countFavorable = (event: Event): number => countEvent(event);

// ============================================================================
// 7. POOL PARAMETRIZADO AMPLIADO COM DEDUPLICAÇÃO
// ============================================================================

/** Generalizada para suportar soma de duas faces (intervalo [2, 12]). */
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const makeEvent = (
  description: string,
  complementaryDescription: string,
  validation: (g: number, b: number) => boolean,
  family?: string,
  difficulty: 1 | 2 | 3 | 4 = 2
): Event => ({ description, complementaryDescription, validation, family, difficulty });

// ---- Famílias de soma -----------------------------------------------------
const sumGreaterThanEvents = [6, 7, 8, 9].map(k =>
  makeEvent(`Soma maior que ${k}`, `Soma menor ou igual a ${k}`,
    (g, b) => g + b > k,
    "soma-maior")
);

const sumLessThanEvents = [5, 6, 7, 8, 9].map(k =>
  makeEvent(`Soma menor que ${k}`, `Soma maior ou igual a ${k}`,
    (g, b) => g + b < k,
    "soma-menor")
);

const sumEqualEvents = [5, 6, 7, 8, 9].map(k =>
  makeEvent(`Soma igual a ${k}`, `Soma diferente de ${k}`,
    (g, b) => g + b === k,
    "soma-igual")
);

const sumPropertyEvents: Event[] = [
  makeEvent(
    "Soma é um número primo",
    "Soma não é um número primo",
    (g, b) => isPrime(g + b),
    "soma-propriedade"
  ),
  makeEvent(
    "Soma é múltipla de 3",
    "Soma não é múltipla de 3",
    (g, b) => (g + b) % 3 === 0,
    "soma-propriedade"
  ),
];

// ---- Famílias de produto --------------------------------------------------
const productGreaterThanEvents = [8, 10, 12, 15, 18].map(k =>
  makeEvent(`Produto das faces maior que ${k}`,
    `Produto das faces menor ou igual a ${k}`,
    (g, b) => g * b > k,
    "produto-maior")
);

const productLessThanEvents = [8, 10, 12, 16, 20].map(k =>
  makeEvent(`Produto das faces menor que ${k}`,
    `Produto das faces maior ou igual a ${k}`,
    (g, b) => g * b < k,
    "produto-menor")
);

// ---- Eventos sobre a face do dado verde ----------------------------------
const greenFaceEvents: Event[] = [
  makeEvent("Face par no dado verde", "Face ímpar no dado verde",
    g => g % 2 === 0, "verde", 1),
  makeEvent("Face ímpar no dado verde", "Face par no dado verde",
    g => g % 2 !== 0, "verde", 1),
  makeEvent("Número primo no dado verde", "Número não primo no dado verde",
    g => isPrime(g), "verde", 1),
  makeEvent("Face do dado verde maior que 3",
    "Face do dado verde menor ou igual a 3",
    g => g > 3, "verde", 1),
  makeEvent("Face do dado verde menor que 4",
    "Face do dado verde maior ou igual a 4",
    g => g < 4, "verde", 1),
];

// ---- Eventos sobre a face do dado azul -----------------------------------
const blueFaceEvents: Event[] = [
  makeEvent("Face par no dado azul", "Face ímpar no dado azul",
    (_g, b) => b % 2 === 0, "azul", 1),
  makeEvent("Face ímpar no dado azul", "Face par no dado azul",
    (_g, b) => b % 2 !== 0, "azul", 1),
  makeEvent("Número primo no dado azul", "Número não primo no dado azul",
    (_g, b) => isPrime(b), "azul", 1),
  makeEvent("Face do dado azul maior que 3",
    "Face do dado azul menor ou igual a 3",
    (_g, b) => b > 3, "azul", 1),
  makeEvent("Face do dado azul menor que 4",
    "Face do dado azul maior ou igual a 4",
    (_g, b) => b < 4, "azul", 1),
];

// ---- Eventos sobre min e max ---------------------------------------------
const minMaxEvents: Event[] = [
  makeEvent("Menor face igual a 5", "Menor face diferente de 5",
    (g, b) => Math.min(g, b) === 5, "min-max", 3),
  makeEvent("Maior face igual a 4", "Maior face diferente de 4",
    (g, b) => Math.max(g, b) === 4, "min-max", 3),
  makeEvent("Menor face maior ou igual a 3",
    "Menor face menor que 3",
    (g, b) => Math.min(g, b) >= 3, "min-max", 4),
  makeEvent("Maior face menor ou igual a 4",
    "Maior face maior que 4",
    (g, b) => Math.max(g, b) <= 4, "min-max", 4),
  makeEvent("Maior face igual a 6", "Maior face diferente de 6",
    (g, b) => Math.max(g, b) === 6, "min-max", 3),
];

// ---- Paridade e múltiplos -------------------------------------------------
const parityAndMultipleEvents: Event[] = [
  makeEvent("Pelo menos uma face par", "Nenhuma face par",
    (g, b) => g % 2 === 0 || b % 2 === 0, "paridade", 3),
  makeEvent("Nenhuma face par", "Pelo menos uma face par",
    (g, b) => g % 2 === 1 && b % 2 === 1, "paridade", 3),
  makeEvent("Exatamente uma face par", "Nenhuma ou duas faces pares",
    (g, b) => (g % 2 === 0 && b % 2 !== 0) || (g % 2 !== 0 && b % 2 === 0),
    "paridade", 3),
  makeEvent("Pelo menos uma face múltipla de 3",
    "Nenhuma face múltipla de 3",
    (g, b) => g % 3 === 0 || b % 3 === 0, "multiplos", 3),
  makeEvent("Nenhuma face múltipla de 3",
    "Pelo menos uma face múltipla de 3",
    (g, b) => g % 3 !== 0 && b % 3 !== 0, "multiplos", 3),
  makeEvent("Exatamente uma face múltipla de 3",
    "Nenhuma ou duas faces múltiplas de 3",
    (g, b) => (g % 3 === 0 && b % 3 !== 0) || (g % 3 !== 0 && b % 3 === 0),
    "multiplos", 3),
];

// ---- Comparação entre as faces -------------------------------------------
const comparisonEvents: Event[] = [
  makeEvent("Face do dado verde maior que a face do dado azul",
    "Face do dado verde menor ou igual à face do dado azul",
    (g, b) => g > b, "comparacao", 4),
  makeEvent("Face do dado azul maior que a face do dado verde",
    "Face do dado azul menor ou igual à face do dado verde",
    (g, b) => b > g, "comparacao", 4),
  makeEvent("Faces iguais", "Faces diferentes",
    (g, b) => g === b, "comparacao", 4),
  makeEvent("Faces diferentes", "Faces iguais",
    (g, b) => g !== b, "comparacao", 4),
  makeEvent("Diferença absoluta entre as faces igual a 1",
    "Diferença absoluta entre as faces diferente de 1",
    (g, b) => Math.abs(g - b) === 1, "comparacao", 4),
  makeEvent("Diferença absoluta entre as faces maior ou igual a 3",
    "Diferença absoluta entre as faces menor que 3",
    (g, b) => Math.abs(g - b) >= 3, "comparacao", 4),
];

const rawParametricPool: readonly Event[] = [
  ...sumGreaterThanEvents,
  ...sumLessThanEvents,
  ...sumEqualEvents,
  ...sumPropertyEvents,
  ...productGreaterThanEvents,
  ...productLessThanEvents,
  ...greenFaceEvents,
  ...blueFaceEvents,
  ...minMaxEvents,
  ...parityAndMultipleEvents,
  ...comparisonEvents,
];

/**
 * Remove duplicatas extensionais. Dois eventos com a mesma extensão em Ω
 * são considerados o mesmo evento, ainda que tenham descrições diferentes.
 * Mantém o primeiro de cada classe de equivalência.
 */
const removeExtensionallyDuplicateEvents = (
  pool: readonly Event[]
): Event[] => {
  const unique: Event[] = [];
  for (const candidate of pool) {
    const exists = unique.some(existing => areSameEvent(existing, candidate));
    if (!exists) unique.push(candidate);
  }
  return unique;
};

export const DEFAULT_EVENT_POOL: readonly Event[] =
  removeExtensionallyDuplicateEvents(
    rawParametricPool.filter(isValidSingleEvent)
  );

export const DEFAULT_OPERATION_POOL: readonly Operation[] = [
  "Intersection", "Union", "Difference", "ReverseDifference",
];

// ============================================================================
// 8. HELPERS DE INTEGRAÇÃO COM O HOOK
// ============================================================================

export const getCompoundDescription = (
  operation: Operation,
  eventA: Event,
  eventB: Event
): string => {
  switch (operation) {
    case "Intersection":
      return eventA.description + " e " + eventB.description.toLowerCase();
    case "Union":
      return eventA.description + " ou " + eventB.description.toLowerCase();
    case "Difference":
      return eventA.description + " e " + eventB.complementaryDescription.toLowerCase();
    case "ReverseDifference":
      return eventB.description + " e " + eventA.complementaryDescription.toLowerCase();
  }
};

export const createCompositeEvent = (
  operation: Operation,
  A: Event,
  B: Event,
  name: string = "D"
): Event => ({
  name,
  description: getCompoundDescription(operation, A, B),
  complementaryDescription: "",
  validation: buildCompositeValidation(operation, A.validation, B.validation),
});

/**
 * Diagnóstico do pool. Útil em desenvolvimento e em testes automatizados.
 */
export const diagnosePool = (
  pool: readonly Event[] = DEFAULT_EVENT_POOL,
  operations: readonly Operation[] = DEFAULT_OPERATION_POOL
) => {
  const validEvents = pool.filter(isValidSingleEvent).length;
  return {
    totalEvents: pool.length,
    validEvents,
    operationCandidates: operations.map(operation => {
      let candidates = 0;
      for (const A of pool) {
        for (const B of pool) {
          if (A !== B && isValidPairForOperation(A, B, operation)) candidates++;
        }
      }
      return { operation, candidates };
    }),
  };
};

// ============================================================================
// 9. DIAGNÓSTICO DE COBERTURA POR FAMÍLIA (metadado, não interfere na lógica)
//
// Estas funções operam puramente sobre o campo opcional `family` de Event.
// Não afetam buildValidatedGameSetup, isValidPairForOperation, nem qualquer
// outro fluxo do sistema. Servem para auditar a distribuição de famílias
// pedagógicas no pool e nos jogos gerados, e como base para uma futura
// função buildBalancedValidatedGameSetup (não implementada nesta versão).
// ============================================================================

/**
 * Conta quantos eventos de cada família existem no pool informado.
 * Eventos sem o campo family são contabilizados sob "sem-familia".
 */
export const diagnoseFamilyCoverage = (
  pool: readonly Event[] = DEFAULT_EVENT_POOL
): Record<string, number> => {
  const coverage: Record<string, number> = {};
  for (const event of pool) {
    const family = event.family ?? "sem-familia";
    coverage[family] = (coverage[family] ?? 0) + 1;
  }
  return coverage;
};

/**
 * Retorna a lista (deduplicada) de famílias presentes em um setup de jogo.
 * Considera os dois eventos simples e ambos os eventos (A e B) de cada
 * slot composto. Eventos compostos D não são considerados pois sua
 * "família" é derivada das famílias de A e B.
 */
export const getFamiliesFromSetup = (setup: ValidatedSetup): string[] => {
  const families = new Set<string>();
  for (const event of setup.simpleEvents) {
    families.add(event.family ?? "sem-familia");
  }
  for (const slot of setup.compoundSlots) {
    families.add(slot.A.family ?? "sem-familia");
    families.add(slot.B.family ?? "sem-familia");
  }
  return Array.from(families);
};

/**
 * Conta quantas vezes cada família aparece em um setup de jogo, incluindo
 * todos os papéis (eventos simples + ambos os eventos de cada slot composto).
 * Útil para verificar se um jogo específico exercita variedade pedagógica.
 */
export const diagnoseSetupCoverage = (
  setup: ValidatedSetup
): Record<string, number> => {
  const coverage: Record<string, number> = {};
  for (const event of setup.simpleEvents) {
    const family = event.family ?? "sem-familia";
    coverage[family] = (coverage[family] ?? 0) + 1;
  }
  for (const slot of setup.compoundSlots) {
    const familyA = slot.A.family ?? "sem-familia";
    const familyB = slot.B.family ?? "sem-familia";
    coverage[familyA] = (coverage[familyA] ?? 0) + 1;
    coverage[familyB] = (coverage[familyB] ?? 0) + 1;
  }
  return coverage;
};

// ============================================================================
// 10. PROGRESSÃO DIDÁTICA DE DIFICULDADE
//
// Adiciona uma camada paralela à geração validada, permitindo que os jogos
// respeitem uma progressão de complexidade conceitual: eventos simples nos
// primeiros desafios, comparativos complexos nos últimos. Não substitui
// buildValidatedGameSetup — fornece uma alternativa.
// ============================================================================

export const getEventDifficulty = (event: Event): 1 | 2 | 3 | 4 => {
  return event.difficulty ?? 2;
};

export const getPairDifficulty = (A: Event, B: Event): number => {
  return (getEventDifficulty(A) + getEventDifficulty(B)) / 2;
};

/**
 * Define a progressão de dificuldade para os 6 desafios de um jogo:
 *   - simpleAllowed: dificuldades permitidas nos 2 desafios simples
 *   - compoundSlots: array de 4 perfis, um por desafio composto
 *     - allowedA / allowedB: dificuldades permitidas para A e B
 *     - maxPairAverage: limite para a média das dificuldades de A e B
 *     - operation: opcional — fixa uma operação específica para o slot
 */
export interface DifficultyProfile {
  simpleAllowed: readonly (1 | 2 | 3 | 4)[];
  compoundSlots: readonly {
    operation?: Operation;
    allowedA: readonly (1 | 2 | 3 | 4)[];
    allowedB: readonly (1 | 2 | 3 | 4)[];
    maxPairAverage?: number;
  }[];
}

/**
 * Perfil padrão: progressão suave do simples ao complexo.
 * Slot 1 (mais fácil) → Slot 4 (mais difícil).
 */
export const DEFAULT_DIFFICULTY_PROFILE: DifficultyProfile = {
  simpleAllowed: [1, 2],
  compoundSlots: [
    { allowedA: [1, 2],    allowedB: [1, 2],    maxPairAverage: 2   },
    { allowedA: [1, 2, 3], allowedB: [1, 2, 3], maxPairAverage: 2.5 },
    { allowedA: [2, 3],    allowedB: [2, 3],    maxPairAverage: 3   },
    { allowedA: [2, 3, 4], allowedB: [2, 3, 4], maxPairAverage: 3.5 },
  ],
};

/**
 * Tenta uma única atribuição estrita usando o perfil dado.
 * Lança erro se algum slot não admitir par válido sob as restrições.
 * Internamente, todas as validações matemáticas são as mesmas
 * (isValidPairForOperation, isValidSimplePair) — não há perda de rigor.
 */
const tryProgressiveAssignment = (
  validPool: readonly Event[],
  operations: readonly Operation[],
  profile: DifficultyProfile
): ValidatedSetup => {
  // 1. Filtra pool por simpleAllowed e seleciona dois eventos simples.
  const simplePool = validPool.filter(e =>
    profile.simpleAllowed.includes(getEventDifficulty(e))
  );
  const simplePair = pickValidSimplePair(simplePool);
  if (!simplePair) {
    throw new Error(
      "Sem par simples admissível com restrições de dificuldade do perfil."
    );
  }

  const usedEvents = new Set<Event>([simplePair[0], simplePair[1]]);
  const shuffledOps = shuffleArray(operations);
  const compoundSlots: CompoundSlot[] = [];

  // 2. Para cada slot composto, busca um par válido com as restrições.
  for (let i = 0; i < profile.compoundSlots.length; i++) {
    const slotProfile = profile.compoundSlots[i];
    const op: Operation = slotProfile.operation ?? shuffledOps[i % shuffledOps.length];

    const candidates: [Event, Event][] = [];
    for (const A of validPool) {
      if (usedEvents.has(A)) continue;
      const dA = getEventDifficulty(A);
      if (!slotProfile.allowedA.includes(dA)) continue;

      for (const B of validPool) {
        if (A === B || usedEvents.has(B)) continue;
        const dB = getEventDifficulty(B);
        if (!slotProfile.allowedB.includes(dB)) continue;

        if (slotProfile.maxPairAverage !== undefined) {
          const avg = (dA + dB) / 2;
          if (avg > slotProfile.maxPairAverage) continue;
        }

        if (isValidPairForOperation(A, B, op)) {
          candidates.push([A, B]);
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error(
        `Sem par admissível para slot ${i + 1} (operação=${op}) com restrições.`
      );
    }
    const [A, B] = candidates[Math.floor(Math.random() * candidates.length)];
    usedEvents.add(A);
    usedEvents.add(B);
    compoundSlots.push({ A, B, operation: op });
  }

  return { simpleEvents: simplePair, compoundSlots };
};

/**
 * Geração com progressão didática.
 *
 * Cascata de fallback (defesa em profundidade):
 *   (1) Tenta perfil estrito (allowedA/allowedB + maxPairAverage).
 *   (2) Relaxa apenas maxPairAverage (mantém allowedA/allowedB).
 *   (3) Relaxa allowedA/allowedB (todas as dificuldades permitidas).
 *   (4) Cai em buildValidatedGameSetup (sem restrições de dificuldade).
 *
 * Em qualquer caminho, todas as validações matemáticas (R1–R4 via
 * isValidPairForOperation) e estruturais (não-iguais, não-complementares)
 * são preservadas. Nunca retorna jogo inválido.
 */
export const buildProgressiveValidatedGameSetup = (
  pool: readonly Event[],
  operations: readonly Operation[],
  profile: DifficultyProfile = DEFAULT_DIFFICULTY_PROFILE,
  greedyRetries: number = 50
): ValidatedSetup => {
  const validPool = pool.filter(isValidSingleEvent);

  // Nível 1 — perfil estrito completo.
  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try { return tryProgressiveAssignment(validPool, operations, profile); }
    catch { /* retry */ }
  }

  // Nível 2 — relaxa apenas maxPairAverage.
  const profileNoCap: DifficultyProfile = {
    simpleAllowed: profile.simpleAllowed,
    compoundSlots: profile.compoundSlots.map(s => ({
      operation: s.operation,
      allowedA: s.allowedA,
      allowedB: s.allowedB,
      // maxPairAverage omitido
    })),
  };
  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try { return tryProgressiveAssignment(validPool, operations, profileNoCap); }
    catch { /* retry */ }
  }

  // Nível 3 — relaxa allowedA/allowedB (todas dificuldades).
  const allDifficulties: readonly (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
  const profileFullyRelaxed: DifficultyProfile = {
    simpleAllowed: allDifficulties,
    compoundSlots: profile.compoundSlots.map(s => ({
      operation: s.operation,
      allowedA: allDifficulties,
      allowedB: allDifficulties,
    })),
  };
  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try { return tryProgressiveAssignment(validPool, operations, profileFullyRelaxed); }
    catch { /* retry */ }
  }

  // Nível 4 — fallback definitivo: gerador validado original.
  return buildValidatedGameSetup(pool, operations, greedyRetries);
};

/**
 * Diagnóstico da progressão de dificuldade em um setup.
 * Retorna estrutura legível com a dificuldade de cada evento e a
 * média da dificuldade de cada par composto, na ordem dos challenges.
 */
export const diagnoseDifficultyProgression = (setup: ValidatedSetup) => {
  return {
    simpleEvents: setup.simpleEvents.map(event => ({
      description: event.description,
      family: event.family,
      difficulty: event.difficulty ?? 2,
    })),
    compoundSlots: setup.compoundSlots.map((slot, index) => ({
      index: index + 1,
      operation: slot.operation,
      A: {
        description: slot.A.description,
        family: slot.A.family,
        difficulty: slot.A.difficulty ?? 2,
      },
      B: {
        description: slot.B.description,
        family: slot.B.family,
        difficulty: slot.B.difficulty ?? 2,
      },
      pairAverageDifficulty: getPairDifficulty(slot.A, slot.B),
    })),
  };
};

// ============================================================================
// 11. PROGRESSÃO DIDÁTICA + DIVERSIDADE PEDAGÓGICA POR FAMÍLIA
//
// Combina a progressão de dificuldade (seção 10) com balanceamento de
// famílias: o gerador prefere pares cujas famílias ainda não apareceram
// no jogo e pares com famílias diferentes entre A e B. Não substitui as
// funções anteriores — adiciona uma camada de seleção pontuada.
//
// Cascata de fallback (defesa em profundidade):
//   (1) Diversidade forte + dificuldade + matemática.
//   (2) Sem preferência de diversidade, mantendo dificuldade + matemática.
//   (3) buildProgressiveValidatedGameSetup (cascata interna própria).
//   (4) buildValidatedGameSetup (último recurso, sem dificuldade).
// ============================================================================

const getEventFamily = (event: Event): string => {
  return event.family ?? "sem-familia";
};

/**
 * Pontuação pedagógica de um par (A, B) considerando o estado de
 * famílias já usadas e o índice do slot. Quanto maior, mais diverso.
 *   +3 para cada família ainda não usada (recompensa freshness global)
 *   +2 quando A e B têm famílias diferentes (diversidade intra-par)
 *   −2 quando A e B têm a mesma família (penaliza homogeneidade)
 *   +1 nos dois primeiros slots quando famílias diferem (boost inicial)
 */
const scoreCandidatePair = (
  A: Event,
  B: Event,
  usedFamilies: ReadonlySet<string>,
  slotIndex: number
): number => {
  const familyA = getEventFamily(A);
  const familyB = getEventFamily(B);
  let score = 0;
  if (!usedFamilies.has(familyA)) score += 3;
  if (!usedFamilies.has(familyB)) score += 3;
  if (familyA !== familyB) score += 2;
  if (familyA === familyB) score -= 2;
  if (slotIndex <= 1 && familyA !== familyB) score += 1;
  return score;
};

/**
 * Ordena os pares candidatos em ordem decrescente de score pedagógico.
 * Empates são resolvidos com tie-break aleatório leve (preserva variabilidade).
 */
const sortPairsByPedagogicalDiversity = (
  candidates: readonly [Event, Event][],
  usedFamilies: ReadonlySet<string>,
  slotIndex: number
): [Event, Event][] => {
  return [...candidates].sort((p1, p2) => {
    const s1 = scoreCandidatePair(p1[0], p1[1], usedFamilies, slotIndex);
    const s2 = scoreCandidatePair(p2[0], p2[1], usedFamilies, slotIndex);
    if (s2 !== s1) return s2 - s1;
    return Math.random() - 0.5;
  });
};

/**
 * Seleciona o melhor par admissível para um slot composto, considerando:
 *   - validações matemáticas (isValidPairForOperation)
 *   - perfil de dificuldade (allowedA, allowedB, maxPairAverage)
 *   - eventos não reutilizáveis (usedEvents)
 *   - quando enforceDiversity=true: pontuação por diversidade de famílias
 *     em relação a usedFamilies; caso contrário, escolha aleatória
 *     uniforme entre os candidatos válidos.
 */
const pickBalancedValidPairForSlot = (
  availableEvents: readonly Event[],
  operation: Operation,
  usedEvents: ReadonlySet<Event>,
  usedFamilies: ReadonlySet<string>,
  slotProfile: DifficultyProfile["compoundSlots"][number],
  slotIndex: number,
  enforceDiversity: boolean
): [Event, Event] | null => {
  const candidates: [Event, Event][] = [];
  for (const A of availableEvents) {
    if (usedEvents.has(A)) continue;
    const dA = getEventDifficulty(A);
    if (!slotProfile.allowedA.includes(dA)) continue;
    for (const B of availableEvents) {
      if (A === B || usedEvents.has(B)) continue;
      const dB = getEventDifficulty(B);
      if (!slotProfile.allowedB.includes(dB)) continue;
      if (slotProfile.maxPairAverage !== undefined &&
          (dA + dB) / 2 > slotProfile.maxPairAverage) continue;
      if (!isValidPairForOperation(A, B, operation)) continue;
      candidates.push([A, B]);
    }
  }
  if (candidates.length === 0) return null;
  if (enforceDiversity) {
    return sortPairsByPedagogicalDiversity(candidates, usedFamilies, slotIndex)[0];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Seleciona dois eventos simples preferindo famílias distintas
 * (quando enforceDiversity=true). Mantém todas as validações da
 * função de seleção de simples original (não-iguais, não-complementares).
 */
const pickBalancedValidSimplePair = (
  pool: readonly Event[],
  enforceDiversity: boolean
): readonly [Event, Event] | null => {
  const validPairs: [Event, Event][] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (isValidSimplePair(pool[i], pool[j])) {
        validPairs.push([pool[i], pool[j]]);
      }
    }
  }
  if (validPairs.length === 0) return null;
  if (!enforceDiversity) {
    return validPairs[Math.floor(Math.random() * validPairs.length)];
  }
  // Preferir famílias distintas, com tie-break aleatório.
  validPairs.sort((p1, p2) => {
    const diff1 = getEventFamily(p1[0]) !== getEventFamily(p1[1]) ? 1 : 0;
    const diff2 = getEventFamily(p2[0]) !== getEventFamily(p2[1]) ? 1 : 0;
    if (diff2 !== diff1) return diff2 - diff1;
    return Math.random() - 0.5;
  });
  return validPairs[0];
};

/**
 * Tenta uma única atribuição balanceada usando o perfil dado.
 * Quando enforceDiversity=true, aplica scoring de famílias.
 * Lança erro se algum slot não admitir par válido.
 */
const tryBalancedProgressiveAssignment = (
  validPool: readonly Event[],
  operations: readonly Operation[],
  profile: DifficultyProfile,
  enforceDiversity: boolean
): ValidatedSetup => {
  const simplePool = validPool.filter(e =>
    profile.simpleAllowed.includes(getEventDifficulty(e))
  );
  const simplePair = pickBalancedValidSimplePair(simplePool, enforceDiversity);
  if (!simplePair) {
    throw new Error(
      "Sem par simples admissível com restrições de dificuldade do perfil."
    );
  }

  const usedEvents = new Set<Event>([simplePair[0], simplePair[1]]);
  const usedFamilies = new Set<string>([
    getEventFamily(simplePair[0]),
    getEventFamily(simplePair[1]),
  ]);

  const shuffledOps = shuffleArray(operations);
  const compoundSlots: CompoundSlot[] = [];

  for (let i = 0; i < profile.compoundSlots.length; i++) {
    const slotProfile = profile.compoundSlots[i];
    const op: Operation = slotProfile.operation
      ?? shuffledOps[i % shuffledOps.length];

    const pair = pickBalancedValidPairForSlot(
      validPool, op, usedEvents, usedFamilies,
      slotProfile, i, enforceDiversity
    );
    if (!pair) {
      throw new Error(
        `Sem par admissível para slot ${i + 1} (operação=${op}).`
      );
    }
    usedEvents.add(pair[0]);
    usedEvents.add(pair[1]);
    usedFamilies.add(getEventFamily(pair[0]));
    usedFamilies.add(getEventFamily(pair[1]));
    compoundSlots.push({ A: pair[0], B: pair[1], operation: op });
  }

  return { simpleEvents: [simplePair[0], simplePair[1]], compoundSlots };
};

/**
 * Geração com progressão didática E diversidade pedagógica por família.
 *
 * Cascata de fallback (defesa em profundidade):
 *   (1) Diversidade forte + dificuldade + matemática.
 *   (2) Sem preferência de diversidade, mantendo dificuldade + matemática.
 *   (3) buildProgressiveValidatedGameSetup (cascata interna própria).
 *   (4) buildValidatedGameSetup (último recurso, sem dificuldade).
 *
 * Em todos os caminhos, validações matemáticas (R1–R4 via
 * isValidPairForOperation) e estruturais (não-iguais, não-complementares,
 * sem reuso) são preservadas. Nunca retorna jogo inválido.
 */
export const buildBalancedProgressiveValidatedGameSetup = (
  pool: readonly Event[],
  operations: readonly Operation[],
  profile: DifficultyProfile = DEFAULT_DIFFICULTY_PROFILE,
  greedyRetries: number = 50
): ValidatedSetup => {
  const validPool = pool.filter(isValidSingleEvent);

  // Nível 1 — diversidade forte + dificuldade.
  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try {
      return tryBalancedProgressiveAssignment(validPool, operations, profile, true);
    } catch { /* retry */ }
  }

  // Nível 2 — sem preferência de diversidade, mantendo dificuldade.
  for (let attempt = 0; attempt < greedyRetries; attempt++) {
    try {
      return tryBalancedProgressiveAssignment(validPool, operations, profile, false);
    } catch { /* retry */ }
  }

  // Nível 3 — delega para a função progressiva (com sua própria cascata).
  try {
    return buildProgressiveValidatedGameSetup(pool, operations, profile, greedyRetries);
  } catch { /* fall through */ }

  // Nível 4 — fallback definitivo.
  return buildValidatedGameSetup(pool, operations, greedyRetries);
};

/**
 * Diagnóstico combinado: famílias + dificuldade + métricas agregadas.
 * Útil para auditoria pedagógica completa de um setup gerado.
 */
export const diagnoseBalancedProgression = (setup: ValidatedSetup) => {
  return {
    families: diagnoseSetupCoverage(setup),
    difficulty: diagnoseDifficultyProgression(setup),
    uniqueFamilies: getFamiliesFromSetup(setup).length,
    totalEventsUsed: 2 + setup.compoundSlots.length * 2,
  };
};
