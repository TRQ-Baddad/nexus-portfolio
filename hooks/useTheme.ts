import React, { createContext, useContext, useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';

type Theme = 'dark' | 'light' | 'system';

// The context now only needs to provide the theme string, as the setter is in UserPreferences
type ThemeProviderState = {
  theme: Theme;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const theme = preferences.theme;

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      root.classList.remove('light', 'dark');

      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      root.classList.add(effectiveTheme);
    };

    applyTheme();

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const value = { theme };

  return React.createElement(ThemeProviderContext.Provider, { value }, children);
}

export const useTheme = () => {
  // We now pull the setter function directly from useUserPreferences
  const { preferences, setTheme } = useUserPreferences();
  
  return {
    theme: preferences.theme,
    setTheme,
  };
};