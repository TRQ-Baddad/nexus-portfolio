import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { supabase } from '../../../../utils/supabase';

export interface Article {
    id: string;
    title: string;
    status: 'Draft' | 'Published';
    lastupdated: string;
    content: string;
    views?: number;
}

interface ManageContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (article: Omit<Article, 'id' | 'views'> & { id?: string }) => void;
    articleToEdit: Article | null;
}

export const ManageContentModal: React.FC<ManageContentModalProps> = ({ isOpen, onClose, onSave, articleToEdit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const isEditing = !!articleToEdit;

    useEffect(() => {
        if (isOpen && articleToEdit) {
            setTitle(articleToEdit.title);
            setContent(articleToEdit.content);
            setStatus(articleToEdit.status);
        } else if (!isOpen) {
            setTimeout(() => {
                setTitle('');
                setContent('');
                setStatus('Draft');
                setError('');
            }, 200);
        }
    }, [isOpen, articleToEdit]);

    const handleGenerateContent = async () => {
        if (!title.trim()) {
            setError('Please enter a title first to generate content.');
            return;
        }
        
        setError('');
        setIsGenerating(true);
        setContent('Generating content with AI...');

        const prompt = `You are a content writer for a crypto portfolio app called Nexus. Write a short, helpful blog post or help article about "${title}". Use markdown for formatting, including headers, bold text, and bullet points where appropriate.`;

        try {
            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt }, // Re-using a simple text-in, text-out function
            });

            if (functionError) throw functionError;

            setContent(data.reply);
        } catch (e) {
            console.error("Error generating content:", e);
            setContent('Error generating content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = useCallback(() => {
        if (!title.trim() || !content.trim()) {
            setError('Title and content cannot be empty.');
            return;
        }
        setError('');
        
        const articleData = {
            id: articleToEdit?.id,
            title,
            content,
            status,
            lastupdated: new Date().toISOString(),
        };

        onSave(articleData as any);
        onClose();
    }, [title, content, status, articleToEdit, onSave, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Article' : 'New Article'}>
            <div className="space-y-6">
                 <div>
                    <label htmlFor="article-title" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Title</label>
                    <input
                        type="text"
                        id="article-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter article title..."
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="article-content" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Content (Markdown supported)</label>
                        <Button variant="secondary" onClick={handleGenerateContent} disabled={isGenerating}>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'AI Generate'}
                        </Button>
                    </div>
                    <textarea
                        id="article-content"
                        rows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your article content here, or generate it with AI."
                        className="block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
                        disabled={isGenerating}
                    />
                </div>

                 <div>
                    <label htmlFor="article-status" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Status</label>
                    <select
                        id="article-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    >
                        <option>Draft</option>
                        <option>Published</option>
                    </select>
                </div>
                
                {error && <p className="text-sm text-error animate-fade-in">{error}</p>}
                
                <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isGenerating}>{isEditing ? 'Save Changes' : 'Create Article'}</Button>
                </div>
            </div>
        </Modal>
    );
};