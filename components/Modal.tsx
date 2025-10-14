import React from 'react';
import { CloseIcon } from './icons/Icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '6xl';
}

const Modal = ({ title, onClose, children, size = 'md' }: ModalProps) => {
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
          <button onClick={onClose} className="text-black hover:text-black p-1 rounded-full hover:bg-gray-100">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;