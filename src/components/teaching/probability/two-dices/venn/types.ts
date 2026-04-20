/* ═══════════════════════════════════════════════════════════════
   Tipos genéricos do laboratório de Venn.
   Suporte a N ∈ {2, 3} conjuntos.
   V1 implementa apenas N=2; V2 acrescentará renderização de N=3
   sem alterar estes tipos.
   ═══════════════════════════════════════════════════════════════ */

// Quantidade de conjuntos no diagrama de Venn.
// N=4 exige elipses (diagrama de Edwards) e fica fora do escopo.
export type VennSize = 2 | 3;

// Especificação de cada conjunto
export interface VennSetSpec {
  label: string;         // "A", "B", "C"
  description: string;   // "A soma é maior ou igual a 4"
  cardinality: number;   // n(A)
  color: string;         // cor do traço do círculo (CSS variable)
  fill: string;          // cor de preenchimento translúcido
}

// Máscara de membresia: um booleano por conjunto.
// Para N=2: [true, false] = apenas em A; [true, true] = em A∩B
// Para N=3: [true, false, true] = em A∩C, não em B; [true, true, true] = A∩B∩C
export type MembershipMask = readonly boolean[];

export function maskKey(mask: MembershipMask): string {
  return mask.map(b => (b ? '1' : '0')).join('');
}

export function masksEqual(a: MembershipMask, b: MembershipMask): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Região do diagrama (cada "pedaço" definido por uma máscara)
export interface VennRegion {
  mask: MembershipMask;
  cardinality: number | null;  // conhecida ou pendente
  shortLabel: string;          // "A ∩ B", "A\B", etc.
  semanticDescription: string; // "Ocorre A e B ao mesmo tempo"
}

// Geometria de um círculo no SVG
export interface CircleGeometry {
  cx: number;
  cy: number;
  r: number;
}

export interface VennGeometry {
  size: VennSize;
  circles: readonly CircleGeometry[]; // length === size
  viewBoxWidth: number;
  viewBoxHeight: number;
}
