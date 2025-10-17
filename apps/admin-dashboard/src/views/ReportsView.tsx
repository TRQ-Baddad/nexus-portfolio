import React, { useState } from 'react';
import { Card } from '../../../../components/shared/Card';
import { Button } from '../../../../components/shared/Button';
import { DownloadIcon } from '../../../../components/icons/DownloadIcon';
import { RefreshCwIcon } from '../../../../components/icons/RefreshCwIcon';
import { supabase } from '../../../../utils/supabase';

type ReportStatus = 'idle' | 'generating' | 'ready';

const MonthlyUserGrowthReportCard: React.FC = () => {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [csvData, setCsvData] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 7));

    const handleGenerate = async () => {
        setStatus('generating');
        setCsvData(null);

        const year = parseInt(selectedDate.slice(0, 4));
        const month = parseInt(selectedDate.slice(5, 7));
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString();

        const { data, error } = await supabase.from('users').select('created_at, plan').gte('created_at', startDate).lt('created_at', endDate);
        
        if (error || !data) {
            alert(error?.message || 'No user data found for this period.');
            setStatus('idle');
            return;
        }
        
        const dailyStats: Record<string, { signups: number; proUpgrades: number }> = {};
        data.forEach(user => {
            const day = new Date(user.created_at).toISOString().slice(0, 10);
            if (!dailyStats[day]) {
                dailyStats[day] = { signups: 0, proUpgrades: 0 };
            }
            dailyStats[day].signups += 1;
            if (user.plan === 'Pro') {
                dailyStats[day].proUpgrades += 1;
            }
        });

        const headers = ['Date', 'New Signups', 'New Pro Users'];
        const csvRows = [headers.join(',')];
        Object.entries(dailyStats).sort((a,b) => a[0].localeCompare(b[0])).forEach(([date, stats]) => {
            csvRows.push([date, stats.signups, stats.proUpgrades].join(','));
        });

        setCsvData(csvRows.join('\n'));
        setStatus('ready');
    };
    
    const handleDownload = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `nexus_user_growth_${selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <Card.Header>
                <Card.Title>Monthly User Growth</Card.Title>
                <Card.Description>New sign-ups and pro upgrades for the selected month.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6 space-y-4">
                 <input
                    type="month"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 sm:text-sm"
                />
                {status === 'idle' && <Button onClick={handleGenerate} className="w-full">Generate Report</Button>}
                {status === 'generating' && <Button className="w-full" disabled><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />Generating...</Button>}
                {status === 'ready' && <Button onClick={handleDownload} className="w-full"><DownloadIcon className="w-4 h-4 mr-2" />Download Report (.csv)</Button>}
            </Card.Content>
        </Card>
    );
};


const UserExportReportCard: React.FC = () => {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [csvData, setCsvData] = useState<string | null>(null);

    const handleGenerate = async () => {
        setStatus('generating');
        setCsvData(null);
        
        // This RPC function is assumed to exist on the backend.
        // It fetches all users and formats them into a CSV string server-side.
        const { data, error } = await supabase.rpc('export_all_users_csv');
        
        if (error || !data) {
            alert(error?.message || 'Failed to generate user export report.');
            setStatus('idle');
            return;
        }
        
        setCsvData(data as string);
        setStatus('ready');
    };

    const handleDownload = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'nexus_users_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('idle');
        setCsvData(null);
    };

    return (
        <Card>
            <Card.Header>
                <Card.Title>All Users Export</Card.Title>
                <Card.Description>Export a complete list of all users, including their plan, status, and join date.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                {status === 'idle' && (
                    <Button onClick={handleGenerate} className="w-full">Generate Report</Button>
                )}
                {status === 'generating' && (
                    <Button className="w-full" disabled>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                    </Button>
                )}
                {status === 'ready' && (
                    <Button onClick={handleDownload} className="w-full">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download Report (.csv)
                    </Button>
                )}
            </Card.Content>
        </Card>
    );
};

const RevenueReportCard: React.FC = () => {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [csvData, setCsvData] = useState<string | null>(null);

    const handleGenerate = async () => {
        setStatus('generating');
        setCsvData(null);
        
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'Pro');
        
        if (error) {
            alert(error.message);
            setStatus('idle');
            return;
        }

        const proUsers = count ?? 0;
        const mrr = proUsers * 10;
        const csv = `Metric,Value\nTotal Pro Users,${proUsers}\nMonthly Recurring Revenue (MRR),$${mrr}`;
        
        setCsvData(csv);
        setStatus('ready');
    };

    const handleDownload = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'nexus_revenue_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('idle');
        setCsvData(null);
    };

    return (
         <Card>
            <Card.Header>
                <Card.Title>Revenue Breakdown</Card.Title>
                <Card.Description>Detailed breakdown of monthly recurring revenue (MRR) from Pro subscriptions.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                {status === 'idle' && <Button onClick={handleGenerate} className="w-full">Generate Report</Button>}
                {status === 'generating' && <Button className="w-full" disabled><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />Generating...</Button>}
                {status === 'ready' && <Button onClick={handleDownload} className="w-full"><DownloadIcon className="w-4 h-4 mr-2" />Download Report (.csv)</Button>}
            </Card.Content>
        </Card>
    );
};

const ContentEngagementReportCard: React.FC = () => {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [csvData, setCsvData] = useState<string | null>(null);

    const handleGenerate = async () => {
        setStatus('generating');
        setCsvData(null);
        
        const { data, error } = await supabase.from('articles').select('title, views, status, lastupdated').order('views', { ascending: false });
        
        if (error || !data) {
            alert(error?.message || 'No article data to export.');
            setStatus('idle');
            return;
        }

        const headers = ['Title', 'Views', 'Status', 'Last Updated'];
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = [`"${row.title}"`, row.views, row.status, row.lastUpdated];
            csvRows.push(values.join(','));
        }
        
        setCsvData(csvRows.join('\n'));
        setStatus('ready');
    };

     const handleDownload = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'nexus_content_engagement.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('idle');
        setCsvData(null);
    };

    return (
         <Card>
            <Card.Header>
                <Card.Title>Content Engagement</Card.Title>
                <Card.Description>Report on views and engagement for published articles and tutorials.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                {status === 'idle' && <Button onClick={handleGenerate} className="w-full">Generate Report</Button>}
                {status === 'generating' && <Button className="w-full" disabled><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />Generating...</Button>}
                {status === 'ready' && <Button onClick={handleDownload} className="w-full"><DownloadIcon className="w-4 h-4 mr-2" />Download Report (.csv)</Button>}
            </Card.Content>
        </Card>
    );
};

const WhaleActivityReportCard: React.FC = () => {
    const [status, setStatus] = useState<ReportStatus>('idle');
    const [csvData, setCsvData] = useState<string | null>(null);

    const handleGenerate = async () => {
        setStatus('generating');
        setCsvData(null);

        // Call the backend function to perform the heavy aggregation.
        const { data, error } = await supabase.rpc('generate_whale_activity_report');
        
        if (error || !data) {
            alert(error?.message || 'Could not generate whale activity report.');
            setStatus('idle');
            return;
        }

        const reportData = data as { token_symbol: string, total_transactions: number, total_value_usd: number, sends: number, receives: number, swaps: number }[];

        const headers = ['Token', 'Total Transactions', 'Total Value (USD)', 'Sends', 'Receives', 'Swaps'];
        const csvRows = [headers.join(',')];

        reportData.forEach(row => {
            csvRows.push([
                row.token_symbol,
                row.total_transactions,
                row.total_value_usd.toFixed(2),
                row.sends,
                row.receives,
                row.swaps
            ].join(','));
        });
        
        setCsvData(csvRows.join('\n'));
        setStatus('ready');
    };

     const handleDownload = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'nexus_whale_activity_summary.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('idle');
        setCsvData(null);
    };

    return (
         <Card>
            <Card.Header>
                <Card.Title>Whale Activity Summary</Card.Title>
                <Card.Description>A summary of the most significant transactions from featured whale wallets.</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
                {status === 'idle' && <Button onClick={handleGenerate} className="w-full">Generate Report</Button>}
                {status === 'generating' && <Button className="w-full" disabled><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />Generating...</Button>}
                {status === 'ready' && <Button onClick={handleDownload} className="w-full"><DownloadIcon className="w-4 h-4 mr-2" />Download Report (.csv)</Button>}
            </Card.Content>
        </Card>
    );
};


export const ReportsView: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Generate and download data exports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MonthlyUserGrowthReportCard />
        <RevenueReportCard />
        <UserExportReportCard />
        <WhaleActivityReportCard />
        <ContentEngagementReportCard />
      </div>
    </div>
  );
};