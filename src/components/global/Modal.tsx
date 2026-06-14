'use client'

import React, { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalInterface {
  title?: string;
  description?: string;
  status: "show" | "hide";
  confirmCallback?: () => void;
}

interface ModalProps {
  modal: ModalInterface;
  updateModal: (modal: ModalInterface) => void;
  /**
   * Conteúdo customizado (opcional) que SUBSTITUI a descrição padrão
   * (`modal.description`) do modal. Quando omitido, o modal usa o
   * comportamento legado.
   *
   * Aceita duas formas:
   *  • ReactNode direto — quando o conteúdo não precisa fechar o modal
   *    com animação (pode fechar via `updateModal({status: 'hide'})`).
   *  • Render prop `(helpers) => ReactNode` — recebe `{ close }` pra
   *    disparar o fade-out animado do modal sem reimplementar a lógica.
   *
   * O `children` é renderizado na área ROLÁVEL do modal — é o que
   * scrolla quando o conteúdo excede a altura disponível. Footer
   * (botões) é controlado separadamente via prop `footer`.
   */
  children?: React.ReactNode | ((helpers: { close: () => void }) => React.ReactNode);
  /**
   * Rodapé customizado FIXO no fundo do modal. Não rola — fica sempre
   * visível mesmo quando o `children` extrapola a altura.
   *
   * Quando OMITIDO + `children` também OMITIDO: o modal renderiza os
   * botões legados (Voltar/Confirmar) como rodapé fixo.
   * Quando OMITIDO + `children` PROVIDO: nenhum rodapé fixo (caller é
   * responsável por incluir os botões no `children`, mas eles rolarão
   * com o conteúdo).
   *
   * Aceita as mesmas duas formas do `children` (ReactNode ou render prop
   * com helper `close`).
   */
  footer?: React.ReactNode | ((helpers: { close: () => void }) => React.ReactNode);
}

export function Modal({
  modal,
  updateModal,
  children,
  footer,
}: Readonly<ModalProps>) {
  const scrollPositionRef = useRef<number>(0);
  const divRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    const modalElement = divRef.current;
    modalElement?.addEventListener("transitionend", () => {
      updateModal({ ...modal, status: "hide" });
    }, { once: true });

    modalElement?.classList.remove("opacity-level-visible");
    document.body.classList.remove("overflow-y-scroll", "fixed", "w-full", "h-full");
    document.body.style.top = '';
    window.scrollTo(0, scrollPositionRef.current);
    document.documentElement.classList.add('scroll-smooth');
  }, [modal, updateModal]);

  const confirmModal = useCallback(() => {
    modal?.confirmCallback?.();
    closeModal();
  }, [closeModal, modal]);

  const clickModalExternalArea = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
    }
  }, [closeModal]);

  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
    if (modal.status === "show") {
      const modalElement = divRef.current;
      modalElement?.classList.remove("hidden");
      document.body.classList.add("overflow-y-scroll", "fixed", "w-full", "h-full");
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.documentElement.classList.remove('scroll-smooth');
      requestAnimationFrame(() => {
        modalElement?.classList.add("opacity-level-visible");
      });
    }

    document.addEventListener("keydown", handleEsc, { once: true });

    return () => {
      document.removeEventListener("keydown", handleEsc);
      // DEFESA EM PROFUNDIDADE — restaura body styles no unmount/transição.
      //
      // CASO QUE EXIGIU ISSO: SequenceLogout chama `onLogout()` direto
      // ao validar a senha. O parent troca o estado e desmonta a árvore
      // inteira (incluindo o Modal) ANTES do `closeModal` rodar — o que
      // deixava `overflow-y-scroll fixed w-full h-full` pendurados no
      // <body> e fazia a barra de rolagem sumir na tela de login.
      //
      // Removemos as classes idempotentemente (no-op se já estavam
      // limpas via closeModal normal). Não chamamos `scrollTo` aqui
      // porque na transição pra tela de login o scroll relevante é o
      // do novo conteúdo, não o que existia antes do modal abrir.
      document.body.classList.remove("overflow-y-scroll", "fixed", "w-full", "h-full");
      document.body.style.top = '';
      document.documentElement.classList.add('scroll-smooth');
    };
  }, [modal.status, handleEsc]);

  return (
    modal && modal.status !== "hide" && (
      <div
        onClick={clickModalExternalArea}
        ref={divRef}
        // z-[1000] pra ficar ACIMA do header sticky (z-99 em Header.tsx).
        // Antes era z-11 e o header sobrepunha o topo do modal global,
        // afetando todos os modais de confirmação do app (ex: "Reiniciar
        // jogo" no OVA Dois Dados, "Limpar marcações", etc.).
        className={`w-full h-full fixed bg-opacity-modal flex items-center justify-center z-[1000] top-0 left-0
        opacity-level-transparent transition-[opacity] duration-300 ease-in-out`}
      >
        {/*
          ALTURA MÁXIMA + SCROLL INTERNO
          • `max-h-[calc(100dvh-32px)]` evita que o modal vaze do viewport
            em telas de altura pequena (mobile landscape, laptops 13",
            DevTools aberto). `dvh` lida com a barra de URL dinâmica do
            iOS Safari.
          • `overflow-hidden` no <dialog> clipa o que passar do max-h.
          • O HEADER (título + X) é `shrink-0` pra ficar SEMPRE visível;
            só o miolo (descrição/children + ações) rola via container
            interno `overflow-y-auto`.
        */}
        <dialog
          className={`w-[600px] h-fit max-w-[calc(100%-32px)] max-h-[calc(100dvh-32px)] flex flex-col left-[50%] -translate-x-[50%]
            rounded-md solid border-hairline border-neutral-lightest bg-neutral-white overflow-hidden`}
        >
          <div className="p-xxxs flex justify-between shrink-0">
            <h3 className="ds-body-large-bold text-brand-otimath-pure">{modal.title}</h3>
            <Button style="neutral" size="medium" icon={<X aria-hidden="true" />} onClick={closeModal} ariaLabel="Fechar modal"/>
          </div>
          {/* Container ROLÁVEL — só o body scrolla. Header (acima) e
              footer (abaixo) ficam fixos. `min-h-0` é necessário pra
              que `flex-1` + `overflow-y-auto` cooperem dentro de um
              flex-col container — sem isso o miolo infla e o scroll
              não dispara. */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children !== undefined ? (
              // Slot do caller — preserva o wrapper visual (border-top +
              // padding) pra que a transição entre uso default e custom
              // seja consistente.
              <div className="pt-micro pb-micro pl-xxxs pr-xxxs border-t-hairline border-neutral-lightest">
                {typeof children === 'function' ? children({ close: closeModal }) : children}
              </div>
            ) : (
              <div className="pt-micro pb-micro pl-xxxs pr-xxxs border-t-hairline border-neutral-lightest">
                <p className="ds-body">{modal.description}</p>
              </div>
            )}
          </div>
          {/* Footer FIXO no fundo. Três casos:
              1. `footer` prop provido → renderiza ele.
              2. Nenhum `children` (legacy) → renderiza botões padrão
                 Voltar/Confirmar.
              3. `children` provido sem `footer` → sem rodapé fixo (caso
                 raro; o caller embute os botões no próprio children e
                 eles rolam junto). */}
          {footer !== undefined ? (
            <div className="p-xxxs flex items-center justify-end gap-xxs shrink-0 border-t-hairline border-neutral-lightest">
              {typeof footer === 'function' ? footer({ close: closeModal }) : footer}
            </div>
          ) : children === undefined ? (
            <div className="p-xxxs flex items-center justify-end gap-xxs shrink-0 border-t-hairline border-neutral-lightest">
              <Button style="secondary" size="small" onClick={closeModal}>Voltar</Button>
              <Button style="primary" size="small" onClick={confirmModal}>Confirmar</Button>
            </div>
          ) : null}
        </dialog>
      </div>
    )
  );
}
