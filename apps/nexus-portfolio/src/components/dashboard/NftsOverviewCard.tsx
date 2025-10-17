import React, { useMemo, useState, useEffect } from 'react';
import { NFT } from '../../../../../types';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { ArrowRightIcon } from '../../../../../components/icons/ArrowRightIcon';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { fetchTokenPrices } from '../../../../../utils/api';

interface NftsOverviewCardProps {
    nfts: NFT[];
    loading: boolean;
    onNavigate: () => void;
}

export const NftsOverviewCard: React.FC<NftsOverviewCardProps> = ({ nfts, loading, onNavigate }) => {
    const [totalFloorValue, setTotalFloorValue] = useState(0);
    const [floorValueLoading, setFloorValueLoading] = useState(true);

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
                    const price = nft.chain === 'solana' ? solPrice : ethPrice;
                    floorValue += (nft.floorPrice || 0) * price;
                });
                setTotalFloorValue(floorValue);
            } catch (error) {
                console.error("Failed to fetch NFT floor value prices for overview card:", error);
                setTotalFloorValue(0);
            } finally {
                setFloorValueLoading(false);
            }
        };

        calculateFloorValue();
    }, [nfts, loading]);

    const previewNfts = nfts.slice(0, 4);

    return (
        <Card className="flex flex-col h-full">
            <Card.Header>
                <Card.Title>NFTs Overview</Card.Title>
            </Card.Header>
            <Card.Content className="p-4 flex-grow">
                {loading ? (
                    <Skeleton className="h-full w-full" />
                ) : nfts.length > 0 ? (
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 aspect-square">
                        {previewNfts.map((nft, index) => (
                            <div key={nft.id} className="relative w-full h-full rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                                {index === 3 && nfts.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">+{nfts.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400 p-4 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <p>No NFTs found in your connected wallets.</p>
                    </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Count</p>
                        {loading ? <Skeleton className="h-6 w-1/2 mx-auto mt-1" /> : <p className="text-xl font-bold">{nfts.length}</p>}
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Est. Floor Value</p>
                        {(loading || floorValueLoading) ? <Skeleton className="h-6 w-3/4 mx-auto mt-1" /> : <p className="text-xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(totalFloorValue)}</p>}
                    </div>
                </div>
            </Card.Content>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50 mt-auto">
                <Button variant="secondary" onClick={onNavigate} className="w-full text-xs">
                    View Full Gallery
                    <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </Card>
    );
};