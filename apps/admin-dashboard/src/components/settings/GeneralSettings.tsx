
import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { supabase } from '../../../../../utils/supabase';
import { logAdminAction } from '../../utils/adminLogger';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (e: boolean) => void; description?: string }> = ({ label, enabled, setEnabled, description }) => (
    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <div>
            <label className="font-medium text-neutral-800 dark:text-neutral-200">{label}</label>
            {description && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>}
        </div>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-blue' : 'bg-neutral-300 dark:bg-neutral-600'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


export const GeneralSettings: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [featureFlags, setFeatureFlags] = useState({
        aiInsights: true,
        communityFeed: true,
        liveChat: false,
        dashboardCustomization: true,
        aiMorningBrief: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('settings').select('*');
            if (data) {
                const settingsMap = new Map(data.map(i => [i.id, i.value]));
                
                const maintenanceModeValue = settingsMap.get('maintenanceMode');
                setMaintenanceMode(typeof maintenanceModeValue === 'boolean' ? maintenanceModeValue : false);
                
                const featureFlagsValue = settingsMap.get('featureFlags');
                const defaultFlags = {
                    aiInsights: true,
                    communityFeed: true,
                    liveChat: false,
                    dashboardCustomization: true,
                    aiMorningBrief: true,
                };
                
                if (typeof featureFlagsValue === 'object' && featureFlagsValue && !Array.isArray(featureFlagsValue)) {
                    setFeatureFlags({ ...defaultFlags, ...(featureFlagsValue as object) });
                } else {
                    setFeatureFlags(defaultFlags);
                }
            }
            if (error) console.error('Error fetching settings:', error);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleFlagChange = (flag: keyof typeof featureFlags) => {
        setFeatureFlags(prev => ({...prev, [flag]: !prev[flag]}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        
        const { error } = await supabase.from('settings').upsert([
            { id: 'maintenanceMode', value: maintenanceMode },
            { id: 'featureFlags', value: featureFlags }
        ]);

        if (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings.');
        } else {
            await logAdminAction('update_general_settings', null, { maintenanceMode, featureFlags });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
        setIsSaving(false);
    }

    if (isLoading) {
        return <Card><Card.Content className="p-6"><p>Loading settings...</p></Card.Content></Card>
    }

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <Card.Title>Maintenance Mode</Card.Title>
                    <Card.Description>Temporarily disable access to the main application for users.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6">
                    <ToggleSwitch 
                        label="Enable Maintenance Mode" 
                        enabled={maintenanceMode}
                        setEnabled={setMaintenanceMode}
                        description="All users will see a maintenance page instead of the app."
                    />
                </Card.Content>
            </Card>

            <Card>
                <Card.Header>
                    <Card.Title>Feature Flags</Card.Title>
                    <Card.Description>Enable or disable specific features globally.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6 space-y-4">
                    <ToggleSwitch 
                        label="AI Insights" 
                        enabled={featureFlags.aiInsights} 
                        setEnabled={() => handleFlagChange('aiInsights')}
                        description="Enables the AI-powered portfolio analysis tab."
                    />
                    <ToggleSwitch 
                        label="Community Feed" 
                        enabled={featureFlags.communityFeed} 
                        setEnabled={() => handleFlagChange('communityFeed')}
                        description="Enables the social media trend analysis tab."
                     />
                    <ToggleSwitch 
                        label="Live AI Chat" 
                        enabled={featureFlags.liveChat} 
                        setEnabled={() => handleFlagChange('liveChat')}
                        description="Enables the real-time voice assistant for Pro users."
                    />
                     <ToggleSwitch 
                        label="Dashboard Customization (Pro)"
                        enabled={featureFlags.dashboardCustomization}
                        setEnabled={() => handleFlagChange('dashboardCustomization')}
                        description="Allows Pro users to re-order components on their main dashboard."
                    />
                    <ToggleSwitch 
                        label="AI Morning Brief (Pro)"
                        enabled={featureFlags.aiMorningBrief}
                        setEnabled={() => handleFlagChange('aiMorningBrief')}
                        description="Shows a personalized AI summary to Pro users upon their first visit of the day."
                    />
                </Card.Content>
                 <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                    {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Settings saved!</p>}
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save General Settings'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
