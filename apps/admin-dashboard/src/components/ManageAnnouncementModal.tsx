import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    target: 'All Users' | 'Free Users' | 'Pro Users';
    status: 'Draft' | 'Active' | 'Archived';
    style: 'Banner' | 'Modal';
    created_at: string;
}

type SavePayload = Omit<Announcement, 'id' | 'created_at'> & { id?: string };

interface ManageAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (announcement: SavePayload) => void;
    announcementToEdit: Announcement | null;
}

export const ManageAnnouncementModal: React.FC<ManageAnnouncementModalProps> = ({ isOpen, onClose, onSave, announcementToEdit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [target, setTarget] = useState<'All Users' | 'Free Users' | 'Pro Users'>('All Users');
    const [status, setStatus] = useState<'Draft' | 'Active' | 'Archived'>('Draft');
    const [style, setStyle] = useState<'Banner' | 'Modal'>('Banner');
    
    const isEditing = !!announcementToEdit;

    useEffect(() => {
        if (isOpen && announcementToEdit) {
            setTitle(announcementToEdit.title);
            setContent(announcementToEdit.content);
            setTarget(announcementToEdit.target);
            setStatus(announcementToEdit.status);
            setStyle(announcementToEdit.style);
        } else if (!isOpen) {
            setTimeout(() => {
                setTitle('');
                setContent('');
                setTarget('All Users');
                setStatus('Draft');
                setStyle('Banner');
            }, 200);
        }
    }, [isOpen, announcementToEdit]);

    const handleSave = useCallback(() => {
        if (!title.trim() || !content.trim()) return;

        const data: SavePayload = {
            id: announcementToEdit?.id,
            title,
            content,
            target,
            status,
            style,
        };
        onSave(data);
        onClose();
    }, [title, content, target, status, style, announcementToEdit, onSave, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Announcement' : 'New Announcement'}>
            <div className="space-y-6">
                 <div>
                    <label htmlFor="anno-title" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Title</label>
                    <input type="text" id="anno-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="anno-content" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Content</label>
                    <textarea id="anno-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="anno-target" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Target</label>
                        <select id="anno-target" value={target} onChange={e => setTarget(e.target.value as any)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                            <option>All Users</option>
                            <option>Free Users</option>
                            <option>Pro Users</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="anno-status" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Status</label>
                        <select id="anno-status" value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                            <option>Draft</option>
                            <option>Active</option>
                            <option>Archived</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="anno-style" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Style</label>
                        <select id="anno-style" value={style} onChange={e => setStyle(e.target.value as any)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                            <option>Banner</option>
                            <option>Modal</option>
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Announcement'}</Button>
                </div>
            </div>
        </Modal>
    );
};