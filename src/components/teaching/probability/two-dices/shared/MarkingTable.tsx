'use client';

/* ═══════════════════════════════════════════════════════════════
   Tabela de marcação 6×6 e componentes auxiliares de dados/eventos.

   Exporta:
     - DieFace           — face de dado em SVG (pintas 3×3)
     - FrozenCheckbox    — checkbox customizado para marcações congeladas
     - MarkingTable      — tabela 6×6 interativa com headers de dados
     - EventCard         — card com "Evento X: descrição"

   Idêntico ao utilizado na fase unionTheory. Reuso completo:
   placeholders (faces de dado), fluxo (toggle via checkbox), cores
   por evento (EVENT_COLORS) e overlays de eventos anteriores.
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { EVENT_COLORS, MarkMatrix } from './eventPair';

// ─── DieFace ────────────────────────────────────────────────────

const PIP_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [0, 0, 1, 0, 0, 0, 1, 0, 0],
  3: [0, 0, 1, 0, 1, 0, 1, 0, 0],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

export function DieFace({ face, size, color }: { face: number; size: number; color: 'green' | 'blue' }) {
  const pips = PIP_PATTERNS[face] ?? [];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bg = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div
      aria-label={`Dado ${color === 'green' ? 'verde' : 'azul'} face ${face}`}
      style={{
        width: size, height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bg,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
      }}
    >
      {pips.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

// ─── FrozenCheckbox ─────────────────────────────────────────────

export function FrozenCheckbox({ checked, color, label }: { checked: boolean; color: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} ${checked ? 'marcado' : 'não marcado'} (congelado)`}
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        border: `2px solid ${color}`,
        background: checked ? color : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 8 L7 12 L13 4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── MarkingTable ───────────────────────────────────────────────

export interface MarkingTableProps {
  marks: MarkMatrix;
  onToggle: (row: number, col: number) => void;
  eventLabel: string | null;
  readOnlyMarks?: { label: string; matrix: MarkMatrix; color?: string }[];
}

export function MarkingTable({ marks, onToggle, eventLabel, readOnlyMarks }: MarkingTableProps) {
  const activeColor = eventLabel ? (EVENT_COLORS[eventLabel] ?? 'var(--color-brand-otimath-pure)') : undefined;
  return (
    <div className="w-full overflow-x-auto snap-both snap-mandatory scroll-p-[50px] max-lg:flex max-lg:justify-center max-sm:justify-start rounded-md shadow-level-1 max-lg:w-fit max-sm:w-full">
      <table className="bg-background-otimath relative w-fit h-full text-center rounded-md outline-solid outline-neutral-lighter outline-(length:--border-width-hairline) border-collapse mx-auto">
        <thead className="flex justify-end bg-background-otimath sticky top-[-1px] z-1">
          <tr className="flex justify-end">
            {[1, 2, 3, 4, 5, 6].map(c => (
              <th key={c} className="w-[100px] md:w-[130px] lg:w-[160px] xlg:w-[180px] h-[50px] flex justify-center items-center">
                <DieFace face={c} size={32} color="blue" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6].map(r => (
            <tr className="flex" key={`row-${r}`}>
              <td
                className="w-[50px] sticky left-[-1px] z-1 h-[100px] flex justify-center items-center bg-background-otimath"
                key={`head-${r}`}
              >
                <DieFace face={r} size={32} color="green" />
              </td>
              {[1, 2, 3, 4, 5, 6].map(c => {
                const row = r - 1, col = c - 1;
                const isChecked = marks[row][col];
                const isAlternateRow = (r - 1) % 2 === 0;
                return (
                  <td
                    key={`cell-${r}-${c}`}
                    className={`snap-start w-[100px] md:w-[130px] lg:w-[160px] xlg:w-[180px] border-solid border-neutral-lighter border-hairline h-[100px] flex justify-center items-center bg-background-otimath ${isAlternateRow ? 'bg-feedback-info-lightest' : ''}`}
                  >
                    <div className="w-full flex flex-col items-center justify-center gap-y-nano">
                      {readOnlyMarks?.map(ro => {
                        const roColor = ro.color ?? EVENT_COLORS[ro.label] ?? 'var(--color-neutral-dark)';
                        const roChecked = ro.matrix[row][col];
                        return (
                          <div
                            key={ro.label}
                            className="flex items-center gap-x-nano"
                            style={{ userSelect: 'none', cursor: 'not-allowed' }}
                            title={`${ro.label} já validado — marcação congelada`}
                          >
                            <FrozenCheckbox checked={roChecked} color={roColor} label={`${ro.label} em (${r},${c})`} />
                            <span
                              className="ds-caption-bold"
                              style={{ fontSize: '0.78rem', color: roColor, fontWeight: 700 }}
                            >
                              {ro.label}
                            </span>
                          </div>
                        );
                      })}
                      {eventLabel && (
                        <label
                          className="flex items-center gap-x-nano"
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggle(row, col)}
                            aria-label={`${eventLabel} em (${r},${c})`}
                            style={{
                              width: 18, height: 18,
                              accentColor: activeColor,
                            }}
                          />
                          <span
                            className="ds-caption-bold"
                            style={{ fontSize: '0.8rem', color: activeColor, fontWeight: 700 }}
                          >
                            {eventLabel}
                          </span>
                        </label>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EventCard ──────────────────────────────────────────────────

export function EventCard({ label, description }: { label: string; description: string }) {
  const color = EVENT_COLORS[label] ?? 'var(--color-brand-otimath-dark)';
  return (
    <div className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter">
      <p className="ds-body-bold text-center" style={{ color }}>
        Evento {label}
      </p>
      <p className="ds-body text-neutral-black text-center mt-nano">
        <strong style={{ color }}>{label}:</strong> {description}
      </p>
    </div>
  );
}
