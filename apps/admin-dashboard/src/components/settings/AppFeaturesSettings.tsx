import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (e: boolean) => void; description?: string }> = ({ label, enabled, setEnabled, description }) => (
    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <div>
            <label className="font-medium text-neutral-800 dark:text-neutral-200">{label}</label>
            {description && <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
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


export const AppFeaturesSettings: React.FC = () => {
    const [features, setFeatures] = useState({
        dashboardCustomization: true,
        aiMorningBrief: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('settings').select('value').eq('id', 'appFeatures').single();
            if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
                setFeatures(prev => ({ ...prev, ...(data.value as object) }));
            }
            if (error && error.code !== 'PGRST116') console.error('Error fetching feature settings:', error);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);
    
    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        const { error } = await supabase.from('settings').upsert({ id: 'appFeatures', value: features });

        if (error) {
            console.error('Error saving feature settings:', error);
            alert('Failed to save settings.');
        } else {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
        setIsSaving(false);
    }
    
    if (isLoading) {
        return (
            <Card>
                <Card.Header>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </Card.Header>
                <Card.Content className="p-6 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </Card.Content>
            </Card>
        );
    }
    
    return (
        <Card>
            <Card.Header>
                <Card.Title>App Features</Card.Title>
                <Card.Description>Enable or disable specific features for different user tiers.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6 space-y-4">
                <ToggleSwitch 
                    label="Enable Dashboard Customization for Pro Users"
                    enabled={features.dashboardCustomization}
                    setEnabled={(val) => setFeatures(p => ({ ...p, dashboardCustomization: val }))}
                    description="Allows Pro users to re-order components on their main dashboard."
                />
                 <ToggleSwitch 
                    label="Enable AI Morning Brief for Pro Users"
                    enabled={features.aiMorningBrief}
                    setEnabled={(val) => setFeatures(p => ({ ...p, aiMorningBrief: val }))}
                    description="Shows a personalized AI summary to Pro users upon their first visit of the day."
                />
            </Card.Content>
             <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Settings saved!</p>}
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Feature Settings'}
                </Button>
            </div>
        </Card>
    );
};