import { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineViewList,
    HiOutlineViewBoards,
    HiOutlineCalendar,
    HiPlus,
    HiOutlinePlay,
} from 'react-icons/hi';
import { useTasks, useTransitionTask, useUpdateTaskGeneral } from '../api/tasks';
import { useSprints } from '../api/sprints';
import { useOrganizationMembers } from '../api/organizations';
import KanbanBoard from '../components/kanban/KanbanBoard';
import CreateTaskModal from '../components/task/CreateTaskModal';
import MyTasksCalendar from '../components/dashboard/MyTasksCalendar';
import useUIStore from '../store/uiStore';
import { canCreateIssue } from '../utils/permissions';
import ProjectToolbar from '../components/project/ProjectToolbar';
import ProjectListView from '../components/project/ProjectListView';
import BulkActionBar from '../components/task/BulkActionBar';
import TaskDrawer from '../components/task/TaskDrawer';

export default function ProjectBoardView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { project, organizationId, projectId } = useOutletContext();
    const addToast = useUIStore(s => s.addToast);

    // Parse taskId from URL for the TaskDrawer
    const searchParams = new URLSearchParams(location.search);

    // View State synced with URL
    const urlViewMode = searchParams.get('view')?.toUpperCase();
    const validViewModes = ['BOARD', 'LIST', 'CALENDAR'];
    const initialViewMode = validViewModes.includes(urlViewMode) ? urlViewMode : 'BOARD';
    const [viewMode, setLocalViewMode] = useState(initialViewMode);
    const [density, setDensity] = useState('comfortable');

    const setViewMode = (mode) => {
        setLocalViewMode(mode);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', mode.toLowerCase());
        navigate(`?${newParams.toString()}`, { replace: true });
    };

    // Filters & Selections
    const [filters, setFilters] = useState({
        search: '',
        priority: '',
        assigneeId: '',
        tags: [],
        groupBy: ''
    });
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

    const handleToggleSelect = useCallback((taskId) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => setSelectedTaskIds(new Set()), []);

    // Data Hooks
    const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useTasks(projectId, { refetchInterval: 10000 });
    const { data: sprints = [], isLoading: sprintsLoading } = useSprints(projectId);
    const { data: members = [] } = useOrganizationMembers(project?.organizationId || organizationId);

    // Active Sprint Logic
    const activeSprint = useMemo(() => {
        return sprints.find(s => s.status === 'ACTIVE');
    }, [sprints]);
    const hasSprintsConfigured = sprints.length > 0;

    const availableTags = useMemo(() =>
        [...new Set((tasks || []).flatMap(t => t.tags || []))].sort(),
        [tasks]
    );

    // Apply Toolbar Filters & Sprint Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Phase 3 Fix: If we are in BOARD view and sprints are used, ONLY show active sprint tasks
            if (viewMode === 'BOARD' && hasSprintsConfigured) {
                if (task.sprintId !== activeSprint?.id) {
                    return false;
                }
            }

            const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesPriority = !filters.priority || task.priority === filters.priority;
            const matchesAssignee = !filters.assigneeId ||
                (filters.assigneeId === 'unassigned' ? !task.assigneeId : task.assigneeId === filters.assigneeId);
            const matchesTags = filters.tags.length === 0 ||
                filters.tags.some(tag => (task.tags || []).includes(tag));

            return matchesSearch && matchesPriority && matchesAssignee && matchesTags;
        });
    }, [tasks, filters, viewMode, activeSprint, hasSprintsConfigured]);

    // Mutations
    const transitionTaskMutation = useTransitionTask(projectId);
    const updateTaskMutation = useUpdateTaskGeneral(projectId);

    const handleTransition = async (taskId, destinationStateId) => {
        const task = tasks?.find(t => t.id === taskId);
        const transition = task?.availableTransitions?.find(tr => tr.targetStateId === destinationStateId);
        if (!transition) { addToast('No valid transition', 'error'); return; }
        try {
            await transitionTaskMutation.mutateAsync({ taskId, transitionId: transition.transitionId });
            addToast('Task moved successfully', 'success');
        } catch {
            addToast('Failed to move task', 'error');
        }
    };

    const handleReorder = async (taskId, newPosition) => {
        try {
            await updateTaskMutation.mutateAsync({ taskId, data: { position: newPosition } });
            addToast('Task reordered', 'success');
        } catch {
            addToast('Failed to reorder task', 'error');
        }
    };

    const handleTaskClick = useCallback((taskOrId) => {
        const id = typeof taskOrId === 'string' ? taskOrId : taskOrId?.id;
        if (id) {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('task', id);
            navigate(`?${newSearchParams.toString()}`);
        }
    }, [navigate, searchParams]);

    const handleCloseDrawer = useCallback(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('task');
        navigate(`?${newSearchParams.toString()}`);
    }, [navigate, searchParams]);

    if (tasksLoading || (sprintsLoading && viewMode === 'BOARD')) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (tasksError) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
                <p className="font-bold text-red-600 mb-2">Failed to load tasks</p>
                <p className="text-sm text-slate-500">There was an error communicating with the server. Please try refreshing the page.</p>
            </div>
        );
    }

    const extendedToolbarProps = {
        viewMode,
        setViewMode,
        filters,
        setFilters,
        members,
        availableTags,
        density,
        setDensity
    };

    return (
        <div className="space-y-6 pb-20 relative">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Project Board</h1>
                    <p className="text-sm text-text-secondary mt-1">Manage and execute your active tasks here.</p>
                </div>
                {canCreateIssue(project?.role) && (
                    <div className="shrink-0">
                        <button
                            onClick={() => setShowCreateTask(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-sm"
                        >
                            <HiPlus className="w-5 h-5" />
                            Create Task
                        </button>
                    </div>
                )}
            </div>

            {/* ── Toolbar & View Mode Overrides ── */}
            <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center bg-bg-raised p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('BOARD')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'BOARD' ? 'bg-bg-base text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
                        >
                            <HiOutlineViewBoards className="w-4 h-4" /> Board
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-bg-base text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
                        >
                            <HiOutlineViewList className="w-4 h-4" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('CALENDAR')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'CALENDAR' ? 'bg-bg-base text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
                        >
                            <HiOutlineCalendar className="w-4 h-4" /> Calendar
                        </button>
                    </div>
                </div>

                {/* Always show toolbar for these execution views */}
                <div>
                    <ProjectToolbar {...extendedToolbarProps} hideViewSwitcher={true} />
                </div>
            </div>

            {/* ── Active Sprint Header (Agile Support) ── */}
            {viewMode === 'BOARD' && activeSprint && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <HiOutlinePlay className="w-6 h-6 ml-1" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded">Active Sprint</span>
                                <h2 className="text-xl font-bold text-text-primary px-1">{activeSprint.name}</h2>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                                <span className="flex items-center gap-1">
                                    <HiOutlineCalendar className="w-4 h-4" />
                                    {new Date(activeSprint.startDate).toLocaleDateString()} — {new Date(activeSprint.endDate).toLocaleDateString()}
                                </span>
                                {activeSprint.goal && (
                                    <span className="hidden sm:inline border-l border-border-default pl-4 italic">
                                        "{activeSprint.goal}"
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden lg:block mr-2">
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Tasks in Sprint</div>
                            <div className="text-lg font-black text-indigo-600">{filteredTasks.length}</div>
                        </div>
                        <button
                            onClick={() => navigate(`/organizations/${organizationId}/projects/${projectId}/backlog`)}
                            className="btn btn-ghost btn-sm text-text-secondary hover:text-indigo-600 hover:bg-white/50 border border-transparent hover:border-indigo-500/20"
                        >
                            View Backlog
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main Content Area ── */}
            {viewMode === 'BOARD' && (
                <div className="h-[calc(100vh-320px)] min-h-[500px] overflow-x-auto pb-4">
                    {hasSprintsConfigured && !activeSprint ? (
                        <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto p-6 bg-bg-base border-2 border-dashed border-border-default rounded-3xl">
                            <div className="w-16 h-16 bg-bg-raised rounded-full flex items-center justify-center mb-4">
                                <HiOutlineViewBoards className="w-8 h-8 text-text-muted" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">No Active Sprint</h3>
                            <p className="text-sm text-text-secondary mb-6">
                                The active board only displays tasks belonging to the current running sprint.
                                {sprints.some(s => s.status === 'FUTURE')
                                    ? " You have planned sprints ready to pull from. Go to the Backlog to start your next sprint."
                                    : " Go to the Backlog to plan and start a new sprint."}
                            </p>
                            <button
                                onClick={() => navigate(`/organizations/${organizationId}/projects/${projectId}/backlog`)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-sm transition-colors"
                            >
                                Go to Backlog
                            </button>
                        </div>
                    ) : (
                        <KanbanBoard
                            states={project?.workflow?.states || []}
                            tasks={filteredTasks}
                            onTaskClick={handleTaskClick}
                            onTaskMove={handleTransition}
                            onTaskReorder={handleReorder}
                            userRole={project?.role}
                            showStoryPoints={project?.showStoryPoints}
                            showDueDate={project?.showDueDate}
                            selectedTaskIds={selectedTaskIds}
                            onToggleSelect={handleToggleSelect}
                            viewDensity={density}
                            projectId={projectId}
                            canCreate={canCreateIssue(project?.role)}
                            groupBy={filters.groupBy}
                            members={members}
                        />
                    )}
                </div>
            )}

            {viewMode === 'LIST' && (
                <div className="h-auto pb-4">
                    <ProjectListView
                        tasks={filteredTasks}
                        onTaskClick={handleTaskClick}
                        showStoryPoints={project?.showStoryPoints}
                        showDueDate={project?.showDueDate}
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelect={handleToggleSelect}
                    />
                </div>
            )}

            {viewMode === 'CALENDAR' && (
                <div className="h-[calc(100vh-320px)] min-h-[600px]">
                    <MyTasksCalendar
                        tasks={filteredTasks}
                        organizationId={organizationId}
                        onTaskClick={handleTaskClick}
                    />
                </div>
            )}

            {/* ── Modals and Drawers ── */}
            <CreateTaskModal
                isOpen={showCreateTask}
                onClose={() => setShowCreateTask(false)}
                projectId={projectId}
                activeSprintId={activeSprint?.id}
                organizationMembers={members}
                showStoryPoints={project?.showStoryPoints}
                showDueDate={project?.showDueDate}
            />

            <BulkActionBar
                selectedIds={selectedTaskIds}
                onClear={clearSelection}
                projectId={projectId}
                members={members}
            />

            <TaskDrawer
                projectId={projectId}
                onClose={handleCloseDrawer}
            />
        </div>
    );
}
