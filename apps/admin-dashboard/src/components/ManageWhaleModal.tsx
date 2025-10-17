import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { WhaleWallet, Blockchain } from '../../../../types';
import { BLOCKCHAIN_METADATA, EVM_CHAINS } from '../../../../constants';

type SavePayload = Omit<WhaleWallet, 'id' | 'totalValue' | 'change24h' | 'created_at' | 'isCustom'> & { id?: string };

interface ManageWhaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (whale: SavePayload) => Promise<void>;
    whaleToEdit: WhaleWallet | null;
}

const chainOptions: Blockchain[] = ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'];

const validateAddress = (address: string, chain: Blockchain): string | null => {
    if (!address.trim()) return 'Address cannot be empty.';
    if (EVM_CHAINS.includes(chain) && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return "Must be a 42-character hexadecimal string starting with '0x'.";
    }
    if (chain === 'solana' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return 'Must be a valid Base58 encoded address, 32-44 characters long.';
    }
    if (chain === 'bitcoin' && !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address)) {
        return 'Must be a valid Bitcoin address (e.g., starts with 1, 3, or bc1).';
    }
    return null;
};

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (e: boolean) => void; }> = ({ label, enabled, setEnabled }) => (
    <div className="flex items-center justify-between">
        <label className="font-medium text-neutral-800 dark:text-neutral-200">{label}</label>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-blue' : 'bg-neutral-300 dark:bg-neutral-600'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


export const ManageWhaleModal: React.FC<ManageWhaleModalProps> = ({ isOpen, onClose, onSave, whaleToEdit }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [blockchain, setBlockchain] = useState<Blockchain>('ethereum');
    const [description, setDescription] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!whaleToEdit;

    useEffect(() => {
        if (isOpen && whaleToEdit) {
            setName(whaleToEdit.name);
            setAddress(whaleToEdit.address);
            setBlockchain(whaleToEdit.blockchain);
            setDescription(whaleToEdit.description);
            setIsFeatured(whaleToEdit.isFeatured ?? false);
        } else if (!isOpen) {
            setTimeout(() => {
                setName('');
                setAddress('');
                setBlockchain('ethereum');
                setDescription('');
                setIsFeatured(false);
                setError('');
                setIsSaving(false);
            }, 200);
        }
    }, [isOpen, whaleToEdit]);

    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        const validationError = validateAddress(address, blockchain);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave({
                id: whaleToEdit?.id,
                name,
                address,
                blockchain,
                description,
                isFeatured,
            });
            onClose();
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    }, [name, address, blockchain, description, isFeatured, whaleToEdit, onSave, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Whale Wallet' : 'Add Whale Wallet'}>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Blockchain</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {chainOptions.map(chain => {
                            const metadata = BLOCKCHAIN_METADATA[chain];
                            const Icon = metadata.icon;
                            return (
                                <button
                                    key={chain}
                                    onClick={() => setBlockchain(chain)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                                        blockchain === chain ? 'border-brand-blue bg-brand-blue/10' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                                    }`}
                                >
                                    <Icon className="w-8 h-8 mb-2" />
                                    <span className={`text-xs font-semibold ${blockchain === chain ? 'text-brand-blue dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>{metadata.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label htmlFor="whale-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Name</label>
                    <input
                        type="text"
                        id="whale-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Justin Sun"
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="whale-address" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Address</label>
                    <input
                        type="text"
                        id="whale-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="0x..."
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
                    />
                </div>

                <div>
                    <label htmlFor="whale-desc" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Description</label>
                    <textarea
                        id="whale-desc"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A brief description of this wallet..."
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>

                <div className="pt-2">
                    <ToggleSwitch label="Featured Whale" enabled={isFeatured} setEnabled={setIsFeatured} />
                </div>

                {error && <p className="text-sm text-error animate-fade-in">{error}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Whale')}</Button>
                </div>
            </div>
        </Modal>
    );
};