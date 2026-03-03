import { useNavigate } from 'react-router-dom';
import { useMyTasks } from '../../api/tasks';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineCheckCircle, HiArrowRight } from 'react-icons/hi';

export default function MyTasksSection({ organizationId, embedded = false }) {
    const navigate = useNavigate();
    const { data: myTasksPage, isLoading } = useMyTasks(organizationId, 10);
    const tasks = myTasksPage?.content || [];

    if (isLoading) return <div className="p-4 text-center text-slate-500">Loading tasks...</div>;
    if (tasks.length === 0) return null;

    // Group tasks
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const dueSoonTasks = tasks.filter(t => !t.isOverdue && t.daysDue <= 3 && t.daysDue >= 0);
    const upcomingTasks = tasks.filter(t => !t.isOverdue && t.daysDue > 3);

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'critical': return 'text-red-700 bg-red-50 border-red-200';
            case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const renderTaskCard = (task, type) => (
        <div
            key={task.id}
            className={`
                group relative bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                ${type === 'overdue' ? 'border-red-100 hover:border-red-300' :
                    type === 'soon' ? 'border-orange-100 hover:border-orange-300' :
                        'border-slate-200 hover:border-indigo-300'}
            `}
            onClick={() => navigate(`/projects/${organizationId}/${task.projectId}?task=${task.id}`)}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
                <span className={`text-xs font-medium ${type === 'overdue' ? 'text-red-600' :
                    type === 'soon' ? 'text-orange-600' :
                        'text-slate-500'
                    }`}>
                    {type === 'overdue' ? `Overdue ${Math.abs(task.daysDue)}d` :
                        type === 'soon' ? `Due in ${task.daysDue}d` :
                            new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
            </div>
            <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors">
                {task.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[120px]">{task.projectName}</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {task.currentState}
                </span>
            </div>
        </div>
    );

    return (
        <div className={`space-y-4 ${embedded ? '' : 'bg-white rounded-xl border border-slate-200 p-6'}`}>
            {!embedded && (
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900">My Tasks</h3>
                    <button
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        onClick={() => navigate(`/organizations/${organizationId}/tasks/my`)}
                    >
                        View All <HiArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overdueTasks.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600 pb-2 border-b border-red-100">
                            <HiOutlineClock className="w-4 h-4" />
                            Overdue ({overdueTasks.length})
                        </div>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                            {overdueTasks.map(t => renderTaskCard(t, 'overdue'))}
                        </div>
                    </div>
                )}

                {dueSoonTasks.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 pb-2 border-b border-orange-100">
                            <HiOutlineCalendar className="w-4 h-4" />
                            Due Soon ({dueSoonTasks.length})
                        </div>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                            {dueSoonTasks.map(t => renderTaskCard(t, 'soon'))}
                        </div>
                    </div>
                )}

                {upcomingTasks.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 pb-2 border-b border-emerald-100">
                            <HiOutlineCheckCircle className="w-4 h-4" />
                            Upcoming ({upcomingTasks.length})
                        </div>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                            {upcomingTasks.map(t => renderTaskCard(t, 'upcoming'))}
                        </div>
                    </div>
                )}

                {tasks.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-slate-400">
                        No tasks found.
                    </div>
                )}
            </div>
        </div>
    );
}
