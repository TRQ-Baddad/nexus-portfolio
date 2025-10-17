import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Token, PortfolioValue } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { ZapIcon } from './icons/ZapIcon';
import { PRO_FEATURES } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { MicrophoneVisualizer, ActivityState } from './MicrophoneVisualizer';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';

// --- Audio Utility Functions ---

// Decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Decode raw PCM audio data to an AudioBuffer
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Encode Uint8Array to base64 string
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Create a GenAI Blob from Float32Array audio data
function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const createSystemInstruction = (tokens: Token[], portfolioValue: PortfolioValue): string => {
    const top5Tokens = tokens
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(t => `${t.name} ($${t.value.toFixed(2)})`)
        .join(', ');

    const portfolioSummary = {
        totalValue: portfolioValue.total.toFixed(2),
        change24hPercent: portfolioValue.change24hPercent.toFixed(2),
        topHoldings: top5Tokens,
    };

    return `You are a friendly and helpful crypto portfolio analyst for an app called Nexus Portfolio. Provide concise, insightful answers based on user questions. Do not mention you are an AI model.
    Here is a summary of the user's current portfolio for your context:
    - Total Value: $${portfolioSummary.totalValue}
    - 24h Change: ${portfolioSummary.change24hPercent}%
    - Top 5 Holdings: ${portfolioSummary.topHoldings || 'N/A'}
    
    Use this data to answer questions about the user's portfolio. If the user asks a general crypto question, answer it without referencing their portfolio. If the portfolio is empty, inform the user they need to add assets to get portfolio-specific answers.`;
};


// --- Component ---

