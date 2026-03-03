import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import {
    HiOutlineCollection,
    HiPlus,
    HiOutlinePlay,
    HiOutlineCheckCircle,
    HiOutlineCalendar,
    HiOutlineTicket,
    HiChevronRight,
    HiChevronDown,
    HiCheck,
    HiOutlineFilter
} from 'react-icons/hi';
import { canManageSprint } from '../utils/permissions';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSprints, useCreateSprint, useAddTaskToSprint, useRemoveTaskFromSprint, useStartSprint } from '../api/sprints';
import { useTasks } from '../api/tasks';
import { useBulkTasks } from '../api/bulkTasks';
import { useOrganizationMembers } from '../api/organizations';
import useUIStore from '../store/uiStore';
import InlineStoryPoints from '../components/task/InlineStoryPoints';
import StartSprintModal from '../components/project/Backlog/StartSprintModal';
import BulkActionBar from '../components/task/BulkActionBar';
import SprintBurndownChart from '../components/project/SprintBurndownChart';
import TaskDrawer from '../components/task/TaskDrawer';
import ProjectToolbar from '../components/project/ProjectToolbar';
import CreateTaskModal from '../components/task/CreateTaskModal';

// --- Sub-components ---

function DroppableContainer({ id, children, className }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'ring-2 ring-primary ring-inset bg-primary/5 transition-all duration-200' : ''}`}
        >
            {children}
        </div>
    );
}

function SortableTask({ task, projectId, onRemove, onOpen, userRole, showStoryPoints, isSelected, onToggleSelect }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onOpen(task.id)}
            className={`group relative flex items-center gap-4 p-3 border rounded-xl hover:bg-bg-hover transition-all cursor-pointer touch-none
                ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-bg-card border-border-subtle hover:border-primary/20'}`}
        >
            {/* Checkbox */}
            {onToggleSelect && (
                <div
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all
                        ${isSelected ? 'bg-primary border-primary text-white' : 'border-border-muted opacity-0 group-hover:opacity-100'}`}
                >
                    {isSelected && <HiCheck className="w-3 h-3" />}
                </div>
            )}
            <div className="w-8 h-8 rounded bg-bg-overlay flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                <HiOutlineTicket />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary truncate">{task.title}</div>
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">TASK-{task.id.slice(0, 4)}</div>
            </div>

            {projectId && task.projectId && showStoryPoints !== false && (
                <InlineStoryPoints
                    taskId={task.id}
                    projectId={projectId}
                    initialPoints={task.storyPoints}
                    userRole={userRole}
                />
            )}

            {onRemove && (
                <button
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-text-muted hover:text-rose-500 uppercase transition-all px-2 py-1 rounded hover:bg-rose-500/10"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                    Remove
                </button>
            )}
        </div>
    );
}

export default function ProjectBacklogView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { project, organizationId, projectId } = useOutletContext();
    const addToast = useUIStore((s) => s.addToast);

    const searchParams = new URLSearchParams(location.search);

    const handleTaskClick = useCallback((taskId) => {
        if (taskId) {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('task', taskId);
            navigate(`?${newSearchParams.toString()}`);
        }
    }, [navigate, searchParams]);

    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const handleToggleSelect = useCallback((taskId) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
            return next;
        });
    }, []);
    const clearSelection = useCallback(() => setSelectedTaskIds(new Set()), []);

    // Filters
    const [filters, setFilters] = useState({ search: '', priority: '', assigneeId: '', tags: [] });
    const [showCreateTask, setShowCreateTask] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // API
    const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
    const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId);
    const { data: members = [] } = useOrganizationMembers(project?.organizationId || organizationId);

    const createSprintMutation = useCreateSprint(projectId);
    const addTaskMutation = useAddTaskToSprint(projectId);
    const removeTaskMutation = useRemoveTaskFromSprint(projectId);
    const bulkMutation = useBulkTasks(projectId);

    const [startSprintModal, setStartSprintModal] = useState({ isOpen: false, sprint: null });
    const [activeId, setActiveId] = useState(null);

    // Expand/Collapse State
    const [expandedSprints, setExpandedSprints] = useState({});

    // Initialize expanded state for sprints (ACTIVE and first PLANNED expanded by default)
    useMemo(() => {
        if (!sprints) return;
        setExpandedSprints(prev => {
            if (Object.keys(prev).length > 0) return prev; // Only init once
            const initial = {};
            let foundPlanned = false;
            sprints.forEach(s => {
                if (s.status === 'ACTIVE') initial[s.id] = true;
                else if (s.status === 'FUTURE' && !foundPlanned) {
                    initial[s.id] = true;
                    foundPlanned = true;
                } else {
                    initial[s.id] = false;
                }
            });
            return initial;
        });
    }, [sprints]);

    const toggleSprint = (sprintId) => {
        setExpandedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
    };

    // Filtering logic
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks.filter(t => {
            const matchesSearch = !filters.search || t.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesPriority = !filters.priority || t.priority === filters.priority;
            const matchesAssignee = !filters.assigneeId ||
                (filters.assigneeId === 'unassigned' ? !t.assigneeId : t.assigneeId === filters.assigneeId);
            const matchesTags = filters.tags.length === 0 || filters.tags.every(tag => t.tags?.includes(tag));
            return matchesSearch && matchesPriority && matchesAssignee && matchesTags;
        });
    }, [tasks, filters]);

    // Groups
    const sprintMap = useMemo(() => {
        const map = {};
        sprints?.forEach(s => map[s.id] = filteredTasks.filter(t => t.sprintId === s.id) || []);
        return map;
    }, [sprints, filteredTasks]);

    const backlogTasks = useMemo(() => filteredTasks.filter(t => !t.sprintId) || [], [filteredTasks]);

    const activeTask = useMemo(() => tasks?.find(t => t.id === activeId), [tasks, activeId]);

    const availableTags = useMemo(() => {
        const tags = new Set();
        tasks?.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [tasks]);

    const handleCreateSprint = () => {
        const name = prompt("Sprint Name", `Sprint ${sprints ? sprints.length + 1 : 1}`);
        if (!name) return;

        const today = new Date();
        const twoWeeks = new Date(today);
        twoWeeks.setDate(twoWeeks.getDate() + 14);

        createSprintMutation.mutate({
            name,
            goal: "",
            startDate: today.toISOString().split('T')[0],
            endDate: twoWeeks.toISOString().split('T')[0]
        }, {
            onSuccess: () => addToast('Sprint created', 'success'),
            onError: () => addToast('Failed to create sprint', 'error')
        });
    };

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        // 1. Handle sorting within the same container
        if (activeIdStr !== overIdStr) {
            const activeTaskInTasks = tasks.find(t => t.id === activeIdStr);
            const overTask = tasks.find(t => t.id === overIdStr);

            // If both are in the same sprint or both are in the backlog (intra-container)
            if (activeTaskInTasks && overTask && activeTaskInTasks.sprintId === overTask.sprintId) {
                const containerTasks = activeTaskInTasks.sprintId
                    ? sprintMap[activeTaskInTasks.sprintId]
                    : backlogTasks;

                const oldIndex = containerTasks.findIndex(t => t.id === activeIdStr);
                const newIndex = containerTasks.findIndex(t => t.id === overIdStr);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(containerTasks, oldIndex, newIndex);
                    const payload = {};
                    newOrder.forEach((t, i) => {
                        payload[t.id] = String(i);
                    });

                    bulkMutation.mutate({
                        taskIds: newOrder.map(t => t.id),
                        operation: 'REORDER',
                        payload
                    });
                    return;
                }
            }
        }

        // 2. Handle moving between containers (inter-container)
        let destinationSprintId = null;
        if (overIdStr.startsWith('sprint-')) {
            destinationSprintId = overIdStr.replace('sprint-', '');
        } else {
            const overTaskForMove = tasks.find(t => t.id === overIdStr);
            if (overTaskForMove && overTaskForMove.sprintId) destinationSprintId = overTaskForMove.sprintId;
        }

        const taskToMove = tasks.find(t => t.id === activeIdStr);
        if (!taskToMove) return;

        if (destinationSprintId) {
            if (taskToMove.sprintId === destinationSprintId) return;
            addTaskMutation.mutate({ sprintId: destinationSprintId, taskId: activeIdStr }, {
                onSuccess: () => addToast('Moved to sprint', 'success'),
            });
        } else if (overIdStr === 'backlog' || (tasks.find(t => t.id === overIdStr) && !tasks.find(t => t.id === overIdStr).sprintId)) {
            if (!taskToMove.sprintId) return;
            removeTaskMutation.mutate({ sprintId: taskToMove.sprintId, taskId: activeIdStr }, {
                onSuccess: () => addToast('Moved to backlog', 'success'),
            });
        }
    };


    if (tasksLoading || sprintsLoading) return <div className="loading-center py-20"><div className="spinner spinner-lg text-primary" /></div>;

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                <div className="flex justify-between items-center bg-bg-card p-6 rounded-3xl border border-border-subtle shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1 flex items-center gap-3">
                            <HiOutlineCollection className="text-primary w-8 h-8" />
                            Project Backlog
                        </h1>
                        <p className="text-text-muted font-medium italic">Plan sprints and manage upcoming work from your unified backlog.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5" onClick={() => setShowCreateTask(true)}>
                            <HiPlus className="w-5 h-5" /> Create Task
                        </button>
                        {canManageSprint(project?.role) && (
                            <button className="bg-bg-raised border border-border-default text-text-primary font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 hover:bg-bg-hover transition-all" onClick={handleCreateSprint}>
                                Create Sprint
                            </button>
                        )}
                    </div>
                </div>

                <ProjectToolbar
                    filters={filters}
                    setFilters={setFilters}
                    members={members}
                    availableTags={availableTags}
                    hideViewSwitcher={true}
                />

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="space-y-8">
                        {sprints?.map(sprint => {
                            const sprintTasks = sprintMap[sprint.id] || [];
                            const totalPoints = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);

                            return (
                                <div key={sprint.id} id={`sprint-${sprint.id}`} className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <div
                                        className="bg-bg-hover/50 px-6 py-4 border-b border-border-subtle flex items-center justify-between cursor-pointer hover:bg-bg-hover transition-colors"
                                        onClick={() => toggleSprint(sprint.id)}
                                    >
                                        <div className="flex flex-col gap-1 w-full pl-2">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {expandedSprints[sprint.id] ? <HiChevronDown className="text-text-muted" /> : <HiChevronRight className="text-text-muted" />}
                                                    <h3 className="font-black text-text-primary text-lg">{sprint.name}</h3>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${sprint.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-bg-overlay text-text-muted border-border-default'}`}>
                                                    {sprint.status}
                                                </span>
                                                <div className="flex items-center gap-6 text-text-muted text-xs font-bold ml-2">
                                                    <div className="flex items-center gap-1.5"><HiOutlineCalendar /> {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'No date'}</div>
                                                    {project?.showStoryPoints && (
                                                        <div className="flex items-center gap-1.5 bg-bg-overlay px-2 py-0.5 rounded-lg text-text-secondary">
                                                            <span className="text-[10px] text-text-muted uppercase">Points</span> {totalPoints}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {sprint.goal && (
                                                <div className="text-xs text-text-muted italic font-medium truncate max-w-xl ml-6">
                                                    Goal: {sprint.goal}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {sprint.status === 'FUTURE' && canManageSprint(project?.role) && (
                                                <button
                                                    className="btn btn-ghost btn-sm text-primary font-black uppercase text-[10px]"
                                                    onClick={(e) => { e.stopPropagation(); setStartSprintModal({ isOpen: true, sprint }); }}
                                                >
                                                    <HiOutlinePlay /> Start
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {expandedSprints[sprint.id] && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            {project?.showStoryPoints && (
                                                <div className="px-6 pt-3 pb-1">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                                                        <span className={totalPoints > 40 ? 'text-rose-500' : 'text-text-muted'}>
                                                            Velocity: {totalPoints} / 40 pts {totalPoints > 40 && '(Over Capacity)'}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-bg-overlay rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${totalPoints > 40 ? 'bg-rose-400' : 'bg-primary'}`}
                                                            style={{ width: `${Math.min((totalPoints / 40) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {sprint.status === 'ACTIVE' && (
                                                <div className="px-6 pt-4">
                                                    <SprintBurndownChart
                                                        projectId={projectId}
                                                        sprintId={sprint.id}
                                                        sprintName={sprint.name}
                                                    />
                                                </div>
                                            )}

                                            <SortableContext id={`sprint-${sprint.id}`} items={sprintTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                                <DroppableContainer id={`sprint-${sprint.id}`} className="p-4 space-y-2 min-h-[80px]">
                                                    {sprintTasks.length === 0 ? (
                                                        <div className={`py-8 text-center rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all duration-300
                                                            ${activeId
                                                                ? 'border-primary/50 bg-primary/5 text-primary scale-[1.02]'
                                                                : 'border-border-subtle bg-bg-overlay text-text-muted hover:border-border-default'
                                                            }`}
                                                        >
                                                            <div className={`p-3 rounded-full ${activeId ? 'bg-primary/20 animate-pulse' : 'bg-bg-card'}`}>
                                                                <HiOutlineTicket className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{activeId ? 'Drop task here to add to sprint' : 'Sprint is empty'}</p>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">
                                                                    {activeId ? 'Release to assign' : 'Drag tasks from the backlog'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        sprintTasks.map(task => (
                                                            <SortableTask
                                                                key={task.id}
                                                                task={task}
                                                                projectId={projectId}
                                                                onOpen={handleTaskClick}
                                                                onRemove={() => removeTaskMutation.mutate({ sprintId: sprint.id, taskId: task.id })}
                                                                showStoryPoints={project?.showStoryPoints}
                                                                isSelected={selectedTaskIds.has(task.id)}
                                                                onToggleSelect={handleToggleSelect}
                                                            />
                                                        ))
                                                    )}
                                                </DroppableContainer>
                                            </SortableContext>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-6 pt-10">
                        <h2 className="text-[11px] font-black text-text-muted flex items-center gap-3 uppercase tracking-[0.2em] border-b border-border-subtle pb-4">
                            Product Backlog ({backlogTasks.length})
                        </h2>

                        <SortableContext id="backlog" items={backlogTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <DroppableContainer id="backlog" className="space-y-2 pb-24 min-h-[300px]">
                                {backlogTasks.length === 0 ? (
                                    <div className="py-20 text-center bg-bg-card rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-bg-overlay rounded-full flex items-center justify-center text-emerald-500">
                                            <HiOutlineCheckCircle className="text-3xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-text-primary mb-1">Triage Complete</h3>
                                            <p className="text-text-muted max-w-sm">Your backlog is clean. Drag tasks here when you have more planning to do.</p>
                                        </div>
                                    </div>
                                ) : (
                                    backlogTasks.map(task => (
                                        <SortableTask
                                            key={task.id}
                                            task={task}
                                            projectId={projectId}
                                            onOpen={handleTaskClick}
                                            showStoryPoints={project?.showStoryPoints}
                                            userRole={project?.role}
                                            isSelected={selectedTaskIds.has(task.id)}
                                            onToggleSelect={handleToggleSelect}
                                        />
                                    ))
                                )}
                            </DroppableContainer>
                        </SortableContext>
                    </div>
                </DndContext>

                <DragOverlay>
                    {activeId && activeTask ? (
                        <div className="flex items-center gap-4 p-3 bg-bg-card border-2 border-primary rounded-xl shadow-2xl scale-105 rotate-2 cursor-grabbing z-[200]">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary"><HiOutlineTicket /></div>
                            <div className="flex-1 text-sm font-bold text-text-primary truncate">{activeTask.title}</div>
                            <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{activeTask.storyPoints || 0}</div>
                        </div>
                    ) : null}
                </DragOverlay>

                <StartSprintModal
                    isOpen={startSprintModal.isOpen}
                    onClose={() => setStartSprintModal({ isOpen: false, sprint: null })}
                    sprint={startSprintModal.sprint}
                    projectId={projectId}
                />

                <CreateTaskModal
                    isOpen={showCreateTask}
                    onClose={() => setShowCreateTask(false)}
                    projectId={projectId}
                    organizationMembers={members}
                    showStoryPoints={project?.showStoryPoints}
                    showDueDate={project?.showDueDate}
                />
            </div>

            <TaskDrawer
                taskId={searchParams.get('task')}
                projectId={projectId}
                organizationId={organizationId}
                onClose={() => {
                    const newParams = new URLSearchParams(searchParams.toString());
                    newParams.delete('task');
                    navigate(`?${newParams.toString()}`);
                }}
            />

            <BulkActionBar
                selectedIds={selectedTaskIds}
                onClear={clearSelection}
                projectId={projectId}
                members={members}
            />
        </>
    );
}
