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
     • Foco inicial no botão "Li!"; ao fechar, foco retorna ao
       elemento que o disparou (capturado em previouslyFocused).
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
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Escape fecha + gerenciamento de foco (captura antes, restaura depois).
  // Sem isso, ao fechar o modal o foco caía no <body> e o usuário de
  // teclado perdia o lugar; agora retorna ao botão que abriu o modal.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    // Foco inicial no próprio dialog (tabIndex=-1) para que leitores de
    // tela anunciem o título e o Tab subsequente leve ao primeiro
    // elemento focável dentro do diálogo (X de fechar).
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', handleEsc);
      previouslyFocused.current?.focus?.();
    };
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
      tabIndex={-1}
      // `bg-opacity-modal` é o token padrão de overlay do DS (≈ 0.8 black).
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-modal outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-review-title"
    >
      <div
        // `w-[720px] max-w-[calc(100%-32px)]` — largura fixa em desktop,
        // margem segura em telas estreitas. `shadow-level-4` dá elevação
        // condizente com modais críticos.
        className="bg-neutral-white rounded-md flex flex-col max-h-[calc(100vh-32px)] w-[720px] max-w-[calc(100%-32px)] shadow-level-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-xxs border-b border-neutral-lightest">
          <div>
            <p className="ds-overline text-brand-otimath-pure">
              Revisão
            </p>
            <h2 id="comp-review-title" className="ds-body-large-bold text-brand-otimath-darkest">
              Conceitos do Disco Probabilístico
            </h2>
          </div>
          <Button
            style="neutral"
            size="medium"
            icon={<X aria-hidden="true" />}
            onClick={onClose}
            ariaLabel="Fechar revisão"
          />
        </div>

        {/* Conteúdo — 3 seções */}
        <div className="overflow-y-auto p-xxs flex flex-col gap-xs">
          {/* Seção 1 — Eventos Complementares */}
          <section className="rounded-md p-xxs bg-brand-otimath-lightest border-l-4 border-brand-otimath-pure">
            <h3 className="ds-body-bold mb-micro text-brand-otimath-darkest">
              1. Evento complementar
            </h3>
            <p className="ds-body text-neutral-darkest mb-micro">
              Dado um evento <strong>A</strong>, o <strong>evento complementar</strong>{' '}
              <strong>Ā</strong> (lê-se &quot;A barra&quot;) é formado por{' '}
              <strong>todos os resultados do espaço amostral que NÃO pertencem a A</strong>.
            </p>
            <p className="ds-body text-neutral-darkest">
              Exemplo do disco:{' '}
              {/* Cores literais do disco (dourado/ciano) — não há token de
                  marca equivalente para esses dois matizes específicos
                  usados na cena visual. */}
              <span className="font-bold text-[#CC8800]">A em dourado</span>
              {' '}e{' '}
              <span className="font-bold text-[#00838F]">Ā em ciano</span>
              {' '}cobriam o disco inteiro, sem sobreposição.
            </p>
          </section>

          {/* Seção 2 — Soma das probabilidades = 1 */}
          <section className="rounded-md p-xxs bg-feedback-success-lighter border-l-4 border-feedback-success-dark">
            <h3 className="ds-body-bold mb-micro text-feedback-success-darkest">
              2. Soma das probabilidades complementares
            </h3>
            <p className="ds-body text-neutral-darkest mb-micro">
              Como A e Ā <strong>cobrem todo o espaço amostral sem sobreposição</strong>:
            </p>
            <ul className="ds-body text-neutral-darkest mb-micro list-none pl-0">
              <li>• <strong className="whitespace-nowrap">A ∪ Ā = S</strong> (cobre o espaço amostral)</li>
              <li>• <strong className="whitespace-nowrap">A ∩ Ā = ∅</strong> (não se sobrepõem)</li>
            </ul>
            <p className="ds-body text-neutral-darkest mb-micro">
              Logo:
            </p>
            <p className="ds-body-large-bold text-center my-micro text-feedback-success-darkest whitespace-nowrap">
              P(A) + P(Ā) = 1
            </p>
            <p className="ds-body text-neutral-darkest">
              Isolando, obtemos a fórmula que vamos usar nesta seção:
            </p>
            <p className="ds-body-large-bold text-center my-micro text-feedback-success-darkest whitespace-nowrap">
              P(A) = 1 − P(Ā)
            </p>
          </section>

          {/* Seção 3 — Eventos Mutuamente Exclusivos */}
          <section className="rounded-md p-xxs bg-feedback-info-lighter border-l-4 border-feedback-info-dark">
            <h3 className="ds-body-bold mb-micro text-feedback-info-darkest">
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
            <p className="ds-body-large-bold text-center my-micro text-feedback-info-darkest whitespace-nowrap">
              A ∩ B = ∅
            </p>
            <p className="ds-body text-neutral-darkest">
              <strong>Importante:</strong> A e Ā são, por definição, mutuamente exclusivos —
              é por isso que <span className="whitespace-nowrap">P(A ∪ Ā) = P(A) + P(Ā)</span>.
            </p>
          </section>

          {/* Aviso de reuso conceitual */}
          <p className="ds-caption text-center mt-micro text-neutral-dark italic">
            Estes conceitos foram trabalhados no OVA Disco Probabilístico Aleatório
            e serão reusados nesta seção do OVA Dois Dados.
          </p>
        </div>

        {/* Footer — botão "Li!" segue convenção do OVA Disco
             (RouletteGame.tsx, fase definition). Ao clicar, fecha o
             modal e devolve o foco ao elemento que o disparou. */}
        <div className="p-xxs border-t border-neutral-lightest flex justify-end">
          <Button
            style="primary"
            size="small"
            icon={<Check aria-hidden="true" />}
            onClick={onClose}
          >
            Li!
          </Button>
        </div>
      </div>
    </div>
  );
}
