'use client';

/* ═══════════════════════════════════════════════════════════════
   SimpleCalculator — calculadora com adição e subtração apenas.

   Projetada para auxiliar o aluno em exercícios com números grandes
   (Ex4 trabalha com S, b, d, c da ordem de 80-120).

   Design:
     • Operações: apenas + e −
     • Display mostra expressão + resultado quando calculado
     • Avaliação por parser manual (nunca eval — segurança)
     • Colapsável via botão toggle
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { Button } from '@/components/global/Button';

/** Avalia uma expressão contendo apenas inteiros, + e −.
 *  Não usa eval — parser manual para segurança.
 *  Retorna NaN se a expressão for inválida. */
function safeEvaluate(expr: string): number {
  const clean = expr.replace(/\s+/g, '');
  if (!clean) return NaN;
  // Tokens alternando números e operadores. Suporta sinal inicial (ex.: "-5+3").
  const tokens = clean.match(/^-?\d+|[+-]\d+/g);
  if (!tokens) return NaN;
  let result = 0;
  for (const t of tokens) {
    const n = parseInt(t, 10);
    if (Number.isNaN(n)) return NaN;
    result += n;
  }
  return result;
}

export function SimpleCalculator() {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const append = (c: string) => {
    // Evita operadores duplicados consecutivos (troca o último)
    const isOp = (ch: string) => ch === '+' || ch === '-';
    if (isOp(c) && expression.length > 0 && isOp(expression[expression.length - 1])) {
      setExpression(expression.slice(0, -1) + c);
    } else {
      setExpression(expression + c);
    }
    setResult(null);
  };

  const clearAll = () => {
    setExpression('');
    setResult(null);
  };

  const backspace = () => {
    setExpression(expression.slice(0, -1));
    setResult(null);
  };

  const calculate = () => {
    const r = safeEvaluate(expression);
    setResult(Number.isNaN(r) ? null : r);
  };

  if (!open) {
    return (
      <div className="flex justify-center my-micro">
        <Button style="secondary" size="small" onClick={() => setOpen(true)}>
          🧮 Abrir calculadora
        </Button>
      </div>
    );
  }

  const keyBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-neutral-lighter)',
    background: 'var(--color-neutral-white)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--color-neutral-darkest)',
    minWidth: 40,
  };
  const opBtnStyle: React.CSSProperties = {
    ...keyBtnStyle,
    background: 'var(--color-brand-otimath-lightest)',
    color: 'var(--color-brand-otimath-dark)',
    border: '1px solid var(--color-brand-otimath-light)',
  };

  return (
    <div
      className="my-micro mx-auto rounded-md"
      style={{
        background: 'var(--color-neutral-lightest)',
        border: '2px solid var(--color-neutral-lighter)',
        padding: 12,
        maxWidth: 280,
      }}
      role="region"
      aria-label="Calculadora de adição e subtração"
    >
      <div className="flex justify-between items-center mb-micro">
        <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-dark)' }}>
          🧮 Calculadora
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar calculadora"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--color-neutral-dark)', fontSize: '1.2rem', padding: '0 6px',
          }}
        >
          ×
        </button>
      </div>

      {/* Display */}
      <div
        aria-live="polite"
        style={{
          background: 'var(--color-neutral-white)',
          border: '1px solid var(--color-neutral-lighter)',
          borderRadius: 6,
          padding: '8px 10px',
          minHeight: 54,
          textAlign: 'right',
          marginBottom: 8,
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{ color: 'var(--color-neutral-dark)', fontSize: '0.9rem', wordWrap: 'break-word' }}
        >
          {expression || '0'}
        </div>
        {result !== null && (
          <div
            style={{
              color: 'var(--color-brand-otimath-dark)',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            = {result}
          </div>
        )}
      </div>

      {/* Teclado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        <button type="button" onClick={clearAll} style={{ ...keyBtnStyle, color: 'var(--color-feedback-error-dark)' }} aria-label="Limpar">C</button>
        <button type="button" onClick={backspace} style={keyBtnStyle} aria-label="Apagar último dígito">⌫</button>
        <button type="button" onClick={() => append('-')} style={opBtnStyle} aria-label="Subtração">−</button>
        <button type="button" onClick={() => append('+')} style={opBtnStyle} aria-label="Adição">+</button>

        {['7', '8', '9'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} style={keyBtnStyle} aria-label={d}>{d}</button>
        ))}
        <button type="button" onClick={calculate} style={{ ...opBtnStyle, gridRow: 'span 3' }} aria-label="Igual">=</button>

        {['4', '5', '6'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} style={keyBtnStyle} aria-label={d}>{d}</button>
        ))}

        {['1', '2', '3'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} style={keyBtnStyle} aria-label={d}>{d}</button>
        ))}

        <button type="button" onClick={() => append('0')} style={{ ...keyBtnStyle, gridColumn: 'span 3' }} aria-label="0">0</button>
      </div>
    </div>
  );
}
