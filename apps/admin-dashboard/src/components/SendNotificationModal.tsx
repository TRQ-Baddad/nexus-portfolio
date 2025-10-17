import React, { useState } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { Button } from '../../../../components/shared/Button';
import { supabase } from '../../../../utils/supabase';

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientIds: string[];
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ isOpen, onClose, recipientIds }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim() || recipientIds.length === 0) return;
        
        setIsSending(true);
        setError('');

        const notifications = recipientIds.map(userId => ({
            user_id: userId,
            message: message,
            is_read: false,
        }));

        const { error: insertError } = await supabase.from('notifications').insert(notifications);

        if (insertError) {
            setError(insertError.message);
            console.error('Error sending notification:', insertError);
        } else {
            setMessage('');
            onClose();
            // In a real app, you might show a success toast here.
        }
        setIsSending(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Notification to ${recipientIds.length} User(s)`}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="notification-message" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Message</label>
                    <textarea
                        id="notification-message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your notification message here... (e.g., announcing new features, scheduled maintenance, etc.)"
                        className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm py-2 px-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>
                 {error && <p className="text-sm text-error">{error}</p>}
                 <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={isSending}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending || !message.trim()}>
                        {isSending ? 'Sending...' : `Send Notification`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};