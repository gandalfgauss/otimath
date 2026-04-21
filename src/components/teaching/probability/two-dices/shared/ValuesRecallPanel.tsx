'use client';

/* ═══════════════════════════════════════════════════════════════
   ValuesRecallPanel — painel de memória externa (HOYLES; NOSS, 2003).

   Exibe em chips coloridos os valores já calculados nas etapas
   anteriores: n(A), n(B), n(A∩B), n(A∪B) e n(S)=36. Cada campo é
   opcional — só renderiza os que forem passados.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { EVENT_COLORS } from './eventPair';

export function ValuesRecallPanel({
  nA, nB, nI, nU,
}: {
  nA?: number; nB?: number; nI?: number; nU?: number;
}) {
  const item = (label: string, value: number | string, color: string) => (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        background: 'var(--color-neutral-white)',
        border: `2px solid ${color}`,
        minWidth: 72,
      }}
    >
      <span className="ds-caption" style={{ color, fontWeight: 700, fontSize: '0.72rem' }}>
        {label}
      </span>
      <span className="ds-body-bold" style={{ color: 'var(--color-neutral-darkest)', fontSize: '1.05rem' }}>
        {value}
      </span>
    </div>
  );
  return (
    <div
      className="rounded-md p-micro mb-micro"
      aria-label="Valores calculados nas etapas anteriores"
      style={{
        background: 'var(--color-brand-otimath-lightest)',
        border: '1px solid var(--color-brand-otimath-light)',
      }}
    >
      <p className="ds-caption-bold text-center text-neutral-dark mb-nano" style={{ fontSize: '0.78rem' }}>
        Valores calculados nas etapas anteriores
      </p>
      <div className="flex items-center justify-center" style={{ gap: 8, flexWrap: 'wrap' }}>
        {nA !== undefined && item('n(A) =', nA, EVENT_COLORS['A'])}
        {nB !== undefined && item('n(B) =', nB, EVENT_COLORS['B'])}
        {nI !== undefined && item('n(A ∩ B) =', nI, EVENT_COLORS['A∩B'])}
        {nU !== undefined && item('n(A ∪ B) =', nU, EVENT_COLORS['A∪B'])}
        {item('n(S) =', 36, 'var(--color-neutral-dark)')}
      </div>
    </div>
  );
}
