import { TwoDicesEvents } from "./TwoDicesEvents";


interface TwoDicesFormulation {
 events: string[]
}

export function TwoDicesFormulation({
  events,
}: Readonly<TwoDicesFormulation>) {

  return (
    <div className={`w-full max-lg:max-w-[438px] max-lg:items-center self-center`
      }
    >
      <TwoDicesEvents events={events} />
    </div>
  );
}


/* Example 

<TwoDicesFormulation events="" />

*/