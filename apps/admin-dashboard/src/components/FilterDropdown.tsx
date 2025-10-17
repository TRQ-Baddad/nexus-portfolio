import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface FilterDropdownProps<T extends string> {
    label: string;
    options: T[];
    selected: T[];
    onChange: (selected: T[]) => void;
}

export function FilterDropdown<T extends string>({ label, options, selected, onChange }: FilterDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleToggle = (option: T) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="text-xs font-medium text-neutral-500">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 flex items-center justify-between w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
            >
                <span>{selected.length > 0 ? `${selected.length} selected` : `Any ${label}`}</span>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700">
                    <ul className="p-2 space-y-1">
                        {options.map(option => (
                            <li key={option}>
                                <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option)}
                                        onChange={() => handleToggle(option)}
                                        className="rounded border-neutral-300 text-brand-blue focus:ring-brand-blue"
                                    />
                                    <span className="text-sm">{option}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}