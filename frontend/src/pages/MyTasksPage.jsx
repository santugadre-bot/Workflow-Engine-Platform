import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
    HiOutlineCheckCircle,
    HiOutlineViewBoards,
    HiOutlineCalendar,
    HiOutlineViewList,
    HiCheck,
    HiSearch,
    HiOutlineBriefcase,
    HiPlus,
    HiOutlineMenuAlt2,
    HiTrash,
    HiX,
    HiOutlineExclamation,
    HiOutlineFlag,
    HiOutlineCog,
    HiOutlineEye,
    HiOutlineChartPie
} from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { tasksApi } from '../api';
import useUIStore from '../store/uiStore';
import MyTasksBoard from '../components/dashboard/MyTasksBoard';
import MyTasksCalendar from '../components/dashboard/MyTasksCalendar';
import MyTasksAnalytics from '../components/dashboard/MyTasksAnalytics';
import TaskDrawer from '../components/task/TaskDrawer';
import QuickAddTaskModal from '../components/dashboard/QuickAddTaskModal';
import TaskListItem from '../components/task/TaskListItem';
import TaskSkeleton from '../components/task/TaskSkeleton';

export default function MyTasksPage() {
    const { organizationId } = useParams();
    const queryClient = useQueryClient();

    // View State
    const [viewMode, setViewMode] = useState('list'); // list, board, calendar
    const [filter, setFilter] = useState('active'); // active, all
    const [grouping, setGrouping] = useState('date'); // date, project, none
    const [viewDensity, setViewDensity] = useState('comfortable'); // comfortable, compact
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Quick Filters & Display Settings
    const [quickFilters, setQuickFilters] = useState({ overdue: false, noDate: false, blocked: false });
    const [cardSettings, setCardSettings] = useState({
        showTags: true,
        showCover: true,
        showStoryPoints: true,
        showId: false,
        showDueDate: true
    });

    // Selection State
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);

    // Data Fetching
    const { data: myTasks, isLoading } = useQuery({
        queryKey: ['my-tasks', organizationId, viewMode, filter, page, searchQuery],
        queryFn: () => tasksApi.getMyTasks(organizationId, {
            page,
            size: pageSize,
            status: filter === 'active' ? 'active' : null,
            search: searchQuery
        }),
        keepPreviousData: true
    });

    const filteredTasks = useMemo(() => {
        if (!myTasks?.content) return [];
        let tasks = myTasks.content;

        // Apply Quick Filters (Client-side)
        if (quickFilters.overdue) {
            tasks = tasks.filter(t => t.daysDue < 0 && !['DONE', 'COMPLETED'].includes(t.currentState));
        }
        if (quickFilters.noDate) {
            tasks = tasks.filter(t => !t.dueDate && !t.startDate);
        }
        if (quickFilters.blocked) {
            tasks = tasks.filter(t => t.isBlocked);
        }

        return tasks;
    }, [myTasks, quickFilters]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTaskIds.length === filteredTasks.length) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(filteredTasks.map(t => t.id));
        }
    };

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            for (const id of ids) {
                await tasksApi.delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tasks', organizationId]);
            addToast(`Deleted ${selectedTaskIds.length} tasks`, 'success');
            setSelectedTaskIds([]);
        },
        onError: () => addToast('Failed to delete tasks', 'error')
    });

    const bulkStatusMutation = useMutation({
        mutationFn: async ({ ids, status }) => {
            for (const id of ids) {
                await tasksApi.update(id, { currentState: status });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tasks', organizationId]);
            addToast('Tasks updated', 'success');
            setSelectedTaskIds([]);
        },
        onError: () => addToast('Failed to update tasks', 'error')
    });

    // Sort Helper
    const sortTasks = (tasks) => {
        return [...tasks].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle special fields
            if (sortConfig.key === 'assignee') aValue = a.assigneeName || '';
            if (sortConfig.key === 'assignee') bValue = b.assigneeName || '';
            if (sortConfig.key === 'project') aValue = a.projectName || '';
            if (sortConfig.key === 'project') bValue = b.projectName || '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Grouping Logic for List View
    const groupedTasks = useMemo(() => {
        // First, apply sorting to the filtered list
        const sorted = sortTasks(filteredTasks);

        if (grouping === 'project') {
            const byProject = {};
            sorted.forEach(t => {
                const projName = t.projectName || 'Unknown Project';
                if (!byProject[projName]) byProject[projName] = [];
                byProject[projName].push(t);
            });
            return { type: 'project', data: byProject };
        } else if (grouping === 'date') {
            // Date Grouping
            const overdue = [];
            const today = [];
            const upcoming = [];
            const noDate = [];

            sorted.forEach(t => {
                if (!t.dueDate && !t.startDate) noDate.push(t);
                else if (t.daysDue < 0) overdue.push(t);
                else if (t.daysDue === 0) today.push(t);
                else upcoming.push(t);
            });
            return { type: 'date', data: { overdue, today, upcoming, noDate } };
        } else {
            // No Grouping (Flat List)
            return { type: 'none', data: sorted };
        }
    }, [filteredTasks, grouping, sortConfig]);

    // Stats Logic
    const stats = useMemo(() => {
        if (!filteredTasks) return { overdue: 0, today: 0, upcoming: 0 };
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return filteredTasks.reduce((acc, task) => {
            if (!task.dueDate) return acc;
            const due = new Date(task.dueDate);
            due.setHours(0, 0, 0, 0);

            if (task.currentState !== 'DONE' && task.currentState !== 'COMPLETED') {
                if (due < now) acc.overdue++;
                else if (due.getTime() === now.getTime()) acc.today++;
                else acc.upcoming++;
            }
            return acc;
        }, { overdue: 0, today: 0, upcoming: 0 });
    }, [filteredTasks]);

    // Mutations
    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, ...data }) => tasksApi.update(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tasks', organizationId]);
            addToast('Task updated', 'success');
        },
        onError: () => addToast('Failed to update task', 'error')
    });

    // Handlers
    const handleTaskClick = (task) => {
        setSelectedTaskId(task.id);
        setSelectedProjectId(task.projectId);
    };

    const handleCloseDrawer = () => {
        setSelectedTaskId(null);
        setSelectedProjectId(null);
        // Refresh to show updates from drawer
        queryClient.invalidateQueries(['my-tasks', organizationId]);
    };

    const handleTaskComplete = (task) => {
        const newStatus = ['DONE', 'COMPLETED'].includes(task.currentState) ? 'TODO' : 'DONE';
        updateTaskMutation.mutate({ taskId: task.id, currentState: newStatus });
    };

    const handleBoardDragUpdate = (taskId, newStatus, newIndex) => {
        updateTaskMutation.mutate({ taskId, currentState: newStatus });
    };

    // Add toast helper if missing, or assume context. 
    // I'll assume addToast is not available and use console.error for now, or just omit onError toast if I don't have the hook.
    // I recall `useToast` or similar? `useUIStore` might have it?
    // Step 721 imports `useUIStore`.
    const addToast = useUIStore(state => state.addToast);

    return (
        <AppLayout title="My Tasks">
            <div className="max-w-7xl mx-auto pb-10 h-full flex flex-col">

                {/* Header & Controls */}
                <div className="mb-8 space-y-6">
                    {/* ... Top Row ... */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}</h1>
                            <p className="text-slate-500 mt-1">
                                You have {stats.overdue + stats.today} urgent tasks today.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsQuickAddOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <HiPlus className="w-5 h-5" />
                                New Task
                            </button>

                            {/* View Toggles */}
                            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="List View"
                                >
                                    <HiOutlineViewList className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Board View"
                                >
                                    <HiOutlineViewBoards className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Calendar View"
                                >
                                    <HiOutlineCalendar className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('analytics')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Analytics"
                                >
                                    <HiOutlineChartPie className="w-5 h-5" />
                                </button>
                            </div>

                            {/* View Settings */}
                            <div className="relative group">
                                <button
                                    className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                                    title="View Settings"
                                >
                                    <HiOutlineCog className="w-5 h-5" />
                                </button>
                                <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">Card Display</div>
                                    {[
                                        { key: 'showTags', label: 'Tags' },
                                        { key: 'showCover', label: 'Cover Image' },
                                        { key: 'showStoryPoints', label: 'Story Points' },
                                        { key: 'showDueDate', label: 'Due Date' },
                                        { key: 'showId', label: 'Task ID' },
                                    ].map(setting => (
                                        <label key={setting.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={cardSettings[setting.key]}
                                                onChange={() => setCardSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700">{setting.label}</span>
                                        </label>
                                    ))}
                                    <div className="h-px bg-slate-100 my-2" />
                                    <div className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">View Density</div>
                                    <button
                                        onClick={() => setViewDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-sm text-slate-700"
                                    >
                                        {viewDensity === 'comfortable' ? 'Switch to Compact' : 'Switch to Comfortable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setFilter('active')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All Tasks
                                </button>
                            </div>

                            {/* Quick Filters */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 ml-2">
                                <button
                                    onClick={() => setQuickFilters(prev => ({ ...prev, overdue: !prev.overdue }))}
                                    className={`p-1.5 rounded transition-colors ${quickFilters.overdue ? 'bg-red-100 text-red-600 ring-1 ring-red-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Filter Overdue"
                                >
                                    <HiOutlineExclamation className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setQuickFilters(prev => ({ ...prev, noDate: !prev.noDate }))}
                                    className={`p-1.5 rounded transition-colors ${quickFilters.noDate ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Filter No Date"
                                >
                                    <HiOutlineCalendar className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setQuickFilters(prev => ({ ...prev, blocked: !prev.blocked }))}
                                    className={`p-1.5 rounded transition-colors ${quickFilters.blocked ? 'bg-red-100 text-red-600 ring-1 ring-red-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Filter Blocked"
                                >
                                    <HiOutlineFlag className="w-4 h-4" />
                                </button>
                            </div>

                            {viewMode === 'list' && (
                                <div className="h-6 w-px bg-slate-200 mx-1" />
                            )}

                            {/* Density Toggle */}
                            {viewMode === 'list' && (
                                <button
                                    onClick={() => setViewDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable')}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                                    title={viewDensity === 'comfortable' ? "Switch to Compact Mode" : "Switch to Comfortable Mode"}
                                >
                                    {viewDensity === 'comfortable' ? (
                                        <HiOutlineMenuAlt2 className="w-5 h-5" />
                                    ) : (
                                        <HiOutlineMenuAlt2 className="w-5 h-5 rotate-90" />
                                    )}
                                </button>
                            )}

                            {(viewMode === 'list' || viewMode === 'board') && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500">Group by:</span>
                                    <select
                                        value={grouping}
                                        onChange={(e) => setGrouping(e.target.value)}
                                        className="text-xs border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-2 pr-8"
                                    >
                                        <option value="date">Date</option>
                                        <option value="project">Project</option>
                                        <option value="priority">Priority</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {isLoading ? (
                    <div className="space-y-4 py-4">
                        {[...Array(5)].map((_, i) => <TaskSkeleton key={i} />)}
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                        {viewMode === 'board' ? (
                            <div className="h-[calc(100vh-280px)] min-h-[500px]">
                                <MyTasksBoard
                                    tasks={filteredTasks}
                                    onTaskUpdate={handleBoardDragUpdate}
                                    onTaskClick={handleTaskClick}
                                    cardSettings={cardSettings}
                                    grouping={grouping}
                                    viewDensity={viewDensity}
                                />
                            </div>
                        ) : viewMode === 'calendar' ? (
                            <div className="h-full">
                                <MyTasksCalendar
                                    tasks={filteredTasks}
                                    organizationId={organizationId}
                                    onTaskClick={handleTaskClick}
                                />
                            </div>
                        ) : viewMode === 'analytics' ? (
                            <div className="h-full overflow-y-auto pb-20">
                                <MyTasksAnalytics />
                            </div>
                        ) : (
                            <div className="space-y-4 pb-20">
                                {/* List View Headers */}
                                <div className={`grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 rounded-t-lg
                                    ${viewDensity === 'compact' ? 'mb-1' : 'mb-2'}
                                `}>
                                    {/* Select All Checkbox */}
                                    <div className="col-span-1 flex items-center justify-center gap-3">
                                        <div
                                            onClick={handleSelectAll}
                                            className={`
                                                w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all
                                                ${selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-slate-300 bg-white'
                                                }
                                            `}
                                        >
                                            {selectedTaskIds.length > 0 && <div className={`bg-white ${selectedTaskIds.length === filteredTasks.length ? 'w-2 h-2 rounded-[1px]' : 'w-2 h-0.5'}`} />}
                                        </div>
                                    </div>
                                    <div
                                        className="col-span-5 cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                                        onClick={() => handleSort('title')}
                                    >
                                        Task
                                        {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                    <div
                                        className="col-span-2 cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                                        onClick={() => handleSort('project')}
                                    >
                                        Project
                                        {sortConfig.key === 'project' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                    <div
                                        className="col-span-2 cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                                        onClick={() => handleSort('priority')}
                                    >
                                        Priority
                                        {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                    <div
                                        className="col-span-2 text-right cursor-pointer hover:text-indigo-600 flex items-center justify-end gap-1"
                                        onClick={() => handleSort('dueDate')}
                                    >
                                        Due Date
                                        {sortConfig.key === 'dueDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </div>

                                {filteredTasks.length === 0 && (
                                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                                            <HiCheck className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900">No tasks found</h3>
                                        <p className="text-slate-500 mt-1">Adjust your filters or take a break!</p>
                                    </div>
                                )}

                                {/* Render Groups */}
                                {grouping === 'date' ? (
                                    <div className="space-y-6">
                                        {[
                                            { title: 'Overdue', data: groupedTasks.data.overdue, color: 'text-red-600', bg: 'bg-red-500' },
                                            { title: 'Due Today', data: groupedTasks.data.today, color: 'text-indigo-600', bg: 'bg-indigo-500' },
                                            { title: 'Upcoming', data: groupedTasks.data.upcoming, color: 'text-slate-600', bg: 'bg-slate-400' },
                                            { title: 'No Date', data: groupedTasks.data.noDate, color: 'text-slate-500', bg: 'bg-slate-300' }
                                        ].map(group => group.data.length > 0 && (
                                            <div key={group.title} className="space-y-2">
                                                <h3 className={`text-sm font-semibold ${group.color} uppercase tracking-wider flex items-center gap-2 pl-2`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${group.bg}`}></span>
                                                    {group.title} ({group.data.length})
                                                </h3>
                                                <div className="space-y-1">
                                                    {group.data.map(task => (
                                                        <TaskListItem
                                                            key={task.id}
                                                            task={task}
                                                            onToggleComplete={handleTaskComplete}
                                                            onClick={handleTaskClick}
                                                            isUpdating={updateTaskMutation.isPending}
                                                            compact={viewDensity === 'compact'}
                                                            isSelected={selectedTaskIds.includes(task.id)}
                                                            onToggleSelect={toggleTaskSelection}
                                                            onUpdate={(id, data) => updateTaskMutation.mutate({ taskId: id, ...data })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : grouping === 'project' ? (
                                    <div className="space-y-6">
                                        {Object.entries(groupedTasks.data).map(([project, tasks]) => (
                                            <div key={project} className="space-y-2">
                                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                    <HiOutlineBriefcase className="w-4 h-4 text-slate-500" />
                                                    {project}
                                                    <span className="text-slate-400 font-normal ml-auto text-xs">{tasks.length} tasks</span>
                                                </h3>
                                                <div className="space-y-1">
                                                    {tasks.map(task => (
                                                        <TaskListItem
                                                            key={task.id}
                                                            task={task}
                                                            onToggleComplete={handleTaskComplete}
                                                            onClick={handleTaskClick}
                                                            isUpdating={updateTaskMutation.isPending}
                                                            compact={viewDensity === 'compact'}
                                                            isSelected={selectedTaskIds.includes(task.id)}
                                                            onToggleSelect={toggleTaskSelection}
                                                            onUpdate={(id, data) => updateTaskMutation.mutate({ taskId: id, ...data })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* No Grouping (Flat List) */
                                    <div className="space-y-1">
                                        {groupedTasks.data.map(task => (
                                            <TaskListItem
                                                key={task.id}
                                                task={task}
                                                onToggleComplete={handleTaskComplete}
                                                onClick={handleTaskClick}
                                                isUpdating={updateTaskMutation.isPending}
                                                compact={viewDensity === 'compact'}
                                                isSelected={selectedTaskIds.includes(task.id)}
                                                onToggleSelect={toggleTaskSelection}
                                                onUpdate={(id, data) => updateTaskMutation.mutate({ taskId: id, ...data })}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Pagination Controls can remain here or move outside if needed */}
                                {viewMode === 'list' && myTasks?.totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-8">
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-slate-700">
                                            Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{myTasks.totalPages}</span>
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(myTasks.totalPages - 1, p + 1))}
                                            disabled={page >= myTasks.totalPages - 1}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Bulk Action Bar */}
            {selectedTaskIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                        <span className="font-bold">{selectedTaskIds.length}</span>
                        <span className="text-slate-400 text-sm">selected</span>
                        <button onClick={() => setSelectedTaskIds([])} className="text-slate-400 hover:text-white">
                            <HiX className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => bulkStatusMutation.mutate({ ids: selectedTaskIds, status: 'DONE' })}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            <HiCheck className="w-4 h-4" /> Mark Complete
                        </button>
                        <button
                            onClick={() => bulkDeleteMutation.mutate(selectedTaskIds)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                        >
                            <HiTrash className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* ... Drawers and Modals ... */}
            {selectedTaskId && selectedProjectId && (
                <TaskDrawer
                    projectId={selectedProjectId}
                    onClose={handleCloseDrawer}
                />
            )}
            {isQuickAddOpen && (
                <QuickAddTaskModal
                    organizationId={organizationId}
                    onClose={() => setIsQuickAddOpen(false)}
                />
            )}
        </AppLayout>
    );
}
