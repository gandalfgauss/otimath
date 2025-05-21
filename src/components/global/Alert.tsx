import React, {useEffect, useRef } from "react";
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "./Button";
import '@/styles/global/alert.css'

export type AlertType = 'error' | 'success' | 'warning' | 'info';

export interface AlertInterface {
  title?: string;
  description?: string;
  type: AlertType;
  status?: "show" | "hide" | "remove";
  timeout?: number;
}

interface AlertProps {
  alert: AlertInterface;
  index: number;
  updateAlert: (index: number, alert: AlertInterface) => void;
}

export function Alert({
  alert,
  index,
  updateAlert,
}: Readonly<AlertProps>) {

  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeAlert = () => {
    const dialog = dialogRef.current;

    if (dialog) {
      updateAlert(index, {...alert, status: "hide"});
      
      dialog.addEventListener("transitionend", () => {
        dialog.addEventListener("transitionend", () => {
          dialog.classList.add("hidden");
          updateAlert(index, {...alert, status: "remove"});
        }, {once: true});

        requestAnimationFrame(() => {
          dialog.style.height = "0px";
          dialog.style.margin = "0px";
        });
      }, {once: true});
    }
  }

  useEffect(() => {
    const hiddenAlertTimeout = () => {
      if(alert.status == "show") {
        closeAlert();
      }
    }
    const timeoutId = setTimeout(hiddenAlertTimeout, alert.timeout);
    return () => clearTimeout(timeoutId)
  }, []);


  const alertStylesType = {
    success: {
      generalColors: "bg-feedback-success-lighter text-feedback-success-darkest",
      iconColor: "text-feedback-success-dark",
      icon: CircleCheckBig
    },
    error: {
      generalColors: "bg-feedback-error-lighter text-feedback-error-darkest",
      iconColor: "text-feedback-error-dark",
      icon: CircleAlert
    },
    warning: {
      generalColors: "bg-feedback-warning-lighter text-feedback-warning-darkest",
      iconColor: "text-feedback-warning-dark",
      icon: TriangleAlert
    },
    info: {
      generalColors: "bg-feedback-info-lighter text-feedback-info-darkest",
      iconColor: "text-feedback-info-dark",
      icon: Info
    },
  };
  
  return (
    <dialog ref={dialogRef}
      className={`w-fit max-w-[calc(100vw-32px)] overflow-hidden rounded-sm shrink-0 relative right-0 flex gap-x-micro p-macro mb-xs
      transition-[translate,height, margin] duration-500 ease-in-out h-[70px]
      ${alert.status == "show"? "animate-[alertShow_0.5s_ease-out_forwards]" : "translate-x-[200%]"}
      ${alertStylesType[alert.type].generalColors}`}
    >
      {React.createElement(alertStylesType[alert.type].icon, { className: `${alertStylesType[alert.type].iconColor} w-[24px] h-[24px] shrink-0` })}
      <div className="pl-micro">
        <h3 className="ds-body-bold">{alert.title}</h3>
        <p className="ds-small">{alert.description}</p>
      </div>

      <Button style="neutral" size="small" icon={<X />} onClick={closeAlert} ariaLabel="Fechar alerta"/>
    </dialog>
  );
}


/* Example 
  <Alert 
    key={index}
    alert= {alert}
    index={index}
    updateAlert={updateAlert}
  />
*/
