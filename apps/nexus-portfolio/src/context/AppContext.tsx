import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AuthSession as Session } from '@supabase/supabase-js';
import { usePortfolio } from '../../../../hooks/usePortfolio';
import { useAlerts } from '../../../../hooks/useAlerts';
import { useAiInsights } from '../../../../hooks/useAiInsights';
import { useCommunityFeed } from '../../../../hooks/useCommunityFeed';
import { useUserPreferences } from '../../../../hooks/useUserPreferences';
import { useAnnouncements } from '../../../../hooks/useAnnouncements';
import { useMorningBrief } from '../../../../hooks/useMorningBrief';
import { useIntelligenceFeed } from '../../../../hooks/useIntelligenceFeed';
import { useFirstLook } from '../../../../hooks/useFirstLook';
import { useSmartMoneyWatchlist } from '../../../../hooks/useSmartMoneyWatchlist';
import { useTokenWatchlist } from '../../../../hooks/useTokenWatchlist';
import { useWhaleSegments } from '../../../../hooks/useWhaleSegments';
// FIX: Import useAiStrategyBriefing hook
import { useAiStrategyBriefing } from '../../../../hooks/useAiStrategyBriefing';
import { ActiveView, User, Wallet, WhaleWallet, Token, PortfolioValue, WatchlistToken, Insight, DeFiPosition, Transaction, Alert, NFT, CommunityTopic } from '../../../../types';
import { supabase } from '../../../../utils/supabase';

// Define the shape of the context
interface AppContextType {
    // State
    activeView: ActiveView;
    error: string | null;
    loading: boolean;
    wallets: Wallet[];
    tokens: Token[];
    nfts: NFT[];
    transactions: Transaction[];
    defiPositions: DeFiPosition[];
    portfolioValue: PortfolioValue;
    historicalData: any[];
    lastUpdated: Date | null;
    isAddWalletModalOpen: boolean;
    walletToEdit: Wallet | null;
    isShareModalOpen: boolean;
    shareContext: any;
    isUpgradeModalOpen: boolean;
    isLiveAssistantOpen: boolean;
    isAddWatchlistTokenModalOpen: boolean;
    isNotificationsOpen: boolean;
    isMobileMenuOpen: boolean;
    selectedWhale: WhaleWallet | null;
    user: User | null;
    impersonatedUser: User | null;
    displayedUser: User | null;
    session: Session | null;
    alerts: Alert[];
    alertSettings: any;
    insights: Insight[];
    healthScore: number | null;
    healthSummary: string | null;
    insightsLoading: boolean;
    lastAnalyzed: number | null;
    topics: CommunityTopic[];
    feedLoading: boolean;
    feedError: string | null;
    preferences: any;
    activeAnnouncement: any;
    shouldShowBrief: boolean;
    brief: any;
    isGeneratingBrief: boolean;
    intelligenceFeedItems: any[];
    firstLook: any;
    isGeneratingFirstLook: boolean;
    showFirstLook: boolean;
    smartMoneyWhales: WhaleWallet[];
    watchlist: WatchlistToken[];
    watchlistLoading: boolean;

