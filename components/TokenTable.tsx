import React, { useState, useMemo, useEffect } from 'react';
import { Token, WatchlistToken } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { BLOCKCHAIN_METADATA } from '../constants';
import { useTranslation } from '../utils/formatters';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Button } from './shared/Button';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';

// --- HOLDINGS TABLE COMPONENTS ---
type HoldingsSortableKey = 'name' | 'price' | 'change24h' | 'amount' | 'value';

const HoldingsSortableHeader: React.FC<{
  label: string;
  sortKey: HoldingsSortableKey;
  currentSort: { key: HoldingsSortableKey; direction: 'asc' | 'desc' };
  onSort: (key: HoldingsSortableKey) => void;
  className?: string;
}> = ({ label, sortKey, currentSort, onSort, className }) => {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : 'desc';

  return (
    <th className={`p-4 font-medium ${className}`}>
      <button className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        {isSorted ? (
          direction === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
        )}
      </button>
    </th>
  );
};

const HoldingsTable: React.FC<{ tokens: Token[], loading: boolean }> = ({ tokens, loading }) => {
    const [sortConfig, setSortConfig] = useState<{ key: HoldingsSortableKey; direction: 'asc' | 'desc' }>({ key: 'value', direction: 'desc' });
    const { formatCurrency } = useUserPreferences();

    const handleSort = (key: HoldingsSortableKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const sortedTokens = useMemo(() => {
        return [...tokens].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [tokens, sortConfig]);

    const TokenRow: React.FC<{ token: Token }> = ({ token }) => {
        const isPositive = token.change24h >= 0;
        const ChainIcon = BLOCKCHAIN_METADATA[token.chain].icon;

        return (
            <tr className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                <img src={token.logoUrl} alt={token.name} className="w-8 h-8 rounded-full" />
                <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{token.name}</p>
                    <div className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{token.symbol}</span>
                    <ChainIcon className="w-3.5 h-3.5"><title>{BLOCKCHAIN_METADATA[token.chain].name}</title></ChainIcon>
                    </div>
                </div>
                </div>
            </td>
            <td className="p-4 text-right"><p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(token.price)}</p></td>
            <td className={`p-4 text-right font-medium ${isPositive ? 'text-success' : 'text-error'}`}>{isPositive ? '+' : ''}{token.change24h.toFixed(2)}%</td>
            <td className="p-4 text-right hidden sm:table-cell">
                <p className="font-medium text-neutral-900 dark:text-white">{token.amount.toLocaleString()}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{token.symbol}</p>
            </td>
            <td className="p-4 text-right"><p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(token.value)}</p></td>
            </tr>
        );
    };

    if (loading) return <div className="p-4"><Skeleton className="w-full h-64" /></div>

    if (tokens.length === 0) return <div className="text-center p-16 text-neutral-500 dark:text-neutral-400">No tokens found for the connected wallets.</div>

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <HoldingsSortableHeader label="Asset" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="text-left" />
                        <HoldingsSortableHeader label="Price" sortKey="price" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                        <HoldingsSortableHeader label="24h %" sortKey="change24h" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                        <HoldingsSortableHeader label="Holdings" sortKey="amount" currentSort={sortConfig} onSort={handleSort} className="text-right hidden sm:table-cell" />
                        <HoldingsSortableHeader label="Value" sortKey="value" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                    </tr>
                </thead>
                <tbody className="animate-fade-in">{sortedTokens.map(token => <TokenRow key={token.id} token={token} />)}</tbody>
            </table>
        </div>
    )
}

// --- WATCHLIST TABLE COMPONENTS ---
type WatchlistSortableKey = 'name' | 'price' | 'change24h' | 'marketCap' | 'totalVolume';

const WatchlistSortableHeader: React.FC<{
  label: string;
  sortKey: WatchlistSortableKey;
  currentSort: { key: WatchlistSortableKey; direction: 'asc' | 'desc' };
  onSort: (key: WatchlistSortableKey) => void;
  className?: string;
}> = ({ label, sortKey, currentSort, onSort, className }) => {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : 'desc';

  return (
    <th className={`p-4 font-medium ${className}`}>
      <button className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        {isSorted ? (
          direction === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
        )}
      </button>
    </th>
  );
};

