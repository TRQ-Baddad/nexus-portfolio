
import React from 'react';
import { User, Insight } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { Skeleton } from './shared/Skeleton';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { InfoIcon } from './icons/InfoIcon';
import { ErrorDisplay } from './ErrorDisplay';
import { WalletHealthScore } from './WalletHealthScore';
import { UpgradeNotice } from './shared/UpgradeNotice';

interface AiInsightsProps {
    user: User | null;
    insights: Insight[];
    healthScore: number | null;
    healthSummary: string | null;
    loading: boolean;
    error: string | null;
    onGenerate: (force?: boolean) => void;
    onUpgrade: () => void;
}

const InsightIcon: React.FC<{type: Insight['type']}> = ({ type }) => {
    switch(type) {
        case 'warning': return <AlertTriangleIcon className="w-6 h-6 text-warning" />;
        case 'opportunity': return <LightbulbIcon className="w-6 h-6 text-success" />;
        case 'info':
        default: return <InfoIcon className="w-6 h-6 text-brand-blue" />;
    }
}

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => (
    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700/50 flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
            <InsightIcon type={insight.type} />
        </div>
        <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">{insight.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{insight.description}</p>
        </div>
    </div>
);

const SkeletonCard = () => (
     <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700/50 flex items-start space-x-4">
        <Skeleton className="w-6 h-6 rounded-full flex-shrink-0 mt-1" />
        <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
)


export const AiInsights: React.FC<AiInsightsProps> = ({ user, insights, healthScore, healthSummary, loading, error, onGenerate, onUpgrade }) => {

    if (user?.plan === 'Free') {
        return (
            <UpgradeNotice 
                onUpgrade={onUpgrade}
                title="Get Your Personal AI Analyst"
                description="Upgrade to Pro to unlock AI-powered insights. Understand your risks, discover opportunities, and get a deeper understanding of your portfolio."
            />
        );
    }
    
    return (
        <div className="animate-fade-in">
            <Card>
                <Card.Header>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Card.Title>AI-Powered Insights</Card.Title>
                            <Card.Description>Your personal portfolio analysis, powered by Gemini.</Card.Description>
                        </div>
                        <Button variant="secondary" onClick={() => onGenerate(true)} disabled={loading} className="mt-4 sm:mt-0">
                            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Analyzing...' : 'Regenerate'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Content className="p-6 space-y-6">
                    <div className="border-b border-neutral-200 dark:border-neutral-700 pb-6">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 text-center">Overall Portfolio Health</h3>
                        <div className="flex justify-center">
                           <WalletHealthScore score={healthScore} summary={healthSummary} loading={loading} size="large" />
                        </div>
                    </div>
                    
                    {error && <ErrorDisplay message={error} onRetry={() => onGenerate(true)} />}

                    {!error && (
                         <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Key Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loading && Array.from({length: 4}).map((_, i) => <SkeletonCard key={i} />)}
                                {!loading && insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
                            </div>
                        </div>
                    )}

                    {!loading && !error && insights.length === 0 && (
                         <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No Insights Yet</h3>
                            <p className="mt-1">Click "Regenerate" to analyze your portfolio.</p>
                        </div>
                    )}
                </Card.Content>
            </Card>
        </div>
    )
};
