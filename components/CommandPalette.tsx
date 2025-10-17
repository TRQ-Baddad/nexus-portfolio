import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCommandPalette } from '../hooks/useCommandPalette';
import { CommandAction } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';

export const CommandPalette: React.FC = () => {
    const { isOpen, setIsOpen, actions } = useCommandPalette();
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);
    
    // Self-contained scroll lock
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    const filteredActions = useMemo(() => {
        if (!search) return actions;
        const lowerSearch = search.toLowerCase();
        return actions.filter(action => 
            action.label.toLowerCase().includes(lowerSearch) ||
            action.keywords?.toLowerCase().includes(lowerSearch)
        );
    }, [search, actions]);

    const groupedActions: Record<string, CommandAction[]> = useMemo(() => {
        return filteredActions.reduce((acc, action) => {
            (acc[action.group] = acc[action.group] || []).push(action);
            return acc;
        }, {} as Record<string, CommandAction[]>);
    }, [filteredActions]);

    const flatActions = useMemo(() => {
        return Object.values(groupedActions).flat();
    }, [groupedActions]);
    
    useEffect(() => {
        setActiveIndex(0);
    }, [search]);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % flatActions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + flatActions.length) % flatActions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const action = flatActions[activeIndex];
                if (action) {
                    action.onSelect();
                    setIsOpen(false);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, flatActions, setIsOpen]);

    // Scroll active item into view
    useEffect(() => {
        const activeElement = document.getElementById(`command-item-${activeIndex}`);
        activeElement?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" aria-labelledby="command-palette" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsOpen(false)}></div>
            
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 transform transition-all duration-200 animate-fade-in">
                <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
                    <SearchIcon className="w-5 h-5 text-neutral-400 mx-4" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent h-14 border-0 focus:outline-none focus:ring-0 text-neutral-900 dark:text-white"
                    />
                </div>
                <div ref={resultsRef} className="max-h-96 overflow-y-auto p-2">
                    {flatActions.length > 0 ? (
                        Object.entries(groupedActions).map(([group, groupActions]) => (
                            <div key={group}>
                                <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">{group}</h3>
                                {groupActions.map(action => {
                                    const index = flatActions.findIndex(a => a.id === action.id);
                                    const isActive = index === activeIndex;
                                    return (
                                         <button
                                            id={`command-item-${index}`}
                                            key={action.id}
                                            onClick={() => {
                                                action.onSelect();
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center text-left p-3 text-sm rounded-md transition-colors ${isActive ? 'bg-brand-blue/10 text-brand-blue dark:text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'}`}
                                        >
                                            {action.icon && <span className="mr-3">{action.icon}</span>}
                                            <span>{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-neutral-500 dark:text-neutral-400">No results found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};