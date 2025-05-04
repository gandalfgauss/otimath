'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X } from "lucide-react";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { Alerts } from "@/components/global/Alerts";
import { useAlerts } from "@/hooks/global/useAlerts";
import { Modal } from "@/components/global/Modal";
import { useModal } from "@/hooks/global/useModal";
import { TwoDicesFormulation } from "./TwoDicesFormulation";


export function TwoDicesGame() {
  const eventsName = ['A', 'B', 'D', 'F'];
  const {alerts, createAlert, updateAlert, deleteAlerts} = useAlerts();
  const {modal, updateModal} = useModal();
  const { eventsCheckboxes, updateEventsCheckboxes, resetEventsCheckboxes } = useTwoDicesHooks(eventsName);

  const dicesChecksClear = () => { 
    updateModal({
        title: "Limpando marcações", 
        description:"Você gostaria de limpar as marcações da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          createAlert("Dados limpos", "Todas as marcações foram limpas", "info");
          resetEventsCheckboxes();
        }
    });
  }

  return (
    <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
      <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
        <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
          <Button style="secondary" size="small" icon={<RefreshCw />}>Novo</Button>
          <Button style="borderless" size="extra-small" icon={<X />} onClick={dicesChecksClear}>Limpar</Button>
        </div>

        <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>
        
        <div className="flex gap-x-xxxs items-center">
          <Button style="secondary" size="small" icon={<Check />}>Conferir</Button>
        </div>
      </div>
      
      <TwoDicesFormulation events={eventsName}/>
      <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
      <Modal modal={modal} updateModal={updateModal}/>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/