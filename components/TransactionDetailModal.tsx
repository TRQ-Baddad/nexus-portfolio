import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Modal } from './shared/Modal';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownLeftIcon } from './icons/ArrowDownLeftIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { Button } from './shared/Button';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const useCopyToClipboard = (): [boolean, (text: string) => void] => {
    const [isCopied, setIsCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    return [isCopied, copy];
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
        <dd className="mt-1 text-sm text-neutral-900 dark:text-white sm:mt-0 sm:col-span-2">
            {children}
        </dd>
    </div>
);

const AddressRow: React.FC<{label: string; address: string; explorerUrl: string;}> = ({label, address, explorerUrl}) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
            <dd className="mt-1 text-sm text-neutral-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center space-x-2 group">
                <span className="font-mono break-all flex-grow">{address}</span>
                <div className="flex-shrink-0 flex items-center space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copy(address)} aria-label="Copy address" className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <CopyIcon className="w-4 h-4 text-neutral-400 "/>}
                    </button>
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer" aria-label="View on explorer" className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        <ExternalLinkIcon className="w-4 h-4 text-neutral-400" />
                    </a>
                </div>
            </dd>
        </div>
    )
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
    const { formatCurrency } = useUserPreferences();
    if (!transaction) return null;

    const { type, date, tokenSymbol, amount, valueUsd, fromAddress, toAddress, chain, hash } = transaction;
    const metadata = BLOCKCHAIN_METADATA[chain];
    const ChainIcon = metadata.icon;
    
    const typeMeta: Record<TransactionType, { icon: React.FC<any>, color: string, label: string }> = {
        send: { icon: ArrowUpRightIcon, color: 'text-error', label: 'Send' },
        receive: { icon: ArrowDownLeftIcon, color: 'text-success', label: 'Receive' },
        swap: { icon: RepeatIcon, color: 'text-blue-400', label: 'Swap' },
    };
    
    const TypeIcon = typeMeta[type].icon;
    const typeInfo = typeMeta[type];

    return (
        <Modal isOpen={!!transaction} onClose={onClose} title="Transaction Details">
            <div className="flex flex-col justify-between" style={{ minHeight: '300px' }}>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full ${typeInfo.color.replace('text-', 'bg-')}/20`}>
                            <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                        </span>
                        <div>
                            <p className={`text-lg font-bold text-neutral-900 dark:text-white`}>{typeInfo.label} {tokenSymbol}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {new Date(date).toLocaleString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 dark:border-neutral-700">
                        <dl className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            <DetailRow label="Amount">
                                <span className="font-semibold">{amount.toLocaleString()} {tokenSymbol}</span>
                            </DetailRow>
                            <DetailRow label="Value (at time of tx)">
                                <span>{formatCurrency(valueUsd)}</span>
                            </DetailRow>
                            <AddressRow label="From" address={fromAddress} explorerUrl={metadata.explorer.addressUrl(fromAddress)} />
                            <AddressRow label="To" address={toAddress} explorerUrl={metadata.explorer.addressUrl(toAddress)} />
                            <DetailRow label="Blockchain">
                                <div className="flex items-center space-x-2">
                                    <ChainIcon className="w-5 h-5" />
                                    <span>{metadata.name}</span>
                                </div>
                            </DetailRow>
                        </dl>
                    </div>
                </div>
                 <div className="mt-6">
                     <a
                        href={metadata.explorer.txUrl(hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                    >
                        <Button className="w-full">
                            View on Explorer
                            <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </Button>
                    </a>
                </div>
            </div>
        </Modal>
    );
};
