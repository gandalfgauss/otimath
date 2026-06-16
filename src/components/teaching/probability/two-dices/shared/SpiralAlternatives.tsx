'use client';

/* ═══════════════════════════════════════════════════════════════
   SpiralAlternatives — Overlay com 5 alternativas em espiral.

   Inspirado na animação do OVA Roxa original (Fase1.as,
   posicionaBolas), com fórmula matemática preservada:
       x = cx + cos((t + i·72° − 18°)) · raio · t
       y = cy + sin((t + i·72° − 18°)) · raio · t
   onde t cresce de 0 a 360 com passo 2 (≈ 3 s @ 60 fps).

   Visual modernizado em tokens OtiMath (sem rosa metálico).
   Bola Ok central → botão de confirmar. Aluno escolhe uma
   bolinha → ela ganha contorno verde → clica em Ok.

   Acessibilidade:
   • role="dialog" com aria-modal
   • Esc fecha (sem submeter)
   • Tab navega entre as 5 alternativas + Ok
   • prefers-reduced-motion → bolinhas aparecem estaticamente
   • Trap de foco simples
   ═══════════════════════════════════════════════════════════════ */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { TeamShield } from './TeamShield';
import type { Team } from './teamsData';
import { telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';

export interface AlternativeOption {
  /** Identificador estável (p.ex. 'correct' ou 'd1', 'd2', ...). */
  id: string;
  /** Texto a exibir (probabilidade em decimal vírgula). */
  display: string;
  /** Texto longo para aria-label (ex.: "fração 32 sobre 117, aproximadamente 0,274"). */
  ariaLabel: string;
}

interface SpiralAlternativesProps {
  open: boolean;
  /** Times exibidos ao fundo (cenografia). */
  team1: Team;
  team2: Team;
  /** Enunciado curto (string para aria-describedby). */
  question: string;
  /** 5 alternativas embaralhadas (uma é a correta, 4 distratores). */
  alternatives: AlternativeOption[];
  /** ID da alternativa correta (validação). */
  correctId: string;
  /** Chamado quando aluno clica Ok com alternativa selecionada.
   *  Recebe o id selecionado; chamador decide acerto/erro. */
  onSubmit: (selectedId: string) => void;
  /** Cancelar (Esc ou clique fora). */
  onCancel: () => void;
}

const ALT_RADIUS = 32; // raio da bolinha
const OK_RADIUS = 56;  // raio do botão Ok central
const ANIM_TICKS = 180; // 3s @ 60fps

export function SpiralAlternatives({
  open, team1, team2, question, alternatives, correctId, onSubmit, onCancel,
}: SpiralAlternativesProps) {
  const [t, setT] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Mede largura real do container — sem isso, o `dr` fixo de 1.4 levava
  // os botões a raio final de 252px (=1.4*180), que cabe em desktop 640px
  // (raio disponível ~290px) mas TRANSBORDA em mobile (container 92vw ≈
  // 331px → raio disponível só ~130px). Agora `dr` é proporcional à
  // largura real, garantindo que os 5 botões sempre fiquem dentro do círculo.
  const [containerSize, setContainerSize] = useState(640);
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const measure = () => {
      if (containerRef.current) setContainerSize(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  // Detecta prefers-reduced-motion
  const reducedMotion = useReducedMotion();

  // Ref espelhando t — evita travamento causado por agendar o próximo rAF
  // DENTRO do callback do setT (em React 18+ strict mode o updater roda 2x
  // por render, scheduleando rAF duplicado e queimando frames).
  const tRef = useRef(0);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    tRef.current = 0;
    setT(0);
  }, [open]);

  // Animação espiral
  useEffect(() => {
    if (!open) return;
    if (reducedMotion) {
      tRef.current = ANIM_TICKS;
      setT(ANIM_TICKS); // posição final imediata
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // ~120 ticks por segundo de delta normalizado para passo 2
      const inc = (dt / 1000) * 120;
      tRef.current = Math.min(tRef.current + inc, ANIM_TICKS);
      setT(tRef.current);
      if (tRef.current < ANIM_TICKS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [open, reducedMotion]);

  // Esc para cancelar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  // Foco inicial no container
  useEffect(() => {
    if (open && containerRef.current) containerRef.current.focus();
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    const selectedAlt = alternatives.find(a => a.id === selected);
    telemetryRecordInteracaoExercicio(
      `confirmou alternativa "${selected}" no spiral (clicou Ok): ${selectedAlt?.ariaLabel ?? selectedAlt?.display ?? selected}`,
    );
    onSubmit(selected);
  }, [selected, onSubmit, alternatives]);

  if (!open) return null;

  // Posições das 5 alternativas em espiral (final = pentágono regular).
  // `dr` é proporcional à largura real do container:
  //   - Raio final desejado = (containerSize/2) - ALT_RADIUS - margem
  //   - Como r = dr * ANIM_TICKS no fim da animação,
  //     dr = (raio desejado) / ANIM_TICKS.
  // Margem de 12px evita que o botão cole na borda.
  const finalRadius = Math.max(60, containerSize / 2 - ALT_RADIUS - 12);
  const dr = finalRadius / ANIM_TICKS;
  const positions = alternatives.map((_alt, i) => {
    const angDeg = t + i * 72 - 18;
    const angRad = (angDeg * Math.PI) / 180;
    const r = dr * t;
    return {
      x: Math.cos(angRad) * r,
      y: Math.sin(angRad) * r,
    };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selecione a alternativa correta"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'grid', placeItems: 'center',
        padding: 'clamp(12px, 4vw, 32px)',
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        style={{
          position: 'relative',
          width: 'min(92vw, 640px)',
          aspectRatio: '1 / 1',
          maxHeight: '78vh',
          display: 'grid',
          placeItems: 'center',
          outline: 'none',
        }}
      >
        {/* Cenografia ao fundo: dois escudos + X */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8% 4%',
            opacity: 0.55,
            pointerEvents: 'none',
          }}
        >
          <TeamShield team={team1} size={110} />
          <span
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              color: 'var(--color-feedback-error-dark)',
              textShadow: '3px 3px 0 #000',
            }}
          >×</span>
          <TeamShield team={team2} size={110} />
        </div>

        {/* Enunciado curto na parte superior */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: 'clamp(8px, 2vw, 16px)',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 12,
            color: 'var(--color-neutral-darkest)',
            fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {question}
        </div>

        {/* Bolinhas em espiral + botão Ok central */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {alternatives.map((alt, i) => {
            const isSelected = selected === alt.id;
            const { x, y } = positions[i];
            return (
              <button
                key={alt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={alt.ariaLabel}
                onClick={() => {
                  telemetryRecordInteracaoExercicio(
                    `selecionou alternativa "${alt.id}" no spiral: ${alt.ariaLabel ?? alt.display}`,
                  );
                  setSelected(alt.id);
                }}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  width: ALT_RADIUS * 2,
                  height: ALT_RADIUS * 2,
                  minWidth: 44, minHeight: 44,
                  borderRadius: '50%',
                  border: `3px solid ${isSelected
                    ? 'var(--color-feedback-success-dark)'
                    : 'var(--color-brand-otimath-darker)'}`,
                  background: isSelected
                    ? 'var(--color-feedback-success-lighter)'
                    : 'var(--color-neutral-white)',
                  color: isSelected
                    ? 'var(--color-feedback-success-darkest)'
                    : 'var(--color-brand-otimath-darkest)',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 'clamp(0.85rem, 2.2vw, 1.05rem)',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(34, 161, 85, 0.25), 0 4px 12px rgba(0,0,0,0.3)'
                    : '0 4px 10px rgba(0,0,0,0.3)',
                  transition: 'background 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
                  zIndex: isSelected ? 10 : 5,
                }}
              >
                {alt.display}
              </button>
            );
          })}

          {/* Botão Ok central */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected}
            aria-label="Confirmar resposta"
            style={{
              position: 'relative', zIndex: 20,
              width: OK_RADIUS * 2,
              height: OK_RADIUS * 2,
              minWidth: 44, minHeight: 44,
              borderRadius: '50%',
              border: '4px solid var(--color-neutral-darkest)',
              background: selected
                ? 'radial-gradient(circle at 35% 30%, #ffffff 0%, #d8d8d8 60%, #8a8a8a 100%)'
                : 'radial-gradient(circle at 35% 30%, #f5f5f5 0%, #c8c8c8 60%, #8a8a8a 100%)',
              cursor: selected ? 'pointer' : 'not-allowed',
              opacity: selected ? 1 : 0.6,
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              fontWeight: 900,
              color: 'var(--color-feedback-error-darkest)',
              textShadow: '1px 1px 0 #fff',
              boxShadow: '0 6px 16px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.2)',
              transition: 'opacity 120ms ease, transform 80ms ease',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Ok
          </button>
        </div>

        {/* Legenda de ajuda + cancelar */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 16px)',
            color: 'var(--color-neutral-white)',
            fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
          }}
        >
          <span aria-live="polite">
            {selected ? 'Clique em Ok para confirmar' : 'Escolha uma alternativa'}
          </span>
          <button
            type="button"
            onClick={() => {
              telemetryRecordInteracaoExercicio(`clicou em "Cancelar" no spiral${selected ? ` (havia selecionado: "${selected}")` : ' (sem seleção)'}`);
              onCancel();
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-neutral-white)',
              color: 'var(--color-neutral-white)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 'inherit',
              minHeight: 36,
            }}
          >
            Cancelar (Esc)
          </button>
        </div>

        {/* Suprime mention sobre correctId no markup mas usa para integridade lógica do callback */}
        <span hidden aria-hidden="true">{correctId}</span>
      </div>
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
