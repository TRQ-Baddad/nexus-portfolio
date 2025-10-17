import { useState, useEffect, useCallback } from 'react';
import { Alert, Wallet, WhaleWallet } from '../types';
import { AlertSettingsData } from '../components/AlertSettings';
import { supabase } from '../utils/supabase';
import { fetchPortfolioAssets } from '../utils/api';

export const useAlerts = (isProUser: boolean, userId?: string) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [alertSettings, setAlertSettings] = useState<AlertSettingsData>(() => {
        try {
            if (!userId) return { minValue: 50000 };
            const key = `nexus-alert-settings-${userId}`;
            const savedSettings = localStorage.getItem(key);
            return savedSettings ? JSON.parse(savedSettings) : { minValue: 50000 };
        } catch (e) {
            return { minValue: 50000 };
        }
    });

    const getReadAlertIds = useCallback((): string[] => {
        try {
            if (!userId) return [];
            const key = `nexus-read-alerts-${userId}`;
            const readIds = localStorage.getItem(key);
            return readIds ? JSON.parse(readIds) : [];
        } catch (e) {
            return [];
        }
    }, [userId]);

    const setReadAlertIds = useCallback((ids: string[]) => {
        try {
            if (!userId) return;
            const key = `nexus-read-alerts-${userId}`;
            const uniqueIds = [...new Set(ids)];
            localStorage.setItem(key, JSON.stringify(uniqueIds));
        } catch(e) {
            console.error("Error saving read alerts to localStorage", e);
        }
    }, [userId]);

    useEffect(() => {
        if (!isProUser) {
            setAlerts([]);
            return;
        }

        const generateAndFetchAlerts = async () => {
            // 1. Get watched whales
            const { data: whales, error: whalesError } = await supabase.from('whales').select('*');
            if (whalesError || !whales || whales.length === 0) {
                return;
            }

            // 2. Fetch transactions for all whales. Cast WhaleWallet to Wallet for the API call.
            // This reuses the existing, efficient batch-fetching logic.
            const { transactions } = await fetchPortfolioAssets(whales as unknown as Wallet[]);

            // 3. Filter significant transactions based on user settings
            const significantTransactions = transactions.filter(tx => tx.valueUsd >= alertSettings.minValue);

            // 4. Create Alert objects
            const newAlerts: Alert[] = [];
            const readAlertIds = getReadAlertIds();

            for (const tx of significantTransactions) {
                // Associate transaction back to the whale that made it
                const relatedWhale = whales.find(w => w.address.toLowerCase() === tx.fromAddress.toLowerCase() || w.address.toLowerCase() === tx.toAddress.toLowerCase());

                if (relatedWhale) {
                    newAlerts.push({
                        id: tx.hash, // Use tx hash as a unique ID
                        whaleId: relatedWhale.id,
                        whaleName: relatedWhale.name,
                        transaction: tx,
                        timestamp: tx.date,
                        isRead: readAlertIds.includes(tx.hash)
                    });
                }
            }
            
            // 5. Sort by date and set state, ensuring no duplicates
            const uniqueAlerts = Array.from(new Map(newAlerts.map(alert => [alert.id, alert])).values());
            uniqueAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setAlerts(uniqueAlerts);
        };

        generateAndFetchAlerts();
    }, [isProUser, alertSettings.minValue, getReadAlertIds]);

    const markAsRead = useCallback((alertId: string) => {
        setAlerts(prevAlerts => 
            prevAlerts.map(a => a.id === alertId ? { ...a, isRead: true } : a)
        );
        const readIds = getReadAlertIds();
        if (!readIds.includes(alertId)) {
            setReadAlertIds([...readIds, alertId]);
        }
    }, [getReadAlertIds, setReadAlertIds]);

    const markAllAsRead = useCallback(() => {
        const allAlertIds = alerts.map(a => a.id);
        setAlerts(prevAlerts => prevAlerts.map(a => ({ ...a, isRead: true })));
        
        const readIds = getReadAlertIds();
        const updatedReadIds = [...new Set([...readIds, ...allAlertIds])];
        setReadAlertIds(updatedReadIds);
    }, [alerts, getReadAlertIds, setReadAlertIds]);

    const updateAlertSettings = useCallback((settings: AlertSettingsData) => {
        if (!userId) return;
        const key = `nexus-alert-settings-${userId}`;
        setAlertSettings(settings);
        localStorage.setItem(key, JSON.stringify(settings));
    }, [userId]);

    return { alerts, markAsRead, markAllAsRead, alertSettings, updateAlertSettings };
};
