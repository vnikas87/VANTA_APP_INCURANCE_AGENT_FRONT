import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import type { ReactNode } from 'react';

type AppModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

function AppModal({ isOpen, title, onClose, footer, children }: AppModalProps) {
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      {footer ? <ModalFooter>{footer}</ModalFooter> : null}
    </Modal>
  );
}

export default AppModal;
