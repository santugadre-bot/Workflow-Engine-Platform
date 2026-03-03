import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    HiOutlineChartBar, HiOutlineClock, HiOutlineClipboardCheck,
    HiOutlineFire, HiOutlineLightningBolt, HiOutlineTrendingUp,
    HiOutlineDownload
} from 'react-icons/hi';
import { useProjectAnalytics } from '../api/analytics';

const PRIORITY_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#10b981',
};
const STATE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-sm">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: <span className="font-black">{typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 1) : p.value}</span>
                </p>
            ))}
        </div>
    );
};

export default function ProjectAnalyticsPage() {
    const { organizationId, projectId } = useOutletContext();
    const [days, setDays] = useState(30);
    const { data: analytics, isLoading } = useProjectAnalytics(organizationId, projectId, days);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );

    const { summary, cycleTimeByState = [], throughput = [], stateDistribution = [], tasksByPriority = {} } = analytics || {};

    const priorityData = Object.entries(tasksByPriority).map(([priority, count]) => ({ priority, count }));
    const blockerCount = stateDistribution.find(s => s.stateName?.toLowerCase().includes('block'))?.count ?? 0;

    const handleExportCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Tasks Completed', summary?.totalCompletedTasks ?? 0],
            ['Avg Lead Time (days)', (analytics?.averageLeadTimeDays ?? (summary?.avgTotalCycleTimeHours ?? 0) / 24).toFixed(1)],
            ['Efficiency Score (%)', summary?.efficiencyScore ?? 0],
            ['Active Blockers', blockerCount],
            [''],
            ['State', 'Task Count'],
            ...stateDistribution.map(s => [s.stateName, s.count]),
            [''],
            ['Priority', 'Task Count'],
            ...priorityData.map(p => [p.priority, p.count]),
            [''],
            ['Date', 'Completed'],
            ...throughput.map(t => [t.date, t.count]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-analytics-${days}d.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Performance Insights</h1>
                    <p className="text-slate-500 font-medium">Data-driven analysis of your project throughput and team velocity.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Period selector */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        {[7, 30, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${days === d ? 'bg-white shadow-sm text-primary border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    {/* Export */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                        title="Export as CSV"
                    >
                        <HiOutlineDownload className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<HiOutlineClipboardCheck className="w-6 h-6 text-emerald-500" />}
                    bg="bg-emerald-50"
                    label="Tasks Completed"
                    value={summary?.totalCompletedTasks ?? analytics?.throughputLast7Days ?? 0}
                    sub={`Last ${days} days`}
                />
                <StatCard
                    icon={<HiOutlineClock className="w-6 h-6 text-blue-500" />}
                    bg="bg-blue-50"
                    label="Avg Lead Time"
                    value={`${(analytics?.averageLeadTimeDays ?? summary?.avgTotalCycleTimeHours / 24 ?? 0).toFixed(1)}d`}
                    sub="Time from create → done"
                />
                <StatCard
                    icon={<HiOutlineLightningBolt className="w-6 h-6 text-amber-500" />}
                    bg="bg-amber-50"
                    label="Efficiency Score"
                    value={`${summary?.efficiencyScore ?? 0}%`}
                    sub="Workflow velocity"
                />
                <StatCard
                    icon={<HiOutlineFire className="w-6 h-6 text-rose-500" />}
                    bg="bg-rose-50"
                    label="Active Blockers"
                    value={blockerCount}
                    sub="Tasks currently blocked"
                    highlight={blockerCount > 0}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Throughput Line Chart */}
                <ChartCard title="Daily Throughput" subtitle="Tasks completed per day" icon={<HiOutlineTrendingUp className="w-4 h-4" />}>
                    {throughput.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={throughput} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickFormatter={d => {
                                        const date = new Date(d);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                    interval={Math.floor(throughput.length / 6)}
                                />
                                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Completed"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#10b981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                {/* Cycle Time Bar Chart */}
                <ChartCard title="Avg Cycle Time by State" subtitle="Hours spent in each state" icon={<HiOutlineClock className="w-4 h-4" />}>
                    {cycleTimeByState.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={cycleTimeByState} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="stateName" stroke="#94a3b8" fontSize={11} />
                                <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="averageDurationHours" name="Avg Hours" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {cycleTimeByState.map((_, i) => (
                                        <Cell key={i} fill={STATE_COLORS[i % STATE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* State Distribution Pie */}
                <ChartCard title="State Distribution" subtitle="Current task spread across states" icon={<HiOutlineChartBar className="w-4 h-4" />}>
                    {stateDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={stateDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="count"
                                    nameKey="stateName"
                                    label={({ stateName, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                    labelLine={false}
                                >
                                    {stateDistribution.map((_, i) => (
                                        <Cell key={i} fill={STATE_COLORS[i % STATE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [value, props.payload.stateName]}
                                    contentStyle={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', borderRadius: 12 }}
                                />
                                <Legend
                                    formatter={(value, entry) => entry.payload.stateName}
                                    iconType="circle"
                                    iconSize={8}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                {/* Priority Breakdown Bar */}
                <ChartCard title="Priority Breakdown" subtitle="Task count by priority level" icon={<HiOutlineFire className="w-4 h-4" />}>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                                <YAxis type="category" dataKey="priority" stroke="#94a3b8" fontSize={11} width={70} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]}>
                                    {priorityData.map((entry, i) => (
                                        <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>
            </div>
        </div>
    );
}

function StatCard({ icon, bg, label, value, sub, highlight }) {
    return (
        <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${highlight ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className={`text-2xl font-black ${highlight ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
    );
}

function ChartCard({ title, subtitle, icon, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-1">
                <div className="text-primary">{icon}</div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">{subtitle}</p>
            {children}
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="h-[260px] flex flex-col items-center justify-center text-slate-300 gap-2">
            <HiOutlineChartBar className="w-10 h-10" />
            <p className="text-sm font-medium">No data yet for this period</p>
        </div>
    );
}
