import React, { useState, useEffect, useRef } from 'react';
import { Button } from './shared/Button';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GridPattern } from './shared/GridPattern';
import { supabase } from '../utils/supabase';

interface WelcomeAIProps {
  onAddWallet: () => void;
}

// Polished cursor with brand gradient
const BlinkingCursor: React.FC = () => (
    <span 
        className="inline-block w-1 h-6 bg-gradient-to-b from-brand-blue to-brand-purple ml-1 rounded-full align-middle" 
        style={{ animation: 'blink-cursor 1.2s step-end infinite' }} 
    />
);

export const WelcomeAI: React.FC<WelcomeAIProps> = ({ onAddWallet }) => {
    const defaultMessage = "Your crypto's universe, unveiled. Command its every truth.";
    const [fullMessage, setFullMessage] = useState(defaultMessage);
    const [displayedMessage, setDisplayedMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typewriterIntervalRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Effect for interactive mouse-follow background
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = container;
            const x = (clientX - offsetWidth / 2) / offsetWidth * 25;
            const y = (clientY - offsetHeight / 2) / offsetHeight * 25;
            container.style.setProperty('--mouse-x', `${-x}px`);
            container.style.setProperty('--mouse-y', `${-y}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    // Fetch AI-generated message in the background on mount
    useEffect(() => {
        const fetchWelcomeMessage = async () => {
            try {
                const prompt = "You are Nexus AI, the intelligence behind a crypto portfolio command center. Create a short, welcoming yet powerful message for a new user. It should evoke a sense of clarity, control, and insight. Maximum 15 words. Example: 'Your crypto's universe, unveiled. Command its every truth.'";
                
                const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
                    body: { prompt },
                });
                if (error) throw error;
                
                const aiMessage = data.reply.trim();

                if (aiMessage && aiMessage !== defaultMessage) {
                    setFullMessage(aiMessage);
                }

            } catch (error) {
                console.error("Error fetching welcome message:", error);
                // Silently fail and stick with the default message
            }
        };

        fetchWelcomeMessage();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Typewriter effect, runs whenever `fullMessage` changes
    useEffect(() => {
        let i = 0;
        setIsTyping(true);
        setDisplayedMessage('');
        
        if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
        }

        typewriterIntervalRef.current = window.setInterval(() => {
            if (i < fullMessage.length) {
                setDisplayedMessage(prev => prev + fullMessage.charAt(i));
                i++;
            } else {
                if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
                setIsTyping(false);
            }
        }, 40);

        return () => {
            if (typewriterIntervalRef.current) {
                clearInterval(typewriterIntervalRef.current);
            }
        };
    }, [fullMessage]);


    return (
        <div ref={containerRef} className="relative w-full h-[450px] bg-neutral-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 animate-fade-in group">
            {/* Interactive Aurora Background */}
            <div className="absolute inset-0 transition-transform duration-500 ease-out" style={{ transform: 'translate(var(--mouse-x, 0), var(--mouse-y, 0))' }}>
                 <div className="absolute inset-0 opacity-40 mix-blend-soft-light blur-3xl">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue rounded-full" style={{ animation: 'blob-1 20s infinite alternate ease-in-out' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple rounded-full" style={{ animation: 'blob-2 22s infinite alternate ease-in-out' }} />
                    <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-success rounded-full" style={{ animation: 'blob-3 24s infinite alternate ease-in-out' }} />
                    <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-warning rounded-full" style={{ animation: 'blob-4 26s infinite alternate ease-in-out' }} />
                </div>
            </div>
            
            <GridPattern className="absolute inset-0 w-full h-full fill-white/5 stroke-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Enhanced Headline with integrated icon */}
                <div className="text-center">
                     <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
                        A singular view of your
                    </h2>
                    <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight mt-2 flex items-center justify-center">
                        digital cosmos.
                        <SparklesIcon className="w-10 h-10 text-white ml-4 transform transition-transform group-hover:scale-110 duration-300" />
                    </h2>
                </div>

                <div className="min-h-[70px] flex items-center justify-center my-4">
                    <p className="text-xl font-medium text-neutral-100 max-w-lg">
                        {displayedMessage}
                        {isTyping && <BlinkingCursor />}
                    </p>
                </div>
                
                {/* Wider Button with more spacing */}
                <Button onClick={onAddWallet} className="w-full sm:w-auto px-10 py-3 text-base mt-8" style={{ animation: 'subtle-pulse 3s infinite ease-in-out' }}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Connect First Wallet
                </Button>
            </div>
        </div>
    );
};
