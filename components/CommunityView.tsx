import React from 'react';
import { CommunityTopic } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { ErrorDisplay } from './ErrorDisplay';
import { Skeleton } from './shared/Skeleton';
import { WordCloud } from './shared/WordCloud';

interface CommunityViewProps {
    topics: CommunityTopic[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}

const SentimentBadge: React.FC<{ sentiment: CommunityTopic['sentiment']}> = ({ sentiment }) => {
    const styles = {
        Positive: 'bg-success/20 text-success',
        Negative: 'bg-error/20 text-error',
        Neutral: 'bg-neutral-500/20 text-neutral-500',
    };
    const emoji = {
        Positive: '🟢',
        Negative: '🔴',
        Neutral: '⚪️',
    }
    return (
         <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1.5 ${styles[sentiment]}`}>
            <span>{emoji[sentiment]}</span>
            <span>{sentiment}</span>
        </span>
    );
};

const TopicCard: React.FC<{ topic: CommunityTopic }> = ({ topic }) => (
    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700/50 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-neutral-900 dark:text-white">{topic.topic}</h3>
            <SentimentBadge sentiment={topic.sentiment} />
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{topic.summary}</p>
    </div>
)

const SkeletonLoader: React.FC = () => (
    <div className="space-y-6">
        <Card>
            <Card.Header><Card.Title>Trending Topics</Card.Title></Card.Header>
            <Card.Content className="flex justify-center items-center p-6 min-h-[300px]">
                <Skeleton className="w-64 h-64 rounded-full" />
            </Card.Content>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700/50 space-y-3">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-5 w-1/4" />
                    </div>
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-5/6" />
                </div>
            ))}
        </div>
    </div>
);

export const CommunityView: React.FC<CommunityViewProps> = ({ topics, loading, error, onRefresh }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <Card>
                <Card.Header>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Card.Title>Community & Trends</Card.Title>
                            <Card.Description>The latest topics and sentiment from the crypto community, analyzed by AI.</Card.Description>
                        </div>
                         <Button variant="secondary" onClick={onRefresh} disabled={loading} className="mt-4 sm:mt-0">
                            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh Feed'}
                        </Button>
                    </div>
                </Card.Header>
            </Card>

            {error && <ErrorDisplay message={error} onRetry={onRefresh} />}
            
            {loading && !error && <SkeletonLoader />}

            {!loading && !error && topics.length > 0 && (
                <div className="space-y-6">
                    <Card>
                        <Card.Header><Card.Title>Trending Topics</Card.Title></Card.Header>
                        <Card.Content className="flex justify-center items-center p-6 min-h-[420px] overflow-hidden">
                            <WordCloud words={topics.map(t => ({ text: t.topic, value: t.volume }))} />
                        </Card.Content>
                    </Card>

                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Topic Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {topics.map(topic => <TopicCard key={topic.topic} topic={topic} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};