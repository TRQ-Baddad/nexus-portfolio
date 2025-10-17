import React from 'react';
import { TransactionSignificance } from '../../types';

interface BadgeProps {
  significance: TransactionSignificance;
}

const significanceStyles: Record<TransactionSignificance, string> = {
    'First Buy': 'bg-blue-500/20 text-blue-500 dark:text-blue-400',
    'Sell Off': 'bg-red-500/20 text-red-500 dark:text-red-400',
    'High Volume': 'bg-purple-500/20 text-purple-500 dark:text-purple-400',
    'New Position': 'bg-green-500/20 text-green-500 dark:text-green-400',
};

export const Badge: React.FC<BadgeProps> = ({ significance }) => {
    const style = significanceStyles[significance] || 'bg-neutral-500/20 text-neutral-500';
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>
            {significance}
        </span>
    );
};
