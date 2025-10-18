import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import PortfolioApp from './apps/nexus-portfolio/src/App';
import AdminApp from './apps/admin-dashboard/src/App';
import { ThemeProvider } from './hooks/useTheme';
import { TranslationProvider } from './utils/formatters';
import { UserPreferencesProvider } from './hooks/useUserPreferences';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const path = window.location.pathname;

let AppToRender;

if (path.startsWith('/admin')) {
    // Admin App with its specific theme provider
    AppToRender = (
        // FIX: Added UserPreferencesProvider to provide theme context to the AdminApp and its components.
        <UserPreferencesProvider>
            {/* FIX: Removed invalid 'storageKey' prop. Theme persistence is handled by UserPreferencesProvider. */}
            <ThemeProvider>
                <AdminApp />
            </ThemeProvider>
        </UserPreferencesProvider>
    );
} else {
    // Portfolio App with preferences as the top-level provider
    AppToRender = (
        <UserPreferencesProvider>
            <ThemeProvider>
                <TranslationProvider>
                    <PortfolioApp />
                </TranslationProvider>
            </ThemeProvider>
        </UserPreferencesProvider>
    );
}

root.render(
  <React.StrictMode>
    {AppToRender}
    <SpeedInsights />
  </React.StrictMode>
);