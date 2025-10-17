import React from 'react';
import { Button } from './shared/Button';
import { WalletIcon } from './icons/WalletIcon';
import { PlusIcon } from './icons/PlusIcon';
import { BLOCKCHAIN_METADATA } from '../constants';

interface EmptyStateProps {
  onAddWallet: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddWallet }) => {
  const chainsToShow = ['ethereum', 'solana', 'bitcoin', 'polygon', 'base'];

  return (
    <div className="text-center mt-12 flex flex-col items-center p-4 animate-fade-in">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 mb-6 text-brand-blue">
        <WalletIcon className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">Welcome to Nexus Portfolio</h2>
      <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-300 max-w-xl">
        Connect your first wallet to see the magic happen. Aggregate all your assets from multiple chains into a single, beautiful dashboard.
      </p>
      
      <Button onClick={onAddWallet} className="px-8 py-3 text-base">
        <PlusIcon className="w-5 h-5 mr-2" />
        Add Your First Wallet
      </Button>

      <div className="mt-12 w-full max-w-md">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Supported Chains</p>
        <div className="flex justify-center items-center space-x-6 mt-4">
            {chainsToShow.map(chain => {
                const metadata = BLOCKCHAIN_METADATA[chain as keyof typeof BLOCKCHAIN_METADATA];
                const Icon = metadata.icon;
                return (
                    <div key={chain} className="flex flex-col items-center group">
                        <Icon className="w-8 h-8 transition-transform group-hover:scale-110" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{metadata.name}</span>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};
