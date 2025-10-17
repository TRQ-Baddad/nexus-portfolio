import React from 'react';
import { User } from '../types';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { CheckIcon } from './icons/CheckIcon';
import { ZapIcon } from './icons/ZapIcon';
import { PRO_FEATURES } from '../constants';

interface SubscriptionPlanProps {
    user: User;
    onUpgrade: () => void;
}

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ user, onUpgrade }) => {
    const isPro = user.plan === 'Pro';

    return (
        <Card>
            <Card.Header>
                <Card.Title>Subscription Plan</Card.Title>
                <Card.Description>You are currently on the <span className="font-semibold text-brand-blue">{user.plan} Plan</span>.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">{isPro ? 'Pro Plan Features' : 'Upgrade to Pro'}</h4>
                    <ul className="space-y-2">
                        {PRO_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center text-sm">
                                <CheckIcon className={`w-4 h-4 mr-2 flex-shrink-0 ${isPro ? 'text-success' : 'text-neutral-400 dark:text-neutral-500'}`} />
                                <span className={isPro ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}>
                                    {feature}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card.Content>
             <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700/50">
                {isPro ? (
                    <Button variant="secondary" className="w-full" disabled>
                        Manage Subscription
                    </Button>
                ) : (
                    <Button className="w-full" onClick={onUpgrade}>
                        <ZapIcon className="w-4 h-4 mr-2" />
                        Upgrade to Pro - $10/month
                    </Button>
                )}
            </div>
        </Card>
    );
};