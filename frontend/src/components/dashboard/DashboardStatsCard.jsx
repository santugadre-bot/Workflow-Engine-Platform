import { Link } from 'react-router-dom';
import { HiOutlineFolder, HiOutlineLightningBolt, HiOutlineCheckCircle, HiOutlineUsers, HiArrowSmRight } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';

const CARD_CONFIGS = [
    {
        key: 'projects',
        label: 'Projects',
        icon: HiOutlineFolder,
        variant: 'blue',
        emoji: '📁',
        getTo: (orgId) => `/projects/${orgId}`,
        getValue: (stats) => stats.projectCount,
        description: 'Active workspaces',
    },
    {
        key: 'workflows',
        label: 'Workflows',
        icon: HiOutlineLightningBolt,
        variant: 'purple',
        emoji: '⚡',
        getTo: (orgId) => `/workflows/${orgId}`,
        getValue: (stats) => stats.workflowCount,
        description: 'Automation rules',
    },
    {
        key: 'tasks',
        label: 'Active Tasks',
        icon: HiOutlineCheckCircle,
        variant: 'green',
        emoji: '✅',
        getTo: (orgId) => `/organizations/${orgId}/tasks/my`,
        getValue: (stats) => stats.openTasksCount,
        description: 'In progress',
    },
    {
        key: 'members',
        label: 'Team Members',
        icon: HiOutlineUsers,
        variant: 'orange',
        emoji: '👥',
        getTo: (orgId) => `/organizations/${orgId}/members`,
        getValue: (stats) => stats.memberCount,
        description: 'Collaborators',
    },
];

const ICON_BG = {
    blue: 'bg-indigo-500/15 text-indigo-400',
    purple: 'bg-violet-500/15 text-violet-400',
    green: 'bg-emerald-500/15 text-emerald-400',
    orange: 'bg-orange-500/15 text-orange-400',
};

const VALUE_COLORS = {
    blue: 'text-indigo-400',
    purple: 'text-violet-400',
    green: 'text-emerald-400',
    orange: 'text-orange-400',
};

export default function DashboardStatsCard({ stats }) {
    const { activeOrganizationId } = useUIStore();

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {CARD_CONFIGS.map((card) => {
                const Icon = card.icon;
                const value = card.getValue(stats);
                return (
                    <Link
                        key={card.key}
                        to={card.getTo(activeOrganizationId)}
                        className={`stat-card stat-card-${card.variant} group`}
                    >
                        {/* Icon + arrow */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${ICON_BG[card.variant]} transition-transform duration-200 group-hover:scale-110`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <HiArrowSmRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
                        </div>

                        {/* Value */}
                        <div className={`text-4xl font-bold tabular-nums tracking-tight mb-1 ${VALUE_COLORS[card.variant]}`}>
                            {value ?? '—'}
                        </div>

                        {/* Label + description */}
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{card.label}</p>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{card.description}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
