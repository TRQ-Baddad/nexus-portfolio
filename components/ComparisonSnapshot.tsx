
import React, { useMemo } from 'react';
import { User, WhaleWallet, Token, PortfolioValue } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { BLOCKCHAIN_METADATA } from '../constants';

interface ComparisonSnapshotProps {
  user: User;
  whale: WhaleWallet;
  userPortfolio: {
      tokens: Token[];
      portfolioValue: PortfolioValue;
  };
  whaleTokens: Token[];
}

const SnapshotBackground = () => (
    <div className="absolute inset-0 z-0">
        <div 
            className="w-full h-full"
            style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
                backgroundSize: '20px 20px'
            }}
        />
    </div>
);

const PortfolioColumn: React.FC<{ title: string; avatarUrl?: string; chainIcon?: React.FC<any>; totalValue: number; changePercent: number; }> = ({ title, avatarUrl, chainIcon: ChainIcon, totalValue, changePercent }) => {
    const isPositive = changePercent >= 0;
    return (
        <div className="text-center">
            <div className="flex justify-center items-center h-12">
                 {avatarUrl ? <img src={avatarUrl} alt={title} className="w-12 h-12 rounded-full" /> : ChainIcon && <ChainIcon className="w-12 h-12" />}
            </div>
            <p className="font-bold text-lg mt-3 truncate">{title}</p>
            <p className="text-3xl font-extrabold tracking-tight mt-2">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalValue)}
            </p>
            <div className={`flex items-center justify-center text-md font-semibold mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? <ArrowUpRightIcon className="w-4 h-4 mr-1.5" /> : <ArrowDownRightIcon className="w-4 h-4 mr-1.5" />}
                <span>{changePercent.toFixed(2)}%</span>
            </div>
        </div>
    );
};

const OverlapStat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-3xl font-bold text-brand-blue">{value}</p>
        <p className="text-xs text-neutral-400 font-semibold tracking-wide uppercase">{label}</p>
    </div>
)

export const ComparisonSnapshot: React.FC<ComparisonSnapshotProps> = ({ user, whale, userPortfolio, whaleTokens }) => {
    const comparisonMetrics = useMemo(() => {
        const userTokenMap = new Map<string, Token>(userPortfolio.tokens.map(t => [t.symbol.toLowerCase(), t]));
        const whaleTokenMap = new Map<string, Token>(whaleTokens.map(t => [t.symbol.toLowerCase(), t]));

        const sharedAssets: { symbol: string, logoUrl: string, userValue: number, whaleValue: number }[] = [];

        userTokenMap.forEach((userToken, symbol) => {
            if (whaleTokenMap.has(symbol)) {
                const whaleToken = whaleTokenMap.get(symbol)!; // Safe due to .has() check
                sharedAssets.push({
                    symbol: userToken.symbol,
                    logoUrl: userToken.logoUrl,
                    userValue: userToken.value,
                    whaleValue: whaleToken.value,
                });
            }
        });

        const userOnlyCount = userTokenMap.size - sharedAssets.length;
        const whaleOnlyCount = whaleTokenMap.size - sharedAssets.length;

        const topShared = sharedAssets
            .sort((a, b) => (b.userValue + b.whaleValue) - (a.userValue + a.whaleValue))
            .slice(0, 4); 

        return {
            sharedCount: sharedAssets.length,
            userOnlyCount,
            whaleOnlyCount,
            topShared,
        };
    }, [userPortfolio.tokens, whaleTokens]);

    return (
        <div 
            className="w-full aspect-[1200/630] bg-gradient-to-br from-neutral-900 to-black text-white p-8 flex flex-col justify-between font-sans relative overflow-hidden rounded-lg"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <SnapshotBackground />

             <div className="relative z-10 flex flex-col justify-between h-full">
                <header className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <LogoIcon className="h-10 w-10" />
                        <span className="text-2xl font-bold">Nexus Comparison</span>
                    </div>
                </header>

                <main className="grid grid-cols-5 gap-6 items-center">
                    <div className="col-span-2">
                        <PortfolioColumn 
                            title="Your Portfolio"
                            avatarUrl={user.avatar_url}
                            totalValue={userPortfolio.portfolioValue.total}
                            changePercent={userPortfolio.portfolioValue.change24hPercent}
                        />
                    </div>
                    <div className="col-span-1 flex flex-col items-center justify-center space-y-6">
                        <OverlapStat value={comparisonMetrics.sharedCount} label="Shared Assets" />
                        <OverlapStat value={comparisonMetrics.userOnlyCount} label="Your Unique" />
                        <OverlapStat value={comparisonMetrics.whaleOnlyCount} label="Whale's Unique" />
                    </div>
                     <div className="col-span-2">
                         <PortfolioColumn 
                            title={whale.name}
                            chainIcon={BLOCKCHAIN_METADATA[whale.blockchain].icon}
                            totalValue={whale.totalValue}
                            changePercent={whale.change24h}
                        />
                    </div>
                </main>

                <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                    <p className="text-sm font-semibold text-neutral-300 mb-3 text-center">Top Shared Assets</p>
                    {comparisonMetrics.topShared.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {comparisonMetrics.topShared.map(token => (
                                <div key={token.symbol} className="flex flex-col items-center text-center">
                                    <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
                                    <p className="font-bold text-md mt-2">{token.symbol}</p>
                                    <p className="text-xs text-neutral-400 font-mono">You: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(token.userValue)}</p>
                                    <p className="text-xs text-neutral-400 font-mono">Whale: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(token.whaleValue)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-neutral-500 py-4">No shared assets found.</p>
                    )}
                </div>
                
                <footer className="text-center text-xs text-neutral-500">
                    Compare your portfolio at nexus-portfolio.app
                </footer>
            </div>
        </div>
    );
};
