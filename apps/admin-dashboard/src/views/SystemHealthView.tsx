
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { ServerIcon } from '../components/icons/ServerIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { AlertTriangleIcon } from '../../../../components/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { supabase } from '../../../../utils/supabase';
import { Pagination } from '../../../../components/shared/Pagination';
import { SearchIcon } from '../../../../components/icons/SearchIcon';
import { AlertCircleIcon } from '../components/icons/AlertCircleIcon';
import { ListIcon } from '../../../../components/icons/ListIcon';
import { XCircleIcon } from '../../../../components/icons/XCircleIcon';
import { Type } from '@google/genai';


type Status = 'Operational' | 'Degraded' | 'Outage' | 'Checking...';

interface SystemEvent {
    id: string;
    created_at: string;
    service: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

interface ApiStatus {
  name: string;
  status: Status;
  metric: string;
  icon: React.FC<any>;
}

interface DiagnosticResult {
    overallStatus: 'Operational' | 'Degraded' | 'Outage';
    summary: string;
    issues: string[];
    recommendations: string[];
}

const diagnosticSchema = {
  type: Type.OBJECT,
  properties: {
    overallStatus: { 
      type: Type.STRING,
      description: "A single word summarizing the status: 'Operational', 'Degraded', or 'Outage'."
    },
    summary: { 
      type: Type.STRING, 
      description: "A one-sentence summary explaining the overall system health." 
    },
    issues: {
      type: Type.ARRAY,
      description: "A list of identified issues or root causes. Empty if all systems are operational.",
      items: { type: Type.STRING }
    },
    recommendations: {
      type: Type.ARRAY,
      description: "A list of 2-3 actionable recommendations.",
      items: { type: Type.STRING }
    }
  },
  required: ['overallStatus', 'summary', 'issues', 'recommendations'],
};

const initialApiStatuses: ApiStatus[] = [
    { name: "Main API", status: "Checking...", metric: "", icon: ServerIcon },
    { name: "Database", status: "Checking...", metric: "", icon: DatabaseIcon },
    { name: "Moralis API", status: "Checking...", metric: "", icon: ClockIcon },
    { name: "Helius API", status: "Checking...", metric: "", icon: ClockIcon },
    { name: "CoinGecko API", status: "Checking...", metric: "", icon: ClockIcon },
    { name: "Blockstream API", status: "Checking...", metric: "", icon: ClockIcon },
];

const LOGS_PER_PAGE = 20;

const LogLevelBadge: React.FC<{ level: string }> = ({ level }) => {
    const styles = {
        INFO: 'bg-blue-500/20 text-blue-500',
        WARN: 'bg-warning/20 text-warning',
        ERROR: 'bg-error/20 text-error',
    };
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[level as keyof typeof styles] || 'bg-neutral-500/20'}`}>
            {level}
        </span>
    );
};

const StatusCard: React.FC<ApiStatus> = ({ name, status, metric, icon: Icon }) => {
    const statusConfig = {
        Operational: { color: 'text-success', icon: CheckCircleIcon },
        Degraded: { color: 'text-warning', icon: AlertTriangleIcon },
        Outage: { color: 'text-error', icon: AlertTriangleIcon },
        'Checking...': { color: 'text-neutral-400', icon: RefreshCwIcon },
    };
    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    return (
        <Card className="flex items-center p-4">
            <div className={`p-3 rounded-full bg-neutral-100 dark:bg-neutral-900 mr-4 ${currentStatus.color}`}>
                <Icon className={`w-6 h-6 ${status === 'Checking...' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-neutral-900 dark:text-white">{name}</p>
                <div className={`flex items-center text-sm font-semibold ${currentStatus.color}`}>
                    <StatusIcon className="w-4 h-4 mr-1.5" />
                    <span>{status}</span>
                </div>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">{metric}</p>
        </Card>
    );
};

