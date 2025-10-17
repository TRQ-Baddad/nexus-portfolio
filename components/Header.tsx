import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActiveView, User, Wallet, Alert, PortfolioValue as PortfolioValueType } from '../types';
import { Button } from './shared/Button';
import { LogoIcon } from './icons/LogoIcon';
import { ThemeToggle } from './ThemeToggle';
import { LogOutIcon } from './icons/LogOutIcon';
import { HelpCircleIcon } from './icons/HelpCircleIcon';
import { ZapIcon } from './icons/ZapIcon';
import { MenuIcon } from './icons/MenuIcon';
import { BellIcon } from './icons/BellIcon';
import { useTranslation } from '../utils/formatters';
import { CommandIcon } from './icons/CommandIcon';
import { useCommandPalette } from '../hooks/useCommandPalette';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UserIcon } from './icons/UserIcon';
import { Skeleton } from './shared/Skeleton';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

const NavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ label, isActive, onClick, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive 
                    ? 'text-neutral-900 dark:text-white bg-white dark:bg-neutral-700/50 shadow-sm' 
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    );
};

const DropdownNavItem: React.FC<{
    label: string;
    onClick: () => void;
}> = ({ label, onClick }) => (
    <li>
        <button
            onClick={onClick}
            className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
        >
            {label}
        </button>
    </li>
);

const MenuItem: React.FC<{
    icon: React.FC<any>;
    label: string;
    onClick: () => void;
    shortcut?: string;
    isDestructive?: boolean;
    disabled?: boolean;
}> = ({ icon: Icon, label, onClick, shortcut, isDestructive, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md transition-colors ${
            isDestructive
                ? 'text-error hover:bg-error/10'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
        <div className="flex items-center">
            <Icon className="w-4 h-4 mr-3" />
            <span>{label}</span>
        </div>
        {shortcut && <span className="text-xs text-neutral-400 dark:text-neutral-500">{shortcut}</span>}
    </button>
);


const ProfileMenu: React.FC<{ 
    isImpersonating?: boolean;
}> = ({ isImpersonating }) => {
    const { 
        displayedUser: user, 
        handleLogout, 
        setActiveView, 
        setIsUpgradeModalOpen, 
        portfolioValue, 
        loading 
    } = useAppContext();

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { setIsOpen: setCommandPaletteOpen } = useCommandPalette();
    const { formatCurrency } = useUserPreferences();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleSettingsClick = useCallback(() => {
      setActiveView('profile');
      setIsOpen(false);
    }, [setActiveView]);

    const handleSupportClick = useCallback(() => {
      setActiveView('support');
      setIsOpen(false);
    }, [setActiveView]);
    
    const handleUpgradeClick = useCallback(() => {
      setIsUpgradeModalOpen(true);
      setIsOpen(false);
    }, [setIsUpgradeModalOpen]);

    const handleCommandPaletteClick = useCallback(() => {
        setCommandPaletteOpen(true);
        setIsOpen(false);
    }, [setCommandPaletteOpen]);


    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900"
            >
                <img src={user.avatar_url} alt="User" className="rounded-full" />
            </button>
            
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 origin-top-right transition-all duration-200 ease-out z-50 animate-fade-in"
                    style={{ animationDuration: '100ms'}}
                >
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>

                     <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Portfolio Value</p>
                        {loading ? (
                            <Skeleton className="h-6 w-3/4" />
                        ) : (
                            <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(portfolioValue.total)}</p>
                        )}
                    </div>

                    <div className="p-2">
                        <MenuItem icon={UserIcon} label="Profile & Settings" onClick={handleSettingsClick} />
                        <MenuItem icon={HelpCircleIcon} label="Support" onClick={handleSupportClick} />
                        <MenuItem icon={CommandIcon} label="Command Palette" shortcut="⌘K" onClick={handleCommandPaletteClick} />
                    </div>

                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                         <div className="p-2 mb-1 rounded-md bg-neutral-100 dark:bg-neutral-900/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{user.plan} Plan</span>
                                {user.plan === 'Free' && (
                                    <button onClick={handleUpgradeClick} className="flex items-center text-xs font-bold text-brand-blue hover:opacity-80">
                                        <ZapIcon className="w-3 h-3 mr-1" />
                                        Upgrade
                                    </button>
                                )}
                            </div>
                        </div>
                        <MenuItem
                            icon={LogOutIcon}
                            label="Sign Out"
                            onClick={handleLogout}
                            disabled={isImpersonating}
                            isDestructive
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const NotificationsBell: React.FC = () => {
  const { alerts, isNotificationsOpen, setIsNotificationsOpen } = useAppContext();
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        aria-label="Toggle notifications"
        className={`p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${
          isNotificationsOpen ? 'bg-neutral-200 dark:bg-neutral-800' : ''
        }`}
      >
        <BellIcon className="w-5 h-5" />
      </button>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-brand-blue ring-2 ring-white dark:ring-neutral-900" />
      )}
    </div>
  );
};


