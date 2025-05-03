
import React, {useEffect, useRef} from "react";
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

  const divRef = useRef<HTMLDivElement>(null);

  const closeModal = () => {
    updateModal({...modal, status: "hide"});

    const modalElement = divRef.current;
    modalElement?.addEventListener("transitionend", () => {
      modalElement.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }, {once: true});
  };

  const confirmModal = () => {
    modal?.confirmCallback?.();
    closeModal();
  }

  useEffect(() => {
    if(modal.status == "show") {
      const modalElement = divRef.current;
      modalElement?.classList.remove("hidden");
      requestAnimationFrame(() => {
        modalElement?.classList.add("opacity-level-visible");
        document.body.classList.add("overflow-hidden");
      });
    }
  }, [modal]);

  return (
    <div ref={divRef} className={`w-full h-full fixed bg-opacity-modal flex items-center justify-center z-11 top-0 left-0
        opacity-level-transparent transition-[opacity] duration-300 ease-in-out 
        ${modal.status == "hide" ? "pointer-events-none" : ''}
      `}
    >
      <dialog 
        className={`w-[600px] h-fit max-w-[calc(100%-32px)] flex flex-col justify-self-center
          rounded-md solid border-hairline border-neutral-lightest bg-neutral-white`
        }
      >
        <div className="p-xxxs flex justify-between">
          <h3 className="ds-body-large-bold text-brand-otimath-pure">{modal.title}</h3>
          <Button style="neutral" size="medium" icon={<X />} onClick={closeModal}></Button>
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
  );
}


/* Example 
  <Modal modal={modal} updateModal={updateModal}/>

*/
