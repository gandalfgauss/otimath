'use client';

/* ═══════════════════════════════════════════════════════════════
   ContingencyTable — Tabela de contingência 2×2 com totais
   editáveis tri-estado, formatada como GRID matemático contínuo.

   Princípios de design (rev. 2):
   • Tabela como GRID único — sem aparência de "cards" soltos.
   • Escudos +30% de área (fator linear 1.15) → 74 px.
   • Símbolos ♂/♀ em container colorido interno (cartão) com
     fundo diferenciado para alto contraste WCAG: ♂ azul-claro,
     ♀ laranja-queimado, símbolos brancos com text-shadow.
   • Coluna "Total" levemente mais larga e com fundo destacado
     (linha e coluna) para reforçar hierarquia.
   • Placeholders ocupam 100% da célula, parecem células vazias.
   • Espaçamento entre células reduzido para aparência de tabela
     matemática (não de cards).
   ═══════════════════════════════════════════════════════════════ */

import React from 'react';
import { TeamShield } from './TeamShield';
import type { Exercise5Data } from './exercise5Data';

export type TotalKey = 't1' | 't2' | 'th' | 'tm' | 'tg';
export type TotalsState = Record<TotalKey, string>;
export type TotalsValidation = Partial<Record<TotalKey, boolean>>;

interface ContingencyTableProps {
  data: Exercise5Data;
  totals: TotalsState;
  setTotals: (next: TotalsState) => void;
  validation: TotalsValidation;
  locked: boolean;
}

const HELP_PER_TOTAL: Record<TotalKey, string> = {
  t1: 'soma das células da linha do Time1 (♂ + ♀)',
  t2: 'soma das células da linha do Time2 (♂ + ♀)',
  th: 'soma das células da coluna ♂ (Time1 + Time2)',
  tm: 'soma das células da coluna ♀ (Time1 + Time2)',
  tg: 'soma de TODAS as células (também = t1+t2 = th+tm)',
};

// ── Geometria calibrada (rev. 2) ──────────────────────────────────
const SHIELD = 74;                           // 64 → +30% área (×1.15)
const ROW_H = 92;                            // altura uniforme das 3 linhas
const SYMBOL_PX = Math.round(SHIELD * 0.7);  // ≈ 52 px — 70% do escudo
const COL1_W = 132;                          // layout vertical: escudo + nome abaixo (cabe "Internacional")
const COL_NUM_W = 96;                        // ♂/♀
const COL_TOTAL_W = 108;                     // ≈10% maior que COL_NUM_W
const CELL_GAP = 2;                          // espaçamento mínimo (grid contínuo)

// Cores (especificadas no prompt)
const C_HEADER_BG = '#0F2D5C';
const C_CELL_NUM_BG = '#ECF3FF';
const C_CARD_M_BG = '#4C8ED9';
const C_CARD_F_BG = '#9B6BBF';
const C_PLACEHOLDER_BORDER = '#CBD5E1';
const C_PLACEHOLDER_TEXT = '#9CA3AF';
const C_TOTAL_HIGHLIGHT_BG = '#E5EEF9';      // fundo levemente destacado da coluna/linha Total
const C_TOTAL_HIGHLIGHT_BORDER = '#0F2D5C';

