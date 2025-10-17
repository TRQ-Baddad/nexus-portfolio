import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { IntelligenceEvent, User, WhaleWallet, Token, Alert, Insight, IntelligenceEventType, ActiveView } from '../types';
import { Card } from './shared/Card';
import { formatRelativeTime } from '../utils/formatters';
import { Skeleton } from './shared/Skeleton';
import { PortfolioMovementCard } from './event_cards/PortfolioMovementCard';
import { WhaleAlertCard } from './event_cards/WhaleAlertCard';
import { InsightEventCard } from './event_cards/InsightEventCard';
import { UpgradeNotice } from './shared/UpgradeNotice';
import { Button } from './shared/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { Pagination } from './shared/Pagination';
import { useAiStrategyBriefing, StrategicBriefing } from '../hooks/useAiStrategyBriefing';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';


interface IntelligenceViewProps {
    user: User | null;
    feedItems: IntelligenceEvent[];
    onViewWhale: (whale: WhaleWallet) => void;
    loading: boolean;
    onUpgrade: () => void;
    whales: WhaleWallet[];
    setActiveView: (view: ActiveView) => void;
    onOpenAddWatchlistTokenModal: () => void;
}

const ITEMS_PER_PAGE = 10;

const FeedItem: React.FC<{ item: IntelligenceEvent; onViewWhale: (whale: WhaleWallet) => void; whales: WhaleWallet[] }> = ({ item, onViewWhale, whales }) => {
    
    const renderContent = () => {
        switch (item.type) {
            case 'portfolio_movement':
                return <PortfolioMovementCard token={item.data as Token} />;
            case 'whale_alert':
                const alert = item.data as Alert;
                const whale = whales.find(w => w.id === alert.whaleId);
                return <WhaleAlertCard alert={alert} onViewWhale={() => whale && onViewWhale(whale)} />;
            case 'insight':
                return <InsightEventCard insight={item.data as Insight} />;
            default:
                return null;
        }
    }

    return (
        <li className="p-4">
            <div className="flex space-x-4">
                <div className="relative">
                    <div className="h-full w-px bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
                </div>
                <div className="flex-grow space-y-2">
                    {renderContent()}
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 pt-2">{formatRelativeTime(new Date(item.timestamp))}</p>
                </div>
            </div>
        </li>
    )
}

