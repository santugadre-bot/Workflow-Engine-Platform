import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactFlowProvider } from 'reactflow';
import {
    HiOutlineLightningBolt, HiOutlinePlus,
    HiOutlineSwitchHorizontal, HiOutlineDocumentDuplicate,
    HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineExclamation,
    HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronRight,
    HiOutlineLockClosed, HiCheck,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import StatePropertyPanel from '../components/workflow/StatePropertyPanel';
import TransitionPropertyPanel from '../components/workflow/TransitionPropertyPanel';

import { projectsApi, workflowsApi, organizationsApi } from '../api';
import {
    useWorkflow, useWorkflows, useAddState, useAddTransition,
    useActivateWorkflow, useUpdateWorkflow, useDeleteState,
    useDeleteTransition, useUpdateStatePositions, useUpdateState,
    useUpdateTransition, useCreateWorkflow,
} from '../api/workflows';
import { useAuth } from '../context/AuthContext';
import useUIStore from '../store/uiStore';
import { WORKFLOW_TEMPLATES } from '../data/workflowTemplates';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSystemRole(user) {
    if (user?.systemRole) return user.systemRole;
    try {
        const s = localStorage.getItem('user');
        if (s) return JSON.parse(s)?.systemRole;
    } catch (_) { }
    return null;
}

function buildValidationErrors(workflow) {
    if (!workflow) return [];
    const { states = [], transitions = [] } = workflow;
    const errors = [];

    const hasStart = states.some(s => s.type === 'START');
    const hasEnd = states.some(s => s.type === 'END' || s.type === 'DONE');
    if (!hasStart) errors.push({ level: 'error', msg: 'No START state defined' });
    if (!hasEnd) errors.push({ level: 'error', msg: 'No END or DONE state defined' });

    states.forEach(state => {
        const hasOut = transitions.some(t => t.fromStateId === state.id);
        const hasIn = transitions.some(t => t.toStateId === state.id);
        if (!hasOut && state.type !== 'END' && state.type !== 'DONE') {
            errors.push({ level: 'warning', msg: `"${state.name}" has no outgoing transitions` });
        }
        if (!hasIn && state.type !== 'START') {
            errors.push({ level: 'warning', msg: `"${state.name}" is unreachable (no incoming transitions)` });
        }
    });

    if (states.length < 2)
        errors.push({ level: 'error', msg: 'Need at least 2 states' });

    return errors;
}

const STATE_TYPES = [
    { value: 'START', label: 'Start' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'END', label: 'End' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ValidationPanel({ workflow }) {
    const errors = buildValidationErrors(workflow);
    const [open, setOpen] = useState(true);
    if (!workflow) return null;
    const errCount = errors.filter(e => e.level === 'error').length;
    const warnCount = errors.filter(e => e.level === 'warning').length;

    return (
        <div className="border border-border-subtle rounded-xl overflow-hidden mb-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-overlay hover:bg-bg-raised transition-colors text-sm font-medium text-text-secondary"
            >
                <span className="flex items-center gap-2">
                    {errCount > 0
                        ? <HiOutlineExclamationCircle className="w-4 h-4 text-danger" />
                        : warnCount > 0
                            ? <HiOutlineExclamation className="w-4 h-4 text-amber-500" />
                            : <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />}
                    Health Check
                    {(errCount > 0 || warnCount > 0) && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-danger/10 text-danger font-semibold">
                            {errCount + warnCount}
                        </span>
                    )}
                </span>
                {open ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronRight className="w-4 h-4" />}
            </button>
            {open && (
                <div className="px-4 py-3 space-y-1.5 bg-bg-base border-t border-border-subtle">
                    {errors.length === 0 ? (
                        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                            <HiCheck className="w-3.5 h-3.5" /> Workflow is valid and ready to activate
                        </p>
                    ) : errors.map((e, i) => (
                        <p key={i} className={`text-xs flex items-start gap-1.5 ${e.level === 'error' ? 'text-danger' : 'text-amber-600'}`}>
                            {e.level === 'error'
                                ? <HiOutlineExclamationCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                : <HiOutlineExclamation className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                            {e.msg}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

function HistoryPanel({ workflow }) {
    const [open, setOpen] = useState(false);
    if (!workflow) return null;
    const items = [
        { label: `Workflow created`, time: workflow.createdAt },
        ...(workflow.states || []).map(s => ({ label: `State "${s.name}" added`, time: s.createdAt })),
        ...(workflow.transitions || []).map(t => ({ label: `Transition "${t.name}" added`, time: t.createdAt })),
    ].filter(i => i.time).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);

    return (
        <div className="border border-border-subtle rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-overlay hover:bg-bg-raised transition-colors text-sm font-medium text-text-secondary"
            >
                <span className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4" /> History</span>
                {open ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronRight className="w-4 h-4" />}
            </button>
            {open && (
                <div className="px-4 py-3 space-y-2 bg-bg-base border-t border-border-subtle max-h-64 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="text-xs text-text-muted">No history available</p>
                    ) : items.map((item, i) => (
                        <div key={i} className="flex justify-between gap-2">
                            <p className="text-xs text-text-secondary">{item.label}</p>
                            <p className="text-xs text-text-muted shrink-0">
                                {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TemplateCard({ template, onApply, loading }) {
    return (
        <button
            onClick={() => onApply(template)}
            disabled={loading}
            className={`flex flex-col items-start gap-2 p-4 border rounded-xl text-left transition-all hover:shadow-md hover:border-brand-500/40 hover:-translate-y-0.5 group ${template.color} border bg-opacity-50`}
        >
            <div className="text-2xl">{template.icon}</div>
            <div>
                <p className="font-semibold text-sm text-text-primary">{template.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{template.description}</p>
            </div>
            <p className="text-xs text-text-muted">{template.states.length} states · {template.transitions.length} transitions</p>
        </button>
    );
}

// ─── No Workflow State ────────────────────────────────────────────────────────

function NoWorkflowView({ organizationId, projectId, canEdit, onWorkflowCreated }) {
    const addToast = useUIStore(s => s.addToast);
    const queryClient = useQueryClient();
    const [showExisting, setShowExisting] = useState(false);
    const [applying, setApplying] = useState(null);
    const [newWfName, setNewWfName] = useState('');
    const [showNameForm, setShowNameForm] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState(null);

    const { data: orgWorkflows } = useWorkflows(organizationId);
    const createMutation = useCreateWorkflow(organizationId);

    const applyTemplate = async (template, workflowName) => {
        setApplying(template.id);
        try {
            // 1. Create workflow
            const wf = await workflowsApi.create(organizationId, {
                name: workflowName || template.name,
                description: template.description,
            });

            // 2. Add states sequentially, keep track of their IDs by position index
            const createdStates = [];
            for (const s of template.states) {
                const created = await workflowsApi.addState(wf.id, {
                    name: s.name,
                    type: s.type,
                    position: s.position,
                    positionX: s.position * 240,
                    positionY: 120,
                    ...(s.wipLimit ? { wipLimit: s.wipLimit } : {}),
                });
                createdStates.push(created);
            }

            // 3. Add transitions — resolve from/to by position index
            for (const t of template.transitions) {
                const fromState = createdStates[t.from];
                const toState = createdStates[t.to];
                if (!fromState || !toState) continue;
                await workflowsApi.addTransition(wf.id, {
                    name: t.name,
                    fromStateId: fromState.id,
                    toStateId: toState.id,
                    requiresApproval: t.requiresApproval || false,
                });
            }

            // 4. Assign to project
            await workflowsApi.assignToProject(wf.id, projectId);

            queryClient.invalidateQueries({ queryKey: ['projects', organizationId, projectId] });
            addToast(`Workflow "${workflowName || template.name}" created!`, 'success');
            onWorkflowCreated(wf.id);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to apply template', 'error');
        } finally {
            setApplying(null);
        }
    };

    const useExisting = async (wfId) => {
        try {
            await workflowsApi.assignToProject(wfId, projectId);
            queryClient.invalidateQueries({ queryKey: ['projects', organizationId, projectId] });
            addToast('Workflow assigned!', 'success');
            const wf = orgWorkflows.find(w => w.id === wfId);
            onWorkflowCreated(wfId);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to assign workflow', 'error');
        }
    };

    const cloneWorkflow = async (wf) => {
        // Clone: create new + re-create all states + transitions
        const cloneName = `${wf.name} (Copy)`;
        const fullWf = await workflowsApi.getById(wf.id);
        const fakeTemplate = {
            id: 'clone',
            name: cloneName,
            description: wf.description || '',
            states: (fullWf.states || []).map((s, i) => ({
                name: s.name, type: s.type, position: s.position
            })),
            transitions: [],
        };
        // Map state transitions to indices
        const stateIndex = (id) => (fullWf.states || []).findIndex(s => s.id === id);
        fakeTemplate.transitions = (fullWf.transitions || []).map(t => ({
            name: t.name,
            from: stateIndex(t.fromStateId),
            to: stateIndex(t.toStateId),
            requiresApproval: t.requiresApproval,
        }));
        await applyTemplate(fakeTemplate, cloneName);
    };

    if (!canEdit) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                <div className="w-16 h-16 bg-bg-overlay rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineLightningBolt className="w-8 h-8 text-text-muted" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">No Workflow Configured</h2>
                <p className="text-text-secondary text-sm max-w-sm">
                    A workflow hasn't been set up for this project yet. Contact your project admin to configure one.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-10 px-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <HiOutlineLightningBolt className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Set Up Workflow</h1>
                    <p className="text-sm text-text-muted">Choose a template or use an existing one</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">Start from a Template</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {WORKFLOW_TEMPLATES.map(t => (
                        <TemplateCard
                            key={t.id}
                            template={t}
                            loading={applying === t.id}
                            onApply={(tmpl) => {
                                setPendingTemplate(tmpl);
                                setNewWfName(tmpl.name);
                                setShowNameForm(true);
                            }}
                        />
                    ))}
                </div>
            </div>

            {orgWorkflows && orgWorkflows.length > 0 && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowExisting(v => !v)}
                        className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand-500 transition-colors"
                    >
                        {showExisting ? <HiOutlineChevronDown className="w-4 h-4" /> : <HiOutlineChevronRight className="w-4 h-4" />}
                        Use Existing Workflow ({orgWorkflows.length})
                    </button>

                    {showExisting && (
                        <div className="mt-3 space-y-2">
                            {orgWorkflows.map(wf => (
                                <div key={wf.id} className="flex items-center justify-between p-3 border border-border-subtle rounded-xl bg-bg-overlay">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{wf.name}</p>
                                        <p className="text-xs text-text-muted">
                                            {wf.active ? '✅ Active' : '📝 Draft'} · {wf.states?.length || 0} states
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => cloneWorkflow(wf)}
                                            title="Clone & Edit"
                                        >
                                            <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                                            Clone
                                        </button>
                                        {wf.active && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => useExisting(wf.id)}
                                            >
                                                Use This
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Name Prompt Modal */}
            {showNameForm && pendingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-bg-raised rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-text-primary mb-1">{pendingTemplate.icon} {pendingTemplate.name} Template</h3>
                        <p className="text-sm text-text-muted mb-4">Give your workflow a name</p>
                        <input
                            className="input w-full mb-4"
                            value={newWfName}
                            onChange={e => setNewWfName(e.target.value)}
                            placeholder="Workflow name"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button className="btn btn-secondary flex-1" onClick={() => { setShowNameForm(false); setPendingTemplate(null); }}>Cancel</button>
                            <button
                                className="btn btn-primary flex-1"
                                disabled={!newWfName.trim() || applying === pendingTemplate.id}
                                onClick={() => {
                                    setShowNameForm(false);
                                    applyTemplate(pendingTemplate, newWfName.trim());
                                }}
                            >
                                {applying ? <span className="spinner" /> : 'Create Workflow'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Workflow Switcher Modal ───────────────────────────────────────────────────

function WorkflowSwitcherModal({ organizationId, projectId, currentWfId, onClose, onSwitch }) {
    const addToast = useUIStore(s => s.addToast);
    const { data: workflows } = useWorkflows(organizationId);
    const [selected, setSelected] = useState(null);
    const active = workflows?.filter(w => w.active && w.id !== currentWfId) || [];

    const handleSwitch = async () => {
        if (!selected) return;
        try {
            await workflowsApi.assignToProject(selected, projectId);
            addToast('Workflow switched!', 'success');
            onSwitch(selected);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to switch', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-bg-raised rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-text-primary mb-1">Switch Workflow</h3>
                <p className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
                    ⚠️ Switching workflow may affect how tasks move through stages. Existing task statuses will be preserved but transitions may change.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {active.length === 0 ? (
                        <p className="text-sm text-text-muted text-center py-4">No other active workflows available</p>
                    ) : active.map(wf => (
                        <label key={wf.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selected === wf.id ? 'border-brand-500 bg-brand-500/5' : 'border-border-subtle hover:border-border-strong'}`}>
                            <input type="radio" name="wf" value={wf.id} checked={selected === wf.id} onChange={() => setSelected(wf.id)} className="accent-brand-500" />
                            <div>
                                <p className="text-sm font-medium text-text-primary">{wf.name}</p>
                                <p className="text-xs text-text-muted">{wf.states?.length || 0} states</p>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary flex-1" disabled={!selected} onClick={handleSwitch}>Switch</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectWorkflowPage() {
    const { organizationId, projectId } = useParams();
    const addToast = useUIStore(s => s.addToast);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Project data
    const { data: project } = useQuery({
        queryKey: ['projects', organizationId, projectId],
        queryFn: () => projectsApi.getById(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
    });

    // Permissions — resolve via direct useQuery (no dedicated hook for these)
    const systemRole = getSystemRole(user);
    const isSuperAdmin = systemRole === 'SUPER_ADMIN';
    const { data: orgMembers } = useQuery({
        queryKey: ['organizations', organizationId, 'members'],
        queryFn: () => organizationsApi.listMembers(organizationId),
        enabled: !!organizationId,
    });
    const orgRole = orgMembers?.find(m => m.userId === (user?.userId || user?.id))?.role;
    const canCreate = isSuperAdmin || orgRole === 'OWNER' || orgRole === 'ADMIN';
    const canEdit = canCreate; // PROJECT_ADMIN check can be added when endpoint is available

    // Workflow state
    const workflowId = project?.workflowId;
    const [activeWorkflowId, setActiveWorkflowId] = useState(null);
    const effectiveWfId = activeWorkflowId || workflowId;

    const { data: workflow, isLoading: wfLoading } = useWorkflow(effectiveWfId);

    // Builder state
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [showAddState, setShowAddState] = useState(false);
    const [showAddTransition, setShowAddTransition] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [pendingConnection, setPendingConnection] = useState(null);
    const [stateForm, setStateForm] = useState({ name: '', type: 'IN_PROGRESS', wipLimit: '' });
    const [transitionForm, setTransitionForm] = useState({ name: '', requiresApproval: false });
    const [editWfForm, setEditWfForm] = useState({ name: '', description: '' });

    const isEditable = canEdit && workflow && !workflow.active;

    // Mutations
    const addStateMutation = useAddState(effectiveWfId);
    const addTransitionMutation = useAddTransition(effectiveWfId);
    const activateMutation = useActivateWorkflow(effectiveWfId, organizationId);
    const updateWfMutation = useUpdateWorkflow(effectiveWfId, organizationId);
    const deleteStateMutation = useDeleteState(effectiveWfId);
    const deleteTransMutation = useDeleteTransition(effectiveWfId);
    const updatePositionsMutation = useUpdateStatePositions(effectiveWfId);
    const updateStateMutation = useUpdateState(effectiveWfId);
    const updateTransitionMutation = useUpdateTransition(effectiveWfId);

    const validationErrors = useMemo(() => buildValidationErrors(workflow), [workflow]);
    const hasErrors = validationErrors.some(e => e.level === 'error');

    const handleNodeDragStop = useCallback((nodeId, position) => {
        if (!isEditable) return;
        updatePositionsMutation.mutate([{ stateId: nodeId, positionX: position.x, positionY: position.y }]);
    }, [isEditable, updatePositionsMutation]);

    const handleConnect = useCallback((connection) => {
        if (!isEditable) return;
        setPendingConnection(connection);
        setShowAddTransition(true);
    }, [isEditable]);

    const handleAddState = (e) => {
        e.preventDefault();
        const count = workflow?.states?.length || 0;
        addStateMutation.mutate({
            ...stateForm,
            wipLimit: stateForm.wipLimit ? parseInt(stateForm.wipLimit) : null,
            positionX: count * 250,
            positionY: 100,
        }, {
            onSuccess: () => { setStateForm({ name: '', type: 'IN_PROGRESS', wipLimit: '' }); setShowAddState(false); addToast('State added!', 'success'); },
            onError: err => addToast(err.response?.data?.message || 'Failed to add state', 'error'),
        });
    };

    const handleAddTransition = (e) => {
        e.preventDefault();
        const conn = pendingConnection || {};
        addTransitionMutation.mutate({
            name: transitionForm.name,
            fromStateId: conn.source,
            toStateId: conn.target,
            requiresApproval: transitionForm.requiresApproval,
        }, {
            onSuccess: () => { setTransitionForm({ name: '', requiresApproval: false }); setPendingConnection(null); setShowAddTransition(false); addToast('Transition added!', 'success'); },
            onError: err => addToast(err.response?.data?.message || 'Failed to add transition', 'error'),
        });
    };

    const handleActivate = () => {
        if (hasErrors) return;
        if (!window.confirm('Activate this workflow? Once activated it becomes immutable.')) return;
        activateMutation.mutate(undefined, {
            onSuccess: () => addToast('Workflow activated!', 'success'),
            onError: err => addToast(err.response?.data?.message || 'Failed to activate', 'error'),
        });
    };

    if (!project) return <div className="flex justify-center items-center h-64"><div className="spinner spinner-lg" /></div>;

    if (!effectiveWfId) {
        return (
            <NoWorkflowView
                organizationId={organizationId}
                projectId={projectId}
                canEdit={canEdit}
                onWorkflowCreated={(id) => setActiveWorkflowId(id)}
            />
        );
    }

    if (wfLoading) return <div className="flex justify-center items-center h-64"><div className="spinner spinner-lg" /></div>;

    return (
        <div className="flex flex-col h-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-raised gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <HiOutlineLightningBolt className="w-5 h-5 text-brand-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{workflow?.name}</p>
                        <p className="text-xs text-text-muted">
                            {workflow?.active
                                ? <span className="text-emerald-600">✅ Active</span>
                                : <span className="text-amber-600">📝 Draft</span>}
                            {' · '}{workflow?.states?.length || 0} states · {workflow?.transitions?.length || 0} transitions
                        </p>
                    </div>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {isEditable && (
                            <>
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowAddState(true)}>
                                    <HiOutlinePlus className="w-4 h-4" /> Add State
                                </button>
                                <button
                                    className="btn btn-sm btn-primary"
                                    disabled={hasErrors || activateMutation.isPending}
                                    title={hasErrors ? 'Fix validation errors before activating' : 'Activate workflow'}
                                    onClick={handleActivate}
                                >
                                    {activateMutation.isPending ? <span className="spinner" /> : '⚡ Activate'}
                                </button>
                            </>
                        )}
                        {canCreate && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowSwitcher(true)} title="Switch Workflow">
                                <HiOutlineSwitchHorizontal className="w-4 h-4" /> Switch
                            </button>
                        )}
                    </div>
                )}

                {!canEdit && (
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                        <HiOutlineLockClosed className="w-3.5 h-3.5" /> Read-only view
                    </span>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Canvas — takes remaining space */}
                <div className="flex-1 relative overflow-hidden">
                    <ReactFlowProvider>
                        <WorkflowCanvas
                            workflow={workflow}
                            isEditable={isEditable}
                            onNodeDragStop={handleNodeDragStop}
                            onConnect={handleConnect}
                            onNodeClick={node => { setSelectedNode(node); setSelectedEdge(null); }}
                            onEdgeClick={edge => { setSelectedEdge(edge); setSelectedNode(null); }}
                        />
                    </ReactFlowProvider>
                </div>

                {/* Right panel — property panels + health check + history */}
                <div className="w-72 shrink-0 border-l border-border-subtle bg-bg-base overflow-y-auto p-4 space-y-4">
                    <ValidationPanel workflow={workflow} />

                    {selectedNode && (
                        <StatePropertyPanel
                            node={selectedNode}
                            isEditable={isEditable}
                            stateTypes={STATE_TYPES}
                            onUpdate={(stateId, data) => {
                                updateStateMutation.mutate({ stateId, data }, {
                                    onSuccess: () => { setSelectedNode(null); addToast('State updated!', 'success'); },
                                    onError: err => addToast(err.response?.data?.message || 'Failed', 'error'),
                                });
                            }}
                            onDelete={(stateId) => {
                                deleteStateMutation.mutate(stateId, {
                                    onSuccess: () => { setSelectedNode(null); addToast('State deleted', 'success'); },
                                    onError: err => addToast(err.response?.data?.message || 'Failed', 'error'),
                                });
                            }}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}

                    {selectedEdge && (
                        <TransitionPropertyPanel
                            edge={selectedEdge}
                            isEditable={isEditable}
                            onUpdate={(transitionId, data) => {
                                updateTransitionMutation.mutate({ transitionId, data }, {
                                    onSuccess: () => { setSelectedEdge(null); addToast('Transition updated!', 'success'); },
                                    onError: err => addToast(err.response?.data?.message || 'Failed', 'error'),
                                });
                            }}
                            onDelete={(transitionId) => {
                                deleteTransMutation.mutate(transitionId, {
                                    onSuccess: () => { setSelectedEdge(null); addToast('Transition deleted', 'success'); },
                                    onError: err => addToast(err.response?.data?.message || 'Failed', 'error'),
                                });
                            }}
                            onClose={() => setSelectedEdge(null)}
                        />
                    )}

                    <HistoryPanel workflow={workflow} />
                </div>
            </div>

            {/* Add State Modal */}
            {showAddState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-bg-raised rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-primary">Add State</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddState(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddState} className="space-y-4">
                            <div>
                                <label className="label">State Name</label>
                                <input className="input w-full" value={stateForm.name} onChange={e => setStateForm(s => ({ ...s, name: e.target.value }))} required placeholder="e.g. In Review" autoFocus />
                            </div>
                            <div>
                                <label className="label">Type</label>
                                <select className="input w-full" value={stateForm.type} onChange={e => setStateForm(s => ({ ...s, type: e.target.value }))}>
                                    {STATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">WIP Limit <span className="text-text-muted font-normal">(optional)</span></label>
                                <input className="input w-full" type="number" min="1" value={stateForm.wipLimit} onChange={e => setStateForm(s => ({ ...s, wipLimit: e.target.value }))} placeholder="No limit" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full justify-center" disabled={addStateMutation.isPending}>
                                {addStateMutation.isPending ? <span className="spinner" /> : 'Add State'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Transition Modal */}
            {showAddTransition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-bg-raised rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-primary">Add Transition</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowAddTransition(false); setPendingConnection(null); }}>✕</button>
                        </div>
                        <form onSubmit={handleAddTransition} className="space-y-4">
                            <div>
                                <label className="label">Transition Name</label>
                                <input className="input w-full" value={transitionForm.name} onChange={e => setTransitionForm(s => ({ ...s, name: e.target.value }))} required placeholder="e.g. Send for Review" autoFocus />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-bg-overlay rounded-xl border border-border-subtle">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Requires Approval</p>
                                    <p className="text-xs text-text-muted">Task needs approval before moving</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTransitionForm(s => ({ ...s, requiresApproval: !s.requiresApproval }))}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${transitionForm.requiresApproval ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${transitionForm.requiresApproval ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <button type="submit" className="btn btn-primary w-full justify-center" disabled={addTransitionMutation.isPending}>
                                {addTransitionMutation.isPending ? <span className="spinner" /> : 'Add Transition'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Workflow Switcher Modal */}
            {showSwitcher && (
                <WorkflowSwitcherModal
                    organizationId={organizationId}
                    projectId={projectId}
                    currentWfId={effectiveWfId}
                    onClose={() => setShowSwitcher(false)}
                    onSwitch={(id) => {
                        setActiveWorkflowId(id);
                        queryClient.invalidateQueries({ queryKey: ['projects', organizationId, projectId] });
                        setShowSwitcher(false);
                    }}
                />
            )}
        </div>
    );
}
