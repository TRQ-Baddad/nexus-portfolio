import React, { useState, useRef, useEffect } from 'react';
import { DashboardComponentKey, ActiveView } from '../../../../types';
import { PortfolioValue } from '../../../../components/PortfolioValue';
import { WalletList } from '../../../../components/WalletList';
import { TokenTable } from '../../../../components/TokenTable';
import { WelcomeAI } from '../../../../components/WelcomeAI';
import { MoveIcon } from '../../../../components/icons/MoveIcon';
import { AiInsightsSummaryCard } from './dashboard/AiInsightsSummaryCard';
import { NftsOverviewCard } from './dashboard/NftsOverviewCard';
import { DeFiSummaryCard } from './dashboard/DeFiSummaryCard';
import { FirstLookCard } from './dashboard/FirstLookCard';
import { useAppContext } from '../hooks/useAppContext';

export const Dashboard: React.FC = () => {
    const {
        loading,
        portfolioValue,
        wallets,
        tokens,
        removeWallet,
        refreshPortfolio,
        handleShare,
        setWalletToEdit,
        setIsAddWalletModalOpen,
        lastUpdated,
        displayedUser,
        preferences,
        setDashboardLayout,
        insights,
        healthScore,
        healthSummary,
        insightsLoading,
        nfts,
        defiPositions,
        setActiveView,
        handleGenerateInsights,
        lastAnalyzed,
        historicalData,
        watchlist,
        watchlistLoading,
        setIsAddWatchlistTokenModalOpen,
        removeFromWatchlist,
        firstLook,
        isGeneratingFirstLook,
        showFirstLook,
        dismissFirstLook,
    } = useAppContext();

    const [isEditMode, setIsEditMode] = useState(false);
    
    const rightColumnKeys: DashboardComponentKey[] = ['wallets', 'ai_insights', 'nfts_overview', 'defi_summary'];
    
    const [rightColumnLayout, setRightColumnLayout] = useState<DashboardComponentKey[]>([]);
    const [originalLayout, setOriginalLayout] = useState<DashboardComponentKey[]>([]);
    
    useEffect(() => {
        const layout = preferences.dashboardLayout;
        setRightColumnLayout(layout.filter(key => rightColumnKeys.includes(key)));
        setOriginalLayout(layout.filter(key => rightColumnKeys.includes(key)));
    }, [preferences.dashboardLayout]);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const isProUser = displayedUser?.plan === 'Pro';
    const canCustomize = isProUser;
    
    const handleEnterEditMode = () => {
        setOriginalLayout(rightColumnLayout);
        setIsEditMode(true);
    };

    const handleSaveLayout = () => {
        const newLayout: DashboardComponentKey[] = ['tokens', ...rightColumnLayout];
        setDashboardLayout(newLayout);
        setIsEditMode(false);
    };
    
    const handleCancelLayout = () => {
        setRightColumnLayout(originalLayout);
        setIsEditMode(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        const newLayout = [...rightColumnLayout];
        const draggedItemContent = newLayout.splice(dragItem.current!, 1)[0];
        newLayout.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setRightColumnLayout(newLayout);
    };
    
    if (!loading && wallets.length === 0) {
        return <WelcomeAI onAddWallet={() => setIsAddWalletModalOpen(true)} />;
    }

    const componentMap: Record<DashboardComponentKey, React.ReactNode> = {
        tokens: <TokenTable 
                    tokens={tokens} 
                    loading={loading}
                    watchlist={watchlist}
                    watchlistLoading={watchlistLoading}
                    onOpenAddWatchlistTokenModal={() => setIsAddWatchlistTokenModalOpen(true)}
                    onRemoveFromWatchlist={removeFromWatchlist}
                />,
        wallets: <WalletList wallets={wallets} loading={loading} removeWallet={removeWallet} onEditWallet={setWalletToEdit} />,
        ai_insights: <AiInsightsSummaryCard insights={insights} healthScore={healthScore} healthSummary={healthSummary} loading={insightsLoading} onNavigate={() => setActiveView('analytics')} onGenerateInsights={handleGenerateInsights} lastAnalyzed={lastAnalyzed} />,
        nfts_overview: <NftsOverviewCard nfts={nfts} loading={loading} onNavigate={() => setActiveView('nfts')} />,
        defi_summary: <DeFiSummaryCard positions={defiPositions} loading={loading} onNavigate={() => setActiveView('defi')} />,
    };
    
    return (
        <div className="space-y-8">
            {showFirstLook && (
                <FirstLookCard
                    analysis={firstLook}
                    isLoading={isGeneratingFirstLook}
                    onNavigate={setActiveView}
                    onDismiss={dismissFirstLook}
                />
            )}
            <PortfolioValue 
                data={portfolioValue} 
                loading={loading} 
                refreshPortfolio={refreshPortfolio} 
                onShare={handleShare} 
                lastUpdated={lastUpdated}
                canCustomize={canCustomize}
                isEditMode={isEditMode}
                onCustomize={handleEnterEditMode}
                onSaveLayout={handleSaveLayout}
                onCancelLayout={handleCancelLayout}
                historicalData={historicalData}
             />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Static) */}
                <div className="lg:col-span-2">
                    {componentMap.tokens}
                </div>

                {/* Right Column (Draggable) */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    {rightColumnLayout.map((key, index) => (
                        <div
                            key={key}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            className={`transition-all duration-300 flex flex-col flex-grow ${isEditMode ? 'cursor-move relative rounded-2xl ring-2 ring-dashed ring-brand-blue/50 p-1' : ''}`}
                        >
                            {isEditMode && (
                                <div className="absolute top-3 right-3 z-10 bg-brand-blue text-white rounded-full p-1.5 shadow-lg">
                                    <MoveIcon className="w-4 h-4" />
                                </div>
                            )}
                            <div className={`h-full ${isEditMode ? 'pointer-events-none' : ''}`}>
                                {componentMap[key]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};