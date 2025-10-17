import React from 'react';
import { Insight } from '../../types';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { LightbulbIcon } from '../icons/LightbulbIcon';
import { InfoIcon } from '../icons/InfoIcon';

interface InsightEventCardProps {
    insight: Insight;
}

const InsightIcon: React.FC<{type: Insight['type']}> = ({ type }) => {
    switch(type) {
        case 'warning': return <AlertTriangleIcon className="w-5 h-5 text-warning" />;
        case 'opportunity': return <LightbulbIcon className="w-5 h-5 text-success" />;
        case 'info':
        default: return <InfoIcon className="w-5 h-5 text-brand-blue" />;
    }
}

export const InsightEventCard: React.FC<InsightEventCardProps> = ({ insight }) => {
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <InsightIcon type={insight.type} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-neutral-900 dark:text-white">
                    AI Insight: {insight.title}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                    {insight.description}
                </p>
            </div>
        </div>
    );
};