import { useState} from 'react';
import { AlertType, AlertInterface } from '@/components/global/Alert';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<AlertInterface[]>([]);
  
  const createAlert = (title: string, description: string, type: AlertType, timeout: number = 3000) => {
    setAlerts(prev => [...prev, {title: title, description:description, type: type, status: "show", timeout: timeout}]);
  }

  const deleteAlerts = () => {
    setAlerts([]);
  }

  const updateAlert = (index: number, alert : AlertInterface) => {
    setAlerts(prev => {
      const updateAlerts = [...prev];
      updateAlerts[index] = alert;
      return updateAlerts;
    });
  }

  return {alerts, createAlert, updateAlert, deleteAlerts}
}