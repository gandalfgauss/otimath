/* ═══════════════════════════════════════════════════════════════
   eventBank — fundação neutra para eventos sobre Ω = {1..6}².

   Reaproveita o tipo Event compatível com useTwoDicesHooks.ts.
   Não importa do hook (evita ciclo) — declara tipo idêntico.

   Responsabilidades:
     • Tipos de Event, AtomicEvent, RuleDescription, ComplementaryEventData
     • Utilitários neutros: computeCardinality, materializeSet, invertEvent
     • Combinador de eventos por união (Famílias 4 e 7 do gerador)
     • Filtro de distribuição visual (anti-padrão geométrico)
     • Blindagem matemática verifyComplementaryConsistency

   Vocabulário canônico para descrições em LN:
     • i (linha) ⟺ "dado verde"
     • j (coluna) ⟺ "dado azul"
     • Nunca usar "primeiro", "segundo", "i", "j" nas descrições.
   ═══════════════════════════════════════════════════════════════ */

// ─── Constantes ─────────────────────────────────────────────────

export const DICE_FACES = [1, 2, 3, 4, 5, 6] as const;
export const SAMPLE_SPACE_SIZE = 36;

// ─── Tipos ──────────────────────────────────────────────────────

/** Compatível com Event de useTwoDicesHooks.ts — manter assinatura idêntica. */
export interface Event {
  name?: string;
  description: string;
  complementaryDescription: string;
  validation: (greenDice: number, blueDice: number) => boolean;
}

/** Evento atômico (uma única regra) usado como peça para composições. */
export interface AtomicEvent {
  /** Event pronto para uso no MarkingTable / hook. */
  event: Event;
  /** Texto da regra SEM "ocorre" — apenas a propriedade.
   *  Ex.: "a soma dos dados é maior que 8".
   *  Usado para concatenar em uniões: "ocorre (a) ... ou (b) ...". */
  ruleText: string;
  /** Cardinalidade pré-calculada (n(evento)). Evita recomputar. */
  cardinality: number;
}

/** Dados completos de um problema de evento complementar. */
export interface ComplementaryEventData {
  id: string;
  /** Evento A — n grande (idealmente ∈ [26, 33]). */
  eventA: Event;
  /** Evento Ā = complementar de A — n pequeno (idealmente ∈ [3, 10]). */
  eventComplement: Event;
  /** Conjunto Ā materializado em pares "g,b" (g = verde, b = azul). */
  E: Set<string>;
  /** Cardinalidade de A. */
  nA: number;
  /** Cardinalidade de Ā = |E|. */
  nE: number;
  /** Família que originou o problema (telemetria/depuração). */
  family: string;
}

// ─── Utilitários neutros ────────────────────────────────────────

/** Calcula |evento| iterando o grid 6×6 sob a função validation. */
export function computeCardinality(ev: Event): number {
  let n = 0;
  for (const g of DICE_FACES) {
    for (const b of DICE_FACES) {
      if (ev.validation(g, b)) n++;
    }
  }
  return n;
}

/** Materializa o conjunto de pares (g,b) que satisfazem validation. */
export function materializeSet(ev: Event): Set<string> {
  const s = new Set<string>();
  for (const g of DICE_FACES) {
    for (const b of DICE_FACES) {
      if (ev.validation(g, b)) s.add(`${g},${b}`);
    }
  }
  return s;
}

/** Cria o complementar de um Event (troca description ↔ complementaryDescription
 *  e nega o predicado). */
export function invertEvent(ev: Event): Event {
  return {
    description: ev.complementaryDescription,
    complementaryDescription: ev.description,
    validation: (g, b) => !ev.validation(g, b),
  };
}

/** Predicado primalidade para faces de dado (∈ {2,3,5}). */
export function isPrimeFace(n: number): boolean {
  return n === 2 || n === 3 || n === 5;
}

// ─── Combinador de eventos por união ────────────────────────────

/** Compõe N eventos atômicos por união lógica. Usado nas Famílias 4 e 7.
 *
 *  Descrição final em LN:
 *    1 átomo  → "{ruleText}"
 *    N átomos → "ocorre pelo menos uma das situações: (a) ...; (b) ...; (c) ..."
 *
 *  O Event resultante tem:
 *    - description = enunciado do evento "ocorre"
 *    - complementaryDescription = enunciado do "NÃO ocorre nenhuma" — usado pelo nosso A
 *    - validation = OR lógico dos predicados
 */
export function combineUnion(...atoms: AtomicEvent[]): AtomicEvent {
  if (atoms.length === 0) {
    throw new Error('combineUnion: pelo menos 1 átomo é necessário');
  }
  if (atoms.length === 1) return atoms[0];

  const items = atoms.map((a, i) => `(${String.fromCharCode(97 + i)}) ${a.ruleText}`).join('; ');
  const positive = `ocorre pelo menos uma destas situações: ${items}`;
  const negative = `não ocorre nenhuma destas situações: ${items}`;

  const combinedValidation = (g: number, b: number) => atoms.some(a => a.event.validation(g, b));

  // Cardinalidade pela materialização (mais seguro que somar e subtrair interseções)
  const tmpEvent: Event = {
    description: positive,
    complementaryDescription: negative,
    validation: combinedValidation,
  };
  const cardinality = computeCardinality(tmpEvent);

  return {
    event: tmpEvent,
    ruleText: positive,
    cardinality,
  };
}

