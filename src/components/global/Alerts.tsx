import { useEffect } from "react";
import React from "react";
import { Alert, AlertInterface} from "./Alert";

interface AlertsProps {
  alerts: AlertInterface[];
  updateAlert: (index: number, alert: AlertInterface) => void;
  deleteAlerts: () => void;
  /**
   * Quando `true`, sobe o z-index da overlay pra `z-[1100]` — acima do
   * Modal global (que vive em `z-[1000]`). Use em fluxos onde o alert
   * precisa ser visível ENQUANTO o modal está aberto (ex.: validação
   * de senha do questionário pós-sequência).
   *
   * Default `false` mantém o `z-97` legado de TODAS as outras chamadas
   * de `<Alerts>` do projeto — comportamento não regride pra ninguém.
   */
  aboveModal?: boolean;
}

export function Alerts({
 alerts,
 updateAlert,
 deleteAlerts,
 aboveModal = false,
}: Readonly<AlertsProps>) {

  useEffect(() => {
    if(alerts && alerts.length > 0 && alerts.every(alert => alert.status === "remove")) {
      deleteAlerts();
    }
  }, [alerts]);

  return (
    alerts && alerts.length > 0 && (
      <div className={`flex flex-col fixed top-[20vh] right-[16px] items-end ${aboveModal ? 'z-[1100]' : 'z-97'} transition-[transform] duration-500 ease-in-out`}>
        {alerts.map((alert, index) => {
          return <Alert
            key={index}
            alert={alert}
            index={index}
            updateAlert={updateAlert}
          />
        })}
      </div>
    )
  );
}


/* Example 
  <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
*/
