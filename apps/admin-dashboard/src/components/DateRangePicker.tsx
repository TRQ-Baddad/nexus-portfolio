import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from '../../../../components/icons/CalendarIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

export type DateRange = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days' | 'All Time';
const ranges: DateRange[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];

interface DateRangePickerProps {
    value: DateRange;
    onChange: (value: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
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

    const handleSelect = (range: DateRange) => {
        onChange(range);
        setIsOpen(false);
    }

    return (
        <div className="relative mt-4 md:mt-0" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
                <CalendarIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>{value}</span>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                    <ul className="p-2">
                        {ranges.map(range => (
                            <li key={range}>
                                <button 
                                    onClick={() => handleSelect(range)}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                    {range}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};