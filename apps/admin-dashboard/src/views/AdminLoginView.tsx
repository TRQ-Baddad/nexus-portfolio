import React, { useState, FormEvent } from 'react';
import { LogoIcon } from '../../../../components/icons/LogoIcon';
import { Button } from '../../../../components/shared/Button';
import { MailIcon } from '../../../../components/icons/MailIcon';
import { LockIcon } from '../../../../components/icons/LockIcon';
import { EyeIcon } from '../../../../components/icons/EyeIcon';
import { EyeOffIcon } from '../../../../components/icons/EyeOffIcon';
import { supabase } from '../../../../utils/supabase';

interface AdminLoginViewProps {
  unauthorized?: boolean;
}

const InputField: React.FC<{
    id: string;
    type: string;
    placeholder: string;
    icon: React.FC<any>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isPassword?: boolean;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}> = ({ id, type, placeholder, icon: Icon, value, onChange, isPassword, isVisible, onToggleVisibility }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-neutral-400" />
        </div>
        <input
            type={isPassword ? (isVisible ? 'text' : 'password') : type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            autoComplete={isPassword ? "current-password" : "email"}
            className="w-full bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus:border-brand-blue rounded-md py-3 pl-10 pr-10 text-neutral-900 dark:text-white focus:outline-none focus:ring-0 sm:text-sm transition-colors"
        />
        {isPassword && onToggleVisibility && (
            <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                onClick={onToggleVisibility}
                aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
                {isVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
        )}
    </div>
);

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ unauthorized = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const genericError = "Invalid credentials or unauthorized access.";
        
        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                // For a direct sign-in error, we can be slightly more specific but still safe.
                throw new Error("Invalid login credentials.");
            }
            
            if (authData.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('users')
                    .select('role, status')
                    .eq('id', authData.user.id)
                    .single();

                // If there's any issue fetching the profile, immediately sign out and throw the generic error.
                if (profileError && profileError.code !== 'PGRST116') {
                    await supabase.auth.signOut();
                    throw new Error(genericError);
                }
                
                const ADMIN_ROLES = ['Administrator', 'Content Editor', 'Support Agent'];
                if (!profileData || !ADMIN_ROLES.includes(profileData.role as any) || profileData.status === 'Suspended') {
                    await supabase.auth.signOut();
                    throw new Error(genericError);
                }
            }
            // On success, the onAuthStateChange listener in AdminApp.tsx will handle the redirect.
        } catch (err: any) {
            // All errors, whether from sign-in or post-sign-in checks, are caught here.
            setError(err.message || genericError);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans animate-fade-in">
            <div className="w-full max-w-sm space-y-8">
                 <div className="text-center">
                    <LogoIcon className="w-12 h-12 mx-auto" />
                    <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
                        Admin Dashboard
                    </h2>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        Please sign in to continue.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <InputField id="email" type="email" placeholder="Email address" icon={MailIcon} value={email} onChange={e => setEmail(e.target.value)} />
                    <InputField 
                        id="password" 
                        type="password" 
                        placeholder="Password" 
                        icon={LockIcon} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        isPassword
                        isVisible={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                    />

                    {(error || unauthorized) && (
                      <p className="text-sm text-error text-center animate-fade-in">
                        {error || 'Access denied. Administrator privileges required.'}
                      </p>
                    )}
                    
                    <div className="pt-2">
                        <Button type="submit" className="w-full py-3" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
