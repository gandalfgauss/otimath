'use client';

/* ═══════════════════════════════════════════════════════════════
   GoalAnimation — Animação de gol (acerto da rodada).

   Inspirada no OVA Roxa original (mcMotion da bola para canto
   inferior direito + mcFadeIn da tela "RESPOSTA CERTA").
   Modernizada com tokens OtiMath:
   • Fundo gramado em cores OtiMath (verdes do brand)
   • Bola estilizada SVG (sem identidade Flash)
   • Texto "GOL!" em .ds-heading-mega
   • Som via playSound('challengeFinished.mp3')
   • prefers-reduced-motion → mostra texto estático sem deslizamento
   ═══════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react';
import { playSound } from '@/hooks/global/useSound';

interface GoalAnimationProps {
  open: boolean;
  /** Chamado após a animação completa (≈ 2s). */
  onFinished: () => void;
  /** Texto adicional opcional (ex.: "Resposta correta!"). */
  subtitle?: string;
}

const ANIM_DURATION_MS = 1800;

export function GoalAnimation({ open, onFinished, subtitle }: GoalAnimationProps) {
  const [phase, setPhase] = useState<'rolling' | 'goal' | 'celebration'>('rolling');
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    setPhase('rolling');
    if (typeof window !== 'undefined') {
      try { playSound('/sounds/challengeFinished.mp3'); } catch { /* noop */ }
    }
    if (reduced) {
      // Pula direto para celebração estática
      setPhase('celebration');
      const t = setTimeout(onFinished, 1200);
      return () => clearTimeout(t);
    }
    // Sequência: rolling (0-700ms) → goal (700-1200ms) → celebration (1200-1800ms)
    const t1 = setTimeout(() => setPhase('goal'), 700);
    const t2 = setTimeout(() => setPhase('celebration'), 1200);
    const t3 = setTimeout(onFinished, ANIM_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [open, onFinished, reduced]);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Resposta correta — Gol!"
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'grid', placeItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,80,40,0.6) 0%, rgba(0,40,20,0.9) 100%)',
        animation: reduced ? 'none' : 'goal-bg-fade 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes goal-bg-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes goal-ball-roll {
          0%   { transform: translate(-40vw, -10vh) rotate(0deg) scale(1); }
          100% { transform: translate(28vw, 18vh) rotate(720deg) scale(0.5); }
        }
        @keyframes goal-text-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          50%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes goal-celebration-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
      `}</style>

      {/* Cenografia: gramado + traves laterais (decorativo) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0 60px,
            rgba(0,0,0,0.04) 60px 120px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* Bola animada (rolling phase) */}
      {phase === 'rolling' && !reduced && (
        <svg
          aria-hidden="true"
          width="80" height="80" viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            animation: 'goal-ball-roll 700ms cubic-bezier(0.4, 0, 0.6, 1) forwards',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          }}
        >
          <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#000" strokeWidth="2" />
          <polygon points="50,22 62,32 60,46 40,46 38,32" fill="#000" />
          <polygon points="22,50 38,46 46,58 38,72 24,68" fill="#000" />
          <polygon points="78,50 62,46 54,58 62,72 76,68" fill="#000" />
          <polygon points="50,72 38,68 42,84 58,84 62,68" fill="#000" />
        </svg>
      )}

      {/* Texto GOL! */}
      {(phase === 'goal' || phase === 'celebration') && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 'clamp(8px, 2vw, 16px)',
            animation: reduced
              ? 'none'
              : phase === 'goal'
                ? 'goal-text-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : 'goal-celebration-pulse 600ms ease-in-out infinite',
          }}
        >
          <h1
            className="ds-heading-tera"
            style={{
              color: 'var(--color-feedback-success-lighter)',
              textShadow: `
                0 0 20px rgba(34, 197, 94, 0.8),
                4px 4px 0 var(--color-neutral-darkest),
                0 0 40px rgba(255,255,255,0.4)
              `,
              letterSpacing: '0.05em',
              margin: 0,
              fontSize: 'clamp(3rem, 12vw, 7rem)',
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            GOL!
          </h1>
          <p
            className="ds-heading-large"
            style={{
              color: 'var(--color-neutral-white)',
              margin: 0,
              textAlign: 'center',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              maxWidth: '90vw',
            }}
          >
            {subtitle ?? 'Resposta correta!'}
          </p>
        </div>
      )}
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
