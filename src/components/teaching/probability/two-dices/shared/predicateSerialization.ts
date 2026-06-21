/* ═══════════════════════════════════════════════════════════════
   Serialização de predicados sobre o espaço amostral Ω = 6×6.

   Os eventos da Cena 7 carregam `validation`/`predicate` como
   funções (closures não-serializáveis em JSON). Para persistir o
   problema sorteado num snapshot F5, materializamos o conjunto de
   pares (g, b) que satisfazem o predicado e reconstruímos a função
   na restauração.

   Esse approach é exato (testa todos os 36 pares) e robusto a
   QUALQUER predicado, independente de sua estrutura interna —
   evitando reimplementar a árvore de SumCondition/NumberProperty
   na camada de serialização.
   ═══════════════════════════════════════════════════════════════ */

const FACES = [1, 2, 3, 4, 5, 6] as const;

/** Materializa um predicado (g, b) → bool em lista de chaves "g,b". */
export function serializeDicePredicate(pred: (g: number, b: number) => boolean): string[] {
  const out: string[] = [];
  for (const g of FACES) {
    for (const b of FACES) {
      if (pred(g, b)) out.push(`${g},${b}`);
    }
  }
  return out;
}

/** Reconstrói um predicado a partir de uma lista de chaves "g,b". */
export function buildDicePredicate(pairs: string[]): (g: number, b: number) => boolean {
  const set = new Set(pairs);
  return (g: number, b: number) => set.has(`${g},${b}`);
}

/** Materializa um Set<string> ("g,b") em array — Sets não serializam em JSON. */
export function serializeDiceSet(set: Set<string>): string[] {
  return Array.from(set);
}

/** Reconstrói Set<string> de array. */
export function deserializeDiceSet(arr: unknown): Set<string> {
  if (!Array.isArray(arr)) return new Set();
  return new Set(arr.filter((v): v is string => typeof v === 'string'));
}
