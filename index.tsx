import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from './hooks/useTheme';
import { TranslationProvider } from './utils/formatters';
import { UserPreferencesProvider } from './hooks/useUserPreferences';

// Lazy load apps for code splitting and better performance
const PortfolioApp = lazy(() => import('./apps/nexus-portfolio/src/App'));
const AdminApp = lazy(() => import('./apps/admin-dashboard/src/App'));

// Loading fallback component
const LoadingFallback = () => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        fontSize: '18px'
    }}>
        <div>Loading...</div>
    </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const path = window.location.pathname;

let AppToRender;

if (path.startsWith('/admin')) {
    // Admin App with lazy loading and suspense
    AppToRender = (
        <Suspense fallback={<LoadingFallback />}>
            <UserPreferencesProvider>
                <ThemeProvider>
                    <AdminApp />
                </ThemeProvider>
            </UserPreferencesProvider>
        </Suspense>
    );
} else {
    // Portfolio App with lazy loading and suspense
    AppToRender = (
        <Suspense fallback={<LoadingFallback />}>
            <UserPreferencesProvider>
                <ThemeProvider>
                    <TranslationProvider>
                        <PortfolioApp />
                    </TranslationProvider>
                </ThemeProvider>
            </UserPreferencesProvider>
        </Suspense>
    );
}

root.render(
  <React.StrictMode>
    {AppToRender}
    <SpeedInsights />
  </React.StrictMode>
);