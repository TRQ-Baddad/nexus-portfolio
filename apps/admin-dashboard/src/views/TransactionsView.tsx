
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '../../../../components/shared/Card';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { Transaction, TransactionType, User, Blockchain } from '../../../../types';
import { FilterDropdown } from '../components/FilterDropdown';
import { Pagination } from '../../../../components/shared/Pagination';
import { BLOCKCHAIN_METADATA } from '../../../../constants';
import { ArrowUpRightIcon } from '../../../../components/icons/ArrowUpRightIcon';
import { ArrowDownLeftIcon } from '../../../../components/icons/ArrowDownLeftIcon';
import { RepeatIcon } from '../../../../components/icons/RepeatIcon';
import { ExternalLinkIcon } from '../../../../components/icons/ExternalLinkIcon';
import { DollarSignIcon } from '../../../../components/icons/DollarSignIcon';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';

type AdminTransaction = Transaction & { user: Pick<User, 'name' | 'email' | 'avatar_url'> };

const TRANSACTIONS_PER_PAGE = 15;
const ALL_CHAINS = Object.keys(BLOCKCHAIN_METADATA) as Blockchain[];
const ALL_TYPES: TransactionType[] = ['send', 'receive', 'swap'];

const TransactionRow: React.FC<{ tx: AdminTransaction, significanceThreshold: number }> = ({ tx, significanceThreshold }) => {
    const { user, type, tokenSymbol, amount, valueUsd, chain, date, hash } = tx;
    const ChainIcon = BLOCKCHAIN_METADATA[chain]?.icon || (() => null);
    const isSignificant = valueUsd >= significanceThreshold;
    
    const typeMeta: Record<TransactionType, { icon: React.FC<any>, color: string, label: string }> = {
        send: { icon: ArrowUpRightIcon, color: 'text-error', label: 'Send' },
        receive: { icon: ArrowDownLeftIcon, color: 'text-success', label: 'Receive' },
        swap: { icon: RepeatIcon, color: 'text-blue-400', label: 'Swap' },
    };
    const TypeIcon = typeMeta[type].icon;

    return (
        <tr className={`border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors text-sm ${isSignificant ? 'bg-amber-500/10' : ''}`}>
            <td className="p-4">
                 <div className="flex items-center space-x-3">
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center space-x-2">
                    <TypeIcon className={`w-4 h-4 ${typeMeta[type].color}`} />
                    <span className="font-semibold capitalize">{type}</span>
                </div>
            </td>
            <td className="p-4">
                <p className="font-semibold">{amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenSymbol}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">${valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </td>
            <td className="p-4"><ChainIcon className="w-5 h-5"><title>{BLOCKCHAIN_METADATA[chain].name}</title></ChainIcon></td>
            <td className="p-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400">{new Date(date).toLocaleString()}</td>
            <td className="p-4 text-center">
                <a href={BLOCKCHAIN_METADATA[chain].explorer.txUrl(hash)} target="_blank" rel="noopener noreferrer" className="inline-block p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10">
                    <ExternalLinkIcon className="w-4 h-4" />
                </a>
            </td>
        </tr>
    );
};

const SkeletonRow = () => (
     <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4"><div className="flex items-center space-x-3"><Skeleton className="w-8 h-8 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32"/></div></div></td>
        <td className="p-4"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4"><Skeleton className="h-5 w-24" /></td>
        <td className="p-4"><Skeleton className="h-5 w-5" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-32" /></td>
        <td className="p-4"><Skeleton className="h-5 w-5 mx-auto" /></td>
    </tr>
)

export const TransactionsView: React.FC = () => {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [chainFilters, setChainFilters] = useState<string[]>([]);
    const [valueFilter, setValueFilter] = useState('50000');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const { data, error, count } = await supabase.rpc('get_all_recent_transactions', {
            page: currentPage,
            page_size: TRANSACTIONS_PER_PAGE,
            search_query: searchQuery || null,
            type_filters: typeFilters.length > 0 ? typeFilters : null,
            chain_filters: chainFilters.length > 0 ? chainFilters : null,
            min_value: Number(valueFilter) || 0,
        });

        if (error) {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
        } else {
            setTransactions(data as AdminTransaction[]);
            setTotalCount(count || 0);
        }
        setLoading(false);
    }, [currentPage, searchQuery, typeFilters, chainFilters, valueFilter]);

    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [searchQuery, typeFilters, chainFilters, valueFilter]);
    
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Transaction Monitor</h1>
            
            <Card>
                 <Card.Header>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="relative md:col-span-2">
                             <label htmlFor="tx-search" className="text-xs font-medium text-neutral-500">Search</label>
                            <SearchIcon className="absolute left-3 top-9 h-4 w-4 text-neutral-400"/>
                            <input id="tx-search" type="text" placeholder="Search by user, email, or token..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3"/>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                            <FilterDropdown label="Type" options={ALL_TYPES} selected={typeFilters} onChange={setTypeFilters} />
                        </div>
                         <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                            <FilterDropdown label="Chain" options={ALL_CHAINS} selected={chainFilters} onChange={setChainFilters} />
                        </div>
                        <div className="relative">
                            <label htmlFor="value-filter" className="text-xs font-medium text-neutral-500">Min Value ($)</label>
                            <DollarSignIcon className="absolute left-3 top-9 h-4 w-4 text-neutral-400" />
                            <input id="value-filter" type="number" placeholder="e.g., 50000" value={valueFilter} onChange={e => setValueFilter(e.target.value)} className="mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3"/>
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                     <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Type</th>
                                    <th className="p-4 font-medium">Details</th>
                                    <th className="p-4 font-medium">Chain</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Date</th>
                                    <th className="p-4 font-medium text-center">Explorer</th>
                                </tr>
                            </thead>
                             <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    transactions.map(tx => <TransactionRow key={tx.id} tx={tx} significanceThreshold={Number(valueFilter) || 0} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={totalCount} itemsPerPage={TRANSACTIONS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
                </Card.Content>
            </Card>
        </div>
    );
};
