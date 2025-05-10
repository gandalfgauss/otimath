import { Event } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { TwoDicesEvents } from "./TwoDicesEvents";

interface TwoDicesFormulation {
 events: Event[]
}

export function TwoDicesFormulation({
  events,
}: Readonly<TwoDicesFormulation>) {

  return (
    <div className={`w-full max-lg:max-w-[438px] max-lg:items-center max-lg:self-center`
      }
    >
      <TwoDicesEvents events={events} />
    </div>
  );
}


/* Example 

<TwoDicesFormulation events="" />

*/