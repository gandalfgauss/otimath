'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { Alerts } from "@/components/global/Alerts";
import { Modal } from "@/components/global/Modal";
import { TwoDicesFormulation } from "./TwoDicesFormulation";
import { TextBlock } from "@/components/global/TextBlock";

export function TwoDicesGame() {
  const { 
    instructions,
    resetGameOnClick,
    disabledClearButton, dicesChecksClearOnClick, 
    disabledCheckButton, checkOnClick, 
    disabledNextStepButton, goToNextStepOnClick, 
    activeEvents, eventsCheckboxes, updateEventsCheckboxes,  
    operationSelectInputs, probabilitiesTextInputs, 
    alerts, updateAlert, deleteAlerts,
    modal, updateModal
  } = useTwoDicesHooks();

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock 
        paragraph={instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
            <Button style="secondary" size="small" icon={<RefreshCw />} onClick={resetGameOnClick}>Novo</Button>
            <Button style="borderless" size="extra-small" icon={<X />} onClick={dicesChecksClearOnClick} disabled={disabledClearButton}>Limpar</Button>
          </div>

          <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>
          
          <div className="flex gap-xxxs items-center">
            <Button style="secondary" size="small" icon={<Check />} onClick={checkOnClick} disabled={disabledCheckButton}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight />} onClick={goToNextStepOnClick} disabled={disabledNextStepButton}>Próximo Desafio</Button>
          </div>
        </div>
        <TwoDicesFormulation events={activeEvents} textsInputs={probabilitiesTextInputs} selectInputs={operationSelectInputs}/>
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
        <Modal modal={modal} updateModal={updateModal}/>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/