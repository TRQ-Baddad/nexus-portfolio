
import React, { useMemo } from 'react';
import { Token, WhaleWallet, PortfolioValue } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface PortfolioComparisonProps {
    whale: WhaleWallet;
    whaleTokens: Token[];
    userPortfolio: {
        tokens: Token[];
        portfolioValue: PortfolioValue;
    };
    loading: boolean;
}

interface ComparisonMetrics {
    sharedAssets: Token[];
    userOnlyAssets: Token[];
    whaleOnlyAssets: Token[];
    combinedAssets: Map<string, { user?: Token, whale?: Token }>;
}

const StatCard: React.FC<{ title: string; value: string; changePercent?: number; }> = ({ title, value, changePercent }) => {
    const isPositive = changePercent !== undefined && changePercent >= 0;

    return (
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
            {changePercent !== undefined && (
                <div className={`flex items-center text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                    {isPositive ? <ArrowUpRightIcon className="w-4 h-4 mr-1" /> : <ArrowDownRightIcon className="w-4 h-4 mr-1" />}
                    <span>{changePercent.toFixed(2)}%</span>
                </div>
            )}
        </div>
    );
};

const ComparisonRow: React.FC<{ token: { user?: Token, whale?: Token }, symbol: string, name: string, logo: string }> = ({ token, symbol, name, logo }) => {
    const userValue = token.user?.value ?? 0;
    const whaleValue = token.whale?.value ?? 0;
    const { formatCurrency } = useUserPreferences();
    
    return (
        <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt={name} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{symbol}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-right">
                {token.user ? (
                    <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(userValue)}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{token.user.amount.toLocaleString()} {symbol}</p>
                    </div>
                ) : <span className="text-neutral-400 dark:text-neutral-500">-</span>}
            </td>
             <td className="p-4 text-right">
                {token.whale ? (
                     <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(whaleValue)}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{token.whale.amount.toLocaleString()} {symbol}</p>
                    </div>
                ) : <span className="text-neutral-400 dark:text-neutral-500">-</span>}
            </td>
        </tr>
    );
};

const SkeletonRow = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4">
            <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
        </td>
        <td className="p-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
        <td className="p-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
    </tr>
)


export const PortfolioComparison: React.FC<PortfolioComparisonProps> = ({ whale, whaleTokens, userPortfolio, loading }) => {
    const { formatCurrency } = useUserPreferences();

    const comparisonMetrics = useMemo((): ComparisonMetrics => {
        const userTokenMap = new Map<string, Token>(userPortfolio.tokens.map(t => [t.symbol.toLowerCase(), t]));
        const whaleTokenMap = new Map<string, Token>(whaleTokens.map(t => [t.symbol.toLowerCase(), t]));

        const sharedAssets: Token[] = [];
        const userOnlyAssets: Token[] = [];
        const whaleOnlyAssets: Token[] = [];
        
        for (const token of userTokenMap.values()) {
            if (whaleTokenMap.has(token.symbol.toLowerCase())) {
                sharedAssets.push(token);
            } else {
                userOnlyAssets.push(token);
            }
        }

        for (const token of whaleTokenMap.values()) {
            if (!userTokenMap.has(token.symbol.toLowerCase())) {
                whaleOnlyAssets.push(token);
            }
        }
        
        const combinedAssets = new Map<string, { user?: Token, whale?: Token }>();
        const allSymbols = new Set([...userTokenMap.keys(), ...whaleTokenMap.keys()]);
        
        allSymbols.forEach(symbol => {
            combinedAssets.set(symbol, {
                user: userTokenMap.get(symbol),
                whale: whaleTokenMap.get(symbol),
            });
        });
        
        return { sharedAssets, userOnlyAssets, whaleOnlyAssets, combinedAssets };

    }, [userPortfolio.tokens, whaleTokens]);

    const sortedCombinedAssets = useMemo(() => {
        return Array.from(comparisonMetrics.combinedAssets.entries()).sort(([, a], [, b]) => {
            const valueA = (a.user?.value || 0) + (a.whale?.value || 0);
            const valueB = (b.user?.value || 0) + (b.whale?.value || 0);
            return valueB - valueA;
        });
    }, [comparisonMetrics.combinedAssets]);

    return (
        <div className="p-6 space-y-6">
            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Card */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Your Portfolio</h3>
                     {loading ? <Skeleton className="h-24 w-full" /> : 
                        <StatCard 
                            title="Total Value"
                            value={formatCurrency(userPortfolio.portfolioValue.total)}
                            changePercent={userPortfolio.portfolioValue.change24hPercent}
                        />
                     }
                </div>
                {/* Whale Card */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{whale.name}</h3>
                     {loading ? <Skeleton className="h-24 w-full" /> : 
                        <StatCard 
                            title="Total Value"
                            value={formatCurrency(whale.totalValue)}
                            changePercent={whale.change24h}
                        />
                    }
                </div>
            </div>

            {/* Overlap Analysis */}
            <div>
                 <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Portfolio Overlap</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {loading ? <Skeleton className="h-24 w-full" /> :
                        <StatCard title="Shared Assets" value={comparisonMetrics.sharedAssets.length.toLocaleString()} />
                     }
                      {loading ? <Skeleton className="h-24 w-full" /> :
                        <StatCard title="Your Unique Assets" value={comparisonMetrics.userOnlyAssets.length.toLocaleString()} />
                      }
                       {loading ? <Skeleton className="h-24 w-full" /> :
                        <StatCard title="Whale's Unique Assets" value={comparisonMetrics.whaleOnlyAssets.length.toLocaleString()} />
                       }
                 </div>
            </div>

            {/* Detailed Asset Table */}
             <div>
                 <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Asset Breakdown</h3>
                <Card className="!shadow-none">
                     <Card.Content className="p-0">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        <th className="p-4 font-medium">Asset</th>
                                        <th className="p-4 font-medium text-right">Your Holdings</th>
                                        <th className="p-4 font-medium text-right">{whale.name}'s Holdings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({length: 5}).map((_, i) => <SkeletonRow key={i}/>)
                                    ) : (
                                        sortedCombinedAssets.map(([symbol, tokenData]) => {
                                            const tokenMeta = tokenData.user || tokenData.whale;
                                            if (!tokenMeta) return null;
                                            return <ComparisonRow key={symbol} symbol={tokenMeta.symbol} name={tokenMeta.name} logo={tokenMeta.logoUrl} token={tokenData} />
                                        })
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </Card.Content>
                </Card>
            </div>
        </div>
    );
};
