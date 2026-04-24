import React from "react";
import { Event } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";

interface TwoDicesEventsProps {
 events: Event[];
 /** Opcional — cores por nome de evento. Aplica color no name e
  *  herda para a descrição, permitindo destaque (ex.: A azul royal,
  *  Ā laranja queimado na seção de Eventos Complementares). */
 eventColors?: Record<string, string>;
 /** Opcional — rótulos React customizados por nome (ex.: <BarA />). */
 eventLabels?: Record<string, React.ReactNode>;
}

export function TwoDicesEvents({
  events,
  eventColors,
  eventLabels,
}: Readonly<TwoDicesEventsProps>) {

  return (
    <div className="w-full min-h-[205px] rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Evento(s)</h3>
      <div className="flex flex-col">
        {events.map((event, index) => {
          const nameKey = event.name ?? '';
          const color = eventColors?.[nameKey];
          const label = eventLabels?.[nameKey];
          return (
            <span key={index}
              className={`pt-micro pb-micro pl-quarck pr-quarck text-neutral-dark border-neutral-lightest solid border-b-hairline
                odd:bg-feedback-info-lightest ds-body-bold
              `}
              style={color ? { color } : undefined}
            >
              <span
                className="ds-body-bold"
                style={{
                  color: color ?? undefined,
                }}
              >
                {label ?? event.name}
              </span>
              {' = '}
              {event.description}
            </span>
          );
        })}
      </div>
    </div>
  );
}


/* Example

<TwoDicesEvents events="" />

*/
