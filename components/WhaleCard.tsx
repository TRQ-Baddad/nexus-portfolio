import React from 'react';
import { WhaleWallet } from '../types';
import { Button } from './shared/Button';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Skeleton } from './shared/Skeleton';


interface WhaleCardProps {
    whale: WhaleWallet;
    onView: () => void;
    onRemove: (id: string) => void;
}

export const WhaleCard: React.FC<WhaleCardProps> = ({ whale, onView, onRemove }) => {
    const metadata = BLOCKCHAIN_METADATA[whale.blockchain] || { icon: (() => null), name: 'Unknown', color: 'gray' };
    const Icon = metadata.icon;
    const change24h = whale.change24h ?? 0;
    const isPositive = change24h >= 0;
    const totalValue = whale.totalValue ?? 0;
    const { formatCurrency } = useUserPreferences();

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(whale.id);
    }

    if (whale.isLoading) {
        return (
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/50 space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                     <Skeleton className="h-16 w-full" />
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/50 flex flex-col justify-between space-y-4 transition-all hover:border-brand-blue/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 relative group hover:-translate-y-1 hover:shadow-xl">
            {whale.isCustom && (
                <>
                    <span className="absolute top-3 right-3 text-xs font-bold bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full">
                        Custom
                    </span>
                     <button onClick={handleRemove} className="absolute top-2.5 right-12 text-neutral-400 hover:text-error transition-colors p-2 rounded-full opacity-0 group-hover:opacity-100">
                        <Trash2Icon className="w-4 h-4" />
                    </button>
                </>
            )}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <Icon className="w-8 h-8" />
                        <div>
                            <p className="font-semibold text-neutral-900 dark:text-white pr-12">{whale.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{`${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`}</p>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed h-20">{whale.description}</p>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
                 <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Portfolio Value</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatCurrency(totalValue)}</p>
                    <div className={`flex items-center text-xs font-medium mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                      {isPositive ? <ArrowUpRightIcon className="w-3 h-3 mr-1" /> : <ArrowDownRightIcon className="w-3 h-3 mr-1" />}
                      <span>{change24h.toFixed(2)}% in 24h</span>
                    </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={onView}>View Portfolio</Button>
            </div>
        </div>
    )
}