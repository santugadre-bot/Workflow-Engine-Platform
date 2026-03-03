import { useState } from 'react';
import { useCreateTask } from '../../api/tasks';
import useUIStore from '../../store/uiStore';

export default function CreateTaskModal({
    isOpen,
    onClose,
    projectId,
    activeSprintId, // NEW: optional sprint to attach to
    organizationMembers,
    showStoryPoints = true,
    showDueDate = true
}) {
    const addToast = useUIStore((s) => s.addToast);
    const createTaskMutation = useCreateTask(projectId);

    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        storyPoints: '',
        coverImage: '',
        tags: []
    });

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...taskForm, projectId };
            if (activeSprintId) {
                payload.sprintId = activeSprintId;
            }

            await createTaskMutation.mutateAsync(payload);
            onClose();
            setTaskForm({
                title: '',
                description: '',
                priority: 'MEDIUM',
                dueDate: '',
                storyPoints: '',
                coverImage: '',
                tags: []
            });
            addToast('Task created successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || 'Failed to create task', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Task</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleCreateTask}>
                    <div className="input-group mb-4">
                        <label>Title</label>
                        <input
                            className="input"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group mb-4">
                        <label>Description</label>
                        <textarea
                            className="input"
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-4 mb-4">
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Priority</label>
                            <select
                                className="input"
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        {showDueDate && (
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={taskForm.dueDate}
                                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                />
                            </div>
                        )}
                        {showStoryPoints && (
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Story Points</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="e.g. 5"
                                    value={taskForm.storyPoints}
                                    onChange={(e) => setTaskForm({ ...taskForm, storyPoints: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="input-group mb-4">
                        <label>Assignee</label>
                        <select
                            className="input"
                            value={taskForm.assigneeId || ''}
                            onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value || null })}
                        >
                            <option value="">Unassigned</option>
                            {organizationMembers?.map(member => (
                                <option key={member.id} value={member.userId}>
                                    {member.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group mb-4">
                        <label>Cover Image URL (Optional)</label>
                        <input
                            className="input"
                            placeholder="https://..."
                            value={taskForm.coverImage}
                            onChange={(e) => setTaskForm({ ...taskForm, coverImage: e.target.value })}
                        />
                    </div>
                    <div className="input-group mb-4">
                        <label>Tags (comma separated)</label>
                        <input
                            className="input"
                            placeholder="Design, Backend, Urgent"
                            value={taskForm.tags}
                            onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value.split(',').map(t => t.trim()) })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full justify-center"
                        disabled={createTaskMutation.isPending}
                    >
                        {createTaskMutation.isPending ? <span className="spinner" /> : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
