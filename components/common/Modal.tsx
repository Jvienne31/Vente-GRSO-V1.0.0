
import React from 'react';
import { IconX } from '../icons/IconComponents';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={onClose}>
      <div
        className="bg-surface rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <IconX />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
