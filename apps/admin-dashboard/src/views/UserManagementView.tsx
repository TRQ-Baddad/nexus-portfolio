
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { User, Wallet } from '../../../../types';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { FilterDropdown } from '../components/FilterDropdown';
import { BulkActionsToolbar, BulkAction } from '../components/BulkActionsToolbar';
import { SendNotificationModal } from '../components/SendNotificationModal';
import { ManageUserModal, EditableUser } from '../components/ManageUserModal';
import { UserDetailModal } from '../components/UserDetailModal';
import { EyeIcon } from '../../../../components/icons/EyeIcon';
import { Pagination } from '../../../../components/shared/Pagination';
import { MaskIcon } from '../../../../components/icons/MaskIcon';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { logAdminAction } from '../utils/adminLogger';
import { usePermissions } from '../App';

export type ManagedUser = User & { 
    wallets: { count: number }; // Use Supabase count
};

const USERS_PER_PAGE = 10;
const ADMIN_ROLES = ['Administrator', 'Content Editor', 'Support Agent'];

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const roleColors: Record<string, string> = {
        'Administrator': 'bg-red-500/20 text-red-500',
        'Content Editor': 'bg-blue-500/20 text-blue-500',
        'Support Agent': 'bg-green-500/20 text-green-500',
        'Customer': 'bg-neutral-500/20 text-neutral-500 dark:text-neutral-400',
    };
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleColors[role] || 'bg-neutral-500/20 text-neutral-500'}`}>{role}</span>
    );
};

const UserRow: React.FC<{ user: ManagedUser; isSelected: boolean; onSelect: () => void; onImpersonate: () => void; onEdit: () => void; onView: () => void; canEdit: boolean; canImpersonate: boolean; }> = ({ user, isSelected, onSelect, onImpersonate, onEdit, onView, canEdit, canImpersonate }) => {
    return (
        <tr className={`border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors text-sm ${isSelected ? 'bg-brand-blue/10' : ''}`}>
            <td className="p-4 w-12 text-center">
                <input type="checkbox" checked={isSelected} onChange={onSelect} className="rounded border-neutral-300 text-brand-blue focus:ring-brand-blue" />
            </td>
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    </div>
                </div>
            </td>
             <td className="p-4 hidden md:table-cell">
                <RoleBadge role={user.role} />
            </td>
            <td className="p-4 hidden md:table-cell">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.plan === 'Pro' ? 'bg-purple-500/20 text-purple-500' : 'bg-neutral-500/20 text-neutral-500'}`}>{user.plan}</span>
            </td>
            <td className="p-4 hidden lg:table-cell">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{user.status}</span>
            </td>
            <td className="p-4 hidden lg:table-cell">{user.wallets.count}</td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                    <button onClick={onView} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10" title="View Details"><EyeIcon className="w-4 h-4" /></button>
                    <button onClick={onImpersonate} disabled={!canImpersonate} className="p-2 text-neutral-500 hover:text-yellow-500 rounded-full hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Impersonate User"><MaskIcon className="w-4 h-4" /></button>
                    <button onClick={onEdit} disabled={!canEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Edit User"><EditIcon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4"><Skeleton className="h-5 w-5 rounded" /></td>
        <td className="p-4">
            <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
        </td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-20" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-12" /></td>
        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-8" /></td>
        <td className="p-4 text-right"><Skeleton className="h-5 w-24 ml-auto" /></td>
    </tr>
);


