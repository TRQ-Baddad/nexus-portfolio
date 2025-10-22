
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { Automation } from '../views/AutomationsView';

type SavePayload = Omit<Automation, 'id' | 'created_at'> & { id?: string };

interface ManageAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (automation: SavePayload) => void;
    automationToEdit: Automation | null;
}

type Condition = { id: string; field: string; operator: string; value: string };

export const ManageAutomationModal: React.FC<ManageAutomationModalProps> = ({ isOpen, onClose, onSave, automationToEdit }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('User Signs Up');
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [action, setAction] = useState('Send Notification');
    const [actionDetail, setActionDetail] = useState('');

    useEffect(() => {
        if (isOpen && automationToEdit) {
            setName(automationToEdit.name);
            setTrigger(automationToEdit.trigger);
            setConditions(automationToEdit.conditions.map(c => ({...c, id: self.crypto.randomUUID()})));
            setAction(automationToEdit.action);
            setActionDetail(automationToEdit.actionDetail);
            setStep(4);
        } else if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setName('');
                setTrigger('User Signs Up');
                setConditions([]);
                setAction('Send Notification');
                setActionDetail('');
            }, 200)
        }
    }, [isOpen, automationToEdit]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleAddCondition = () => {
        setConditions([...conditions, { id: self.crypto.randomUUID(), field: 'plan', operator: 'is', value: 'Free' }]);
    };

    const handleRemoveCondition = (id: string) => {
        setConditions(conditions.filter(c => c.id !== id));
    };

    const handleUpdateCondition = (id: string, field: keyof Omit<Condition, 'id'>, value: string) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
    };
    
    const handleSave = useCallback(() => {
        if (!name.trim()) {
            alert("Please provide a name for the automation.");
            setStep(4);
            return;
        }
        onSave({
            id: automationToEdit?.id,
            name,
            trigger,
            conditions: conditions.map(({id, ...rest}) => rest),
            action,
            actionDetail,
            status: automationToEdit?.status || 'Active',
            run_count: automationToEdit?.run_count ?? 0,
            last_run_at: automationToEdit?.last_run_at ?? null,
        });
        onClose();
    }, [name, trigger, conditions, action, actionDetail, automationToEdit, onSave, onClose]);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Step 1: Choose a Trigger</h3>
                        <p className="text-sm text-neutral-500">Select the event that starts this automation.</p>
                        <select value={trigger} onChange={e => setTrigger(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white sm:text-sm">
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">User Signs Up</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">User Adds a Wallet</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Portfolio Value Crosses Threshold</option>
                        </select>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Step 2: Add Conditions (Optional)</h3>
                        <p className="text-sm text-neutral-500">Filter the trigger to specific users. The action will only run if all conditions are met.</p>
                        <div className="space-y-2">
                           {conditions.map((cond) => (
                               <div key={cond.id} className="grid grid-cols-4 gap-2 items-center">
                                   <select value={cond.field} onChange={e => handleUpdateCondition(cond.id, 'field', e.target.value)} className="col-span-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white sm:text-sm">
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">plan</option>
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">totalValue</option>
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">walletCount</option>
                                   </select>
                                    <select value={cond.operator} onChange={e => handleUpdateCondition(cond.id, 'operator', e.target.value)} className="col-span-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white sm:text-sm">
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">is</option>
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">is not</option>
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">greater than</option>
                                       <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">less than</option>
                                   </select>
                                                   <input type="text" value={cond.value} onChange={e => handleUpdateCondition(cond.id, 'value', e.target.value)} placeholder="Value" className="col-span-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 sm:text-sm"/>
                                   <Button variant="secondary" onClick={() => handleRemoveCondition(cond.id)} className="col-span-1 !p-2 justify-center"><Trash2Icon className="w-4 h-4"/></Button>
                               </div>
                           ))}
                        </div>
                        <Button variant="secondary" onClick={handleAddCondition}><PlusIcon className="w-4 h-4 mr-2" />Add Condition</Button>
                    </div>
                );
            case 3:
                 return (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Step 3: Define the Action</h3>
                        <p className="text-sm text-neutral-500">What should happen when the trigger and conditions are met?</p>
                        <select value={action} onChange={e => setAction(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white sm:text-sm">
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Send Notification</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Add User to Segment</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Apply Tag</option>
                        </select>
                         <textarea value={actionDetail} onChange={e => setActionDetail(e.target.value)} placeholder="Action details (e.g., notification message, tag name)..." className="mt-2 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 sm:text-sm" rows={3}></textarea>
                    </div>
                );
            case 4:
                 return (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Step 4: Review & Save</h3>
                        <label htmlFor="auto-name" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Automation Name</label>
                        <input id="auto-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Onboard High Value Users" className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 sm:text-sm" />
                        <div className="text-sm p-4 bg-neutral-100 dark:bg-neutral-900 rounded-md space-y-2">
                           <p><strong>IF:</strong> <span className="font-semibold">{trigger}</span></p>
                           {conditions.length > 0 && 
                                <div><strong>AND:</strong>
                                    <ul className="list-disc list-inside">
                                        {conditions.map(c => <li key={c.id}>{c.field} {c.operator} {c.value}</li>)}
                                    </ul>
                                </div>
                           }
                           <p><strong>THEN:</strong> <span className="font-semibold">{action}</span>: "{actionDetail}"</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={automationToEdit ? "Edit Automation" : "Create New Automation"}>
            <div className="space-y-6">
                {renderStep()}
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {step > 1 && <Button variant="secondary" onClick={prevStep}>Back</Button>}
                    </div>
                    <div>
                        {step < 4 && <Button onClick={nextStep}>Next</Button>}
                        {step === 4 && <Button onClick={handleSave}>{automationToEdit ? 'Save Changes' : 'Save & Activate'}</Button>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
