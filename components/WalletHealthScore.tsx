import React from 'react';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';
import { InfoIcon } from './icons/InfoIcon';

interface WalletHealthScoreProps {
    score: number | null;
    summary: string | null;
    loading: boolean;
    size?: 'default' | 'large';
}

const ScoreDonut: React.FC<{ score: number, size: number }> = ({ score, size: svgSize }) => {
    const radius = (svgSize / 2) - 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = () => {
        if (score < 40) return 'text-error'; // red
        if (score < 70) return 'text-warning'; // yellow
        return 'text-success'; // green
    };

    return (
        <div className="relative" style={{ width: svgSize, height: svgSize }}>
            <svg className="w-full h-full" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                <circle
                    className="text-neutral-200 dark:text-neutral-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                />
                <circle
                    className={`${getColor()} transition-all duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-bold ${svgSize > 150 ? 'text-4xl' : 'text-3xl'} text-neutral-900 dark:text-white`}>
                    {score}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Score</span>
            </div>
        </div>
    );
};

const SkeletonLoader: React.FC<{ size: 'default' | 'large'}> = ({size}) => {
    const svgSize = size === 'large' ? 180 : 140;
    return (
        <div className="flex flex-col items-center p-4 space-y-3">
            <div style={{ width: svgSize, height: svgSize }}>
                <Skeleton className="w-full h-full rounded-full" />
            </div>
             <Skeleton className="h-4 w-3/4" />
        </div>
    )
}

export const WalletHealthScore: React.FC<WalletHealthScoreProps> = ({ score, summary, loading, size = 'default' }) => {
    const svgSize = size === 'large' ? 180 : 140;
    return (
        <Card>
            <Card.Header>
                <div className="flex justify-between items-center">
                    <div>
                        <Card.Title>AI Health Score</Card.Title>
                        <Card.Description>Your portfolio's risk & health.</Card.Description>
                    </div>
                    <div className="relative group">
                         <InfoIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                         <div className="absolute bottom-full right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mb-2 w-64 bg-neutral-800 dark:bg-neutral-900 text-white text-xs font-medium py-1.5 px-3 rounded-md z-10 text-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            This score (0-100) reflects your portfolio's diversification, risk, and recent performance.
                        </div>
                    </div>
                </div>
            </Card.Header>
            <Card.Content>
                {loading ? <SkeletonLoader size={size} /> : (
                    score !== null && summary ? (
                        <div className="animate-fade-in flex flex-col items-center text-center space-y-3">
                            <ScoreDonut score={score} size={svgSize} />
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 px-4">
                                "{summary}"
                            </p>
                        </div>
                    ) : (
                         <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
                            <p>Connect wallets with assets to generate a score.</p>
                        </div>
                    )
                )}
            </Card.Content>
        </Card>
    );
};