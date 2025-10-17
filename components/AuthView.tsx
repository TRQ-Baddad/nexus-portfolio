import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { LogoIcon } from './icons/LogoIcon';
import { Button } from './shared/Button';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';

interface AuthViewProps {
  initialMode: 'login' | 'signup';
}

const InputField: React.FC<{
    id: string;
    type: string;
    placeholder: string;
    icon: React.FC<any>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string;
    isPassword?: boolean;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}> = ({ id, type, placeholder, icon: Icon, value, onChange, autoComplete, isPassword, isVisible, onToggleVisibility }) => (
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
            autoComplete={autoComplete}
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


export const AuthView: React.FC<AuthViewProps> = ({ initialMode }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'resetPassword'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        setError('');
        setSignupSuccess(false);
        setResetSuccess(false);
        setPassword('');
        setConfirmPassword('');
    }, [mode]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        const credentials = { email, password };

        try {
            if (mode === 'login') {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword(credentials);
                if (authError) throw authError;

                // After successful login, immediately check profile status
                if (authData.user) {
                    const { data: profileData } = await supabase
                        .from('users')
                        .select('status')
                        .eq('id', authData.user.id)
                        .single();

                    if (profileData?.status === 'Suspended') {
                        await supabase.auth.signOut(); // Log them out immediately
                        throw new Error('Your account has been suspended. Please contact support.');
                    }
                }
            } else { // Signup
                const { data, error: authError } = await supabase.auth.signUp({
                    ...credentials,
                    options: {
                        data: {
                            name: email.split('@')[0], // Use part of email as name for profile
                            avatar_url: `https://i.pravatar.cc/150?u=${email}`
                        }
                    }
                });
                
                if (authError) throw authError;
                
                if (data.user) {
                    setSignupSuccess(true);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (resetError) throw resetError;
            setResetSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    const isLogin = mode === 'login';
    
    if (signupSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans animate-fade-in">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="flex justify-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                            <MailIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
                        Confirm your email
                    </h2>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox (and spam folder) to complete your registration.
                    </p>
                    <div className="pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => { setMode('login'); setSignupSuccess(false); }}
                            className="w-full py-3"
                        >
                            Back to Log In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (resetSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans animate-fade-in">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="flex justify-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                            <MailIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
                        Check your email
                    </h2>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        We've sent a password reset link to <strong>{email}</strong>. Please check your inbox to proceed.
                    </p>
                    <div className="pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => { setMode('login'); setResetSuccess(false); }}
                            className="w-full py-3"
                        >
                            Back to Log In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'resetPassword') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans animate-fade-in">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <LogoIcon className="w-12 h-12 mx-auto" />
                        <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
                            Reset Your Password
                        </h2>
                        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>
                    <form className="space-y-4" onSubmit={handlePasswordReset}>
                        <InputField id="email" type="email" placeholder="Email address" icon={MailIcon} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                        {error && <p className="text-sm text-error text-center animate-fade-in">{error}</p>}
                        <div className="pt-2">
                            <Button type="submit" className="w-full py-3" disabled={isLoading}>
                                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                            </Button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                        Remember your password?
                        <button onClick={() => setMode('login')} className="font-medium text-brand-blue hover:underline ml-1" disabled={isLoading}>
                            Log In
                        </button>
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <LogoIcon className="w-12 h-12 mx-auto" />
                    <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
                        {isLogin ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        {isLogin ? 'Sign in to access your portfolio command center.' : 'Join Nexus to start tracking your assets.'}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <InputField id="email" type="email" placeholder="Email address" icon={MailIcon} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                    <InputField 
                        id="password" 
                        type="password" 
                        placeholder="Password" 
                        icon={LockIcon} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        isPassword
                        isVisible={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                    />
                    {!isLogin && (
                        <InputField 
                            id="confirm-password" 
                            type="password" 
                            placeholder="Confirm Password" 
                            icon={LockIcon} 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            autoComplete="new-password"
                            isPassword
                            isVisible={showConfirmPassword}
                            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                    )}

                    {isLogin && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => setMode('resetPassword')}
                                className="text-sm font-medium text-brand-blue hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}


                    {error && <p className="text-sm text-error text-center animate-fade-in">{error}</p>}

                    <div className="pt-2">
                        <Button type="submit" className="w-full py-3" disabled={isLoading}>
                            {isLoading ? `${isLogin ? 'Logging In' : 'Creating Account'}...` : (isLogin ? 'Log In' : 'Create Account')}
                        </Button>
                    </div>
                </form>

                 <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setMode(isLogin ? 'signup' : 'login')} className="font-medium text-brand-blue hover:underline ml-1" disabled={isLoading}>
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};
