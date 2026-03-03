import { formatDistanceToNow } from 'date-fns';
import {
    HiOutlineCheckCircle,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineArrowRight,
    HiOutlineRefresh
} from 'react-icons/hi';

export default function DashboardActivityFeed({ activities }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <p>No recent activity</p>
            </div>
        );
    }

    const getActionIcon = (actionType) => {
        const icons = {
            'TASK_CREATED': HiOutlinePlus,
            'TASK_UPDATED': HiOutlinePencil,
            'TASK_DELETED': HiOutlineTrash,
            'STATE_CHANGED': HiOutlineArrowRight,
            'PROJECT_CREATED': HiOutlinePlus,
            'WORKFLOW_CREATED': HiOutlinePlus,
            'WORKFLOW_UPDATED': HiOutlineRefresh,
            'default': HiOutlineCheckCircle
        };
        return icons[actionType] || icons['default'];
    };

    const getActionColorClasses = (actionType) => {
        if (actionType.includes('CREATED')) return 'bg-emerald-50 text-emerald-600';
        if (!actionType.includes('UPDATED')) return 'bg-blue-50 text-blue-600';
        if (actionType.includes('DELETED')) return 'bg-rose-50 text-rose-600';
        if (actionType === 'STATE_CHANGED') return 'bg-purple-50 text-purple-600';
        return 'bg-slate-50 text-slate-600';
    };

    const formatActionText = (activity) => {
        const actions = {
            'TASK_CREATED': 'created a task',
            'TASK_UPDATED': 'updated a task',
            'TASK_DELETED': 'deleted a task',
            'STATE_CHANGED': 'changed task state',
            'PROJECT_CREATED': 'created a project',
            'WORKFLOW_CREATED': 'created a workflow',
            'WORKFLOW_UPDATED': 'updated a workflow',
            'COMMENT_ADDED': 'added a comment'
        };
        return actions[activity.actionType] || activity.actionType.toLowerCase().replace('_', ' ');
    };

    return (
        <div className="divide-y divide-slate-50">
            {activities.map((activity) => {
                const Icon = getActionIcon(activity.actionType);
                const colorClass = getActionColorClasses(activity.actionType);
                const timeAgo = activity.createdAt
                    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                    : 'recently';

                return (
                    <div key={activity.id} className="group flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm leading-snug">
                                <span className="font-semibold text-slate-900">{activity.userName}</span>
                                {' '}
                                <span className="text-slate-500">{formatActionText(activity)}</span>
                            </div>
                            {activity.metadata && (
                                <div className="text-xs text-slate-500 mt-0.5 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                    {activity.metadata}
                                </div>
                            )}
                            <div className="text-xs text-slate-400 mt-1">{timeAgo}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
