import { useState, useEffect, useCallback } from 'react';
import { WhaleWallet, Blockchain, Wallet } from '../types';
import { supabase } from '../utils/supabase';
import { fetchPortfolioAssets } from '../utils/api';

export const useSmartMoneyWatchlist = () => {
    const [whales, setWhales] = useState<WhaleWallet[]>([]);

    const fetchWhales = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('whales').select('*');
            if (error) throw error;
            if (data) {
                setWhales(data as WhaleWallet[]);
            }
        } catch (error) {
             console.error("Error fetching whales:", error);
        }
    }, []);

    useEffect(() => {
        fetchWhales();
    }, [fetchWhales]);


    const addCustomWhale = useCallback(async (whaleData: { address: string; blockchain: Blockchain; name: string }) => {
        const tempId = `temp-${self.crypto.randomUUID()}`;
        const tempWhale: WhaleWallet = {
            id: tempId,
            ...whaleData,
            description: 'A custom wallet added to your watchlist.',
            totalValue: 0,
            change24h: 0,
            isCustom: true,
            isLoading: true,
        };

        // Optimistically add a loading version of the whale to the UI
        setWhales(prev => [tempWhale, ...prev]);

        try {
            const tempWallet: Wallet = {
                id: 'temp-new-whale',
                address: whaleData.address,
                blockchain: whaleData.blockchain,
                user_id: 'custom-whale-creation',
                created_at: new Date().toISOString(),
            };
            
            const { tokens, defiPositions } = await fetchPortfolioAssets([tempWallet]);

            const tokensTotalValue = tokens.reduce((acc, token) => acc + (token.value || 0), 0);
            const defiTotalValue = defiPositions.reduce((acc, pos) => acc + pos.valueUsd, 0);
            const totalValue = tokensTotalValue + defiTotalValue;
            
            const totalChange24h = tokens.reduce((acc, token) => {
                const value = token.value || 0;
                const change = token.change24h || 0;
                const changeValue = value / (1 + change / 100) * (change / 100);
                return acc + changeValue;
            }, 0);
            
            const yesterdayValue = totalValue - totalChange24h;
            const totalChange24hPercent = yesterdayValue !== 0 ? (totalChange24h / yesterdayValue) * 100 : 0;

            const { data: newWhale, error } = await supabase.from('whales').insert([{
                ...whaleData,
                description: 'A custom wallet added to your watchlist.',
                totalValue: totalValue,
                change24h: totalChange24hPercent,
                isCustom: true,
            }]).select().single();

            if (error) throw error;
            
            // Replace the temporary whale with the real one
            setWhales(prev => prev.map(w => w.id === tempId ? (newWhale as WhaleWallet) : w));

        } catch (error) {
            console.error("Error adding custom whale:", error);
            // On error, remove the temporary whale
            setWhales(prev => prev.filter(w => w.id !== tempId));
        }
    }, []);

    const removeCustomWhale = useCallback(async (whaleId: string) => {
        const { error } = await supabase.from('whales').delete().eq('id', whaleId);
        if (!error) {
            setWhales(prev => prev.filter(w => w.id !== whaleId));
        }
    }, []);

    return { whales, addCustomWhale, removeCustomWhale };
};