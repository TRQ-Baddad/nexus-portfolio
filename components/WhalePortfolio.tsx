import React, { useState } from 'react';
import { WhaleWallet, Token, PortfolioValue } from '../types';
import { useWhalePortfolio } from '../hooks/useWhalePortfolio';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { BLOCKCHAIN_METADATA } from '../constants';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { Share2Icon } from './icons/Share2Icon';
import { TokenTable } from './TokenTable';
import { NftGallery } from './NftGallery';
import { WhaleActivityFeed } from './WhaleActivityFeed';
import { PortfolioComparison } from './PortfolioComparison';
import { CopyableAddress } from './shared/CopyableAddress';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface WhalePortfolioProps {
    whale: WhaleWallet;
    onBack: () => void;
    userPortfolio: {
        tokens: Token[];
        portfolioValue: PortfolioValue;
    };
    onShareComparison: (whale: WhaleWallet, whaleTokens: Token[]) => void;
}

type WhaleTab = 'Portfolio' | 'NFTs' | 'Activity' | 'Comparison';

const TabButton: React.FC<{ label: WhaleTab; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg border-b-2 whitespace-nowrap ${
            isActive ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
    >
        {label}
    </button>
);


export const WhalePortfolio: React.FC<WhalePortfolioProps> = ({ whale, onBack, userPortfolio, onShareComparison }) => {
    const { tokens: whaleTokens, nfts, transactions, loading } = useWhalePortfolio(whale);
    const [activeTab, setActiveTab] = useState<WhaleTab>('Portfolio');
    const { formatCurrency } = useUserPreferences();

    const metadata = BLOCKCHAIN_METADATA[whale.blockchain] || { icon: (() => null), name: 'Unknown', color: 'gray' };
    const Icon = metadata.icon;
    const isPositive = whale.change24h >= 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4">
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Whale Portfolio</h1>
            </div>

            <Card>
                <Card.Content className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                            <Icon className="w-12 h-12" />
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{whale.name}</h2>
                                <CopyableAddress address={whale.address} />
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 text-left sm:text-right">
                             <p className="text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(whale.totalValue)}</p>
                            <div className={`flex items-center justify-start sm:justify-end text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                                {isPositive ? <ArrowUpRightIcon className="w-4 h-4 mr-1" /> : <ArrowDownRightIcon className="w-4 h-4 mr-1" />}
                                <span>{whale.change24h.toFixed(2)}% in 24h</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-4 max-w-2xl">{whale.description}</p>
                </Card.Content>
            </Card>
            
             <Card>
                 <Card.Header>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="w-full sm:w-auto border-b border-neutral-200 dark:border-neutral-700">
                             <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto">
                                <TabButton label="Portfolio" isActive={activeTab === 'Portfolio'} onClick={() => setActiveTab('Portfolio')} />
                                <TabButton label="NFTs" isActive={activeTab === 'NFTs'} onClick={() => setActiveTab('NFTs')} />
                                <TabButton label="Activity" isActive={activeTab === 'Activity'} onClick={() => setActiveTab('Activity')} />
                                <TabButton label="Comparison" isActive={activeTab === 'Comparison'} onClick={() => setActiveTab('Comparison')} />
                             </nav>
                        </div>
                         <Button variant="secondary" onClick={() => onShareComparison(whale, whaleTokens)} className="flex-shrink-0 w-full sm:w-auto">
                             <Share2Icon className="w-4 h-4 mr-2" />
                             Share Analysis
                         </Button>
                     </div>
                 </Card.Header>

                {activeTab === 'Portfolio' && <TokenTable tokens={whaleTokens} loading={loading} />}
                {activeTab === 'NFTs' && <NftGallery nfts={nfts} loading={loading} />}
                {activeTab === 'Activity' && <WhaleActivityFeed transactions={transactions} loading={loading} whaleAddresses={[whale.address]} />}
                {activeTab === 'Comparison' && <PortfolioComparison whale={whale} whaleTokens={whaleTokens} userPortfolio={userPortfolio} loading={loading} />}
                 
             </Card>

        </div>
    );
};
