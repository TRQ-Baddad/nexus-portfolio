
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../../../components/shared/Card';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { SimpleLineChart } from '../components/charts/SimpleLineChart';
import { SimpleDoughnutChart } from '../components/charts/SimpleDoughnutChart';
import { supabase } from '../../../../utils/supabase';
import { Skeleton } from '../../../../components/shared/Skeleton';
import { Blockchain } from '../../../../types';
import { BLOCKCHAIN_METADATA } from '../../../../constants';
import { ActivityIcon } from '../../../../components/icons/ActivityIcon';
import { TrendingUpIcon } from '../../../../components/icons/TrendingUpIcon';
import { UsersIcon } from '../../../../components/icons/UsersIcon';
import { WalletIcon } from '../../../../components/icons/WalletIcon';

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<any>; loading: boolean; }> = ({ title, value, icon: Icon, loading }) => (
    <Card>
        <Card.Content className="p-4 flex items-center">
            <div className="p-3 rounded-full bg-brand-blue/10 text-brand-blue mr-4">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
                {loading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>}
            </div>
        </Card.Content>
    </Card>
);


export const AnalyticsView: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange>('Last 30 Days');
    const [chartData, setChartData] = useState<{
        userGrowth: { label: string; value: number }[];
        walletDistribution: { label: string; value: number; color: string }[];
        dailyActiveUsers: { label: string; value: number }[];
        newProSubs: { label: string; value: number }[];
    }>({ userGrowth: [], walletDistribution: [], dailyActiveUsers: [], newProSubs: [] });
    const [stats, setStats] = useState({ dau: 0, newUsers: 0 });
    const [loading, setLoading] = useState(true);

    const getDaysInRange = (range: DateRange) => {
        switch(range) {
            case 'Today': return 1;
            case 'Last 7 Days': return 7;
            case 'Last 30 Days': return 30;
            case 'Last 90 Days': return 90;
            default: return 30; // Fallback for 'All Time'
        }
    };

    const fetchAnalyticsData = useCallback(async (currentRange: DateRange) => {
        setLoading(true);
        const days = getDaysInRange(currentRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateISO = startDate.toISOString();

        const [
            { data: usersData, error: usersError },
            { data: walletsData, error: walletsError },
            { data: proUsersData, error: proUsersError },
            { data: activeUsersData, error: activeUsersError },
        ] = await Promise.all([
            supabase.from('users').select('created_at').gte('created_at', startDateISO),
            supabase.from('wallets').select('blockchain'),
            supabase.from('users').select('created_at').eq('plan', 'Pro').gte('created_at', startDateISO),
            supabase.from('users').select('last_sign_in_at').gte('last_sign_in_at', startDateISO),
        ]);
        
        if (usersError || walletsError || proUsersError || activeUsersError) {
            console.error(usersError || walletsError || proUsersError || activeUsersError);
            setLoading(false);
            return;
        }

        // --- Process All Chart Data ---
        const today = new Date();
        const labels = Array.from({ length: days }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (days - 1 - i));
            return {
                key: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
        });
        
        const dateMap = (data: { created_at: string }[] | { last_sign_in_at: string }[]) => {
            const map = new Map<string, number>();
            data.forEach(item => {
                const dateKey = ('created_at' in item ? item.created_at : item.last_sign_in_at).split('T')[0];
                map.set(dateKey, (map.get(dateKey) || 0) + 1);
            });
            return map;
        };

        const newUsersMap = dateMap(usersData);
        const newProSubsMap = dateMap(proUsersData);
        const dailyActiveUsersMap = dateMap(activeUsersData);

        let cumulativeUsers = 0;
        const userGrowth = labels.map(l => {
            cumulativeUsers += (newUsersMap.get(l.key) || 0);
            return { label: l.label, value: cumulativeUsers };
        });
        const newProSubs = labels.map(l => ({ label: l.label, value: newProSubsMap.get(l.key) || 0 }));
        const dailyActiveUsers = labels.map(l => ({ label: l.label, value: dailyActiveUsersMap.get(l.key) || 0 }));
        
        // Wallet Distribution
        const walletCounts: Record<string, number> = {};
        walletsData.forEach(wallet => {
            walletCounts[wallet.blockchain] = (walletCounts[wallet.blockchain] || 0) + 1;
        });
        const walletDistribution = Object.entries(walletCounts).map(([label, value]) => ({
            label: BLOCKCHAIN_METADATA[label as Blockchain]?.name || label,
            value,
            color: BLOCKCHAIN_METADATA[label as Blockchain]?.color || '#6B7280',
        }));
        
        setStats({
            dau: dailyActiveUsers[dailyActiveUsers.length-1]?.value || 0,
            newUsers: usersData.length,
        });
        setChartData({ userGrowth, walletDistribution, dailyActiveUsers, newProSubs });
        setLoading(false);
    }, []);
    
    useEffect(() => {
        fetchAnalyticsData(dateRange);
    }, [dateRange, fetchAnalyticsData]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Platform Analytics</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Daily Active Users" value={stats.dau.toLocaleString()} icon={ActivityIcon} loading={loading} />
          <StatCard title="New Users" value={stats.newUsers.toLocaleString()} icon={UsersIcon} loading={loading} />
          <StatCard title="New Pro Subscribers" value={chartData.newProSubs.reduce((a,b) => a+b.value, 0).toLocaleString()} icon={TrendingUpIcon} loading={loading} />
          <StatCard title="Total Wallets" value={chartData.walletDistribution.reduce((a,b) => a+b.value, 0).toLocaleString()} icon={WalletIcon} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header><Card.Title>Daily Active Users</Card.Title></Card.Header>
          <Card.Content className="p-4">{loading ? <Skeleton className="w-full h-64" /> : <SimpleLineChart data={chartData.dailyActiveUsers} />}</Card.Content>
        </Card>
        <Card>
          <Card.Header><Card.Title>New Pro Subscriptions</Card.Title></Card.Header>
          <Card.Content className="p-4">{loading ? <Skeleton className="w-full h-64" /> : <SimpleLineChart data={chartData.newProSubs} />}</Card.Content>
        </Card>
        <Card>
          <Card.Header><Card.Title>New User Growth</Card.Title></Card.Header>
          <Card.Content className="p-4">{loading ? <Skeleton className="w-full h-64" /> : <SimpleLineChart data={chartData.userGrowth} />}</Card.Content>
        </Card>
        <Card>
          <Card.Header><Card.Title>Wallets by Blockchain</Card.Title></Card.Header>
          <Card.Content className="p-4">{loading ? <Skeleton className="w-full h-64" /> : <SimpleDoughnutChart data={chartData.walletDistribution} />}</Card.Content>
        </Card>
      </div>
    </div>
  );
};