export function ContingencyTable({
  data, totals, setTotals, validation, locked,
}: ContingencyTableProps) {
  const inputBaseStyle = (key: TotalKey, isTotal: boolean): React.CSSProperties => {
    const v = validation[key];
    const isLockedRight = locked || v === true;
    const isWrong = v === false;
    return {
      width: '100%',
      height: '100%',
      textAlign: 'center',
      fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
      fontWeight: 800,
      color: isLockedRight
        ? 'var(--color-feedback-success-darkest)'
        : isWrong
          ? 'var(--color-feedback-error-darkest)'
          : isTotal ? '#0F2D5C' : C_PLACEHOLDER_TEXT,
      background: isLockedRight
        ? 'var(--color-feedback-success-lighter)'
        : isWrong
          ? 'var(--color-feedback-error-lighter)'
          : 'var(--color-neutral-white)',
      border: `1px solid ${isLockedRight
        ? 'var(--color-feedback-success-dark)'
        : isWrong
          ? 'var(--color-feedback-error-dark)'
          : C_PLACEHOLDER_BORDER}`,
      borderRadius: 0,
      padding: 0,
      outline: 'none',
      transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
      display: 'block',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    };
  };

  const numCellStyle: React.CSSProperties = {
    fontFamily: '"Arial Black", Impact, sans-serif',
    fontSize: 'clamp(1.4rem, 2.8vw, 1.8rem)',
    fontWeight: 900,
    color: C_HEADER_BG,
    background: C_CELL_NUM_BG,
    border: `1px solid ${C_PLACEHOLDER_BORDER}`,
    padding: 0,
    textAlign: 'center',
    width: COL_NUM_W,
    height: ROW_H,
    boxSizing: 'border-box',
    verticalAlign: 'middle',
  };

  const totalColCellStyle: React.CSSProperties = {
    background: C_TOTAL_HIGHLIGHT_BG,
    border: `2px solid ${C_TOTAL_HIGHLIGHT_BORDER}`,
    padding: 0,
    width: COL_TOTAL_W,
    height: ROW_H,
    boxSizing: 'border-box',
    verticalAlign: 'middle',
  };

  const totalRowCellStyle = (widthPx: number): React.CSSProperties => ({
    background: C_TOTAL_HIGHLIGHT_BG,
    border: `2px solid ${C_TOTAL_HIGHLIGHT_BORDER}`,
    padding: 0,
    width: widthPx,
    height: ROW_H,
    boxSizing: 'border-box',
    verticalAlign: 'middle',
  });

  const totalRowColCornerStyle: React.CSSProperties = {
    background: '#D6E4F5',
    border: `3px solid ${C_TOTAL_HIGHLIGHT_BORDER}`,
    padding: 0,
    width: COL_TOTAL_W,
    height: ROW_H,
    boxSizing: 'border-box',
    verticalAlign: 'middle',
  };

  const headerNumCellStyle: React.CSSProperties = {
    background: C_HEADER_BG,
    color: 'var(--color-neutral-white)',
    border: `1px solid ${C_HEADER_BG}`,
    padding: 0,
    textAlign: 'center',
    width: COL_NUM_W,
    height: ROW_H,
    verticalAlign: 'middle',
    boxSizing: 'border-box',
  };

  const headerTotalCellStyle: React.CSSProperties = {
    background: C_HEADER_BG,
    color: 'var(--color-neutral-white)',
    border: `2px solid ${C_TOTAL_HIGHLIGHT_BORDER}`,
    padding: 0,
    textAlign: 'center',
    width: COL_TOTAL_W,
    height: ROW_H,
    verticalAlign: 'middle',
    boxSizing: 'border-box',
  };

  const rowHeaderStyle: React.CSSProperties = {
    background: C_HEADER_BG,
    color: 'var(--color-neutral-white)',
    border: `1px solid ${C_HEADER_BG}`,
    padding: 0,
    textAlign: 'center',
    width: COL1_W,
    height: ROW_H,
    verticalAlign: 'middle',
    boxSizing: 'border-box',
  };

  const totalRowHeaderStyle: React.CSSProperties = {
    background: C_HEADER_BG,
    color: 'var(--color-neutral-white)',
    border: `2px solid ${C_TOTAL_HIGHLIGHT_BORDER}`,
    padding: 0,
    textAlign: 'center',
    width: COL1_W,
    height: ROW_H,
    verticalAlign: 'middle',
    boxSizing: 'border-box',
  };

  const update = (key: TotalKey, raw: string) => {
    if (locked) return;
    const clean = raw.replace(/\D/g, '').slice(0, 4);
    setTotals({ ...totals, [key]: clean });
  };

  // Cartão interno colorido para os símbolos ♂/♀ (regra 6)
  const SymbolCard = ({ s }: { s: 'm' | 'f' }) => {
    const bg = s === 'm' ? C_CARD_M_BG : C_CARD_F_BG;
    const ariaLabel = s === 'm' ? 'Masculino' : 'Feminino';
    return (
      <div
        aria-label={ariaLabel}
        style={{
          width: '78%',
          height: '76%',
          margin: '0 auto',
          background: bg,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.18)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: SYMBOL_PX,
            lineHeight: 1,
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 0 6px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {s === 'm' ? '♂' : '♀'}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: 'clamp(8px, 2vw, 16px)',
        borderRadius: 12,
        background: 'var(--color-neutral-white)',
        border: `2px solid ${C_HEADER_BG}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <table
        style={{
          margin: '0 auto',
          borderCollapse: 'separate',
          borderSpacing: CELL_GAP,
          fontFamily: 'inherit',
          tableLayout: 'fixed',
        }}
        aria-label="Tabela de contingência: torcedores por sexo e time"
      >
        <caption className="sr-only">
          Tabela 2 por 2 mostrando o número de torcedores de cada time por sexo.
          Os totais (margens) devem ser preenchidos pelo aluno.
        </caption>
        <colgroup>
          <col style={{ width: COL1_W }} />
          <col style={{ width: COL_NUM_W }} />
          <col style={{ width: COL_NUM_W }} />
          <col style={{ width: COL_TOTAL_W }} />
        </colgroup>
        <thead>
          <tr style={{ height: ROW_H }}>
            <th aria-hidden="true" style={{ background: 'transparent', width: COL1_W, height: ROW_H }} />
            <th scope="col" style={headerNumCellStyle}>
              <SymbolCard s="m" />
            </th>
            <th scope="col" style={headerNumCellStyle}>
              <SymbolCard s="f" />
            </th>
            <th scope="col" style={headerTotalCellStyle}>
              <span
                style={{
                  color: 'var(--color-neutral-white)',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Total
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Linha do Time 1 */}
          <tr style={{ height: ROW_H }}>
            <th scope="row" style={rowHeaderStyle}>
              <RowHeaderCell team={data.team1} shield={SHIELD} maxWidth={COL1_W - 8} />
            </th>
            <td style={numCellStyle}>{data.H1}</td>
            <td style={numCellStyle}>{data.M1}</td>
            <td style={totalColCellStyle}>
              <input
                type="text"
                inputMode="numeric"
                value={totals.t1}
                onChange={e => update('t1', e.target.value)}
                disabled={locked}
                placeholder="?"
                aria-label={`Total de torcedores do ${data.team1.name}: ${HELP_PER_TOTAL.t1}`}
                aria-invalid={validation.t1 === false}
                style={inputBaseStyle('t1', true)}
              />
            </td>
          </tr>
          {/* Linha do Time 2 */}
          <tr style={{ height: ROW_H }}>
            <th scope="row" style={rowHeaderStyle}>
              <RowHeaderCell team={data.team2} shield={SHIELD} maxWidth={COL1_W - 8} />
            </th>
            <td style={numCellStyle}>{data.H2}</td>
            <td style={numCellStyle}>{data.M2}</td>
            <td style={totalColCellStyle}>
              <input
                type="text"
                inputMode="numeric"
                value={totals.t2}
                onChange={e => update('t2', e.target.value)}
                disabled={locked}
                placeholder="?"
                aria-label={`Total de torcedores do ${data.team2.name}: ${HELP_PER_TOTAL.t2}`}
                aria-invalid={validation.t2 === false}
                style={inputBaseStyle('t2', true)}
              />
            </td>
          </tr>
          {/* Linha Total */}
          <tr style={{ height: ROW_H }}>
            <th scope="row" style={totalRowHeaderStyle}>
              <span
                style={{
                  color: 'var(--color-neutral-white)',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Total
              </span>
            </th>
            <td style={totalRowCellStyle(COL_NUM_W)}>
              <input
                type="text"
                inputMode="numeric"
                value={totals.th}
                onChange={e => update('th', e.target.value)}
                disabled={locked}
                placeholder="?"
                aria-label={`Total de torcedores do sexo masculino: ${HELP_PER_TOTAL.th}`}
                aria-invalid={validation.th === false}
                style={inputBaseStyle('th', true)}
              />
            </td>
            <td style={totalRowCellStyle(COL_NUM_W)}>
              <input
                type="text"
                inputMode="numeric"
                value={totals.tm}
                onChange={e => update('tm', e.target.value)}
                disabled={locked}
                placeholder="?"
                aria-label={`Total de torcedores do sexo feminino: ${HELP_PER_TOTAL.tm}`}
                aria-invalid={validation.tm === false}
                style={inputBaseStyle('tm', true)}
              />
            </td>
            <td style={totalRowColCornerStyle}>
              <input
                type="text"
                inputMode="numeric"
                value={totals.tg}
                onChange={e => update('tg', e.target.value)}
                disabled={locked}
                placeholder="?"
                aria-label={`Total geral de torcedores entrevistados: ${HELP_PER_TOTAL.tg}`}
                aria-invalid={validation.tg === false}
                style={{
                  ...inputBaseStyle('tg', true),
                  fontSize: 'clamp(1.15rem, 2.6vw, 1.5rem)',
                  fontWeight: 900,
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Subcomponente: cabeçalho de linha (escudo + nome) ─────────────
function RowHeaderCell({
  team, shield, maxWidth,
}: {
  team: { name: string; shortName: string; img?: string; sprite?: unknown; primary: string; secondary: string; outline: string; abbr: string; textColor: string; id: string };
  shield: number;
  maxWidth: number;
}) {
  // Layout VERTICAL: escudo em cima, nome do time logo abaixo
  // (na mesma célula da coluna 1).
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: '100%',
        width: '100%',
        padding: '4px 6px',
        boxSizing: 'border-box',
      }}
    >
      <TeamShield team={team as Parameters<typeof TeamShield>[0]['team']} size={shield} />
      <span
        style={{
          color: 'var(--color-neutral-white)',
          fontSize: '0.85rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth,
          textAlign: 'center',
          letterSpacing: '0.01em',
        }}
        title={team.name}
      >
        {team.shortName}
      </span>
    </div>
  );
}

// ── Validação ─────────────────────────────────────────────────────
export function validateTotals(data: Exercise5Data, totals: TotalsState): TotalsValidation {
  const out: TotalsValidation = {};
  const expect: Record<TotalKey, number> = {
    t1: data.t1, t2: data.t2, th: data.th, tm: data.tm, tg: data.tg,
  };
  for (const k of ['t1','t2','th','tm','tg'] as TotalKey[]) {
    const raw = totals[k].trim();
    if (raw === '') {
      out[k] = false;
      continue;
    }
    const n = parseInt(raw, 10);
    out[k] = Number.isInteger(n) && n === expect[k];
  }
  return out;
}

export function allTotalsCorrect(v: TotalsValidation): boolean {
  return v.t1 === true && v.t2 === true && v.th === true && v.tm === true && v.tg === true;
}

export const EMPTY_TOTALS: TotalsState = { t1: '', t2: '', th: '', tm: '', tg: '' };
