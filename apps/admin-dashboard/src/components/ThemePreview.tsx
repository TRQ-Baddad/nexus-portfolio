
import React from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { PlusIcon } from '../../../../components/icons/PlusIcon';

export const ThemePreview: React.FC = () => {
    return (
        <Card>
            <Card.Header>
                <Card.Title>Live Preview</Card.Title>
            </Card.Header>
            <Card.Content className="p-6 space-y-8">
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Buttons</h3>
                    <div className="flex items-center space-x-4">
                        <Button><PlusIcon className="w-4 h-4 mr-2" />Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                    </div>
                </div>

                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Text & Links</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">This is some regular body text. You can also have <a href="#" className="text-brand-blue hover:underline">links</a> that use the primary brand color.</p>
                </div>
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Example Card</h3>
                     <Card>
                        <Card.Header>
                            <Card.Title>Preview Card Title</Card.Title>
                            <Card.Description>This is a description inside the card.</Card.Description>
                        </Card.Header>
                        <Card.Content className="p-6">
                            <p>Card content goes here.</p>
                        </Card.Content>
                    </Card>
                </div>
            </Card.Content>
        </Card>
    );
};
