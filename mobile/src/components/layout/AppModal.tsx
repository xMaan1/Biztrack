import React from 'react';
import { Modal, type ModalProps } from 'react-native';

type AppModalProps = Omit<ModalProps, 'onRequestClose'> & {
  onClose?: () => void;
};

export function AppModal({ onClose, children, ...props }: AppModalProps) {
  return (
    <Modal {...props} onRequestClose={onClose ?? (() => {})}>
      {children}
    </Modal>
  );
}
