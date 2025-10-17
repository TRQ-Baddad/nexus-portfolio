import React, { useState } from 'react';
import { User } from '../types';
import { ProfileSettings } from './ProfileSettings';
import { SubscriptionPlan } from './SubscriptionPlan';
import { AlertSettings, AlertSettingsData } from './AlertSettings';
import { SecuritySettings } from './SecuritySettings';
import { AppearanceSettings } from './AppearanceSettings';
import { useTranslation } from '../utils/formatters';

interface ProfileProps {
    user: User;
    onUpdateUser: (updates: Partial<User>) => Promise<void>;
    alertSettings: AlertSettingsData;
    onUpdateAlertSettings: (settings: AlertSettingsData) => void;
    onUpgrade: () => void;
}

type ProfileTab = 'General' | 'Security' | 'Appearance' | 'Notifications';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors rounded-md ${
            isActive ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
    >
        {label}
    </button>
);


export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, alertSettings, onUpdateAlertSettings, onUpgrade }) => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('General');
    const { t } = useTranslation();
    
    const renderActiveTab = () => {
        switch(activeTab) {
            case 'General':
                return <ProfileSettings user={user} onUpdateUser={onUpdateUser} />;
            case 'Security':
                return <SecuritySettings />;
            case 'Appearance':
                return <AppearanceSettings user={user} onUpgrade={onUpgrade} />;
            case 'Notifications':
                return <AlertSettings settings={alertSettings} onUpdateSettings={onUpdateAlertSettings} user={user} onUpgrade={onUpgrade} />;
            default:
                 return <ProfileSettings user={user} onUpdateUser={onUpdateUser} />;
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('accountSettings')}</h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('accountSettingsDescription')}</p>
            </div>

            <div className="flex space-x-2 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto pb-px">
                <TabButton label={t('general')} isActive={activeTab === 'General'} onClick={() => setActiveTab('General')} />
                <TabButton label={t('security')} isActive={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />
                <TabButton label={t('appearance')} isActive={activeTab === 'Appearance'} onClick={() => setActiveTab('Appearance')} />
                <TabButton label={t('notifications')} isActive={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {renderActiveTab()}
                </div>
                <div>
                    <SubscriptionPlan user={user} onUpgrade={onUpgrade} />
                </div>
            </div>
        </div>
    );
};