// ─── Filtro de distribuição visual ──────────────────────────────

/**
 * Verifica se o conjunto E ⊂ {1..6}² evita padrões geométricos óbvios
 * que tornariam o problema "decorável visualmente" em vez de raciocinado.
 *
 * Regras (todas devem passar):
 *   R0  3 ≤ |E| ≤ 10
 *   R1  Não toda em uma única linha (i constante)
 *   R2  Não toda em uma única coluna (j constante)
 *   R3  Não toda em uma única diagonal de soma (i+j constante)
 *   R4  Não toda em uma única diagonal de diferença (i-j constante)
 *   R5  Máximo 4 pares em qualquer linha
 *   R6  Máximo 4 pares em qualquer coluna
 *   R7  Se |E| ≥ 5: distribuído em ≥ 3 linhas DISTINTAS E ≥ 3 colunas DISTINTAS
 */
export function passesVisualDistribution(E: Set<string>): boolean {
  const n = E.size;
  if (n < 3 || n > 10) return false;

  const pairs: Array<[number, number]> = [];
  for (const key of E) {
    const [r, c] = key.split(',').map(Number);
    pairs.push([r, c]);
  }

  const rows = new Set(pairs.map(([r]) => r));
  const cols = new Set(pairs.map(([, c]) => c));
  const sumDiags = new Set(pairs.map(([r, c]) => r + c));
  const diffDiags = new Set(pairs.map(([r, c]) => r - c));

  if (rows.size === 1) return false;       // R1
  if (cols.size === 1) return false;       // R2
  if (sumDiags.size === 1) return false;   // R3
  if (diffDiags.size === 1) return false;  // R4

  const rowCounts = new Map<number, number>();
  pairs.forEach(([r]) => rowCounts.set(r, (rowCounts.get(r) ?? 0) + 1));
  for (const v of rowCounts.values()) if (v > 4) return false;  // R5

  const colCounts = new Map<number, number>();
  pairs.forEach(([, c]) => colCounts.set(c, (colCounts.get(c) ?? 0) + 1));
  for (const v of colCounts.values()) if (v > 4) return false;  // R6

  if (n >= 5 && (rows.size < 3 || cols.size < 3)) return false; // R7

  return true;
}

// ─── Blindagem matemática ───────────────────────────────────────

/**
 * Verifica que o trio (eventA, eventComplement, E) é matematicamente consistente.
 *
 * Invariantes:
 *   I1  ∀(g,b): pA(g,b) XOR pComp(g,b)       — A e Ā são logicamente opostos
 *   I2  ∀(g,b): pComp(g,b) ⟺ "g,b" ∈ E       — Ā é exatamente E
 *   I3  |A| + |Ā| = 36                        — partição do espaço amostral
 *   I4  A ∩ Ā = ∅                             — disjunção
 *   I5  A ∪ Ā = Ω                             — cobertura total
 */
export function verifyComplementaryConsistency(
  eventA: Event,
  eventComplement: Event,
  E: Set<string>,
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  let countA = 0, countComp = 0, countBoth = 0, countNeither = 0;

  for (const g of DICE_FACES) {
    for (const b of DICE_FACES) {
      const key = `${g},${b}`;
      const pA = eventA.validation(g, b);
      const pComp = eventComplement.validation(g, b);
      const inE = E.has(key);

      if (pA === pComp) {
        violations.push(`(${g},${b}): pA=pComp=${pA} viola complementaridade (I1)`);
      }
      if (pComp !== inE) {
        violations.push(`(${g},${b}): pComp=${pComp} mas inE=${inE} (I2)`);
      }

      if (pA) countA++;
      if (pComp) countComp++;
      if (pA && pComp) countBoth++;
      if (!pA && !pComp) countNeither++;
    }
  }

  if (countA + countComp !== SAMPLE_SPACE_SIZE) {
    violations.push(`|A|+|Ā|=${countA + countComp} ≠ 36 (I3)`);
  }
  if (countBoth !== 0) {
    violations.push(`|A ∩ Ā|=${countBoth} (I4)`);
  }
  if (countNeither !== 0) {
    violations.push(`|Ω \\ (A ∪ Ā)|=${countNeither} (I5)`);
  }

  return { ok: violations.length === 0, violations };
}

// ─── Helpers de descrição em LN (vocabulário canônico) ──────────

/** Descrição infinitiva que entra como `ruleText` em AtomicEvent.
 *  Garante o vocabulário canônico (verde/azul, soma/produto/diferença, etc.). */
