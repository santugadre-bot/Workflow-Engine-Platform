import React, { useMemo } from 'react';
import { useMyTasks } from '../../api/tasks';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineClipboardList, HiOutlineChartPie } from 'react-icons/hi';

const PRIORITY_COLORS = {
    URGENT: '#F43F5E', // rose-500
    HIGH: '#F97316',   // orange-500
    MEDIUM: '#3B82F6', // blue-500
    LOW: '#10B981',    // emerald-500
    NONE: '#94A3B8'    // slate-400
};

const STATUS_COLORS = {
    Completed: '#10B981', // emerald-500
    'In Progress': '#3B82F6', // blue-500
    'To Do': '#64748B', // slate-500
    Blocked: '#EF4444' // red-500
};

export default function MyTasksAnalytics({ tasks: propTasks }) {
    // Fetch if not provided
    const { data, isLoading } = useMyTasks({ page: 0, size: 100 });
    const tasks = propTasks || data?.content || [];

    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'DONE').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const todo = tasks.filter(t => t.status === 'TODO').length;

        // Priority Breakdown
        const byPriority = tasks.reduce((acc, t) => {
            const p = t.priority || 'NONE';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});

        const priorityData = Object.keys(byPriority).map(key => ({
            name: key,
            value: byPriority[key]
        }));

        // Status Breakdown
        const statusData = [
            { name: 'To Do', value: todo },
            { name: 'In Progress', value: inProgress },
            { name: 'Completed', value: completed }
        ].filter(d => d.value > 0);

        // Project Breakdown (Top 5)
        const byProject = tasks.reduce((acc, t) => {
            const p = t.projectName || 'No Project';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});

        const projectData = Object.keys(byProject)
            .map(key => ({ name: key, value: byProject[key] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            total,
            completed,
            inProgress,
            todo,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            priorityData,
            statusData,
            projectData
        };
    }, [tasks]);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <HiOutlineChartPie className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No data available</h3>
                <p className="text-slate-500">Add some tasks to see your analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Tasks"
                    value={stats.total}
                    icon={<HiOutlineClipboardList className="w-6 h-6 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <StatsCard
                    title="Completed"
                    value={stats.completed}
                    icon={<HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />}
                    bg="bg-emerald-50"
                />
                <StatsCard
                    title="In Progress"
                    value={stats.inProgress}
                    icon={<HiOutlineClock className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <StatsCard
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    icon={<HiOutlineChartPie className="w-6 h-6 text-purple-600" />}
                    bg="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900 mb-6">Task Status</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#CBD5E1'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900 mb-6">Tasks by Priority</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.priorityData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#94A3B8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Projects Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-900 mb-6">Top Projects</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.projectData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, bg }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}
