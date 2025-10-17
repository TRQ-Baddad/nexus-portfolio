import React from 'react';
import { DeFiPosition } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { BLOCKCHAIN_METADATA } from '../constants';
import { useUserPreferences } from '../hooks/useUserPreferences';

const positionTypeMap: Record<DeFiPosition['type'], string> = {
    'Staking': 'bg-yellow-500/20 text-yellow-500',
    'Liquidity Pool': 'bg-blue-500/20 text-blue-500',
    'Lending': 'bg-purple-500/20 text-purple-500',
    'Farming': 'bg-green-500/20 text-green-500',
};

export const DeFiPositionCard: React.FC<{ position: DeFiPosition }> = ({ position }) => {
    const ChainIcon = BLOCKCHAIN_METADATA[position.chain].icon;
    const { formatCurrency } = useUserPreferences();

    return (
        <Card>
            <Card.Header className="flex items-center justify-between !pb-4">
                <div className="flex items-center space-x-3">
                    <img src={position.platformLogoUrl} alt={position.platform} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{position.platform}</p>
                         <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                             <span className={`px-1.5 py-0.5 rounded ${positionTypeMap[position.type]}`}>{position.type}</span>
                             <div className="flex items-center space-x-1">
                                <ChainIcon className="w-3.5 h-3.5" />
                                <span>{BLOCKCHAIN_METADATA[position.chain].name}</span>
                            </div>
                        </div>
                    </div>
                </div>
                 <a href={position.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">Manage</Button>
                </a>
            </Card.Header>
            <Card.Content className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-700/50 pb-4 mb-4">
                    <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Value</p>
                        <p className="font-semibold text-lg">{formatCurrency(position.valueUsd)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">APY</p>
                        <p className="font-semibold text-lg text-success">{position.apy?.toFixed(2)}%</p>
                    </div>
                     <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Rewards Earned</p>
                        <p className="font-semibold text-lg">{formatCurrency(position.rewardsEarned)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Duration</p>
                        <p className="font-semibold text-lg">{position.durationDays} days</p>
                    </div>
                </div>
                 <div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">Assets</p>
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
            </Card.Content>
        </Card>
    );
};
