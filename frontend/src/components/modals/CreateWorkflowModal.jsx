import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../../api';
import useUIStore from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

export default function CreateWorkflowModal({ onClose, organizationId }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    const [form, setForm] = useState({ name: '', description: '' });

    const mutation = useMutation({
        mutationFn: (data) => workflowsApi.create({ ...data, organizationId }),
        onSuccess: (newWorkflow) => {
            queryClient.invalidateQueries({ queryKey: ['workflows', organizationId] });
            addToast('Workflow created successfully', 'success');
            navigate(`/workflows/${organizationId}/${newWorkflow.id}`);
            onClose();
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to create workflow', 'error');
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
                    <h2>Create New Workflow</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group mb-4">
                        <label>Workflow Name</label>
                        <input
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            minLength={2}
                            placeholder="e.g. Software Development Lifecycle"
                            autoFocus
                        />
                    </div>
                    <div className="input-group mb-4">
                        <label>Description (Optional)</label>
                        <textarea
                            className="input"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the process..."
                            rows={3}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full justify-center"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <span className="spinner" /> : 'Create Workflow'}
                    </button>
                </form>
            </div>
        </div>
    );
}
