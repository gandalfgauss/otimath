'use client'

import React, { useEffect, useRef } from "react";
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
}

export function Modal({
  modal,
  updateModal,
}: Readonly<ModalProps>) {
  const scrollPositionRef = useRef<number>(0);
  const divRef = useRef<HTMLDivElement>(null);

  const closeModal = () => {
    const modalElement = divRef.current;
    modalElement?.addEventListener("transitionend", () => {
      updateModal({ ...modal, status: "hide" });
    }, { once: true });

    modalElement?.classList.remove("opacity-level-visible");
    document.body.classList.remove("overflow-y-scroll", "fixed", "w-full", "h-full");
    document.body.style.top = '';
    window.scrollTo(0, scrollPositionRef.current);
    document.documentElement.classList.add('scroll-smooth');
  };

  const confirmModal = () => {
    modal?.confirmCallback?.();
    closeModal();
  }

  const clickModalExternalArea = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
    }
  };

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
    };
  }, [modal]);

  return (
    modal && modal.status !== "hide" && (
      <div
        onClick={clickModalExternalArea}
        ref={divRef}
        className={`w-full h-full fixed bg-opacity-modal flex items-center justify-center z-11 top-0 left-0
        opacity-level-transparent transition-[opacity] duration-300 ease-in-out`}
      >
        <dialog
          className={`w-[600px] h-fit max-w-[calc(100%-32px)] flex flex-col left-[50%] -translate-x-[50%]
            rounded-md solid border-hairline border-neutral-lightest bg-neutral-white`}
        >
          <div className="p-xxxs flex justify-between">
            <h3 className="ds-body-large-bold text-brand-otimath-pure">{modal.title}</h3>
            <Button style="neutral" size="medium" icon={<X />} onClick={closeModal} ariaLabel="Fechar modal"/>
          </div>
          <div className="pt-micro pb-micro pl-xxxs pr-xxxs border-t-hairline border-neutral-lightest">
            <p className="ds-body">{modal.description}</p>
          </div>
          <div className="p-xxxs flex justify-end gap-xxs">
            <Button style="secondary" size="small" onClick={closeModal}>Voltar</Button>
            <Button style="primary" size="small" onClick={confirmModal}>Confirmar</Button>
          </div>
        </dialog>
      </div>
    )
  );
}
