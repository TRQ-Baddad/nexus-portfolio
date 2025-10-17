import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from './shared/Card';
import { useTheme } from '../hooks/useTheme';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerIcon } from './icons/ComputerIcon';
import { useTranslation } from '../utils/formatters';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { CheckCircleFillIcon } from './icons/CheckCircleFillIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DashboardComponentKey, User } from '../types';
import { MoveIcon } from './icons/MoveIcon';
import { UpgradeNotice } from './shared/UpgradeNotice';


const SUPPORTED_CURRENCIES = { USD: 'United States Dollar', EUR: 'Euro', JPY: 'Japanese Yen', GBP: 'British Pound', BTC: 'Bitcoin' };
const SUPPORTED_LANGUAGES: Record<string, string> = {
    'en': 'English',
    'es': 'Español (Spanish)',
    'ar': 'العربية (Arabic)',
};

type Theme = 'light' | 'dark' | 'system';

const ThemeCard: React.FC<{
    label: string; 
    Icon: React.FC<any>; 
    isSelected: boolean; 
    onClick: () => void;
    onMouseEnter: () => void;
}> = ({ label, Icon, isSelected, onClick, onMouseEnter }) => (
    <button 
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`relative p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200 transform hover:scale-105 ${isSelected ? 'border-brand-blue' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'}`}
    >
        {isSelected && (
            <CheckCircleFillIcon className="w-6 h-6 text-brand-blue absolute top-2 right-2" />
        )}
        <Icon className="w-8 h-8" />
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const SettingSelect: React.FC<{
    label: string;
    description: string;
    icon: React.FC<any>;
    options: Record<string, string>;
    currentValue: string;
    onChange: (value: string) => void;
}> = ({ label, description, icon: Icon, options, currentValue, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        onChange(value);
        setIsOpen(false);
    };

    return (
         <div ref={wrapperRef}>
            <label className="block text-base font-semibold text-neutral-800 dark:text-neutral-200">
                {label}
            </label>
             <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                {description}
            </p>
            <div className="relative w-full max-w-xs">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                >
                    <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3 text-neutral-400"/>
                        <span>{options[currentValue]}</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-60 overflow-y-auto">
                        <ul className="p-1">
                            {Object.entries(options).map(([code, name]) => (
                                <li key={code}>
                                    <button
                                        onClick={() => handleSelect(code)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${currentValue === code ? 'bg-brand-blue/10 text-brand-blue dark:text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                                    >
                                        {name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

const componentInfo: Record<DashboardComponentKey, { name: string; description: string }> = {
    tokens: { name: 'Token Holdings', description: 'Your fungible tokens across all wallets.' },
    wallets: { name: 'Wallets', description: 'A list of your connected wallets.' },
    ai_insights: { name: 'AI Insights', description: 'AI-powered analysis of your portfolio health.' },
    nfts_overview: { name: 'NFTs Overview', description: 'A gallery preview of your collectibles.' },
    defi_summary: { name: 'DeFi Summary', description: 'A summary of your DeFi positions.' },
};

interface AppearanceSettingsProps {
    user: User;
    onUpgrade: () => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ user, onUpgrade }) => {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useTranslation();
    const { preferences, setCurrency, setDashboardLayout } = useUserPreferences();
    
    const [showConfirmation, setShowConfirmation] = useState(false);
    const confirmationTimeoutRef = useRef<number | null>(null);

    const isProUser = user.plan === 'Pro';
    const draggableComponents = preferences.dashboardLayout.filter(key => key !== 'tokens');
    const [layoutItems, setLayoutItems] = useState(draggableComponents);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setLayoutItems(preferences.dashboardLayout.filter(key => key !== 'tokens'));
    }, [preferences.dashboardLayout]);

    const applyThemePreview = useCallback((previewTheme: Theme | null) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        const themeToApply = previewTheme || theme;
        
        let effectiveTheme = themeToApply;
        if (themeToApply === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        root.classList.add(effectiveTheme);
    }, [theme]);

    const handleSettingChange = (setter: (value: any) => void, value: any) => {
        setter(value);
        setShowConfirmation(true);
        if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
        }
        confirmationTimeoutRef.current = window.setTimeout(() => {
            setShowConfirmation(false);
        }, 2500);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        const newLayout = [...layoutItems];
        const draggedItemContent = newLayout.splice(dragItem.current!, 1)[0];
        newLayout.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setLayoutItems(newLayout);
    };
    
    const handleDragEnd = () => {
        setDashboardLayout(['tokens', ...layoutItems]);
        handleSettingChange(() => {}, null); // Trigger confirmation message
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="space-y-8">
            <Card>
                <Card.Header>
                    <Card.Title>Appearance</Card.Title>
                    <Card.Description>Customize the look and feel of the application.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6 space-y-8">
                    <div>
                        <h4 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Theme</h4>
                        <div className="grid grid-cols-3 gap-4" onMouseLeave={() => applyThemePreview(null)}>
                            <ThemeCard label="Light" Icon={SunIcon} isSelected={theme === 'light'} onClick={() => handleSettingChange(setTheme, 'light')} onMouseEnter={() => applyThemePreview('light')} />
                            <ThemeCard label="Dark" Icon={MoonIcon} isSelected={theme === 'dark'} onClick={() => handleSettingChange(setTheme, 'dark')} onMouseEnter={() => applyThemePreview('dark')} />
                            <ThemeCard label="System" Icon={ComputerIcon} isSelected={theme === 'system'} onClick={() => handleSettingChange(setTheme, 'system')} onMouseEnter={() => applyThemePreview('system')} />
                        </div>
                    </div>
                    
                    <SettingSelect
                        label="Primary Currency"
                        description="Select the currency to display your portfolio value in."
                        icon={DollarSignIcon}
                        options={SUPPORTED_CURRENCIES}
                        currentValue={preferences.currency}
                        onChange={(value) => handleSettingChange(setCurrency, value)}
                    />
                
                    <SettingSelect
                        label="Language"
                        description="Choose the display language for the application."
                        icon={GlobeIcon}
                        options={SUPPORTED_LANGUAGES}
                        currentValue={language}
                        onChange={(value) => handleSettingChange(setLanguage, value)}
                    />
                </Card.Content>
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center h-[68px]">
                    {showConfirmation && (
                        <p className="text-sm text-success mr-4 animate-fade-in">
                            Appearance settings updated!
                        </p>
                    )}
                </div>
            </Card>

            <Card>
                 <Card.Header>
                    <Card.Title>Dashboard Layout</Card.Title>
                    <Card.Description>Arrange the components on your dashboard. Changes are saved automatically.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6">
                    {isProUser ? (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">Right Column Components</p>
                            {layoutItems.map((key, index) => (
                                <div 
                                    key={key} 
                                    className="flex items-center space-x-3 p-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <MoveIcon className="w-5 h-5 text-neutral-400" />
                                    <div>
                                        <p className="font-semibold">{componentInfo[key].name}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{componentInfo[key].description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <UpgradeNotice 
                            onUpgrade={onUpgrade}
                            title="Unlock Dashboard Customization"
                            description="Upgrade to Pro to re-order components on your dashboard for a personalized view."
                            features={['Customizable dashboard layout', 'Unlimited wallets', 'Real-time data refresh', 'AI-powered insights']}
                        />
                    )}
                </Card.Content>
            </Card>
        </div>
    );
};