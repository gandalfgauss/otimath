'use client'

export interface CheckboxInterface {
  label?: string;
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

interface CheckboxProps {
  checkbox: CheckboxInterface;
}

export function Checkbox({
  checkbox
}: Readonly<CheckboxProps>) {
  return (
    <fieldset className="flex flex-col gap-y-nano">
      <label className="ds-small cursor-pointer" htmlFor={checkbox.id}>{checkbox.label}</label>
      <input id={checkbox.id} type="checkbox" checked={checkbox.checked} onChange={(e) => {checkbox?.onChange?.(e.currentTarget.checked)}} {...(checkbox.disabled ? { disabled: true } : {})}
        className={`cursor-pointer w-[20px] h-[20px] relative appearance-none border-solid border-thin border-neutral-medium rounded-sm
          bg-neutral-transparent transition-[background-color,border-color] duration-300 ease-in-out 
          hover:not-checked:border-brand-otimath-pure hover:not-checked:bg-brand-otimath-lighter checked:bg-brand-otimath-pure checked:border-brand-otimath-pure
          after:absolute after:z-2 
          after:top-[50%] after:left-[50%] after:transform after:-translate-x-[55%] after:-translate-y-[65%] after:rotate-45 
          after:w-[8px] after:h-[12px] after:border-solid after:border-neutral-white 
          after:scale-0 after:bg-neutral-transparent
          after:transition-[scale] after:duration-300 after:ease-in-out after:border-r-thin after:border-b-thin 
          checked:after:scale-100 disabled:opacity-level-light disabled:pointer-events-none
        `}
      >
      </input>
    </fieldset>
  );
}

/* Example 

<Checkbox label="A" id={`checkbox-A-${rowIndex+1}-${colIndex}`}/> 

*/