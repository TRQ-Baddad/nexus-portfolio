import React, { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { Skeleton } from './shared/Skeleton';
import { WhaleSegment, User } from '../types';
import { UpgradeNotice } from './shared/UpgradeNotice';
import { supabase } from '../utils/supabase';

const segmentDiscoverySchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description: 'A short, descriptive name for the generated segment based on the user query (e.g., "Top PEPE Traders").'
        },
        description: {
            type: Type.STRING,
            description: "A concise, one-sentence explanation of what this segment represents."
        },
        addresses: {
            type: Type.ARRAY,
            description: 'A list of 3 to 7 relevant, real, and publicly known wallet addresses that match the criteria, including their blockchain.',
            items: {
                type: Type.OBJECT,
                properties: {
                    address: { type: Type.STRING, description: "The full public wallet address." },
                    blockchain: { 
                        type: Type.STRING, 
                        enum: ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'],
                        description: "The blockchain the wallet is on."
                    }
                },
                required: ['address', 'blockchain']
            }
        }
    },
    required: ['name', 'description', 'addresses']
};

const createSegmentDiscoveryPrompt = (userPrompt: string): string => {
  return `
    You are an expert crypto analyst with access to on-chain data. A user wants to create a "Whale Segment" which is a group of wallets representing a specific strategy or persona.
    Your task is to generate a segment based on the user's request. This includes a name for the segment, a short description, and a list of 3-7 relevant, real, and publicly known wallet addresses with their blockchains.

    **User's Request:** "${userPrompt}"

    **Important Rules:**
    1.  The addresses MUST be real and publicly known if possible.
    2.  Provide between 3 and 7 wallet addresses.
    3.  For each address, you MUST specify its correct blockchain from this list: 'ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'.
    4.  The segment name and description should be concise and accurately reflect the user's query.

    Now, generate a JSON object matching the schema for the user's request.
  `;
};

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSegment: (segmentData: Omit<WhaleSegment, 'id'>) => void;
  user: User | null;
  onUpgrade: () => void;
}

export const CreateSegmentModal: React.FC<CreateSegmentModalProps> = ({ isOpen, onClose, onAddSegment, user, onUpgrade }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<Omit<WhaleSegment, 'id'> | null>(null);
    const isFreeTier = user?.plan === 'Free';

    const handleDiscover = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please describe the segment you want to create.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const fullPrompt = createSegmentDiscoveryPrompt(prompt);
            
            // Re-using the discover-whales function as it has a similar schema output
            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt: fullPrompt, schema: segmentDiscoverySchema, singleObject: true },
            });

            if (functionError) throw functionError;
            
            const parsedResult = data;

            if (parsedResult.name && parsedResult.description && Array.isArray(parsedResult.addresses)) {
                setResult(parsedResult);
            } else {
                throw new Error("AI returned an unexpected format.");
            }

        } catch (e: any) {
            console.error("Error creating segment:", e);
            setError("Sorry, the AI couldn't create a segment for that query. Please try being more specific or try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    const handleAddAndClose = () => {
        if (result) {
            onAddSegment(result);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isFreeTier ? "Upgrade to Pro" : "Create AI-Powered Whale Segment"}>
           {isFreeTier ? (
                <UpgradeNotice 
                    onUpgrade={onUpgrade}
                    title="Unlock AI-Powered Segments"
                    description="Upgrade to Pro to create custom whale cohorts using natural language. Analyze collective behavior and spot trends faster."
                    features={['Create AI-generated segments', 'Analyze collective behavior', 'Discover new strategies', 'Unlimited custom segments']}
                />
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        Describe a group of wallets in natural language, and our AI will create a trackable segment for you.
                    </p>
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'wallets that were early to WIF and BONK' or 'the most profitable traders on Base chain in the last 30 days'"
                        rows={3}
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                    
                    {error && <p className="text-sm text-error">{error}</p>}
                    
                    <div className="flex justify-end">
                        <Button onClick={handleDiscover} disabled={isLoading}>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            {isLoading ? 'Generating...' : 'Create with AI'}
                        </Button>
                    </div>
                    
                    {(isLoading || result) && (
                        <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            {isLoading ? (
                                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg space-y-2">
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4 mt-2" />
                                </div>
                            ) : result && (
                                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-fade-in">
                                    <h4 className="font-bold text-lg text-neutral-900 dark:text-white">{result.name}</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">{result.description}</p>
                                    <p className="text-xs font-semibold text-neutral-500">{result.addresses.length} wallets found.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {result && !isLoading && (
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleAddAndClose}>
                               Add Segment and Close
                            </Button>
                        </div>
                    )}

                </div>
            )}
        </Modal>
    );
};