export const LN = {
  sumGt: (k: number) => `a soma dos dados é maior que ${k}`,
  sumGte: (k: number) => `a soma dos dados é maior ou igual a ${k}`,
  sumLt: (k: number) => `a soma dos dados é menor que ${k}`,
  sumLte: (k: number) => `a soma dos dados é menor ou igual a ${k}`,
  sumEq: (k: number) => `a soma dos dados é igual a ${k}`,
  sumNeq: (k: number) => `a soma dos dados é diferente de ${k}`,

  productGt: (k: number) => `o produto dos dados é maior que ${k}`,
  productGte: (k: number) => `o produto dos dados é maior ou igual a ${k}`,
  productLt: (k: number) => `o produto dos dados é menor que ${k}`,
  productLte: (k: number) => `o produto dos dados é menor ou igual a ${k}`,
  productEq: (k: number) => `o produto dos dados é igual a ${k}`,

  maxEq: (m: number) => `o maior dos dois dados é ${m}`,
  maxLt: (m: number) => `o maior dos dois dados é menor que ${m}`,
  maxLte: (m: number) => `o maior dos dois dados é menor ou igual a ${m}`,
  maxGt: (m: number) => `o maior dos dois dados é maior que ${m}`,
  maxGte: (m: number) => `o maior dos dois dados é maior ou igual a ${m}`,

  minEq: (m: number) => `o menor dos dois dados é ${m}`,
  minLt: (m: number) => `o menor dos dois dados é menor que ${m}`,
  minLte: (m: number) => `o menor dos dois dados é menor ou igual a ${m}`,
  minGt: (m: number) => `o menor dos dois dados é maior que ${m}`,
  minGte: (m: number) => `o menor dos dois dados é maior ou igual a ${m}`,

  absDiffEq: (d: number) => `a diferença em módulo entre os dados é ${d}`,

  greenLessThanBlue: 'o dado verde é menor que o dado azul',
  greenGreaterThanBlue: 'o dado verde é maior que o dado azul',
  diceEqual: 'os dois dados são iguais',
  diceDifferent: 'os dois dados são diferentes',

  greenEven: 'o dado verde é par',
  greenOdd: 'o dado verde é ímpar',
  blueEven: 'o dado azul é par',
  blueOdd: 'o dado azul é ímpar',
  greenEq: (k: number) => `o dado verde é ${k}`,
  blueEq: (k: number) => `o dado azul é ${k}`,
  greenPrime: 'o dado verde é primo',
  bluePrime: 'o dado azul é primo',

  atLeastOneEven: 'pelo menos uma das faces é par',
  atLeastOneOdd: 'pelo menos uma das faces é ímpar',
  atLeastOnePrime: 'pelo menos uma das faces é primo',
  atLeastOneGt: (k: number) => `pelo menos uma das faces é maior que ${k}`,
  atLeastOneLt: (k: number) => `pelo menos uma das faces é menor que ${k}`,

  noneEven: 'nenhuma das faces é par',
  noneOdd: 'nenhuma das faces é ímpar',
  nonePrime: 'nenhuma das faces é primo',
  noneGt: (k: number) => `nenhuma das faces é maior que ${k}`,
  noneLt: (k: number) => `nenhuma das faces é menor que ${k}`,

  exactlyOneEven: 'exatamente uma das faces é par',
  exactlyOneEqK: (k: number) => `exatamente uma das faces é ${k}`,

  bothEven: 'as duas faces são pares',
  bothOdd: 'as duas faces são ímpares',
  bothPrime: 'as duas faces são primas',
  bothGt: (k: number) => `as duas faces são maiores que ${k}`,
  bothLt: (k: number) => `as duas faces são menores que ${k}`,
} as const;

/** Antônimos prontos para `complementaryDescription` quando precisar montar
 *  Event a partir de uma propriedade simples sem invocar invertEvent. */
export const LN_NEG = {
  sumGt: (k: number) => `a soma dos dados é menor ou igual a ${k}`,
  sumGte: (k: number) => `a soma dos dados é menor que ${k}`,
  sumLt: (k: number) => `a soma dos dados é maior ou igual a ${k}`,
  sumLte: (k: number) => `a soma dos dados é maior que ${k}`,
  sumEq: (k: number) => `a soma dos dados é diferente de ${k}`,

  productGt: (k: number) => `o produto dos dados é menor ou igual a ${k}`,
  productLt: (k: number) => `o produto dos dados é maior ou igual a ${k}`,
  productEq: (k: number) => `o produto dos dados é diferente de ${k}`,

  maxEq: (m: number) => `o maior dos dois dados é diferente de ${m}`,
  minEq: (m: number) => `o menor dos dois dados é diferente de ${m}`,

  atLeastOneEven: 'nenhuma das faces é par',
  atLeastOneOdd: 'nenhuma das faces é ímpar',
  atLeastOnePrime: 'nenhuma das faces é primo',
  noneEven: 'pelo menos uma das faces é par',
  noneOdd: 'pelo menos uma das faces é ímpar',
  nonePrime: 'pelo menos uma das faces é primo',
  bothEven: 'pelo menos uma das faces é ímpar',
  bothOdd: 'pelo menos uma das faces é par',
} as const;
