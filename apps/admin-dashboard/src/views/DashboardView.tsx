
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { UsersIcon } from '../../../../components/icons/UsersIcon';
import { DollarSignIcon } from '../../../../components/icons/DollarSignIcon';
import { WalletIcon } from '../../../../components/icons/WalletIcon';
import { TrendingUpIcon } from '../../../../components/icons/TrendingUpIcon';
import { PlusIcon } from '../../../../components/icons/PlusIcon';
import { FishIcon } from '../components/icons/FishIcon';
import { SaveIcon } from '../components/icons/SaveIcon';
import { AlertTriangleIcon } from '../../../../components/icons/AlertTriangleIcon';
import { AdminView } from '../App';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { ZapIcon } from '../../../../components/icons/ZapIcon';
import { formatRelativeTime } from '../../../../utils/formatters';
import { LayoutGridIcon } from '../../../../components/icons/LayoutGridIcon';
import { CheckIcon } from '../../../../components/icons/CheckIcon';
import { XIcon } from '../../../../components/icons/XIcon';
import { MoveIcon } from '../../../../components/icons/MoveIcon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { logAdminAction } from '../utils/adminLogger';
import { LifeBuoyIcon } from '../components/icons/LifeBuoyIcon';


type AdminDashboardComponentKey = 'stats' | 'live_activity' | 'quick_actions' | 'system_alerts';

const defaultLayout: AdminDashboardComponentKey[] = ['stats', 'live_activity', 'quick_actions', 'system_alerts'];

type StatsType = { users: number; proUsers: number; wallets: number; };

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<any>; loading: boolean; animation: 'green' | 'red' | null }> = ({ title, value, icon: Icon, loading, animation }) => {
    const animationClass = animation === 'green' ? 'animate-flash-green' : animation === 'red' ? 'animate-flash-red' : '';
    return (
        <Card className={animationClass}>
            <Card.Content className="p-6 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
                    {loading ? <Skeleton className="h-9 w-24 mt-2" /> : <p className={`text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-2 transition-all duration-300 ${animation ? 'animate-tick-up' : ''}`}>{value}</p>}
                </div>
                <div className="p-3 rounded-full bg-brand-blue/10 text-brand-blue">
                    <Icon className="w-6 h-6" />
                </div>
            </Card.Content>
        </Card>
    );
};

const StatsBlock: React.FC<{ 
    stats: StatsType; 
    loading: boolean;
    updatedStat: { key: keyof StatsType, direction: 'up' | 'down' } | null;
}> = ({ stats, loading, updatedStat }) => {
    const mrr = stats.proUsers * 10;
    const proConversion = stats.users > 0 ? (stats.proUsers / stats.users) * 100 : 0;
    const getAnimation = (key: keyof StatsType) => {
        if (updatedStat?.key !== key) return null;
        return updatedStat.direction === 'up' ? 'green' : 'red';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.users.toLocaleString()} icon={UsersIcon} loading={loading} animation={getAnimation('users')} />
            <StatCard title="MRR" value={`$${mrr.toLocaleString()}`} icon={DollarSignIcon} loading={loading} animation={getAnimation('proUsers')} />
            <StatCard title="Connected Wallets" value={stats.wallets.toLocaleString()} icon={WalletIcon} loading={loading} animation={getAnimation('wallets')} />
            <StatCard title="Pro Conversion" value={`${proConversion.toFixed(2)}%`} icon={TrendingUpIcon} loading={loading} animation={null} />
        </div>
    );
};


