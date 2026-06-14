'use client';

/* ═══════════════════════════════════════════════════════════════
   DraggableCalculator — calculadora flutuante arrastável e
   redimensionável, RESTRITA à área de um elemento delimitador
   (geralmente o container da tabela de contingência).

   Operações fiéis ao OVA Roxa: + − ÷ , = AC ⌫ (sem multiplicação).

   Características:
   • Drag pelo header (mouse + touch) — restrito aos bounds
   • Resize pelo canto inferior direito — handle visualmente óbvio
   • Tamanho mínimo 200×260 (cabe entre as 2 primeiras linhas da tabela)
   • Bounds dinâmicos: recalcula getBoundingClientRect a cada
     movimento, robusto a scroll e resize de janela
   • Acessível: alvos ≥44 px, ARIA, atalhos de teclado
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { telemetryRecordAtomicInteraction } from '@/hooks/teaching/probability/useTelemetry';

interface DraggableCalculatorProps {
  open: boolean;
  onClose: () => void;
  /** Elemento que delimita a área onde a calculadora pode se mover/crescer.
   *  Se null/undefined, usa a viewport inteira. */
  boundsRef?: React.RefObject<HTMLElement | null>;
}

const MIN_W = 200;
// Altura mínima alinhada à altura de duas linhas da tabela
// (ROW_H = 92 px × 2 = 184 px), permitindo posicionar a calculadora
// sobre as duas primeiras linhas sem cortar a última linha "Total".
const MIN_H = 184;
const MAX_W = 480;
const MAX_H = 540;

interface Pos { x: number; y: number; }
interface Size { w: number; h: number; }

