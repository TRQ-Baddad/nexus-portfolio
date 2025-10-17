import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CommandAction } from '../types';

interface CommandPaletteContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    actions: CommandAction[];
    registerActions: (newActions: CommandAction[]) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [actions, setActions] = useState<CommandAction[]>([]);

    const registerActions = useCallback((newActions: CommandAction[]) => {
        // Simple registration, could be more complex (e.g., merging) if needed
        setActions(newActions);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const value = { isOpen, setIsOpen, actions, registerActions };

    return React.createElement(CommandPaletteContext.Provider, { value }, children);
};

export const useCommandPalette = () => {
    const context = useContext(CommandPaletteContext);
    if (context === undefined) {
        throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
    }
    return context;
};