const WatchlistTable: React.FC<{ watchlist: WatchlistToken[], loading: boolean, onRemove: (id: string) => void }> = ({ watchlist, loading, onRemove }) => {
    const [sortConfig, setSortConfig] = useState<{ key: WatchlistSortableKey; direction: 'asc' | 'desc' }>({ key: 'marketCap', direction: 'desc' });
    const { formatCurrency } = useUserPreferences();

    const handleSort = (key: WatchlistSortableKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [watchlist, sortConfig]);

    const WatchlistRow: React.FC<{ token: WatchlistToken }> = ({ token }) => {
        const isPositive = token.change24h >= 0;
        return (
            <tr className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                <td className="p-4">
                    <div className="flex items-center space-x-3">
                        <img src={token.logoUrl} alt={token.name} className="w-8 h-8 rounded-full" />
                        <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{token.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{token.symbol}</p>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-right font-medium">{formatCurrency(token.price)}</td>
                <td className={`p-4 text-right font-medium ${isPositive ? 'text-success' : 'text-error'}`}>{isPositive ? '+' : ''}{token.change24h?.toFixed(2)}%</td>
                <td className="p-4 text-right hidden md:table-cell">{formatCurrency(token.marketCap, { notation: 'compact' })}</td>
                <td className="p-4 text-right hidden md:table-cell">{formatCurrency(token.totalVolume, { notation: 'compact' })}</td>
                <td className="p-4 text-right">
                    <button onClick={() => onRemove(token.id)} className="text-neutral-400 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-error/10">
                        <Trash2Icon className="w-4 h-4"/>
                    </button>
                </td>
            </tr>
        );
    };

    if (loading) return <div className="p-4"><Skeleton className="w-full h-64" /></div>

    if (watchlist.length === 0) return <div className="text-center p-16 text-neutral-500 dark:text-neutral-400">Your watchlist is empty. Add tokens to start tracking them.</div>

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <WatchlistSortableHeader label="Asset" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="text-left" />
                        <WatchlistSortableHeader label="Price" sortKey="price" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                        <WatchlistSortableHeader label="24h %" sortKey="change24h" currentSort={sortConfig} onSort={handleSort} className="text-right" />
                        <WatchlistSortableHeader label="Market Cap" sortKey="marketCap" currentSort={sortConfig} onSort={handleSort} className="text-right hidden md:table-cell" />
                        <WatchlistSortableHeader label="24h Volume" sortKey="totalVolume" currentSort={sortConfig} onSort={handleSort} className="text-right hidden md:table-cell" />
                        <th className="p-4"></th>
                    </tr>
                </thead>
                <tbody className="animate-fade-in">{sortedWatchlist.map(token => <WatchlistRow key={token.id} token={token} />)}</tbody>
            </table>
        </div>
    );
};


// --- MAIN COMPONENT ---
interface TokenTableProps {
  tokens: Token[];
  loading: boolean;
  watchlist?: WatchlistToken[];
  watchlistLoading?: boolean;
  onOpenAddWatchlistTokenModal?: () => void;
  onRemoveFromWatchlist?: (id: string) => void;
}

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>
        {label}
    </button>
)

export const TokenTable: React.FC<TokenTableProps> = ({ tokens, loading, watchlist, watchlistLoading, onOpenAddWatchlistTokenModal, onRemoveFromWatchlist }) => {
    const [activeTab, setActiveTab] = useState<'holdings' | 'watchlist'>('holdings');
    const { t } = useTranslation();

    const hasWatchlist = watchlist && watchlistLoading !== undefined && onOpenAddWatchlistTokenModal && onRemoveFromWatchlist;

    useEffect(() => {
        if (!hasWatchlist && activeTab === 'watchlist') {
            setActiveTab('holdings');
        }
    }, [hasWatchlist, activeTab]);

    return (
        <Card>
            <Card.Header>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <nav className="-mb-px flex space-x-4">
                            <TabButton label={t('tokenHoldings')} isActive={activeTab === 'holdings'} onClick={() => setActiveTab('holdings')} />
                            {hasWatchlist && (
                                <TabButton label="Watchlist" isActive={activeTab === 'watchlist'} onClick={() => setActiveTab('watchlist')} />
                            )}
                        </nav>
                    </div>
                    {hasWatchlist && onOpenAddWatchlistTokenModal && (
                        <Button onClick={onOpenAddWatchlistTokenModal} variant="secondary">
                            <PlusIcon className="w-4 h-4 mr-2"/>Add to Watchlist
                        </Button>
                    )}
                </div>
            </Card.Header>
            <Card.Content className="p-0">
                {activeTab === 'holdings' || !hasWatchlist ? (
                    <HoldingsTable tokens={tokens} loading={loading} />
                ) : (
                    <WatchlistTable watchlist={watchlist} loading={watchlistLoading!} onRemove={onRemoveFromWatchlist!} />
                )}
            </Card.Content>
        </Card>
    );
};