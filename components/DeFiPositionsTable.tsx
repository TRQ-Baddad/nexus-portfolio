import React, { useState, useMemo } from 'react';
import { DeFiPosition } from '../types';
import { Skeleton } from './shared/Skeleton';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { useUserPreferences } from '../hooks/useUserPreferences';

// This sort option is now local to the table component
type DeFiSortOption = 'valueUsd_desc' | 'valueUsd_asc' | 'apy_desc' | 'apy_asc' | 'platform_asc';

interface DeFiPositionsTableProps {
    positions: DeFiPosition[];
    loading: boolean;
}

// --- Table Components ---
type SortableKey = 'platform' | 'valueUsd' | 'apy';

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortableKey;
  currentSort: DeFiSortOption;
  setSortBy: (key: DeFiSortOption) => void;
  className?: string;
}> = ({ label, sortKey, currentSort, setSortBy, className }) => {
    const isSortedAsc = currentSort === `${sortKey}_asc`;
    const isSortedDesc = currentSort === `${sortKey}_desc`;

    const handleSort = () => {
        if (isSortedDesc) {
            setSortBy(`${sortKey}_asc` as DeFiSortOption);
        } else {
            setSortBy(`${sortKey}_desc` as DeFiSortOption);
        }
    };

  return (
    <th className={`p-4 font-medium ${className}`}>
      <button className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={handleSort}>
        <span>{label}</span>
        {isSortedAsc || isSortedDesc ? (
          isSortedAsc ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
        )}
      </button>
    </th>
  );
};

const PositionRow: React.FC<{ position: DeFiPosition; isExpanded: boolean; onToggleExpand: () => void; }> = ({ position, isExpanded, onToggleExpand }) => {
    const ChainIcon = BLOCKCHAIN_METADATA[position.chain]?.icon || (() => null);
    const { formatCurrency } = useUserPreferences();
    return (
        <tr className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
            <td className="p-4">
                <button onClick={onToggleExpand} className="flex items-center space-x-3 text-left">
                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <img src={position.platformLogoUrl} alt={position.platform} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{position.platform}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{position.label}</p>
                    </div>
                </button>
            </td>
            <td className="p-4 hidden sm:table-cell"><ChainIcon className="w-5 h-5"><title>{BLOCKCHAIN_METADATA[position.chain].name}</title></ChainIcon></td>
            <td className="p-4 text-right font-semibold text-neutral-900 dark:text-white">{formatCurrency(position.valueUsd)}</td>
            <td className="p-4 text-right font-semibold text-success">{position.apy?.toFixed(2)}%</td>
        </tr>
    );
};

const ExpandedContent: React.FC<{ position: DeFiPosition }> = ({ position }) => {
    const { formatCurrency } = useUserPreferences();
    return (
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4">
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">Underlying Assets</h4>
            <div className="space-y-2">
                {position.tokens.map(token => (
                    <div key={token.symbol} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                            <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5 rounded-full" />
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{token.amount.toLocaleString(undefined, {maximumFractionDigits: 4})} {token.symbol}</span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                            {formatCurrency(token.valueUsd)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SkeletonRow = () => (
  <tr className="border-b border-neutral-200 dark:border-neutral-800">
    <td className="p-4">
        <div className="flex items-center space-x-3">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-12" /></div>
        </div>
    </td>
    <td className="p-4 hidden sm:table-cell"><Skeleton className="w-5 h-5 rounded-full" /></td>
    <td className="p-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
    <td className="p-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
  </tr>
);

export const DeFiPositionsTable: React.FC<DeFiPositionsTableProps> = ({ positions, loading }) => {
    const [sortBy, setSortBy] = useState<DeFiSortOption>('valueUsd_desc');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const sortedPositions = useMemo(() => {
        let tempPositions = [...positions];
        tempPositions.sort((a, b) => {
            switch (sortBy) {
                case 'valueUsd_desc': return b.valueUsd - a.valueUsd;
                case 'valueUsd_asc': return a.valueUsd - b.valueUsd;
                case 'apy_desc': return (b.apy || 0) - (a.apy || 0);
                case 'apy_asc': return (a.apy || 0) - (b.apy || 0);
                case 'platform_asc': return a.platform.localeCompare(b.platform);
                default: return 0;
            }
        });
        return tempPositions;
    }, [positions, sortBy]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        <SortableHeader label="Platform / Position" sortKey="platform" currentSort={sortBy} setSortBy={setSortBy} className="text-left" />
                        <th className="p-4 font-medium hidden sm:table-cell">Chain</th>
                        <SortableHeader label="Value" sortKey="valueUsd" currentSort={sortBy} setSortBy={setSortBy} className="text-right" />
                        <SortableHeader label="APY" sortKey="apy" currentSort={sortBy} setSortBy={setSortBy} className="text-right" />
                    </tr>
                </thead>
                <tbody className="animate-fade-in">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : sortedPositions.length > 0 ? (
                        sortedPositions.map(pos => (
                            <React.Fragment key={pos.id}>
                                <PositionRow 
                                    position={pos} 
                                    isExpanded={expandedRowId === pos.id}
                                    onToggleExpand={() => setExpandedRowId(current => current === pos.id ? null : pos.id)}
                                />
                                {expandedRowId === pos.id && (
                                    <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                                        <td colSpan={4} className="p-0">
                                            <ExpandedContent position={pos} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="text-center p-16 text-neutral-500 dark:text-neutral-400">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No Positions Found</h3>
                                <p className="mt-1">Try adjusting your filters.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};