import React, { useState } from 'react';
import { User, WhaleWallet, Token, PortfolioValue, WhaleSegment } from '../types';
import { useSmartMoneyWatchlist } from '../hooks/useSmartMoneyWatchlist';
import { useWhaleSegments } from '../hooks/useWhaleSegments';
import { WhaleCard } from './WhaleCard';
import { WhalePortfolio } from './WhalePortfolio';
import { WhaleSegmentsView } from './WhaleSegmentsView';
import { AddCustomWhaleModal } from './AddCustomWhaleModal';
import { DiscoverWhalesModal } from './DiscoverWhalesModal';
import { CreateSegmentModal } from './CreateSegmentModal';
import { Button } from './shared/Button';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UsersIcon } from './icons/UsersIcon';
import { Skeleton } from './shared/Skeleton';
import { WhaleSegmentDetailView } from './WhaleSegmentDetailView';
import { Card } from './shared/Card';
import { FishIcon } from './icons/FishIcon';

interface SmartMoneyProps {
    loading: boolean;
    selectedWhale: WhaleWallet | null;
    setSelectedWhale: (whale: WhaleWallet | null) => void;
    user: User | null;
    userPortfolio: {
        tokens: Token[];
        portfolioValue: PortfolioValue;
    };
    onShareComparison: (whale: WhaleWallet, whaleTokens: Token[]) => void;
    onUpgrade: () => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon: React.FC<any> }> = ({ label, isActive, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${
            isActive ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </button>
);

const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/50 space-y-4">
                <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        ))}
    </div>
);


export const SmartMoney: React.FC<SmartMoneyProps> = ({ selectedWhale, setSelectedWhale, user, userPortfolio, onShareComparison, loading: initialLoading, onUpgrade }) => {
    const { whales, addCustomWhale, removeCustomWhale } = useSmartMoneyWatchlist();
    const { segments, addSegment } = useWhaleSegments(whales);
    const [activeTab, setActiveTab] = useState<'watchlist' | 'segments'>('watchlist');
    
    const [isAddWhaleModalOpen, setIsAddWhaleModalOpen] = useState(false);
    const [isDiscoverWhaleModalOpen, setIsDiscoverWhaleModalOpen] = useState(false);
    const [isCreateSegmentModalOpen, setIsCreateSegmentModalOpen] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState<WhaleSegment | null>(null);

    if (selectedWhale) {
        return <WhalePortfolio whale={selectedWhale} onBack={() => setSelectedWhale(null)} userPortfolio={userPortfolio} onShareComparison={onShareComparison} />;
    }
    
    if (selectedSegment) {
        return <WhaleSegmentDetailView segment={selectedSegment} onBack={() => setSelectedSegment(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Smart Money</h1>
                    <p className="mt-2 text-neutral-500 dark:text-neutral-400">Track top traders and strategic cohorts to gain an edge.</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                     <TabButton label="Watchlist" isActive={activeTab === 'watchlist'} onClick={() => setActiveTab('watchlist')} icon={UserPlusIcon} />
                     <TabButton label="Segments" isActive={activeTab === 'segments'} onClick={() => setActiveTab('segments')} icon={UsersIcon} />
                </div>
            </div>
            
            {activeTab === 'watchlist' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsDiscoverWhaleModalOpen(true)}>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Discover Whales
                        </Button>
                        <Button onClick={() => setIsAddWhaleModalOpen(true)}>
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            Add Custom Wallet
                        </Button>
                    </div>
                     {initialLoading ? <SkeletonGrid /> : (
                        whales.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {whales.map(whale => (
                                    <WhaleCard key={whale.id} whale={whale} onView={() => setSelectedWhale(whale)} onRemove={removeCustomWhale} />
                                ))}
                            </div>
                        ) : (
                             <Card>
                                <Card.Content className="p-10 text-center flex flex-col items-center">
                                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
                                        <FishIcon className="w-8 h-8 text-neutral-500" />
                                    </div>
                                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Your Watchlist is Empty</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
                                        Start tracking top traders. Add wallets from our AI-powered suggestions or add any public address you want to follow.
                                    </p>
                                </Card.Content>
                            </Card>
                        )
                    )}
                </div>
            )}
            
            {activeTab === 'segments' && (
                <WhaleSegmentsView 
                    segments={segments} 
                    onCreateSegment={() => setIsCreateSegmentModalOpen(true)}
                    onViewSegment={setSelectedSegment}
                    loading={initialLoading}
                    allWhales={whales}
                />
            )}
            
            <AddCustomWhaleModal 
                isOpen={isAddWhaleModalOpen}
                onClose={() => setIsAddWhaleModalOpen(false)}
                onAddWhale={(data) => {
                    addCustomWhale(data);
                    setIsAddWhaleModalOpen(false);
                }}
                existingWhales={whales}
                user={user}
                onUpgrade={() => {
                    setIsAddWhaleModalOpen(false);
                    onUpgrade();
                }}
            />

            <DiscoverWhalesModal
                isOpen={isDiscoverWhaleModalOpen}
                onClose={() => setIsDiscoverWhaleModalOpen(false)}
                onAddWhale={(data) => {
                    addCustomWhale(data);
                }}
                existingWhales={whales}
            />

            <CreateSegmentModal
                isOpen={isCreateSegmentModalOpen}
                onClose={() => setIsCreateSegmentModalOpen(false)}
                onAddSegment={addSegment}
                user={user}
                onUpgrade={onUpgrade}
            />

        </div>
    );
};