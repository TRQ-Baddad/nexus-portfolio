import React, { useEffect } from 'react';
import { ActiveView } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import { XIcon } from './icons/XIcon';

const NavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ label, isActive, onClick, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left px-4 py-3 text-lg font-semibold transition-colors duration-200 ${
                isActive 
                    ? 'text-brand-blue dark:text-white bg-brand-blue/10' 
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    )
};

export const MobileMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
}> = ({ isOpen, onClose, activeView, setActiveView }) => {
    
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    const handleNavClick = (view: ActiveView) => {
        setActiveView(view);
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            {/* Panel */}
            <div className={`relative w-full max-w-xs ml-auto h-full bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-lg shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center space-x-2">
                        <LogoIcon className="h-7 w-7" />
                        <span className="text-lg font-bold text-neutral-900 dark:text-white">Nexus</span>
                    </div>
                    <button onClick={onClose} className="p-2">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-grow py-4">
                    <NavItem label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
                    <NavItem label="NFTs" isActive={activeView === 'nfts'} onClick={() => handleNavClick('nfts')} />
                    <NavItem label="Smart Money" isActive={activeView === 'smart-money'} onClick={() => handleNavClick('smart-money')} />
                    <NavItem label="Intelligence" isActive={activeView === 'intelligence'} onClick={() => handleNavClick('intelligence')} />
                    <NavItem label="Analytics" isActive={activeView === 'analytics'} onClick={() => handleNavClick('analytics')} />
                    <NavItem label="DeFi" isActive={activeView === 'defi'} onClick={() => handleNavClick('defi')} />
                    <NavItem label="Transactions" isActive={activeView === 'transactions'} onClick={() => handleNavClick('transactions')} />
                    <NavItem label="Community" isActive={activeView === 'community'} onClick={() => handleNavClick('community')} />
                    <NavItem label="Support" isActive={activeView === 'support'} onClick={() => handleNavClick('support')} />
                </nav>
            </div>
        </div>
    );
};