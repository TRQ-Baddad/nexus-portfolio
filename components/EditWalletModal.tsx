import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { Wallet } from '../types';
import { BLOCKCHAIN_METADATA } from '../constants';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

export const EditWalletModal: React.FC = () => {
  const { walletToEdit, setWalletToEdit, updateWallet } = useAppContext();
  const [nickname, setNickname] = useState('');

  const isOpen = !!walletToEdit;
  const onClose = () => setWalletToEdit(null);

  useEffect(() => {
    if (isOpen && walletToEdit) {
      setNickname(walletToEdit.nickname || '');
    } else {
        setTimeout(() => {
            setNickname('');
        }, 200); // Delay to allow for closing animation
    }
  }, [isOpen, walletToEdit]);

  const handleUpdate = useCallback(() => {
    if (!walletToEdit) return;
    updateWallet(walletToEdit.id, { nickname });
  }, [nickname, walletToEdit, updateWallet]);

  if (!walletToEdit) return null;

  const metadata = BLOCKCHAIN_METADATA[walletToEdit.blockchain];
  const Icon = metadata.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Wallet">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Wallet</label>
          <div className="flex items-center space-x-3 p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
            <Icon className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">{metadata.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">{walletToEdit.address}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="nickname-edit" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Nickname
          </label>
          <input
            type="text"
            id="nickname-edit"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g., My Main Wallet"
            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};