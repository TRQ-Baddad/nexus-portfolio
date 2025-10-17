

import React, { useState, useEffect } from 'react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { supabase } from '../utils/supabase';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

const PasswordInputField: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, id, value, onChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {label}
            </label>
            <div className="relative mt-1">
                <input
                    type={isVisible ? 'text' : 'password'}
                    id={id}
                    value={value}
                    onChange={onChange}
                    autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
                    className="block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 pr-10 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    onClick={() => setIsVisible(!isVisible)}
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                >
                    {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export const SecuritySettings: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { displayedUser: userProfile } = useAppContext();


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        
        setError('');
        setIsSaved(false);
        setIsLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        setIsLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setIsSaved(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setIsSaved(false), 3000);
        }
    };

    const canSave = newPassword && newPassword === confirmPassword && !isLoading;

    return (
         <Card>
            <Card.Header>
                <Card.Title>Password</Card.Title>
                <Card.Description>Change your password. Make sure it's a strong one.</Card.Description>
            </Card.Header>
            <form onSubmit={handleSave}>
                <Card.Content className="p-6">
                    <div className="space-y-6 max-w-md">
                        <input
                            type="email"
                            name="email"
                            autoComplete="username"
                            value={userProfile?.email || ''}
                            readOnly
                            style={{ display: 'none' }}
                        />
                        <PasswordInputField label="New Password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <PasswordInputField label="Confirm New Password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        {error && <p className="text-sm text-error animate-fade-in">{error}</p>}
                    </div>
                </Card.Content>
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                    {isSaved && <p className="text-sm text-success mr-4 animate-fade-in">Password updated successfully!</p>}
                    <Button type="submit" disabled={!canSave}>
                        {isLoading ? 'Updating...' : 'Change Password'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
