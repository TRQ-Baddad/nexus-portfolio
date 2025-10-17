
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ManageExperimentModal } from '../components/ManageExperimentModal';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { PlayIcon } from '../components/icons/PlayIcon';
import { PauseIcon } from '../components/icons/PauseIcon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { logAdminAction } from '../utils/adminLogger';

export interface Experiment {
    id: string;
    created_at: string;
    name: string;
    status: 'Running' | 'Paused' | 'Ended';
    goal: string;
    segment: string;
    variants: string[];
    conversionA: number;
    conversionB: number;
    confidence: number;
}

const ProgressBar: React.FC<{ value: number; isWinner: boolean }> = ({ value, isWinner }) => (
    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
        <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${isWinner ? 'bg-success' : 'bg-brand-blue'}`} 
            style={{ width: `${value * 100}%` }}
        ></div>
    </div>
);


const ExperimentRow: React.FC<{ 
    experiment: Experiment; 
    onToggle: () => void; 
    onEdit: () => void; 
    onDelete: () => void;
    onRefresh: () => void;
    onEnd: (winner: string) => void;
    isRefreshing: boolean;
}> = ({ experiment, onToggle, onEdit, onDelete, onRefresh, onEnd, isRefreshing }) => {
    const statusConfig = {
        Running: 'bg-blue-500/20 text-blue-500',
        Paused: 'bg-neutral-500/20 text-neutral-500',
        Ended: 'bg-success/20 text-success'
    };

    const confidence = experiment.confidence || 0;
    const isConclusive = confidence >= 0.95;
    const winner = experiment.status === 'Ended' || isConclusive ? (experiment.conversionB > experiment.conversionA ? 'B' : 'A') : null;

    const confidenceColor = () => {
        if (confidence < 0.7) return 'text-neutral-500';
        if (confidence < 0.95) return 'text-yellow-500';
        return 'text-success font-bold';
    };

    return (
        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
            <td className="p-4">
                <p className="font-semibold text-neutral-900 dark:text-white">{experiment.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Goal: {experiment.goal}</p>
            </td>
            <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${statusConfig[experiment.status]}`}>{experiment.status}</span></td>
            <td className="p-4 hidden md:table-cell">
                 <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                        <span className={`w-8 ${winner === 'A' ? 'font-bold' : ''}`}>A:</span>
                        <div className="w-24"><ProgressBar value={experiment.conversionA} isWinner={winner === 'A'} /></div>
                        <span className={`w-14 ${winner === 'A' ? 'font-bold' : ''}`}>{(experiment.conversionA * 100).toFixed(2)}%</span>
                        {winner === 'A' && <TrophyIcon className="w-4 h-4 text-success" />}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`w-8 ${winner === 'B' ? 'font-bold' : ''}`}>B:</span>
                        <div className="w-24"><ProgressBar value={experiment.conversionB} isWinner={winner === 'B'} /></div>
                        <span className={`w-14 ${winner === 'B' ? 'font-bold' : ''}`}>{(experiment.conversionB * 100).toFixed(2)}%</span>
                        {winner === 'B' && <TrophyIcon className="w-4 h-4 text-success" />}
                    </div>
                </div>
            </td>
            <td className={`p-4 hidden lg:table-cell font-mono text-sm ${confidenceColor()}`}>
                {(confidence * 100).toFixed(1)}%
            </td>
             <td className="p-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                    {experiment.status === 'Running' && (
                        <>
                            {isConclusive && winner ? (
                                <Button size="sm" onClick={() => onEnd(winner)} className="!bg-success/20 !text-success hover:!bg-success/30">
                                    <TrophyIcon className="w-4 h-4 mr-2" />
                                    Declare Winner
                                </Button>
                            ) : (
                                <button onClick={onRefresh} disabled={isRefreshing} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10" title="Refresh Results">
                                    <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                            <button onClick={onToggle} className="p-2 text-neutral-500 hover:text-yellow-500 rounded-full hover:bg-yellow-500/10" title="Pause Experiment">
                                <PauseIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    {experiment.status === 'Paused' && (
                         <button onClick={onToggle} className="p-2 text-neutral-500 hover:text-success rounded-full hover:bg-success/10" title="Resume Experiment">
                            <PlayIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-2 text-neutral-500 hover:text-error rounded-full hover:bg-error/10"><Trash2Icon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

const SkeletonRow = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-sm">
        <td className="p-4"><Skeleton className="h-5 w-3/4" /></td>
        <td className="p-4"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-8 w-full" /></td>
        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
    </tr>
);


export const ExperimentsView: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    
    const fetchExperiments = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('experiments').select('*').order('created_at', { ascending: false });
        if(data) setExperiments(data as Experiment[]);
        if(error) console.error("Error fetching experiments:", error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchExperiments();
    }, [fetchExperiments]);

    const handleOpenModal = (exp: Experiment | null) => {
        setSelectedExperiment(exp);
        setIsModalOpen(true);
    }

    const handleSaveExperiment = useCallback(async (experimentData: Omit<Experiment, 'id' | 'created_at' | 'conversionA' | 'conversionB' | 'confidence'> & { id?: string }) => {
        const { id, ...dataToUpsert } = experimentData;
        const query = id 
            ? supabase.from('experiments').update(dataToUpsert).eq('id', id)
            : supabase.from('experiments').insert([{ ...dataToUpsert, conversionA: 0, conversionB: 0, confidence: 0 }]);
        
        const { error } = await query;
        if(error) console.error("Error saving experiment:", error);
        else fetchExperiments();
    }, [fetchExperiments]);
    
    const handleDeleteExperiment = useCallback(async (id: string) => {
        if (window.confirm("Are you sure you want to delete this experiment?")) {
            const { error } = await supabase.from('experiments').delete().eq('id', id);
            if(error) console.error("Error deleting experiment:", error);
            else fetchExperiments();
        }
    }, [fetchExperiments]);

    const handleToggleStatus = useCallback(async (exp: Experiment) => {
        let newStatus: Experiment['status'] = 'Paused';
        if (exp.status === 'Paused') newStatus = 'Running';
        if (exp.status === 'Running') newStatus = 'Paused';
        if (exp.status === 'Ended') return;
        
        const { error } = await supabase.from('experiments').update({ status: newStatus }).eq('id', exp.id);
        if(error) console.error("Error updating status:", error);
        else fetchExperiments();
    }, [fetchExperiments]);

    const handleRefreshResults = useCallback(async (exp: Experiment) => {
        setRefreshingId(exp.id);
        
        // Call the backend function to perform the actual calculation and update.
        const { error } = await supabase.rpc('refresh_experiment_results', { 
            experiment_id: exp.id 
        });
    
        if (error) {
            console.error("Error refreshing experiment results:", error);
            alert(`Failed to refresh results: ${error.message}`);
        } else {
            await logAdminAction('refresh_experiment_results', null, { experimentId: exp.id, name: exp.name });
            // Re-fetch all experiments to get the updated data.
            await fetchExperiments();
        }
        
        setRefreshingId(null);
    }, [fetchExperiments]);

    const handleEndExperiment = useCallback(async (exp: Experiment, winner: string) => {
        if (window.confirm(`Are you sure you want to end this experiment and declare Variant ${winner} as the winner?`)) {
            const { error } = await supabase.from('experiments').update({ status: 'Ended' }).eq('id', exp.id);
            if (error) console.error("Error ending experiment:", error);
            else {
                 await logAdminAction('end_experiment', null, { experimentId: exp.id, name: exp.name, winner: `Variant ${winner}` });
                 fetchExperiments();
            }
        }
    }, [fetchExperiments]);


    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Experiments</h1>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Experiment
                </Button>
            </div>
            
            <Card>
                 <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Experiment</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Conversion</th>
                                    <th className="p-4 font-medium hidden lg:table-cell">Confidence</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    experiments.map(exp => (
                                        <ExperimentRow 
                                            key={exp.id} 
                                            experiment={exp} 
                                            onToggle={() => handleToggleStatus(exp)} 
                                            onEdit={() => handleOpenModal(exp)}
                                            onDelete={() => handleDeleteExperiment(exp.id)}
                                            onRefresh={() => handleRefreshResults(exp)}
                                            onEnd={(winner) => handleEndExperiment(exp, winner)}
                                            isRefreshing={refreshingId === exp.id}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Content>
            </Card>

            <ManageExperimentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveExperiment} 
                experimentToEdit={selectedExperiment}
            />
        </div>
    );
};
