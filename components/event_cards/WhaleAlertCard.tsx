import React from 'react';
import { Alert } from '../../types';
import { FishIcon } from '../icons/FishIcon';

interface WhaleAlertCardProps {
    alert: Alert;
    onViewWhale: () => void;
}

const transactionVerbs: { [key: string]: string } = {
  send: 'sent',
  receive: 'received',
  swap: 'swapped',
};

export const WhaleAlertCard: React.FC<WhaleAlertCardProps> = ({ alert, onViewWhale }) => {
    const { whaleName, transaction } = alert;
    const verb = transactionVerbs[transaction.type] || 'transacted';

    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400">
                <FishIcon className="w-5 h-5" />
            </div>
            <div className="flex-grow">
                 <p className="text-sm text-neutral-800 dark:text-neutral-200">
                    <button onClick={onViewWhale} className="font-bold hover:underline">{whaleName}</button> {verb}{' '}
                    <span className="font-semibold">{transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {transaction.tokenSymbol}</span>
                    {' '}worth <span className="font-semibold">${transaction.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </p>
            </div>
        </div>
    );
};