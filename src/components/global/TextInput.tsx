'use client'

export interface TextInputInterface {
  label?: string;
  value?: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  type?: "natural-number";
  helperText?: string;
  required?: boolean;
  error?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  styles?: string
}

interface TextInputProps {
  textInput: TextInputInterface;
}

export function TextInput({
  textInput,
}: Readonly<TextInputProps>) {
  return (
    <fieldset className="flex flex-col gap-y-nano">
      {textInput.label && <label className="ds-small-bold cursor-pointer" htmlFor={textInput.id}>{textInput.label}</label>}
      <input 
        id={textInput.id} type="text" 
        value={textInput.value} 
        inputMode={textInput.type == "natural-number" ? "numeric" : "text"}
        onChange={(event) => {
            textInput?.onChange?.(event);
            let value = event.currentTarget.value;
            textInput.setValue!(value);

            if(textInput.type == "natural-number") {
              value = value.replace(/\D/g, '');
              textInput.setValue!(value);

              if (textInput.min && parseInt(value) < parseInt(textInput.min)) {
                textInput.setValue!(textInput.min);
              }

              if (textInput.max && parseInt(value) > parseInt(textInput.max)) {
                textInput.setValue!(textInput.max);
              }
            }
          }
        }
        {...(textInput.required ? { required: true } : {})}
        {...(textInput.disabled ? { disabled: true } : {})}
        placeholder={textInput.placeholder}
        className={`p-micro border-solid border-hairline rounded-sm
          outline-none bg-neutral-transparent ${textInput.value ? 'text-neutral-dark' : 'text-neutral-medium'} 
          transition-[border-color] duration-300 ease-in-out hover:border-neutral-medium focus:border-brand-otimath-pure
          disabled:opacity-level-light disabled:pointer-events-none
          ${textInput.error ? 'border-feedback-error-dark' : 'border-neutral-light'} ${textInput.styles ?? ``}
        `}
      >
      </input>
      {(textInput.error && textInput.helperText) && <small className="text-feedback-error-dark">{textInput.helperText}</small>}
    </fieldset>
  );
}

/* Example 

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

*/