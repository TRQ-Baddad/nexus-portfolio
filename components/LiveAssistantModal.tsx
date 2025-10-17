import React from 'react';
import { Modal } from './shared/Modal';
import { Live } from './Live';
import { useAppContext } from '../apps/nexus-portfolio/src/hooks/useAppContext';

interface LiveAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LiveAssistantModal: React.FC<LiveAssistantModalProps> = ({ isOpen, onClose }) => {
    const { displayedUser, tokens, portfolioValue } = useAppContext();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Live AI Assistant" size="2xl">
            <Live 
                user={displayedUser}
                tokens={tokens}
                portfolioValue={portfolioValue}
                isModalMode={true}
            />
        </Modal>
    );
};
