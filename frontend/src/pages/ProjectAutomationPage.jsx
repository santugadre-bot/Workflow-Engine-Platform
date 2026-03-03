import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HiOutlineLightningBolt, HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import AutomationRuleModal from '../components/automation/AutomationRuleModal';
import Toggle from '../components/common/Toggle';
import { useAutomationRules, useCreateAutomationRule, useUpdateAutomationRule, useDeleteAutomationRule } from '../api/automation';
import useUIStore from '../store/uiStore';

export default function ProjectAutomationPage() {
    const { organizationId, projectId, project } = useOutletContext();
    const addToast = useUIStore((s) => s.addToast);

    const { data: rules, isLoading } = useAutomationRules(projectId);

    const createMutation = useCreateAutomationRule(projectId);
    const updateMutation = useUpdateAutomationRule(projectId);
    const deleteMutation = useDeleteAutomationRule(projectId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const handleSave = (ruleData) => {
        if (editingRule) {
            updateMutation.mutate({ ruleId: editingRule.id, rule: ruleData }, {
                onSuccess: () => {
                    addToast('Automation rule updated', 'success');
                    setIsModalOpen(false);
                }
            });
        } else {
            createMutation.mutate(ruleData, {
                onSuccess: () => {
                    addToast('Automation rule created', 'success');
                    setIsModalOpen(false);
                }
            });
        }
    };

    const handleToggle = (rule, newValue) => {
        updateMutation.mutate({
            ruleId: rule.id,
            rule: { ...rule, active: newValue }
        }, {
            onSuccess: () => addToast(`Rule ${newValue ? 'enabled' : 'disabled'}`, 'success')
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => addToast('Rule deleted', 'success')
            });
        }
    };

    const getRuleSummary = (rule) => {
        try {
            const conditions = JSON.parse(rule.conditionsJson || '[]');
            const action = JSON.parse(rule.actionConfigJson || '{}');

            let triggerText = "When task is created";
            if (rule.triggerEvent === 'TRANSITIONED') triggerText = "When task changes state";
            if (rule.triggerEvent === 'UPDATED') triggerText = "When task is updated";

            let conditionText = conditions.length > 0
                ? `if ${conditions.map(c => `${c.field} ${c.operator.toLowerCase().replace('_', ' ')} "${c.value}"`).join(' and ')}`
                : "always";

            let actionText = `then send a notification`;
            if (rule.actionType === 'UPDATE_PRIORITY') actionText = `then set priority to ${action.priority || 'HIGH'}`;

            return `${triggerText}, ${conditionText}, ${actionText}.`;
        } catch (e) {
            return `Trigger: ${rule.triggerEvent} | Action: ${rule.actionType}`;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                        <HiOutlineLightningBolt className="text-primary" />
                        Smart Automation
                    </h1>
                    <p className="text-slate-500 font-medium">Streamline your workflow with event-driven triggers and actions.</p>
                </div>
                <button className="btn btn-primary shadow-lg shadow-primary/25" onClick={() => { setEditingRule(null); setIsModalOpen(true); }}>
                    <HiPlus className="w-5 h-5 mr-1" /> New Automation Rule
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="spinner spinner-lg text-primary" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {rules?.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center group hover:bg-white hover:border-primary/30 transition-all duration-500">
                            <div className="w-20 h-20 bg-white shadow-md rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <HiOutlineLightningBolt className="text-4xl text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No active rules</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">Create rules to automatically update tasks, send notifications, and enforce business logic.</p>
                            <button className="btn btn-secondary px-8" onClick={() => setIsModalOpen(true)}>Create your first rule</button>
                        </div>
                    ) : (
                        rules?.map(rule => (
                            <div key={rule.id} className={`bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm transition-all duration-300 ${!rule.active ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-xl hover:border-primary/20 hover:translate-y-[-2px]'}`}>
                                <div className="flex items-start gap-5 flex-1">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${rule.active ? 'bg-primary/10 text-primary border-primary/10' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        <HiOutlineLightningBolt className="text-2xl" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg text-slate-900">{rule.name}</h3>
                                            {!rule.active && <span className="text-[10px] font-black uppercase text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">Inactive</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                            {getRuleSummary(rule)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t border-slate-100 md:border-t-0 pt-4 md:pt-0">
                                    <Toggle
                                        checked={rule.active}
                                        onChange={(val) => handleToggle(rule, val)}
                                        label={rule.active ? "Running" : "Paused"}
                                    />
                                    <div className="flex gap-2">
                                        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200" onClick={() => { setEditingRule(rule); setIsModalOpen(true); }} title="Edit rule">
                                            <HiPencil className="w-5 h-5" />
                                        </button>
                                        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100" onClick={() => handleDelete(rule.id)} title="Delete rule">
                                            <HiTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AutomationRuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingRule}
                organizationId={organizationId}
                project={project}
            />
        </div>
    );
}
