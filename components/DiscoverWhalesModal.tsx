import React, { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { Skeleton } from './shared/Skeleton';
import { Blockchain, WhaleWallet, AiSuggestedWhale } from '../types';
import { BLOCKCHAIN_METADATA } from '../constants';
import { supabase } from '../utils/supabase';

const whaleDiscoverySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: 'A descriptive name for the wallet or entity.'
            },
            address: {
                type: Type.STRING,
                description: 'The full public wallet address.'
            },
            blockchain: {
                type: Type.STRING,
                enum: ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'],
                description: 'The blockchain the wallet is on.'
            },
            description: {
                type: Type.STRING,
                description: "A concise, one-sentence explanation of why this wallet is relevant to the user's query."
            }
        },
        required: ['name', 'address', 'blockchain', 'description']
    }
};

const createWhaleDiscoveryPrompt = (userPrompt: string): string => {
  return `
    You are an expert crypto analyst with access to on-chain data. A user wants to discover new "whale" wallets to track based on their interests.
    Your task is to generate a list of 3-5 relevant, real, and publicly known wallet addresses that match the user's request.
    For each wallet, provide a suggested name, the blockchain it's on, and a concise, one-sentence description explaining why it's a good match for the user's query.

    **User's Request:** "${userPrompt}"

    **Important Rules:**
    1.  The addresses MUST be real and publicly associated with the entity or strategy if possible.
    2.  The blockchain MUST be one of the following: 'ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base'.
    3.  The description should be insightful and directly relate to the user's request.
    4.  Generate between 3 and 5 suggestions.

    **Example User Request:** "Find me some top traders of the PEPE memecoin."

    **Example JSON Output for the above request:**
    [
      {
        "name": "PEPE Millionaire '0x50b'",
        "address": "0x50b2b7092b327c433362356c913501f5581c3c03",
        "blockchain": "ethereum",
        "description": "This wallet is known for making millions in profit by trading PEPE during its initial run-up."
      },
      {
        "name": "Crypto.com PEPE holdings",
        "address": "0x6335a282ea82a4563a36224497e2ac3c7a07d3aa",
        "blockchain": "ethereum",
        "description": "One of Crypto.com's wallets, holding a significant supply of PEPE, indicating exchange-level interest."
      }
    ]

    Now, generate a JSON array of wallet suggestions for the user's request.
  `;
};


const SuggestedWhaleCard: React.FC<{
    whale: AiSuggestedWhale;
    onAdd: (whaleData: { address: string; blockchain: Blockchain; name: string; }) => void;
    isAdded: boolean;
}> = ({ whale, onAdd, isAdded }) => {
    const ChainIcon = BLOCKCHAIN_METADATA[whale.blockchain].icon;
    
    const handleAdd = () => {
        onAdd({
            address: whale.address,
            blockchain: whale.blockchain,
            name: whale.name,
        });
    };

    return (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-2">
                        <ChainIcon className="w-5 h-5 flex-shrink-0" />
                        <h4 className="font-bold text-neutral-900 dark:text-white">{whale.name}</h4>
                    </div>
                    <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1 break-all">{whale.address}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleAdd} disabled={isAdded}>
                    {isAdded ? <CheckIcon className="w-4 h-4 mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />}
                    {isAdded ? 'Added' : 'Add'}
                </Button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">{whale.description}</p>
        </div>
    );
};

interface DiscoverWhalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWhale: (whaleData: { address: string; blockchain: Blockchain; name: string; }) => void;
  existingWhales: WhaleWallet[];
}

export const DiscoverWhalesModal: React.FC<DiscoverWhalesModalProps> = ({ isOpen, onClose, onAddWhale, existingWhales }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<AiSuggestedWhale[]>([]);

    const handleDiscover = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please describe the type of wallet you want to find.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const fullPrompt = createWhaleDiscoveryPrompt(prompt);

            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt: fullPrompt, schema: whaleDiscoverySchema },
            });

            if (functionError) throw functionError;
            
            const parsedResult = data;

            if (Array.isArray(parsedResult)) {
                setResults(parsedResult);
            } else {
                throw new Error("AI returned an unexpected format.");
            }

        } catch (e: any) {
            console.error("Error discovering whales:", e);
            setError("Sorry, the AI couldn't find any suggestions for that query. Please try being more specific or try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Discover Whales with AI">
            <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Describe the kind of crypto whale you're interested in tracking. For example, "top PEPE traders" or "early investors in new L1s".
                </p>
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., wallets that are good at farming airdrops..."
                    rows={3}
                    className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
                
                {error && <p className="text-sm text-error">{error}</p>}
                
                <div className="flex justify-end">
                    <Button onClick={handleDiscover} disabled={isLoading}>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        {isLoading ? 'Searching...' : 'Find Whales'}
                    </Button>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    {isLoading && (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg space-y-2">
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-4 w-full mt-2" />
                            </div>
                        ))
                    )}
                    {results.length > 0 && results.map(whale => {
                        const isAdded = existingWhales.some(w => w.address.toLowerCase() === whale.address.toLowerCase());
                        return <SuggestedWhaleCard key={whale.address} whale={whale} onAdd={onAddWhale} isAdded={isAdded} />;
                    })}
                </div>
            </div>
        </Modal>
    );
};