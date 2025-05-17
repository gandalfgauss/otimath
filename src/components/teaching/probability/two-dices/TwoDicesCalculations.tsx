import { TextInput } from "@/components/global/TextInput";
import { ProbabilitiesTextInputs } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";

interface TwoDicesCalculationsProps {
 textInputs: ProbabilitiesTextInputs
}

export function TwoDicesCalculations({
  textInputs,
}: Readonly<TwoDicesCalculationsProps>) {

  return (
    <div className="w-full min-h-[230px] rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Cálculo(s)</h3>
      <div className="flex flex-col pt-micro pb-micro pl-quarck pr-quarck">
        {textInputs?.eventName &&
          <div className="flex flex-col gap-xxxs justify-center">
            <div className="flex gap-micro items-center">
              <span className="ds-body-bold text-brand-otimath-medium">{`P(${textInputs.eventName}) = `}</span>
              <div className="flex flex-col gap-nano items-center">
                  <TextInput textInput={{
                      styles: "w-[40px] h-[30px] text-center",
                      value: textInputs.numerator.value,
                      disabled: textInputs.numerator.disabled,
                      min:"0",
                      max:"36",
                      required: true,
                      error: textInputs.numerator.error,
                      type:"natural-number",
                      setValue: textInputs.numerator.setValue,
                    }}
                  />
                <hr className="w-full h-[2px] bg-neutral-black" />

                <TextInput textInput={{
                      styles: "w-[40px] h-[30px] text-center",
                      value: textInputs.denominator.value,
                      disabled: textInputs.denominator.disabled,
                      min:"1",
                      max:"36",
                      required: true,
                      error: textInputs.denominator.error,
                      type:"natural-number",
                      setValue: textInputs.denominator.setValue,
                    }}
                />
              </div>
            </div>

            {textInputs.hasComplementary && 
              <div className="flex gap-micro items-center">
                <span className="ds-body-bold text-brand-otimath-medium">{`P(${textInputs.eventName}\u0305) = `}</span>
                <div className="flex flex-col gap-nano items-center">
                    <TextInput textInput={{
                        styles: "w-[40px] h-[30px] text-center",
                        value: textInputs.complementaryNumerator?.value,
                        disabled: textInputs.complementaryNumerator?.disabled,
                        min:"0",
                        max:"36",
                        required: true,
                        error: textInputs.complementaryNumerator?.error,
                        type:"natural-number",
                        setValue: textInputs.complementaryNumerator?.setValue,
                      }}
                    />
                  <hr className="w-full h-[2px] bg-neutral-black" />

                  <TextInput textInput={{
                        styles: "w-[40px] h-[30px] text-center",
                        value: textInputs.complementaryDenominator?.value,
                        disabled: textInputs.complementaryDenominator?.disabled,
                        min:"1",
                        max:"36",
                        required: true,
                        error: textInputs.complementaryDenominator?.error,
                        type:"natural-number",
                        setValue: textInputs.complementaryDenominator?.setValue,
                      }}
                  />
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  );
}


/* Example 

<TwoDicesCalculations events="" />

*/