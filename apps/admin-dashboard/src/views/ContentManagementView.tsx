
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { ManageContentModal, Article } from '../components/ManageContentModal';
import { ArrowUpIcon } from '../../../../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../../../../components/icons/ArrowDownIcon';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { logAdminAction } from '../utils/adminLogger';

type SortableKey = 'title' | 'status' | 'lastupdated' | 'views';

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortableKey;
  currentSort: { key: SortableKey; direction: 'asc' | 'desc' };
  onSort: (key: SortableKey) => void;
  className?: string;
}> = ({ label, sortKey, currentSort, onSort, className = '' }) => {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : 'desc';

  return (
    <th className={`p-4 font-medium ${className}`}>
      <button className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        {isSorted ? (
          direction === 'asc' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
        )}
      </button>
    </th>
  );
};


const ArticleRow: React.FC<{ article: Article; onEdit: () => void; onDelete: () => void; }> = ({ article, onEdit, onDelete }) => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
        <td className="p-4">
            <p className="font-semibold text-neutral-900 dark:text-white">{article.title}</p>
        </td>
        <td className="p-4">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${article.status === 'Published' ? 'bg-success/20 text-success' : 'bg-neutral-500/20 text-neutral-500'}`}>
                {article.status}
            </span>
        </td>
        <td className="p-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400">
            {new Date(article.lastupdated).toLocaleDateString()}
        </td>
        <td className="p-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400">
            {(article.views || 0).toLocaleString()}
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
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-24" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
    </tr>
);

export const ContentManagementView: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' }>({ key: 'lastupdated', direction: 'desc' });

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('articles').select('*').order('lastupdated', { ascending: false });
        if (data) setArticles(data as Article[]);
        if (error) console.error("Error fetching articles:", error);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const sortedAndFilteredArticles = useMemo(() => {
        let tempArticles = [...articles];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempArticles = tempArticles.filter(a => a.title.toLowerCase().includes(lowercasedQuery));
        }
        
        tempArticles.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return tempArticles;
    }, [articles, searchQuery, sortConfig]);

    const handleSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleOpenModal = (article: Article | null) => {
        setSelectedArticle(article);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedArticle(null);
    };
    
    const handleSaveArticle = useCallback(async (articleData: Omit<Article, 'id' | 'views'> & { id?: string }) => {
        if (articleData.id) { // Editing
            const { error } = await supabase.from('articles').update({ ...articleData }).eq('id', articleData.id);
            if (!error) {
                await logAdminAction('update_article', null, { articleId: articleData.id, title: articleData.title });
            }
        } else { // Adding
            const { data, error } = await supabase.from('articles').insert([{ ...articleData, views: 0 }]).select();
             if (!error && data) {
                await logAdminAction('create_article', null, { articleId: data[0].id, title: articleData.title });
            }
        }
        fetchArticles();
    }, [fetchArticles]);

    const handleDeleteArticle = useCallback(async (articleId: string) => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            const { error } = await supabase.from('articles').delete().eq('id', articleId);
            if (!error) {
                await logAdminAction('delete_article', null, { articleId });
                fetchArticles();
            }
        }
    }, [fetchArticles]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Content Management</h1>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Article
                </Button>
            </div>
            
            <Card>
                <Card.Header>
                     <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full sm:w-72 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <SortableHeader label="Title" sortKey="title" currentSort={sortConfig} onSort={handleSort} className="text-left" />
                                    <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Last Updated" sortKey="lastupdated" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Views" sortKey="views" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    sortedAndFilteredArticles.map(article => (
                                        <ArticleRow 
                                            key={article.id} 
                                            article={article} 
                                            onEdit={() => handleOpenModal(article)}
                                            onDelete={() => handleDeleteArticle(article.id)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Content>
            </Card>

            <ManageContentModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveArticle}
                articleToEdit={selectedArticle}
            />
        </div>
    );
};
