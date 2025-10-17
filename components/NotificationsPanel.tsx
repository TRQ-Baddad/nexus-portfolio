import React, { useRef, useEffect } from 'react';
import { Alert, User, WhaleWallet } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { Button } from './shared/Button';
import { ZapIcon } from './icons/ZapIcon';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

interface AlertItemProps {
    alert: Alert;
    onClick: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onClick }) => {
  const { whaleName, transaction, timestamp, isRead } = alert;
  const verb = transaction.type === 'send' ? 'sent' : transaction.type === 'receive' ? 'received' : 'swapped';
  const { formatCurrency } = useUserPreferences();
  
  return (
    <button onClick={onClick} className={`w-full text-left p-3 flex items-start space-x-3 transition-colors ${!isRead ? 'bg-brand-blue/5 dark:bg-brand-blue/10' : ''} hover:bg-neutral-100 dark:hover:bg-neutral-800`}>
      {!isRead && (
        <div className="w-2 h-2 rounded-full bg-brand-blue mt-1.5 flex-shrink-0" />
      )}
      <div className={`flex-grow ${isRead ? 'pl-5' : ''}`}>
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          <span className="font-bold">{whaleName}</span> {verb}{' '}
          <span className="font-semibold">{transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {transaction.tokenSymbol}</span>
          {' '}worth <span className="font-semibold">{formatCurrency(transaction.valueUsd, { maximumFractionDigits: 0 })}</span>
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatRelativeTime(new Date(timestamp))}</p>
      </div>
    </button>
  );
};

const UpgradeNotice: React.FC = () => {
    const { setIsUpgradeModalOpen } = useAppContext();
    return (
        <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                    <ZapIcon className="w-6 h-6" />
                </div>
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Get Real-Time Whale Alerts</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 mb-4">
                Upgrade to Pro to receive instant notifications when top wallets make significant moves.
            </p>
            <Button className="w-full" onClick={() => setIsUpgradeModalOpen(true)}>
                <ZapIcon className="w-4 h-4 mr-2" />
                Upgrade to Pro
            </Button>
        </div>
    );
};


export const NotificationsPanel: React.FC = () => {
  const { 
    isNotificationsOpen,
    setIsNotificationsOpen,
    alerts,
    markAsRead,
    markAllAsRead,
    handleViewWhale,
    displayedUser,
    smartMoneyWhales,
  } = useAppContext();

  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = alerts.filter(a => !a.isRead).length;

  const onClose = () => setIsNotificationsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if(!target.closest('button[aria-label="Toggle notifications"]')) {
           onClose();
        }
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen, onClose]);

  const onWhaleClick = (alert: Alert) => {
    const whale = smartMoneyWhales.find(w => w.id === alert.whaleId);
    if (whale) {
      handleViewWhale(whale);
      if (!alert.isRead) {
        markAsRead(alert.id);
      }
    }
  };

  const isPro = displayedUser?.plan === 'Pro';

  if (!isNotificationsOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-16 right-4 sm:right-6 lg:right-8 w-full max-w-sm bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-fade-in"
      style={{ animationDuration: '150ms' }}
    >
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Notifications</h3>
        {isPro && unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-xs font-semibold text-brand-blue hover:opacity-80">
            Mark all as read
          </button>
        )}
      </div>
      
      {isPro ? (
        <div className="max-h-[60vh] overflow-y-auto">
          {alerts.length > 0 ? (
            <ul>
              {alerts.map(alert => (
                <li key={alert.id} className="border-b border-neutral-100 dark:border-neutral-700/50 last:border-b-0">
                  <AlertItem alert={alert} onClick={() => onWhaleClick(alert)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No new notifications.</p>
            </div>
          )}
        </div>
      ) : (
        <UpgradeNotice />
      )}
    </div>
  );
};