import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, SupportTicket, TicketReply } from '../../../../types';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { ChevronDownIcon } from '../../../../components/icons/ChevronDownIcon';
import { CheckCircleIcon } from '../../../../components/icons/CheckCircleIcon';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { supabase } from '../../../../utils/supabase';
import { formatRelativeTime } from '../../../../utils/formatters';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { Modal } from '../../../../components/shared/Modal';
import { ArrowRightIcon } from '../../../../components/icons/ArrowRightIcon';
import { HelpCircleIcon } from '../../../../components/icons/HelpCircleIcon';
import { useAiSupport } from '../../../../hooks/useAiSupport';
import { SparklesIcon } from '../../../../components/icons/SparklesIcon';
import { useAppContext } from '../hooks/useAppContext';

const faqs = [
    {
        question: "How do I add a new wallet?",
        answer: "Click the 'Add Wallet' button in the header or on the dashboard. Select the blockchain, paste your public wallet address, and give it an optional nickname. Nexus never asks for your private keys."
    },
    {
        question: "Is Nexus Portfolio secure?",
        answer: "Yes. We only ever ask for your public wallet addresses, which are public information. We have read-only access to your on-chain data and can never move your funds. Your account is secured with email and password authentication."
    },
    {
        question: "What are the benefits of the Pro plan?",
        answer: "The Pro plan unlocks unlimited wallets, real-time data, AI-powered portfolio insights, whale activity alerts, historical analytics, and the ability to track custom whale wallets. It's designed for serious investors who want an edge."
    },
    {
        question: "How does 'Smart Money' tracking work?",
        answer: "We curate a list of wallets belonging to well-known traders, funds, and crypto personalities. By tracking their public on-chain activity, you can see what they are buying, selling, and holding to inform your own strategy."
    },
];

const FaqItem: React.FC<{ faq: { question: string; answer: string } }> = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-4"
            >
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{faq.question}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-neutral-600 dark:text-neutral-300 animate-fade-in" style={{animationDuration: '200ms'}}>
                    <p>{faq.answer}</p>
                </div>
            )}
        </div>
    );
};

export const SupportView: React.FC = () => {
    const { displayedUser: user } = useAppContext();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const { suggestion, isLoading, error, getSuggestion } = useAiSupport();
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        if (subject.trim() || message.trim()) {
            debounceTimeout.current = window.setTimeout(() => {
                getSuggestion(subject, message, faqs);
            }, 500); // 500ms debounce
        }
    }, [subject, message, getSuggestion]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message || !user) return;
        setIsSubmitting(true);
        
        const { error } = await supabase.from('support_tickets').insert({
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            subject,
            message,
            status: 'Open',
            priority: user.plan === 'Pro' ? 'High' : 'Medium',
        });
        
        setIsSubmitting(false);

        if (error) {
            console.error("Error creating ticket:", error);
            alert(`Failed to submit ticket: ${error.message}`);
        } else {
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                setSubject('');
                setMessage('');
            }, 3000);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Help & Support</h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">Find answers to common questions or get in touch with our team.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <Card.Header>
                            <Card.Title>Contact Support</Card.Title>
                            <Card.Description>Can't find an answer? Let us know.</Card.Description>
                        </Card.Header>
                        <Card.Content className="p-6">
                            {isSubmitted ? (
                                <div className="text-center p-8 bg-success/10 rounded-lg animate-fade-in">
                                    <CheckCircleIcon className="w-12 h-12 text-success mx-auto mb-3" />
                                    <h3 className="font-semibold text-success">Ticket Submitted!</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">Our team will get back to you at {user?.email} shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="support-subject" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Subject</label>
                                        <input id="support-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="support-message" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Message</label>
                                        <textarea id="support-message" rows={4} value={message} onChange={e => setMessage(e.target.value)} required className="mt-1 block w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"></textarea>
                                    </div>
                                    
                                    {(isLoading || suggestion || error) && (
                                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <SparklesIcon className="w-5 h-5 text-brand-blue"/>
                                                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">AI Suggested Answer</h4>
                                            </div>
                                            {isLoading && (
                                                <div className="space-y-2 pt-2">
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-4 w-5/6" />
                                                </div>
                                            )}
                                            {error && <p className="text-sm text-error">{error}</p>}
                                            {suggestion && <p className="text-sm text-neutral-600 dark:text-neutral-300">{suggestion}</p>}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Still need help? Submit Ticket'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </Card.Content>
                    </Card>
                </div>

                <div>
                     <Card>
                        <Card.Header>
                            <Card.Title>Frequently Asked Questions</Card.Title>
                        </Card.Header>
                        <Card.Content className="p-0">
                            {faqs.map(faq => <FaqItem key={faq.question} faq={faq} />)}
                        </Card.Content>
                    </Card>
                </div>
            </div>
        </div>
    );
};