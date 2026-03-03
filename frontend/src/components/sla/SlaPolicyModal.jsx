import { useState, useEffect } from 'react';
import { HiOutlineClock, HiOutlineX } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';

export default function SlaPolicyModal({ isOpen, onClose, onSave, initialData, projectId, organizationId, workflowId }) {
    const [policy, setPolicy] = useState({
        name: '',
        description: '',
        stateId: '',
        priority: '',
        durationHours: 24,
        actionType: 'NOTIFY_ASSIGNEE',
        active: true
    });

    // Fetch states for the workflow
    const { data: workflow } = useQuery({
        queryKey: ['workflow', workflowId],
        queryFn: () => client.get(`/workflows/${workflowId}`).then(r => r.data),
        enabled: !!workflowId
    });

    useEffect(() => {
        if (initialData) {
            setPolicy({
                ...initialData,
                stateId: initialData.stateId || '',
                priority: initialData.priority || ''
            });
        } else {
            setPolicy({
                projectId,
                organizationId,
                name: '',
                description: '',
                stateId: '',
                priority: '',
                durationHours: 24,
                actionType: 'NOTIFY_ASSIGNEE',
                active: true
            });
        }
    }, [initialData, isOpen, projectId, organizationId]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...policy };
        // Convert empty strings to null for optional fields
        if (payload.stateId === '') payload.stateId = null;
        if (payload.priority === '') payload.priority = null;

        onSave(payload);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <HiOutlineClock className="text-accent" />
                        <h2>{initialData ? 'Edit SLA Policy' : 'New SLA Policy'}</h2>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><HiOutlineX /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="label">Policy Name</label>
                        <input
                            className="input"
                            placeholder="e.g. Critical Bug Resolution"
                            value={policy.name}
                            onChange={(e) => setPolicy({ ...policy, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="label">Target State</label>
                            <select
                                className="input"
                                value={policy.stateId}
                                onChange={(e) => setPolicy({ ...policy, stateId: e.target.value })}
                            >
                                <option value="">Any State</option>
                                {workflow?.states?.map(state => (
                                    <option key={state.id} value={state.id}>{state.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Priority Filter</label>
                            <select
                                className="input"
                                value={policy.priority}
                                onChange={(e) => setPolicy({ ...policy, priority: e.target.value })}
                            >
                                <option value="">Any Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="label">Max Duration (Hours)</label>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={policy.durationHours}
                                onChange={(e) => setPolicy({ ...policy, durationHours: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">On Breach Action</label>
                            <select
                                className="input"
                                value={policy.actionType}
                                onChange={(e) => setPolicy({ ...policy, actionType: e.target.value })}
                            >
                                <option value="NOTIFY_ASSIGNEE">Notify Assignee</option>
                                <option value="NOTIFY_MANAGER">Notify Manager</option>
                                <option value="ESCALATE_PRIORITY">Escalate Priority</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Description (Optional)</label>
                        <textarea
                            className="input h-24"
                            placeholder="Explain the policy goal..."
                            value={policy.description}
                            onChange={(e) => setPolicy({ ...policy, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Policy</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
