import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerIcon } from './icons/ComputerIcon';
import { CheckIcon } from './icons/CheckIcon';

type Theme = 'dark' | 'light' | 'system';

const themeOptions: { value: Theme; label: string; icon: React.FC<any> }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerIcon },
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  let CurrentIcon = ComputerIcon;
  if (theme === 'light') {
    CurrentIcon = SunIcon;
  } else if (theme === 'dark') {
    CurrentIcon = MoonIcon;
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme"
        className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 p-1 animate-fade-in z-50">
          <ul>
            {themeOptions.map(option => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <li key={option.value}>
                  <button
                    onClick={() => {
                      setTheme(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? 'bg-brand-blue/10 text-brand-blue dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{option.label}</span>
                    </div>
                    {isSelected && <CheckIcon className="w-4 h-4 text-brand-blue dark:text-white" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};