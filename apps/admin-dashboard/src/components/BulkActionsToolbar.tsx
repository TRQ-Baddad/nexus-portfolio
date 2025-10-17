import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../../components/shared/Button';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MailIcon } from './icons/MailIcon';
import { ZapIcon } from '../../../../components/icons/ZapIcon';
import { UserXIcon } from './icons/UserXIcon';
import { UserCheckIcon } from './icons/UserCheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XCircleIcon } from '../../../../components/icons/XCircleIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';


export type BulkAction = 'suspend' | 'activate' | 'makePro' | 'makeFree' | 'export' | 'notify' | 'delete';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onAction: (action: BulkAction) => void;
    onClear: () => void;
}

const actionItems = [
    { key: 'notify', label: 'Send Notification', icon: MailIcon },
    { key: 'makePro', label: 'Change Plan to Pro', icon: ZapIcon },
    { key: 'makeFree', label: 'Change Plan to Free', icon: ZapIcon },
    { key: 'suspend', label: 'Suspend Users', icon: UserXIcon },
    { key: 'activate', label: 'Activate Users', icon: UserCheckIcon },
    { key: 'export', label: 'Export to CSV', icon: DownloadIcon },
    { key: 'delete', label: 'Delete Selected', icon: Trash2Icon },
] as const;

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ selectedCount, onAction, onClear }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="absolute top-0 left-0 right-0 h-16 bg-brand-blue/10 dark:bg-brand-blue/20 backdrop-blur-sm z-20 flex items-center justify-between px-4 animate-fade-in">
            <div className="flex items-center space-x-4">
                <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{selectedCount} user(s) selected</span>
                <button onClick={onClear} className="flex items-center text-sm text-neutral-600 dark:text-neutral-300 hover:text-error dark:hover:text-error">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Clear selection
                </button>
            </div>
            <div className="relative" ref={wrapperRef}>
                <Button onClick={() => setIsOpen(!isOpen)}>
                    Actions
                    <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-md shadow-2xl border border-neutral-200 dark:border-neutral-700 z-30">
                        <ul className="p-2">
                            {actionItems.map(({ key, label, icon: Icon }) => (
                                <li key={key}>
                                    <button
                                        onClick={() => {
                                            onAction(key);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center text-left px-3 py-2 text-sm rounded-md text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 ${key === 'delete' ? '!text-error hover:!bg-error/10' : ''}`}
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}