    // Handlers
    setActiveView: (view: ActiveView) => void;
    refreshPortfolio: () => void;
    addWallet: (walletData: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => void;
    updateWallet: (walletId: string, updates: Partial<Pick<Wallet, 'nickname'>>) => void;
    removeWallet: (walletId: string) => void;
    handleShare: () => void;
    handleShareComparison: (whale: WhaleWallet, whaleTokens: Token[]) => void;
    setIsAddWalletModalOpen: (isOpen: boolean) => void;
    setWalletToEdit: (wallet: Wallet | null) => void;
    setIsShareModalOpen: (isOpen: boolean) => void;
    setIsUpgradeModalOpen: (isOpen: boolean) => void;
    setIsLiveAssistantOpen: (isOpen: boolean) => void;
    setIsAddWatchlistTokenModalOpen: (isOpen: boolean) => void;
    setIsNotificationsOpen: (isOpen: boolean) => void;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    setSelectedWhale: (whale: WhaleWallet | null) => void;
    handleViewWhale: (whale: WhaleWallet) => void;
    setUser: (user: User | null) => void;
    setImpersonatedUser: (user: User | null) => void;
    handleStopImpersonating: () => void;
    setSession: (session: Session | null) => void;
    markAsRead: (alertId: string) => void;
    markAllAsRead: () => void;
    updateAlertSettings: (settings: any) => void;
    handleGenerateInsights: (force?: boolean) => void;
    generateFeed: () => void;
    setDashboardLayout: (layout: any) => void;
    loadUserPreferences: (user: User) => void;
    dismissAnnouncement: (id: string) => void;
    markBriefAsShown: () => void;
    dismissFirstLook: () => void;
    addToWatchlist: (token: { id: string; symbol: string; }) => Promise<void>;
    removeFromWatchlist: (id: string) => Promise<void>;
    handleUpdateUser: (updates: Partial<User>) => Promise<void>;
    handleUpgradeUserPlan: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeView, setActiveView] = useState<ActiveView>('dashboard');
    const [user, setUser] = useState<User | null>(null);
    const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const displayedUser = impersonatedUser || user;
    const userId = displayedUser?.id;

    const { preferences, setDashboardLayout, loadUserPreferences } = useUserPreferences();

    const { 
        wallets, tokens, nfts, transactions, defiPositions, historicalData, portfolioValue, 
        loading, error, lastUpdated, addWallet, updateWallet, removeWallet, refreshPortfolio 
    } = usePortfolio(!!session, impersonatedUser?.id);

    const isProUser = useMemo(() => displayedUser?.plan === 'Pro', [displayedUser]);
    const { alerts, markAsRead, markAllAsRead, alertSettings, updateAlertSettings } = useAlerts(isProUser, userId);
    const { insights, healthScore, healthSummary, loading: insightsLoading, error: insightsError, generateInsights, lastAnalyzed } = useAiInsights(isProUser, userId);
    const { topics, loading: feedLoading, error: feedError, generateFeed } = useCommunityFeed();
    const { activeAnnouncement, dismissAnnouncement } = useAnnouncements(displayedUser, userId);
    const { whales: smartMoneyWhales } = useSmartMoneyWatchlist();
    const { segments, addSegment } = useWhaleSegments(smartMoneyWhales, userId);
    const { shouldShowBrief, brief, isGeneratingBrief, markBriefAsShown } = useMorningBrief({
        user: displayedUser, portfolioValue, insights, alerts, topics,
        enabled: !!session && !loading && !impersonatedUser,
    });
    const intelligenceFeedItems = useIntelligenceFeed({ tokens, alerts, insights });
    const { firstLook, isGeneratingFirstLook, generateFirstLook, showFirstLook, dismissFirstLook } = useFirstLook(displayedUser, wallets, tokens, portfolioValue);
    const { watchlist, loading: watchlistLoading, addToWatchlist, removeFromWatchlist } = useTokenWatchlist(!!session, impersonatedUser?.id);
    const { briefing, isGenerating: isGeneratingBriefing, error: briefingError, generateBriefing } = useAiStrategyBriefing(userId);


