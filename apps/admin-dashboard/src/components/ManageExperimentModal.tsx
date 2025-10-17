import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { Experiment } from '../views/ExperimentsView';

type SavePayload = Omit<Experiment, 'id' | 'created_at' | 'conversionA' | 'conversionB' | 'confidence'> & { id?: string };

interface ManageExperimentModalProps { 
    isOpen: boolean; 
    onClose: () => void;
    onSave: (data: SavePayload) => void;
    experimentToEdit: Experiment | null;
}

interface Variant {
    id: string;
    value: string;
}

export const ManageExperimentModal: React.FC<ManageExperimentModalProps> = ({ isOpen, onClose, onSave, experimentToEdit }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [segment, setSegment] = useState('All New Users');
    const [variants, setVariants] = useState<Variant[]>([
        { id: 'v1', value: 'Control' },
        { id: 'v2', value: '' },
    ]);

    useEffect(() => {
        if (isOpen && experimentToEdit) {
            setName(experimentToEdit.name);
            setGoal(experimentToEdit.goal);
            setSegment(experimentToEdit.segment);
            setVariants(experimentToEdit.variants.map((v, i) => ({ id: `v${i+1}`, value: v })));
        } else if (!isOpen) {
            setTimeout(() => {
                setName('');
                setGoal('');
                setSegment('All New Users');
                setVariants([
                    { id: 'v1', value: 'Control' },
                    { id: 'v2', value: '' },
                ]);
            }, 200);
        }
    }, [isOpen, experimentToEdit]);
    
    const handleUpdateVariant = (id: string, value: string) => {
        setVariants(variants.map(v => v.id === id ? { ...v, value: value } : v));
    };

    const handleLaunch = useCallback(() => {
        if (!name.trim() || !goal.trim()) {
            alert('Experiment Name and Goal are required.');
            return;
        }
        onSave({
            id: experimentToEdit?.id,
            name,
            goal,
            segment,
            status: experimentToEdit?.status || 'Running',
            variants: variants.map(v => v.value),
        });
        onClose();
    }, [name, goal, segment, variants, onSave, onClose, experimentToEdit]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={experimentToEdit ? 'Edit Experiment' : 'Create New Experiment'}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="exp-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Experiment Name</label>
                    <input id="exp-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Upgrade Button Color Test" className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="exp-goal" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Primary Goal</label>
                    <input id="exp-goal" type="text" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g., Increase Pro Upgrades" className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="exp-segment" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Target Segment</label>
                    <select id="exp-segment" value={segment} onChange={e => setSegment(e.target.value)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm">
                        <option>All New Users</option>
                        <option>Free Users &gt; $10k</option>
                        <option>High Value Pro Users</option>
                    </select>
                </div>
                <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Variants</h4>
                    {variants.map((variant, index) => (
                        <div key={variant.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                            <label htmlFor={`variant-${variant.id}`} className="font-semibold">{`Variant ${String.fromCharCode(65 + index)}`}</label>
                             <div className="flex items-center space-x-2 col-span-2">
                                <input id={`variant-${variant.id}`} type="text" value={variant.value} onChange={e => handleUpdateVariant(variant.id, e.target.value)} placeholder="e.g., #2563EB or 'New Text'" className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm font-mono"/>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleLaunch}>{experimentToEdit ? 'Save Changes' : 'Launch Experiment'}</Button>
                </div>
            </div>
        </Modal>
    );
};
