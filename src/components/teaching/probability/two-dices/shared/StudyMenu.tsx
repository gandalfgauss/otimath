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
       suggestedGlossaryEntryIds={['cardinalidade-uniao']}  // destacados com badge
       initialGlossaryEntryId="uniao"                         // verbete pré-selecionado
     />
   ═══════════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/global/Button';
import {
  DOIS_DADOS_GLOSSARY,
  DOIS_DADOS_GROUPS,
  type GlossaryEntry,
  type GlossaryGroupDef,
} from './studyMenuContent';

interface StudyMenuProps {
  open: boolean;
  onClose: () => void;
  /** Glossário a exibir. Default: DOIS_DADOS_GLOSSARY (Ex6/Ex8 não passam
   *  prop e mantêm o comportamento atual). RouletteGame e CompletionStats
   *  passam glossários específicos (Disco) ou alternativos. */
  entries?: readonly GlossaryEntry[];
  /** Ordem dos grupos (e seus rótulos) no menu lateral. Default:
   *  DOIS_DADOS_GROUPS. */
  groups?: readonly GlossaryGroupDef[];
  /** IDs de verbetes destacados com badge ★ (sugeridos pelo erro do
   *  aluno). Aceita string livre — os IDs do glossário ativo no momento. */
  suggestedGlossaryEntryIds?: readonly string[];
  /** ID do verbete pré-selecionado ao abrir o menu. */
  initialGlossaryEntryId?: string;
}

