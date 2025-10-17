

import React, { useState } from 'react';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface CopyableAddressProps {
  address: string;
}

export const CopyableAddress: React.FC<CopyableAddressProps> = ({ address }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when copying
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <button
      onClick={handleCopy}
      className="group relative flex items-center space-x-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 rounded px-1 py-0.5 -ml-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      aria-label="Copy address"
    >
      <span>{truncatedAddress}</span>
      {isCopied ? (
        <CheckIcon className="w-3.5 h-3.5 text-success flex-shrink-0" />
      ) : (
        <CopyIcon className="w-3.5 h-3.5 text-neutral-500 transition-opacity opacity-0 group-hover:opacity-100 flex-shrink-0" />
      )}
       <span className="absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-neutral-800 dark:bg-neutral-900 text-white text-xs font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {isCopied ? 'Copied!' : 'Copy address'}
      </span>
    </button>
  );
};
