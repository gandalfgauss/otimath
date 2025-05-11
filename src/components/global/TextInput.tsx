'use client'

interface TextInputProps {
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
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TextInput({
  label,
  value,
  setValue,
  placeholder,
  id,
  disabled,
  min,
  max,
  type,
  helperText,
  required,
  error,
  onChange,
}: Readonly<TextInputProps>) {
  return (
    <fieldset className="flex flex-col gap-y-nano">
      {label && <label className="ds-small-bold cursor-pointer" htmlFor={id}>{label}</label>}
      <input 
        id={id} type="text" 
        value={value} 
        inputMode={type == "natural-number" ? "numeric" : "text"}
        onChange={(event) => {
            onChange(event);
            let value = event.currentTarget.value;
            setValue!(value);

            if(type == "natural-number") {
              value = value.replace(/\D/g, '');
              console.log("novo value", value)
              setValue!(value);

              if (min && parseInt(value) < parseInt(min)) {
                setValue!(min);
              }

              if (max && parseInt(value) > parseInt(max)) {
                setValue!(max);
              }
            }
          }
        }
        {...(required ? { required: true } : {})}
        {...(disabled ? { disabled: true } : {})}
        placeholder={placeholder}
        className={`p-micro w-full border-solid border-hairline rounded-sm
          outline-none bg-neutral-transparent ${value ? 'text-neutral-dark' : 'text-neutral-medium'} 
          transition-[border-color] duration-300 ease-in-out hover:border-neutral-medium focus:border-brand-otimath-pure
          disabled:opacity-level-light disabled:pointer-events-none
          ${error ? 'border-feedback-error-dark' : 'border-neutral-light'}
        `}
      >
      </input>
      {(error && helperText) && <small className="text-feedback-error-dark">{helperText}</small>}
    </fieldset>
  );
}

/* Example 

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

*/