import React from 'react';
import { AdminView, usePermissions } from '../App';
import { LogoIcon } from '../../../../components/icons/LogoIcon';
import { GridIcon } from '../../../../components/icons/GridIcon';
import { UsersIcon } from '../../../../components/icons/UsersIcon';
import { FishIcon } from '../../../../components/icons/FishIcon';
import { SettingsIcon } from '../../../../components/icons/SettingsIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { DownloadCloudIcon } from './icons/DownloadCloudIcon';
import { BotIcon } from './icons/BotIcon';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { ArrowRightLeftIcon } from './icons/ArrowRightLeftIcon';
import { LifeBuoyIcon } from './icons/LifeBuoyIcon';
import { Skeleton } from '../../../../components/shared/Skeleton';


interface AdminSidebarProps {
  appName: string;
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-brand-blue text-white'
        : 'text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span>{label}</span>
  </button>
);

const NAV_ITEMS: { view: AdminView; label: string; icon: React.FC<any>; category: string }[] = [
    { view: 'users', label: 'User Management', icon: UsersIcon, category: 'User Management' },
    { view: 'whales', label: 'Whale Management', icon: FishIcon, category: 'Whale Management' },
    { view: 'transactions', label: 'Transactions', icon: ArrowRightLeftIcon, category: 'Transactions' },
    { view: 'content', label: 'Content', icon: FileTextIcon, category: 'Content' },
    { view: 'announcements', label: 'Announcements', icon: MegaphoneIcon, category: 'Announcements' },
    { view: 'support', label: 'Support', icon: LifeBuoyIcon, category: 'Support' },
    { view: 'automations', label: 'Automations', icon: BotIcon, category: 'Automations' },
    { view: 'experiments', label: 'Experiments', icon: FlaskConicalIcon, category: 'Experiments' },
    { view: 'analytics', label: 'Analytics', icon: BarChartIcon, category: 'Analytics' },
    { view: 'reports', label: 'Reports', icon: DownloadCloudIcon, category: 'Reports' },
    { view: 'system-health', label: 'System Health', icon: ShieldCheckIcon, category: 'System Health' },
    { view: 'settings', label: 'Settings', icon: SettingsIcon, category: 'Settings' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ appName, activeView, setActiveView, isOpen, onClose }) => {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <LogoIcon className="h-8 w-8" />
          <span className="text-xl font-bold">{appName} <span className="font-light text-neutral-500">Admin</span></span>
        </div>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <NavItem label="Dashboard" icon={GridIcon} isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        
        {permissionsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          NAV_ITEMS.filter(item => hasPermission(item.category, 'view')).map(item => (
            <NavItem 
              key={item.view}
              label={item.label} 
              icon={item.icon} 
              isActive={activeView === item.view} 
              onClick={() => setActiveView(item.view)} 
            />
          ))
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col flex-shrink-0
        fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
};