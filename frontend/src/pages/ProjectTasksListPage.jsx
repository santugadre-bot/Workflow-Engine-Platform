import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTasks } from '../api/tasks';
import {
    HiOutlineClipboardList, HiOutlineSearch, HiOutlineChevronRight,
    HiOutlineExclamationCircle, HiOutlineCheck, HiOutlineClock,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_ICONS = {
    DONE: <HiOutlineCheck className="w-4 h-4 text-emerald-500" />,
    COMPLETED: <HiOutlineCheck className="w-4 h-4 text-emerald-500" />,
    IN_PROGRESS: <HiOutlineClock className="w-4 h-4 text-blue-500" />,
};

/**
 * ProjectTasksListPage — read-only flat task table for REPORTER / VIEWER roles.
 * - No create/edit/delete actions visible
 * - Click any row to open the task in the Board view (for commenting/attaching)
 * - Search + status filter
 */
export default function ProjectTasksListPage() {
    const { project, organizationId, projectId } = useOutletContext();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const { data: tasks = [], isLoading } = useTasks(projectId);

    const statuses = ['ALL', ...Array.from(new Set(tasks.map(t => t.currentStateName || t.status).filter(Boolean)))];

    const filtered = tasks.filter(t => {
        const matchSearch = !search ||
            (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.assigneeName || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' ||
            (t.currentStateName || t.status) === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleRowClick = (task) => {
        navigate(`/projects/${organizationId}/${projectId}/board/${task.id}`);
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3 mb-1">
                    <HiOutlineClipboardList className="w-7 h-7 text-primary" />
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Task List</h1>
                </div>
                <p className="text-slate-500 text-sm ml-10">Read-only view · Click any task to open and comment</p>
            </div>

            {/* Reporter info banner */}
            {(project?.role === 'REPORTER' || project?.role === 'VIEWER') && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <HiOutlineExclamationCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <p className="font-semibold">{project?.role === 'VIEWER' ? 'Viewer View' : 'Reporter View'}</p>
                        <p className="text-amber-700 text-xs mt-0.5">You can view all tasks and add comments or attachments. Task creation and editing are managed by the project team.</p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                        placeholder="Search tasks or assignees…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-slate-700"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
                </select>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{filtered.length}</span> of {tasks.length} tasks
                {search && <span>· matching "<span className="font-medium text-slate-700">{search}</span>"</span>}
            </div>

            {/* Task table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <HiOutlineClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No tasks found</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Task</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs hidden md:table-cell">Status</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs hidden sm:table-cell">Priority</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs hidden lg:table-cell">Assignee</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs hidden lg:table-cell">Updated</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(task => (
                                <tr
                                    key={task.id}
                                    onClick={() => handleRowClick(task)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            {STATUS_ICONS[task.status] || <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                            <span className="font-medium text-slate-800 truncate max-w-xs">{task.title}</span>
                                        </div>
                                        {task.description && (
                                            <p className="text-xs text-slate-400 mt-0.5 ml-6 truncate max-w-xs">{task.description}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 hidden md:table-cell">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                            {task.currentStateName || task.status || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 hidden sm:table-cell">
                                        {task.priority ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {task.priority}
                                            </span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3.5 hidden lg:table-cell">
                                        {task.assigneeName ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                                    {task.assigneeName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-slate-700 text-sm">{task.assigneeName}</span>
                                            </div>
                                        ) : <span className="text-slate-300">Unassigned</span>}
                                    </td>
                                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs">
                                        {task.updatedAt ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true }) : '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <HiOutlineChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors inline" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
