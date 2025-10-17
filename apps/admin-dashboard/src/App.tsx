
import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { DashboardView } from './views/DashboardView';
import { UserManagementView } from './views/UserManagementView';
import { WhaleManagementView } from './views/WhaleManagementView';
import { AnalyticsView } from './views/AnalyticsView';
import { SystemHealthView } from './views/SystemHealthView';
import { SettingsView } from './views/SettingsView';
import { ContentManagementView } from './views/ContentManagementView';
import { ReportsView } from './views/ReportsView';
import { AutomationsView } from './views/AutomationsView';
import { ExperimentsView } from './views/ExperimentsView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { TransactionsView } from './views/TransactionsView';
import { SupportView } from './views/SupportView';
import { AdminLoginView } from './views/AdminLoginView';
import { CommandPalette } from '../../../components/CommandPalette';
import { CommandPaletteProvider, useCommandPalette } from '../../../hooks/useCommandPalette';
import { Skeleton } from '../../../components/shared/Skeleton';
import { supabase } from '../../../utils/supabase';
import { User } from '../../../types';
import { ShieldOffIcon } from './components/icons/ShieldOffIcon';

export type AdminView = 'dashboard' | 'users' | 'whales' | 'analytics' | 'system-health' | 'settings' | 'content' | 'reports' | 'automations' | 'experiments' | 'announcements' | 'transactions' | 'support';

type AuthState = 'initializing' | 'login' | 'authenticated' | 'unauthorized';

const ADMIN_ROLES: (User['role'])[] = ['Administrator', 'Content Editor', 'Support Agent'];

// --- AUTH CONTEXT ---
interface AuthContextType {
    authState: AuthState;
    userProfile: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>('initializing');
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
        setAuthState('login');
    };

    const updateUserProfile = (updates: Partial<User>) => {
        setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    };
    
    const checkSession = useCallback(async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            if (session) {
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileError && profileError.code !== 'PGRST116') throw profileError;

                if (profile && ADMIN_ROLES.includes(profile.role) && profile.status !== 'Suspended') {
                    setUserProfile(profile as User);
                    setAuthState('authenticated');
                } else {
                    if (profile?.status === 'Suspended') {
                        console.warn(`Suspended admin user (${session.user.email}) session detected. Signing out.`);
                    }
                    await supabase.auth.signOut();
                    setAuthState('unauthorized');
                    setUserProfile(null);
                }
            } else {
                setAuthState('login');
                setUserProfile(null);
            }
        } catch (e) {
            console.error("Error checking session:", e);
            setAuthState('login');
            setUserProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             checkSession();
        });
        return () => subscription.unsubscribe();
    }, [checkSession]);

    const value = { authState, userProfile, isLoading, logout, updateUserProfile };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// --- PERMISSIONS CONTEXT ---
interface PermissionsContextType {
    permissions: Record<string, string[]>;
    hasPermission: (category: string, action: string) => boolean;
    isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, isLoading: authLoading } = useAuth();
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (authLoading) {
                setIsLoading(true);
                return;
            }
            if (!userProfile) {
                setPermissions({});
                setIsLoading(false);
                return;
            }
            
            try {
                if (userProfile.role === 'Administrator') {
                    setPermissions({ "all": ["all"] });
                } else {
                    const { data: roleData } = await supabase
                        .from('roles')
                        .select('permissions')
                        .eq('name', userProfile.role)
                        .single();
                    if (roleData) {
                        setPermissions(roleData.permissions || {});
                    }
                }
            } catch (error) {
                 console.error("Error fetching permissions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPermissions();
    }, [userProfile, authLoading]);

    const hasPermission = (category: string, action: string) => {
        if (isLoading) return false;
        if (permissions.all?.includes('all')) return true;
        const categoryPermissions = permissions[category];
        return categoryPermissions ? categoryPermissions.includes(action) : false;
    };

    const value = { permissions, hasPermission, isLoading };

    return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

// --- ACCESS DENIED COMPONENT ---
const AccessDenied: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ShieldOffIcon className="w-16 h-16 text-error mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">You do not have permission to view this page.</p>
    </div>
);


