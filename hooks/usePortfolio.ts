import { useState, useCallback, useEffect } from 'react';
import { Wallet, Token, NFT, PortfolioValue, Transaction, HistoricalDataPoint, DeFiPosition } from '../types';
import { supabase } from '../utils/supabase';
import { fetchPortfolioAssets } from '../utils/api';

// --- MAIN HOOK ---
export const usePortfolio = (enabled: boolean, userIdOverride?: string) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [defiPositions, setDeFiPositions] = useState<DeFiPosition[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue>({ total: 0, change24h: 0, change24hPercent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    
    try {
        let userId: string | undefined = userIdOverride;

        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }

        if (!userId) throw new Error("User not authenticated. Please log in.");

        const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (walletError) throw walletError;
        
        setWallets(walletData as Wallet[]);

        if (walletData.length === 0) {
            setTokens([]);
            setNfts([]);
            setTransactions([]);
            setDeFiPositions([]);
            setPortfolioValue({ total: 0, change24h: 0, change24hPercent: 0 });
            setHistoricalData([]);
        } else {
            const allAssets = await fetchPortfolioAssets(walletData);
            const { tokens: aggregatedTokens, nfts: allNfts, transactions: allTransactions, defiPositions: allDeFi } = allAssets;

            const tokensTotalValue = aggregatedTokens.reduce((acc, token) => acc + (token.value || 0), 0);
            const defiTotalValue = allDeFi.reduce((acc, pos) => acc + pos.valueUsd, 0);
            const totalValue = tokensTotalValue + defiTotalValue;
            
            const totalChange24h = aggregatedTokens.reduce((acc, token) => {
                const value = token.value || 0;
                const change = token.change24h || 0;
                const changeValue = value / (1 + change / 100) * (change / 100);
                return acc + changeValue;
            }, 0);
            
            const yesterdayValue = totalValue - totalChange24h;
            const totalChange24hPercent = yesterdayValue !== 0 ? (totalChange24h / yesterdayValue) * 100 : 0;
            
            setTokens(aggregatedTokens);
            setNfts(allNfts);
            setTransactions(allTransactions);
            setDeFiPositions(allDeFi);
            setPortfolioValue({ total: totalValue, change24h: totalChange24h, change24hPercent: totalChange24hPercent });
            
            // --- Refactored Historical Data Logic ---
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            const { data: history, error: historicalError } = await supabase
                .from('portfolio_history')
                .select('timestamp, value')
                .eq('user_id', userId)
                .gte('timestamp', ninetyDaysAgo)
                .order('timestamp', { ascending: true });

            if (historicalError) {
                console.error("Error fetching portfolio history:", historicalError);
                // Provide a single data point on error to ensure chart doesn't break
                setHistoricalData([{ timestamp: Date.now(), value: totalValue }]);
            } else {
                const finalHistory = history.map(d => ({
                    timestamp: new Date(d.timestamp).getTime(),
                    value: d.value
                }));
                
                const lastHistoricalValue = finalHistory.length > 0 ? finalHistory[finalHistory.length - 1].value : -1;
                
                // Only save a new point if it's the first one or if the value has changed meaningfully.
                if (finalHistory.length === 0 || Math.abs(totalValue - lastHistoricalValue) > 0.01) {
                    const { data: newHistoryPoint, error: insertError } = await supabase
                        .from('portfolio_history')
                        .insert({ value: totalValue, user_id: userId })
                        .select('timestamp, value') // Select the authoritative timestamp back
                        .single();

                    if (insertError) {
                        console.error("Error saving portfolio history:", insertError);
                        // Don't add a client-side point to prevent data drift.
                        // The current value is still reflected in the main portfolio display.
                    } else if (newHistoryPoint) {
                        // This is the only place we should add to the history array, using the DB's data.
                        finalHistory.push({
                            timestamp: new Date(newHistoryPoint.timestamp).getTime(),
                            value: newHistoryPoint.value
                        });
                    }
                }
                
                setHistoricalData(finalHistory);
            }
        }
        
        setLastUpdated(new Date());

    } catch (err: any) {
        console.error("Error fetching portfolio:", err);
        setError(err.message || "We couldn't load your portfolio. Please try again.");
    } finally {
        setLoading(false);
    }
  }, [enabled, userIdOverride]);

  useEffect(() => {
    if (enabled) {
      fetchPortfolioData();
    } else {
        // Clear data if not enabled (e.g., on logout)
        setWallets([]);
        setTokens([]);
        setNfts([]);
        setTransactions([]);
        setDeFiPositions([]);
        setPortfolioValue({ total: 0, change24h: 0, change24hPercent: 0 });
        setHistoricalData([]);
        setLoading(true);
    }
  }, [enabled, fetchPortfolioData]);

  const refreshPortfolio = useCallback(() => {
    if (enabled) {
      fetchPortfolioData();
    }
  }, [enabled, fetchPortfolioData]);

  const addWallet = useCallback(async (walletData: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => {
    try {
        let userId: string | undefined = userIdOverride;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) throw new Error('You must be logged in to add a wallet.');

        const { error } = await supabase.from('wallets').insert({
            ...walletData,
            user_id: userId
        });

        if (error) throw error;
        refreshPortfolio();
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Could not add wallet.');
    }
  }, [refreshPortfolio, userIdOverride]);

  const updateWallet = useCallback(async (walletId: string, updates: Partial<Pick<Wallet, 'nickname'>>) => {
    try {
        let userId: string | undefined = userIdOverride;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) throw new Error('You must be logged in to update a wallet.');
        
        const { error } = await supabase.from('wallets').update(updates).match({ id: walletId, user_id: userId });

        if (error) throw error;
        refreshPortfolio();
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Could not update wallet.');
    }
  }, [refreshPortfolio, userIdOverride]);

  const removeWallet = useCallback(async (walletId: string) => {
     try {
        let userId: string | undefined = userIdOverride;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) throw new Error('You must be logged in to remove a wallet.');

        const { error } = await supabase.from('wallets').delete().match({ id: walletId, user_id: userId });
        
        if (error) throw error;
        refreshPortfolio();
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Could not remove wallet.');
    }
  }, [refreshPortfolio, userIdOverride]);
  
  return { wallets, tokens, nfts, transactions, defiPositions, historicalData, portfolioValue, loading, error, lastUpdated, addWallet, updateWallet, removeWallet, refreshPortfolio };
};