import { useEffect } from "react";
import React from "react";
import { Alert, AlertInterface} from "./Alert";

interface AlertsProps {
  alerts: AlertInterface[];
  updateAlert: (index: number, alert: AlertInterface) => void;
  deleteAlerts: () => void;
}

export function Alerts({
 alerts,
 updateAlert,
 deleteAlerts
}: Readonly<AlertsProps>) {

  useEffect(() => {
    if(alerts && alerts.length > 0 && alerts.every(alert => alert.status === "remove")) {
      deleteAlerts();
    }
  }, [alerts]);

  return (
    alerts && alerts.length > 0 && (
      <div className='flex flex-col fixed top-[20vh] right-[16px] items-end z-2 transition-[transform] duration-500 ease-in-out'>
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
