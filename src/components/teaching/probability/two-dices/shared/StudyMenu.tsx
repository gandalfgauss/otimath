'use client';

/* ═══════════════════════════════════════════════════════════════════
   StudyMenu — Menu de Revisão acionável a qualquer momento (Ex6)

   ARQUITETURA
     • Overlay próprio (não usa Modal global porque a estrutura difere)
     • 100% reuso de tokens do Design System (cores, tipografia, espaçamentos)
     • Reuso integral do Button global (não cria botão próprio)
     • Acessibilidade WCAG 2.1 AA: role="dialog", aria-modal, foco gerenciado,
       Esc fecha, Tab cíclico dentro do diálogo, foco visível

   ESTRUTURA
     • Cabeçalho fixo (título + fechar)
     • Coluna esquerda (~30%): 7 verbetes em 3 grupos navegáveis
     • Painel direito (~70%): conteúdo do verbete ativo
     • Mobile: coluna vira accordion vertical

   USO
     <StudyMenu
       open={open}
       onClose={() => setOpen(false)}
       suggestedVerbeteIds={['cardinalidade-uniao']}  // destacados com badge
       initialVerbeteId="uniao"                         // verbete pré-selecionado
     />
   ═══════════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/global/Button';
import { VERBETES, type Verbete, type VerbeteId } from './studyMenuContent';

interface StudyMenuProps {
  open: boolean;
  onClose: () => void;
  suggestedVerbeteIds?: readonly VerbeteId[];
  initialVerbeteId?: VerbeteId;
}

const GROUP_ORDER: ReadonlyArray<{ key: Verbete['grupo']; titulo: string }> = [
  { key: 'operacoes',         titulo: 'Operações entre eventos' },
  { key: 'eventos-especiais', titulo: 'Eventos especiais' },
  { key: 'probabilidade',     titulo: 'Probabilidade' },
];

export function StudyMenu({
  open,
  onClose,
  suggestedVerbeteIds = [],
  initialVerbeteId,
}: StudyMenuProps) {
  const [activeId, setActiveId] = useState<VerbeteId>(
    initialVerbeteId ?? VERBETES[0].id,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const verbetesByGroup = useMemo(() => {
    const groups: Record<Verbete['grupo'], Verbete[]> = {
      'operacoes': [],
      'eventos-especiais': [],
      'probabilidade': [],
    };
    VERBETES.forEach((v) => groups[v.grupo].push(v));
    return groups;
  }, []);

  const activeVerbete = useMemo(
    () => VERBETES.find((v) => v.id === activeId) ?? VERBETES[0],
    [activeId],
  );

  const suggestedSet = useMemo(
    () => new Set<VerbeteId>(suggestedVerbeteIds),
    [suggestedVerbeteIds],
  );

  // Re-sincroniza o verbete ativo quando o menu abre com novo initialVerbeteId
  useEffect(() => {
    if (open && initialVerbeteId) {
      setActiveId(initialVerbeteId);
    }
  }, [open, initialVerbeteId]);

  // Esc fecha o menu; foco gerenciado
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    // Foco inicial no botão Fechar (acessível por screen reader)
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', handleKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-20 flex items-center justify-center bg-opacity-modal"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-menu-title"
        aria-describedby="study-menu-active-content"
        className="bg-neutral-white rounded-md w-[calc(100%-32px)] max-w-[920px] max-h-[calc(100%-32px)] flex flex-col"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-xxxs border-b-hairline border-neutral-lightest">
          <h2 id="study-menu-title" className="ds-body-large-bold text-brand-otimath-pure">
            Menu de Revisão
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Fechar Menu de Revisão (Esc)"
            className="p-quarck rounded-sm text-neutral-dark hover:text-brand-otimath-pure focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Corpo: nav + conteúdo */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Navegação */}
          <nav
            aria-label="Lista de verbetes"
            className="md:w-[280px] md:max-w-[280px] flex-shrink-0 overflow-y-auto border-b-hairline md:border-b-0 md:border-r-hairline border-neutral-lightest p-xxxs"
          >
            {GROUP_ORDER.map((g) => (
              <div key={g.key} className="mb-micro">
                <h3 className="ds-caption-bold text-neutral-dark uppercase mb-quarck">
                  {g.titulo}
                </h3>
                <ul className="flex flex-col gap-y-quarck">
                  {verbetesByGroup[g.key].map((v) => {
                    const isActive = v.id === activeId;
                    const isSuggested = suggestedSet.has(v.id);
                    return (
                      <li key={v.id}>
                        <button
                          onClick={() => setActiveId(v.id)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`w-full text-left p-quarck rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure transition-colors ${
                            isActive
                              ? 'bg-brand-otimath-lightest text-brand-otimath-darker ds-small-bold'
                              : 'text-neutral-darkest hover:bg-neutral-lightest ds-small'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-x-quarck">
                            <span className="flex-1">{v.titulo}</span>
                            {isSuggested && (
                              <span
                                className="ds-caption-bold text-feedback-warning-darkest bg-feedback-warning-lighter rounded-sm px-quarck"
                                aria-label="Sugerido para esta tarefa"
                                title="Sugerido para esta tarefa"
                              >
                                ★
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Painel de conteúdo */}
          <article
            id="study-menu-active-content"
            className="flex-1 overflow-y-auto p-xxs"
            tabIndex={-1}
          >
            <header className="mb-xxs">
              <p className="ds-caption-bold text-neutral-dark uppercase mb-quarck">
                {activeVerbete.grupoTitulo}
              </p>
              <h3 className="ds-heading-large text-brand-otimath-darker">
                {activeVerbete.titulo}
                {suggestedSet.has(activeVerbete.id) && (
                  <span className="ds-caption-bold text-feedback-warning-darkest bg-feedback-warning-lighter rounded-sm px-quarck ml-micro align-middle">
                    ★ Sugerido para esta tarefa
                  </span>
                )}
              </h3>
            </header>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Definição formal</h4>
              <p className="ds-body text-neutral-darkest whitespace-pre-line">
                {activeVerbete.definicaoFormal}
              </p>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Em palavras</h4>
              <p className="ds-body text-neutral-darkest">{activeVerbete.definicaoNatural}</p>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Exemplo no contexto</h4>
              <p className="ds-body text-neutral-darkest mb-quarck">{activeVerbete.exemploContexto}</p>
              <pre className="ds-small bg-neutral-lightest p-micro rounded-sm whitespace-pre-wrap text-neutral-darkest">
                {activeVerbete.exemploCalculo}
              </pre>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Para que serve</h4>
              <p className="ds-body text-neutral-darkest">{activeVerbete.paraQueServe}</p>
            </section>

            <section className="mb-xxs p-micro rounded-sm border-thin border-feedback-warning-darkest bg-feedback-warning-lighter">
              <h4 className="ds-body-bold text-feedback-warning-darkest mb-quarck">⚠ Atenção</h4>
              <p className="ds-body text-feedback-warning-darkest">{activeVerbete.atencao}</p>
            </section>

            <footer className="border-t-hairline border-neutral-lightest pt-micro">
              <p className="ds-caption text-neutral-dark italic">{activeVerbete.referencia}</p>
            </footer>
          </article>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end p-xxxs border-t-hairline border-neutral-lightest">
          <Button style="primary" size="small" onClick={onClose}>
            Voltar ao exercício
          </Button>
        </div>
      </div>
    </div>
  );
}
