


import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { ThemePreview } from '../ThemePreview';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; description: string; }> = ({ label, value, onChange, description }) => (
    <div>
        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{description}</p>
        <div className="mt-1 flex items-center space-x-3">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="p-1 h-10 w-10 block bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 cursor-pointer rounded-md"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-32 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
            />
        </div>
    </div>
);


export const ThemeEditorSettings: React.FC = () => {
    const [colors, setColors] = useState({
        'brand-blue': '#2563EB',
        'brand-purple': '#9333EA',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchTheme = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('settings').select('value').eq('id', 'themeColors').single();
            if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
                const dbColors = data.value as Record<string, unknown>;

                setColors(prev => {
                    const newColors = { ...prev };
                    if (typeof dbColors['brand-blue'] === 'string') {
                        newColors['brand-blue'] = dbColors['brand-blue'];
                    }
                    if (typeof dbColors['brand-purple'] === 'string') {
                        newColors['brand-purple'] = dbColors['brand-purple'];
                    }
                    return newColors;
                });
            }
            setIsLoading(false);
        };
        fetchTheme();
    }, []);

    useEffect(() => {
        // Live preview by updating CSS variables
        Object.entries(colors).forEach(([key, value]) => {
            // FIX: Added type guard to ensure value is a string before setting CSS property, resolving a type error.
            if (typeof value === 'string') {
                document.documentElement.style.setProperty(`--color-${key}`, value);
            }
        });
    }, [colors]);

    const handleColorChange = (key: keyof typeof colors, value: string) => {
        setColors(prev => ({...prev, [key]: value }));
    }

    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        
        const { error } = await supabase.from('settings').upsert({ id: 'themeColors', value: colors });

        if (error) {
            alert('Failed to save theme.');
        } else {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="h-64 lg:col-span-1" /><Skeleton className="h-96 lg:col-span-2" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <Card.Header>
                    <Card.Title>Theme Editor</Card.Title>
                    <Card.Description>Customize the primary colors of the application.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6 space-y-6">
                    <ColorInput label="Brand Blue" value={colors['brand-blue']} onChange={(v) => handleColorChange('brand-blue', v)} description="Used for primary buttons, links, and highlights." />
                    <ColorInput label="Brand Purple" value={colors['brand-purple']} onChange={(v) => handleColorChange('brand-purple', v)} description="Used in gradients and special highlights." />
                </Card.Content>
                 <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                    {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Theme saved!</p>}
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Theme'}
                    </Button>
                </div>
            </Card>
            <div className="lg:col-span-2">
                <ThemePreview />
            </div>
        </div>
    );
};