const AiDiagnosticResult: React.FC<{ result: DiagnosticResult }> = ({ result }) => {
    const statusConfig = {
        Operational: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircleIcon },
        Degraded: { color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangleIcon },
        Outage: { color: 'text-error', bg: 'bg-error/10', icon: AlertTriangleIcon },
    };
    const currentStatus = statusConfig[result.overallStatus];
    const StatusIcon = currentStatus.icon;

    return (
        <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-fade-in space-y-4">
            <div className={`flex items-center p-3 rounded-md ${currentStatus.bg}`}>
                <StatusIcon className={`w-6 h-6 mr-3 ${currentStatus.color}`} />
                <div>
                    <h4 className={`font-bold ${currentStatus.color}`}>{result.overallStatus}</h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{result.summary}</p>
                </div>
            </div>
            
            {result.issues.length > 0 && (
                <div>
                    <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center">
                        <AlertCircleIcon className="w-5 h-5 mr-2 text-warning" />
                        Identified Issues
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-300 pl-2">
                        {result.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                </div>
            )}

            {result.recommendations.length > 0 && (
                <div>
                    <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center">
                        <ListIcon className="w-5 h-5 mr-2 text-brand-blue" />
                        Recommendations
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-300 pl-2">
                        {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


export const SystemHealthView: React.FC = () => {
    const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>(initialApiStatuses);
    const [isChecking, setIsChecking] = useState(true);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
    const [logs, setLogs] = useState<SystemEvent[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logCount, setLogCount] = useState(0);
    const [logPage, setLogPage] = useState(1);
    const [logSearch, setLogSearch] = useState('');
    const [isTestingSupabase, setIsTestingSupabase] = useState(false);
    const [supabaseTestResult, setSupabaseTestResult] = useState<'success' | 'error' | null>(null);
    
    const checkStatuses = useCallback(async () => {
        setIsChecking(true);
        
        const results = await Promise.all(initialApiStatuses.map(async (service) => {
            try {
                const { data, error } = await supabase.functions.invoke('check-service-status', {
                    body: { serviceName: service.name },
                });
                if (error) throw error;
                return { ...service, status: data.status, metric: data.metric };
            } catch (e) {
                console.error(`Error checking status for ${service.name}:`, e);
                return { ...service, status: 'Outage', metric: 'Error' };
            }
        }));

        setApiStatuses(results);
        setIsChecking(false);
    }, []);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        const from = (logPage - 1) * LOGS_PER_PAGE;
        const to = from + LOGS_PER_PAGE - 1;

        let query = supabase.from('system_events').select('*', { count: 'exact' });
        if(logSearch) {
            query = query.or(`service.ilike.%${logSearch}%,message.ilike.%${logSearch}%`);
        }

        const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
        
        if (data) setLogs(data);
        if (count) setLogCount(count);
        if (error) console.error("Error fetching logs:", error);

        setLogsLoading(false);
    }, [logPage, logSearch]);
    
    useEffect(() => {
        checkStatuses(); // Initial check
        const interval = setInterval(checkStatuses, 60000); // Refresh every 60 seconds

        const channel = supabase.channel('system-health-events').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events' }, payload => {
            setLogs(prev => [payload.new as SystemEvent, ...prev.slice(0, LOGS_PER_PAGE - 1)]);
            setLogCount(prev => prev + 1);
        }).subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [checkStatuses]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRunDiagnostic = async () => {
        setIsDiagnosing(true);
        setDiagnosticResult(null);

        const prompt = `You are a DevOps engineer analyzing the health of a web application. Based on the following JSON data of service statuses, provide a concise analysis in the required JSON format.

        **Analysis Requirements:**
        1.  **overallStatus:** A single word: 'Operational', 'Degraded', or 'Outage'.
        2.  **summary:** A one-sentence summary explaining the overall system health.
        3.  **issues:** A list of identified issues or root causes. Empty if all systems are operational.
        4.  **recommendations:** A list of 2-3 actionable recommendations.
        5.  Keep the language clear and direct.

        **System Status Data:**
        ${JSON.stringify(apiStatuses.map(({ name, status, metric }) => ({ name, status, metric })), null, 2)}
        `;

        try {
            const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt, schema: diagnosticSchema },
            });

            if (error) throw error;
            
            setDiagnosticResult(data as DiagnosticResult);

        } catch (error: any) {
            console.error("Error running AI diagnostic:", error);
            setDiagnosticResult({
                overallStatus: 'Outage',
                summary: "Could not get a response from the AI model.",
                issues: ["The AI diagnostic function failed to execute.", error.message],
                recommendations: ["Check the Supabase function logs for 'generate-ai-insights'.", "Verify the GEMINI_API_KEY is set correctly in Supabase."]
            });
        } finally {
            setIsDiagnosing(false);
        }
    };

    const handleTestSupabaseConnection = async () => {
        setIsTestingSupabase(true);
        setSupabaseTestResult(null);
        try {
            // Use a simple, low-cost prompt
            const { error } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt: "test" },
            });

            if (error) throw error;
            setSupabaseTestResult('success');

        } catch (error) {
            console.error("Supabase Edge Function test failed:", error);
            setSupabaseTestResult('error');
        } finally {
            setIsTestingSupabase(false);
            setTimeout(() => setSupabaseTestResult(null), 4000); // Clear result after 4 seconds
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">System Health</h1>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <div className="relative flex items-center space-x-2">
                         <Button variant="secondary" onClick={handleTestSupabaseConnection} disabled={isTestingSupabase}>
                            {isTestingSupabase ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}
                            Test Edge Functions
                        </Button>
                        {supabaseTestResult && (
                             <div className={`flex items-center text-sm font-semibold animate-fade-in ${supabaseTestResult === 'success' ? 'text-success' : 'text-error'}`}>
                                {supabaseTestResult === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-1" /> : <XCircleIcon className="w-5 h-5 mr-1" />}
                                <span>{supabaseTestResult === 'success' ? 'OK' : 'Failed'}</span>
                            </div>
                        )}
                    </div>
                    <Button variant="secondary" onClick={checkStatuses} disabled={isChecking}>
                        <RefreshCwIcon className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                        {isChecking ? 'Checking...' : 'Re-check Statuses'}
                    </Button>
                </div>
            </div>
            
            <Card>
                <Card.Header><Card.Title>AI Diagnostics</Card.Title></Card.Header>
                <Card.Content className="p-6">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">Run an AI-powered analysis on the current system status to get a clear summary and actionable recommendations.</p>
                    <Button onClick={handleRunDiagnostic} disabled={isDiagnosing || isChecking}>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        {isDiagnosing ? 'Analyzing...' : 'Run AI Diagnostic'}
                    </Button>
                    {isDiagnosing && <Skeleton className="h-48 w-full mt-4" />}
                    {diagnosticResult && <AiDiagnosticResult result={diagnosticResult} />}
                </Card.Content>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apiStatuses.map(status => <StatusCard key={status.name} {...status} />)}
            </div>

            <Card>
                <Card.Header>
                    <div className="flex justify-between items-center">
                        <div>
                            <Card.Title>Event Log</Card.Title>
                            <Card.Description>Recent system events and logs.</Card.Description>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Filter logs..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="block w-full sm:w-64 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 pl-9 pr-3 text-neutral-900 dark:text-white focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="p-4 font-medium">Timestamp</th>
                                    <th className="p-4 font-medium">Service</th>
                                    <th className="p-4 font-medium">Level</th>
                                    <th className="p-4 font-medium">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsLoading ? (
                                    Array.from({length: 5}).map((_, i) => (
                                        <tr key={i}><td colSpan={4} className="p-2"><Skeleton className="h-8 w-full"/></td></tr>
                                    ))
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
                                            <td className="p-4 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="p-4 font-semibold">{log.service}</td>
                                            <td className="p-4"><LogLevelBadge level={log.level} /></td>
                                            <td className="p-4 font-mono text-xs">{log.message}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center p-8 text-neutral-500">No logs found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={logCount} itemsPerPage={LOGS_PER_PAGE} currentPage={logPage} onPageChange={setLogPage} />
                </Card.Content>
            </Card>
        </div>
    );
};
