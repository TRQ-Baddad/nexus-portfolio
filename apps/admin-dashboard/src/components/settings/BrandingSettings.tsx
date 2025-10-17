import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';

export const BrandingSettings: React.FC = () => {
    const [appName, setAppName] = useState('Nexus');
    const [logo, setLogo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('settings').select('id, value').in('id', ['appName', 'logoUrl']);
            if (data) {
                const settingsMap = new Map(data.map(i => [i.id, i.value]));
                const savedAppName = settingsMap.get('appName');
                const savedLogoUrl = settingsMap.get('logoUrl');
                if (typeof savedAppName === 'string') setAppName(savedAppName);
                if (typeof savedLogoUrl === 'string') setLogo(savedLogoUrl);
            }
            setIsLoading(false);
        };
        fetchBranding();
    }, []);


    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileName = `public/logo-${Date.now()}`;
        const { data, error } = await supabase.storage.from('branding').upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });

        if (error) {
            alert('Error uploading logo: ' + error.message);
            setIsUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(data.path);
        setLogo(publicUrl);
        setIsUploading(false);
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        
        const { error } = await supabase.from('settings').upsert([
            { id: 'appName', value: appName },
            { id: 'logoUrl', value: logo }
        ]);

        if (error) {
            alert('Failed to save branding settings.');
        } else {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
            // Force a reload to see changes applied everywhere
            window.location.reload();
        }
        setIsSaving(false);
    }

    if (isLoading) {
        return <Card><Card.Content className="p-6"><Skeleton className="h-48 w-full" /></Card.Content></Card>;
    }

    return (
        <Card>
            <Card.Header>
                <Card.Title>Branding & Customization</Card.Title>
                <Card.Description>Customize the public appearance of the application.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6 space-y-6">
                <div>
                    <label htmlFor="app-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">App Name</label>
                    <input
                        type="text"
                        id="app-name"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className="mt-1 block w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>
                
                <div className="flex items-center space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">App Logo</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-md flex items-center justify-center">
                                {logo ? <img src={logo} alt="App Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-neutral-400">Preview</span>}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/svg+xml, image/jpeg" onChange={handleLogoUpload} disabled={isUploading} />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card.Content>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Branding saved! Reloading...</p>}
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Branding'}
                </Button>
            </div>
        </Card>
    );
};