import { useCallback, useState} from 'react';
import {ModalInterface } from '@/components/global/Modal';

export const useModal = () => {
  const [modal, setModal] = useState<ModalInterface>({title: '', description: '', status: 'hide'});
  
  const updateModal = useCallback((modal : ModalInterface) => {
    setModal(modal);
  }, []);

  return {modal, updateModal}
}