import React from 'react';
import { MicIcon } from './icons/MicIcon';

interface LiveAssistantFABProps {
    onClick: () => void;
}

export const LiveAssistantFAB: React.FC<LiveAssistantFABProps> = ({ onClick }) => {
    return (
        <div className="fixed bottom-8 right-8 z-30 group animate-fade-in">
            <button
                onClick={onClick}
                className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-purple text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                style={{ animation: 'fab-pulse 2.5s infinite' }}
                aria-label="Launch Live AI Assistant"
            >
                <MicIcon className="w-8 h-8" />
            </button>
            <div className="absolute bottom-1/2 translate-y-1/2 right-full mr-4 w-max bg-neutral-800 text-white text-xs font-bold py-1.5 px-3 rounded-md z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Launch Live AI Assistant
            </div>
        </div>
    );
};
