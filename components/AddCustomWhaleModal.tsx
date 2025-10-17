import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { Blockchain, User, WhaleWallet } from '../types';
import { BLOCKCHAIN_METADATA, EVM_CHAINS } from '../constants';
import { UpgradeNotice } from './shared/UpgradeNotice';


interface AddCustomWhaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWhale: (whale: { address: string; blockchain: Blockchain; name: string; }) => void;
  existingWhales: WhaleWallet[];
  user: User | null;
  onUpgrade: () => void;
}

const chainOptions: Blockchain[] = ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'];

const validateAddress = (address: string, chain: Blockchain, existing: WhaleWallet[]): string | null => {
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

    if (existing.some(w => w.address.toLowerCase() === address.toLowerCase() && w.blockchain === chain)) {
        return 'This wallet is already in your watchlist.';
    }
    
    return null; // Address is valid
};

export const AddCustomWhaleModal: React.FC<AddCustomWhaleModalProps> = ({ isOpen, onClose, onAddWhale, existingWhales, user, onUpgrade }) => {
  const [selectedChain, setSelectedChain] = useState<Blockchain>('ethereum');
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  
  const isFreeTier = user?.plan === 'Free';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => {
            setSelectedChain('ethereum');
            setAddress('');
            setNickname('');
            setError('');
        }, 200); // Delay to allow for closing animation
    }
  }, [isOpen]);

  const handleAdd = useCallback(() => {
    if (!nickname.trim()) {
        setError('Nickname is required.');
        return;
    }
    const validationError = validateAddress(address, selectedChain, existingWhales);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onAddWhale({
      blockchain: selectedChain,
      address,
      name: nickname,
    });
    onClose();
  }, [address, selectedChain, nickname, onAddWhale, existingWhales, onClose]);

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
    <Modal isOpen={isOpen} onClose={onClose} title={isFreeTier ? "Upgrade to Pro" : "Add Custom Wallet"}>
        {isFreeTier ? (
            <UpgradeNotice 
                onUpgrade={onUpgrade}
                title="Track Any Wallet"
                description="Upgrade to Pro to add any wallet to your Smart Money watchlist and get powerful insights."
                features={['Unlimited wallets', 'Track custom whale wallets', 'Whale activity alerts', 'Priority support']}
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
                <label htmlFor="whale-address" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Wallet Address
                </label>
                <input
                    type="text"
                    id="whale-address"
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
                <label htmlFor="whale-nickname" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Nickname
                </label>
                <input
                    type="text"
                    id="whale-nickname"
                    value={nickname}
                    onChange={(e) => {
                        setNickname(e.target.value);
                        if(error) setError('');
                    }}
                    placeholder="e.g., GCR's New Wallet"
                    className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
                </div>

                {error && <p className="text-sm text-error animate-fade-in">{error}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add to Watchlist</Button>
                </div>
            </div>
        )}
    </Modal>
  );
};