// Lê os limites atuais (em coordenadas viewport): se houver boundsRef,
// retorna seu rect; senão retorna a viewport.
function readBounds(boundsRef?: React.RefObject<HTMLElement | null>): DOMRect {
  if (boundsRef?.current) return boundsRef.current.getBoundingClientRect();
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

export function DraggableCalculator({ open, onClose, boundsRef }: DraggableCalculatorProps) {
  // ── Estado de cálculo ────────────────────────────────────────
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [justEval, setJustEval] = useState(false);

  // Telemetria — abertura da calculadora vira evento atômico próprio
  // pra registrar QUANDO o aluno recorreu a ela. Útil pra análise de
  // como o aluno usa ferramentas auxiliares.
  useEffect(() => {
    if (!open) return;
    telemetryRecordAtomicInteraction(
      'Calculadora — aberta',
      'Aluno abriu a calculadora auxiliar pra calcular algo no exercício corrente.',
      'abriu calculadora',
    );
  }, [open]);

  // ── Geometria (em coordenadas VIEWPORT — fixed positioning) ──
  const [size, setSize] = useState<Size>({ w: 240, h: 320 });
  const [pos, setPos] = useState<Pos>({ x: 16, y: 100 });
  const [didInit, setDidInit] = useState(false);

  // Posicionamento inicial: ao abrir, posiciona dentro da área delimitada
  useEffect(() => {
    if (!open || didInit) return;
    const b = readBounds(boundsRef);
    const initialW = Math.min(240, b.width - 8);
    const initialH = Math.min(320, b.height - 8);
    setSize({ w: initialW, h: initialH });
    setPos({
      x: Math.max(b.left + 4, b.right - initialW - 4),
      y: Math.max(b.top + 4, b.top + (b.height - initialH) / 2),
    });
    setDidInit(true);
  }, [open, didInit, boundsRef]);

  // Reset do flag de init quando fecha (pra reposicionar ao reabrir)
  useEffect(() => { if (!open) setDidInit(false); }, [open]);

  // ── Estado de interação ──────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ mx: number; my: number; sx: number; sy: number }>({
    mx: 0, my: 0, sx: 0, sy: 0,
  });
  const resizeRef = useRef<{ mx: number; my: number; sw: number; sh: number; sx: number; sy: number }>({
    mx: 0, my: 0, sw: 0, sh: 0, sx: 0, sy: 0,
  });

  // Reposiciona ao redimensionar a janela ou rolagem (mantém dentro dos bounds)
  useEffect(() => {
    function recalcWithinBounds() {
      const b = readBounds(boundsRef);
      setSize(s => ({
        w: Math.max(MIN_W, Math.min(s.w, b.width)),
        h: Math.max(MIN_H, Math.min(s.h, b.height)),
      }));
      setPos(p => {
        const w = Math.max(MIN_W, Math.min(size.w, b.width));
        const h = Math.max(MIN_H, Math.min(size.h, b.height));
        return {
          x: Math.max(b.left, Math.min(b.right - w, p.x)),
          y: Math.max(b.top, Math.min(b.bottom - h, p.y)),
        };
      });
    }
    window.addEventListener('resize', recalcWithinBounds);
    window.addEventListener('scroll', recalcWithinBounds, { passive: true });
    return () => {
      window.removeEventListener('resize', recalcWithinBounds);
      window.removeEventListener('scroll', recalcWithinBounds);
    };
  }, [boundsRef, size.w, size.h]);

  // ── Drag/Resize handlers (Pointer Events — unifica mouse+touch+pen)
  // Antes usávamos mouse* + touch* misturados — funcionava no Chrome mas
  // dava problema em Safari iOS (drag escapava do elemento) e Firefox
  // mobile (race condition entre mouse e touch). Com Pointer Events +
  // setPointerCapture, o navegador roteia TODOS os eventos seguintes da
  // sequência para o elemento alvo, mesmo se o cursor/dedo sair dele. ────
  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      mx: e.clientX, my: e.clientY,
      sx: pos.x, sy: pos.y,
    };
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
    if (e.cancelable) e.preventDefault();
  }, [pos.x, pos.y]);

  const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.mx;
    const dy = e.clientY - dragRef.current.my;
    const b = readBounds(boundsRef);
    const nx = Math.max(b.left, Math.min(b.right - size.w, dragRef.current.sx + dx));
    const ny = Math.max(b.top, Math.min(b.bottom - size.h, dragRef.current.sy + dy));
    setPos({ x: nx, y: ny });
    if (e.cancelable) e.preventDefault();
  }, [dragging, boundsRef, size.w, size.h]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* old browsers */ }
  }, [dragging]);

  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    resizeRef.current = {
      mx: e.clientX, my: e.clientY,
      sw: size.w, sh: size.h,
      sx: pos.x, sy: pos.y,
    };
    setResizing(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  }, [size.w, size.h, pos.x, pos.y]);

  const onResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    const dx = e.clientX - resizeRef.current.mx;
    const dy = e.clientY - resizeRef.current.my;
    const b = readBounds(boundsRef);
    const maxW = b.right - resizeRef.current.sx;
    const maxH = b.bottom - resizeRef.current.sy;
    const newW = Math.max(MIN_W, Math.min(MAX_W, Math.min(maxW, resizeRef.current.sw + dx)));
    const newH = Math.max(MIN_H, Math.min(MAX_H, Math.min(maxH, resizeRef.current.sh + dy)));
    setSize({ w: newW, h: newH });
    if (e.cancelable) e.preventDefault();
  }, [resizing, boundsRef]);

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    setResizing(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* old browsers */ }
  }, [resizing]);

  // ── Lógica de cálculo ────────────────────────────────────────
  const fmt = (n: number): string => {
    if (!isFinite(n)) return 'Erro';
    const s = (Math.round(n * 10000) / 10000).toString();
    return s.replace('.', ',');
  };
  const parseNum = (s: string): number => parseFloat(s.replace(',', '.'));

  const inputDigit = useCallback((d: string) => {
    if (justEval || display === 'Erro') {
      setDisplay(d); setJustEval(false); return;
    }
    setDisplay(display === '0' ? d : display + d);
  }, [display, justEval]);

  const inputDot = useCallback(() => {
    if (justEval || display === 'Erro') {
      setDisplay('0,'); setJustEval(false); return;
    }
    if (!display.includes(',')) setDisplay(display + ',');
  }, [display, justEval]);

  const compute = (a: number, b: number, oper: string): number => {
    switch (oper) {
      case '+': return a + b;
      case '−': return a - b;
      case '÷': return b === 0 ? NaN : a / b;
      default:  return b;
    }
  };

  const setOperator = useCallback((newOp: string) => {
    const cur = parseNum(display);
    if (prev !== null && op !== null && !justEval) {
      const r = compute(prev, cur, op);
      setDisplay(fmt(r));
      setPrev(r);
    } else {
      setPrev(cur);
    }
    setOp(newOp);
    setJustEval(true);
  }, [display, prev, op, justEval]);

  const evaluate = useCallback(() => {
    if (prev === null || op === null) return;
    const cur = parseNum(display);
    const r = compute(prev, cur, op);
    // Telemetria — cada "=" da calculadora cria seu próprio exercício
    // atômico, mostrando a operação completa que o aluno executou.
    telemetryRecordAtomicInteraction(
      'Calculadora — operação',
      `Aluno usou a calculadora pra calcular: ${prev} ${op} ${cur} = ${fmt(r)}`,
      `calculadora: ${prev} ${op} ${cur} = ${fmt(r)}`,
    );
    setDisplay(fmt(r));
    setPrev(null);
    setOp(null);
    setJustEval(true);
  }, [display, prev, op]);

  const clearAll = useCallback(() => {
    setDisplay('0'); setPrev(null); setOp(null); setJustEval(false);
  }, []);

  const backspace = useCallback(() => {
    if (justEval || display === 'Erro' || display.length <= 1) {
      setDisplay('0'); setJustEval(false); return;
    }
    setDisplay(display.slice(0, -1));
  }, [display, justEval]);

  // Atalhos de teclado — só ativos quando o foco NÃO está num input do exercício.
  // Sem essa guarda, digitar num <input> da tabela duplicava a tecla na calculadora
  // (o listener global capturava antes do input). Esc continua fechando em qualquer
  // foco — é convencional para modal/overlay.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const k = e.key;
      if (k === 'Escape') { onClose(); return; }
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' ||
        (active?.isContentEditable ?? false);
      if (isEditable) return;
      if (k >= '0' && k <= '9') { inputDigit(k); return; }
      if (k === '.' || k === ',') { inputDot(); return; }
      if (k === '+') { setOperator('+'); return; }
      if (k === '-') { setOperator('−'); return; }
      if (k === '/') { setOperator('÷'); return; }
      if (k === 'Enter' || k === '=') { e.preventDefault(); evaluate(); return; }
      if (k === 'Backspace') { backspace(); return; }
      if (k === 'Delete' || k.toLowerCase() === 'c') { clearAll(); return; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, inputDigit, inputDot, setOperator, evaluate, backspace, clearAll, onClose]);

  if (!open) return null;

  // ── Estilos ──────────────────────────────────────────────────
  // zIndex: 90 — ABAIXO dos alerts (z-97) e do header sticky (z-99),
  // mas acima do conteúdo geral da página. Antes era 1000 (acima de
  // tudo), o que fazia a calculadora cobrir os alerts de feedback —
  // o aluno não enxergava o resultado de cada Conferir. Trade-off:
  // se o aluno arrastar a calc pra cima do header sticky, o header
  // a cobre — comportamento aceitável já que a posição padrão dela
  // é y=100 (abaixo dos 68px do header).
  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    width: size.w,
    height: size.h,
    minWidth: MIN_W,
    minHeight: MIN_H,
    zIndex: 90,
    background: 'var(--color-neutral-white)',
    border: '2px solid var(--color-brand-otimath-darker)',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'inherit',
    userSelect: dragging || resizing ? 'none' : 'auto',
  };

  // Tamanhos proporcionais à altura atual da calculadora — garantem
  // que números/operadores permaneçam legíveis em qualquer tamanho.
  // Ajustes empíricos para cobrir 184 px (mín) até 540 px (máx).
  // No mínimo (184): header=22, display=24, sobram ~135 px → 5 linhas × 27 px.
  const headerH = Math.max(22, Math.min(40, Math.round(size.h * 0.10)));
  const displayH = Math.max(24, Math.min(56, Math.round(size.h * 0.13)));
  const displayFontPx = Math.max(13, Math.min(28, Math.round(size.h * 0.075)));
  const buttonFontPx = Math.max(10, Math.min(20, Math.round(size.h * 0.06)));

  const headerStyle: React.CSSProperties = {
    background: 'var(--color-brand-otimath-darker)',
    color: 'var(--color-neutral-white)',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    height: headerH,
    flexShrink: 0,
    borderBottom: '2px solid var(--color-brand-otimath-darkest)',
  };

  const displayStyle: React.CSSProperties = {
    background: 'var(--color-neutral-darkest)',
    color: '#22ff88',
    fontFamily: '"Courier New", monospace',
    fontSize: displayFontPx,
    lineHeight: 1,
    fontWeight: 700,
    padding: '4px 10px',
    textAlign: 'right',
    height: displayH,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const gridStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    // Distribui as 5 linhas de botões igualmente na altura disponível,
    // garantindo que NENHUMA linha seja cortada quando a calculadora
    // está no tamanho mínimo (184 px de altura).
    gridTemplateRows: 'repeat(5, 1fr)',
    gap: 2,
    padding: 3,
    background: 'var(--color-brand-otimath-lightest)',
    overflow: 'hidden',
  };

  const buttonBase: React.CSSProperties = {
    minHeight: 0,
    minWidth: 0,
    border: '1px solid var(--color-neutral-light)',
    borderRadius: 6,
    background: 'var(--color-neutral-white)',
    color: 'var(--color-neutral-darkest)',
    fontFamily: '"Arial Black", Impact, sans-serif',
    fontSize: buttonFontPx,
    lineHeight: 1,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'transform 60ms ease, background 120ms ease',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08)',
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const opButton: React.CSSProperties = {
    ...buttonBase,
    background: 'var(--color-brand-otimath-pure)',
    color: 'var(--color-neutral-white)',
  };
  const fnButton: React.CSSProperties = {
    ...buttonBase,
    background: 'var(--color-feedback-warning-lighter, #fff8e1)',
    color: 'var(--color-feedback-warning-darkest, #6d4c00)',
  };
  const eqButton: React.CSSProperties = {
    ...buttonBase,
    background: 'var(--color-feedback-success-dark)',
    color: 'var(--color-neutral-white)',
    gridRow: 'span 2',
  };

  return (
    <div
      role="dialog"
      aria-label="Calculadora flutuante. Arraste pelo cabeçalho para mover, redimensione pelo canto inferior direito."
      style={wrapperStyle}
    >
      <div
        style={headerStyle}
        onPointerDown={startDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Barra de arrastar"
      >
        <span
          aria-hidden="true"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}
        >
          <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>⋮⋮</span>
          🧮 CALCULADORA
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar calculadora"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'var(--color-neutral-white)',
            // 36×36 atende ao mínimo WCAG 2.5.5 (AA: 24px, AAA: 44px).
            // Antes (26px) era difícil de tocar no mobile.
            width: 36, height: 36, minWidth: 36,
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1,
            padding: 0,
            // Impede que o pointerdown do header capture o evento de clique.
            touchAction: 'manipulation',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >✕</button>
      </div>

      <div style={displayStyle} aria-live="polite" aria-atomic="true">{display}</div>

      <div style={gridStyle}>
        {/* Layout fiel ao OVA Roxa: + − ÷ apenas */}
        <button type="button" style={fnButton} onClick={clearAll}>AC</button>
        <button type="button" style={fnButton} onClick={backspace} aria-label="Apagar">⌫</button>
        <button type="button" style={{ ...buttonBase, opacity: 0.3, cursor: 'not-allowed' }} disabled aria-hidden="true"> </button>
        <button type="button" style={opButton} onClick={() => setOperator('÷')} aria-label="Dividir">÷</button>

        <button type="button" style={buttonBase} onClick={() => inputDigit('7')}>7</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('8')}>8</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('9')}>9</button>
        <button type="button" style={opButton} onClick={() => setOperator('−')} aria-label="Subtrair">−</button>

        <button type="button" style={buttonBase} onClick={() => inputDigit('4')}>4</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('5')}>5</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('6')}>6</button>
        <button type="button" style={opButton} onClick={() => setOperator('+')} aria-label="Somar">+</button>

        <button type="button" style={buttonBase} onClick={() => inputDigit('1')}>1</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('2')}>2</button>
        <button type="button" style={buttonBase} onClick={() => inputDigit('3')}>3</button>
        <button type="button" style={eqButton} onClick={evaluate} aria-label="Igual">=</button>

        <button type="button" style={{ ...buttonBase, gridColumn: 'span 2' }} onClick={() => inputDigit('0')}>0</button>
        <button type="button" style={buttonBase} onClick={inputDot} aria-label="Vírgula decimal">,</button>
      </div>

      {/* Handle de redimensionamento ↘ — apenas a metade triangular
          inferior-direita, com tracinhos visíveis (padrão clássico UX). */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Redimensionar calculadora. Arraste para alterar o tamanho."
        aria-valuemin={MIN_W}
        aria-valuemax={MAX_W}
        aria-valuenow={size.w}
        title="Arraste para redimensionar"
        onPointerDown={startResize}
        onPointerMove={onResizeMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          // Alvo de toque maior (32×32) — 22px era pequeno demais para dedo no mobile.
          width: 32,
          height: 32,
          cursor: 'nwse-resize',
          touchAction: 'none',
          zIndex: 5,
          // Recorte triangular: mantém apenas a metade inferior-direita.
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          background: 'var(--color-brand-otimath-pure)',
        }}
      >
        <svg
          width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"
          className="block"
        >
          {/* 3 tracinhos diagonais paralelos sobre a metade triangular */}
          <path d="M22 6 L6 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 12 L12 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 18 L18 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/** Botão INLINE para abrir a calculadora — fica próximo à tabela.
 *  Não usa position:fixed; é colocado no fluxo do documento pelo
 *  componente pai (geralmente acima ou abaixo da tabela). */
export function CalculatorToggleButton({
  open, onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  if (open) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Abrir calculadora"
      title="Abrir calculadora (Esc fecha quando aberta)"
      style={{
        minHeight: 44,
        borderRadius: 8,
        background: 'var(--color-brand-otimath-pure)',
        color: 'var(--color-neutral-white)',
        border: '2px solid var(--color-brand-otimath-darkest)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.2rem', lineHeight: 1 }}>🧮</span>
      <span>Calculadora</span>
    </button>
  );
}
