import React, { useState } from 'react';
import { WhaleSegment } from '../types';
import { useWhaleSegmentPortfolio } from '../hooks/useWhaleSegmentPortfolio';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { TokenTable } from './TokenTable';
import { NftGallery } from './NftGallery';
import { WhaleActivityFeed } from './WhaleActivityFeed';
import { UsersIcon } from './icons/UsersIcon';
import { Skeleton } from './shared/Skeleton';

interface WhaleSegmentDetailViewProps {
    segment: WhaleSegment;
    onBack: () => void;
}

type SegmentTab = 'Portfolio' | 'NFTs' | 'Activity';

const TabButton: React.FC<{ label: SegmentTab; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg border-b-2 whitespace-nowrap ${
            isActive ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
    >
        {label}
    </button>
);


export const WhaleSegmentDetailView: React.FC<WhaleSegmentDetailViewProps> = ({ segment, onBack }) => {
    const { aggregatedTokens, aggregatedNfts, aggregatedTransactions, aggregatedPortfolioValue, loading } = useWhaleSegmentPortfolio(segment);
    const [activeTab, setActiveTab] = useState<SegmentTab>('Portfolio');

    const isPositive = aggregatedPortfolioValue.change24hPercent >= 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4">
                <Button variant="secondary" onClick={onBack}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Segment Analysis</h1>
            </div>

            <Card>
                <Card.Content className="p-6">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue">
                                <UsersIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{segment.name}</h2>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{segment.addresses.length} wallets</p>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 text-left sm:text-right">
                             {loading ? (
                                <>
                                    <Skeleton className="h-8 w-32 ml-auto" />
                                    <Skeleton className="h-4 w-24 ml-auto mt-2" />
                                </>
                             ) : (
                                <>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(aggregatedPortfolioValue.total)}</p>
                                    <div className={`flex items-center justify-start sm:justify-end text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                                        {isPositive ? <ArrowUpRightIcon className="w-4 h-4 mr-1" /> : <ArrowDownRightIcon className="w-4 h-4 mr-1" />}
                                        <span>{aggregatedPortfolioValue.change24hPercent.toFixed(2)}% in 24h</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                     <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-4 max-w-2xl">{segment.description}</p>
                </Card.Content>
            </Card>
            
             <Card>
                 <Card.Header>
                     <div className="w-full sm:w-auto border-b border-neutral-200 dark:border-neutral-700">
                         <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto">
                            <TabButton label="Portfolio" isActive={activeTab === 'Portfolio'} onClick={() => setActiveTab('Portfolio')} />
                            <TabButton label="NFTs" isActive={activeTab === 'NFTs'} onClick={() => setActiveTab('NFTs')} />
                            <TabButton label="Activity" isActive={activeTab === 'Activity'} onClick={() => setActiveTab('Activity')} />
                         </nav>
                    </div>
                 </Card.Header>

                {activeTab === 'Portfolio' && <TokenTable tokens={aggregatedTokens} loading={loading} />}
                {activeTab === 'NFTs' && <NftGallery nfts={aggregatedNfts} loading={loading} />}
                {activeTab === 'Activity' && <WhaleActivityFeed transactions={aggregatedTransactions} loading={loading} whaleAddresses={segment.addresses.map(a => a.address)} />}
                 
             </Card>

        </div>
    );
};