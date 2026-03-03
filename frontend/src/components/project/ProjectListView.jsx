import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { HiOutlineUserCircle, HiFlag, HiOutlineCalendar, HiChevronUp, HiChevronDown, HiSelector } from 'react-icons/hi';

const PRIORITY_COLORS = {
    LOW: 'text-sky-500 bg-sky-50',
    MEDIUM: 'text-emerald-500 bg-emerald-50',
    HIGH: 'text-orange-500 bg-orange-50',
    CRITICAL: 'text-red-500 bg-red-50',
};

const PRIORITY_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, null: 0, undefined: 0 };

function SortIcon({ columnKey, sortConfig }) {
    if (sortConfig.key !== columnKey) {
        return <HiSelector className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors" />;
    }
    return sortConfig.direction === 'asc'
        ? <HiChevronUp className="w-3.5 h-3.5 text-primary" />
        : <HiChevronDown className="w-3.5 h-3.5 text-primary" />;
}

function SortableTh({ label, columnKey, sortConfig, onSort, className = '' }) {
    return (
        <th
            className={`px-6 py-4 cursor-pointer select-none group ${className}`}
            onClick={() => onSort(columnKey)}
        >
            <div className="flex items-center gap-1.5">
                {label}
                <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
            </div>
        </th>
    );
}

export default function ProjectListView({ tasks, onTaskClick, showDueDate = true, showStoryPoints = true }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedTasks = useMemo(() => {
        if (!sortConfig.key) return tasks;
        return [...tasks].sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;

            switch (sortConfig.key) {
                case 'title':
                    return dir * (a.title || '').localeCompare(b.title || '');
                case 'status':
                    return dir * (a.status || '').localeCompare(b.status || '');
                case 'priority':
                    return dir * ((PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0));
                case 'storyPoints':
                    return dir * ((a.storyPoints || 0) - (b.storyPoints || 0));
                case 'dueDate': {
                    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    return dir * (aDate - bDate);
                }
                default:
                    return 0;
            }
        });
    }, [tasks, sortConfig]);

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 bg-bg-base rounded-xl border border-dashed border-border-default">
                <p className="text-text-secondary">No tasks found matching your filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-bg-base rounded-xl border border-border-subtle shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-raised border-b border-border-subtle text-xs uppercase font-semibold text-text-secondary tracking-wider">
                            <th className="px-6 py-4 w-16">ID</th>
                            <SortableTh label="Task" columnKey="title" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="Status" columnKey="status" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableTh label="Priority" columnKey="priority" sortConfig={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-4">Assignee</th>
                            {showStoryPoints && (
                                <SortableTh label="Points" columnKey="storyPoints" sortConfig={sortConfig} onSort={handleSort} />
                            )}
                            {showDueDate && (
                                <SortableTh label="Due Date" columnKey="dueDate" sortConfig={sortConfig} onSort={handleSort} />
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {sortedTasks.map(task => (
                            <tr
                                key={task.id}
                                onClick={() => onTaskClick(task.id)}
                                className="hover:bg-bg-hover cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-4 text-xs font-mono text-text-muted group-hover:text-primary">
                                    #{task.id}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-text-primary group-hover:text-accent transition-colors">
                                        {task.title}
                                    </p>
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {task.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-bg-raised text-text-secondary rounded border border-border-subtle">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-raised text-text-primary border border-border-subtle">
                                        {task.status || 'To Do'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-transparent ${PRIORITY_COLORS[task.priority] || 'text-text-secondary'}`}>
                                        <HiFlag className="w-3 h-3" />
                                        {task.priority || 'None'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.assigneeId ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                {(task.assigneeName || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm text-text-secondary">{task.assigneeName}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-text-muted flex items-center gap-1 italic">
                                            <HiOutlineUserCircle className="w-4 h-4" /> Unassigned
                                        </span>
                                    )}
                                </td>
                                {showStoryPoints && (
                                    <td className="px-6 py-4">
                                        {task.storyPoints > 0 ? (
                                            <span className="px-2 py-0.5 rounded-md bg-text-primary text-bg-base text-[10px] font-black uppercase tracking-tighter">
                                                {task.storyPoints}
                                            </span>
                                        ) : (
                                            <span className="text-text-muted">-</span>
                                        )}
                                    </td>
                                )}
                                {showDueDate && (
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {task.dueDate ? (
                                            <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                                                <HiOutlineCalendar className="w-4 h-4" />
                                                {format(new Date(task.dueDate), 'MMM d')}
                                            </div>
                                        ) : (
                                            <span className="text-text-muted">-</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Footer */}
            <div className="bg-bg-raised border-t border-border-subtle p-3 text-xs text-center text-text-secondary">
                Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                {sortConfig.key && (
                    <span className="ml-2 text-primary font-medium">
                        · sorted by {sortConfig.key} ({sortConfig.direction})
                    </span>
                )}
            </div>
        </div>
    );
}