interface LiveProps {
    user: User | null;
    tokens: Token[];
    portfolioValue: PortfolioValue;
    isModalMode?: boolean;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
type TranscriptItem = { speaker: 'user' | 'model'; text: string; isFinal: boolean };

const UpgradeNotice: React.FC = () => (
    <Card>
        <Card.Content className="p-6 text-center">
            <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                    <ZapIcon className="w-8 h-8" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Unlock Live AI Analysis</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mt-2 mb-4 max-w-md mx-auto">
                Upgrade to Pro to chat with our live AI assistant. Ask complex questions about your portfolio, whale wallets, or market trends, and get instant voice answers.
            </p>
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-left mb-6 max-w-sm mx-auto">
                <ul className="space-y-2">
                    {PRO_FEATURES.slice(1, 5).map(feature => (
                        <li key={feature} className="flex items-center text-sm">
                            <CheckIcon className="w-4 h-4 mr-2 flex-shrink-0 text-success" />
                            <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Button className="w-full sm:w-auto">
                <ZapIcon className="w-4 h-4 mr-2" />
                Upgrade to Pro - $10/month
            </Button>
        </Card.Content>
    </Card>
);

export const Live: React.FC<LiveProps> = ({ user, tokens, portfolioValue, isModalMode = false }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [activity, setActivity] = useState<ActivityState>('idle');
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextsRef = useRef<{ input: AudioContext | null, output: AudioContext | null }>({ input: null, output: null });
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioPlaybackQueueTimeRef = useRef(0);
    const activeAudioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    // =================================================================================
    // CRITICAL SECURITY NOTE
    // =================================================================================
    // The Gemini Live API uses a client-side WebSocket, which cannot be proxied through
    // a simple serverless function. This requires exposing an API key on the client.
    //
    // TO MITIGATE: The `VITE_GEMINI_API_KEY` used here MUST be a client-safe key
    // with **HTTP referrer restrictions** configured in the Google Cloud console.
    // This ensures the key can ONLY be used from your application's domain.
    //
    // All other Gemini API calls in this app have been moved to secure backend functions.
    // =================================================================================
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const isApiKeyAvailable = !!apiKey;
    const canStartSession = isApiKeyAvailable && user?.plan === 'Pro';

    const stopSession = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        audioContextsRef.current.input?.close();
        audioContextsRef.current.output?.close();
        audioContextsRef.current = { input: null, output: null };

        activeAudioSourcesRef.current.forEach(source => source.stop());
        activeAudioSourcesRef.current.clear();
        audioPlaybackQueueTimeRef.current = 0;

        setConnectionState('idle');
        setActivity('idle');
    }, []);

    const startSession = useCallback(async () => {
        if (!canStartSession || connectionState !== 'idle') return;

        setConnectionState('connecting');
        setActivity('thinking');
        setTranscript([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: apiKey! });

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };

            const systemInstruction = createSystemInstruction(tokens, portfolioValue);

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        setActivity('listening');
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                        mediaStreamSourceRef.current = source;
                        scriptProcessorRef.current = scriptProcessor;
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                            const { text, isFinal } = message.serverContent.inputTranscription;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user' && !last.isFinal) {
                                    const updated = [...prev];
                                    updated[prev.length - 1] = { ...last, text: last.text + text, isFinal };
                                    return updated;
                                }
                                return [...prev, { speaker: 'user', text, isFinal }];
                            });
                            if (isFinal) {
                                setActivity('thinking');
                            }
                        }
                        if (message.serverContent?.outputTranscription) {
                            if (activity !== 'speaking') setActivity('speaking');
                            const { text, isFinal } = message.serverContent.outputTranscription;
                             setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'model' && !last.isFinal) {
                                    const updated = [...prev];
                                    updated[prev.length - 1] = { ...last, text: last.text + text, isFinal };
                                    return updated;
                                }
                                return [...prev, { speaker: 'model', text, isFinal }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => prev.map(t => ({...t, isFinal: true})));
                            setActivity('listening');
                        }
                        
                        // Handle interruption from user
                        if (message.serverContent?.interrupted) {
                            for (const source of activeAudioSourcesRef.current.values()) {
                                source.stop();
                                activeAudioSourcesRef.current.delete(source);
                            }
                            audioPlaybackQueueTimeRef.current = 0;
                        }
                        
                        // Handle audio playback
                        const audioDataB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioDataB64 && audioContextsRef.current.output) {
                            if (activity !== 'speaking') setActivity('speaking');
                            const outputCtx = audioContextsRef.current.output;
                            const nextStartTime = Math.max(audioPlaybackQueueTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioDataB64), outputCtx, 24000, 1);
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                activeAudioSourcesRef.current.delete(source);
                            });
                            
                            source.start(nextStartTime);
                            audioPlaybackQueueTimeRef.current = nextStartTime + audioBuffer.duration;
                            activeAudioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setConnectionState('error');
                        setActivity('idle');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        setConnectionState('disconnected');
                        setActivity('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                }
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error('Failed to start live session:', error);
            setConnectionState('error');
            setActivity('idle');
        }
    }, [canStartSession, connectionState, tokens, portfolioValue, stopSession, apiKey]);
    
    // Cleanup on unmount or when modal is closed
    useEffect(() => {
        return () => {
            if(connectionState !== 'idle') {
                stopSession();
            }
        };
    }, [stopSession, connectionState]);
    
    const handleMicClick = () => {
        if (connectionState === 'connected') {
            stopSession();
        } else if (connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error') {
            startSession();
        }
    }

    const statusText: Record<ConnectionState, string> = {
        idle: 'Click the mic to start',
        connecting: 'Connecting...',
        connected: 'Connected',
        error: 'Connection error. Please try again.',
        disconnected: 'Disconnected. Click to restart.',
    }

    const activityText: Record<ActivityState, string> = {
        idle: '',
        listening: 'Listening...',
        thinking: 'Thinking...',
        speaking: 'Speaking...',
    }

    if (user?.plan === 'Free') {
        return <UpgradeNotice />;
    }

    if (!isApiKeyAvailable) {
        return (
             <Card>
                <Card.Content className="p-6 text-center">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Live Feature Unavailable</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-2">
                        The Gemini API key has not been configured for this application. Please add your key to enable this feature.
                    </p>
                </Card.Content>
             </Card>
        );
    }
    
    const coreContent = (
        <>
            <div className="w-full max-w-2xl h-64 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4 overflow-y-auto flex flex-col-reverse">
                <div className="space-y-4">
                    {transcript.map((item, index) => (
                        <div key={index} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-3 py-2 rounded-lg max-w-[80%] ${item.speaker === 'user' ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                                <p className="text-sm">{item.text}</p>
                            </div>
                        </div>
                    ))}
                     {transcript.length === 0 && connectionState === 'connected' && (
                        <div className="text-center text-neutral-400 p-8">
                            <p>Ask me anything about your portfolio...</p>
                            <p className="text-xs mt-2">e.g., "What's my top performing asset?" or "How much Solana do I have?"</p>
                        </div>
                     )}
                </div>
            </div>

            <div className="flex flex-col items-center space-y-2 h-28">
                <MicrophoneVisualizer state={activity} onClick={handleMicClick} />
                <p className="text-sm text-neutral-500 dark:text-neutral-400 h-5">
                    {connectionState === 'connected' ? activityText[activity] : statusText[connectionState]}
                </p>
            </div>
        </>
    );

    if (isModalMode) {
        return <div className="flex flex-col items-center justify-center space-y-6">{coreContent}</div>;
    }
    
    return (
        <Card>
            <Card.Header>
                <Card.Title>Live AI Assistant</Card.Title>
                <Card.Description>Ask questions about your portfolio and get instant voice answers.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6 flex flex-col items-center justify-center space-y-6">
                {coreContent}
            </Card.Content>
        </Card>
    );
};
