import React from 'react';
import { useWorkflow } from '../../api/workflows';
import { HiOutlineArrowRight, HiOutlineLink, HiOutlineShieldCheck } from 'react-icons/hi';

export default function WorkflowSnapshot({ workflowId }) {
    const { data: workflow, isLoading, error } = useWorkflow(workflowId);

    if (!workflowId) {
        return (
            <div className="card p-8 text-center bg-bg-base/50 border-dashed">
                <p className="text-text-secondary italic">No workflow assigned to this project.</p>
            </div>
        );
    }

    if (isLoading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>;
    if (error) return <div className="p-8 text-danger italic">Failed to load workflow snapshot.</div>;

    const { states = [], transitions = [] } = workflow;

    const getStateName = (id) => states.find(s => s.id === id)?.name || 'Unknown';
    const getStateType = (id) => states.find(s => s.id === id)?.type || 'NORMAL';

    return (
        <div className="space-y-6">
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-border-subtle bg-bg-raised flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{workflow.name}</h3>
                        <p className="text-sm text-text-secondary">Read-only view of project state machine.</p>
                    </div>
                    {workflow.active && (
                        <span className="badge badge-success flex items-center gap-1">
                            <HiOutlineShieldCheck className="w-4 h-4" /> Active
                        </span>
                    )}
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* States List */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-text-muted mb-4 tracking-wider font-mono">Workflow States</h4>
                            <div className="space-y-2">
                                {states.sort((a, b) => a.position - b.position).map(state => (
                                    <div key={state.id} className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:border-accent/30 transition-colors bg-bg-raised/30">
                                        <div className="flex items-center gap-2">
                                            <span className={`status-dot status-${state.type.toLowerCase().replace('_', '-')}`}></span>
                                            <span className="text-sm font-medium text-text-primary">{state.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-50">{state.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transitions List */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-text-muted mb-4 tracking-wider font-mono">Available Transitions</h4>
                            <div className="space-y-2">
                                {transitions.length > 0 ? transitions.map(trans => (
                                    <div key={trans.id} className="p-3 rounded-lg border border-border-subtle bg-bg-raised/30 flex items-center justify-between group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="truncate text-sm">
                                                <span className="text-text-secondary font-medium mr-1">{getStateName(trans.fromStateId)}</span>
                                                <HiOutlineArrowRight className="inline-block w-3 h-3 text-accent mx-1 opacity-50" />
                                                <span className="text-text-primary font-bold ml-1">{getStateName(trans.toStateId)}</span>
                                            </div>
                                        </div>
                                        {trans.requiresApproval && (
                                            <span className="flex-none px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-100 italic">
                                                Approval Req.
                                            </span>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-4 rounded-lg bg-bg-base/50 border border-dashed text-center">
                                        <p className="text-xs text-text-secondary italic">No transitions defined.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-bg-base border-t border-border-subtle flex items-center gap-2 text-[10px] text-text-secondary italic">
                    <HiOutlineLink className="flex-none" />
                    <span>States and transitions are defined in the Organization Workflow Editor.</span>
                </div>
            </div>
        </div>
    );
}
