import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { supabase } from '../utils/supabase';

interface ProfileSettingsProps {
    user: User;
    onUpdateUser: (updates: Partial<User>) => Promise<void>;
}

const InputField: React.FC<{ label: string; id: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; }> = ({ label, id, type = 'text', value, onChange, disabled = false }) => (
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
            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
        />
    </div>
);

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user.name);
        setBio(user.bio || '');
    }, [user]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setIsSaved(false);
        setSaveError(null);
        try {
            await onUpdateUser({ name, bio });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2500);
        } catch (error: any) {
            setSaveError(error.message || 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) {
            return;
        }
        setIsUploading(true);
        setUploadError(null);

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            if (!data.publicUrl) {
                throw new Error('Could not get public URL for avatar.');
            }

            await onUpdateUser({ avatar_url: data.publicUrl });
        } catch (error: any) {
             const message = error.message || 'Failed to upload avatar. Please try again.';
            setUploadError(message);
            console.error('Error uploading avatar:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const isChanged = name !== user.name || bio !== (user.bio || '');

    return (
        <Card>
            <Card.Header>
                <Card.Title>General</Card.Title>
                <Card.Description>Update your public profile information.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <img src={user.avatar_url} alt="User Avatar" className="w-16 h-16 rounded-full object-cover" />
                        <div className="flex flex-col">
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                            <Button variant="secondary" onClick={handleAvatarClick} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : 'Change Avatar'}
                            </Button>
                            {uploadError && <p className="text-xs text-error mt-2">{uploadError}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Full Name" id="full-name" value={name} onChange={(e) => setName(e.target.value)} />
                        <InputField label="Email Address" id="email" type="email" value={user.email} onChange={() => {}} disabled />
                    </div>
                     <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a little about yourself"
                            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </div>
            </Card.Content>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 flex justify-end items-center">
                {saveError && <p className="text-sm text-error mr-4 animate-fade-in">{saveError}</p>}
                {isSaved && !saveError && <p className="text-sm text-success mr-4 animate-fade-in">Changes saved!</p>}
                <Button onClick={handleSaveChanges} disabled={!isChanged || isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </Card>
    );
};