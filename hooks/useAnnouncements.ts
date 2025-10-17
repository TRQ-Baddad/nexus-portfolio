import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { supabase } from '../utils/supabase';

// This matches the shape of the announcement object in the admin panel
export interface Announcement {
    id: string;
    title: string;
    content: string;
    target: 'All Users' | 'Free Users' | 'Pro Users';
    status: 'Draft' | 'Active' | 'Archived';
    style: 'Banner' | 'Modal';
    created_at: string;
}

export const useAnnouncements = (user: User | null, userId?: string) => {
    const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        try {
            if (!userId) return;
            const key = `nexus-dismissed-announcements-${userId}`;
            const dismissedIds = localStorage.getItem(key);
            if (dismissedIds) {
                setDismissed(JSON.parse(dismissedIds));
            }
        } catch (e) {
            console.error("Failed to parse dismissed announcements", e);
        }
    }, [userId]);

    useEffect(() => {
        const fetchAndSetAnnouncement = async () => {
            try {
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .eq('status', 'Active')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    throw error;
                }

                const allAnnouncements = data as Announcement[];

                const relevant = allAnnouncements.filter(a => {
                    if (a.target === 'All Users') return true;
                    if (!user) return false;
                    if (a.target === 'Pro Users' && user.plan === 'Pro') return true;
                    if (a.target === 'Free Users' && user.plan === 'Free') return true;
                    return false;
                });

                const notDismissed = relevant.find(a => !dismissed.includes(a.id));
                setActiveAnnouncement(notDismissed || null);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            }
        };

        fetchAndSetAnnouncement();

    }, [user, dismissed]);

    const dismissAnnouncement = useCallback((id: string) => {
        if (!userId) return;
        const key = `nexus-dismissed-announcements-${userId}`;
        const updatedDismissed = [...dismissed, id];
        setDismissed(updatedDismissed);
        localStorage.setItem(key, JSON.stringify(updatedDismissed));
    }, [dismissed, userId]);

    return { activeAnnouncement, dismissAnnouncement };
};
