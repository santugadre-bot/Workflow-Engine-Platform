import { useState } from 'react';
import { useTransitionTask, useUpdateTask } from '../../../api/tasks';
import { useSprints, useAddTaskToSprint, useRemoveTaskFromSprint } from '../../../api/sprints';
import useUIStore from '../../../store/uiStore';
import { canEditTask, canTransitionTask, canAssignIssue, canLogWork, canSelfAssign } from '../../../utils/permissions';
import { useAuth } from '../../../context/AuthContext';
import { HiOutlineUserCircle, HiOutlineCalendar, HiOutlineTag, HiCheck, HiOutlineUserAdd, HiOutlineCollection, HiOutlineTicket } from 'react-icons/hi';
import InlineStoryPoints from '../InlineStoryPoints';

export default function TaskDetailSidebar({ task, projectId, userRole, showDueDate = true, showStoryPoints = true }) {
    const addToast = useUIStore((s) => s.addToast);
    const { user } = useAuth();

    // Check if current user is the creator
    const isCreator = user && (task.creatorId === user.id || task.creatorId === user.userId);
    const canEdit = canEditTask(userRole) || isCreator;

    // Check if user can assign (either full assign power or just self-assign)
    const canAssignAny = canAssignIssue(userRole);
    const canSelfAssignOnly = !canAssignAny && canSelfAssign(userRole);
    const hasAssignAccess = canAssignAny || canSelfAssignOnly;

    // API Hooks

    const updateMutation = useUpdateTask(projectId, task.id);
    const transitionMutation = useTransitionTask(projectId);
    const { data: sprints } = useSprints(projectId);
    const addTaskToSprintMutation = useAddTaskToSprint(projectId);
    const removeTaskFromSprintMutation = useRemoveTaskFromSprint(projectId);

    // Log Work state
    const [logHours, setLogHours] = useState('');
    const [logNote, setLogNote] = useState('');
    const [logSubmitting, setLogSubmitting] = useState(false);

    const handleLogWork = async () => {
        if (!logHours || isNaN(logHours) || Number(logHours) <= 0) return;
        setLogSubmitting(true);
        try {
            await updateMutation.mutateAsync({ loggedHours: Number(logHours), workNote: logNote || undefined });
            addToast(`Logged ${logHours}h`, 'success');
            setLogHours('');
            setLogNote('');
        } catch {
            addToast('Failed to log work', 'error');
        } finally {
            setLogSubmitting(false);
        }
    };


    const handlePriorityChange = (e) => {
        const priority = e.target.value;
        if (priority === task.priority) return;

        updateMutation.mutate({ priority }, {
            onSuccess: () => addToast('Priority updated', 'success'),
            onError: () => addToast('Failed to update priority', 'error')
        });
    };

    const handleTransition = (e) => {
        const transitionId = e.target.value;
        if (!transitionId) return;

        transitionMutation.mutate({ taskId: task.id, transitionId }, {
            onSuccess: () => addToast('Status updated', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Transition failed', 'error')
        });
    };

    const handleDateChange = (e) => {
        const dueDate = e.target.value;
        updateMutation.mutate({ dueDate }, {
            onSuccess: () => addToast('Due date updated', 'success'),
            onError: () => addToast('Failed to update due date', 'error')
        });
    };

    const handleStartDateChange = (e) => {
        const startDate = e.target.value ? new Date(e.target.value).toISOString() : null;
        updateMutation.mutate({ startDate }, {
            onSuccess: () => addToast('Start date updated', 'success'),
            onError: () => addToast('Failed to update start date', 'error')
        });
    };

    const handleEndDateChange = (e) => {
        const endDate = e.target.value ? new Date(e.target.value).toISOString() : null;
        updateMutation.mutate({ endDate }, {
            onSuccess: () => addToast('End date updated', 'success'),
            onError: () => addToast('Failed to update end date', 'error')
        });
    };

    const handleSprintChange = (e) => {
        const sprintId = e.target.value;
        if (sprintId === (task.sprintId || '')) return;

        if (!sprintId) {
            // Move to Backlog
            removeTaskFromSprintMutation.mutate({ sprintId: task.sprintId, taskId: task.id }, {
                onSuccess: () => addToast('Moved to backlog', 'success'),
                onError: () => addToast('Failed to move to backlog', 'error')
            });
        } else {
            // Move to Sprint
            addTaskToSprintMutation.mutate({ sprintId, taskId: task.id }, {
                onSuccess: () => addToast('Moved to sprint', 'success'),
                onError: () => addToast('Failed to move to sprint', 'error')
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 pl-2">
            {/* Status Section */}
            <div className="sidebar-section">
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Status</label>
                <div className="relative">
                    <select
                        className="w-full appearance-none bg-bg-raised border border-border-default rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-accent/20 cursor-pointer hover:border-text-secondary transition-colors"
                        value=""
                        onChange={handleTransition}
                        disabled={!canTransitionTask(userRole) || updateMutation.isPending}
                    >
                        <option value="" disabled>{task.currentStateName}</option>
                        {task.availableTransitions?.map((t) => (
                            <option key={t.transitionId} value={t.transitionId}>
                                ➔ {t.targetStateName} ({t.transitionName})
                            </option>
                        ))}
                        {(!task.availableTransitions || task.availableTransitions.length === 0) && (
                            <option disabled>No transitions available</option>
                        )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <HiCheck className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Sprint/Iteration Section */}
            <div className="sidebar-section">
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Iteration</label>
                <div className="relative">
                    <select
                        className="w-full appearance-none bg-bg-raised border border-border-default rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-accent/20 cursor-pointer hover:border-text-secondary transition-colors"
                        value={task.sprintId || ''}
                        onChange={handleSprintChange}
                        disabled={!canEdit || addTaskToSprintMutation.isPending}
                    >
                        <option value="">Product Backlog</option>
                        {sprints?.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.status})
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <HiOutlineCollection className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Priority Section */}
            <div className="sidebar-section">
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Priority</label>
                <div className="relative">
                    <select
                        className={`w-full appearance-none bg-bg-raised border border-border-default rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-accent/20 cursor-pointer hover:border-text-secondary transition-colors badge-priority-${task.priority}`}
                        value={task.priority}
                        onChange={handlePriorityChange}
                        disabled={!canEdit || updateMutation.isPending}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>
            </div>

            {/* Assignee Section */}
            <div className="sidebar-section">
                <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Assignee</label>
                <div className="relative">
                    {/* If they can assign ANYONE, show a standard select (needs member list to be passed in to work fully, but mimicking the button logic here) */}
                    {canAssignAny ? (
                        <button
                            className="flex items-center gap-2 w-full text-left bg-bg-raised border border-border-subtle rounded-md px-3 py-2 transition-colors hover:bg-bg-hover"
                        // onClick={() => openAssigneeModal()} -> If this existed
                        >
                            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                                {(task.assigneeName || 'U')[0]}
                            </div>
                            <span className="text-sm text-text-primary truncate flex-1">
                                {task.assigneeName || 'Unassigned'}
                            </span>
                        </button>
                    ) : canSelfAssignOnly ? (
                        /* Self-Assign Only Logic: One-click button to assign to self, or disabled if already assigned */
                        <button
                            onClick={() => {
                                if (task.assigneeId !== (user?.id || user?.userId)) {
                                    updateMutation.mutate({ assigneeId: user?.id || user?.userId });
                                }
                            }}
                            disabled={task.assigneeId === (user?.id || user?.userId) || updateMutation.isPending}
                            className={`flex items-center gap-2 w-full text-left bg-bg-raised border border-border-subtle rounded-md px-3 py-2 transition-colors ${task.assigneeId !== (user?.id || user?.userId) ? 'hover:bg-bg-hover cursor-pointer' : 'opacity-80 cursor-default'}`}
                            title={task.assigneeId === (user?.id || user?.userId) ? "Assigned to you" : "Click to assign to yourself"}
                        >
                            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                                {(task.assigneeName || 'U')[0]}
                            </div>
                            <span className="text-sm text-text-primary truncate flex-1">
                                {task.assigneeName || 'Unassigned'}
                            </span>
                            {task.assigneeId !== (user?.id || user?.userId) && (
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded whitespace-nowrap">Assign to me</span>
                            )}
                        </button>
                    ) : (
                        /* Completely disabled */
                        <button
                            disabled
                            className="flex items-center gap-2 w-full text-left bg-bg-raised border border-border-default rounded-md px-3 py-2 cursor-not-allowed opacity-80"
                        >
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                                {(task.assigneeName || 'U')[0]}
                            </div>
                            <span className="text-sm text-text-secondary truncate flex-1">
                                {task.assigneeName || 'Unassigned'}
                            </span>
                            <HiOutlineUserAdd className="ml-auto text-text-muted w-3 h-3" title="No permission to assign" />
                        </button>
                    )}
                </div>
            </div>

            {/* Story Points Section */}
            {showStoryPoints && (
                <div className="sidebar-section">
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Story Points</label>
                    <div className="inline-flex items-center gap-2">
                        <InlineStoryPoints
                            taskId={task.id}
                            projectId={projectId}
                            initialPoints={task.storyPoints}
                            userRole={userRole}
                        />
                    </div>
                </div>
            )}

            {/* Dates / Schedule Section */}
            <div className="sidebar-section">
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Schedule</label>
                <div className="space-y-3">
                    {/* Start Date */}
                    <div>
                        <label className="text-[10px] text-text-muted uppercase block mb-1">Start</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-bg-raised border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/20 cursor-pointer"
                            value={task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : ''}
                            onChange={handleStartDateChange}
                            disabled={!canEdit}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-[10px] text-text-muted uppercase block mb-1">End</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-bg-raised border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/20 cursor-pointer"
                            value={task.endDate ? new Date(task.endDate).toISOString().slice(0, 16) : ''}
                            onChange={handleEndDateChange}
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Due Date (Deadline) */}
                    {showDueDate && (
                        <div>
                            <label className="text-[10px] text-text-muted uppercase block mb-1">Deadline</label>
                            <input
                                type="date"
                                className="w-full bg-bg-raised border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/20 cursor-pointer"
                                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                onChange={handleDateChange}
                                disabled={!canEdit}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Log Work — DEVELOPER and above only */}
            {canLogWork(userRole) && (
                <div className="sidebar-section pt-4 border-t border-border-subtle">
                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">⏱ Log Work</label>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0.25"
                                step="0.25"
                                placeholder="Hours (e.g. 1.5)"
                                className="flex-1 bg-bg-raised border border-border-subtle rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none"
                                value={logHours}
                                onChange={e => setLogHours(e.target.value)}
                            />
                            <button
                                onClick={handleLogWork}
                                disabled={!logHours || logSubmitting}
                                className="btn btn-primary btn-sm shrink-0"
                            >
                                Log
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Note (optional)"
                            className="w-full bg-bg-raised border border-border-subtle rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none"
                            value={logNote}
                            onChange={e => setLogNote(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Metadata (Read Only) */}
            <div className="sidebar-section pt-4 border-t border-border-subtle">
                <div className="flex justify-between text-xs text-text-muted mb-2">
                    <span>Creator</span>
                    <span>{task.creatorName || 'System'}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted mb-2">
                    <span>Created</span>
                    <span>{new Date(task.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted mb-2">
                    <span>Updated</span>
                    <span>{new Date(task.updatedAt || task.createdAt).toLocaleString()}</span>
                </div>
                {task.resolvedAt && (
                    <div className="flex justify-between text-xs text-text-muted">
                        <span>Resolved</span>
                        <span>{new Date(task.resolvedAt).toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
