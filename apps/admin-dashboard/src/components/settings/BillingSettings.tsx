import React from 'react';
import { Card } from '../../../../../components/shared/Card';
import { Button } from '../../../../../components/shared/Button';
import { ExternalLinkIcon } from '../../../../../components/icons/ExternalLinkIcon';

export const BillingSettings: React.FC = () => {
    return (
        <Card>
            <Card.Header>
                <Card.Title>Billing & Subscription</Card.Title>
                <Card.Description>Manage your subscription and view payment history.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                <div className="p-6 text-center bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                        Billing and subscription management is handled securely through our Stripe portal.
                    </p>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <Button>
                            Go to Stripe Portal
                            <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </Button>
                    </a>
                </div>
            </Card.Content>
        </Card>
    );
};
