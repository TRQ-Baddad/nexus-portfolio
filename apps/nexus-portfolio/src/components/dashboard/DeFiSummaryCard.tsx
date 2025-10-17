import React, { useMemo } from 'react';
import { DeFiPosition } from '../../../../../types';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { ArrowRightIcon } from '../../../../../components/icons/ArrowRightIcon';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { TrendingUpIcon } from '../../../../../components/icons/TrendingUpIcon';

interface DeFiSummaryCardProps {
    positions: DeFiPosition[];
    loading: boolean;
    onNavigate: () => void;
}

const Stat: React.FC<{ label: string; value: string; loading: boolean }> = ({ label, value, loading }) => (
    <div className="text-center bg-neutral-100 dark:bg-neutral-800/50 p-3 rounded-lg">
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
        {loading ? <Skeleton className="h-6 w-1/2 mx-auto mt-1" /> : <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>}
    </div>
);

export const DeFiSummaryCard: React.FC<DeFiSummaryCardProps> = ({ positions, loading, onNavigate }) => {
    
    const stats = useMemo(() => {
        const totalValueLocked = positions.reduce((acc, pos) => acc + pos.valueUsd, 0);
        const weightedApySum = positions.reduce((acc, pos) => acc + (pos.apy || 0) * pos.valueUsd, 0);
        const averageApy = totalValueLocked > 0 ? weightedApySum / totalValueLocked : 0;
        return { totalValueLocked, averageApy };
    }, [positions]);

    return (
        <Card className="flex flex-col h-full">
            <Card.Header>
                <Card.Title>DeFi Summary</Card.Title>
            </Card.Header>
            <Card.Content className="p-4 space-y-3 flex-grow">
                <Stat 
                    label="Total Value Locked" 
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalValueLocked)}
                    loading={loading}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Stat 
                        label="Positions" 
                        value={positions.length.toString()}
                        loading={loading}
                    />
                    <Stat 
                        label="Avg. APY" 
                        value={`${stats.averageApy.toFixed(2)}%`}
                        loading={loading}
                    />
                </div>
            </Card.Content>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 mt-auto">
                <Button variant="secondary" onClick={onNavigate} className="w-full text-xs">
                    View All Positions
                    <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </Card>
    );
};