export function StudyMenu({
  open,
  onClose,
  entries = DOIS_DADOS_GLOSSARY,
  groups = DOIS_DADOS_GROUPS,
  suggestedGlossaryEntryIds = [],
  initialGlossaryEntryId,
}: StudyMenuProps) {
  const [activeId, setActiveId] = useState<string>(
    initialGlossaryEntryId ?? entries[0]?.id ?? '',
  );
  // Estado mobile: master ('list') ou detail ('detail'). No desktop é
  // ignorado (sempre mostra os dois lados via media queries). Ao abrir
  // o menu, default = 'list' se NÃO houver `initialGlossaryEntryId`
  // (aluno explora a partir do índice); = 'detail' se houver (aluno
  // veio direto de um erro com sugestão de verbete).
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(
    initialGlossaryEntryId ? 'detail' : 'list',
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Reset do mobileView a cada nova abertura do menu — sem isso, a
  // próxima abertura herdaria o estado da sessão anterior.
  useEffect(() => {
    if (open) setMobileView(initialGlossaryEntryId ? 'detail' : 'list');
  }, [open, initialGlossaryEntryId]);

  // Re-sincroniza o verbete ativo quando o glossário muda (ex.: usuário
  // alterna entre menu do Disco e do Dois Dados sem fechar o componente).
  useEffect(() => {
    if (!entries.some((v) => v.id === activeId)) {
      setActiveId(entries[0]?.id ?? '');
    }
  }, [entries, activeId]);

  const entriesByGroup = useMemo(() => {
    const map: Record<string, GlossaryEntry[]> = {};
    for (const g of groups) map[g.key] = [];
    for (const v of entries) {
      if (!map[v.group]) map[v.group] = [];
      map[v.group].push(v);
    }
    return map;
  }, [entries, groups]);

  const activeEntry = useMemo(
    () => entries.find((v) => v.id === activeId) ?? entries[0],
    [entries, activeId],
  );

  const suggestedSet = useMemo(
    () => new Set<string>(suggestedGlossaryEntryIds),
    [suggestedGlossaryEntryIds],
  );

  // Re-sincroniza o verbete ativo quando o menu abre com novo initialGlossaryEntryId
  useEffect(() => {
    if (open && initialGlossaryEntryId) {
      setActiveId(initialGlossaryEntryId);
    }
  }, [open, initialGlossaryEntryId]);

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
      // items-start + padding-top garante que o modal NUNCA fique escondido
      // atrás do header fixo do site, mesmo em telas baixas (mobile landscape,
      // notebooks pequenos). Antes usávamos items-center + max-h-[82vh] — em
      // telas curtas o "centro vertical" caía dentro da área do header.
      // O `pb-xs` mantém respiro embaixo para sombras e barra inferior do iOS.
      className="fixed inset-0 z-20 flex items-start justify-center bg-opacity-modal pt-[88px] pb-xs px-quarck"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-menu-title"
        aria-describedby="study-menu-active-content"
        // max-h subtrai 104px (header ~88px + breathing 16px) — assegura que
        // o conteúdo cabe SEM esconder o cabeçalho do próprio modal.
        className="bg-neutral-white rounded-md w-full max-w-[920px] max-h-[calc(100vh-104px)] flex flex-col"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}
      >
        {/* Cabeçalho.
            • Desktop: título à esquerda, X à direita (layout original).
            • Mobile em 'list': ícone de menu (decorativo) + título "Menu
              de Revisão" + X. Aluno escolhe um verbete na lista abaixo.
            • Mobile em 'detail': botão "voltar" (←) + título do verbete
              ativo + X. Voltar leva à lista; X fecha o menu. Padrão
              master/detail típico do iOS/Android. */}
        <div className="flex justify-between items-center gap-x-quarck p-xxxs border-b-hairline border-neutral-lightest">
          {/* Lado esquerdo: hamburguer/voltar no mobile, ícone fixo no desktop */}
          <div className="flex items-center gap-x-quarck min-w-0 flex-1">
            {/* Mobile em detail: botão voltar */}
            {mobileView === 'detail' && (
              <button
                type="button"
                onClick={() => setMobileView('list')}
                aria-label="Voltar à lista de verbetes"
                className="md:hidden cursor-pointer p-quarck rounded-sm text-brand-otimath-pure transition-colors duration-200 hover:bg-brand-otimath-lightest focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure flex-shrink-0"
              >
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
            )}
            {/* Mobile em list: ícone de hamburguer decorativo (visual) */}
            {mobileView === 'list' && (
              <Menu size={20} aria-hidden="true" className="md:hidden text-brand-otimath-pure flex-shrink-0" />
            )}
            <h2
              id="study-menu-title"
              className="ds-body-large-bold text-brand-otimath-pure truncate"
              title={mobileView === 'detail' ? activeEntry?.title : 'Menu de Revisão'}
            >
              {/* Desktop sempre mostra "Menu de Revisão"; mobile alterna
                  entre "Menu de Revisão" (list) e o título do verbete
                  ativo (detail), para servir de "breadcrumb" do que está
                  sendo lido. */}
              <span className="hidden md:inline">Menu de Revisão</span>
              <span className="md:hidden">
                {mobileView === 'detail' && activeEntry ? activeEntry.title : 'Menu de Revisão'}
              </span>
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Fechar Menu de Revisão (Esc)"
            className="cursor-pointer p-quarck rounded-sm text-neutral-dark transition-colors duration-200 hover:text-brand-otimath-pure focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure flex-shrink-0"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Corpo: nav + conteúdo.
            • Desktop (≥md): split horizontal — nav à esquerda com scroll
              próprio, conteúdo à direita com scroll próprio.
            • Mobile: padrão master/detail — só UMA das duas colunas
              fica visível por vez. `mobileView === 'list'` mostra a
              navegação; `'detail'` mostra o artigo. O scroll fica
              naturalmente na coluna visível. */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Navegação — visível no mobile só em 'list'; sempre no desktop */}
          <nav
            aria-label="Lista de verbetes"
            className={`${
              mobileView === 'list' ? 'flex' : 'hidden'
            } md:flex flex-col w-full md:w-[280px] md:max-w-[280px] flex-shrink-0 overflow-y-auto md:border-r-hairline border-neutral-lightest p-xxxs`}
          >
            {groups.map((g) => (
              <div key={g.key} className="mb-micro">
                <h3 className="ds-caption-bold text-neutral-dark uppercase mb-quarck">
                  {g.title}
                </h3>
                <ul className="flex flex-col gap-y-quarck">
                  {entriesByGroup[g.key].map((v) => {
                    const isActive = v.id === activeId;
                    const isSuggested = suggestedSet.has(v.id);
                    return (
                      <li key={v.id}>
                        <button
                          onClick={() => {
                            setActiveId(v.id);
                            // Mobile: ao escolher um verbete, vai para o
                            // detail. Desktop ignora (sempre split).
                            setMobileView('detail');
                          }}
                          aria-current={isActive ? 'true' : undefined}
                          className={`w-full text-left p-quarck rounded-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure transition-colors ${
                            isActive
                              ? 'bg-brand-otimath-lightest text-brand-otimath-darker ds-small-bold'
                              : 'text-neutral-darkest hover:bg-neutral-lightest ds-small'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-x-quarck">
                            <span className="flex-1">{v.title}</span>
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

          {/* Painel de conteúdo — visível no mobile só em 'detail';
              sempre no desktop. Scroll próprio em ambos os casos. */}
          <article
            id="study-menu-active-content"
            className={`${
              mobileView === 'detail' ? 'block' : 'hidden'
            } md:block flex-1 overflow-y-auto p-xxs`}
            tabIndex={-1}
          >
            <header className="mb-xxs">
              <p className="ds-caption-bold text-neutral-dark uppercase mb-quarck">
                {activeEntry.groupTitle}
              </p>
              <h3 className="ds-heading-large text-brand-otimath-darker">
                {activeEntry.title}
                {suggestedSet.has(activeEntry.id) && (
                  <span className="ds-caption-bold text-feedback-warning-darkest bg-feedback-warning-lighter rounded-sm px-quarck ml-micro align-middle">
                    ★ Sugerido para esta tarefa
                  </span>
                )}
              </h3>
            </header>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Definição formal</h4>
              <p className="ds-body text-neutral-darkest whitespace-pre-line">
                {activeEntry.formalDefinition}
              </p>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Em palavras</h4>
              <p className="ds-body text-neutral-darkest">{activeEntry.naturalDefinition}</p>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Exemplo no contexto</h4>
              <p className="ds-body text-neutral-darkest mb-quarck">{activeEntry.exampleContext}</p>
              <pre className="ds-small bg-neutral-lightest p-micro rounded-sm whitespace-pre-wrap text-neutral-darkest">
                {activeEntry.exampleCalculation}
              </pre>
            </section>

            <section className="mb-xxs">
              <h4 className="ds-body-bold text-neutral-darkest mb-quarck">Para que serve</h4>
              <p className="ds-body text-neutral-darkest">{activeEntry.useCase}</p>
            </section>

            <section className="mb-xxs p-micro rounded-sm border-thin border-feedback-warning-darkest bg-feedback-warning-lighter">
              <h4 className="ds-body-bold text-feedback-warning-darkest mb-quarck">⚠ Atenção</h4>
              <p className="ds-body text-feedback-warning-darkest">{activeEntry.attention}</p>
            </section>

            <footer className="border-t-hairline border-neutral-lightest pt-micro">
              <p className="ds-caption text-neutral-dark italic">{activeEntry.reference}</p>
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
