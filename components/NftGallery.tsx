import React, { useState, useMemo, useEffect } from 'react';
import { NFT, Blockchain } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { BLOCKCHAIN_METADATA } from '../constants';
import { NftDetailModal } from './NftDetailModal';
import { FilterIcon } from './icons/FilterIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { Button } from './shared/Button';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { fetchTokenPrices } from '../utils/api';

interface NftGalleryProps {
  nfts: NFT[];
  loading: boolean;
}

const NftCard: React.FC<{ nft: NFT; onClick: () => void }> = ({ nft, onClick }) => {
    const ChainIcon = BLOCKCHAIN_METADATA[nft.chain]?.icon || (() => null);
    const floorPriceSymbol = nft.chain === 'solana' ? 'SOL' : 'ETH';

    return (
        <button
            onClick={onClick}
            className="group relative block w-full text-left overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-brand-blue/50 hover:shadow-2xl hover:shadow-brand-blue/10 hover:-translate-y-1"
        >
            <img 
                src={nft.imageUrl} 
                alt={nft.name} 
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="transition-transform duration-300 group-hover:-translate-y-1">
                    <h3 className="font-semibold text-white text-base truncate" title={nft.name}>
                        {nft.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1.5">
                        <p className="text-sm text-neutral-300 truncate pr-2" title={nft.collection}>
                            {nft.collection}
                        </p>
                        {nft.floorPrice ? (
                            <div className="flex-shrink-0 flex items-center text-sm font-medium text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                                <ChainIcon className="w-4 h-4 mr-1.5" />
                                <span>{nft.floorPrice.toLocaleString()} {floorPriceSymbol}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </button>
    );
}

const SkeletonCard = () => (
    <Skeleton className="aspect-square w-full rounded-xl" />
);

const Stat: React.FC<{ label: string; value: string; loading: boolean }> = ({ label, value, loading }) => (
    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{label}</p>
        {loading ? <Skeleton className="h-6 w-1/2 mx-auto mt-1" /> : <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>}
    </div>
);


type SortOption = 'floor_desc' | 'floor_asc' | 'name_asc' | 'collection_asc';

export const NftGallery: React.FC<NftGalleryProps> = ({ nfts, loading }) => {
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('floor_desc');
  const { formatCurrency } = useUserPreferences();

  const [totalFloorValue, setTotalFloorValue] = useState(0);
  const [floorValueLoading, setFloorValueLoading] = useState(true);

  const { uniqueCollections, uniqueChains } = useMemo(() => {
    const collections = new Set<string>();
    const chains = new Set<Blockchain>();

    nfts.forEach(nft => {
      collections.add(nft.collection);
      chains.add(nft.chain);
    });

    return {
      uniqueCollections: Array.from(collections).sort(),
      uniqueChains: Array.from(chains).sort(),
    };
  }, [nfts]);
  
  useEffect(() => {
    if (loading || nfts.length === 0) {
        setTotalFloorValue(0);
        setFloorValueLoading(loading);
        return;
    }

    const calculateFloorValue = async () => {
        setFloorValueLoading(true);
        try {
            const prices = await fetchTokenPrices(['ethereum', 'solana']);
            const ethPrice = prices.ethereum?.usd || 0;
            const solPrice = prices.solana?.usd || 0;

            let floorValue = 0;
            nfts.forEach(nft => {
                const price = nft.chain === 'solana' ? solPrice : ethPrice; // Default to ETH for other EVMs
                floorValue += (nft.floorPrice || 0) * price;
            });
            setTotalFloorValue(floorValue);
        } catch (error) {
            console.error("Failed to fetch NFT floor value prices:", error);
            setTotalFloorValue(0); // Set to 0 on error
        } finally {
            setFloorValueLoading(false);
        }
    };

    calculateFloorValue();
  }, [nfts, loading]);

  const filteredAndSortedNfts = useMemo(() => {
    let tempNfts = [...nfts];

    // Filter
    if (collectionFilter !== 'all') {
      tempNfts = tempNfts.filter(nft => nft.collection === collectionFilter);
    }
    if (chainFilter !== 'all') {
      tempNfts = tempNfts.filter(nft => nft.chain === chainFilter);
    }

    // Sort
    tempNfts.sort((a, b) => {
      switch (sortBy) {
        case 'floor_desc':
          return (b.floorPrice || 0) - (a.floorPrice || 0);
        case 'floor_asc':
          return (a.floorPrice || 0) - (b.floorPrice || 0);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'collection_asc':
          return a.collection.localeCompare(b.collection);
        default:
          return 0;
      }
    });

    return tempNfts;
  }, [nfts, collectionFilter, chainFilter, sortBy]);

  const hasActiveFilters = collectionFilter !== 'all' || chainFilter !== 'all';
  const handleClearFilters = () => {
      setCollectionFilter('all');
      setChainFilter('all');
  };

  return (
    <>
        <Card>
            <Card.Header>
                <Card.Title>NFT Gallery</Card.Title>
                <Card.Description>Your digital collectibles across all chains</Card.Description>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Stat label="Total Items" value={loading ? '-' : nfts.length.toLocaleString()} loading={loading} />
                    <Stat label="Unique Collections" value={loading ? '-' : uniqueCollections.length.toLocaleString()} loading={loading} />
                    <Stat label="Est. Floor Value" value={loading ? '-' : formatCurrency(totalFloorValue, { notation: 'compact' })} loading={floorValueLoading || loading} />
                </div>

                <div className="mt-4 border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end">
                    <div>
                        <label htmlFor="collection-filter" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Collection</label>
                        <select id="collection-filter" value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="all">All Collections</option>
                            {uniqueCollections.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="chain-filter" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Chain</label>
                        <select id="chain-filter" value={chainFilter} onChange={e => setChainFilter(e.target.value)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="all">All Chains</option>
                            {uniqueChains.map(c => <option key={c} value={c}>{BLOCKCHAIN_METADATA[c].name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="sort-by" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Sort By</label>
                        <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="floor_desc">Floor Price: High to Low</option>
                            <option value="floor_asc">Floor Price: Low to High</option>
                            <option value="name_asc">Name: A-Z</option>
                            <option value="collection_asc">Collection: A-Z</option>
                        </select>
                    </div>
                     <div>
                        <Button variant="secondary" onClick={handleClearFilters} disabled={!hasActiveFilters} className="w-full">
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Content>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredAndSortedNfts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
                        {filteredAndSortedNfts.map(nft => <NftCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 text-neutral-500 dark:text-neutral-400 animate-fade-in">
                        <FilterIcon className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No NFTs Found</h3>
                        <p className="mt-1">{hasActiveFilters ? "Try adjusting your filters." : "No NFTs were found in your connected wallets."}</p>
                    </div>
                )}
            </Card.Content>
        </Card>
        <NftDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} />
    </>
  );
};