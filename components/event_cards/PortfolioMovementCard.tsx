import React from 'react';
import { Token } from '../../types';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { BLOCKCHAIN_METADATA } from '../../constants';

interface PortfolioMovementCardProps {
    token: Token;
}

export const PortfolioMovementCard: React.FC<PortfolioMovementCardProps> = ({ token }) => {
    const isPositive = token.change24h >= 0;
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const colorClass = isPositive ? 'text-success' : 'text-error';
    const valueChange = (token.value / (1 + token.change24h / 100)) * (token.change24h / 100);
    const ChainIcon = BLOCKCHAIN_METADATA[token.chain]?.icon || (() => null);

    return (
        <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-neutral-900 dark:text-white">
                    Significant Movement in {token.name} ({token.symbol})
                </p>
                <div className="flex items-center space-x-2 text-sm mt-1">
                    <span className={`font-bold ${colorClass}`}>
                        {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                        ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(valueChange)} in 24h)
                    </span>
                    <div className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400">
                        <ChainIcon className="w-3.5 h-3.5" />
                        <span>on {BLOCKCHAIN_METADATA[token.chain].name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};