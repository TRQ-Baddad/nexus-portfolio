import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { UpgradeNotice } from './shared/UpgradeNotice';

export interface AlertSettingsData {
    minValue: number;
}

interface AlertSettingsProps {
    settings: AlertSettingsData;
    onUpdateSettings: (settings: AlertSettingsData) => void;
    user: User | null;
    onUpgrade: () => void;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({ settings, onUpdateSettings, user, onUpgrade }) => {
    const [minValue, setMinValue] = useState(settings.minValue);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setMinValue(settings.minValue);
    }, [settings]);

    const handleSaveChanges = () => {
        onUpdateSettings({ minValue });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    
    if (user?.plan === 'Free') {
        return (
            <UpgradeNotice
                onUpgrade={onUpgrade}
                title="Unlock Custom Alerts"
                description="Upgrade to Pro to get real-time whale alerts and customize your notification preferences."
                features={['Real-time whale alerts', 'Customizable thresholds', 'Push notifications (coming soon)', 'Priority support']}
            />
        );
    }

    return (
        <Card>
            <Card.Header>
                <Card.Title>Notification Preferences</Card.Title>
                <Card.Description>Customize the alerts you receive for whale activity.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="min-value" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            Minimum Transaction Value
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                            Only receive alerts for transactions greater than this value.
                        </p>
                        <div className="flex items-center space-x-4">
                             <input
                                id="min-value"
                                type="range"
                                min="0"
                                max="1000000"
                                step="10000"
                                value={minValue}
                                onChange={(e) => setMinValue(Number(e.target.value))}
                                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                            />
                            <span className="font-semibold text-neutral-900 dark:text-white w-28 text-center bg-neutral-100 dark:bg-neutral-900 py-1.5 rounded-md text-sm">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(minValue)}
                            </span>
                        </div>
                    </div>
                </div>
            </Card.Content>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Settings saved!</p>}
                <Button onClick={handleSaveChanges} disabled={minValue === settings.minValue}>
                    Save Changes
                </Button>
            </div>
        </Card>
    );
};
