'use client'

import { useCallback, useState } from 'react';

export interface SelectInputInterface {
  label?: string;
  value?: string;
  setValue?: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  helperText?: string;
  required?: boolean;
  error?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  styles?: string;
  options?: {value: string, label: string}[];
}

interface SelectInputProps {
  selectInput: SelectInputInterface;
}

export function SelectInput({
  selectInput,
}: Readonly<SelectInputProps>) {
  const [changeOption, setChangeOption] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setChangeOption(true);
    selectInput?.onChange?.(event);
    selectInput.setValue?.(event.currentTarget.value);
  }, [selectInput]);

  return (
    <fieldset className="flex flex-col gap-y-nano">
      {selectInput.label && (
        <label className="ds-small-bold cursor-pointer" htmlFor={selectInput.id}>
          {selectInput.label}
        </label>
      )}
      <select 
        id={selectInput.id}
        value={selectInput.value}
        onChange={handleChange}
        required={selectInput.required}
        disabled={selectInput.disabled}
        className={`border-solid border-hairline rounded-sm
          outline-none bg-neutral-transparent ${changeOption ? 'text-neutral-dark' : 'text-neutral-medium'} 
          transition-[border-color] duration-300 ease-in-out hover:border-neutral-medium focus:border-brand-otimath-pure
          disabled:opacity-level-light disabled:pointer-events-none
          ${selectInput.error ? 'border-feedback-error-dark' : 'border-neutral-light'} ${selectInput.styles ?? ''}
        `}
      >
        {selectInput.placeholder && (
          <option value={selectInput.placeholder} disabled hidden={selectInput.value != selectInput.placeholder}>
            {selectInput.placeholder}
          </option>
        )}
        {selectInput.options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectInput.error && selectInput.helperText && (
        <small className="text-feedback-error-dark">{selectInput.helperText}</small>
      )}
    </fieldset>
  );
}

/* Example

<SelectInput
  selectInput={{ 
    value: inputValue,
    label: "Teste",
    id: "Teste",
    disabled: false,
    placeholder: "Placeholder",
    helperText: "Digite um número entre 0 e 36",
    required: true,
    error: inputError,
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
      setInputError(true);
      console.log(event.currentTarget.value);
    },
    setValue: (value : string) => setInputValue(value),
    options: [{value: "1", label: "1"}, {value: "2", label: "2"}, {value: "3", label: "3"}]
  }}
/>

*/