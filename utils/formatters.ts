import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { TRANSLATIONS } from '../constants';

export function formatRelativeTime(date: Date | null): string {
    if (!date) return '';
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Recently';
    const seconds = Math.round((now.getTime() - dateObj.getTime()) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.round(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- START: i18n Implementation ---

const rtlLanguages = ['ar'];

interface TranslationContextType {
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    const { preferences, setLanguage } = useUserPreferences();

    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    
    return {
        language: preferences.language,
        setLanguage,
        t: context.t,
    };
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { preferences } = useUserPreferences();
    const language = preferences.language;
    
    useEffect(() => {
        const htmlEl = document.documentElement;
        htmlEl.lang = language;
        htmlEl.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    }, [language]);

    const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
        const translations = (TRANSLATIONS as Record<string, Record<string, string>>)[language] || TRANSLATIONS.en;
        let translation = translations[key] || key;
        
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                translation = translation.replace(`{${placeholder}}`, String(value));
            });
        }
        return translation;
    }, [language]);

    const value = { t };

    return React.createElement(TranslationContext.Provider, { value: value }, children);
};
// --- END: i18n Implementation ---
