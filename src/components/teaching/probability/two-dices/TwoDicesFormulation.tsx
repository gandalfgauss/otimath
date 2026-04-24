import React from "react";
import { Event, OperationSelectInputs, ProbabilitiesTextInputs } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { TwoDicesEvents } from "./TwoDicesEvents";
import { TwoDicesCalculations } from "./TwoDicesCalculations";

interface TwoDicesFormulationProps {
 events: Event[],
 textsInputs: ProbabilitiesTextInputs
 selectInputs: OperationSelectInputs
 /** Opcional — cores por nome de evento (propagado para TwoDicesEvents). */
 eventColors?: Record<string, string>;
 /** Opcional — rótulos React customizados por nome (propagado). */
 eventLabels?: Record<string, React.ReactNode>;
}

export function TwoDicesFormulation({
  events,
  textsInputs,
  selectInputs,
  eventColors,
  eventLabels,
}: Readonly<TwoDicesFormulationProps>) {

  return (
    <div className={`w-full flex flex-col gap-lg max-lg:max-w-[438px] max-lg:items-center max-lg:self-center max-lg:gap-xxs`
      }
    >
      <TwoDicesEvents events={events} eventColors={eventColors} eventLabels={eventLabels} />
      <TwoDicesCalculations
        textInputs={textsInputs}
        selectInputs={selectInputs}
        eventColors={eventColors}
        eventLabels={eventLabels}
      />
    </div>
  );
}


/* Example

<TwoDicesFormulation events="" />

*/
