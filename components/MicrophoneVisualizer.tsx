import React from 'react';
import { MicIcon } from './icons/MicIcon';

export type ActivityState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface MicrophoneVisualizerProps {
    state: ActivityState;
    onClick: () => void;
}

const SpeakingBar: React.FC<{ height: number, delay: number }> = ({ height, delay }) => (
    <div 
        className="w-1.5 bg-current rounded-full"
        style={{ 
            height: `${height}px`,
            animation: `speaking-wave 1.2s ease-in-out infinite`,
            animationDelay: `${delay}s`
        }}
    />
)

export const MicrophoneVisualizer: React.FC<MicrophoneVisualizerProps> = ({ state, onClick }) => {
    const baseClasses = "w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg";
    
    const stateConfig = {
        idle: {
            classes: "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600",
            content: <MicIcon className="w-8 h-8" />
        },
        listening: {
            classes: "bg-gradient-to-br from-brand-blue to-brand-purple text-white",
            content: <div className="w-10 h-10 rounded-full bg-white/20" style={{ animation: `listening-breath 2s ease-in-out infinite`}}><MicIcon className="w-8 h-8 text-white m-1" /></div>
        },
        speaking: {
            classes: "bg-neutral-200 dark:bg-neutral-700 text-brand-blue",
            content: (
                <div className="flex items-center justify-center space-x-1.5 h-full">
                   <SpeakingBar height={12} delay={0} />
                   <SpeakingBar height={24} delay={0.2} />
                   <SpeakingBar height={16} delay={0.4} />
                   <SpeakingBar height={20} delay={0.3} />
                   <SpeakingBar height={12} delay={0.1} />
                </div>
            )
        },
        thinking: {
            classes: "bg-brand-blue text-white animate-pulse",
            content: <MicIcon className="w-8 h-8" style={{ animation: `thinking-pulse 2s infinite` }}/>
        }
    };
    
    const currentConfig = stateConfig[state];

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${currentConfig.classes}`}
            aria-label={state === 'listening' ? 'Stop session' : 'Start session'}
        >
            {currentConfig.content}
        </button>
    );
};
