
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { PlusIcon } from '../../../../../components/icons/PlusIcon';
import { ManageRoleModal, Role } from '../ManageRoleModal';
import { EditIcon } from '../../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../../components/icons/Trash2Icon';
import { UsersIcon } from '../../../../../components/icons/UsersIcon';
import { supabase } from '../../../../../utils/supabase';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { logAdminAction } from '../../utils/adminLogger';

type RoleWithUserCount = Role & { userCount: number };

const RoleCard: React.FC<{ role: RoleWithUserCount; onEdit: () => void; onDelete: () => void; }> = ({ role, onEdit, onDelete }) => (
    <Card>
        <Card.Content className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{role.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{role.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={onEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-2 text-neutral-500 hover:text-error rounded-full hover:bg-error/10"><Trash2Icon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-300 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <UsersIcon className="w-4 h-4 mr-2" /> {role.userCount} users with this role
            </div>
        </Card.Content>
    </Card>
);

const SkeletonCard = () => (
    <Card>
        <Card.Content className="p-6 space-y-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Skeleton className="h-5 w-1/4" />
            </div>
        </Card.Content>
    </Card>
);

export const RolesSettings: React.FC = () => {
    const [roles, setRoles] = useState<RoleWithUserCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
        
        if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            setIsLoading(false);
            return;
        }

        if (rolesData) {
            const rolesWithCounts = await Promise.all(
                rolesData.map(async (role: Role) => {
                    const { count, error: countError } = await supabase
                        .from('users')
                        .select('*', { count: 'exact', head: true })
                        .eq('role', role.name);
                    
                    if (countError) {
                        console.error(`Error fetching user count for role ${role.name}:`, countError);
                    }

                    return { ...role, userCount: count || 0 };
                })
            );
            setRoles(rolesWithCounts);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleOpenModal = (role: Role | null) => {
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const handleSaveRole = useCallback(async (roleData: Role) => {
        const { id, ...upsertData } = roleData;
        
        let action: 'update_role' | 'create_role' = 'create_role';
        let query;

        if (roleData.id) {
            action = 'update_role';
            query = supabase.from('roles').update(upsertData).eq('id', roleData.id);
        } else {
            query = supabase.from('roles').insert(upsertData);
        }

        const { error } = await query;
        if (error) {
            console.error("Error saving role:", error);
            alert("Failed to save role.");
        } else {
            await logAdminAction(action, null, { roleId: roleData.id, name: roleData.name });
            fetchRoles();
        }
        setIsModalOpen(false);
    }, [fetchRoles]);

    const handleDeleteRole = useCallback(async (roleId: string) => {
        if (window.confirm('Are you sure you want to delete this role? This might affect users assigned to it.')) {
            const { error } = await supabase.from('roles').delete().eq('id', roleId);
            if(error) {
                console.error("Error deleting role:", error);
            } else {
                await logAdminAction('delete_role', null, { roleId });
                fetchRoles();
            }
        }
    }, [fetchRoles]);
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Roles & Permissions</h2>
                    <p className="text-sm text-neutral-500">Define roles for admin users to control access to different parts of the dashboard.</p>
                </div>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Role
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    roles.map(role => (
                        <RoleCard key={role.id} role={role} onEdit={() => handleOpenModal(role)} onDelete={() => handleDeleteRole(role.id)} />
                    ))
                )}
            </div>

            <ManageRoleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveRole}
                roleToEdit={selectedRole}
            />
        </div>
    );
};
