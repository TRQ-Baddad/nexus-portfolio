import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../icons/XIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'lg' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
      lg: 'max-w-lg',
      '2xl': 'max-w-2xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

      <div className={`relative w-full ${sizeClasses[size]} my-auto mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in flex flex-col max-h-[90vh]`}>
        <div className="flex items-start justify-between p-5 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white" id="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="p-1 text-neutral-500 dark:text-neutral-400 bg-transparent rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};