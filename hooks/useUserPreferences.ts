import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardComponentKey, User } from '../types';
import { supabase } from '../utils/supabase';

interface UserPreferences {
    dashboardLayout: DashboardComponentKey[];
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
    isPrivacyMode: boolean;
}

interface UserPreferencesContextType {
    preferences: UserPreferences;
    setDashboardLayout: (layout: DashboardComponentKey[]) => void;
    setCurrency: (currency: string) => void;
    setLanguage: (language: string) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    togglePrivacyMode: () => void;
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
    loadUserPreferences: (user: User) => void;
}

const defaultPreferences: UserPreferences = {
    dashboardLayout: ['tokens', 'wallets', 'ai_insights', 'nfts_overview', 'defi_summary'],
    currency: 'USD',
    language: 'en',
    theme: 'system',
    isPrivacyMode: false,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load from localStorage on initial mount (for logged-out state or before user data is fetched)
    useEffect(() => {
        const savedPrefs = localStorage.getItem('nexus-user-preferences');
        if (savedPrefs) {
            try {
                const parsedPrefs = JSON.parse(savedPrefs);
                // Ensure default values are present for any missing keys
                setPreferences(prev => ({ ...defaultPreferences, ...prev, ...parsedPrefs }));
            } catch (error) {
                console.error("Failed to parse user preferences:", error);
            }
        }
    }, []);
    
    // Function to load preferences from a user object (called on login)
    const loadUserPreferences = useCallback((user: User) => {
        setCurrentUser(user);
        const localPrefsString = localStorage.getItem('nexus-user-preferences');
        const localPrefs = localPrefsString ? JSON.parse(localPrefsString) : {};
        
        // DB preferences take precedence over local, but local takes precedence over default
        const mergedPrefs = { ...defaultPreferences, ...localPrefs, ...user.preferences };
        setPreferences(mergedPrefs);
        localStorage.setItem('nexus-user-preferences', JSON.stringify(mergedPrefs));
    }, []);

    const savePreferencesToBackend = useCallback(async (prefsToSave: UserPreferences) => {
        if (currentUser) {
            const { error } = await supabase
                .from('users')
                .update({ preferences: prefsToSave })
                .eq('id', currentUser.id);
            if (error) {
                console.error("Failed to save preferences to Supabase:", error);
            }
        }
    }, [currentUser]);

    const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
        setPreferences(prev => {
            const newPrefs = { ...prev, ...updates };
            // Persist to localStorage and backend
            localStorage.setItem('nexus-user-preferences', JSON.stringify(newPrefs));
            savePreferencesToBackend(newPrefs);
            return newPrefs;
        });
    }, [savePreferencesToBackend]);

    const setDashboardLayout = (layout: DashboardComponentKey[]) => updatePreferences({ dashboardLayout: layout });
    const setCurrency = (currency: string) => updatePreferences({ currency });
    const setLanguage = (language: string) => updatePreferences({ language });
    const setTheme = (theme: 'light' | 'dark' | 'system') => updatePreferences({ theme });
    const togglePrivacyMode = () => {
        setPreferences(prev => {
            const newPrefs = { ...prev, isPrivacyMode: !prev.isPrivacyMode };
            localStorage.setItem('nexus-user-preferences', JSON.stringify(newPrefs));
            savePreferencesToBackend(newPrefs);
            return newPrefs;
        });
    };

    const obfuscateValue = (value: number) => {
        const valueString = Math.floor(Math.abs(value)).toString();
        // Create a string of asterisks with commas
        const integerPart = '*'.repeat(valueString.length).replace(/\B(?=(\*{3})+(?!\*))/g, ',');
        return `${integerPart}.**`;
    };

    const formatCurrency = useCallback((value: number, options: Intl.NumberFormatOptions = {}) => {
        if (preferences.isPrivacyMode && options.style !== 'decimal') { // Allow non-currency formatting to pass through
            const prefix = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: preferences.currency,
                currencyDisplay: 'symbol'
            }).format(0).replace(/[0-9.,]/g, '').trim();

            const sign = value < 0 ? '-' : (options.signDisplay === 'always' ? '+' : '');
            
            return `${sign}${prefix}${obfuscateValue(value)}`;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: preferences.currency,
            ...options
        }).format(value);
    }, [preferences.currency, preferences.isPrivacyMode]);

    const value = { preferences, setDashboardLayout, setCurrency, setLanguage, setTheme, togglePrivacyMode, formatCurrency, loadUserPreferences };

    return React.createElement(UserPreferencesContext.Provider, { value }, children);
};

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
};