

import React from 'react';
import { PortfolioValue, HistoricalDataPoint, Token, Insight, User } from '../types';
import { Charts } from './Charts';
import { Card } from './shared/Card';
import { WalletHealthScore } from './WalletHealthScore';
import { AssetAllocationChart } from './AssetAllocationChart';
import { AiInsights } from './AiInsights';
import { UpgradeNotice } from './shared/UpgradeNotice';

interface PortfolioAnalyticsProps {
    portfolioValue: PortfolioValue;
    historicalData: HistoricalDataPoint[];
    tokens: Token[];
    insights: Insight[];
    healthScore: number | null;
    healthSummary: string | null;
    loading: boolean;
    insightsLoading: boolean;
    user: User | null;
    onUpgrade: () => void;
    onGenerateInsights: (force?: boolean) => void;
}

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = (props) => {
    const { user, onUpgrade } = props;

    if (user?.plan === 'Free') {
        return (
            <UpgradeNotice 
                onUpgrade={onUpgrade}
                title="Unlock Your Personal AI Analyst"
                description="Upgrade to Pro to access in-depth portfolio analytics, historical charts, and AI-powered insights to guide your strategy."
            />
        );
    }
    
    return (
        <div className="space-y-8 animate-fade-in pb-24">
             <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Portfolio Analytics</h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">An in-depth look at your portfolio performance and health.</p>
            </div>
            
            <Charts historicalData={props.historicalData} portfolioValue={props.portfolioValue} loading={props.loading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <AiInsights
                        user={props.user}
                        insights={props.insights}
                        healthScore={props.healthScore}
                        healthSummary={props.healthSummary}
                        loading={props.insightsLoading}
                        error={null} // Simplified for this view, errors are handled at top level
                        onGenerate={props.onGenerateInsights}
                        onUpgrade={props.onUpgrade}
                     />
                </div>
                <div className="space-y-8">
                     <WalletHealthScore score={props.healthScore} summary={props.healthSummary} loading={props.insightsLoading || props.loading} />
                     <AssetAllocationChart tokens={props.tokens} loading={props.loading} totalValue={props.portfolioValue.total} />
                </div>
            </div>
        </div>
    );
};