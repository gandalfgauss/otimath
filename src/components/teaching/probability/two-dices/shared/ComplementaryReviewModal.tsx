'use client';

/* ═══════════════════════════════════════════════════════════════
   ComplementaryReviewModal — modal de revisão didática.

   Resgata para a fase de Eventos Complementares (OVA Dois Dados)
   três conceitos formalizados anteriormente no OVA Disco
   Probabilístico Aleatório:

     1) Definição de eventos complementares
        (Ā = todos os resultados que NÃO pertencem a A).
     2) Soma das probabilidades complementares = 1
        (P(A) + P(Ā) = 1).
     3) Eventos mutuamente exclusivos / disjuntos
        (A ∩ B = ∅).

   Pedagogia (TROUCHE, 2004 — coerência instrumental):
     A nova seção REUSA conceitos já construídos pelo aluno no
     Disco. Em vez de redefinir, RESGATA. Isso reforça a ideia
     de SEQUÊNCIA didática (não OVAs isolados) e prepara o
     aluno para reconhecer a estratégia complementar como
     consequência natural do que ele já viu.

   Acessibilidade:
     • Fechamento por Escape, clique fora, botão Fechar.
     • role="dialog" + aria-modal="true" + aria-labelledby.
     • Foco volta ao botão que abriu o modal (gerenciado pelo pai).
   ═══════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/global/Button';

interface ComplementaryReviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComplementaryReviewModal({ open, onClose }: ComplementaryReviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Tecla Escape fecha
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Trava scroll do body enquanto modal está aberto
  useEffect(() => {
    if (!open) return;
    scrollPositionRef.current = window.scrollY;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [open]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-modal"
      style={{ background: 'rgba(0, 0, 0, 0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-review-title"
    >
      <div
        className="bg-neutral-white rounded-md flex flex-col max-h-[calc(100vh-32px)]"
        style={{
          width: 720,
          maxWidth: 'calc(100% - 32px)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-xxs border-b border-neutral-lightest">
          <div>
            <p className="ds-overline" style={{ color: 'var(--color-brand-otimath-pure)' }}>
              Revisão
            </p>
            <h2
              id="comp-review-title"
              className="ds-body-large-bold"
              style={{ color: 'var(--color-brand-otimath-darkest)' }}
            >
              Conceitos do Disco Probabilístico
            </h2>
          </div>
          <Button
            style="neutral"
            size="medium"
            icon={<X />}
            onClick={onClose}
            ariaLabel="Fechar revisão"
          />
        </div>

        {/* Conteúdo — 3 seções */}
        <div className="overflow-y-auto p-xxs flex flex-col gap-xs">
          {/* Seção 1 — Eventos Complementares */}
          <section
            className="rounded-md p-xxs"
            style={{
              background: 'var(--color-brand-otimath-lightest)',
              borderLeft: '4px solid var(--color-brand-otimath-pure)',
            }}
          >
            <h3
              className="ds-body-bold mb-micro"
              style={{ color: 'var(--color-brand-otimath-darkest)' }}
            >
              1. Evento complementar
            </h3>
            <p className="ds-body text-neutral-darkest mb-micro">
              Dado um evento <strong>A</strong>, o <strong>evento complementar</strong>{' '}
              <strong>Ā</strong> (lê-se &quot;A barra&quot;) é formado por{' '}
              <strong>todos os resultados do espaço amostral que NÃO pertencem a A</strong>.
            </p>
            <p className="ds-body text-neutral-darkest">
              Exemplo do disco:{' '}
              <span style={{ color: '#CC8800', fontWeight: 700 }}>A em dourado</span>
              {' '}e{' '}
              <span style={{ color: '#00838F', fontWeight: 700 }}>Ā em ciano</span>
              {' '}cobriam o disco inteiro, sem sobreposição.
            </p>
          </section>

          {/* Seção 2 — Soma das probabilidades = 1 */}
          <section
            className="rounded-md p-xxs"
            style={{
              background: 'var(--color-feedback-success-lighter)',
              borderLeft: '4px solid var(--color-feedback-success-dark)',
            }}
          >
            <h3
              className="ds-body-bold mb-micro"
              style={{ color: 'var(--color-feedback-success-darkest)' }}
            >
              2. Soma das probabilidades complementares
            </h3>
            <p className="ds-body text-neutral-darkest mb-micro">
              Como A e Ā <strong>cobrem todo o espaço amostral sem sobreposição</strong>:
            </p>
            <ul className="ds-body text-neutral-darkest mb-micro" style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>• <strong>A ∪ Ā = S</strong> (cobre o espaço amostral)</li>
              <li>• <strong>A ∩ Ā = ∅</strong> (não se sobrepõem)</li>
            </ul>
            <p className="ds-body text-neutral-darkest mb-micro">
              Logo:
            </p>
            <p
              className="ds-body-large-bold text-center my-micro"
              style={{ color: 'var(--color-feedback-success-darkest)' }}
            >
              P(A) + P(Ā) = 1
            </p>
            <p className="ds-body text-neutral-darkest">
              Isolando, obtemos a fórmula que vamos usar nesta seção:
            </p>
            <p
              className="ds-body-large-bold text-center my-micro"
              style={{ color: 'var(--color-feedback-success-darkest)' }}
            >
              P(A) = 1 − P(Ā)
            </p>
          </section>

          {/* Seção 3 — Eventos Mutuamente Exclusivos */}
          <section
            className="rounded-md p-xxs"
            style={{
              background: 'var(--color-feedback-info-lighter)',
              borderLeft: '4px solid var(--color-feedback-info-dark)',
            }}
          >
            <h3
              className="ds-body-bold mb-micro"
              style={{ color: 'var(--color-feedback-info-darkest)' }}
            >
              3. Eventos mutuamente exclusivos (disjuntos)
            </h3>
            <p className="ds-body text-neutral-darkest mb-micro">
              Dois eventos A e B são <strong>mutuamente exclusivos</strong> (também chamados de{' '}
              <strong>disjuntos</strong>) quando <strong>não podem acontecer ao mesmo tempo</strong>{' '}
              no mesmo experimento.
            </p>
            <p className="ds-body text-neutral-darkest mb-micro">
              Em outras palavras: se A acontece, B não acontece — e vice-versa. Eles{' '}
              <strong>não têm resultados em comum</strong>.
            </p>
            <p
              className="ds-body-large-bold text-center my-micro"
              style={{ color: 'var(--color-feedback-info-darkest)' }}
            >
              A ∩ B = ∅
            </p>
            <p className="ds-body text-neutral-darkest">
              <strong>Importante:</strong> A e Ā são, por definição, mutuamente exclusivos —
              é por isso que P(A ∪ Ā) = P(A) + P(Ā).
            </p>
          </section>

          {/* Aviso de reuso conceitual */}
          <p
            className="ds-caption text-center mt-micro"
            style={{ color: 'var(--color-neutral-dark)', fontStyle: 'italic' }}
          >
            Estes conceitos foram trabalhados no OVA Disco Probabilístico Aleatório
            e serão reusados nesta seção do OVA Dois Dados.
          </p>
        </div>

        {/* Footer — botão "Li!" segue convenção do OVA Disco
             (RouletteGame.tsx, fase definition). Ao clicar, fecha o
             modal e devolve o foco ao enunciado da atividade. */}
        <div className="p-xxs border-t border-neutral-lightest flex justify-end">
          <Button style="primary" size="small" icon={<Check />} onClick={onClose}>
            Li!
          </Button>
        </div>
      </div>
    </div>
  );
}
