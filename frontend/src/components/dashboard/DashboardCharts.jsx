import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { analyticsApi } from '../../api/analytics';
import { HiArrowRight } from 'react-icons/hi';

const COLORS = {
    'To Do': 'var(--text-muted)',       // Slate-400
    'In Progress': 'var(--primary)', // Blue-500
    'Review': 'var(--accent)',      // Violet-500
    'Done': 'var(--success)',        // Emerald-500
    'Blocked': 'var(--danger)',     // Red-500
    'default': 'var(--border-default)'      // Slate-300
};

export default function DashboardCharts({ organizationId, stats }) {
    const [days, setDays] = useState(7);

    // Fetch Analytics Data
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['organization-analytics', organizationId, days],
        queryFn: () => analyticsApi.getOrganizationAnalytics(organizationId, days),
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Transform Throughput Data for Area Chart
    const velocityData = useMemo(() => {
        if (!analytics?.throughput) return [];

        // Create a map of existing data
        const dataMap = new Map(analytics.throughput.map(item => [item.date, item.count]));

        // Fill in missing days with 0
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            result.push({
                name: format(date, 'MMM dd'),
                fullDate: dateStr,
                tasks: dataMap.get(dateStr) || 0
            });
        }
        return result;
    }, [analytics, days]);

    // Transform State Distribution for Pie Chart
    const statusData = useMemo(() => {
        if (!analytics?.stateDistribution) return [];

        return analytics.stateDistribution.map(item => ({
            name: item.stateName,
            value: item.count,
            color: COLORS[item.stateName] || COLORS.default
        })).filter(item => item.value > 0);
    }, [analytics]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                <div className="lg:col-span-2 h-[380px] bg-white rounded-xl border border-slate-200" />
                <div className="h-[380px] bg-white rounded-xl border border-slate-200" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            {/* Primary Insight: Task Velocity (Area Chart) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-md overflow-x-auto">
                <div className="flex items-center justify-between mb-6 min-w-[600px]">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-800">Task Velocity</h3>
                            <Link
                                to={`/organizations/${organizationId}/analytics`}
                                className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                                View Analytics <HiArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <p className="text-sm text-slate-500">Tasks completed over time</p>
                    </div>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-primary outline-none"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={14}>Last 14 Days</option>
                        <option value={30}>Last 30 Days</option>
                    </select>
                </div>
                <div className="h-[300px] w-full min-w-[600px] relative">
                    {velocityData.some(d => d.tasks > 0) ? (
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    dy={10}
                                    interval="preserveStartEnd"
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px var(--border-default)' }}
                                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="tasks" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full relative">
                            {/* Grid Overlay Empty State */}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={Array(days).fill({ name: '', tasks: 0 })}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                                    <YAxis axisLine={false} tickLine={false} tick={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <span className="text-2xl mb-2">📉</span>
                                <span className="text-sm font-medium">No activity in this period</span>
                                <span className="text-xs text-slate-400">Complete tasks to see velocity data</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Insight: Workload (Donut) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Status Distribution</h3>
                <p className="text-sm text-slate-500 mb-6">Breakdown by current state</p>

                <div className="h-[220px] w-full relative min-w-[250px]">
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full relative">
                            {/* Grey Donut Empty State */}
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ name: 'No Data', value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        dataKey="value"
                                        stroke="transparent"
                                        fill="var(--bg-hover)"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-xs font-medium text-slate-400">No active tasks</span>
                            </div>
                        </div>
                    )}
                    {/* Centered Total */}
                    {statusData.length > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-bold text-slate-800">{stats.taskCount}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
