import React from 'react';
import { Card } from '../../../../../components/shared/Card';
import { FirstLookAnalysis } from '../../../../../hooks/useFirstLook';
import { ActiveView } from '../../../../../types';
import { Skeleton } from '../../../../../components/shared/Skeleton';
import { SparklesIcon } from '../../../../../components/icons/SparklesIcon';
import { Button } from '../../../../../components/shared/Button';
import { XIcon } from '../../../../../components/icons/XIcon';
import { ArrowRightIcon } from '../../../../../components/icons/ArrowRightIcon';

interface FirstLookCardProps {
    analysis: FirstLookAnalysis | null;
    isLoading: boolean;
    onNavigate: (view: ActiveView) => void;
    onDismiss: () => void;
}

export const FirstLookCard: React.FC<FirstLookCardProps> = ({ analysis, isLoading, onNavigate, onDismiss }) => {
    const handleNavigate = () => {
        if (analysis?.suggestionAction) {
            onNavigate(analysis.suggestionAction);
        }
    };
    
    return (
        <Card className="bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 dark:from-brand-blue/20 dark:to-brand-purple/20 relative animate-fade-in">
            <button onClick={onDismiss} className="absolute top-3 right-3 p-1 text-neutral-500 dark:text-neutral-400 hover:bg-black/10 rounded-full">
                <XIcon className="w-4 h-4" />
            </button>
            <Card.Content className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
                    <div className="flex-shrink-0 flex justify-center mb-4 sm:mb-0">
                         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        ) : analysis ? (
                             <div className="space-y-2">
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{analysis.greeting}</h3>
                                <p className="text-neutral-600 dark:text-neutral-300">{analysis.observation}</p>
                            </div>
                        ) : null}
                    </div>
                     <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                        <Button onClick={handleNavigate} disabled={isLoading || !analysis} className="w-full sm:w-auto">
                            <span>{isLoading ? '...' : (analysis?.suggestionText || 'Explore')}</span>
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
};
