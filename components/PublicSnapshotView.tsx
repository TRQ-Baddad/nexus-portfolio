import React, { useState, useEffect } from 'react';
import { PortfolioValue, Token, WhaleWallet, User } from '../types';
import { PortfolioSnapshot } from './PortfolioSnapshot';
import { ComparisonSnapshot } from './ComparisonSnapshot';
import { LogoIcon } from './icons/LogoIcon';

// Define the shape of the data we expect from localStorage
interface SnapshotPayload {
  portfolioValue: PortfolioValue;
  tokens: Token[];
  context: {
    mode: 'portfolio' | 'comparison';
    whale?: WhaleWallet;
    userPortfolio?: { tokens: Token[], portfolioValue: PortfolioValue };
    whaleTokens?: Token[];
  };
  user: User | null;
}

export const PublicSnapshotView: React.FC = () => {
    const [payload, setPayload] = useState<SnapshotPayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const dataString = localStorage.getItem('nexus-snapshot-data');
            if (dataString) {
                setPayload(JSON.parse(dataString));
            } else {
                setError("No snapshot data found. Please generate a new share link from the app.");
            }
        } catch (e) {
            console.error("Failed to parse snapshot data:", e);
            setError("Could not load snapshot data. The link may be corrupted.");
        }
    }, []);

    const renderContent = () => {
        if (error) {
             return (
                <div className="text-center p-8 bg-neutral-800 rounded-lg">
                    <h1 className="text-2xl font-bold">Snapshot Unavailable</h1>
                    <p className="text-neutral-400 mt-2">{error}</p>
                </div>
            );
        }

        if (!payload) {
             return (
                 <div className="text-center p-8">
                    <h1 className="text-2xl font-bold animate-pulse">Loading Snapshot...</h1>
                </div>
            );
        }
        
        const { context, user } = payload;
        
        if (context.mode === 'comparison' && context.whale && context.userPortfolio && context.whaleTokens && user) {
            return <ComparisonSnapshot user={user} whale={context.whale} userPortfolio={context.userPortfolio} whaleTokens={context.whaleTokens} />;
        }
        
        return <PortfolioSnapshot portfolioValue={payload.portfolioValue} tokens={payload.tokens} />;
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto animate-fade-in">
                {renderContent()}
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