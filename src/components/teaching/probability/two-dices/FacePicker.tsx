'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   FacePicker — componente reutilizável de seleção de face de dado
   ─────────────────────────────────────────────────────────────────
   Extraído de DiceMachineExperiment (Cena 6) para reuso em Cena 7
   (TwoDicesExperiment). Preserva o gesto já instrumentalizado pelo
   aluno: toque num dado → popover 2×3 (verde) ou 3×2 (azul) →
   escolhe a face → fecha.

   Coerência com gênese instrumental (TROUCHE 2004): ao reutilizar
   o mesmo instrumento em cena nova, o aluno economiza carga
   cognitiva de reaprendizagem.

   Best practices aplicadas:
   - WCAG 2.1 AA: aria-haspopup/expanded/activedescendant, navegação
     por teclado (setas/Home/End/Esc), focus-visible, alvos ≥ 56px.
   - prefers-reduced-motion respeitado no placeholder animado.
   - SSR-safe: guarda typeof window antes de matchMedia.
   - Posicionamento inteligente do popover (acima se overflow inferior).
   - Click-fora fecha. ESC fecha e devolve foco ao placeholder.
   ═══════════════════════════════════════════════════════════════ */

// ─── Constantes de design ─────────────────────────────────────────
const PICKER_PLACEHOLDER_SIZE = 64;
const PICKER_CELL_SIZE = 56;
const PLACEHOLDER_CYCLE_MS = 280;
const COLOR_GREEN_DICE = '#1a5c2e';

// ─── Pip patterns ─────────────────────────────────────────────────
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [0, 0, 1, 0, 0, 0, 1, 0, 0],
  3: [0, 0, 1, 0, 1, 0, 1, 0, 0],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

export type DieColor = 'blue' | 'green';

