'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X } from "lucide-react";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";

export interface EventCheckboxes {
  [key: string]: {
    [key: string]: {
      value: boolean;
    }
  }
}

export function TwoDicesGame() {
  const eventsName = ['A', 'B', 'D'];
  const { eventsCheckboxes, updateEventsCheckboxes, resetEventsCheckboxes } = useTwoDicesHooks(eventsName);


  return (
    <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
      <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
        <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
          <Button style="secondary" size="small" icon={<RefreshCw />}>Novo</Button>
          <Button style="borderless" size="extra-small" icon={<X />} onClick={resetEventsCheckboxes}>Limpar</Button>
        </div>

        <div className="w-full overflow-auto max-h-[calc(100vh-68px)] snap-both snap-mandatory scroll-p-[50px] max-lg:flex max-lg:justify-center max-sm:justify-start">
          <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>
        </div>

        <div className="flex gap-x-xxxs items-center">
          <Button style="secondary" size="small" icon={<Check />}>Conferir</Button>
        </div>
      </div>
      <div className="w-full max-lg:max-w-[438px]">
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/