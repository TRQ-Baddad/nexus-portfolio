import React from 'react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { User, MorningBrief } from '../types';
import { SunriseIcon } from './icons/SunriseIcon';
import { Skeleton } from './shared/Skeleton';
import { WalletIcon } from './icons/WalletIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { FishIcon } from './icons/FishIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface MorningBriefModalProps {
    isOpen: boolean;
    onClose: () => void;
    brief: MorningBrief | null;
    isLoading: boolean;
    user: User | null;
}

const BriefSection: React.FC<{ icon: React.FC<any>; title: string; children: React.ReactNode; isLoading: boolean }> = ({ icon: Icon, title, children, isLoading }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-lg text-neutral-500 dark:text-neutral-400">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">{title}</h4>
            {isLoading ? (
                <div className="space-y-2 mt-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{children}</p>
            )}
        </div>
    </div>
);


export const MorningBriefModal: React.FC<MorningBriefModalProps> = ({ isOpen, onClose, brief, isLoading, user }) => {

    const headline = isLoading ? <Skeleton className="h-8 w-3/4" /> : <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{brief?.headline || `Good morning, ${user?.name.split(' ')[0]}`}</h3>

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Your Morning Brief">
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                        <SunriseIcon className="w-7 h-7" />
                    </div>
                    {headline}
                </div>

                <div className="space-y-5 border-t border-neutral-200 dark:border-neutral-700 pt-5">
                    <BriefSection icon={WalletIcon} title="Portfolio Snapshot" isLoading={isLoading}>
                        {brief?.portfolioSummary}
                    </BriefSection>
                    <BriefSection icon={LightbulbIcon} title="Top Insight" isLoading={isLoading}>
                        {brief?.topInsight}
                    </BriefSection>
                    <BriefSection icon={FishIcon} title="Whale Watch" isLoading={isLoading}>
                        {brief?.whaleWatch}
                    </BriefSection>
                    <BriefSection icon={TrendingUpIcon} title="Market Pulse" isLoading={isLoading}>
                        {brief?.marketPulse}
                    </BriefSection>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button onClick={onClose}>Explore Dashboard</Button>
                </div>
            </div>
        </Modal>
    );
};