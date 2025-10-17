import { useState, useEffect, useCallback } from 'react';
import { WhaleSegment, WhaleWallet } from '../types';

// Pre-defined segments for initial state
const createPredefinedSegments = (allWhales: WhaleWallet[]): WhaleSegment[] => [
    {
        id: 'seg-1',
        name: 'Ethereum OGs',
        description: 'Early investors and builders on the Ethereum network.',
        addresses: allWhales
            .filter(w => ['Vitalik Buterin', 'Justin Sun'].includes(w.name))
            .map(w => ({ address: w.address, blockchain: w.blockchain })),
    },
    {
        id: 'seg-2',
        name: 'Arbitrum Power Users',
        description: 'Entities with significant activity and holdings on Arbitrum.',
        addresses: allWhales
            .filter(w => w.name === 'Wintermute Trading')
            .map(w => ({ address: w.address, blockchain: w.blockchain })),
    },
];

export const useWhaleSegments = (allWhales: WhaleWallet[], userId?: string) => {
    const [segments, setSegments] = useState<WhaleSegment[]>([]);

    useEffect(() => {
        const key = userId ? `nexus-whale-segments-${userId}` : null;
        const savedCustomSegments = key ? localStorage.getItem(key) : null;
        const customSegments = savedCustomSegments ? JSON.parse(savedCustomSegments) : [];
        const predefined = createPredefinedSegments(allWhales);
        setSegments([...predefined, ...customSegments]);
    }, [allWhales, userId]);

    const updateLocalStorage = (updatedCustomSegments: WhaleSegment[]) => {
        if (!userId) return;
        const key = `nexus-whale-segments-${userId}`;
        localStorage.setItem(key, JSON.stringify(updatedCustomSegments));
    };

    const addSegment = useCallback((segmentData: Omit<WhaleSegment, 'id'>) => {
        const newSegment: WhaleSegment = {
            ...segmentData,
            id: self.crypto.randomUUID(),
        };

        setSegments(prev => {
            const updatedSegments = [...prev, newSegment];
            // Filter out pre-defined segments before saving to local storage
            const customSegments = updatedSegments.filter(s => !s.id.startsWith('seg-'));
            updateLocalStorage(customSegments);
            return updatedSegments;
        });
    }, [userId]);

    return { segments, addSegment };
};
