
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { SearchIcon } from '../../../../../components/icons/SearchIcon';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { Pagination } from '../../../../../components/shared/Pagination';

interface AuditLogEntry {
    id: string;
    created_at: string;
    admin_user_email: string;
    action: string;
    target_user_id: string | null;
    details: any | null;
}

const ITEMS_PER_PAGE = 15;

const LogRow: React.FC<{ log: AuditLogEntry }> = ({ log }) => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">{new Date(log.created_at).toLocaleString()}</td>
        <td className="p-4 font-semibold text-neutral-800 dark:text-neutral-200">{log.admin_user_email}</td>
        <td className="p-4">{log.action}</td>
        <td className="p-4 font-mono text-xs hidden md:table-cell">{log.target_user_id || 'N/A'}</td>
        <td className="p-4 text-xs text-neutral-600 dark:text-neutral-300 hidden md:table-cell">{log.details ? JSON.stringify(log.details) : 'No details provided.'}</td>
    </tr>
);

const SkeletonRow = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4"><Skeleton className="h-4 w-40" /></td>
        <td className="p-4"><Skeleton className="h-4 w-48" /></td>
        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-full" /></td>
    </tr>
)

export const AuditLogSettings: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('admin_audit_log')
            .select('*', { count: 'exact' });
        
        if (searchQuery) {
            query = query.or(`admin_user_email.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,details->>text.ilike.%${searchQuery}%`);
        }
        
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        
        if (error) {
            setError(error.message);
        } else {
            setLogs(data);
            setTotalCount(count || 0);
        }
        setLoading(false);
    }, [currentPage, searchQuery]);

    useEffect(() => {
        // Reset to page 1 when search query changes
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <Card>
            <Card.Header>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Card.Title>Admin Audit Log</Card.Title>
                        <Card.Description>A record of all significant actions taken in the admin dashboard.</Card.Description>
                    </div>
                     <div className="relative mt-4 sm:mt-0">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Filter logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full sm:w-64 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </div>
            </Card.Header>
            <Card.Content className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                <th className="p-4 font-medium">Timestamp</th>
                                <th className="p-4 font-medium">Admin User</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium hidden md:table-cell">Target User ID</th>
                                <th className="p-4 font-medium hidden md:table-cell">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : error ? (
                                <tr><td colSpan={5} className="p-4 text-center text-error">{error}</td></tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => <LogRow key={log.id} log={log} />)
                            ) : (
                                <tr><td colSpan={5} className="p-16 text-center text-neutral-500">No logs found matching your criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination totalItems={totalCount} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
            </Card.Content>
        </Card>
    );
};
