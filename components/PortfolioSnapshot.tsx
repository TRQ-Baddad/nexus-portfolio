import React from 'react';
import { PortfolioValue, Token } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';

interface PortfolioSnapshotProps {
  portfolioValue: PortfolioValue;
  tokens: Token[];
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

export const PortfolioSnapshot: React.FC<PortfolioSnapshotProps> = ({ portfolioValue, tokens }) => {
    const { total, change24h, change24hPercent } = portfolioValue;
    const isPositive = change24h >= 0;

    const topTokens = tokens.sort((a, b) => b.value - a.value).slice(0, 5);

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
                        <span className="text-2xl font-bold">Nexus</span>
                    </div>
                </header>

                <main className="grid grid-cols-2 gap-8 items-center">
                    {/* Left Column: Total Value */}
                    <div>
                        <p className="text-sm text-neutral-400">Total Portfolio Value</p>
                        <p className="text-5xl font-extrabold tracking-tight mt-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
                        </p>
                        <div className={`flex items-center text-lg font-semibold mt-2 ${isPositive ? 'text-success' : 'text-error'}`}>
                             {isPositive ? <ArrowUpRightIcon className="w-5 h-5 mr-1.5" /> : <ArrowDownRightIcon className="w-5 h-5 mr-1.5" />}
                            <span>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(change24h)}
                                <span className="text-sm ml-2 opacity-80">({change24hPercent.toFixed(2)}%)</span>
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Top Assets */}
                    <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                        <p className="text-sm font-semibold text-neutral-300 mb-3">Top Assets</p>
                        <ul className="space-y-2">
                            {topTokens.map(token => (
                                <li key={token.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <img 
                                            src={token.logoUrl} 
                                            alt={token.name} 
                                            className="w-6 h-6 rounded-full mr-2.5"
                                        />
                                        <div>
                                            <p className="font-semibold text-white">{token.symbol}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-semibold text-white">
                                           {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(token.value)}
                                       </p>
                                       <p className={`text-xs ${token.change24h >= 0 ? 'text-success' : 'text-error'}`}>
                                           {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                                       </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </main>
                
                <footer className="text-center text-xs text-neutral-500">
                    Track your portfolio at nexus-portfolio.app
                </footer>
            </div>
        </div>
    );
}
