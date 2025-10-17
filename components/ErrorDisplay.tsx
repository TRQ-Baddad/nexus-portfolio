import React from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { Button } from './shared/Button';
import { RefreshCwIcon } from './icons/RefreshCwIcon';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="text-center mt-20 flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <AlertTriangleIcon className="w-8 h-8 text-error" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Something Went Wrong</h2>
      <p className="mb-6 text-neutral-600 dark:text-neutral-300 max-w-md">{message}</p>
      <Button onClick={onRetry}>
        <RefreshCwIcon className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
};
