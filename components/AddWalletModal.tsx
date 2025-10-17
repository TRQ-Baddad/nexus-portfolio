import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { Blockchain } from '../types';
import { BLOCKCHAIN_METADATA, EVM_CHAINS } from '../constants';
import { UpgradeNotice } from './shared/UpgradeNotice';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';


const chainOptions: Blockchain[] = ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'];

const validateAddress = (address: string, chain: Blockchain): string | null => {
    if (!address.trim()) {
        return 'Address cannot be empty.';
    }

    if (EVM_CHAINS.includes(chain)) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return "Must be a 42-character hexadecimal string starting with '0x'.";
        }
    } else if (chain === 'solana') {
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
            return 'Must be a valid Base58 encoded address, 32-44 characters long.';
        }
    } else if (chain === 'bitcoin') {
        if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address)) {
            return 'Must be a valid Bitcoin address (e.g., starts with 1, 3, or bc1).';
        }
    }
    
    return null; // Address is valid
};

export const AddWalletModal: React.FC = () => {
  const { 
    isAddWalletModalOpen, 
    setIsAddWalletModalOpen, 
    addWallet, 
    displayedUser, 
    wallets, 
    setIsUpgradeModalOpen 
  } = useAppContext();

  const [selectedChain, setSelectedChain] = useState<Blockchain>('ethereum');
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  
  const freeTierLimit = 3;
  const shouldShowUpgradeNotice = displayedUser?.plan === 'Free' && wallets.length >= freeTierLimit;

  const onClose = () => setIsAddWalletModalOpen(false);
  const onUpgrade = () => {
    onClose();
    setIsUpgradeModalOpen(true);
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isAddWalletModalOpen) {
        setTimeout(() => {
            setSelectedChain('ethereum');
            setAddress('');
            setNickname('');
            setError('');
        }, 200); // Delay to allow for closing animation
    }
  }, [isAddWalletModalOpen]);

  const handleAdd = useCallback(() => {
    const validationError = validateAddress(address, selectedChain);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    addWallet({
      blockchain: selectedChain,
      address,
      nickname,
    });
  }, [address, selectedChain, nickname, addWallet]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if(error) setError('');
  }
  
  const handleChainChange = (chain: Blockchain) => {
    setSelectedChain(chain);
    setAddress('');
    setError('');
  };

  return (
    <Modal isOpen={isAddWalletModalOpen} onClose={onClose} title={shouldShowUpgradeNotice ? "Upgrade to Pro" : "Add New Wallet"}>
        {shouldShowUpgradeNotice ? (
             <UpgradeNotice
                onUpgrade={onUpgrade}
                title="Unlock Unlimited Wallets"
                description={`You've reached the ${freeTierLimit}-wallet limit for the Free plan. Upgrade to Pro to add unlimited wallets and access powerful features.`}
            />
        ) : (
            <div className="space-y-6">
                <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Blockchain</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {chainOptions.map(chain => {
                    const metadata = BLOCKCHAIN_METADATA[chain];
                    const Icon = metadata.icon;
                    const isSelected = selectedChain === chain;
                    return (
                        <button
                        key={chain}
                        onClick={() => handleChainChange(chain)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                            isSelected ? 'border-brand-blue bg-brand-blue/10' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                        }`}
                        >
                        <Icon className="w-8 h-8 mb-2" />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-brand-blue dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>{metadata.name}</span>
                        </button>
                    );
                    })}
                </div>
                </div>

                <div>
                <label htmlFor="address" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Wallet Address
                </label>
                <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={handleAddressChange}
                    placeholder={
                        selectedChain === 'ethereum' ? '0x...' : 
                        selectedChain === 'solana' ? 'Sol...' : 
                        'bc1...'
                    }
                    className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
                />
                </div>

                <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Nickname (Optional)
                </label>
                <input
                    type="text"
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g., My Main Wallet"
                    className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
                </div>

                {error && <p className="text-sm text-error animate-fade-in">{error}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Wallet</Button>
                </div>
            </div>
        )}
    </Modal>
  );
};