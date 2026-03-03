import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineStar, HiStar } from 'react-icons/hi';
import { ReactFlowProvider } from 'reactflow';
import AppLayout from '../components/layout/AppLayout';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import WorkflowToolbar from '../components/workflow/WorkflowToolbar';
import StatePropertyPanel from '../components/workflow/StatePropertyPanel';
import TransitionPropertyPanel from '../components/workflow/TransitionPropertyPanel';
import {
    useWorkflow,
    useAddState,
    useAddTransition,
    useActivateWorkflow,
    useUpdateWorkflow,
    useDeleteWorkflow,
    useDeleteState,
    useDeleteTransition,
    useUpdateStatePositions,
    useUpdateState,
    useUpdateTransition,
    useCreateWorkflow
} from '../api/workflows';
import useUIStore from '../store/uiStore';
import { canManageOrgWorkflow } from '../utils/permissions';

const STATE_TYPES = [
    { value: 'START', label: 'Start' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'END', label: 'End' }
];

export default function WorkflowBuilderPage() {
    const { organizationId, workflowId } = useParams();
    const navigate = useNavigate();
    const addToast = useUIStore((s) => s.addToast);
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    // Favorites & Recents
    const { favorites, toggleFavorite, addRecent } = useUIStore();
    const isFavorite = favorites.some(f => f.path === `/workflows/${activeOrganizationId}/${workflowId}`);

    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [showAddStateModal, setShowAddStateModal] = useState(false);
    const [showAddTransitionModal, setShowAddTransitionModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [pendingConnection, setPendingConnection] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    const [stateForm, setStateForm] = useState({ name: '', type: 'IN_PROGRESS' });
    const [transitionForm, setTransitionForm] = useState({ name: '' });
    const [editWfForm, setEditWfForm] = useState({ name: '', description: '' });

    const { data: workflow, isLoading } = useWorkflow(workflowId);

    const addStateMutation = useAddState(workflowId);
    const addTransitionMutation = useAddTransition(workflowId);
    const activateMutation = useActivateWorkflow(workflowId, activeOrganizationId);
    const updateWfMutation = useUpdateWorkflow(workflowId, activeOrganizationId);
    const deleteWfMutation = useDeleteWorkflow(activeOrganizationId);
    const deleteStateMutation = useDeleteState(workflowId);
    const deleteTransMutation = useDeleteTransition(workflowId);
    const updatePositionsMutation = useUpdateStatePositions(workflowId);
    const updateStateMutation = useUpdateState(workflowId);
    const updateTransitionMutation = useUpdateTransition(workflowId);
    const createWorkflowMutation = useCreateWorkflow(activeOrganizationId);

    const isEditable = workflow && canManageOrgWorkflow(workflow.role) && !workflow.active;

    useEffect(() => {
        if (workflow) {
            setEditWfForm({ name: workflow.name, description: workflow.description || '' });
            addRecent(activeOrganizationId, {
                path: `/workflows/${activeOrganizationId}/${workflowId}`,
                label: workflow.name,
                type: 'workflow'
            });
        }
    }, [workflow, activeOrganizationId, workflowId, addRecent]);

    // Handle node drag stop - save positions
    const handleNodeDragStop = useCallback((nodeId, position) => {
        if (!isEditable) return;

        updatePositionsMutation.mutate([{
            stateId: nodeId,
            positionX: position.x,
            positionY: position.y
        }], {
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update position', 'error')
        });
    }, [isEditable, updatePositionsMutation, addToast]);

    // Handle connection (drag from one node to another)
    const handleConnect = useCallback((connection) => {
        if (!isEditable) return;

        setPendingConnection(connection);
        setShowAddTransitionModal(true);
    }, [isEditable]);

    // Handle node click
    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    }, []);

    // Handle edge click
    const handleEdgeClick = useCallback((edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);

    // Add state
    const handleAddState = (e) => {
        e.preventDefault();
        const stateCount = workflow?.states?.length || 0;

        addStateMutation.mutate({
            ...stateForm,
            positionX: stateCount * 250,
            positionY: 100
        }, {
            onSuccess: () => {
                setStateForm({ name: '', type: 'IN_PROGRESS' });
                setShowAddStateModal(false);
                addToast('State added!', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to add state', 'error')
        });
    };

    // Add transition
    const handleAddTransition = (e) => {
        e.preventDefault();
        const connection = pendingConnection || {};

        addTransitionMutation.mutate({
            name: transitionForm.name,
            fromStateId: connection.source,
            toStateId: connection.target,
            requiresApproval: false
        }, {
            onSuccess: () => {
                setTransitionForm({ name: '' });
                setPendingConnection(null);
                setShowAddTransitionModal(false);
                addToast('Transition added!', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to add transition', 'error')
        });
    };

    // Update state
    const handleUpdateState = (stateId, data) => {
        updateStateMutation.mutate({ stateId, data }, {
            onSuccess: () => {
                setSelectedNode(null);
                addToast('State updated!', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update state', 'error')
        });
    };

    // Update transition
    const handleUpdateTransition = (transitionId, data) => {
        updateTransitionMutation.mutate({ transitionId, data }, {
            onSuccess: () => {
                setSelectedEdge(null);
                addToast('Transition updated!', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update transition', 'error')
        });
    };


    // Delete state
    const handleDeleteState = (stateId) => {
        deleteStateMutation.mutate(stateId, {
            onSuccess: () => {
                setSelectedNode(null);
                addToast('State deleted', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to delete state', 'error')
        });
    };

    // Delete transition
    const handleDeleteTransition = (transitionId) => {
        deleteTransMutation.mutate(transitionId, {
            onSuccess: () => {
                setSelectedEdge(null);
                addToast('Transition deleted', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to delete transition', 'error')
        });
    };

    // Validate workflow structure
    const validateGraph = () => {
        const states = workflow?.states || [];
        const transitions = workflow?.transitions || [];
        const errors = [];

        // 1. Check for START node
        const startNodes = states.filter(s => s.type === 'START');
        if (startNodes.length === 0) errors.push('Workflow must have a START state.');
        if (startNodes.length > 1) errors.push('Workflow can only have one START state.');

        // 2. Check for END node
        const endNodes = states.filter(s => s.type === 'END');
        if (endNodes.length === 0) errors.push('Workflow must have at least one END state.');

        // 3. Connectivity (Basic check)
        // Ensure all non-END nodes have at least one outgoing transition
        states.forEach(state => {
            if (state.type !== 'END') {
                const hasOutgoing = transitions.some(t => t.fromStateId === state.id);
                if (!hasOutgoing) {
                    errors.push(`State "${state.name}" has no outgoing transitions (dead end).`);
                }
            }
        });

        // 4. Check for isolated nodes (no incoming or outgoing) - except START (no incoming)
        states.forEach(state => {
            const hasIncoming = transitions.some(t => t.toStateId === state.id);
            const hasOutgoing = transitions.some(t => t.fromStateId === state.id);

            if (state.type !== 'START' && !hasIncoming) {
                errors.push(`State "${state.name}" is unreachable (no incoming transitions).`);
            }
            if (state.type !== 'END' && !hasOutgoing) {
                // Already covered by step 3, but good to be explicit about isolation
            }

            if (!hasIncoming && !hasOutgoing && states.length > 1) {
                errors.push(`State "${state.name}" is disconnected.`);
            }
        });

        return errors;
    };

    // Validate and activate
    const handleValidate = () => {
        const errors = validateGraph();
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        activateMutation.mutate(undefined, {
            onSuccess: () => addToast('Workflow validated and activated!', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Validation failed', 'error')
        });
    };

    // Update workflow
    const handleUpdateWorkflow = (e) => {
        e.preventDefault();
        updateWfMutation.mutate(editWfForm, {
            onSuccess: () => {
                setShowSettings(false);
                addToast('Workflow updated!', 'success');
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update workflow', 'error')
        });
    };

    // Auto-layout: arrange nodes in a tidy left-to-right layered layout
    const handleAutoLayout = () => {
        const states = workflow?.states || [];
        const transitions = workflow?.transitions || [];
        if (states.length === 0) return;

        // Build adjacency map
        const inDegree = {};
        const adj = {};
        states.forEach(s => { inDegree[s.id] = 0; adj[s.id] = []; });
        transitions.forEach(t => {
            if (adj[t.fromStateId]) adj[t.fromStateId].push(t.toStateId);
            if (t.toStateId in inDegree) inDegree[t.toStateId]++;
        });

        // Topological sort (BFS / Kahn's algorithm) to determine layers
        const layers = [];
        let queue = states.filter(s => inDegree[s.id] === 0).map(s => s.id);
        const visited = new Set();
        while (queue.length > 0) {
            layers.push([...queue]);
            const next = [];
            queue.forEach(id => {
                visited.add(id);
                (adj[id] || []).forEach(nid => {
                    if (!visited.has(nid)) {
                        inDegree[nid]--;
                        if (inDegree[nid] === 0) next.push(nid);
                    }
                });
            });
            queue = next;
        }
        // Any states not reached (cycles) get appended at the end
        const missed = states.filter(s => !visited.has(s.id)).map(s => s.id);
        if (missed.length > 0) layers.push(missed);

        // Compute positions
        const H_GAP = 260;
        const V_GAP = 120;
        const positions = [];
        layers.forEach((layer, colIdx) => {
            const totalHeight = (layer.length - 1) * V_GAP;
            layer.forEach((id, rowIdx) => {
                positions.push({
                    stateId: id,
                    positionX: colIdx * H_GAP + 80,
                    positionY: rowIdx * V_GAP - totalHeight / 2 + 200,
                });
            });
        });

        updatePositionsMutation.mutate(positions, {
            onSuccess: () => addToast('Layout applied!', 'success'),
            onError: () => addToast('Failed to save layout', 'error'),
        });
    };

    // Clone workflow — creates a new draft with the same name + (Copy)
    const handleCloneWorkflow = () => {
        const newName = `${workflow?.name || 'Workflow'} (Copy)`;
        createWorkflowMutation.mutate(
            { name: newName, description: workflow?.description || '' },
            {
                onSuccess: (created) => {
                    setShowSettings(false);
                    addToast(`"${newName}" created!`, 'success');
                    navigate(`/workflows/${activeOrganizationId}/${created.id}`);
                },
                onError: (err) => addToast(err.response?.data?.message || 'Failed to duplicate workflow', 'error'),
            }
        );
    };

    // Delete workflow
    const handleDeleteWorkflow = () => {
        if (window.confirm('Are you sure you want to delete this workflow? This cannot be undone.')) {
            deleteWfMutation.mutate(workflowId, {
                onSuccess: () => {
                    navigate(`/workflows/${activeOrganizationId}`);
                    addToast('Workflow deleted', 'success');
                },
                onError: (err) => addToast(err.response?.data?.message || 'Failed to delete workflow', 'error')
            });
        }
    };

    if (isLoading) {
        return <AppLayout title="Workflow Builder" fullWidth><div className="loading-center"><div className="spinner spinner-lg" /></div></AppLayout>;
    }

    // Find state details for selected node
    const selectedState = selectedNode ? workflow?.states?.find(s => s.id === selectedNode.id) : null;
    const selectedTransition = selectedEdge ? workflow?.transitions?.find(t => t.id === selectedEdge.id) : null;

    return (
        <AppLayout title={workflow?.name || 'Workflow Builder'} fullWidth>
            <div className="workflow-builder-page h-[calc(100vh-64px)] flex flex-col relative bg-slate-50">
                {/* Header Overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 p-2 rounded-lg">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/workflows/${activeOrganizationId}`)}>
                        <HiOutlineArrowLeft />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <h1 className="font-bold text-slate-800 px-2">{workflow?.name}</h1>
                    <button
                        onClick={() => toggleFavorite(activeOrganizationId, { path: `/workflows/${activeOrganizationId}/${workflowId}`, label: workflow?.name, type: 'workflow' })}
                        className={`btn btn-ghost btn-sm btn-icon ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`}
                    >
                        {isFavorite ? <HiStar className="w-5 h-5" /> : <HiOutlineStar className="w-5 h-5" />}
                    </button>
                </div>

                {/* Toolbar Overlay */}
                <div className="absolute top-4 right-4 z-10">
                    <WorkflowToolbar
                        workflow={workflow}
                        onAddState={() => setShowAddStateModal(true)}
                        onValidate={handleValidate}
                        onSettings={() => setShowSettings(true)}
                        onAutoLayout={handleAutoLayout}
                        canEdit={isEditable}
                    />
                </div>

                {/* Main Layout: Canvas + Property Panel */}
                <div className="flex-1 relative overflow-hidden">
                    <ReactFlowProvider>
                        <WorkflowCanvas
                            workflow={workflow}
                            editable={isEditable}
                            onNodeDragStop={handleNodeDragStop}
                            onConnect={handleConnect}
                            onNodeClick={handleNodeClick}
                            onEdgeClick={handleEdgeClick}
                            onNodeDelete={handleDeleteState}
                            onEdgeDelete={handleDeleteTransition}
                            onNodeEdit={(state) => setSelectedNode({ id: state.id, data: state })}
                            selectedNode={selectedNode}
                            selectedEdge={selectedEdge}
                        />
                    </ReactFlowProvider>

                    {/* Property Panels (Absolute positioned) */}
                    {(selectedState || selectedTransition) && (
                        <div className="absolute top-4 right-20 z-20 w-80 bg-white shadow-xl border-l border-slate-200 h-auto max-h-[calc(100%-32px)] overflow-y-auto rounded-xl">
                            {selectedState && (
                                <StatePropertyPanel
                                    state={selectedState}
                                    onUpdate={handleUpdateState}
                                    onDelete={handleDeleteState}
                                    onClose={() => setSelectedNode(null)}
                                    canEdit={isEditable}
                                />
                            )}
                            {selectedTransition && (
                                <TransitionPropertyPanel
                                    transition={selectedTransition}
                                    workflow={workflow}
                                    onUpdate={handleUpdateTransition}
                                    onDelete={handleDeleteTransition}
                                    onClose={() => setSelectedEdge(null)}
                                    canEdit={isEditable}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Modals remain the same... */}
                {/* Add State Modal */}
                {showAddStateModal && (
                    <div className="modal-overlay" onClick={() => setShowAddStateModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add New State</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowAddStateModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleAddState}>
                                <div className="input-group mb-4">
                                    <label>State Name</label>
                                    <input
                                        className="input"
                                        value={stateForm.name}
                                        onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                                        required
                                        placeholder="e.g. In Review"
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group mb-4">
                                    <label>State Type</label>
                                    <select
                                        className="input"
                                        value={stateForm.type}
                                        onChange={(e) => setStateForm({ ...stateForm, type: e.target.value })}
                                    >
                                        {STATE_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-1 justify-center">
                                        {addStateMutation.isPending ? <span className="spinner" /> : 'Add State'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddStateModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Transition Modal */}
                {showAddTransitionModal && pendingConnection && (
                    <div className="modal-overlay" onClick={() => { setShowAddTransitionModal(false); setPendingConnection(null); }}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add Transition</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => { setShowAddTransitionModal(false); setPendingConnection(null); }}>✕</button>
                            </div>
                            <form onSubmit={handleAddTransition}>
                                <div className="input-group mb-4">
                                    <label>Transition Name</label>
                                    <input
                                        className="input"
                                        value={transitionForm.name}
                                        onChange={(e) => setTransitionForm({ ...transitionForm, name: e.target.value })}
                                        required
                                        placeholder="e.g. Approve, Reject, Submit"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-1 justify-center">
                                        {addTransitionMutation.isPending ? <span className="spinner" /> : 'Create Transition'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowAddTransitionModal(false); setPendingConnection(null); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettings && (
                    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Workflow Settings</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(false)}>✕</button>
                            </div>
                            <form onSubmit={handleUpdateWorkflow}>
                                <div className="input-group mb-4">
                                    <label>Name</label>
                                    <input
                                        className="input"
                                        value={editWfForm.name}
                                        onChange={(e) => setEditWfForm({ ...editWfForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group mb-4">
                                    <label>Description</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        value={editWfForm.description}
                                        onChange={(e) => setEditWfForm({ ...editWfForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-1 justify-center">
                                        {updateWfMutation.isPending ? <span className="spinner" /> : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloneWorkflow}
                                        title="Duplicate this workflow as a new draft"
                                    >
                                        {createWorkflowMutation.isPending ? <span className="spinner" /> : '⧉ Duplicate'}
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={handleDeleteWorkflow}>
                                        {deleteWfMutation.isPending ? <span className="spinner" /> : 'Delete'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Validation Errors Modal */}
                {validationErrors.length > 0 && (
                    <div className="modal-overlay" onClick={() => setValidationErrors([])}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="text-error">⚠ Workflow Validation Failed</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setValidationErrors([])}>✕</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-muted mb-3">Please fix the following issues before activating:</p>
                                <ul className="space-y-2">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-error/10 text-error border border-error/20">
                                            <span className="mt-0.5 shrink-0">✕</span>
                                            <span>{err}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="modal-footer pt-4">
                                <button className="btn btn-primary w-full justify-center" onClick={() => setValidationErrors([])}>
                                    Got it, I'll fix these
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
