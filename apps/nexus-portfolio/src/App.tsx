import React, { useState, useEffect } from 'react';
import { AuthSession as Session } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { Header } from '../../../components/Header';
import { Dashboard } from './components/Dashboard';
import { NftGallery } from '../../../components/NftGallery';
import { TransactionHistory } from '../../../components/TransactionHistory';
import { SmartMoney } from '../../../components/SmartMoney';
import { PortfolioAnalytics } from '../../../components/PortfolioAnalytics';
import { Profile } from '../../../components/Profile';
import { IntelligenceView } from '../../../components/IntelligenceView';
import { AlertsView } from '../../../components/AlertsView';
import { CommunityView } from '../../../components/CommunityView';
import { DeFiPositions } from '../../../components/DeFiPositions';
import { SupportView } from './components/SupportView';
import { AddWalletModal } from '../../../components/AddWalletModal';
import { EditWalletModal } from '../../../components/EditWalletModal';
import { ShareModal } from '../../../components/ShareModal';
import { UpgradeModal } from '../../../components/UpgradeModal';
import { NotificationsPanel } from '../../../components/NotificationsPanel';
import { ErrorDisplay } from '../../../components/ErrorDisplay';
import { PublicSnapshotView } from '../../../components/PublicSnapshotView';
import { CommandPalette } from '../../../components/CommandPalette';
import { CommandPaletteProvider } from '../../../hooks/useCommandPalette';
import { MobileMenu } from '../../../components/MobileMenu';
import { AnnouncementBanner } from '../../../components/AnnouncementBanner';
import { LandingPage } from '../../../components/LandingPage';
import { AuthView } from '../../../components/AuthView';
import { MorningBriefModal } from '../../../components/MorningBriefModal';
import { LiveAssistantModal } from '../../../components/LiveAssistantModal';
import { LiveAssistantFAB } from '../../../components/LiveAssistantFAB';
import { Skeleton } from '../../../components/shared/Skeleton';
import { ImpersonationBanner } from '../../../components/ImpersonationBanner';
import { AddWatchlistTokenModal } from '../../../components/AddWatchlistTokenModal';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { User } from '../../../types';

type AuthState = 'initializing' | 'landing' | 'auth' | 'authenticated';

