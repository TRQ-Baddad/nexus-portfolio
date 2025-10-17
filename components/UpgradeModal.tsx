import React, { useState } from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { ZapIcon } from './icons/ZapIcon';
import { PRO_FEATURES } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

export const UpgradeModal: React.FC = () => {
    const { isUpgradeModalOpen, setIsUpgradeModalOpen, handleUpgradeUserPlan } = useAppContext();

    const [isProcessing, setIsProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const onClose = () => setIsUpgradeModalOpen(false);

    const handleUpgradeClick = () => {
        setIsProcessing(true);
        // Simulate payment processing then call the real upgrade handler
        setTimeout(() => {
            handleUpgradeUserPlan();
            setIsProcessing(false);
            // Reset fields for next time
            setCardNumber('');
            setExpiry('');
            setCvc('');
        }, 1500);
    };

    return (
        <Modal isOpen={isUpgradeModalOpen} onClose={onClose} title="Upgrade to Nexus Pro">
            <div className="space-y-6">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                            <ZapIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Unlock Your Full Potential</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-2">
                        Join Nexus Pro for just <span className="font-bold text-neutral-800 dark:text-neutral-100">$10/month</span> and get access to exclusive features.
                    </p>
                </div>

                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                    <ul className="space-y-2">
                        {PRO_FEATURES.map(feature => (
                            <li key={feature} className="flex items-center text-sm">
                                <CheckIcon className="w-4 h-4 mr-2 flex-shrink-0 text-success" />
                                <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Mock Payment Form */}
                <div className="space-y-4 pt-2">
                    <div className="relative">
                        <label htmlFor="card-number" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Card Number</label>
                        <CreditCardIcon className="absolute left-3 top-9 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            id="card-number"
                            placeholder="**** **** **** 1234"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-10 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="expiry" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Expiry Date</label>
                            <input
                                type="text"
                                id="expiry"
                                placeholder="MM / YY"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="cvc" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">CVC</label>
                            <input
                                type="text"
                                id="cvc"
                                placeholder="123"
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={isProcessing} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={handleUpgradeClick} disabled={isProcessing} className="w-full sm:w-auto">
                        {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};