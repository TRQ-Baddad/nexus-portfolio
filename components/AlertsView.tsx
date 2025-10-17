
import React from 'react';
import { User, Alert, WhaleWallet } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { formatRelativeTime } from '../utils/formatters';
import { UpgradeNotice } from './shared/UpgradeNotice';

interface AlertsViewProps {
    user: User | null;
    alerts: Alert[];
    onViewWhale: (whale: WhaleWallet) => void;
    onMarkAsRead: (alertId: string) => void;
    onUpgrade: () => void;
    whales: WhaleWallet[];
}

const transactionVerbs: { [key: string]: string } = {
  send: 'sent',
  receive: 'received',
  swap: 'swapped',
};

const AlertItem: React.FC<{ alert: Alert; onClick: () => void }> = ({ alert, onClick }) => {
  const { whaleName, transaction, timestamp, isRead } = alert;
  const verb = transactionVerbs[transaction.type] || 'transacted';
  
  return (
    <button onClick={onClick} className={`w-full text-left p-4 flex items-start space-x-4 transition-colors border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 ${!isRead ? 'bg-brand-blue/5 dark:bg-brand-blue/10' : ''} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>
      {!isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-brand-blue mt-1.5 flex-shrink-0" />
      )}
      <div className={`flex-grow ${isRead ? 'pl-7' : ''}`}>
        <div className="flex justify-between items-start">
            <p className="text-sm text-neutral-800 dark:text-neutral-200 pr-4">
            <span className="font-bold">{whaleName}</span> {verb}{' '}
            <span className="font-semibold">{transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {transaction.tokenSymbol}</span>
            {' '}worth <span className="font-semibold">${transaction.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-4">{formatRelativeTime(new Date(timestamp))}</p>
        </div>
      </div>
    </button>
  );
};

export const AlertsView: React.FC<AlertsViewProps> = ({ user, alerts, onViewWhale, onMarkAsRead, onUpgrade, whales }) => {
    
    if (user?.plan === 'Free') {
        return (
            <UpgradeNotice
                onUpgrade={onUpgrade}
                title="Get Real-Time Whale Alerts"
                description="Upgrade to Pro to receive instant notifications and a historical feed of every significant move made by top crypto whales."
                features={['Real-time whale alerts', 'Customizable thresholds', 'Push notifications (coming soon)', 'Priority support']}
            />
        );
    }

    const handleViewWhale = (alert: Alert) => {
        const whale = whales.find(w => w.id === alert.whaleId);
        if (whale) {
            onViewWhale(whale);
            if (!alert.isRead) {
                onMarkAsRead(alert.id);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <Card.Header>
                    <Card.Title>Whale Activity Alerts</Card.Title>
                    <Card.Description>A historical feed of significant transactions from your watchlist.</Card.Description>
                </Card.Header>
                <Card.Content className="p-0">
                     {alerts.length > 0 ? (
                        <ul>
                            {alerts.map(alert => (
                                <li key={alert.id}>
                                    <AlertItem alert={alert} onClick={() => handleViewWhale(alert)} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-16 text-center">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">No new alerts.</p>
                        </div>
                    )}
                </Card.Content>
            </Card>
        </div>
    );
};