function AppContent() {
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [session, setSession] = useState<Session | null>(null);
  const [authViewMode, setAuthViewMode] = useState<'signup' | 'login'>('signup');
  
  const {
      // State
      activeView,
      error,
      loading,
      tokens,
      portfolioValue,
      historicalData,
      nfts,
      transactions,
      defiPositions,
      isAddWalletModalOpen,
      walletToEdit,
      isShareModalOpen,
      isUpgradeModalOpen,
      isLiveAssistantOpen,
      isAddWatchlistTokenModalOpen,
      isNotificationsOpen,
      isMobileMenuOpen,
      selectedWhale,
      // Handlers
      setActiveView,
      refreshPortfolio,
      setIsAddWalletModalOpen,
      setWalletToEdit,
      setIsShareModalOpen,
      setIsUpgradeModalOpen,
      setIsLiveAssistantOpen,
      setIsAddWatchlistTokenModalOpen,
      setIsNotificationsOpen,
      setIsMobileMenuOpen,
      setSelectedWhale,
      handleShareComparison,
      handleViewWhale,
      // User specific
      impersonatedUser,
      handleStopImpersonating,
      handleUpdateUser,
      // Announcements and Briefings
      activeAnnouncement,
      dismissAnnouncement,
      shouldShowBrief,
      isGeneratingBrief,
      brief,
      markBriefAsShown,
      // Live State from Context
      setSession: setSessionInContext,
      setUser,
      setImpersonatedUser,
      loadUserPreferences,
      displayedUser,
      // AI Insights
      insights,
      healthScore,
      healthSummary,
      insightsLoading,
      handleGenerateInsights,
      // Community
      topics,
      feedLoading,
      feedError,
      generateFeed,
      // Intelligence
      intelligenceFeedItems,
      // Smart Money / Watchlist
      smartMoneyWhales,
      alerts,
      markAsRead,
      alertSettings,
      updateAlertSettings,
      watchlist,
      addToWatchlist,
  } = useAppContext();
  
  const isShareView = new URLSearchParams(window.location.search).get('view') === 'share';

  // Impersonation Handling
  useEffect(() => {
    try {
        const impersonationData = localStorage.getItem('nexus-impersonated-user');
        if (impersonationData) {
            setImpersonatedUser(JSON.parse(impersonationData));
        }
    } catch (e) {
        console.error("Failed to parse impersonation data", e);
        localStorage.removeItem('nexus-impersonated-user');
    }
  }, [setImpersonatedUser]);

  // Main session and auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionInContext(session);
      if (session) {
        setAuthState('authenticated');
      } else {
        if (impersonatedUser) {
            handleStopImpersonating();
        }
        setAuthState('landing');
      }
    });

    const checkInitialSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            setSession(data.session);
            setSessionInContext(data.session);
            if (data.session) {
                setAuthState('authenticated');
            } else {
                setAuthState('landing');
            }
        } catch (e) {
            console.error("Error checking initial session:", e);
            setAuthState('landing');
        }
    };
    checkInitialSession();

    return () => subscription.unsubscribe();
  }, [impersonatedUser, setSessionInContext, handleStopImpersonating]);

  // Fetch or self-heal user profile from public.users table
  useEffect(() => {
    if ((session?.user || impersonatedUser) && !impersonatedUser) {
        const fetchAndHealProfile = async (sessionUser: any) => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .single();
                
                if (data) {
                    if (data.status === 'Suspended') {
                        console.warn('Suspended user session detected. Signing out.');
                        await supabase.auth.signOut();
                        alert('Your account has been suspended. Please contact support.');
                        return;
                    }
                    const userProfile = data as User;
                    setUser(userProfile);
                    loadUserPreferences(userProfile); // Load preferences from DB
                } else if (error && error.code === 'PGRST116') { // "No rows found"
                    console.warn("No user profile found. Self-healing: creating new profile.");
                    const { data: newUser, error: insertError } = await supabase
                        .from('users')
                        .insert({
                            id: sessionUser.id,
                            email: sessionUser.email!,
                            name: sessionUser.user_metadata.name || sessionUser.email?.split('@')[0] || 'New User',
                            avatar_url: sessionUser.user_metadata.avatar_url || `https://i.pravatar.cc/150?u=${sessionUser.id}`
                        })
                        .select()
                        .single();
                    
                    if (insertError) {
                        console.error("Error self-healing and creating profile:", insertError.message);
                    } else if (newUser) {
                        const userProfile = newUser as User;
                        setUser(userProfile);
                        loadUserPreferences(userProfile);
                    }
                } else if (error) {
                    console.error("Error fetching user profile:", error.message);
                }
            } catch (e) {
                console.error("Critical error in fetchAndHealProfile:", e);
            }
        };
        fetchAndHealProfile(session!.user);
    } else if (impersonatedUser) {
        loadUserPreferences(impersonatedUser);
    } else {
        setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, impersonatedUser, setUser, loadUserPreferences]);
  

  if (isShareView) {
    return <PublicSnapshotView />;
  }
  
  if (authState === 'initializing') {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
            <div className="w-64 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
  }
  
  if (authState === 'landing') {
    return <LandingPage 
              onGetStarted={() => { setAuthViewMode('signup'); setAuthState('auth'); }} 
              onLogin={() => { setAuthViewMode('login'); setAuthState('auth'); }}
            />;
  }

  if (authState === 'auth') {
    return <AuthView initialMode={authViewMode} />;
  }

  const renderActiveView = () => {
    if (error) {
      return <ErrorDisplay message={error} onRetry={refreshPortfolio} />;
    }
    
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'nfts': return <NftGallery nfts={nfts} loading={loading} />;
      case 'defi': return <DeFiPositions positions={defiPositions} loading={loading} />;
      case 'transactions': return <TransactionHistory transactions={transactions} loading={loading} />;
      case 'analytics': return <PortfolioAnalytics portfolioValue={portfolioValue} historicalData={historicalData} tokens={tokens} insights={insights} healthScore={healthScore} healthSummary={healthSummary} loading={loading} insightsLoading={insightsLoading} user={displayedUser} onUpgrade={() => setIsUpgradeModalOpen(true)} onGenerateInsights={handleGenerateInsights} />;
      case 'smart-money': return <SmartMoney loading={loading} selectedWhale={selectedWhale} setSelectedWhale={setSelectedWhale} user={displayedUser} userPortfolio={{ tokens, portfolioValue }} onShareComparison={handleShareComparison} onUpgrade={() => setIsUpgradeModalOpen(true)} />;
      case 'community': return <CommunityView topics={topics} loading={feedLoading} error={feedError} onRefresh={generateFeed} />;
      case 'intelligence': return <IntelligenceView user={displayedUser} feedItems={intelligenceFeedItems} onViewWhale={handleViewWhale} loading={loading} onUpgrade={() => setIsUpgradeModalOpen(true)} whales={smartMoneyWhales} setActiveView={setActiveView} onOpenAddWatchlistTokenModal={() => setIsAddWatchlistTokenModalOpen(true)} />;
      case 'alerts': return <AlertsView user={displayedUser} alerts={alerts} onViewWhale={handleViewWhale} onMarkAsRead={markAsRead} onUpgrade={() => setIsUpgradeModalOpen(true)} whales={smartMoneyWhales} />;
      case 'profile': return <Profile user={displayedUser!} onUpdateUser={handleUpdateUser} alertSettings={alertSettings} onUpdateAlertSettings={updateAlertSettings} onUpgrade={() => setIsUpgradeModalOpen(true)} />;
      case 'support': return <SupportView />;
      default: return <Dashboard />;
    }
  };
  
  return (
    <>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
        {impersonatedUser && <ImpersonationBanner userName={impersonatedUser.name} onStop={handleStopImpersonating} />}
        <Header />
        {activeAnnouncement && <AnnouncementBanner announcement={activeAnnouncement} onDismiss={dismissAnnouncement} />}

        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {renderActiveView()}
        </main>

        <AddWalletModal />
        <EditWalletModal />
        <ShareModal />
        <UpgradeModal />
        <NotificationsPanel />
        <AddWatchlistTokenModal 
            isOpen={isAddWatchlistTokenModalOpen}
            onClose={() => setIsAddWatchlistTokenModalOpen(false)}
            onAdd={addToWatchlist}
            existingWatchlist={watchlist}
            userTokens={tokens}
        />

        <MorningBriefModal
            isOpen={shouldShowBrief}
            onClose={markBriefAsShown}
            brief={brief}
            isLoading={isGeneratingBrief}
            user={displayedUser}
        />
      </div>

      <LiveAssistantModal
        isOpen={isLiveAssistantOpen}
        onClose={() => setIsLiveAssistantOpen(false)}
      />
      
      {displayedUser?.plan === 'Pro' && !isLiveAssistantOpen && (
        <LiveAssistantFAB onClick={() => setIsLiveAssistantOpen(true)} />
      )}

      <CommandPalette />
    </>
  );
}

function App() {
    return (
      <CommandPaletteProvider>
        <AppContent />
      </CommandPaletteProvider>
    )
}

export default App;
