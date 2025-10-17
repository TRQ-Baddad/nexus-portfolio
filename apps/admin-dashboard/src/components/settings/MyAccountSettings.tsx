import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { EyeIcon } from '../../../../../components/icons/EyeIcon';
import { EyeOffIcon } from '../../../../../components/icons/EyeOffIcon';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { useAuth } from '../../App';

const InputField: React.FC<{ label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }> = ({ label, id, type = 'text', value, onChange, disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {label}
        </label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-neutral-100 dark:disabled:bg-neutral-800"
        />
    </div>
);

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
                    autoComplete="new-password"
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

export const MyAccountSettings: React.FC = () => {
    const { userProfile, isLoading: authLoading, updateUserProfile } = useAuth();
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isProfileSaved, setIsProfileSaved] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isPasswordSaved, setIsPasswordSaved] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name);
        }
    }, [userProfile]);

    const handleSaveProfile = async () => {
        if (!userProfile) return;
        setIsSavingProfile(true);
        setIsProfileSaved(false);
        
        const { error } = await supabase.from('users').update({ name }).eq('id', userProfile.id);
        
        if (error) {
            alert('Failed to save profile: ' + error.message);
        } else {
            updateUserProfile({ name }); // Update context state
            setIsProfileSaved(true);
            setTimeout(() => setIsProfileSaved(false), 2000);
        }
        setIsSavingProfile(false);
    };
    
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters long.");
            return;
        }
        
        setPasswordError('');
        setIsPasswordSaved(false);
        setIsSavingPassword(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        setIsSavingPassword(false);
        if (error) {
            setPasswordError(error.message);
        } else {
            setNewPassword('');
            setConfirmPassword('');
            setIsPasswordSaved(true);
            setTimeout(() => setIsPasswordSaved(false), 3000);
        }
    };

    const canUpdatePassword = newPassword && newPassword === confirmPassword && !isSavingPassword;
    const isProfileChanged = userProfile ? name !== userProfile.name : false;

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <Card.Title>Profile</Card.Title>
                    <Card.Description>Update your personal information.</Card.Description>
                </Card.Header>
                <Card.Content className="p-6">
                    {authLoading ? (
                         <div className="space-y-6 max-w-md">
                             <Skeleton className="h-14 w-full" />
                             <Skeleton className="h-14 w-full" />
                         </div>
                    ) : (
                        <div className="space-y-6 max-w-md">
                            <InputField label="Full Name" id="full-name" value={name} onChange={(e) => setName(e.target.value)} />
                            <InputField label="Email Address" id="email" type="email" value={userProfile?.email || ''} onChange={() => {}} disabled />
                        </div>
                    )}
                </Card.Content>
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                    {isProfileSaved && <p className="text-sm text-success mr-4 animate-fade-in">Profile saved!</p>}
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile || authLoading || !isProfileChanged}>
                        {isSavingProfile ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            </Card>

            <Card>
                <Card.Header>
                    <Card.Title>Change Password</Card.Title>
                    <Card.Description>Update the password for your admin account.</Card.Description>
                </Card.Header>
                <form onSubmit={handleUpdatePassword}>
                    <Card.Content className="p-6">
                        <div className="space-y-6 max-w-md">
                            <PasswordInputField label="New Password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <PasswordInputField label="Confirm New Password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {passwordError && <p className="text-sm text-error">{passwordError}</p>}
                        </div>
                    </Card.Content>
                    <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                        {isPasswordSaved && <p className="text-sm text-success mr-4 animate-fade-in">Password updated!</p>}
                        <Button type="submit" disabled={!canUpdatePassword}>
                            {isSavingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};