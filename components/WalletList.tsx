

import React from 'react';
import { Wallet } from '../types';
import { Card } from './shared/Card';
import { BLOCKCHAIN_METADATA } from '../constants';
import { Trash2Icon } from './icons/Trash2Icon';
import { Skeleton } from './shared/Skeleton';
import { EditIcon } from './icons/EditIcon';
import { useTranslation } from '../utils/formatters';

interface WalletListProps {
  wallets: Wallet[];
  loading: boolean;
  removeWallet: (id: string) => void;
  onEditWallet: (wallet: Wallet) => void;
}

const WalletItem: React.FC<{ wallet: Wallet, removeWallet: (id: string) => void, onEditWallet: (wallet: Wallet) => void }> = ({ wallet, removeWallet, onEditWallet }) => {
  const metadata = BLOCKCHAIN_METADATA[wallet.blockchain] || { icon: (() => null), name: 'Unknown', color: 'gray' };
  const Icon = metadata.icon;
  
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-lg transition-colors group">
      <div className="flex items-center space-x-3">
        <Icon className="w-8 h-8" />
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">{wallet.nickname || metadata.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}</p>
        </div>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEditWallet(wallet)} className="text-neutral-500 dark:text-neutral-400 hover:text-brand-blue transition-colors p-2 rounded-full hover:bg-brand-blue/10">
            <EditIcon className="w-4 h-4" />
        </button>
        <button onClick={() => removeWallet(wallet.id)} className="text-neutral-500 dark:text-neutral-400 hover:text-error transition-colors p-2 rounded-full hover:bg-error/10">
            <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const WalletList: React.FC<WalletListProps> = ({ wallets, loading, removeWallet, onEditWallet }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t('wallets')}</Card.Title>
        <Card.Description>{t('walletsDescription', { count: wallets.length })}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3 mt-1.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="animate-fade-in space-y-2">
              {wallets.map(wallet => <WalletItem key={wallet.id} wallet={wallet} removeWallet={removeWallet} onEditWallet={onEditWallet} />)}
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};