const AdminAppContent: React.FC = () => {
  const { authState, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [appName, setAppName] = useState('Nexus');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { registerActions } = useCommandPalette();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  const handleSetActiveView = (view: AdminView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const applyAppSettings = async () => {
      const { data, error } = await supabase.from('settings').select('id, value');
      if (error) {
        console.error("Error fetching app settings:", error);
        return;
      }
      if (data) {
        const settingsMap = new Map(data.map(i => [i.id, i.value]));
        const savedAppName = settingsMap.get('appName');
        if (typeof savedAppName === 'string' && savedAppName) {
          setAppName(savedAppName);
          document.title = `${savedAppName} Admin`;
        }
        const themeColors = settingsMap.get('themeColors');
        if (typeof themeColors === 'object' && themeColors && !Array.isArray(themeColors)) {
          Object.entries(themeColors).forEach(([key, value]) => {
            // FIX: Added type guard to ensure value is a string before setting CSS property.
            if (typeof value === 'string') {
              document.documentElement.style.setProperty(`--color-${key}`, value);
            }
          });
        }
      }
    };
    applyAppSettings();
  }, []);

  useEffect(() => {
    if (authState !== 'authenticated') return;
    const actions = [
      { id: 'admin-nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', onSelect: () => handleSetActiveView('dashboard'), keywords: 'home main' },
      { id: 'admin-nav-users', label: 'Go to User Management', group: 'Navigation', onSelect: () => handleSetActiveView('users') },
      { id: 'admin-nav-whales', label: 'Go to Whale Management', group: 'Navigation', onSelect: () => handleSetActiveView('whales') },
      { id: 'admin-nav-transactions', label: 'Go to Transactions', group: 'Navigation', onSelect: () => handleSetActiveView('transactions') },
      { id: 'admin-nav-content', label: 'Go to Content', group: 'Navigation', onSelect: () => handleSetActiveView('content'), keywords: 'articles' },
      { id: 'admin-nav-announcements', label: 'Go to Announcements', group: 'Navigation', onSelect: () => handleSetActiveView('announcements') },
      { id: 'admin-nav-support', label: 'Go to Support Tickets', group: 'Navigation', onSelect: () => handleSetActiveView('support') },
      { id: 'admin-nav-analytics', label: 'Go to Analytics', group: 'Navigation', onSelect: () => handleSetActiveView('analytics') },
      { id: 'admin-nav-system-health', label: 'Go to System Health', group: 'Navigation', onSelect: () => handleSetActiveView('system-health') },
      { id: 'admin-nav-settings', label: 'Go to Settings', group: 'Navigation', onSelect: () => handleSetActiveView('settings') },
      { id: 'admin-create-user', label: 'New User', group: 'Create', onSelect: () => handleSetActiveView('users'), keywords: 'add create user' },
      { id: 'admin-create-whale', label: 'New Whale', group: 'Create', onSelect: () => handleSetActiveView('whales'), keywords: 'add create whale' },
      { id: 'admin-create-article', label: 'New Article', group: 'Create', onSelect: () => handleSetActiveView('content'), keywords: 'add create content article' },
      { id: 'admin-create-announcement', label: 'New Announcement', group: 'Create', onSelect: () => handleSetActiveView('announcements'), keywords: 'add create announcement' },
    ];
    registerActions(actions);
  }, [registerActions, authState]);
  
  const renderActiveView = () => {
    const requiredPermissions: Partial<Record<AdminView, { category: string, action: string }>> = {
      'users': { category: 'User Management', action: 'view' },
      'whales': { category: 'Whale Management', action: 'view' },
      'transactions': { category: 'Transactions', action: 'view' },
      'content': { category: 'Content', action: 'view' },
      'announcements': { category: 'Announcements', action: 'view' },
      'support': { category: 'Support', action: 'view' },
      'automations': { category: 'Automations', action: 'view' },
      'experiments': { category: 'Experiments', action: 'view' },
      'analytics': { category: 'Analytics', action: 'view' },
      'reports': { category: 'Reports', action: 'view' },
      'system-health': { category: 'System Health', action: 'view' },
      'settings': { category: 'Settings', action: 'view' },
    };

    if (permissionsLoading) {
      return <div className="p-6"><Skeleton className="w-full h-96" /></div>;
    }

    const permission = requiredPermissions[activeView];
    if (permission && !hasPermission(permission.category, permission.action)) {
        return <AccessDenied />;
    }

    switch (activeView) {
      case 'dashboard': return <DashboardView setActiveView={handleSetActiveView} />;
      case 'users': return <UserManagementView />;
      case 'whales': return <WhaleManagementView />;
      case 'transactions': return <TransactionsView />;
      case 'analytics': return <AnalyticsView />;
      case 'system-health': return <SystemHealthView />;
      case 'settings': return <SettingsView />;
      case 'content': return <ContentManagementView />;
      case 'reports': return <ReportsView />;
      case 'automations': return <AutomationsView />;
      case 'experiments': return <ExperimentsView />;
      case 'announcements': return <AnnouncementsView />;
      case 'support': return <SupportView />;
      default: return <DashboardView setActiveView={handleSetActiveView} />;
    }
  };
  
  if (isLoading) {
     return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
            <div className="w-64 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
  }
  
  if (authState === 'login' || authState === 'unauthorized') {
    return <AdminLoginView unauthorized={authState === 'unauthorized'} />;
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
        <div className="flex">
          <AdminSidebar appName={appName} activeView={activeView} setActiveView={handleSetActiveView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <main className="flex-grow p-6 overflow-auto">
              {renderActiveView()}
            </main>
          </div>
        </div>
      </div>
      <CommandPalette />
    </>
  );
}

function AdminApp() {
  return (
    <CommandPaletteProvider>
      <AuthProvider>
        <PermissionsProvider>
          <AdminAppContent />
        </PermissionsProvider>
      </AuthProvider>
    </CommandPaletteProvider>
  )
}

export default AdminApp;