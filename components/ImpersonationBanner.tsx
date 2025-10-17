import React from 'react';
import { EyeIcon } from './icons/EyeIcon';

interface ImpersonationBannerProps {
    userName: string;
    onStop: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ userName, onStop }) => {
    return (
        <div className="bg-yellow-400 text-black p-2 text-center text-sm font-semibold flex items-center justify-center space-x-4 z-50 relative">
            <EyeIcon className="w-5 h-5" />
            <span>
                You are currently viewing the portfolio as <strong>{userName}</strong>.
            </span>
            <button onClick={onStop} className="underline hover:opacity-80 font-bold">
                Stop Impersonating
            </button>
        </div>
    );
};