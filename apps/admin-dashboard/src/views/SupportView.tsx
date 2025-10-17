
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../utils/supabase';
import { SupportTicket, TicketReply } from '../../../../types';
import { Card } from '../../../../components/shared/Card';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { Button } from '../../../../components/shared/Button';
import { formatRelativeTime } from '../../../../utils/formatters';
import { SparklesIcon } from '../components/icons/SparklesIcon';

const StatusBadge: React.FC<{ status: SupportTicket['status'] }> = ({ status }) => {
    const styles = {
        Open: 'bg-blue-500/20 text-blue-500',
        'In Progress': 'bg-yellow-500/20 text-yellow-500',
        Closed: 'bg-neutral-500/20 text-neutral-500',
    };
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles[status]}`}>{status}</span>;
};

const PriorityBadge: React.FC<{ priority: SupportTicket['priority'] }> = ({ priority }) => {
    const styles = {
        Low: 'bg-green-500/20 text-green-500',
        Medium: 'bg-yellow-500/20 text-yellow-500',
        High: 'bg-red-500/20 text-red-500',
    };
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles[priority]}`}>{priority}</span>;
};

const TicketListItem: React.FC<{ ticket: SupportTicket, isSelected: boolean, onSelect: () => void }> = ({ ticket, isSelected, onSelect }) => (
    <button onClick={onSelect} className={`w-full text-left p-3 border-l-4 ${isSelected ? 'border-brand-blue bg-neutral-100 dark:bg-neutral-800' : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
        <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>{ticket.user_name}</span>
            <span>{formatRelativeTime(new Date(ticket.created_at))}</span>
        </div>
        <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{ticket.subject}</p>
        <div className="flex items-center space-x-2 mt-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
        </div>
    </button>
);

export const SupportView: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [replies, setReplies] = useState<TicketReply[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newReply, setNewReply] = useState('');
    const [isLoadingTickets, setIsLoadingTickets] = useState(true);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'Open' | 'In Progress' | 'Closed' | 'All'>('All');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTickets = useCallback(async () => {
        setIsLoadingTickets(true);
        let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
        }
        const { data, error } = await query;
        if (data) setTickets(data);
        if (error) console.error("Error fetching tickets:", error);
        setIsLoadingTickets(false);
    }, [statusFilter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);
    
    useEffect(() => {
        const fetchReplies = async () => {
            if (!selectedTicket) return;
            setIsLoadingReplies(true);
            const { data, error } = await supabase.from('ticket_replies').select('*').eq('ticket_id', selectedTicket.id).order('created_at', { ascending: true });
            if (data) setReplies(data);
            if (error) console.error("Error fetching replies:", error);
            setIsLoadingReplies(false);
        };
        fetchReplies();
    }, [selectedTicket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies]);

    const handleUpdateTicket = async (id: string, updates: Partial<SupportTicket>) => {
        const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
        if (!error) {
            fetchTickets();
            if (selectedTicket?.id === id) {
                setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
            }
        }
    };
    
    const handlePostReply = async () => {
        if (!newReply.trim() || !selectedTicket) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const reply: Omit<TicketReply, 'id' | 'created_at'> = {
            ticket_id: selectedTicket.id,
            user_id: user.id,
            author_name: 'Support Team',
            is_admin_reply: true,
            message: newReply,
        };
        
        const { data: newReplyData, error } = await supabase.from('ticket_replies').insert(reply).select().single();
        if (newReplyData) {
            setReplies(prev => [...prev, newReplyData]);
            setNewReply('');
            if (selectedTicket.status === 'Open') {
                handleUpdateTicket(selectedTicket.id, { status: 'In Progress' });
            }
        }
        if (error) console.error("Error posting reply:", error);
    };

    const handleSuggestReply = async () => {
        if (!selectedTicket) return;

        setIsSuggesting(true);
        setNewReply('AI is thinking...');

        const conversationHistory = [
            `User: ${selectedTicket.message}`,
            ...replies.map(r => `${r.is_admin_reply ? 'Support' : 'User'}: ${r.message}`)
        ].join('\n');

        const prompt = `You are a helpful and empathetic customer support agent for Nexus Portfolio, a crypto portfolio tracker. Your goal is to provide clear, helpful, and concise answers. If you don't know the answer, suggest escalating the ticket.
        
        A user has submitted a support ticket. Based on the ticket's subject and the conversation history, please draft a suitable reply to the user's latest message.
        
        ---
        Ticket Subject: ${selectedTicket.subject}
        ---
        Conversation History:
        ${conversationHistory}
        ---
        
        Draft your reply:`;

        try {
            const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt },
            });
            if (error) throw error;
            setNewReply(data.reply);
        } catch (error) {
            console.error("Error suggesting reply:", error);
            setNewReply("Sorry, I couldn't generate a suggestion at this time.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Support Center</h1>
            <Card className="flex flex-col md:flex-row h-[75vh]">
                <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                    <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 flex space-x-1">
                        {(['All', 'Open', 'In Progress', 'Closed'] as const).map(status => (
                            <Button key={status} variant={statusFilter === status ? 'primary' : 'secondary'} size="sm" onClick={() => setStatusFilter(status)} className="flex-1">{status}</Button>
                        ))}
                    </div>
                    <div className="overflow-y-auto">
                        {isLoadingTickets ? <Skeleton className="h-full w-full" /> : 
                            tickets.map(t => <TicketListItem key={t.id} ticket={t} isSelected={selectedTicket?.id === t.id} onSelect={() => setSelectedTicket(t)} />)
                        }
                    </div>
                </aside>
                <main className="flex-1 flex flex-col">
                    {selectedTicket ? (
                        <>
                            <header className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 className="font-bold text-lg">{selectedTicket.subject}</h2>
                                <p className="text-sm text-neutral-500">From: {selectedTicket.user_name} ({selectedTicket.user_email})</p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <select value={selectedTicket.status} onChange={e => handleUpdateTicket(selectedTicket.id, { status: e.target.value as any })} className="text-xs bg-transparent border-neutral-300 dark:border-neutral-600 rounded-md py-1">
                                        <option>Open</option><option>In Progress</option><option>Closed</option>
                                    </select>
                                    <select value={selectedTicket.priority} onChange={e => handleUpdateTicket(selectedTicket.id, { priority: e.target.value as any })} className="text-xs bg-transparent border-neutral-300 dark:border-neutral-600 rounded-md py-1">
                                        <option>Low</option><option>Medium</option><option>High</option>
                                    </select>
                                </div>
                            </header>
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-neutral-50 dark:bg-neutral-900/50">
                                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                                    <p className="font-semibold">{selectedTicket.user_name}</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket.message}</p>
                                    <p className="text-xs text-neutral-400 mt-2 text-right">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                                </div>
                                {isLoadingReplies ? <Skeleton className="h-24 w-full"/> : replies.map(reply => (
                                    <div key={reply.id} className={`p-4 rounded-lg shadow-sm border ${reply.is_admin_reply ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>
                                        <p className="font-semibold">{reply.author_name}</p>
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{reply.message}</p>
                                        <p className="text-xs text-neutral-400 mt-2 text-right">{new Date(reply.created_at).toLocaleString()}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                                <textarea value={newReply} onChange={e => setNewReply(e.target.value)} rows={3} placeholder="Write a reply..." className="w-full bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded-md p-2 text-sm" />
                                <div className="flex justify-end items-center mt-2 space-x-2">
                                     <Button variant="secondary" onClick={handleSuggestReply} disabled={isSuggesting}>
                                        <SparklesIcon className="w-4 h-4 mr-2" />
                                        {isSuggesting ? 'Generating...' : 'Suggest Reply'}
                                    </Button>
                                    <Button onClick={handlePostReply} disabled={!newReply.trim() || isSuggesting}>Send Reply</Button>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-neutral-400">
                            <p>Select a ticket to view details</p>
                        </div>
                    )}
                </main>
            </Card>
        </div>
    );
};