const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            isActive ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
        }`}
    >
        {label}
    </button>
);

const StrategyCard: React.FC<{ 
    briefing: StrategicBriefing | null;
    isLoading: boolean;
    error: string | null;
    onGenerate: (force?: boolean) => void;
    onNavigate: (view: ActiveView) => void;
    onAddWatchlist: () => void;
}> = ({ briefing, isLoading, error, onGenerate, onNavigate, onAddWatchlist }) => {
    
    const handleAction = (action: string) => {
        if(action.startsWith('nav:')) {
            onNavigate(action.split(':')[1] as ActiveView);
        } else if (action === 'action:add_watchlist') {
            onAddWatchlist();
        }
    }
    
    if (isLoading && !briefing) { // Show big skeleton only on initial load
        return (
             <Card>
                <Card.Content className="p-6 space-y-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-5 w-1/4 mt-4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </Card.Content>
            </Card>
        )
    }

    if (error) {
         return (
             <Card>
                <Card.Content className="p-6 text-center">
                    <p className="text-sm text-error mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => onGenerate(true)}>Try Again</Button>
                </Card.Content>
            </Card>
        )
    }

    if (!briefing) {
        return (
             <Card className="text-center p-8 flex flex-col items-center justify-center h-full">
                <SparklesIcon className="w-12 h-12 text-brand-blue mb-4" />
                <h3 className="font-bold text-lg">AI Strategic Briefing</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-4">
                   Let our AI analyze your entire activity feed to synthesize key observations and actionable strategies.
                </p>
                <Button onClick={() => onGenerate()}>
                    Generate Briefing
                </Button>
            </Card>
        );
    }
    
    return (
        <Card className="animate-fade-in">
            <Card.Header>
                <div className="flex justify-between items-center">
                    <Card.Title>AI Strategic Briefing</Card.Title>
                    <Button variant="secondary" size="sm" onClick={() => onGenerate(true)} disabled={isLoading}>
                        <RefreshCwIcon className={`w-3 h-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Regenerate
                    </Button>
                </div>
            </Card.Header>
            <Card.Content className="p-6 space-y-6">
                <div>
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center"><LightbulbIcon className="w-5 h-5 mr-2 text-success"/>Key Observations</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {briefing.keyObservations.map((obs, i) => <li key={i}>{obs}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center"><ArrowRightIcon className="w-5 h-5 mr-2 text-brand-blue"/>Actionable Strategies</h4>
                    <div className="space-y-2">
                        {briefing.actionableStrategies.map((strat, i) => (
                            <button key={i} onClick={() => handleAction(strat.action)} className="w-full text-left p-3 rounded-md bg-neutral-100 dark:bg-neutral-900/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                                <p className="text-sm font-semibold">{strat.suggestion}</p>
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2 text-warning"/>Primary Risk Factor</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{briefing.riskFactor}</p>
                </div>
            </Card.Content>
        </Card>
    );
};


export const IntelligenceView: React.FC<IntelligenceViewProps> = ({ user, feedItems, onViewWhale, loading, onUpgrade, whales, setActiveView, onOpenAddWatchlistTokenModal }) => {
    const [filter, setFilter] = useState<'all' | IntelligenceEventType>('all');
    const { briefing, isGenerating, error, generateBriefing } = useAiStrategyBriefing();
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);
    
    const handleGenerateBriefing = useCallback((force = false) => {
        generateBriefing(feedItems, force);
    }, [feedItems, generateBriefing]);
    
    if (user?.plan === 'Free') {
        return (
            <UpgradeNotice 
                onUpgrade={onUpgrade}
                title="Unlock The Alpha Feed"
                description="Upgrade to Pro to get a real-time, historical feed of every significant move made by top crypto whales and your portfolio."
                features={['Real-time whale alerts', 'AI-powered insights', 'Significant portfolio movements', 'Historical activity feed']}
            />
        );
    }

    const filteredItems = useMemo(() => {
        if (filter === 'all') return feedItems;
        return feedItems.filter(item => item.type === filter);
    }, [feedItems, filter]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Intelligence Feed</h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">Your personalized feed of portfolio events, insights, and whale activity.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <Card.Header>
                             <div className="flex items-center flex-wrap gap-2">
                                <FilterButton label="All" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                                <FilterButton label="My Portfolio" isActive={filter === 'portfolio_movement'} onClick={() => setFilter('portfolio_movement')} />
                                <FilterButton label="Whales" isActive={filter === 'whale_alert'} onClick={() => setFilter('whale_alert')} />
                                <FilterButton label="Insights" isActive={filter === 'insight'} onClick={() => setFilter('insight')} />
                            </div>
                        </Card.Header>
                         <Card.Content className="p-0">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : paginatedItems.length > 0 ? (
                                <>
                                    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {paginatedItems.map(item => (
                                        <FeedItem key={item.id} item={item} onViewWhale={onViewWhale} whales={whales} />
                                    ))}
                                    </ul>
                                    <Pagination 
                                        totalItems={filteredItems.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        currentPage={currentPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </>
                            ) : (
                                <div className="text-center p-16 text-neutral-500 dark:text-neutral-400">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No Events Found</h3>
                                    <p className="mt-1">There are no events matching your current filter.</p>
                                </div>
                            )}
                        </Card.Content>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <StrategyCard 
                        briefing={briefing}
                        isLoading={isGenerating}
                        error={error}
                        onGenerate={handleGenerateBriefing}
                        onNavigate={setActiveView}
                        onAddWatchlist={onOpenAddWatchlistTokenModal}
                    />
                </div>
            </div>
        </div>
    );
};
