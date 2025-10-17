
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { ManageAnnouncementModal, Announcement } from '../components/ManageAnnouncementModal';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { logAdminAction } from '../utils/adminLogger';

const AnnouncementRow: React.FC<{ announcement: Announcement; onEdit: () => void; onDelete: () => void; }> = ({ announcement, onEdit, onDelete }) => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4">
            <p className="font-semibold text-neutral-900 dark:text-white">{announcement.title}</p>
        </td>
        <td className="p-4">
             <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">{announcement.target}</span>
        </td>
        <td className="p-4">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${announcement.status === 'Active' ? 'bg-success/20 text-success' : 'bg-neutral-500/20 text-neutral-500'}`}>
                {announcement.status}
            </span>
        </td>
        <td className="p-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400">
            {new Date(announcement.created_at).toLocaleDateString()}
        </td>
         <td className="p-4 text-right">
            <div className="flex items-center justify-end space-x-2">
                <button onClick={onEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 text-neutral-500 hover:text-error rounded-full hover:bg-error/10"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        </td>
    </tr>
);

const SkeletonRow: React.FC = () => (
     <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4"><Skeleton className="h-5 w-3/4" /></td>
        <td className="p-4"><Skeleton className="h-5 w-20" /></td>
        <td className="p-4"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-24" /></td>
        <td className="p-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
    </tr>
)

export const AnnouncementsView: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Announcement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if(data) setAnnouncements(data as Announcement[]);
        if(error) console.error("Error fetching announcements:", error);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleOpenModal = (announcement: Announcement | null) => {
        setSelected(announcement);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelected(null);
    };
    
    const handleSave = async (data: Omit<Announcement, 'id' | 'created_at'> & { id?: string }) => {
        if (data.id) {
            const { error } = await supabase.from('announcements').update(data).eq('id', data.id);
            if (!error) {
                await logAdminAction('update_announcement', null, { announcementId: data.id, title: data.title });
            }
        } else {
            const { data: newData, error } = await supabase.from('announcements').insert([data]).select();
             if (!error && newData) {
                await logAdminAction('create_announcement', null, { announcementId: newData[0].id, title: data.title });
            }
        }
        fetchAnnouncements();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (!error) {
                await logAdminAction('delete_announcement', null, { announcementId: id });
                fetchAnnouncements();
            }
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Announcements</h1>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Announcement
                </Button>
            </div>
            
            <Card>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">Target</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Created</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({length: 3}).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    announcements.map(item => (
                                        <AnnouncementRow 
                                            key={item.id} 
                                            announcement={item} 
                                            onEdit={() => handleOpenModal(item)}
                                            onDelete={() => handleDelete(item.id)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Content>
            </Card>
            
            <ManageAnnouncementModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                announcementToEdit={selected}
            />
        </div>
    );
};
