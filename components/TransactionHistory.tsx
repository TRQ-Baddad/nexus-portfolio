import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, TransactionType } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownLeftIcon } from './icons/ArrowDownLeftIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { SearchIcon } from './icons/SearchIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { Button } from './shared/Button';
import { TransactionDetailModal } from './TransactionDetailModal';
import { CopyableAddress } from './shared/CopyableAddress';
import { Pagination } from './shared/Pagination';
import { DownloadIcon } from './icons/DownloadIcon';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
}

const TRANSACTIONS_PER_PAGE = 15;

const TypeFilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            isActive ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
        }`}
    >
        {label}
    </button>
);

const TransactionRow: React.FC<{ transaction: Transaction; onClick: () => void; }> = ({ transaction, onClick }) => {
    const { type, date, tokenSymbol, amount, valueUsd, fromAddress, toAddress, chain } = transaction;
    const ChainIcon = BLOCKCHAIN_METADATA[chain]?.icon || (() => null);
    const { formatCurrency } = useUserPreferences();
    
    const typeMeta: Record<TransactionType, { icon: React.FC<any>, color: string, label: string }> = {
        send: { icon: ArrowUpRightIcon, color: 'bg-error/20 text-error', label: 'Send' },
        receive: { icon: ArrowDownLeftIcon, color: 'bg-success/20 text-success', label: 'Receive' },
        swap: { icon: RepeatIcon, color: 'bg-blue-500/20 text-blue-400', label: 'Swap' },
    };
    
    const TypeIcon = typeMeta[type].icon;

    return (
        <tr onClick={onClick} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors text-sm cursor-pointer">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full ${typeMeta[type].color}`}>
                        <TypeIcon className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white capitalize">{typeMeta[type].label}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <p className="font-medium text-neutral-900 dark:text-white">{amount.toLocaleString()} {tokenSymbol.split('/')[0]}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatCurrency(valueUsd)}</p>
            </td>
            <td className="p-4 font-mono text-xs hidden md:table-cell">
                <div className="flex items-center space-x-2">
                    <span className="text-neutral-500 dark:text-neutral-500 w-10">From:</span>
                    <CopyableAddress address={fromAddress} />
                </div>
                 <div className="flex items-center space-x-2 mt-1">
                    <span className="text-neutral-500 dark:text-neutral-500 w-10">To:</span>
                    <CopyableAddress address={toAddress} />
                </div>
            </td>
             <td className="p-4">
                <div className="flex justify-end">
                    <ChainIcon className="w-5 h-5">
                      <title>{BLOCKCHAIN_METADATA[chain].name}</title>
                    </ChainIcon>
                </div>
            </td>
        </tr>
    );
};

const SkeletonRow: React.FC = () => (
     <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4">
             <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24 mt-1.5" />
                </div>
            </div>
        </td>
        <td className="p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12 mt-1.5" />
        </td>
        <td className="p-4 hidden md:table-cell">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-32 mt-1.5" />
        </td>
        <td className="p-4">
            <Skeleton className="w-5 h-5 rounded-full ml-auto" />
        </td>
    </tr>
)

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, loading }) => {
    const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleClearFilters = () => {
        setTypeFilter('all');
        setSearchQuery('');
        setDateRange({ start: '', end: '' });
    };

    const filteredTransactions = useMemo(() => {
        let tempTransactions = [...transactions];

        // 1. Filter by type
        if (typeFilter !== 'all') {
            tempTransactions = tempTransactions.filter(t => t.type === typeFilter);
        }

        // 2. Filter by search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempTransactions = tempTransactions.filter(t => 
                t.tokenSymbol.toLowerCase().includes(lowercasedQuery) ||
                t.fromAddress.toLowerCase().includes(lowercasedQuery) ||
                t.toAddress.toLowerCase().includes(lowercasedQuery)
            );
        }

        // 3. Filter by date range
        const { start, end } = dateRange;
        if (start) {
            const startDate = new Date(start);
            startDate.setUTCHours(0, 0, 0, 0);
            tempTransactions = tempTransactions.filter(t => new Date(t.date) >= startDate);
        }
        if (end) {
            const endDate = new Date(end);
            endDate.setUTCHours(23, 59, 59, 999);
            tempTransactions = tempTransactions.filter(t => new Date(t.date) <= endDate);
        }

        return tempTransactions;
    }, [transactions, typeFilter, searchQuery, dateRange]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, searchQuery, dateRange]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
        const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, currentPage]);

    const hasActiveFilters = typeFilter !== 'all' || searchQuery !== '' || dateRange.start !== '' || dateRange.end !== '';
    
    const handleExportCsv = useCallback(() => {
        if (filteredTransactions.length === 0) return;
        
        const headers = ['Date', 'Type', 'Token', 'Amount', 'Value (USD)', 'From Address', 'To Address', 'Chain', 'Transaction Hash'];
        
        const escapeCsvCell = (cell: any) => {
            const cellStr = String(cell == null ? '' : cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };

        const csvRows = [headers.join(',')];

        for (const tx of filteredTransactions) {
            const row = [
                new Date(tx.date).toISOString(),
                tx.type,
                tx.tokenSymbol,
                tx.amount,
                tx.valueUsd,
                tx.fromAddress,
                tx.toAddress,
                tx.chain,
                tx.hash,
            ].map(escapeCsvCell).join(',');
            csvRows.push(row);
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `nexus-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredTransactions]);


    return (
        <>
            <Card>
                <Card.Header>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Card.Title>Transaction History</Card.Title>
                            <Card.Description>Your recent activity across all wallets</Card.Description>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                            <TypeFilterButton label="All" isActive={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
                            <TypeFilterButton label="Send" isActive={typeFilter === 'send'} onClick={() => setTypeFilter('send')} />
                            <TypeFilterButton label="Receive" isActive={typeFilter === 'receive'} onClick={() => setTypeFilter('receive')} />
                            <TypeFilterButton label="Swap" isActive={typeFilter === 'swap'} onClick={() => setTypeFilter('swap')} />
                        </div>
                    </div>
                    <div className="mt-4 border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                        <div className="relative">
                             <label htmlFor="search" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Search</label>
                            <SearchIcon className="absolute left-3 top-9 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                            <input
                                id="search"
                                type="text"
                                placeholder="Symbol or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="start-date" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Start Date</label>
                            <input
                                id="start-date"
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="end-date" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">End Date</label>
                            <input
                                id="end-date"
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                 className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                         <div className="flex space-x-2">
                            <Button variant="secondary" onClick={handleClearFilters} disabled={!hasActiveFilters} className="w-full">
                                <XCircleIcon className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                             <Button variant="secondary" onClick={handleExportCsv} disabled={filteredTransactions.length === 0} className="w-full">
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                             <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Details</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Addresses</th>
                                    <th className="p-4 font-medium text-right">Chain</th>
                                </tr>
                            </thead>
                            <tbody className={!loading ? 'animate-fade-in' : ''}>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginatedTransactions.length > 0 ? (
                                    paginatedTransactions.map(txn => <TransactionRow key={txn.id} transaction={txn} onClick={() => setSelectedTx(txn)} />)
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center p-16 text-neutral-500 dark:text-neutral-400">
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No Transactions Found</h3>
                                            <p className="mt-1">Try adjusting your filters or adding wallets with recent activity.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        totalItems={filteredTransactions.length}
                        itemsPerPage={TRANSACTIONS_PER_PAGE}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </Card.Content>
            </Card>
            <TransactionDetailModal 
                transaction={selectedTx}
                onClose={() => setSelectedTx(null)}
            />
        </>
    );
};
