import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    HiOutlineCheckCircle,
    HiOutlineExclamation,
    HiOutlineLightningBolt,
    HiOutlineClock,
    HiOutlineFlag,
    HiOutlineChartBar,
    HiOutlineUsers,
    HiOutlineFire,
    HiOutlineBell
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useSprints } from '../api/sprints';
import SprintBurndownChart from '../components/project/SprintBurndownChart';
import { differenceInDays, parseISO } from 'date-fns';

// ─── Simple Tooltip ───────────────────────────────────────────────────────────
function Tooltip({ content, children }) {
    return (
        <div className="group relative inline-block">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            </div>
        </div>
    );
}

const PRIORITY_COLORS = {
    URGENT: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#10b981',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        orange: 'bg-orange-50 text-orange-600',
        slate: 'bg-slate-100 text-slate-500',
    };
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
                {sub && <p className="text-[10px] items-center text-slate-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
            </div>
            <div className="h-[240px]">
                {children}
            </div>
        </div>
    );
}

// ─── Sprint Banner ────────────────────────────────────────────────────────────
function SprintBanner({ sprint }) {
    if (!sprint) {
        return (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl px-6 py-8 text-center text-slate-500">
                <HiOutlineChartBar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="font-medium">No Active Sprint</p>
                <p className="text-sm">Start a sprint to track progress here.</p>
            </div>
        );
    }
    const daysLeft = sprint.endDate ? differenceInDays(parseISO(sprint.endDate), new Date()) : null;
    const doneCount = sprint.completedTaskCount || 0;
    const total = sprint.taskCount || 0;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white px-8 py-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm shadow-indigo-200">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-200">Active Sprint</span>
                    {daysLeft !== null && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${daysLeft <= 2 ? 'bg-red-500/30 text-red-200' : 'bg-white/20 text-white/80'}`}>
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Ending today'}
                        </span>
                    )}
                </div>
                <h2 className="text-3xl font-bold">{sprint.name}</h2>
                {sprint.goal && <p className="text-sm text-indigo-200 mt-1 truncate">{sprint.goal}</p>}
            </div>

            <div className="flex items-center gap-8">
                <div className="text-center">
                    <p className="text-4xl font-black">{pct}%</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mt-1">Complete</p>
                </div>
                <div className="w-px h-16 bg-white/20" />
                <div className="text-center">
                    <p className="text-4xl font-black">{doneCount}/{total}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mt-1">Tasks Done</p>
                </div>
            </div>
        </div>
    );
}

// ─── Team Section ─────────────────────────────────────────────────────────────
function MemberCard({ member }) {
    const statusColors = {
        ONLINE: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        BUSY: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        AWAY: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
        OFFLINE: 'bg-slate-300',
    };

    const workloadColor = member.workloadScore > 80 ? 'bg-red-500' : member.workloadScore > 50 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden shadow-inner">
                        {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            member.name[0].toUpperCase()
                        )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors[member.status || 'OFFLINE']}`} title={member.status} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                    {member.role}
                </span>
            </div>

            <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900 truncate">{member.name}</h4>
                <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Workload</span>
                        <span className={member.workloadScore > 80 ? 'text-red-500' : 'text-slate-600'}>{member.workloadScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${workloadColor}`}
                            style={{ width: `${Math.min(member.workloadScore, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <HiOutlineLightningBolt className="w-3 h-3" /> Working On
                    </div>
                    <div className="space-y-1">
                        {member.activeTaskTitles?.length > 0 ? (
                            member.activeTaskTitles.map((title, i) => (
                                <div key={i} className="text-[11px] text-slate-700 truncate flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    {title}
                                </div>
                            ))
                        ) : (
                            <div className="text-[11px] text-slate-400 italic">No active tasks</div>
                        )}
                    </div>
                </div>

                {member.suggestedTaskTitles?.length > 0 && (
                    <div className="pt-2 group/suggest">
                        <Tooltip content={<div className="text-[10px] p-1 font-medium">Next best priority: {member.suggestedTaskTitles[0]}</div>}>
                            <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 cursor-help hover:text-indigo-700">
                                <HiOutlineChartBar className="w-3 h-3" /> Assignment Suggestion
                            </div>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectOverviewPage() {
    const { project, projectId } = useOutletContext();

    // Data Hooks
    const { data: sprints = [], isLoading: sprintsLoading } = useSprints(projectId);

    const activeSprint = useMemo(() => sprints.find(s => s.status === 'ACTIVE'), [sprints]);

    // Computed Stats
    const stats = useMemo(() => {
        const done = project.completedTaskCount || 0;
        const total = project.totalTaskCount || 0;
        const overdue = project.overdueTaskCount || 0;
        const inProgress = project.inProgressTaskCount || 0;
        const velocity = project.velocity || 0;

        const sprintPct = activeSprint
            ? (activeSprint.taskCount > 0 ? Math.round((activeSprint.completedTaskCount / activeSprint.taskCount) * 100) : 0)
            : null;

        return { done, overdue, inProgress, total, sprintPct, velocity };
    }, [project, activeSprint]);

    const priorityData = useMemo(() => {
        if (!project.priorityDistribution) return [];
        return ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => ({
            name: p,
            count: project.priorityDistribution[p] || 0
        })).filter(d => d.count > 0);
    }, [project.priorityDistribution]);

    const workloadData = useMemo(() => {
        if (!project.workloadDistribution) return [];
        return Object.entries(project.workloadDistribution)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [project.workloadDistribution]);

    const team = project.team || [];

    if (sprintsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Overview</h1>
                <p className="text-sm text-slate-500">High level metrics and health check for your project.</p>
            </div>

            {/* ── Header: Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={HiOutlineCheckCircle} label="Completed" value={stats.done} sub={`of ${stats.total} total`} color="emerald" />
                <StatCard icon={HiOutlineLightningBolt} label="In Progress" value={stats.inProgress} color="indigo" />
                <StatCard icon={HiOutlineExclamation} label="Overdue" value={stats.overdue} color={stats.overdue > 0 ? 'red' : 'slate'} />
                <StatCard icon={HiOutlineChartBar} label="Velocity" value={stats.velocity.toFixed(1)} sub="tasks / day" color="indigo" />
                {stats.sprintPct !== null
                    ? <StatCard icon={HiOutlineClock} label="Sprint" value={`${stats.sprintPct}%`} sub={activeSprint?.name} color="orange" />
                    : <StatCard icon={HiOutlineFlag} label="Total Tasks" value={stats.total} color="slate" />
                }
            </div>

            {/* ── Sprint Banner ── */}
            <SprintBanner sprint={activeSprint} />

            {/* ── Team Section ── */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <HiOutlineUsers className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Project Team</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {team.filter(m => m.status === 'ONLINE').length} Members Live
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {team.map(member => (
                        <MemberCard key={member.userId} member={member} />
                    ))}
                    {team.length === 0 && (
                        <div className="col-span-full py-12 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center text-slate-400">
                            <HiOutlineUsers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Invite team members to see their live status.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Insights & Burndown ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                {/* Charts Sidebar */}
                <div className="flex flex-col gap-6">
                    {priorityData.length > 0 && (
                        <ChartCard title="Priority Breakdown" icon={HiOutlineFire}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" fontSize={11} width={80} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <ChartTooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                        {priorityData.map((d, i) => (
                                            <Cell key={i} fill={PRIORITY_COLORS[d.name] || '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    {workloadData.length > 0 && (
                        <ChartCard title="Workload Distribution" icon={HiOutlineUsers}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} margin={{ top: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <ChartTooltip
                                        cursor={{ fill: '#f8fafc', radius: 8 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}
                </div>

                {/* Vertical Burndown */}
                <div className="flex flex-col gap-6">
                    {activeSprint && (
                        <div className="h-full">
                            <SprintBurndownChart projectId={projectId} sprintId={activeSprint.id} sprintName={activeSprint.name} />
                        </div>
                    )}

                    {!activeSprint && (
                        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                            <HiOutlineChartBar className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Add stats or start a sprint to see more insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
