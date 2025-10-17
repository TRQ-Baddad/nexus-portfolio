import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeToggle } from '../../../../components/ThemeToggle';
import { LogOutIcon } from '../../../../components/icons/LogOutIcon';
import { CommandIcon } from '../../../../components/icons/CommandIcon';
import { useCommandPalette } from '../../../../hooks/useCommandPalette';
import { EyeIcon } from './icons/EyeIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { User } from '../../../../types';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { useAuth } from '../App';
import { MenuIcon } from '../../../../components/icons/MenuIcon';

interface AdminHeaderProps {
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const RoleImpersonationMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    // Debounced search effect
    useEffect(() => {
        if (!isOpen) return;

        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsLoading(false);
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
            return;
        }

        setIsLoading(true);
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = window.setTimeout(async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .eq('role', 'Customer') // Only allow impersonating customer roles
                .limit(5);

            if (error) {
                console.error("Error searching for users:", error);
                setSearchResults([]);
            } else {
                setSearchResults(data as User[]);
            }
            setIsLoading(false);
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchQuery, isOpen]);


    const handleImpersonate = useCallback((user: User | null) => {
        if (!user) return;
        localStorage.setItem('nexus-impersonated-user', JSON.stringify(user));
        window.open('/', '_blank');
        setIsOpen(false);
        setSearchQuery('');
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-700/50 px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
                title="View app as a specific role"
            >
                <EyeIcon className="w-4 h-4" />
                <span className="hidden sm:block">View As</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-fade-in" style={{ animationDuration: '100ms' }}>
                    <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search user by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ul className="p-2 max-h-60 overflow-y-auto">
                        {isLoading ? (
                            <li><p className="px-3 py-2 text-sm text-center text-neutral-500">Searching...</p></li>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(user => (
                                <li key={user.id}>
                                    <button
                                        onClick={() => handleImpersonate(user)}
                                        className="w-full text-left px-3 py-2 text-sm rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full" />
                                            <div>
                                                <p className="font-medium truncate">{user.name}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li>
                                <p className="px-3 py-2 text-sm text-center text-neutral-500 dark:text-neutral-400">
                                    {searchQuery ? 'No users found.' : 'Start typing to find a user.'}
                                </p>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}


export const AdminHeader: React.FC<AdminHeaderProps> = ({ setIsMobileMenuOpen }) => {
  const { setIsOpen } = useCommandPalette();
  const { userProfile, isLoading, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-neutral-800 h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
      <div className="md:hidden">
        <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
            aria-label="Open sidebar"
        >
            <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-grow md:hidden" />

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Open command palette"
        >
          <CommandIcon className="w-5 h-5" />
        </button>
        <ThemeToggle />
        <RoleImpersonationMenu />
        
        {isLoading ? (
          <div className="flex items-center space-x-2 animate-pulse">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
          </div>
        ) : userProfile ? (
          <div className="flex items-center space-x-2">
            <img src={userProfile.avatar_url} alt="Admin" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium hidden sm:block">{userProfile.name}</span>
          </div>
        ) : null}

        <button onClick={logout} className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            <LogOutIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};