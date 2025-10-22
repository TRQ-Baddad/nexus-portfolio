import React from 'react';
import { MicIcon } from './icons/MicIcon';

interface LiveAssistantFABProps {
    onClick: () => void;
}

export const LiveAssistantFAB: React.FC<LiveAssistantFABProps> = ({ onClick }) => {
    return (
        <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 group animate-fade-in">
            <button
                onClick={onClick}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-blue to-brand-purple text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{ animation: 'fab-pulse 2.5s infinite' }}
                aria-label="Launch Live AI Assistant"
            >
                <MicIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <div className="hidden sm:block absolute bottom-1/2 translate-y-1/2 right-full mr-4 w-max bg-neutral-800 text-white text-xs font-bold py-1.5 px-3 rounded-md z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Launch Live AI Assistant
            </div>
        </div>
    );
};
