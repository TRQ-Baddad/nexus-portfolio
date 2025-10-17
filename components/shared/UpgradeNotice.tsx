import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ZapIcon } from '../icons/ZapIcon';
import { PRO_FEATURES } from '../../constants';
import { CheckIcon } from '../icons/CheckIcon';

interface UpgradeNoticeProps {
    onUpgrade: () => void;
    title: string;
    description: string;
    features?: string[];
}

export const UpgradeNotice: React.FC<UpgradeNoticeProps> = ({ onUpgrade, title, description, features = PRO_FEATURES }) => {
    return (
        <Card>
            <Card.Content className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg">
                        <ZapIcon className="w-8 h-8" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h3>
                <p className="text-neutral-600 dark:text-neutral-300 mt-2 mb-4 max-w-md mx-auto">
                    {description}
                </p>
                <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-left mb-6 max-w-sm mx-auto">
                    <ul className="space-y-2">
                        {features.map(feature => (
                            <li key={feature} className="flex items-center text-sm">
                                <CheckIcon className="w-4 h-4 mr-2 flex-shrink-0 text-success" />
                                <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <Button onClick={onUpgrade} className="w-full sm:w-auto">
                    <ZapIcon className="w-4 h-4 mr-2" />
                    Upgrade to Pro - $10/month
                </Button>
            </Card.Content>
        </Card>
    );
};