export const Header: React.FC = () => {
  const {
      activeView, setActiveView, setIsAddWalletModalOpen, displayedUser, wallets,
      setIsMobileMenuOpen, setIsUpgradeModalOpen, impersonatedUser
  } = useAppContext();
    
  const freeTierLimit = 3;
  const isAddWalletDisabled = displayedUser?.plan === 'Free' && wallets.length >= freeTierLimit;
  const { t } = useTranslation();
  const { setIsOpen } = useCommandPalette();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { preferences, togglePrivacyMode } = useUserPreferences();


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
            setIsMoreMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMoreNavClick = (view: ActiveView) => {
    setActiveView(view);
    setIsMoreMenuOpen(false);
  }

  const secondaryNavItems: ActiveView[] = ['analytics', 'defi', 'transactions', 'community'];
  const isMoreMenuActive = secondaryNavItems.includes(activeView);

  return (
    <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <LogoIcon className="h-8 w-8" />
              <span className="text-xl font-bold text-neutral-900 dark:text-white">Nexus</span>
            </div>
            <nav className="hidden md:flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-lg">
                <NavItem label={t('dashboard')} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                <NavItem label={t('nfts')} isActive={activeView === 'nfts'} onClick={() => setActiveView('nfts')} />
                <NavItem label={t('smartMoney')} isActive={activeView === 'smart-money'} onClick={() => setActiveView('smart-money')} />
                <NavItem label={t('intelligence')} isActive={activeView === 'intelligence'} onClick={() => setActiveView('intelligence')} />
                
                {/* "More" Dropdown */}
                <div className="relative" ref={moreMenuRef}>
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            isMoreMenuActive 
                                ? 'text-neutral-900 dark:text-white bg-white dark:bg-neutral-700/50 shadow-sm' 
                                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <span>{t('more')}</span>
                        <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMoreMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 p-2 z-50 animate-fade-in" style={{ animationDuration: '100ms' }}>
                            <ul>
                                <DropdownNavItem label={t('analytics')} onClick={() => handleMoreNavClick('analytics')} />
                                <DropdownNavItem label={t('defi')} onClick={() => handleMoreNavClick('defi')} />
                                <DropdownNavItem label={t('transactions')} onClick={() => handleMoreNavClick('transactions')} />
                                <DropdownNavItem label={t('community')} onClick={() => handleMoreNavClick('community')} />
                            </ul>
                        </div>
                    )}
                </div>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors hidden md:block"
              aria-label="Open command palette"
            >
              <CommandIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={togglePrivacyMode}
              className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle privacy mode"
              title="Toggle Privacy Mode"
            >
              {preferences.isPrivacyMode ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>

            <ThemeToggle />
            
            <NotificationsBell />
            <div className="relative group hidden sm:block">
              <Button onClick={() => setIsAddWalletModalOpen(true)} disabled={isAddWalletDisabled}>
                Add Wallet
              </Button>
               {isAddWalletDisabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-neutral-800 dark:bg-neutral-900 text-white text-xs font-bold py-1.5 px-3 rounded-md z-10 text-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Free plan is limited to {freeTierLimit} wallets.
                    <br />
                    Upgrade to Pro for unlimited wallets.
                </div>
            )}
            </div>
            
            <ProfileMenu isImpersonating={!!impersonatedUser} />
              
            <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};