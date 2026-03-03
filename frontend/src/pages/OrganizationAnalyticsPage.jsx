import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    HiOutlineCheckCircle, HiOutlineClock, HiOutlineLightningBolt,
    HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineCollection
} from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { useOrganizationAnalytics } from '../api/analytics';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

export default function OrganizationAnalyticsPage() {
    const { organizationId } = useParams();
    const [days, setDays] = useState(30);
    const { data, isLoading, isError } = useOrganizationAnalytics(organizationId, days);

    return (
        <AppLayout title="Analytics & Insights">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Organization Analytics</h1>
                        <p className="text-slate-500 font-medium">Cross-project performance metrics and workflow insights.</p>
                    </div>
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
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                )}

                {isError && (
                    <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100">
                        Failed to load analytics. Please try again.
                    </div>
                )}

                {data && (() => {
                    const { summary, cycleTimeByState = [], throughput = [], stateDistribution = [] } = data;
                    const activeVolume = stateDistribution.reduce((a, s) => a + s.count, 0);

                    return (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={<HiOutlineCheckCircle className="w-6 h-6 text-emerald-500" />}
                                    bg="bg-emerald-50"
                                    label="Tasks Completed"
                                    value={summary.totalCompletedTasks}
                                    sub={`Last ${days} days`}
                                />
                                <StatCard
                                    icon={<HiOutlineClock className="w-6 h-6 text-blue-500" />}
                                    bg="bg-blue-50"
                                    label="Avg Cycle Time"
                                    value={`${summary.avgTotalCycleTimeHours.toFixed(1)}h`}
                                    sub="Average time per state"
                                />
                                <StatCard
                                    icon={<HiOutlineLightningBolt className="w-6 h-6 text-amber-500" />}
                                    bg="bg-amber-50"
                                    label="Efficiency Score"
                                    value={`${summary.efficiencyScore}%`}
                                    sub="Overall workflow velocity"
                                />
                                <StatCard
                                    icon={<HiOutlineCollection className="w-6 h-6 text-purple-500" />}
                                    bg="bg-purple-50"
                                    label="Active Volume"
                                    value={activeVolume}
                                    sub="Tasks currently in progress"
                                />
                            </div>

                            {/* Charts Row 1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title="Throughput Trend" subtitle={`Tasks completed per day (last ${days}d)`} icon={<HiOutlineTrendingUp className="w-4 h-4" />}>
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
                                                <Line type="monotone" dataKey="count" name="Completed" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyChart />}
                                </ChartCard>

                                <ChartCard title="Cycle Time by State" subtitle="Avg hours tasks spend in each state" icon={<HiOutlineClock className="w-4 h-4" />}>
                                    {cycleTimeByState.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={cycleTimeByState} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="stateName" stroke="#94a3b8" fontSize={11} />
                                                <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="averageDurationHours" name="Avg Hours" radius={[4, 4, 0, 0]}>
                                                    {cycleTimeByState.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyChart />}
                                </ChartCard>
                            </div>

                            {/* Charts Row 2 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title="State Distribution" subtitle="Active tasks spread across workflow states" icon={<HiOutlineChartBar className="w-4 h-4" />}>
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
                                                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                                    labelLine={false}
                                                >
                                                    {stateDistribution.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name, props) => [value, props.payload.stateName]}
                                                    contentStyle={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', borderRadius: 12 }}
                                                />
                                                <Legend formatter={(_, entry) => entry.payload.stateName} iconType="circle" iconSize={8} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyChart />}
                                </ChartCard>

                                {/* Improvement Panel */}
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col justify-between text-white">
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">Continuous Improvement</h3>
                                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                            Based on your recent data, review transitions from{' '}
                                            <span className="text-blue-400 font-semibold">In Progress</span> to{' '}
                                            <span className="text-blue-400 font-semibold">Review</span> — they show the highest cycle time.
                                        </p>
                                        <div className="space-y-3">
                                            {cycleTimeByState.slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-300">{s.stateName}</span>
                                                    <span className="font-bold text-white">{s.averageDurationHours.toFixed(1)}h avg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                                        <span>Efficiency Score</span>
                                        <span className="text-2xl font-black text-white">{summary.efficiencyScore}%</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </AppLayout>
    );
}

function StatCard({ icon, bg, label, value, sub }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
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
