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
     • Botões com transição, hover e focus ring (a11y)
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
    const n = Number.parseInt(t, 10);
    if (Number.isNaN(n)) return NaN;
    result += n;
  }
  return result;
}

// Classe base para todas as teclas do teclado da calculadora.
// Mantém uma única fonte de verdade para padding, borda, cursor,
// transição e focus ring — evitando duplicar o style inline em cada
// botão (anti-padrão anterior). Botões de operação herdam essa base
// e sobrescrevem cor/fundo via `KEY_OP_CLASSES`.
const KEY_BASE_CLASSES =
  'px-micro py-quarck rounded-sm border-hairline cursor-pointer text-base font-bold min-w-[40px] ' +
  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const KEY_DIGIT_CLASSES =
  KEY_BASE_CLASSES + ' border-neutral-lighter bg-neutral-white text-neutral-darkest hover:bg-neutral-lightest';

const KEY_OP_CLASSES =
  KEY_BASE_CLASSES + ' border-brand-otimath-light bg-brand-otimath-lightest text-brand-otimath-dark hover:bg-brand-otimath-lighter';

const KEY_CLEAR_CLASSES =
  KEY_BASE_CLASSES + ' border-neutral-lighter bg-neutral-white text-feedback-error-dark hover:bg-feedback-error-lightest';

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

  return (
    <div
      className="my-micro mx-auto rounded-md bg-neutral-lightest border-thin border-neutral-lighter p-micro max-w-[280px]"
      role="region"
      aria-label="Calculadora de adição e subtração"
    >
      <div className="flex justify-between items-center mb-micro">
        <span className="ds-caption-bold text-brand-otimath-dark">
          🧮 Calculadora
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar calculadora"
          className="bg-transparent border-none cursor-pointer text-neutral-dark px-quarck text-md hover:text-brand-otimath-pure focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure rounded-sm transition-colors duration-200"
        >
          ×
        </button>
      </div>

      {/* Display — usa `font-mono` para alinhamento de dígitos e
          `aria-live="polite"` para que leitores de tela anunciem o
          resultado quando o aluno aperta "=". */}
      <div
        aria-live="polite"
        className="bg-neutral-white border-hairline border-neutral-lighter rounded-sm px-micro py-quarck min-h-[54px] text-right mb-quarck font-mono"
      >
        <div className="text-neutral-dark text-sm break-words">
          {expression || '0'}
        </div>
        {result !== null && (
          <div className="text-brand-otimath-dark text-base font-bold">
            = {result}
          </div>
        )}
      </div>

      {/* Teclado — grid 4 colunas. Botões usam classes derivadas
          (KEY_DIGIT_CLASSES / KEY_OP_CLASSES / KEY_CLEAR_CLASSES)
          em vez de objetos de style inline. */}
      <div className="grid grid-cols-4 gap-quarck">
        <button type="button" onClick={clearAll} className={KEY_CLEAR_CLASSES} aria-label="Limpar">C</button>
        <button type="button" onClick={backspace} className={KEY_DIGIT_CLASSES} aria-label="Apagar último dígito">⌫</button>
        <button type="button" onClick={() => append('-')} className={KEY_OP_CLASSES} aria-label="Subtração">−</button>
        <button type="button" onClick={() => append('+')} className={KEY_OP_CLASSES} aria-label="Adição">+</button>

        {['7', '8', '9'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} className={KEY_DIGIT_CLASSES} aria-label={d}>{d}</button>
        ))}
        <button type="button" onClick={calculate} className={`${KEY_OP_CLASSES} row-span-3`} aria-label="Igual">=</button>

        {['4', '5', '6'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} className={KEY_DIGIT_CLASSES} aria-label={d}>{d}</button>
        ))}

        {['1', '2', '3'].map(d => (
          <button type="button" key={d} onClick={() => append(d)} className={KEY_DIGIT_CLASSES} aria-label={d}>{d}</button>
        ))}

        <button type="button" onClick={() => append('0')} className={`${KEY_DIGIT_CLASSES} col-span-3`} aria-label="0">0</button>
      </div>
    </div>
  );
}
