import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { WhaleWallet, Blockchain, Wallet } from '../../../../types';
import { BLOCKCHAIN_METADATA } from '../../../../constants';
import { ManageWhaleModal } from '../components/ManageWhaleModal';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { EditIcon } from '../../../../components/icons/EditIcon';
import { Trash2Icon } from '../../../../components/icons/Trash2Icon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { supabase } from '../../../../utils/supabase';
import { logAdminAction } from '../utils/adminLogger';
import { fetchPortfolioAssets } from '../../../../utils/api';

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; }> = ({ enabled, onChange }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-blue' : 'bg-neutral-300 dark:bg-neutral-600'}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);


const WhaleRow: React.FC<{ whale: WhaleWallet; onEdit: () => void; onDelete: () => void; onToggleFeatured: () => void; onRefresh: () => void; isRefreshing: boolean; }> = ({ whale, onEdit, onDelete, onToggleFeatured, onRefresh, isRefreshing }) => {
    const change24h = whale.change24h ?? 0;
    const isPositive = change24h >= 0;
    const ChainIcon = BLOCKCHAIN_METADATA[whale.blockchain]?.icon || (() => null);

    return (
        <tr className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
            <td className="p-4">
                <div className="flex items-center space-x-3">
                    <ChainIcon className="w-8 h-8" />
                    <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{whale.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{`${whale.address.slice(0, 8)}...${whale.address.slice(-6)}`}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 hidden md:table-cell">
                <p className="font-medium text-neutral-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(whale.totalValue)}</p>
            </td>
            <td className={`p-4 font-medium hidden lg:table-cell ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </td>
            <td className="p-4 hidden xl:table-cell text-center">
                <ToggleSwitch enabled={whale.isFeatured || false} onChange={onToggleFeatured} />
            </td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                    <button onClick={onRefresh} disabled={isRefreshing} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-50" title="Refresh Data">
                        <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={onEdit} className="p-2 text-neutral-500 hover:text-brand-blue rounded-full hover:bg-brand-blue/10"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-2 text-neutral-500 hover:text-error rounded-full hover:bg-error/10"><Trash2Icon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-neutral-200 dark:border-neutral-800">
        <td className="p-4"><div className="flex items-center space-x-3"><Skeleton className="w-8 h-8 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></td>
        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-24" /></td>
        <td className="p-4 hidden lg:table-cell"><Skeleton className="h-5 w-16" /></td>
        <td className="p-4 hidden xl:table-cell"><Skeleton className="h-5 w-12 mx-auto" /></td>
        <td className="p-4 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
    </tr>
);


export const WhaleManagementView: React.FC = () => {
    const [whales, setWhales] = useState<WhaleWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWhale, setSelectedWhale] = useState<WhaleWallet | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshingWhaleId, setRefreshingWhaleId] = useState<string | null>(null);

    const fetchWhales = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('whales').select('*').order('created_at', { ascending: false });
        if (data) setWhales(data as WhaleWallet[]);
        if (error) console.error("Error fetching whales:", error);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchWhales();
    }, [fetchWhales]);

    const filteredWhales = useMemo(() => {
        if (!searchQuery) return whales;
        const lowercasedQuery = searchQuery.toLowerCase();
        return whales.filter(w =>
            w.name.toLowerCase().includes(lowercasedQuery) ||
            w.address.toLowerCase().includes(lowercasedQuery) ||
            w.description.toLowerCase().includes(lowercasedQuery)
        );
    }, [whales, searchQuery]);

    const handleOpenModal = (whale: WhaleWallet | null) => {
        setSelectedWhale(whale);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWhale(null);
    };

    const handleSaveWhale = async (whaleData: Omit<WhaleWallet, 'id' | 'totalValue' | 'change24h' | 'created_at' | 'isCustom'> & { id?: string }) => {
        if (whaleData.id) { // Editing
            const { error } = await supabase.from('whales').update(whaleData).eq('id', whaleData.id);
            if (error) {
                console.error("Error updating whale:", error);
                throw new Error(error.message);
            }
            await logAdminAction('update_whale', null, { whaleId: whaleData.id, name: whaleData.name });
        } else { // Adding
            // Create a temporary wallet object for the API call
            const tempWallet: Wallet = {
                id: 'temp-whale-id',
                address: whaleData.address,
                blockchain: whaleData.blockchain,
                user_id: 'admin-process',
                created_at: new Date().toISOString(),
            };
    
            const portfolioAssets = await fetchPortfolioAssets([tempWallet]);
            
            const tokensTotalValue = portfolioAssets.tokens.reduce((acc, token) => acc + (token.value || 0), 0);
            const defiTotalValue = portfolioAssets.defiPositions.reduce((acc, pos) => acc + pos.valueUsd, 0);
            const totalValue = tokensTotalValue + defiTotalValue;
            
            const totalChange24h = portfolioAssets.tokens.reduce((acc, token) => {
                const value = token.value || 0;
                const change = token.change24h || 0;
                const changeValue = value / (1 + change / 100) * (change / 100);
                return acc + changeValue;
            }, 0);
            
            const yesterdayValue = totalValue - totalChange24h;
            const totalChange24hPercent = yesterdayValue !== 0 ? (totalChange24h / yesterdayValue) * 100 : 0;
            
            // Insert into DB with real data
            const { data, error } = await supabase.from('whales').insert([{
                ...whaleData,
                totalValue: totalValue,
                change24h: totalChange24hPercent,
            }]).select();

            if (error) {
                console.error("Error creating whale:", error);
                throw new Error(error.message);
            }
    
            if (data) {
                await logAdminAction('create_whale', null, { whaleId: data[0].id, name: whaleData.name });
            }
        }
        fetchWhales();
    };

    const handleDeleteWhale = async (whaleId: string) => {
        if (window.confirm('Are you sure you want to delete this whale wallet?')) {
            const { error } = await supabase.from('whales').delete().eq('id', whaleId);
             if (!error) {
                await logAdminAction('delete_whale', null, { whaleId });
                fetchWhales();
            }
        }
    };
    
    const handleToggleFeatured = async (whale: WhaleWallet) => {
        const updatedStatus = !(whale.isFeatured ?? false);
        const { error } = await supabase.from('whales').update({ is_featured: updatedStatus }).eq('id', whale.id);
        if (error) {
            console.error("Error updating featured status:", error);
        } else {
            await logAdminAction('toggle_whale_featured', null, { whaleId: whale.id, name: whale.name, featured: updatedStatus });
            fetchWhales(); // Re-fetch to ensure consistency
        }
    };

    const handleRefreshWhale = async (whale: WhaleWallet) => {
        setRefreshingWhaleId(whale.id);
        await logAdminAction('refresh_whale_portfolio', null, { whaleId: whale.id, name: whale.name });

        const { error: rpcError } = await supabase.rpc('refresh_whale_portfolio', { whale_id: whale.id });

        if (rpcError) {
            console.error("Error refreshing whale via RPC:", rpcError);
            alert(`Failed to refresh whale portfolio: ${rpcError.message}. Ensure the 'refresh_whale_portfolio' RPC function is created.`);
        } else {
            const { data: updatedWhale, error: fetchError } = await supabase.from('whales').select('*').eq('id', whale.id).single();
            if (updatedWhale && !fetchError) {
                setWhales(prev => prev.map(w => w.id === whale.id ? (updatedWhale as WhaleWallet) : w));
            } else {
                await fetchWhales();
            }
        }

        setRefreshingWhaleId(null);
    };


    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Whale Management</h1>
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Whale
                </Button>
            </div>
            
            <Card>
                <Card.Header>
                     <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, address, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full sm:w-72 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Whale</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Portfolio Value</th>
                                    <th className="p-4 font-medium hidden lg:table-cell">24h Change</th>
                                    <th className="p-4 font-medium hidden xl:table-cell text-center">Featured</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({length: 5}).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    filteredWhales.map(whale => (
                                        <WhaleRow 
                                            key={whale.id} 
                                            whale={whale} 
                                            onEdit={() => handleOpenModal(whale)}
                                            onDelete={() => handleDeleteWhale(whale.id)}
                                            onToggleFeatured={() => handleToggleFeatured(whale)}
                                            onRefresh={() => handleRefreshWhale(whale)}
                                            isRefreshing={refreshingWhaleId === whale.id}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card.Content>
            </Card>

            <ManageWhaleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveWhale}
                whaleToEdit={selectedWhale}
            />
        </div>
    );
};