export const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [planFilters, setPlanFilters] = useState<string[]>([]);
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [roleFilters, setRoleFilters] = useState<string[]>([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isManageUserModalOpen, setIsManageUserModalOpen] = useState(false);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<EditableUser | ManagedUser | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { hasPermission } = usePermissions();

    const canCreate = hasPermission('User Management', 'create');
    const canEdit = hasPermission('User Management', 'edit');
    const canDelete = hasPermission('User Management', 'delete');
    const canImpersonate = hasPermission('User Management', 'impersonate');
    
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const from = (currentPage - 1) * USERS_PER_PAGE;
        const to = from + USERS_PER_PAGE - 1;

        let query = supabase
            .from('users')
            .select('*, wallets(count)', { count: 'exact' });
        
        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        if (planFilters.length > 0) {
            query = query.in('plan', planFilters);
        }
        if (roleFilters.length > 0) {
            query = query.in('role', roleFilters);
        }
        if (statusFilters.length > 0) {
            query = query.in('status', statusFilters);
        }
        
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        
        if (error) {
            setError(error.message);
            console.error(error);
        } else {
            setUsers(data as any[] as ManagedUser[]);
            setTotalCount(count || 0);
        }
        setLoading(false);
    }, [currentPage, searchQuery, planFilters, roleFilters, statusFilters]);

    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [searchQuery, planFilters, roleFilters, statusFilters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSelectUser = (userId: string) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(users.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };
    
    const escapeCsvCell = (cell: any) => {
        const cellStr = String(cell == null ? '' : cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    };

    const handleBulkAction = async (action: BulkAction) => {
        if (selectedUserIds.length === 0) return;

        let updateData: Partial<User & { status: string }> = {};
        let confirmationMessage = '';

        switch(action) {
            case 'suspend':
            case 'activate':
                if (!hasPermission('User Management', 'suspend')) {
                    alert('You do not have permission to suspend or activate users.');
                    return;
                }
                updateData = { status: action === 'suspend' ? 'Suspended' : 'Active' };
                confirmationMessage = `Are you sure you want to ${action} ${selectedUserIds.length} user(s)?`;
                break;
            case 'makePro':
            case 'makeFree':
                 if (!canEdit) {
                    alert('You do not have permission to change user plans.');
                    return;
                }
                updateData = { plan: action === 'makePro' ? 'Pro' : 'Free' };
                confirmationMessage = `Are you sure you want to change the plan for ${selectedUserIds.length} user(s)?`;
                break;
            case 'notify':
                setIsNotificationModalOpen(true);
                return;
            case 'export':
                const { data: usersToExport, error: exportError } = await supabase
                    .from('users')
                    .select('id, name, email, plan, role, status, created_at, last_sign_in_at')
                    .in('id', selectedUserIds);

                if (exportError) {
                    setError(exportError.message);
                    return;
                }
                if (!usersToExport) return;

                const headers = ['ID', 'Name', 'Email', 'Plan', 'Role', 'Status', 'CreatedAt', 'LastSignInAt'];
                const csvRows = [headers.join(',')];

                for (const user of usersToExport) {
                    const row = [
                        user.id,
                        user.name,
                        user.email,
                        user.plan,
                        user.role,
                        user.status,
                        user.created_at,
                        user.last_sign_in_at,
                    ].map(escapeCsvCell).join(',');
                    csvRows.push(row);
                }

                const csvString = csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `nexus-users-export-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                await logAdminAction('bulk_export', null, { userIds: selectedUserIds, count: selectedUserIds.length });
                setSelectedUserIds([]);
                return;
            case 'delete':
                if (!canDelete) {
                    alert("You don't have permission to delete users.");
                    return;
                }
                if (window.confirm(`Are you sure you want to permanently delete ${selectedUserIds.length} user(s)? This action is irreversible.`)) {
                    const { error: deleteError } = await supabase.rpc('admin_delete_users', {
                        user_ids: selectedUserIds
                    });
                    if (deleteError) {
                        setError(`Failed to delete users: ${deleteError.message}. Make sure the 'admin_delete_users' RPC function exists and accepts a 'user_ids' array.`);
                    } else {
                        await logAdminAction('bulk_delete_users', null, { userIds: selectedUserIds, count: selectedUserIds.length });
                        setSelectedUserIds([]);
                        fetchUsers();
                    }
                }
                return;
            default:
                return;
        }

        if (window.confirm(confirmationMessage)) {
            const { error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .in('id', selectedUserIds);
            
            if (updateError) {
                setError(updateError.message);
            } else {
                await logAdminAction(`bulk_${action}`, null, { userIds: selectedUserIds, count: selectedUserIds.length });
                setSelectedUserIds([]);
                fetchUsers(); // Refresh data
            }
        }
    };

    const handleOpenManageModal = (user: EditableUser | null) => {
        setSelectedUser(user);
        setIsManageUserModalOpen(true);
    };
    
    const handleOpenDetailModal = (user: ManagedUser) => {
        setSelectedUser(user);
        setIsUserDetailModalOpen(true);
    };

    const handleSaveUser = async (userData: EditableUser & { password?: string }) => {
        if (userData.id) { // Update existing user
            const updates = {
                name: userData.name,
                email: userData.email,
                plan: userData.plan,
                role: userData.role,
                status: userData.status,
            };
            const { error } = await supabase.rpc('admin_update_user', {
                user_id: userData.id,
                updates: updates,
            });

            if (error) {
                setError(`Failed to update user: ${error.message}. Ensure the 'admin_update_user' RPC function is created in Supabase with security definer rights.`);
            } else {
                await logAdminAction('update_user', userData.id, { changes: updates });
            }
        } else { // Create new user
            if (!userData.password) {
                alert("Password is required to create a new user.");
                return;
            }
             const { data, error: signUpError } = await supabase.auth.signUp({
                email: userData.email!,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name,
                        role: userData.role,
                        plan: userData.plan,
                        status: userData.status,
                        avatar_url: `https://i.pravatar.cc/150?u=${userData.email}`
                    }
                }
             });
            
             if (signUpError) {
                setError(signUpError.message);
             } else {
                await logAdminAction('create_user', data.user?.id, { email: userData.email });
                alert("User created successfully. A confirmation email has been sent to the user.");
             }
        }
        fetchUsers(); // Refresh data
    };

    const handleDeleteUser = async (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        const userEmail = userToDelete?.email;
        if (window.confirm(`Are you sure you want to permanently delete the user ${userEmail}? This action is irreversible.`)) {
            const { error: deleteError } = await supabase.rpc('admin_delete_users', {
                user_ids: [userId]
            });
            if (deleteError) {
                setError(`Failed to delete user: ${deleteError.message}`);
            } else {
                await logAdminAction('delete_user', userId, { email: userEmail });
                setIsManageUserModalOpen(false);
                setSelectedUser(null);
                fetchUsers();
            }
        }
    };


    const handleImpersonate = (user: User) => {
        if (window.confirm(`Are you sure you want to impersonate ${user.name}? This will open their view in a new tab.`)) {
            localStorage.setItem('nexus-impersonated-user', JSON.stringify(user));
            window.open('/', '_blank'); 
        }
    };

    const handleSuspendUser = async (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to suspend ${userName}?`)) {
            const { error } = await supabase.from('users').update({ status: 'Suspended' }).eq('id', userId);
            if (error) {
                setError(error.message);
            } else {
                await logAdminAction('suspend_user', userId);
                fetchUsers();
                setIsUserDetailModalOpen(false);
            }
        }
    };

    const handleActivateUser = async (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to activate ${userName}?`)) {
            const { error } = await supabase.from('users').update({ status: 'Active' }).eq('id', userId);
            if (error) {
                setError(error.message);
            } else {
                await logAdminAction('activate_user', userId);
                fetchUsers();
                setIsUserDetailModalOpen(false);
            }
        }
    };

    const handleSendUserNotification = (userId: string) => {
        setSelectedUserIds([userId]);
        setIsNotificationModalOpen(true);
        setIsUserDetailModalOpen(false);
    };
    
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">User Management</h1>
                <Button onClick={() => handleOpenManageModal(null)} disabled={!canCreate}><PlusIcon className="w-4 h-4 mr-2"/>New User</Button>
            </div>
            
            <Card className="relative">
                <BulkActionsToolbar selectedCount={selectedUserIds.length} onAction={handleBulkAction} onClear={() => setSelectedUserIds([])} />
                <Card.Header className={selectedUserIds.length > 0 ? "pt-20" : ""}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"/>
                            <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3"/>
                        </div>
                        <FilterDropdown label="Role" options={['Customer', ...ADMIN_ROLES]} selected={roleFilters} onChange={setRoleFilters} />
                        <FilterDropdown label="Plan" options={['Free', 'Pro']} selected={planFilters} onChange={setPlanFilters} />
                        <FilterDropdown label="Status" options={['Active', 'Suspended']} selected={statusFilters} onChange={setStatusFilters} />
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length > 0 && selectedUserIds.length === users.length} className="rounded border-neutral-300 text-brand-blue focus:ring-brand-blue" /></th>
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Role</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Plan</th>
                                    <th className="p-4 font-medium hidden lg:table-cell">Status</th>
                                    <th className="p-4 font-medium hidden lg:table-cell">Wallets</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    users.map(user => (
                                        <UserRow key={user.id} user={user} isSelected={selectedUserIds.includes(user.id)} onSelect={() => handleSelectUser(user.id)} onImpersonate={() => handleImpersonate(user)} onEdit={() => handleOpenManageModal(user)} onView={() => handleOpenDetailModal(user)} canEdit={canEdit} canImpersonate={canImpersonate} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                     {error && <p className="p-4 text-sm text-error text-center">{error}</p>}
                    <Pagination totalItems={totalCount} itemsPerPage={USERS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
                </Card.Content>
            </Card>

            <SendNotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} recipientIds={selectedUserIds} />
            <ManageUserModal isOpen={isManageUserModalOpen} onClose={() => setIsManageUserModalOpen(false)} onSave={handleSaveUser} userToEdit={selectedUser as EditableUser | null} onDelete={handleDeleteUser} />
            <UserDetailModal 
                isOpen={isUserDetailModalOpen} 
                onClose={() => setIsUserDetailModalOpen(false)} 
                user={selectedUser as ManagedUser | null} 
                onSuspend={handleSuspendUser}
                onActivate={handleActivateUser}
                onNotify={handleSendUserNotification}
            />
        </div>
    );
};
