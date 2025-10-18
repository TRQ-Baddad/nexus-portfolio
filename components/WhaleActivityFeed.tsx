import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Skeleton } from './shared/Skeleton';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownLeftIcon } from './icons/ArrowDownLeftIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { CopyableAddress } from './shared/CopyableAddress';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { formatRelativeTime } from '../utils/formatters';
import { Badge } from './shared/Badge';
import { SearchIcon } from './icons/SearchIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';

interface WhaleActivityFeedProps {
    transactions: Transaction[];
    loading: boolean;
    whaleAddresses: string[];
}

const typeMeta: Record<TransactionType, { icon: React.FC<any>, color: string, verb: string }> = {
    send: { icon: ArrowUpRightIcon, color: 'bg-error/20 text-error', verb: 'Sent' },
    receive: { icon: ArrowDownLeftIcon, color: 'bg-success/20 text-success', verb: 'Received' },
    swap: { icon: RepeatIcon, color: 'bg-blue-500/20 text-blue-400', verb: 'Swapped' },
};

const ActivityItem: React.FC<{ tx: Transaction, whaleAddresses: string[] }> = ({ tx, whaleAddresses }) => {
    const { type, date, tokenSymbol, amount, fromAddress, toAddress, chain, significance, realizedPnl } = tx;
    const meta = typeMeta[type];
    const TypeIcon = meta.icon;

    const lowercasedWhaleAddresses = whaleAddresses.map(a => a.toLowerCase());
    const isOutbound = lowercasedWhaleAddresses.includes(fromAddress.toLowerCase());
    
    const description = () => {
        if (type === 'swap') {
            return <>Swapped for <span className="font-semibold text-neutral-900 dark:text-white">{tokenSymbol}</span></>
        }
        if (isOutbound) {
            return <>Sent to <CopyableAddress address={toAddress} /></>
        }
        return <>Received from <CopyableAddress address={fromAddress} /></>
    }

    return (
        <li className="flex space-x-4 py-4">
            <div className="flex-shrink-0">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${meta.color}`}>
                    <TypeIcon className="w-4 h-4" />
                </span>
            </div>
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="font-semibold text-neutral-900 dark:text-white">{meta.verb} {amount.toLocaleString(undefined, {maximumFractionDigits: 4})} {tokenSymbol}</span>
                    </p>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center space-x-2">
                         <span>{formatRelativeTime(new Date(date))}</span>
                         <a href={BLOCKCHAIN_METADATA[chain]?.explorer?.txUrl(tx.hash) || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue">
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                         </a>
                    </div>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {description()}
                </div>
                 <div className="mt-2 flex items-center space-x-2">
                    {significance && <Badge significance={significance} />}
                    {realizedPnl !== undefined && (
                        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${realizedPnl >= 0 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                            Realized P&L: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(realizedPnl)}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

const SkeletonItem = () => (
    <li className="flex space-x-4 py-4">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-grow space-y-2">
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-2/3" />
        </div>
    </li>
);

const groupTransactionsByDay = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);

        let key: string;
        if (txDate.getTime() === today.getTime()) {
            key = 'Today';
        } else if (txDate.getTime() === yesterday.getTime()) {
            key = 'Yesterday';
        } else {
            key = txDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(tx);
    });

    return groups;
};

export const WhaleActivityFeed: React.FC<WhaleActivityFeedProps> = ({ transactions, loading, whaleAddresses }) => {
    const [tokenFilter, setTokenFilter] = useState('');
    const [valueFilter, setValueFilter] = useState('');
    
    const filteredTransactions = useMemo(() => {
        let tempTransactions = [...transactions];
        if (tokenFilter) {
            tempTransactions = tempTransactions.filter(tx => tx.tokenSymbol.toLowerCase().includes(tokenFilter.toLowerCase()));
        }
        if (valueFilter) {
            const minV = parseFloat(valueFilter);
            if (!isNaN(minV)) {
                tempTransactions = tempTransactions.filter(tx => tx.valueUsd >= minV);
            }
        }
        return tempTransactions;
    }, [transactions, tokenFilter, valueFilter]);

    const groupedTransactions = useMemo(() => groupTransactionsByDay(filteredTransactions), [filteredTransactions]);
    const sortedGroupKeys = Object.keys(groupedTransactions).sort((a, b) => {
        if (a === 'Today') return -1;
        if (b === 'Today') return 1;
        if (a === 'Yesterday') return -1;
        if (b === 'Yesterday') return 1;
        return new Date(b).getTime() - new Date(a).getTime();
    });

    return (
        <div className="p-0">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="relative">
                         <label htmlFor="token-search" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Filter by token</label>
                        <SearchIcon className="absolute left-3 top-9 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            id="token-search"
                            type="text"
                            placeholder="e.g., ETH, USDC..."
                            value={tokenFilter}
                            onChange={(e) => setTokenFilter(e.target.value)}
                            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                     <div className="relative">
                         <label htmlFor="value-filter" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Min. transaction value</label>
                        <DollarSignIcon className="absolute left-3 top-9 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            id="value-filter"
                            type="number"
                            placeholder="e.g., 10000"
                            value={valueFilter}
                            onChange={(e) => setValueFilter(e.target.value)}
                            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-10 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </div>
            </div>
            {loading ? (
                <ul className="px-6">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}
                </ul>
            ) : filteredTransactions.length > 0 ? (
                <div>
                    {sortedGroupKeys.map(day => (
                        <div key={day}>
                            <h4 className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 py-2 px-6 sticky top-[63px] backdrop-blur-sm">{day}</h4>
                            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700/50 px-6">
                                {groupedTransactions[day].map(tx => <ActivityItem key={tx.id} tx={tx} whaleAddresses={whaleAddresses} />)}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No Matching Activity</h3>
                    <p className="mt-1">Try adjusting your filters.</p>
                </div>
            )}
        </div>
    );
}
