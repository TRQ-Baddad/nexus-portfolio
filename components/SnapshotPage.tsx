import React from 'react';
import { PortfolioValue, Token } from '../types';
import { PortfolioSnapshot } from './PortfolioSnapshot';
import { LogoIcon } from './icons/LogoIcon';

interface SnapshotPageProps {
  portfolioValue: PortfolioValue;
  tokens: Token[];
}

export const SnapshotPage: React.FC<SnapshotPageProps> = ({ portfolioValue, tokens }) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
             <PortfolioSnapshot portfolioValue={portfolioValue} tokens={tokens} />
        </div>
        <div className="mt-8 text-center">
            <a href="/" className="inline-flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors">
                <LogoIcon className="w-6 h-6" />
                <span className="font-semibold">Powered by Nexus Portfolio</span>
            </a>
            <p className="text-sm text-neutral-500 mt-2">The ultimate multi-chain crypto portfolio tracker.</p>
        </div>
    </div>
  );
};