import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { User, Wallet, Token } from '../../../../types';
import { BLOCKCHAIN_METADATA } from '../../../../constants';
import { Button } from '../../../../components/shared/Button';
import { MailIcon } from './icons/MailIcon';
import { UserXIcon } from './icons/UserXIcon';
import { usePortfolio } from '../../../../hooks/usePortfolio';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { EyeIcon } from '../../../../components/icons/EyeIcon';
import { ActivityIcon } from '../../../../components/icons/ActivityIcon';
import { supabase } from '../../../../utils/supabase';
import { UserCheckIcon } from './icons/UserCheckIcon';

type ManagedUser = User & { 
    status: 'Active' | 'Suspended'; 
    last_sign_in_at: string;
};

interface AuditLogEntry {
    id: string;
    created_at: string;
    admin_user_email: string;
    action: string;
    details: string;
}

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: ManagedUser | null;
    onSuspend: (userId: string, userName: string) => void;
    onActivate: (userId: string, userName: string) => void;
    onNotify: (userId: string) => void;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="py-2 grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</dt>
        <dd className="text-sm text-neutral-900 dark:text-white col-span-2">{children}</dd>
    </div>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const roleColors: Record<string, string> = {
        'Administrator': 'bg-red-500/20 text-red-500',
        'Content Editor': 'bg-blue-500/20 text-blue-500',
        'Support Agent': 'bg-green-500/20 text-green-500',
    };
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleColors[role] || 'bg-neutral-500/20 text-neutral-500'}`}>{role}</span>
    );
};

const UserPortfolioSnapshot: React.FC<{ tokens: Token[], loading: boolean }> = ({ tokens, loading }) => {
    const topTokens = tokens.slice(0, 5);
    if (loading) {
        return <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-12 w-full" /></div>;
    }
    if (tokens.length === 0) {
        return <p className="text-sm text-neutral-500">User has no tokens to display.</p>;
    }
    return (
        <div>
            <h4 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Top Holdings</h4>
            <div className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-700 p-2">
                {topTokens.map(token => (
                    <div key={token.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <div className="flex items-center space-x-2">
                            <img src={token.logoUrl} alt={token.name} className="w-6 h-6 rounded-full" />
                            <div>
                                <p className="font-semibold">{token.symbol}</p>
                                <p className="text-xs text-neutral-500">{token.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(token.value)}</p>
                            <p className="text-xs text-neutral-500">{token.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const UserActivityLog: React.FC<{ userId: string }> = ({ userId }) => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!userId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_logs')
                .select('*')
                .eq('target_user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setLogs(data);
            if (error) console.error("Error fetching audit logs:", error);
            setLoading(false);
        };
        fetchLogs();
    }, [userId]);

    return (
        <div>
            <h4 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Admin Activity Log</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
                {loading && <Skeleton className="h-20 w-full" />}
                {!loading && logs.length === 0 && <p className="p-4 text-sm text-center text-neutral-500">No admin activity recorded for this user.</p>}
                {!loading && logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 text-sm p-2">
                        <ActivityIcon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0"/>
                        <div>
                            <p><span className="font-semibold">{log.action}</span> by <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{log.admin_user_email}</span></p>
                            <p className="text-xs text-neutral-500">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserDetailContent: React.FC<{ user: ManagedUser; onSuspend: (userId: string, userName: string) => void; onActivate: (userId: string, userName: string) => void; onNotify: (userId: string) => void; }> = ({ user, onSuspend, onActivate, onNotify }) => {
    const { wallets, tokens, portfolioValue, loading } = usePortfolio(true, user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full" />
                <div>
                    <h3 className="text-xl font-bold">{user.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                         <RoleBadge role={user.role} />
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.plan === 'Pro' ? 'bg-purple-500/20 text-purple-500' : 'bg-neutral-500/20 text-neutral-500'}`}>{user.plan}</span>
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{user.status}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700">
                <dl className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    <DetailRow label="Total Value">
                        {loading ? <Skeleton className="h-5 w-24" /> : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(portfolioValue.total)}
                    </DetailRow>
                    <DetailRow label="Wallets">
                        {loading ? <Skeleton className="h-5 w-8" /> : wallets.length}
                    </DetailRow>
                    <DetailRow label="Last Login">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</DetailRow>
                </dl>
            </div>

            <UserPortfolioSnapshot tokens={tokens} loading={loading} />
            
            <div>
                <h4 className="font-semibold mb-2">Connected Wallets</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loading ? (
                        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                    ) : wallets.length > 0 ? wallets.map(wallet => {
                         const metadata = BLOCKCHAIN_METADATA[wallet.blockchain];
                         const Icon = metadata.icon;
                         return (
                             <div key={wallet.id} className="flex items-center space-x-3 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-md">
                                 <Icon className="w-6 h-6" />
                                 <div>
                                     <p className="text-sm font-semibold">{wallet.nickname || metadata.name}</p>
                                     <p className="text-xs font-mono text-neutral-500">{wallet.address}</p>
                                 </div>
                             </div>
                         )
                    }) : <p className="text-sm text-neutral-500">No wallets connected.</p>}
                </div>
            </div>

            <UserActivityLog userId={user.id} />

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button variant="secondary" onClick={() => onNotify(user.id)}>
                    <MailIcon className="w-4 h-4 mr-2" />
                    Send Notification
                </Button>
                 {user.status === 'Active' ? (
                    <Button variant="secondary" className="!text-error !bg-error/10 hover:!bg-error/20" onClick={() => onSuspend(user.id, user.name)}>
                        <UserXIcon className="w-4 h-4 mr-2"/>Suspend User
                    </Button>
                ) : (
                    <Button variant="secondary" className="!text-success !bg-success/10 hover:!bg-success/20" onClick={() => onActivate(user.id, user.name)}>
                        <UserCheckIcon className="w-4 h-4 mr-2"/>Activate User
                    </Button>
                )}
            </div>
        </div>
    );
}


export const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user, onSuspend, onActivate, onNotify }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="2xl">
            {user ? <UserDetailContent user={user} onSuspend={onSuspend} onActivate={onActivate} onNotify={onNotify} /> : null}
        </Modal>
    );
};
