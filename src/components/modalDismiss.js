import { createContext, useContext } from 'react';

/** 弹层内的「先退场、再执行」通道 */
export const ModalDismiss = createContext(null);
export const useModalDismiss = () => useContext(ModalDismiss);
