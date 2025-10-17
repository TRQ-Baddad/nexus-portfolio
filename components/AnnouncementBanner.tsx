import React from 'react';
import { Announcement } from '../hooks/useAnnouncements';
import { MegaphoneIcon } from '../apps/admin-dashboard/src/components/icons/MegaphoneIcon';
import { XIcon } from './icons/XIcon';

interface AnnouncementBannerProps {
    announcement: Announcement;
    onDismiss: (id: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcement, onDismiss }) => {
    return (
        <div className="bg-brand-blue/10 dark:bg-brand-blue/20 p-2 text-center text-sm font-medium flex items-center justify-center space-x-4 animate-fade-in">
            <MegaphoneIcon className="w-5 h-5 text-brand-blue flex-shrink-0" />
            <span className="text-neutral-800 dark:text-neutral-200">
                <strong className="font-semibold">{announcement.title}</strong>: {announcement.content}
            </span>
            <button onClick={() => onDismiss(announcement.id)} className="p-1 rounded-full hover:bg-black/10">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};