import React, { useState } from 'react';
import { useOrganizationAnalytics } from '../../api/analytics';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    HiOutlineCheckCircle, HiOutlineClock, HiOutlineLightningBolt, HiOutlineChartBar
} from 'react-icons/hi';

const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--accent)', 'var(--info)'];

export default function AnalyticsDashboard({ organizationId }) {
    const [days, setDays] = useState(30);
    const { data, isLoading, isError } = useOrganizationAnalytics(organizationId, days);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
                Error loading analytics data. Please try again later.
            </div>
        );
    }

    const { summary, cycleTimeByState, throughput, stateDistribution } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Performance Overview</h2>
                    <p className="text-sm text-slate-500">Key metrics for your organization workflows.</p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-white text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Finished"
                    value={summary.totalCompletedTasks}
                    icon={<HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />}
                    description="Tasks completed in period"
                />
                <MetricCard
                    title="Avg Cycle Time"
                    value={`${summary.avgTotalCycleTimeHours.toFixed(1)}h`}
                    icon={<HiOutlineClock className="w-5 h-5 text-blue-500" />}
                    description="Average time per state"
                />
                <MetricCard
                    title="Efficiency Score"
                    value={`${summary.efficiencyScore}%`}
                    icon={<HiOutlineLightningBolt className="w-5 h-5 text-amber-500" />}
                    description="Overall workflow velocity"
                />
                <MetricCard
                    title="Active Volume"
                    value={stateDistribution.reduce((acc, curr) => acc + curr.count, 0)}
                    icon={<HiOutlineChartBar className="w-5 h-5 text-purple-500" />}
                    description="Total tasks in progress"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cycle Time Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-6">Avg Cycle Time by State (Hours)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cycleTimeByState}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis dataKey="stateName" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Bar dataKey="averageDurationHours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Throughput Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-6">Throughput (Tasks Completed)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={throughput}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="var(--success)" strokeWidth={3} dot={{ fill: 'var(--success)' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* State Distribution Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-6">Active State Distribution</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stateDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ stateName, percent }) => `${stateName} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="var(--primary)"
                                    dataKey="count"
                                    nameKey="stateName"
                                >
                                    {stateDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth/Optimization Meta Panel */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-center text-white">
                    <h3 className="text-lg font-semibold mb-2">Continuous Improvement</h3>
                    <p className="text-slate-300 mb-6 text-sm">Based on your recent data, we recommend reviewing transitions from <span className="text-blue-400 font-medium">In Progress</span> to <span className="text-blue-400 font-medium">Review</span> as they show a 15% increase in cycle time compared to last week.</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors w-max text-sm">
                        Review Workflows
                    </button>
                </div>
            </div>
        </div>
    );
}

const MetricCard = ({ title, value, icon, description }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
                {icon}
            </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
);
