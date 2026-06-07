/* ═══════════════════════════════════════════════════════════════
   Funções geométricas e construção de regiões.
   Genérico para N ∈ {2, 3}. V1 usa apenas N=2.
   ═══════════════════════════════════════════════════════════════ */

import {
  CircleGeometry, MembershipMask, VennGeometry, VennRegion, VennSize,
} from './types';

// 960×640 (aspect 3:2, antes 2:1). A altura maior tem dois efeitos:
//   - Desktop: SVG renderiza 960×640 dentro do `maxWidth: VIEWBOX_WIDTH`.
//   - Mobile: SVG renderiza no width da viewport (ex.: 360px) com altura
//     PROPORCIONAL → 360×240 (antes era 360×180). 33% mais alto, ocupa
//     mais a tela e os símbolos ficam mais legíveis.
export const VIEWBOX_WIDTH = 960;
export const VIEWBOX_HEIGHT = 640;

export function distanceToCenter(x: number, y: number, c: CircleGeometry): number {
  return Math.hypot(x - c.cx, y - c.cy);
}

export function isInsideCircle(x: number, y: number, c: CircleGeometry): boolean {
  return distanceToCenter(x, y, c) <= c.r;
}

export function detectMembership(
  x: number, y: number, circles: readonly CircleGeometry[],
): MembershipMask {
  return circles.map(c => isInsideCircle(x, y, c));
}

export function circlesOverlap(a: CircleGeometry, b: CircleGeometry): boolean {
  return Math.hypot(b.cx - a.cx, b.cy - a.cy) < a.r + b.r - 2;
}

// Ponto-âncora para rotular/posicionar valores de cada região
export function regionAnchor(
  mask: MembershipMask,
  circles: readonly CircleGeometry[],
  viewBoxWidth: number = VIEWBOX_WIDTH,
  viewBoxHeight: number = VIEWBOX_HEIGHT,
): { x: number; y: number } {
  if (circles.length === 2) {
    const [A, B] = circles;
    if (mask[0] && mask[1]) return { x: (A.cx + B.cx) / 2, y: (A.cy + B.cy) / 2 };
    // A\B: ponto médio entre a borda esquerda de A e a borda esquerda de B
    // (que é onde a interseção começa). Dá o centroide visual da lunete.
    if (mask[0] && !mask[1]) return { x: ((A.cx - A.r) + (B.cx - B.r)) / 2, y: A.cy };
    // B\A: análogo — entre a borda direita de A e a borda direita de B.
    if (!mask[0] && mask[1]) return { x: ((A.cx + A.r) + (B.cx + B.r)) / 2, y: B.cy };
    return { x: 60, y: 40 };
  }
  // N=3 (futuro)
  return { x: viewBoxWidth / 2, y: viewBoxHeight / 2 };
}

// Geometria inicial (disjuntos) para N=2.
// cy recentrado pra 320 (meio de viewBoxHeight=640).
export function defaultGeometry2Disjoint(): VennGeometry {
  return {
    size: 2,
    circles: [
      { cx: 240, cy: 320, r: 170 },
      { cx: 720, cy: 320, r: 170 },
    ],
    viewBoxWidth: VIEWBOX_WIDTH,
    viewBoxHeight: VIEWBOX_HEIGHT,
  };
}

// Geometria canônica (com interseção) para N=2.
// cy recentrado pra 320 (meio de viewBoxHeight=640).
// Raio = 180 px, distância entre centros = 180 px
// → sobreposição horizontal central com espaço pra "n(A ∩ B)".
// → lunetes laterais com largura suficiente pra "n(A − B)" / "n(B − A)".
export function defaultGeometry2Intersected(): VennGeometry {
  return {
    size: 2,
    circles: [
      { cx: 390, cy: 320, r: 180 },
      { cx: 570, cy: 320, r: 180 },
    ],
    viewBoxWidth: VIEWBOX_WIDTH,
    viewBoxHeight: VIEWBOX_HEIGHT,
  };
}

// Geometria N=3 (futuro uso em v2 — não renderizada em v1)
export function defaultGeometry3(): VennGeometry {
  const cx = VIEWBOX_WIDTH / 2;
  const cy = VIEWBOX_HEIGHT / 2;
  const r = 130;
  const offset = 80;
  return {
    size: 3,
    circles: [
      { cx: cx - offset, cy: cy - offset / 2, r },
      { cx: cx + offset, cy: cy - offset / 2, r },
      { cx, cy: cy + offset, r },
    ],
    viewBoxWidth: VIEWBOX_WIDTH,
    viewBoxHeight: VIEWBOX_HEIGHT,
  };
}

// Constrói as 4 regiões padrão para N=2
export function buildRegions2(
  nA: number, nB: number, nI: number, omega: number = 36,
): VennRegion[] {
  return [
    {
      mask: [true, false],
      cardinality: nA - nI,
      shortLabel: 'A − B',
      semanticDescription: 'Ocorre A, mas não ocorre B',
    },
    {
      mask: [true, true],
      cardinality: nI,
      shortLabel: 'A ∩ B',
      semanticDescription: 'Ocorre A e B ao mesmo tempo',
    },
    {
      mask: [false, true],
      cardinality: nB - nI,
      shortLabel: 'B − A',
      semanticDescription: 'Ocorre B, mas não ocorre A',
    },
    {
      mask: [false, false],
      cardinality: omega - (nA + nB - nI),
      shortLabel: 'Ω − (A ∪ B)',
      semanticDescription: 'Não ocorre A nem B',
    },
  ];
}

// Construção genérica das 2^size regiões (útil para N=3 futuro)
export function buildAllRegionMasks(size: VennSize): MembershipMask[] {
  const total = 1 << size;
  const out: MembershipMask[] = [];
  for (let i = 0; i < total; i++) {
    const mask: boolean[] = [];
    for (let bit = 0; bit < size; bit++) mask.push(((i >> bit) & 1) === 1);
    out.push(mask);
  }
  return out;
}