interface SystemEvent {
    id: string;
    created_at: string;
    service: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

type ActivityEvent = {
    id: string;
    type: 'signup' | 'upgrade' | 'new_ticket' | 'new_whale';
    details: string;
    value?: number;
    event_at: Date;
};

const ActivityEventRow: React.FC<{ event: ActivityEvent }> = ({ event }) => {
    const eventMeta: Record<string, { icon: React.FC<any>, color: string }> = {
        signup: { icon: UsersIcon, color: 'text-blue-500' },
        upgrade: { icon: ZapIcon, color: 'text-purple-500' },
        new_ticket: { icon: LifeBuoyIcon, color: 'text-yellow-500' },
        new_whale: { icon: FishIcon, color: 'text-cyan-500' },
    };
    const eventData = eventMeta[event.type] || { icon: () => null, color: 'text-gray-500' };
    const Icon = eventData.icon;
    return (
        <div className="flex items-center space-x-3 p-3 animate-fade-in">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 ${eventData.color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200" dangerouslySetInnerHTML={{ __html: event.details }} />
                 <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatRelativeTime(event.event_at)}</p>
            </div>
            {event.value && (
                <p className="text-sm font-semibold text-success">
                    +{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(event.value)}
                </p>
            )}
        </div>
    );
};

const LiveActivityFeed: React.FC<{ events: ActivityEvent[] }> = ({ events }) => (
    <Card>
        <Card.Header><Card.Title>Live Activity Feed</Card.Title></Card.Header>
        <Card.Content className="p-2 max-h-96 overflow-y-auto">
            {events.length > 0 ? (
                events.map(event => <ActivityEventRow key={event.id} event={event} />)
            ) : (
                <p className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">Listening for new user activity...</p>
            )}
        </Card.Content>
    </Card>
);

const QuickActionsBlock: React.FC<{ 
    setActiveView: (view: AdminView) => void;
    onTriggerBackup: () => void;
    isBackingUp: boolean;
    backupSuccess: boolean;
}> = ({ setActiveView, onTriggerBackup, isBackingUp, backupSuccess }) => (
    <Card>
        <Card.Header><Card.Title>Quick Actions</Card.Title></Card.Header>
        <Card.Content className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
             <Button variant="secondary" onClick={() => setActiveView('users')}><PlusIcon className="w-4 h-4 mr-2" />Add User</Button>
             <Button variant="secondary" onClick={() => setActiveView('whales')}><FishIcon className="w-4 h-4 mr-2" />Add Whale</Button>
             <Button variant="secondary" onClick={onTriggerBackup} disabled={isBackingUp}>
                {isBackingUp ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : backupSuccess ? <CheckIcon className="w-4 h-4 mr-2"/> : <SaveIcon className="w-4 h-4 mr-2" />}
                {isBackingUp ? 'Backing up...' : backupSuccess ? 'Backup Done!' : 'Trigger Backup'}
             </Button>
             <Button variant="secondary" onClick={() => setActiveView('system-health')}>View Logs</Button>
        </Card.Content>
    </Card>
);

const SystemAlertsBlock: React.FC<{ systemAlerts: SystemEvent[]; loading: boolean; }> = ({ systemAlerts, loading }) => (
     <Card>
        <Card.Header><Card.Title>System Alerts</Card.Title></Card.Header>
        <Card.Content className="px-2">
            {loading ? <Skeleton className="h-24 w-full" /> : systemAlerts.length > 0 ? (
                systemAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0 flex items-start space-x-3">
                        <AlertTriangleIcon className={`w-5 h-5 ${alert.level === 'WARN' ? 'text-warning' : 'text-error'} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className="text-sm font-semibold">{alert.level}: <span className="text-neutral-900 dark:text-white">{alert.service}</span></p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300">{alert.message}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">No active alerts.</p>
            )}
        </Card.Content>
    </Card>
);


interface DashboardViewProps {
  setActiveView: (view: AdminView) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView }) => {
    const [stats, setStats] = useState<StatsType>({ users: 0, wallets: 0, proUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [systemAlerts, setSystemAlerts] = useState<SystemEvent[]>([]);
    
    // Backup state
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupSuccess, setBackupSuccess] = useState(false);
    
    // Layout customization state
    const [layout, setLayout] = useState<AdminDashboardComponentKey[]>(defaultLayout);
    const [originalLayout, setOriginalLayout] = useState<AdminDashboardComponentKey[]>(defaultLayout);
    const [isEditMode, setIsEditMode] = useState(false);
    const [adminUser, setAdminUser] = useState<any | null>(null);

    const [updatedStat, setUpdatedStat] = useState<{ key: keyof StatsType, direction: 'up' | 'down' } | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    const triggerStatUpdateAnimation = (key: keyof StatsType, direction: 'up' | 'down') => {
        setUpdatedStat({ key, direction });
        setTimeout(() => setUpdatedStat(null), 1000); // Duration of animation
    };

    const handleTriggerBackup = async () => {
        if (window.confirm("Are you sure you want to trigger a manual database backup? This is a resource-intensive operation.")) {
            setIsBackingUp(true);
            setBackupSuccess(false);
            
            await logAdminAction('trigger_manual_backup', null, { initiatedAt: new Date().toISOString() });
            
            // Call the backend function to perform the backup
            const { error } = await supabase.rpc('trigger_manual_backup');
    
            setIsBackingUp(false);
    
            if (error) {
                console.error("Backup failed:", error);
                alert(`Backup failed: ${error.message}`);
                setBackupSuccess(false);
            } else {
                setBackupSuccess(true);
                setTimeout(() => setBackupSuccess(false), 4000); // Hide success message after 4 seconds
            }
        }
    };

    // Fetch user and layout preferences
    useEffect(() => {
        const fetchAdminLayout = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAdminUser(user);
                const { data: profile } = await supabase.from('users').select('admin_dashboard_layout').eq('id', user.id).single();
                const userLayout = profile?.admin_dashboard_layout as AdminDashboardComponentKey[];
                if (Array.isArray(userLayout) && userLayout.length > 0) {
                    setLayout(userLayout);
                    setOriginalLayout(userLayout);
                }
            }
        };
        fetchAdminLayout();
    }, []);

    // Fetch initial dashboard data and subscribe to real-time changes
    useEffect(() => {
        const fetchAndSubscribe = async () => {
            setLoading(true);
            const [
                { count: userCount },
                { count: walletCount },
                { count: proUserCount },
                { data: recentActivities, error: rpcError },
                { data: recentAlerts },
                { data: recentTickets },
                { data: recentWhales }
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('wallets').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'Pro'),
                supabase.rpc('get_recent_activity_feed'),
                supabase.from('system_events').select('*').in('severity', ['warning', 'error', 'critical']).order('timestamp', { ascending: false }).limit(3),
                supabase.from('support_tickets').select('id, created_at, user_name, subject').order('created_at', { ascending: false }).limit(5),
                supabase.from('whales').select('id, created_at, name').order('created_at', { ascending: false }).limit(5)
            ]);
            
            setStats({ users: userCount ?? 0, wallets: walletCount ?? 0, proUsers: proUserCount ?? 0 });
            
            let combinedEvents: ActivityEvent[] = [];

            if (rpcError) {
                console.error("Error fetching recent activity:", rpcError);
            } else if (recentActivities) {
                combinedEvents.push(...(recentActivities as any[]).map(e => ({ ...e, event_at: new Date(e.event_at) })));
            }

            if (recentTickets) {
                combinedEvents.push(...recentTickets.map(t => ({ id: `ticket-${t.id}`, type: 'new_ticket', details: `${t.user_name} submitted ticket: "<b>${t.subject}</b>"`, event_at: new Date(t.created_at) })));
            }

            if (recentWhales) {
                combinedEvents.push(...recentWhales.map(w => ({ id: `whale-${w.id}`, type: 'new_whale', details: `New whale '<b>${w.name}</b>' was added to the watchlist.`, event_at: new Date(w.created_at) })));
            }
            
            combinedEvents.sort((a, b) => b.event_at.getTime() - a.event_at.getTime());
            setEvents(combinedEvents.slice(0, 20));

            setSystemAlerts((recentAlerts as SystemEvent[]) || []);
            setLoading(false);

            const channel = supabase.channel('realtime-dashboard')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
                    const newUser = payload.new as any;
                    setEvents(prev => [{ id: newUser.id, type: 'signup', details: `${newUser.email} signed up.`, event_at: new Date(newUser.created_at) }, ...prev]);
                    setStats(prev => ({ ...prev, users: prev.users + 1 }));
                    triggerStatUpdateAnimation('users', 'up');
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
                    const oldUser = payload.old as any;
                    const newUser = payload.new as any;
                    if (oldUser.plan === 'Free' && newUser.plan === 'Pro') {
                        setEvents(prev => [{ id: `upgrade-${newUser.id}-${Date.now()}`, type: 'upgrade', details: `${newUser.email} just upgraded to Pro!`, value: 10, event_at: new Date() }, ...prev]);
                        setStats(prev => ({...prev, proUsers: prev.proUsers + 1}));
                        triggerStatUpdateAnimation('proUsers', 'up');
                    }
                    if (oldUser.plan === 'Pro' && newUser.plan === 'Free') {
                        setStats(prev => ({...prev, proUsers: prev.proUsers - 1}));
                        triggerStatUpdateAnimation('proUsers', 'down');
                    }
                })
                 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallets' }, () => {
                    setStats(prev => ({ ...prev, wallets: prev.wallets + 1 }));
                    triggerStatUpdateAnimation('wallets', 'up');
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wallets' }, () => {
                    setStats(prev => ({ ...prev, wallets: prev.wallets - 1 }));
                    triggerStatUpdateAnimation('wallets', 'down');
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events', filter: 'severity=in.(warning,error,critical)' }, (payload) => {
                    setSystemAlerts(prev => [payload.new as SystemEvent, ...prev].slice(0, 3));
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, (payload) => {
                    const newTicket = payload.new as any;
                    setEvents(prev => [{ id: `ticket-${newTicket.id}`, type: 'new_ticket', details: `${newTicket.user_name} submitted ticket: "<b>${newTicket.subject}</b>"`, event_at: new Date(newTicket.created_at) }, ...prev]);
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whales' }, (payload) => {
                    const newWhale = payload.new as any;
                    setEvents(prev => [{ id: `whale-${newWhale.id}`, type: 'new_whale', details: `New whale '<b>${newWhale.name}</b>' was added to the watchlist.`, event_at: new Date(newWhale.created_at) }, ...prev]);
                })
                .subscribe();
            
            return () => { supabase.removeChannel(channel); };
        };
        fetchAndSubscribe();
    }, []);

    // --- Layout Customization Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        const newLayout = [...layout];
        const draggedItemContent = newLayout.splice(dragItem.current!, 1)[0];
        newLayout.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setLayout(newLayout);
    };

    const handleSaveLayout = async () => {
        if (adminUser) {
            const { error } = await supabase.from('users').update({ admin_dashboard_layout: layout }).eq('id', adminUser.id);
            if (error) {
                console.error("Error saving layout:", error);
                alert("Could not save layout.");
            } else {
                setOriginalLayout(layout);
                setIsEditMode(false);
            }
        }
    };

    const handleCancelLayout = () => {
        setLayout(originalLayout);
        setIsEditMode(false);
    };

    const componentMap: Record<AdminDashboardComponentKey, React.ReactNode> = {
        stats: <StatsBlock stats={stats} loading={loading} updatedStat={updatedStat} />,
        live_activity: <LiveActivityFeed events={events} />,
        quick_actions: <QuickActionsBlock setActiveView={setActiveView} onTriggerBackup={handleTriggerBackup} isBackingUp={isBackingUp} backupSuccess={backupSuccess} />,
        system_alerts: <SystemAlertsBlock systemAlerts={systemAlerts} loading={loading} />,
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
                <div>
                    {isEditMode ? (
                        <div className="flex items-center space-x-2">
                            <Button variant="secondary" onClick={handleCancelLayout}><XIcon className="w-4 h-4 mr-2"/>Cancel</Button>
                            <Button onClick={handleSaveLayout}><CheckIcon className="w-4 h-4 mr-2"/>Save Layout</Button>
                        </div>
                    ) : (
                        <Button variant="secondary" onClick={() => setIsEditMode(true)}>
                            <LayoutGridIcon className="w-4 h-4 mr-2" />
                            Edit Layout
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="space-y-6">
                {layout.map((key, index) => (
                    <div
                        key={key}
                        draggable={isEditMode}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={() => dragItem.current = null}
                        onDragOver={(e) => e.preventDefault()}
                        className={`transition-all duration-300 ${isEditMode ? 'cursor-move relative rounded-2xl ring-2 ring-dashed ring-brand-blue/50 p-1' : ''}`}
                    >
                         {isEditMode && (
                            <div className="absolute top-3 right-3 z-10 bg-brand-blue text-white rounded-full p-1.5 shadow-lg">
                                <MoveIcon className="w-4 h-4" />
                            </div>
                        )}
                        <div className={isEditMode ? 'pointer-events-none' : ''}>
                            {componentMap[key]}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
