'use client';

/* ═══════════════════════════════════════════════════════════════
   ReasoningPlaybackPanel — animação lenta de linha a linha.

   Reusa o padrão visual e temporal do ProbFormulaRevealAnimation
   da teoria (UnionProbabilityTheory.tsx):
     • Intervalo entre linhas: 1600 ms
     • Fade + translate no surgimento de cada linha
     • Respeito a prefers-reduced-motion

   Aceita linhas como React nodes (não strings fixas), permitindo
   incluir <FracH>, destaques cromáticos, ícones etc. Isso é o que
   dá o "look matemático" ao invés de texto cru.
   ═══════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';

export interface ReasoningLine {
  /** Conteúdo (pode incluir React nodes: FracH, strong, spans coloridos, etc.) */
  content: React.ReactNode;
  /** Linha em destaque (cor de marca, fundo suave) — usada para a conclusão */
  emphasis?: boolean;
}

interface ReasoningPlaybackPanelProps {
  /** Cabeçalho (aparece imediatamente, não entra na animação) */
  title: string;
  /** Subtítulo opcional — aparece como primeira linha sem numeração */
  strategy?: React.ReactNode;
  /** Array ordenado de linhas a revelar */
  lines: ReasoningLine[];
  /** Intervalo entre linhas (ms). Default: 1600, igual à teoria. */
  stepMs?: number;
  /** Callback quando o aluno clica em "Entendi" */
  onFinish: () => void;
  /** Label do botão final. Default: "Entendi, prosseguir". */
  finishLabel?: string;
}

export function ReasoningPlaybackPanel({
  title,
  strategy,
  lines,
  stepMs = 1600,
  onFinish,
  finishLabel = 'Entendi, prosseguir',
}: ReasoningPlaybackPanelProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    // prefers-reduced-motion: revela tudo imediatamente, sem animação
    if (typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleLines(lines.length);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= lines.length; i++) {
      timers.push(setTimeout(() => setVisibleLines(i), i * stepMs));
    }
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, [lines.length, stepMs]);

  const allShown = visibleLines >= lines.length;

  return (
    <div
      className="bg-neutral-white rounded-md p-xxs border border-neutral-lighter max-w-[860px] mx-auto"
      data-ex-panel
    >
      <style>{`
        @keyframes reasoningReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-reasoning-line] {
          animation: reasoningReveal 0.55s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-reasoning-line] { animation: none !important; }
        }
      `}</style>

      <p
        className="ds-body-bold text-center mb-micro text-brand-otimath-dark"
      >
        🎬 {title}
      </p>

      {strategy && (
        <p
          className="ds-small text-center mb-micro text-neutral-dark italic"
        >
          {strategy}
        </p>
      )}

      <div className="flex flex-col gap-y-micro" style={{ lineHeight: 1.6 }}>
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            data-reasoning-line
            className="ds-body"
            style={{
              color: line.emphasis
                ? 'var(--color-brand-otimath-dark)'
                : 'var(--color-neutral-black)',
              fontWeight: line.emphasis ? 700 : 400,
              background: line.emphasis
                ? 'var(--color-brand-otimath-lightest)'
                : undefined,
              padding: line.emphasis ? '10px 14px' : undefined,
              borderRadius: line.emphasis ? 8 : undefined,
              border: line.emphasis
                ? '2px solid var(--color-brand-otimath-pure)'
                : undefined,
              textAlign: 'justify',
            }}
          >
            <strong
              style={{
                color: 'var(--color-brand-otimath-dark)',
                marginRight: 6,
              }}
            >
              {i + 1}.
            </strong>
            {line.content}
          </div>
        ))}
      </div>

      {allShown && (
        <div className="flex justify-center mt-macro" data-reasoning-line>
          <Button
            style="primary"
            size="small"
            onClick={() => {
              playSound('/sounds/challengeFinished.mp3');
              onFinish();
            }}
          >
            {finishLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
