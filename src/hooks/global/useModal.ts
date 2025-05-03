import { useState} from 'react';
import {ModalInterface } from '@/components/global/Modal';

export const useModal = () => {
  const [modal, setModal] = useState<ModalInterface>({title: '', description: '', status: 'hide'});
  
  const updateModal = (modal : ModalInterface) => {
    setModal(modal);
  }

  return {modal, updateModal}
}