import { useState } from 'react';
import { HiOutlineClock, HiPlus, HiPencil, HiTrash, HiOutlineExclamation } from 'react-icons/hi';
import { useSlaPolicies, useCreateSlaPolicy, useUpdateSlaPolicy, useDeleteSlaPolicy } from '../../api/sla';
import SlaPolicyModal from './SlaPolicyModal';
import useUIStore from '../../store/uiStore';

export default function SlaPolicyList({ projectId, organizationId, workflowId }) {
    const addToast = useUIStore((s) => s.addToast);
    const { data: policies, isLoading } = useSlaPolicies(projectId);

    const createMutation = useCreateSlaPolicy(projectId);
    const updateMutation = useUpdateSlaPolicy(projectId);
    const deleteMutation = useDeleteSlaPolicy(projectId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);

    const handleSave = (policyData) => {
        if (editingPolicy) {
            updateMutation.mutate({ policyId: editingPolicy.id, data: policyData }, {
                onSuccess: () => {
                    addToast('SLA Policy updated', 'success');
                    setIsModalOpen(false);
                }
            });
        } else {
            createMutation.mutate(policyData, {
                onSuccess: () => {
                    addToast('SLA Policy created', 'success');
                    setIsModalOpen(false);
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this SLA policy?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => addToast('SLA Policy deleted', 'success')
            });
        }
    };

    if (isLoading) return <div className="p-8 text-center"><div className="spinner" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold">Service Level Agreements</h2>
                    <p className="text-sm text-muted">Define time limits for tasks in specific states.</p>
                </div>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setEditingPolicy(null); setIsModalOpen(true); }}
                >
                    <HiPlus /> Add Policy
                </button>
            </div>

            <div className="grid gap-4">
                {policies?.length === 0 ? (
                    <div className="card p-8 text-center text-muted border-dashed">
                        <HiOutlineClock className="mx-auto text-4xl mb-4 opacity-20" />
                        <p>No SLA policies defined yet.</p>
                        <button className="btn btn-link btn-sm mt-2" onClick={() => setIsModalOpen(true)}>Create one now</button>
                    </div>
                ) : (
                    policies?.map(policy => (
                        <div key={policy.id} className="card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                    <HiOutlineExclamation className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{policy.name}</h3>
                                    <div className="text-sm text-muted flex gap-2 items-center flex-wrap">
                                        <span className="badge badge-outline text-xs">
                                            {policy.stateName || 'Any State'}
                                        </span>
                                        {policy.priority && (
                                            <span className="badge badge-outline text-xs">
                                                {policy.priority} Priority
                                            </span>
                                        )}
                                        <span className="text-text-primary font-medium">
                                            Max {policy.durationHours}h
                                        </span>
                                    </div>
                                    {policy.description && <p className="text-xs text-muted mt-1">{policy.description}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                <span className="text-xs uppercase font-bold text-muted mr-2">
                                    Action: {policy.actionType.replace('_', ' ')}
                                </span>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingPolicy(policy); setIsModalOpen(true); }}>
                                    <HiPencil />
                                </button>
                                <button className="btn btn-ghost btn-sm btn-icon text-error" onClick={() => handleDelete(policy.id)}>
                                    <HiTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <SlaPolicyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingPolicy}
                projectId={projectId}
                organizationId={organizationId}
                workflowId={workflowId}
            />
        </div>
    );
}