// ─── DiceFaceIcon (versão do picker, com ariaHidden opcional) ────
function PickerDiceFaceIcon({
  face,
  size,
  color = 'blue',
  ariaHidden = false,
}: {
  face: number;
  size: number;
  color?: DieColor;
  ariaHidden?: boolean;
}) {
  const pips = PIP_PATTERNS[face] ?? PIP_PATTERNS[1];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? COLOR_GREEN_DICE : 'var(--color-brand-otimath-dark)';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size * 0.16),
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.floor(size * 0.14),
        gap,
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : `Face ${face} do dado ${color === 'green' ? 'verde' : 'azul'}`}
      role={ariaHidden ? undefined : 'img'}
    >
      {pips.map((pip, i) => (
        <div key={i} className="flex items-center justify-center">
          {pip ? (
            <div
              style={{
                width: pipSize,
                height: pipSize,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ─── Placeholder animado ──────────────────────────────────────────
function AnimatedFacePlaceholder({ size, color }: { size: number; color: DieColor }) {
  const [face, setFace] = useState(1);

  useEffect(() => {
    // Respeita prefers-reduced-motion (WCAG 2.3.3)
    const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq?.matches) return;
    const id = setInterval(() => setFace(f => (f % 6) + 1), PLACEHOLDER_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return <PickerDiceFaceIcon face={face} size={size} color={color} ariaHidden />;
}

// ─── FacePicker propriamente dito ─────────────────────────────────
export interface FacePickerProps {
  color: DieColor;
  selected: number | null;
  onPick: (face: number) => void;
  errorState: boolean;
  size?: number;
}

export function FacePicker({
  color,
  selected,
  onPick,
  errorState,
  size = PICKER_PLACEHOLDER_SIZE,
}: FacePickerProps) {
  const [open, setOpen] = useState(false);
  // Coordenadas absolutas do popover em viewport (position: fixed). Calculadas
  // a partir do bounding rect do placeholder. Usar `position: fixed` em vez de
  // `absolute` desacopla TOTALMENTE o popover do layout flow dos ancestrais —
  // não pode mais causar overflow horizontal no doc nem afetar seções vizinhas,
  // como acontecia com `absolute` em alguns navegadores quando o popover
  // transbordava o containing block.
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const faceBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const gridCols = color === 'green' ? 2 : 3;
  const cellSize = PICKER_CELL_SIZE;

  // Click fora fecha
  useEffect(() => {
    if (!open) return;
    // pointerdown unifica mouse+touch+pen e evita race conditions entre
    // os dois handlers em Firefox mobile e Safari iOS.
    const handler = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)
          && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handler);
    };
  }, [open]);

  // Posicionamento via getBoundingClientRect → coords absolutas em viewport.
  // useLayoutEffect roda síncrono ANTES do paint, então o popover já renderiza
  // na posição final sem flicker. Calcula vertical (preferindo abaixo, flip
  // pra cima se faltar espaço) e horizontal (clamp pra viewport com margem).
  useLayoutEffect(() => {
    if (!open || !placeholderBtnRef.current) return;
    const updatePos = () => {
      if (!placeholderBtnRef.current) return;
      const rect = placeholderBtnRef.current.getBoundingClientRect();
      const popoverWidth = gridCols * cellSize + (gridCols - 1) * 8 + 24;
      const popoverHeight = Math.ceil(6 / gridCols) * (cellSize + 8) + 24;
      const margin = 8;

      // Horizontal: centra no botão, clamp dentro da viewport
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      if (left < margin) left = margin;
      if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - margin - popoverWidth;
      }

      // Vertical: preferir abaixo, flip pra cima se não couber
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const top = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove
        ? rect.bottom + 8
        : rect.top - popoverHeight - 8;

      setPopPos({ left, top });
    };
    updatePos();
    // Reposiciona se a viewport ou o scroll mudarem enquanto o popover está aberto
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, gridCols, cellSize]);

  // Foco automático.
  // IMPORTANTE: `focus({ preventScroll: true })` evita o auto-scroll padrão do
  // browser ao focar um elemento — sem isso, em mobile/desktop o documento
  // rolava horizontalmente OU verticalmente pra trazer o popover pra dentro
  // da viewport, deslocando seções vizinhas (créditos abaixo, etc.). Como o
  // clamp horizontal (popOffsetX) e o flip vertical (popPlacement) já
  // posicionam o popover dentro da viewport, NÃO precisamos do scrollIntoView.
  useEffect(() => {
    if (!open) return;
    const initialIdx = selected ? selected - 1 : 0;
    setFocusIdx(initialIdx);
    requestAnimationFrame(() => {
      faceBtnRefs.current[initialIdx]?.focus({ preventScroll: true });
    });
  }, [open, selected]);

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        placeholderBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Navegação por setas
  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    const total = 6;
    let next = focusIdx;
    if (e.key === 'ArrowRight') next = (focusIdx + 1) % total;
    else if (e.key === 'ArrowLeft') next = (focusIdx - 1 + total) % total;
    else if (e.key === 'ArrowDown') next = (focusIdx + gridCols) % total;
    else if (e.key === 'ArrowUp') next = (focusIdx - gridCols + total) % total;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = total - 1;
    else return;
    e.preventDefault();
    setFocusIdx(next);
    faceBtnRefs.current[next]?.focus();
  };

  const colorName = color === 'green' ? 'verde' : 'azul';
  const accentColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-pure)';
  const borderColor = errorState
    ? 'var(--color-feedback-error-dark)'
    : selected
      ? accentColor
      : 'var(--color-neutral-light)';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={placeholderBtnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          selected
            ? `Dado ${colorName} selecionado: face ${selected}. Toque para alterar.`
            : `Escolher face do dado ${colorName}`
        }
        style={{
          background: 'transparent',
          border: `3px solid ${borderColor}`,
          borderRadius: 14,
          padding: 6,
          cursor: 'pointer',
          touchAction: 'manipulation',
          display: 'inline-block',
          minWidth: 56,
          minHeight: 56,
          transition: 'border-color 0.2s, transform 0.1s, box-shadow 0.2s',
        }}
        onTouchStart={e => {
          e.currentTarget.style.transform = 'scale(0.96)';
        }}
        onTouchEnd={e => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onFocus={e => {
          e.currentTarget.style.boxShadow = `0 0 0 4px ${accentColor}55`;
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {selected ? (
          <PickerDiceFaceIcon face={selected} size={size} color={color} ariaHidden />
        ) : (
          <AnimatedFacePlaceholder size={size} color={color} />
        )}
      </button>

      {open && popPos && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={`Faces do dado ${colorName}`}
          aria-activedescendant={`face-${color}-${focusIdx + 1}`}
          onKeyDown={handleGridKeyDown}
          style={{
            position: 'fixed',
            left: popPos.left,
            top: popPos.top,
            background: 'var(--color-neutral-white)',
            border: `2px solid ${accentColor}`,
            borderRadius: 14,
            padding: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
            gap: 8,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((face, idx) => (
            <button
              key={face}
              id={`face-${color}-${face}`}
              ref={el => { faceBtnRefs.current[idx] = el; }}
              type="button"
              role="option"
              tabIndex={focusIdx === idx ? 0 : -1}
              aria-selected={selected === face}
              aria-label={`Face ${face} do dado ${colorName}`}
              onClick={() => {
                onPick(face);
                setOpen(false);
                placeholderBtnRef.current?.focus();
              }}
              style={{
                width: cellSize,
                height: cellSize,
                padding: 0,
                background: 'transparent',
                border:
                  selected === face
                    ? `3px solid ${accentColor}`
                    : '2px solid var(--color-neutral-lighter)',
                borderRadius: 10,
                cursor: 'pointer',
                touchAction: 'manipulation',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onFocus={e => {
                e.currentTarget.style.outline = `3px solid ${accentColor}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={e => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <PickerDiceFaceIcon face={face} size={cellSize - 14} color={color} ariaHidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