    const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
    const [isAddWatchlistTokenModalOpen, setIsAddWatchlistTokenModalOpen] = useState(false);
    const [shareContext, setShareContext] = useState<any>({ mode: 'portfolio' });

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedWhale, setSelectedWhale] = useState<WhaleWallet | null>(null);

    const handleGenerateInsights = useCallback((force = false) => {
        if (tokens.length > 0 && isProUser) {
           generateInsights(tokens, portfolioValue, displayedUser, force);
       }
     }, [tokens, portfolioValue, displayedUser, isProUser, generateInsights]);

    const handleShare = useCallback(() => {
        setShareContext({ mode: 'portfolio' });
        setIsShareModalOpen(true);
    }, []);

    const handleShareComparison = useCallback((whale: WhaleWallet, whaleTokens: Token[]) => {
        setShareContext({ 
            mode: 'comparison', whale: whale,
            userPortfolio: { tokens, portfolioValue },
            whaleTokens: whaleTokens
        });
        setIsShareModalOpen(true);
    }, [tokens, portfolioValue]);
    
    const handleViewWhale = useCallback((whale: WhaleWallet) => {
        setSelectedWhale(whale);
        setActiveView('smart-money');
        setIsNotificationsOpen(false);
    }, []);

    const handleStopImpersonating = useCallback(() => {
        localStorage.removeItem('nexus-impersonated-user');
        setImpersonatedUser(null);
        window.location.reload();
    }, []);
    
    const handleUpdateUser = useCallback(async (updates: Partial<User>) => {
        if (!displayedUser) return;
        const { data, error } = await supabase.from('users').update(updates).eq('id', displayedUser.id).select().single();
        if (error) throw error;
        if (data) {
          if(impersonatedUser) setImpersonatedUser(data as User);
          else setUser(data as User);
        }
      }, [displayedUser, impersonatedUser]);
      
      const handleUpgradeUserPlan = useCallback(async () => {
          if(!displayedUser) return;
          const { error } = await supabase.rpc('upgrade_user_plan');
          if (error) console.error("Error upgrading plan via RPC:", error);
          else {
            const { data: updatedUser } = await supabase.from('users').select('*').eq('id', displayedUser.id).single();
            if (updatedUser) {
                if (impersonatedUser) setImpersonatedUser(updatedUser as User);
                else setUser(updatedUser as User);
            }
          }
          setIsUpgradeModalOpen(false);
      }, [displayedUser, impersonatedUser]);

    const handleLogout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('nexus-user-preferences');
        if (error) {
            console.error('Error signing out:', error);
        }
    }, []);

    const contextValue: AppContextType = {
        activeView, setActiveView,
        error, loading, wallets, tokens, nfts, transactions, defiPositions, portfolioValue, historicalData, lastUpdated,
        isAddWalletModalOpen, setIsAddWalletModalOpen,
        walletToEdit, setWalletToEdit,
        isShareModalOpen, setIsShareModalOpen,
        shareContext,
        isUpgradeModalOpen, setIsUpgradeModalOpen,
        isLiveAssistantOpen, setIsLiveAssistantOpen,
        isAddWatchlistTokenModalOpen, setIsAddWatchlistTokenModalOpen,
        isNotificationsOpen, setIsNotificationsOpen,
        isMobileMenuOpen, setIsMobileMenuOpen,
        selectedWhale, setSelectedWhale,
        user, setUser,
        impersonatedUser, setImpersonatedUser,
        displayedUser,
        session, setSession,
        alerts, alertSettings,
        insights, healthScore, healthSummary, insightsLoading, lastAnalyzed,
        topics, feedLoading, feedError,
        preferences, setDashboardLayout, loadUserPreferences,
        activeAnnouncement,
        shouldShowBrief, brief, isGeneratingBrief,
        intelligenceFeedItems,
        firstLook, isGeneratingFirstLook, showFirstLook,
        smartMoneyWhales,
        watchlist, watchlistLoading,
        
        refreshPortfolio, addWallet, updateWallet, removeWallet,
        handleShare, handleShareComparison,
        handleViewWhale,
        handleStopImpersonating,
        markAsRead, markAllAsRead, updateAlertSettings,
        handleGenerateInsights,
        generateFeed,
        dismissAnnouncement,
        markBriefAsShown,
        dismissFirstLook,
        addToWatchlist, removeFromWatchlist,
        handleUpdateUser,
        handleUpgradeUserPlan,
        handleLogout
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};