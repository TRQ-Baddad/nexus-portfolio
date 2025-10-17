
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { ManageAutomationModal } from '../components/ManageAutomationModal';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { PlayIcon } from '../components/icons/PlayIcon';
import { PauseIcon } from '../components/icons/PauseIcon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { logAdminAction } from '../utils/adminLogger';
import { formatRelativeTime } from '../../../../utils/formatters';

export interface Automation {
    id: string;
    created_at: string;
    name: string;
    trigger: string;
    conditions: { field: string; operator: string; value: string }[];
    action: string;
    actionDetail: string;
    status: 'Active' | 'Paused';
    run_count: number;
    last_run_at: string | null;
}

const AutomationRow: React.FC<{ 
    automation: Automation; 
    onToggle: () => void; 
    onEdit: () => void; 
    onDelete: () => void;
    onRun: () => void;
    isRunning: boolean;
}> = ({ automation, onToggle, onEdit, onDelete, onRun, isRunning }) => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4">
            <p className="font-semibold text-neutral-900 dark:text-white">{automation.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{automation.trigger} &rarr; {automation.action}</p>
        </td>
        <td className="p-4 hidden md:table-cell">{(automation.run_count || 0).toLocaleString()}</td>
        <td className="p-4 hidden md:table-cell">{automation.last_run_at ? formatRelativeTime(new Date(automation.last_run_at)) : 'Never'}</td>
        <td className="p-4">
             <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${automation.status === 'Active' ? 'bg-brand-blue' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automation.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </td>
        <td className="p-4 text-right">
            <div className="flex items-center justify-end space-x-1">
                 <button onClick={onRun} disabled={isRunning} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10 disabled:opacity-50 disabled:cursor-not-allowed" title="Run Now">
                    {isRunning ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
                </button>
                <button onClick={onEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 text-neutral-500 hover:text-error rounded-full hover:bg-error/10"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        </td>
    </tr>
);

const SkeletonRow = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4"><Skeleton className="h-5 w-3/4" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-12" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-24" /></td>
        <td className="p-4"><Skeleton className="h-6 w-11 rounded-full" /></td>
        <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
    </tr>
);

export const AutomationsView: React.FC = () => {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
    const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null);

    const fetchAutomations = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('automations').select('*').order('created_at', { ascending: false });
        if (data) setAutomations(data);
        if (error) console.error("Error fetching automations:", error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchAutomations();
    }, [fetchAutomations]);

    const handleOpenModal = (automation: Automation | null) => {
        setSelectedAutomation(automation);
        setIsModalOpen(true);
    };

    const handleToggleStatus = useCallback(async (automation: Automation) => {
        const newStatus = automation.status === 'Active' ? 'Paused' : 'Active';
        const { error } = await supabase.from('automations').update({ status: newStatus }).eq('id', automation.id);
        if (error) console.error('Error toggling status:', error);
        else fetchAutomations();
    }, [fetchAutomations]);
    
    const handleSaveAutomation = useCallback(async (automationData: Omit<Automation, 'id' | 'created_at'> & { id?: string }) => {
        const { id, ...dataToUpsert } = automationData;
        const query = id 
            ? supabase.from('automations').update(dataToUpsert).eq('id', id)
            : supabase.from('automations').insert([dataToUpsert]);

        const { error } = await query;
        if (error) console.error("Error saving automation:", error);
        else fetchAutomations();
    }, [fetchAutomations]);
    
    const handleDeleteAutomation = useCallback(async (id: string) => {
        if (window.confirm("Are you sure you want to delete this automation?")) {
            const { error } = await supabase.from('automations').delete().eq('id', id);
            if (error) console.error("Error deleting automation:", error);
            else fetchAutomations();
        }
    }, [fetchAutomations]);
    
    const handleRunAutomation = async (automation: Automation) => {
        setRunningAutomationId(automation.id);

        // This RPC function should increment 'run_count' and update 'last_run_at'
        const { error: rpcError } = await supabase.rpc('increment_automation_run_count', {
            automation_id: automation.id
        });

        if (rpcError) {
            console.error("Error running automation:", rpcError);
            alert("Failed to run automation. Ensure the 'increment_automation_run_count' RPC function exists.");
        } else {
            await logAdminAction('manual_automation_run', null, { automationId: automation.id, automationName: automation.name });
            await fetchAutomations();
        }
        
        setRunningAutomationId(null);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Automations</h1>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Automation
                </Button>
            </div>

            <Card>
                 <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Total Runs</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Last Run</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({length: 3}).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    automations.map(auto => (
                                        <AutomationRow 
                                            key={auto.id} 
                                            automation={auto} 
                                            onToggle={() => handleToggleStatus(auto)} 
                                            onEdit={() => handleOpenModal(auto)} 
                                            onDelete={() => handleDeleteAutomation(auto.id)}
                                            onRun={() => handleRunAutomation(auto)}
                                            isRunning={runningAutomationId === auto.id}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Content>
            </Card>

            <ManageAutomationModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveAutomation} 
                automationToEdit={selectedAutomation}
            />
        </div>
    );
};
