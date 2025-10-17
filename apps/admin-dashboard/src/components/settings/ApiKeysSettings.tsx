import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { CheckIcon } from '../../../../../components/icons/CheckIcon';
import { AlertTriangleIcon } from '../../../../../components/icons/AlertTriangleIcon';
import { RefreshCwIcon } from '../../../../../components/icons/RefreshCwIcon';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { logAdminAction } from '../../utils/adminLogger';

type ApiKeyStatus = 'valid' | 'invalid' | 'unchecked' | 'validating';

interface ApiKeyInputProps {
    name: string;
    initialValue: string;
    onSave: (name: string, value: string) => Promise<boolean>;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ name, initialValue, onSave }) => {
    const [value, setValue] = useState(initialValue);
    const [status, setStatus] = useState<ApiKeyStatus>('unchecked');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue])

    const handleValidate = async () => {
        setStatus('validating');
        try {
            const { data, error } = await supabase.functions.invoke('validate-api-key', {
                body: { serviceName: name, apiKey: value },
            });
            if (error) throw error;
            setStatus(data.isValid ? 'valid' : 'invalid');
        } catch (e) {
            console.error(`Validation failed for ${name}:`, e);
            setStatus('invalid');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        const success = await onSave(name, value);
        if (success) {
            setIsSaved(true);
            handleValidate();
            setTimeout(() => setIsSaved(false), 2000);
        }
        setIsSaving(false);
    }
    
    const statusIcon = {
        valid: <CheckIcon className="w-5 h-5 text-success" />,
        invalid: <AlertTriangleIcon className="w-5 h-5 text-error" />,
        validating: <RefreshCwIcon className="w-5 h-5 text-neutral-400 animate-spin" />,
        unchecked: null
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label htmlFor={name} className="font-medium text-neutral-800 dark:text-neutral-200">{name}</label>
            <div className="relative md:col-span-2">
                <input 
                    id={name}
                    type="password"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setStatus('unchecked');
                        setIsSaved(false);
                    }}
                    placeholder="Enter new API key..."
                    className="block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                    {statusIcon[status]}
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Button type="button" onClick={handleSave} className="w-full text-sm py-2" disabled={isSaving}>
                    {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleValidate} className="w-full text-sm py-2" disabled={status === 'validating'}>
                    Validate
                </Button>
            </div>
        </div>
    )
}

const API_KEYS = ['Gemini', 'Moralis', 'Helius', 'CoinGecko'];

export const ApiKeysSettings: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKeys = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('service_keys').select('*');
            if (data) {
                const keysMap = data.reduce((acc, curr) => ({...acc, [curr.id]: curr.key_value }), {});
                setApiKeys(keysMap);
            }
            if (error) console.error("Error fetching API keys:", error);
            setIsLoading(false);
        }
        fetchKeys();
    }, []);

    const handleSaveKey = async (name: string, value: string): Promise<boolean> => {
        const { error } = await supabase.from('service_keys').upsert({ id: name, key_value: value });
        if (error) {
            console.error(`Error saving ${name} key:`, error);
            alert(`Failed to save ${name} key.`);
            return false;
        }
        await logAdminAction('update_api_key', null, { service: name });
        return true;
    }

    if (isLoading) {
        return (
             <Card>
                <Card.Header>
                    <Card.Title>API Keys</Card.Title>
                    <Card.Description>Manage third-party API keys. Changes may take a few minutes to apply.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6 space-y-6">
                    {API_KEYS.map(key => <Skeleton key={key} className="h-10 w-full" />)}
                </Card.Content>
            </Card>
        )
    }

    return (
        <Card>
            <Card.Header>
                <Card.Title>API Keys</Card.Title>
                <Card.Description>Manage third-party API keys. Changes may take a few minutes to apply.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                 <form onSubmit={e => e.preventDefault()} className="space-y-6">
                    {API_KEYS.map(keyName => (
                        <ApiKeyInput 
                            key={keyName}
                            name={keyName} 
                            initialValue={apiKeys[keyName] || ''}
                            onSave={handleSaveKey}
                        />
                    ))}
                </form>
            </Card.Content>
        </Card>
    );
};