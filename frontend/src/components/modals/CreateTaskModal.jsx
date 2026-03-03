import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, projectsApi } from '../../api';
import useUIStore from '../../store/uiStore';

export default function CreateTaskModal({ onClose, organizationId }) {
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    const [projectId, setProjectId] = useState('');
    const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

    // Fetch available projects in organization
    const { data: projects } = useQuery({
        queryKey: ['projects', organizationId],
        queryFn: () => projectsApi.list(organizationId),
        enabled: !!organizationId,
    });

    // Auto-select first project
    useEffect(() => {
        if (projects && projects.length > 0 && !projectId) {
            setProjectId(projects[0].id);
        }
    }, [projects]);

    const mutation = useMutation({
        mutationFn: (data) => tasksApi.create(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: 'my-tasks' }); // Update dashboard
            addToast('Task created successfully', 'success');
            onClose();
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to create task', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!projectId) {
            addToast('Please select a project', 'error');
            return;
        }
        const data = { ...form };
        if (!data.dueDate) delete data.dueDate;
        mutation.mutate(data);
    };

    if (!organizationId) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Task</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Project Selection */}
                    <div className="input-group mb-4">
                        <label>Project</label>
                        <select
                            className="input"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a project...</option>
                            {projects?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group mb-4">
                        <label>Task Title</label>
                        <input
                            className="input"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div className="input-group mb-4">
                        <label>Description</label>
                        <textarea
                            className="input"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4 mb-4">
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Priority</label>
                            <select
                                className="input"
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Due Date</label>
                            <input
                                type="date"
                                className="input"
                                value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full justify-center"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <span className="spinner" /> : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
