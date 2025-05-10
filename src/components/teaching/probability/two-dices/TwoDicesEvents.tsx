import { Event } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
interface TwoDicesEvents {
 events: Event[]
}

export function TwoDicesEvents({
  events,
}: Readonly<TwoDicesEvents>) {

  return (
    <div className="w-full rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Eventos(s)</h3>
      <div className="flex flex-col">
        {events.map((event, index) => {
          return (
            <span key={index} 
              className={`pt-micro pb-micro pl-quarck text-neutral-dark border-neutral-lightest solid border-b-hairline
                odd:bg-feedback-info-lightest ds-body-bold
              `}

            >
              <span className="ds-body-bold text-brand-otimath-medium">{event.name}</span> = {event.description}
            </span>
          )
        })}
      </div>
    </div>
  );
}


/* Example 

<TwoDicesFormulation events="" />

*/