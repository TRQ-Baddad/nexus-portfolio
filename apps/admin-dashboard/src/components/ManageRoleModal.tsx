import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, string[]>;
}

interface ManageRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Role) => void;
    roleToEdit: Role | null;
}

const ALL_PERMISSIONS: Record<string, { key: string, label: string }[]> = {
    "User Management": [
        { key: 'view', label: 'View users' },
        { key: 'create', label: 'Create users' },
        { key: 'edit', label: 'Edit user details' },
        { key: 'suspend', label: 'Suspend/Unsuspend users' },
        { key: 'delete', label: 'Delete users' },
        { key: 'impersonate', label: 'Impersonate users' },
    ],
    "Whale Management": [
        { key: 'view', label: 'View whales' },
        { key: 'edit', label: 'Create/Edit whales' },
        { key: 'delete', label: 'Delete whales' },
    ],
    "Content": [
        { key: 'view', label: 'View content' },
        { key: 'edit', label: 'Create/Edit content' },
        { key: 'publish', label: 'Publish content' },
        { key: 'delete', label: 'Delete content' },
    ],
    "Announcements": [
        { key: 'view', label: 'View announcements' },
        { key: 'edit', label: 'Create/Edit announcements' },
    ],
    "Support": [
        { key: 'view', label: 'View support tickets' },
        { key: 'reply', label: 'Reply to tickets' },
    ],
    "Automations": [
        { key: 'view', label: 'View automations' },
        { key: 'edit', label: 'Create/Edit automations' },
    ],
    "Experiments": [
        { key: 'view', label: 'View experiments' },
        { key: 'edit', label: 'Create/Edit experiments' },
    ],
    "Analytics": [ { key: 'view', label: 'View analytics' } ],
    "Reports": [ { key: 'view', label: 'View reports' } ],
    "System Health": [ { key: 'view', label: 'View system health' } ],
    "Transactions": [ { key: 'view', label: 'View transaction monitor' } ],
    "Settings": [
        { key: 'view', label: 'View settings' },
        { key: 'edit', label: 'Edit settings' },
    ],
};

const PermissionGroup: React.FC<{ groupName: string; permissions: { key: string, label: string }[]; checked: string[]; onChange: (key: string, isChecked: boolean) => void }> = ({ groupName, permissions, checked, onChange }) => (
    <div>
        <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">{groupName}</h4>
        <div className="mt-2 space-y-2">
            {permissions.map(perm => (
                <label key={perm.key} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={checked.includes(perm.key)}
                        onChange={e => onChange(perm.key, e.target.checked)}
                        className="rounded border-neutral-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{perm.label}</span>
                </label>
            ))}
        </div>
    </div>
);


export const ManageRoleModal: React.FC<ManageRoleModalProps> = ({ isOpen, onClose, onSave, roleToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (isOpen && roleToEdit) {
            setName(roleToEdit.name);
            setDescription(roleToEdit.description);
            setPermissions(roleToEdit.permissions);
        } else if (!isOpen) {
            setTimeout(() => {
                setName('');
                setDescription('');
                setPermissions({});
            }, 200);
        }
    }, [isOpen, roleToEdit]);
    
    const handlePermissionChange = (group: string, key: string, isChecked: boolean) => {
        setPermissions(prev => {
            const groupPerms = prev[group] ? [...prev[group]] : [];
            if (isChecked) {
                if (!groupPerms.includes(key)) groupPerms.push(key);
            } else {
                const index = groupPerms.indexOf(key);
                if (index > -1) groupPerms.splice(index, 1);
            }
            return { ...prev, [group]: groupPerms };
        });
    };
    
    const handleSave = () => {
        onSave({
            id: roleToEdit?.id || self.crypto.randomUUID(),
            name,
            description,
            permissions
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={roleToEdit ? 'Edit Role' : 'Create New Role'}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="role-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Role Name</label>
                    <input id="role-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Support Agent" className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="role-desc" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Description</label>
                    <input id="role-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description of the role's purpose." className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 sm:text-sm"/>
                </div>
                <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">Permissions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(ALL_PERMISSIONS).map(([groupName, perms]) => (
                            <PermissionGroup
                                key={groupName}
                                groupName={groupName}
                                permissions={perms}
                                checked={permissions[groupName] || []}
                                onChange={(key, isChecked) => handlePermissionChange(groupName, key, isChecked)}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>{roleToEdit ? 'Save Changes' : 'Create Role'}</Button>
                </div>
            </div>
        </Modal>
    );
};