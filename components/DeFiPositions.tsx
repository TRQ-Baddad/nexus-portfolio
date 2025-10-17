import React, { useMemo, useState, useEffect } from 'react';
import { DeFiPosition } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { LockIcon } from './icons/LockIcon';
import { DropletIcon } from './icons/DropletIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { SproutIcon } from './icons/SproutIcon';
import { SearchIcon } from './icons/SearchIcon';
import { DeFiPositionCard } from './DeFiPositionCard';
import { ListIcon } from './icons/ListIcon';
import { GridIcon } from './icons/GridIcon';
import { DeFiPositionsTable } from './DeFiPositionsTable';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface DeFiPositionsProps {
  positions: DeFiPosition[];
  loading: boolean;
}

type DeFiCategory = 'Staking' | 'Liquidity Pool' | 'Lending' | 'Farming';
type FilterType = 'all' | DeFiCategory;

const categoryMeta: Record<DeFiCategory, { icon: React.FC<any>, color: string }> = {
    'Staking': { icon: LockIcon, color: 'text-yellow-500' },
    'Liquidity Pool': { icon: DropletIcon, color: 'text-blue-500' },
    'Lending': { icon: BuildingIcon, color: 'text-purple-500' },
    'Farming': { icon: SproutIcon, color: 'text-green-500' }
}

const DeFiStatCard: React.FC<{ title: string; value: string; icon?: React.FC<any>; loading: boolean; }> = ({ title, value, icon: Icon, loading }) => (
    <Card className="p-4">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        {loading ? <Skeleton className="h-8 w-3/4 mt-2" /> : (
            <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
                {Icon && <Icon className="w-5 h-5 text-success" />}
            </div>
        )}
    </Card>
);

const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            isActive ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
        }`}
    >
        {label}
    </button>
);

export const DeFiPositions: React.FC<DeFiPositionsProps> = ({ positions, loading }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const { formatCurrency } = useUserPreferences();

    useEffect(() => {
        // Set initial view mode based on screen size, but don't listen for resize events
        // to respect user's manual override.
        if (window.innerWidth < 768) {
            setViewMode('grid');
        }
    }, []);

    const stats = useMemo(() => {
        const totalTVL = positions.reduce((acc, pos) => acc + pos.valueUsd, 0);
        const totalPositions = positions.length;
        const totalRewards = positions.reduce((acc, pos) => acc + pos.rewardsEarned, 0);
        
        const weightedApySum = positions.reduce((acc, pos) => acc + (pos.apy || 0) * pos.valueUsd, 0);
        const avgApy = totalTVL > 0 ? (weightedApySum / totalTVL) : 0;
        const highestApy = positions.reduce((max, pos) => ((pos.apy || 0) > max ? (pos.apy || 0) : max), 0);

        return { totalTVL, totalPositions, totalRewards, avgApy, highestApy };
    }, [positions]);

    const filteredPositions = useMemo(() => {
        let tempPositions = [...positions];
        if (filter !== 'all') {
            tempPositions = tempPositions.filter(p => p.type === filter);
        }
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            tempPositions = tempPositions.filter(p => 
                p.platform.toLowerCase().includes(lowerQuery) ||
                p.label.toLowerCase().includes(lowerQuery) ||
                p.tokens.some(t => t.symbol.toLowerCase().includes(lowerQuery))
            );
        }
        return tempPositions;
    }, [positions, filter, searchQuery]);


    if (!loading && positions.length === 0) {
        return (
            <Card>
                <Card.Header>
                    <Card.Title>DeFi Positions</Card.Title>
                    <Card.Description>Your staking, liquidity, lending, and farming positions across all chains.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div className="text-center py-16 text-neutral-500 dark:text-neutral-400 animate-fade-in flex flex-col items-center">
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
                            <LockIcon className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white">No DeFi Positions Found</h3>
                        <p className="text-sm max-w-sm mt-2">
                           Your connected wallets don't appear to have any active staking, lending, or liquidity pool positions on the supported platforms.
                        </p>
                    </div>
                </Card.Content>
            </Card>
        );
    }

  return (
    <div className="animate-fade-in space-y-6">
        <Card>
            <Card.Header>
                <Card.Title>DeFi Positions</Card.Title>
                <Card.Description>Your staking, liquidity, lending, and farming positions across all chains.</Card.Description>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <DeFiStatCard title="Total Value Locked" value={formatCurrency(stats.totalTVL, { notation: 'compact' })} loading={loading} />
                    <DeFiStatCard title="Active Positions" value={stats.totalPositions.toString()} loading={loading} />
                    <DeFiStatCard title="Rewards Earned" value={formatCurrency(stats.totalRewards, { notation: 'compact' })} loading={loading} />
                    <DeFiStatCard title="Avg APY" value={`${stats.avgApy.toFixed(2)}%`} icon={TrendingUpIcon} loading={loading} />
                    <DeFiStatCard title="Highest APY" value={`${stats.highestApy.toFixed(2)}%`} loading={loading} />
                </div>

                <div className="mt-4 border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center flex-wrap gap-2">
                            <FilterButton label="All" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                            {(Object.keys(categoryMeta) as DeFiCategory[]).map(cat => (
                            <FilterButton key={cat} label={cat} isActive={filter === cat} onClick={() => setFilter(cat)} />
                            ))}
                        </div>
                         <div className="hidden sm:flex items-center space-x-1 p-1 bg-neutral-200 dark:bg-neutral-700 rounded-md">
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-500'}`}><ListIcon className="w-4 h-4"/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-500'}`}><GridIcon className="w-4 h-4"/></button>
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="search" className="sr-only">Search</label>
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            id="search"
                            type="text"
                            placeholder="Search by platform, position, or underlying asset..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </div>
            </Card.Header>
            <Card.Content className="p-0">
                {viewMode === 'grid' ? (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                        ) : (
                            filteredPositions.map(pos => <DeFiPositionCard key={pos.id} position={pos} />)
                        )}
                    </div>
                ) : (
                    <DeFiPositionsTable positions={filteredPositions} loading={loading} />
                )}
            </Card.Content>
        </Card>
    </div>
  );
};