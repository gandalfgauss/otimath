import React, {useEffect, useRef } from "react";
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "./Button";
import '@/styles/global/alert.css'

export type AlertType = 'error' | 'success' | 'warning' | 'info';

export interface AlertInterface {
  title?: string;
  description?: string;
  type: AlertType;
  status?: "show" | "hide";
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
    updateAlert(index, {...alert, status: "hide"});

    const dialog = dialogRef.current;
    if (dialog) {
      dialog.addEventListener("animationend", () => {
        dialog.classList.add("hidden");
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
      className={`w-fit max-w-[calc(100vw-32px)] rounded-sm shrink-0 relative right-0 flex gap-x-micro p-macro
      ${alert.status == "show"? "animate-[alertShow_0.5s_ease-out_forwards]" : "animate-[alertHide_0.5s_ease-out_forwards]"}
      ${alertStylesType[alert.type].generalColors}`}
    >
      {React.createElement(alertStylesType[alert.type].icon, { className: `${alertStylesType[alert.type].iconColor} w-[24px] h-[24px] shrink-0` })}
      <div className="pl-micro">
        <h3 className="ds-body-bold">{alert.title}</h3>
        <p className="ds-small">{alert.description}</p>
      </div>

      <Button style="neutral" size="small" icon={<X />} onClick={closeAlert}></Button>
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
