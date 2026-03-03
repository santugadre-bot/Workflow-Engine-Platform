import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSprintBurndown } from '../../api/sprints';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value ?? '—'} pts
                </p>
            ))}
        </div>
    );
};

export default function SprintBurndownChart({ projectId, sprintId, sprintName }) {
    const { data, isLoading, isError } = useSprintBurndown(projectId, sprintId);

    if (isLoading) return (
        <div className="flex items-center justify-center h-48">
            <div className="spinner spinner-md" />
        </div>
    );

    if (isError || !data) return (
        <div className="text-center text-text-muted text-sm py-8">
            Burndown data unavailable.
        </div>
    );

    // Filter out future days (actual is null) for display
    const chartData = (data.series || []).map(d => ({
        date: d.date?.slice(5), // MM-DD
        Ideal: d.ideal,
        Actual: d.actual,
    }));

    const remaining = data.series?.findLast?.(d => d.actual !== null)?.actual ?? data.totalPoints;
    const pct = data.totalPoints > 0
        ? Math.round(((data.totalPoints - remaining) / data.totalPoints) * 100)
        : 0;

    return (
        <div className="bg-bg-raised border border-border-subtle rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-black text-text-primary">
                        🔥 Burndown — {sprintName || data.sprintName}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                        {data.totalPoints} total pts · {remaining} remaining · {pct}% done
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        pct >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                    }`}>
                    {pct}%
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Ideal"
                        stroke="#cbd5e1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="Actual"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#6366f1' }}
                        connectNulls={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
