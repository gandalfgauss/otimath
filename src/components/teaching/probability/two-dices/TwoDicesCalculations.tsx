import { TextInput } from "@/components/global/TextInput";
import { Event } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { useState } from "react";

interface TwoDicesCalculationsProps {
 events?: Event[]
}

export function TwoDicesCalculations({
  events,
}: Readonly<TwoDicesCalculationsProps>) {
  console.log(events)

  const [inputValue, setInputValue] = useState("");
  const [ inputError, setInputError ] = useState(false);

  return (
    <div className="w-full min-h-[230px] rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Cálculo(s)</h3>
      <div className="flex flex-col">
        <TextInput value={inputValue} label="Teste" id="Teste" disabled={false} 
          min="0" max="36" placeholder="Digite um número" helperText="Digite um número entre 0 e 36"
          required={true} error={inputError}
          onChange={() => {
            setInputError(true);
            console.log(inputValue);
          }}
          type="natural-number"
          setValue={(value) => setInputValue(value)}
        />
      </div>
    </div>
  );
}


/* Example 

<TwoDicesCalculations events="" />

*/