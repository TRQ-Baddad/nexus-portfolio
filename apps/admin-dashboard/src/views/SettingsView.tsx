
import React, { useState } from 'react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { ApiKeysSettings } from '../components/settings/ApiKeysSettings';
import { MyAccountSettings } from '../components/settings/MyAccountSettings';
import { BillingSettings } from '../components/settings/BillingSettings';
import { ToolIcon } from '../components/icons/ToolIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { CreditCardIcon } from '../../../../components/icons/CreditCardIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { AuditLogSettings } from '../components/settings/AuditLogSettings';
import { PaletteIcon } from '../components/icons/PaletteIcon';
import { BrandingSettings } from '../components/settings/BrandingSettings';
import { PaintBrushIcon } from '../components/icons/PaintBrushIcon';
import { ThemeEditorSettings } from '../components/settings/ThemeEditorSettings';
import { LanguagesIcon } from '../components/icons/LanguagesIcon';
import { TranslationsSettings } from '../components/settings/TranslationsSettings';
import { ShieldHalfIcon } from '../components/icons/ShieldHalfIcon';
import { RolesSettings } from '../components/settings/RolesSettings';


type SettingsTab = 'My Account' | 'General' | 'API Keys' | 'Branding' | 'Theme Editor' | 'Translations' | 'Roles & Permissions' | 'Audit Log' | 'Billing';

const SETTINGS_GROUPS: { title: string; items: { name: SettingsTab; icon: React.FC<any> }[] }[] = [
    {
        title: 'Personal',
        items: [{ name: 'My Account', icon: UserCircleIcon }],
    },
    {
        title: 'Configuration',
        items: [
            { name: 'General', icon: ToolIcon },
            { name: 'API Keys', icon: KeyIcon },
            { name: 'Billing', icon: CreditCardIcon },
        ],
    },
    {
        title: 'Appearance',
        items: [
            { name: 'Branding', icon: PaintBrushIcon },
            { name: 'Theme Editor', icon: PaletteIcon },
            { name: 'Translations', icon: LanguagesIcon },
        ],
    },
    {
        title: 'Access & Security',
        items: [
            { name: 'Roles & Permissions', icon: ShieldHalfIcon },
            { name: 'Audit Log', icon: ClipboardListIcon },
        ],
    },
];

const NavItem: React.FC<{ name: string; icon: React.FC<any>; isActive: boolean; onClick: () => void; }> = ({ name, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-3 py-2 text-sm font-medium text-left rounded-md transition-colors ${
            isActive ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
    >
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span>{name}</span>
    </button>
);


export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('My Account');
    
    const renderActiveTab = () => {
        switch(activeTab) {
            case 'My Account': return <MyAccountSettings />;
            case 'General': return <GeneralSettings />;
            case 'API Keys': return <ApiKeysSettings />;
            case 'Branding': return <BrandingSettings />;
            case 'Theme Editor': return <ThemeEditorSettings />;
            case 'Translations': return <TranslationsSettings />;
            case 'Roles & Permissions': return <RolesSettings />;
            case 'Audit Log': return <AuditLogSettings />;
            case 'Billing': return <BillingSettings />;
            default: return <MyAccountSettings />;
        }
    }

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <aside className="lg:col-span-1">
                    <nav className="space-y-6">
                        {SETTINGS_GROUPS.map(group => (
                            <div key={group.title}>
                                <h2 className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{group.title}</h2>
                                <div className="space-y-1">
                                    {group.items.map(item => (
                                        <NavItem key={item.name} {...item} isActive={activeTab === item.name} onClick={() => setActiveTab(item.name)} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>
                
                <div className="lg:col-span-4">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
};
