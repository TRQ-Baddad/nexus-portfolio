
import React, { useState } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { TRANSLATIONS } from '../../../../../constants';

type LanguageCode = keyof typeof TRANSLATIONS;
const supportedLanguages = Object.keys(TRANSLATIONS) as LanguageCode[];

export const TranslationsSettings: React.FC = () => {
    const [selectedLang, setSelectedLang] = useState<LanguageCode>('en');
    const translations = TRANSLATIONS[selectedLang];

    return (
        <Card>
            <Card.Header>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Card.Title>Internationalization (Read-Only)</Card.Title>
                        <Card.Description>Manage translations for different languages in the main application.</Card.Description>
                    </div>
                     <select 
                        value={selectedLang} 
                        onChange={e => setSelectedLang(e.target.value as LanguageCode)}
                        className="mt-4 sm:mt-0 block w-full sm:w-auto bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    >
                        {supportedLanguages.map(lang => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </Card.Header>
            <Card.Content className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="p-4 font-medium w-1/4">Key</th>
                                <th className="p-4 font-medium">Translation ({selectedLang.toUpperCase()})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(translations).map(([key, value]) => (
                                <tr key={key} className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
                                    <td className="p-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">{key}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={value}
                                            readOnly
                                            className="w-full bg-transparent border border-transparent rounded-md py-2 px-3"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card.Content>
             <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50">
                 <p className="text-sm text-neutral-600 dark:text-neutral-400">
                     <strong>Note:</strong> The `translations` database table was not found. This component is in read-only mode, displaying values from `constants.tsx`. To modify translations, please edit the constant file directly.
                 </p>
            </div>
        </Card>
    );
};
