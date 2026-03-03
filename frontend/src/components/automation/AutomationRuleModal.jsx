import { useState, useEffect } from 'react';
import { HiOutlineLightningBolt, HiOutlineX } from 'react-icons/hi';
import ConditionBuilder from './ConditionBuilder';
import { useOrganizationMembers } from '../../api/organizations';
import { useWorkflow } from '../../api/workflows';

export default function AutomationRuleModal({ isOpen, onClose, onSave, initialData, organizationId, project }) {
    const [rule, setRule] = useState({
        name: '',
        description: '',
        triggerEvent: 'CREATED',
        actionType: 'NOTIFY',
        active: true,
        actionConfigJson: '{}',
        conditionsJson: '[]'
    });

    const [actionConfig, setActionConfig] = useState({});

    // Data Fetching for Advanced Actions
    const { data: members = [] } = useOrganizationMembers(organizationId);
    const { data: workflow } = useWorkflow(project?.workflowId);

    // Get transitions from workflow. We flatten all transitions across all states for simplicity,
    // though ideally the action UI might group them by "Target State".
    const allTransitions = (workflow?.states || []).flatMap(state => state.transitions || []);

    // Helper to get state name by ID
    const getStateName = (stateId) => {
        const state = workflow?.states?.find(s => s.id === stateId);
        return state ? state.name : 'Unknown State';
    };

    useEffect(() => {
        if (initialData) {
            setRule(initialData);
            try {
                setActionConfig(JSON.parse(initialData.actionConfigJson || '{}'));
            } catch (e) {
                setActionConfig({});
            }
        } else {
            setRule({
                name: '',
                description: '',
                triggerEvent: 'CREATED',
                actionType: 'NOTIFY',
                active: true,
                actionConfigJson: '{}',
                conditionsJson: '[]'
            });
            setActionConfig({});
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        setRule(prev => ({ ...prev, actionConfigJson: JSON.stringify(actionConfig) }));
    }, [actionConfig]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(rule);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <HiOutlineLightningBolt className="text-accent" />
                        <h2>{initialData ? 'Edit Automation' : 'New Automation'}</h2>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><HiOutlineX /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="label">Rule Name</label>
                            <input
                                className="input"
                                placeholder="e.g. Notify on High Priority"
                                value={rule.name}
                                onChange={(e) => setRule({ ...rule, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Trigger Event</label>
                            <select
                                className="input"
                                value={rule.triggerEvent}
                                onChange={(e) => setRule({ ...rule, triggerEvent: e.target.value })}
                            >
                                <option value="CREATED">When Task is Created</option>
                                <option value="TRANSITIONED">When Task Changes State</option>
                                <option value="UPDATED">When Task Metadata Updates</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Action Type</label>
                            <select
                                className="input"
                                value={rule.actionType}
                                onChange={(e) => {
                                    setRule({ ...rule, actionType: e.target.value });
                                    setActionConfig({}); // Reset config on type change
                                }}
                            >
                                <option value="NOTIFY">Send Notification</option>
                                <option value="UPDATE_PRIORITY">Set Priority</option>
                                <option value="REASSIGN">Reassign Task</option>
                                {workflow && <option value="UPDATE_STATUS">Update Status (Transition)</option>}
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                        <label className="label mb-2">Conditions (ALL must be true)</label>
                        <ConditionBuilder
                            value={rule.conditionsJson}
                            onChange={(json) => setRule({ ...rule, conditionsJson: json })}
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <label className="label mb-3">Action Configuration</label>

                        {rule.actionType === 'NOTIFY' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted">Recipient</label>
                                    <select
                                        className="input text-sm mt-1"
                                        value={actionConfig.recipient || 'ASSIGNEE'}
                                        onChange={(e) => setActionConfig({ ...actionConfig, recipient: e.target.value })}
                                    >
                                        <option value="ASSIGNEE">Task Assignee</option>
                                        <option value="PROJECT_OWNER">Project Owner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted">Message Template</label>
                                    <input
                                        className="input text-sm mt-1"
                                        placeholder="Enter notification message..."
                                        value={actionConfig.message || ''}
                                        onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {rule.actionType === 'UPDATE_PRIORITY' && (
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted">Set Priority To</label>
                                <select
                                    className="input text-sm mt-1"
                                    value={actionConfig.priority || 'HIGH'}
                                    onChange={(e) => setActionConfig({ ...actionConfig, priority: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                        )}

                        {rule.actionType === 'REASSIGN' && (
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted">Assign To</label>
                                <select
                                    className="input text-sm mt-1"
                                    value={actionConfig.assigneeId || ''}
                                    onChange={(e) => setActionConfig({ ...actionConfig, assigneeId: e.target.value })}
                                >
                                    <option value="">-- Select Member --</option>
                                    {members.map(member => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.name || member.email} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {rule.actionType === 'UPDATE_STATUS' && (
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted">Execute Workflow Transition</label>
                                <select
                                    className="input text-sm mt-1"
                                    value={actionConfig.transitionId || ''}
                                    onChange={(e) => setActionConfig({ ...actionConfig, transitionId: e.target.value })}
                                >
                                    <option value="">-- Select Transition --</option>
                                    {workflow?.states?.map(state => (
                                        state.transitions?.length > 0 && (
                                            <optgroup key={state.id} label={`From: ${state.name}`}>
                                                {state.transitions.map(transition => (
                                                    <option key={transition.id} value={transition.id}>
                                                        {transition.name} ➔ {getStateName(transition.targetStateId)}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )
                                    ))}
                                </select>
                                <p className="text-xs text-muted mt-2 leading-relaxed">
                                    The automation will explicitly trigger this defined workflow transition. Ensure the conditions match the task's state.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={rule.active}
                                onChange={(e) => setRule({ ...rule, active: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Enable Rule</span>
                        </label>

                        <div className="flex gap-3">
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Rule</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
