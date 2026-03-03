import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api';
import useUIStore from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

export default function CreateProjectModal({ onClose, organizationId }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    const [form, setForm] = useState({ name: '', description: '' });

    const mutation = useMutation({
        mutationFn: (data) => projectsApi.create(organizationId, data),
        onSuccess: (newProject) => {
            queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
            addToast('Project created successfully', 'success');
            navigate(`/projects/${organizationId}/${newProject.id}`);
            onClose();
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to create project', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    if (!organizationId) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Project</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group mb-4">
                        <label>Project Name</label>
                        <input
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            minLength={2}
                            placeholder="e.g. Q1 Marketing Campaign"
                            autoFocus
                        />
                    </div>
                    <div className="input-group mb-4">
                        <label>Description (Optional)</label>
                        <textarea
                            className="input"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Detailed description..."
                            rows={3}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full justify-center"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <span className="spinner" /> : 'Create Project'}
                    </button>
                </form>
            </div>
        </div>
    );
}
