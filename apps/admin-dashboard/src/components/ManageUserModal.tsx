import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { User } from '../../../../types';
import { supabase } from '../../../../utils/supabase';
import { EyeIcon } from '../../../../components/icons/EyeIcon';
import { EyeOffIcon } from '../../../../components/icons/EyeOffIcon';
import { LockIcon } from '../../../../components/icons/LockIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';


export type EditableUser = Partial<User & { id: string; status: 'Active' | 'Suspended'; role: string; password?: string }>;

interface ManageUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: EditableUser) => void;
    userToEdit: EditableUser | null;
    onDelete: (userId: string) => void;
}

const ADMIN_ROLES = ['Administrator', 'Content Editor', 'Support Agent'];
const ALL_ROLES: User['role'][] = ['Customer', 'Administrator', 'Content Editor', 'Support Agent'];

export const ManageUserModal: React.FC<ManageUserModalProps> = ({ isOpen, onClose, onSave, userToEdit, onDelete }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [plan, setPlan] = useState<'Free' | 'Pro'>('Free');
    const [status, setStatus] = useState<'Active' | 'Suspended'>('Active');
    const [role, setRole] = useState<User['role']>('Customer');
    const [error, setError] = useState('');
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

    const isEditing = !!userToEdit;
    const isEditingSelf = userToEdit?.id === currentAdminId;

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setCurrentAdminId(user.id);
            }
        });
    }, []);

    useEffect(() => {
        if (isOpen && userToEdit) {
            setName(userToEdit.name || '');
            setEmail(userToEdit.email || '');
            setPlan(userToEdit.plan || 'Free');
            setStatus(userToEdit.status || 'Active');
            setRole(userToEdit.role || 'Customer');
            setPassword(''); // Always clear password field
        } else if (!isOpen) {
            // Reset form state after modal closes
            setTimeout(() => {
                setName('');
                setEmail('');
                setPlan('Free');
                setStatus('Active');
                setRole('Customer');
                setPassword('');
                setError('');
            }, 200); // Delay for closing animation
        }
    }, [isOpen, userToEdit]);

    const handleSave = useCallback(() => {
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }
        if (!isEditing && (!password || password.length < 6)) {
            setError('A password with at least 6 characters is required for new users.');
            return;
        }
        setError('');
        
        const userData: EditableUser = {
            id: userToEdit?.id,
            name,
            email,
            password: password || undefined,
            plan,
            status,
            role,
        };
        onSave(userData);
        onClose();
    }, [name, email, password, plan, status, role, userToEdit, onSave, onClose, isEditing]);
    
    const handleDelete = () => {
        if (userToEdit?.id) {
            onDelete(userToEdit.id);
        }
    };

    const handleCreateAdmin = () => {
        setName('');
        setEmail('');
        setPlan('Pro');
        setStatus('Active');
        setRole('Support Agent');
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit User' : 'Create New User'}>
            <div className="space-y-6">
                {!isEditing && (
                    <div className="flex items-center space-x-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md">
                        <Button variant={role === 'Customer' ? 'primary' : 'secondary'} onClick={() => setRole('Customer')} className="w-full">Create Customer</Button>
                        <Button variant={ADMIN_ROLES.includes(role) ? 'primary' : 'secondary'} onClick={handleCreateAdmin} className="w-full">Create Admin</Button>
                    </div>
                )}

                <div>
                    <label htmlFor="user-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Full Name</label>
                    <input
                        type="text"
                        id="user-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="user-email" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Email Address</label>
                    <input
                        type="email"
                        id="user-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>

                {!isEditing && (
                    <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Password</label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockIcon className="w-5 h-5 text-neutral-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="user-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Set initial password"
                                className="w-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus:border-brand-blue rounded-md py-2 pl-10 pr-10 text-neutral-900 dark:text-white focus:outline-none focus:ring-0 sm:text-sm transition-colors"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Role selection logic: only show for creating admins or editing any user */}
                {!isEditing && ADMIN_ROLES.includes(role) && (
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Admin Role</label>
                        <select id="user-role" value={role} onChange={e => setRole(e.target.value as User['role'])} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                            {ADMIN_ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                )}
                
                {isEditing && (
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Role</label>
                        <select id="user-role" value={role} onChange={e => setRole(e.target.value as User['role'])} disabled={isEditingSelf} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-neutral-800">
                            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {isEditingSelf && <p className="text-xs text-neutral-500 mt-1">You cannot change your own role.</p>}
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="user-plan" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Plan</label>
                        <select id="user-plan" value={plan} onChange={e => setPlan(e.target.value as 'Free' | 'Pro')} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                            <option>Free</option>
                            <option>Pro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="user-status" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Status</label>
                        <select id="user-status" value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Suspended')} disabled={isEditingSelf} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-neutral-800">
                            <option>Active</option>
                            <option>Suspended</option>
                        </select>
                        {isEditingSelf && <p className="text-xs text-neutral-500 mt-1">You cannot change your own status.</p>}
                    </div>
                </div>


                {error && <p className="text-sm text-error">{error}</p>}
                
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {isEditing && (
                            <Button 
                                variant="secondary" 
                                onClick={handleDelete} 
                                className="!bg-error/10 !text-error hover:!bg-error/20 focus:!ring-error/50"
                                disabled={isEditingSelf}
                                title={isEditingSelf ? "You cannot delete your own account." : "Delete User"}
                            >
                                <Trash2Icon className="w-4 h-4 mr-2" />
                                Delete User
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create User'}</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
