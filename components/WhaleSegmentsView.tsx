import React from 'react';
import { Card } from './shared/Card';
import { WhaleSegment, WhaleWallet } from '../types';
import { BLOCKCHAIN_METADATA } from '../constants';
import { Button } from './shared/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { Skeleton } from './shared/Skeleton';
import { UsersIcon } from './icons/UsersIcon';

interface WhaleSegmentsViewProps {
    segments: WhaleSegment[];
    onCreateSegment: () => void;
    onViewSegment: (segment: WhaleSegment) => void;
    loading: boolean;
    allWhales: WhaleWallet[];
}

const SegmentCard: React.FC<{ segment: WhaleSegment, onView: () => void; allWhales: WhaleWallet[] }> = ({ segment, onView, allWhales }) => {
    return (
        <button onClick={onView} className="text-left w-full">
            <Card className="hover:border-brand-blue/50 transition-colors h-full">
                <Card.Header>
                    <div className="flex justify-between items-start">
                        <div>
                            <Card.Title>{segment.name}</Card.Title>
                            <Card.Description>{segment.description}</Card.Description>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-neutral-500 dark:text-neutral-400">
                            <UsersIcon className="w-4 h-4" />
                            <span>{segment.addresses.length}</span>
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="p-6 pt-0">
                    <div className="flex -space-x-3 overflow-hidden">
                        {segment.addresses.slice(0, 5).map((addrInfo, index) => {
                            const ChainIcon = BLOCKCHAIN_METADATA[addrInfo.blockchain]?.icon || (() => null);
                            return (
                                <div key={index} className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-neutral-800" title={`${addrInfo.address} on ${addrInfo.blockchain}`}>
                                    <ChainIcon className="w-full h-full" />
                                </div>
                            );
                        })}
                         {segment.addresses.length > 5 && (
                            <div className="relative inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-xs font-bold">
                                +{segment.addresses.length - 5}
                            </div>
                        )}
                    </div>
                </Card.Content>
            </Card>
        </button>
    )
}

const SkeletonCard = () => (
    <Card>
        <Card.Header>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </Card.Header>
        <Card.Content className="p-6 pt-0">
             <Skeleton className="h-8 w-24" />
        </Card.Content>
    </Card>
);

export const WhaleSegmentsView: React.FC<WhaleSegmentsViewProps> = ({ segments, onCreateSegment, onViewSegment, loading, allWhales }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <Button onClick={onCreateSegment}>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Create AI Segment
                </Button>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({length: 3}).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : segments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map(segment => (
                        <SegmentCard key={segment.id} segment={segment} onView={() => onViewSegment(segment)} allWhales={allWhales} />
                    ))}
                </div>
            ) : (
                <Card>
                    <Card.Content className="p-10 text-center flex flex-col items-center">
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
                            <UsersIcon className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white">No Segments Yet</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
                            Create your first segment to analyze the collective behavior of multiple wallets. Use our AI to discover groups based on their strategy.
                        </p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
};