import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { SearchIcon } from './icons/SearchIcon';
import { Skeleton } from './shared/Skeleton';
import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { WatchlistToken, Token } from '../types';
import { useAiTokenDiscovery, AiTokenSuggestion } from '../hooks/useAiTokenDiscovery';
import { SparklesIcon } from './icons/SparklesIcon';

interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
}

interface AddWatchlistTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (token: { id: string; symbol: string }) => Promise<void>;
    existingWatchlist: WatchlistToken[];
    userTokens: Token[]; // Pass user's tokens for AI context
}

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>
        {label}
    </button>
);

// --- Search Tab Content ---
const SearchTab: React.FC<{
    onAdd: (token: { id: string, symbol: string }) => Promise<void>;
    existingWatchlist: WatchlistToken[];
}> = ({ onAdd, existingWatchlist }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [addingIds, setAddingIds] = useState<string[]>([]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        const debounce = setTimeout(async () => {
            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
                if (!response.ok) throw new Error('Failed to search');
                const data = await response.json();
                setResults(data.coins || []);
            } catch (e) {
                setError('Could not fetch tokens. Please try again.');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);
    
    const handleAdd = async (token: SearchResult) => {
        setAddingIds(prev => [...prev, token.id]);
        await onAdd({ id: token.id, symbol: token.symbol.toUpperCase() });
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Search for a token by name or symbol..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3"
                    autoFocus
                />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="max-h-80 min-h-[100px] overflow-y-auto space-y-2 pr-2">
                {loading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                {!loading && results.map(token => {
                    const isAdded = existingWatchlist.some(t => t.id === token.id);
                    const isAdding = addingIds.includes(token.id);
                    return (
                        <div key={token.id} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700">
                            <div className="flex items-center space-x-3">
                                <img src={token.thumb} alt={token.name} className="w-6 h-6 rounded-full" />
                                <div>
                                    <p className="font-semibold">{token.name}</p>
                                    <p className="text-xs text-neutral-500">{token.symbol.toUpperCase()}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleAdd(token)} disabled={isAdded || isAdding}>
                                {isAdded ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- AI Discovery Tab Content ---
const AiDiscoveryTab: React.FC<{
    onAdd: (token: { id: string, symbol: string }) => Promise<void>;
    existingWatchlist: WatchlistToken[];
    userTokens: Token[];
}> = ({ onAdd, existingWatchlist, userTokens }) => {
    const [prompt, setPrompt] = useState('');
    const [addingIds, setAddingIds] = useState<string[]>([]);
    const { generateSuggestions, suggestions, isLoading, error } = useAiTokenDiscovery();

    const handleGenerate = () => {
        generateSuggestions(prompt, userTokens);
    };

    const handleAdd = async (token: AiTokenSuggestion) => {
        setAddingIds(prev => [...prev, token.id]);
        await onAdd({ id: token.id, symbol: token.symbol });
    };

    return (
         <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Describe your investment interests to get personalized token suggestions from our AI.
            </p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'new AI tokens on Solana' or 'undervalued DeFi protocols'"
                rows={2}
                className="block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"
            />
            <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={isLoading}>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {isLoading ? 'Thinking...' : 'Get Suggestions'}
                </Button>
            </div>
             {error && <p className="text-sm text-error">{error}</p>}
            <div className="max-h-64 min-h-[100px] overflow-y-auto space-y-3 pr-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                 {isLoading && Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /></div>
                 ))}
                 {!isLoading && suggestions.map(token => {
                     const isAdded = existingWatchlist.some(t => t.id === token.id);
                     const isAdding = addingIds.includes(token.id);
                     return (
                        <div key={token.id} className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-neutral-900 dark:text-white">{token.name} ({token.symbol.toUpperCase()})</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{token.rationale}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAdd(token)} disabled={isAdded || isAdding}>
                                    {isAdded ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                     )
                 })}
            </div>
        </div>
    );
};


export const AddWatchlistTokenModal: React.FC<AddWatchlistTokenModalProps> = ({ isOpen, onClose, onAdd, existingWatchlist, userTokens }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'ai'>('search');

    // Reset tab on close
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('search');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Token to Watchlist">
             <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4">
                <nav className="-mb-px flex space-x-4">
                    <TabButton label="Search" isActive={activeTab === 'search'} onClick={() => setActiveTab('search')} />
                    <TabButton label="AI Discovery" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                </nav>
            </div>
            
            {activeTab === 'search' ? (
                <SearchTab onAdd={onAdd} existingWatchlist={existingWatchlist} />
            ) : (
                <AiDiscoveryTab onAdd={onAdd} existingWatchlist={existingWatchlist} userTokens={userTokens} />
            )}
        </Modal>
    );
};