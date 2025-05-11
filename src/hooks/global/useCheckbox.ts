import { useState} from 'react';
import { CheckboxInterface } from '@/components/global/Checkbox';

export const useCheckbox = () => {
  const [checkbox, setCheckbox] = useState<CheckboxInterface>({label: '', id: '', checked: false, disabled: false, onChange: () => {}});
  
  const updateCheckbox = (checkbox : CheckboxInterface) => {
    setCheckbox(checkbox);
  }

  return {checkbox, updateCheckbox}
}