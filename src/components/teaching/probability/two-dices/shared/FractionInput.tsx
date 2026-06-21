'use client';

/* ═══════════════════════════════════════════════════════════════
   FractionInput e FracH — componentes de cálculo de fração.

     - FractionInput: dois campos numéricos com barra horizontal (entrada)
     - FracH: fração estilizada com barra horizontal (exibição)

   Validação externa via isEquivalentFraction (em eventPair.ts) — aceita
   qualquer fração matematicamente equivalente (R14).
   ═══════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import { telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';

export interface FractionInputProps {
  num: string;
  den: string;
  setNum: (v: string) => void;
  setDen: (v: string) => void;
  error: boolean;
  onEnter?: () => void;
  disabled?: boolean;
  /** Rótulo curto do que a fração representa (ex.: "P(A)", "P(A∩B)").
   *  Usado na telemetria pra contextualizar a entrada — sem isso,
   *  o JSON só mostraria "digitou X/Y" sem âncora. Opcional pra não
   *  quebrar callsites antigos; quando ausente, cai pra "fração". */
  telemetryLabel?: string;
}

export function FractionInput({ num, den, setNum, setDen, error, onEnter, disabled, telemetryLabel }: FractionInputProps) {
  const border = error ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)';

  // Telemetria — captura num/den DEPOIS de 600ms estável, evitando spam
  // de eventos por keystroke. Skip initial mount (sentinel null).
  //
  // GUARD ANTI-RESTORE-F5: se a mudança acontece nos primeiros 1500ms
  // após o mount, supressa o emit. Isso cobre o cenário do F5: o pai
  // monta o FractionInput com valor default ('') e DEPOIS aplica o
  // restoreSnapshot (setNum('36')); o useEffect interpretaria isso
  // como "aluno digitou" e geraria telemetria fantasma. Aluno real
  // demora > 1.5s pra digitar algo após chegar na tela.
  const prevRef = useRef<{ n: string; d: string } | null>(null);
  const mountTimeRef = useRef<number>(0);
  useEffect(() => {
    mountTimeRef.current = performance.now();
  }, []);
  useEffect(() => {
    const cur = { n: num, d: den };
    const prev = prevRef.current;
    if (prev === null) { prevRef.current = cur; return; }
    if (prev.n === cur.n && prev.d === cur.d) return;
    prevRef.current = cur;
    if (performance.now() - mountTimeRef.current < 1500) return;
    const handle = window.setTimeout(() => {
      const label = telemetryLabel || 'fração';
      const changed: string[] = [];
      if (prev.n !== cur.n) changed.push(`numerador "${prev.n || '_'}" → "${cur.n || '_'}"`);
      if (prev.d !== cur.d) changed.push(`denominador "${prev.d || '_'}" → "${cur.d || '_'}"`);
      telemetryRecordInteracaoExercicio(
        `${label}: ${changed.join(', ')} (estado atual: ${cur.n || '_'}/${cur.d || '_'})`
      );
    }, 600);
    return () => window.clearTimeout(handle);
  }, [num, den, telemetryLabel]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px' }}>
      <input
        type="number" inputMode="numeric" value={num}
        onChange={e => setNum(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter && !disabled) onEnter(); }}
        placeholder="?" aria-label="Numerador"
        aria-invalid={error}
        disabled={disabled}
        style={{
          border: `2px solid ${border}`, borderRadius: 6, padding: '4px',
          width: 56, textAlign: 'center', outline: 'none', fontWeight: 700,
          background: disabled ? 'var(--color-neutral-lightest)' : undefined,
          color: disabled ? 'var(--color-neutral-dark)' : undefined,
        }}
      />
      <hr aria-hidden="true" style={{ width: '100%', height: 2, background: 'var(--color-neutral-black)', border: 'none', margin: '3px 0' }} />
      <input
        type="number" inputMode="numeric" value={den}
        onChange={e => setDen(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter && !disabled) onEnter(); }}
        placeholder="?" aria-label="Denominador"
        aria-invalid={error}
        disabled={disabled}
        style={{
          border: `2px solid ${border}`, borderRadius: 6, padding: '4px',
          width: 56, textAlign: 'center', outline: 'none', fontWeight: 700,
          background: disabled ? 'var(--color-neutral-lightest)' : undefined,
          color: disabled ? 'var(--color-neutral-dark)' : undefined,
        }}
      />
    </div>
  );
}

// ─── FracH ──────────────────────────────────────────────────────

export function FracH({
  top, bottom, color, size = '1.05rem',
}: { top: React.ReactNode; bottom: React.ReactNode; color?: string; size?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.1,
        margin: '0 3px',
        color,
      }}
    >
      <span style={{ paddingBottom: 1 }}>{top}</span>
      <span
        style={{
          display: 'block',
          width: '100%',
          minWidth: 32,
          borderTop: `2px solid ${color ?? 'var(--color-neutral-darkest)'}`,
        }}
      />
      <span style={{ paddingTop: 1 }}>{bottom}</span>
    </span>
  );
}

// ─── Formatadores de tripla representação (fração/decimal/%) ────

export function formatDecimal(num: number, den: number, digits = 3): string {
  if (den === 0) return '—';
  const v = num / den;
  return v.toFixed(digits).replace('.', ',');
}

export function formatPercent(num: number, den: number, digits = 1): string {
  if (den === 0) return '—';
  const v = (num / den) * 100;
  return `${v.toFixed(digits).replace('.', ',')}%`;
}

export function simplifyFraction(num: number, den: number): { n: number; d: number } {
  if (den === 0) return { n: num, d: den };
  const a = Math.abs(num), b = Math.abs(den);
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(a, b);
  return { n: num / g, d: den / g };
}
