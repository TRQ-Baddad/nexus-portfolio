import React from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { ArrowRightIcon } from '../../../../../components/icons/ArrowRightIcon';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { InfoIcon } from '../../../../../components/icons/InfoIcon';
import { WalletHealthScore } from '../../../../../components/WalletHealthScore';
import { Insight } from '../../../../../types';
import { RefreshCwIcon } from '../../../../../components/icons/RefreshCwIcon';
import { formatRelativeTime } from '../../../../../utils/formatters';


interface AiInsightsSummaryCardProps {
    insights: Insight[];
    healthScore: number | null;
    healthSummary: string | null;
    loading: boolean;
    onNavigate: () => void;
    onGenerateInsights: (force: boolean) => void;
    lastAnalyzed: number | null;
}

export const AiInsightsSummaryCard: React.FC<AiInsightsSummaryCardProps> = ({ healthScore, healthSummary, loading, onNavigate, onGenerateInsights, lastAnalyzed }) => {
    return (
        <Card className="flex flex-col h-full">
            <Card.Header>
                <div className="flex justify-between items-center">
                    <Card.Title>AI Insights</Card.Title>
                     <div className="flex items-center space-x-2">
                        {lastAnalyzed && !loading && (
                            <p className="text-xs text-neutral-400">
                                {formatRelativeTime(new Date(lastAnalyzed))}
                            </p>
                        )}
                        <button onClick={() => onGenerateInsights(true)} disabled={loading} className="text-neutral-400 hover:text-brand-blue disabled:opacity-50">
                            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </Card.Header>
            <Card.Content className="p-4 flex-grow">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : healthScore !== null && healthSummary ? (
                    <WalletHealthScore score={healthScore} summary={healthSummary} loading={loading} />
                ) : (
                    <div className="h-full flex flex-col justify-between p-4 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                        <div>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-neutral-900 dark:text-white">AI Health Score</h4>
                                <InfoIcon className="w-4 h-4 text-neutral-400" />
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Your portfolio's risk & health.</p>
                        </div>
                        <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            Connect wallets with assets to generate a score.
                        </p>
                    </div>
                )}
            </Card.Content>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 mt-auto">
                <Button variant="secondary" onClick={onNavigate} className="w-full text-xs">
                    View Full Analysis
                    <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </Card>
    );
};