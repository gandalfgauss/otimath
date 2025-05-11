import { Event } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { TwoDicesEvents } from "./TwoDicesEvents";
import { TwoDicesCalculations } from "./TwoDicesCalculations";

interface TwoDicesFormulationProps {
 events: Event[]
}

export function TwoDicesFormulation({
  events,
}: Readonly<TwoDicesFormulationProps>) {

  return (
    <div className={`w-full flex flex-col gap-lg max-lg:max-w-[438px] max-lg:items-center max-lg:self-center max-lg:gap-xxs`
      }
    >
      <TwoDicesEvents events={events} />
      <TwoDicesCalculations events={events} />
    </div>
  );
}


/* Example 

<TwoDicesFormulation events="" />

*/