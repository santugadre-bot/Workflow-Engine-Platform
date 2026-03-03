import { useState, useEffect } from 'react';
import { HiOutlineTrash, HiOutlineArrowRight, HiOutlineShieldCheck } from 'react-icons/hi';
import Toggle from '../common/Toggle';

export default function TransitionPropertyPanel({ transition, workflow, onUpdate, onDelete, onClose, canEdit = true }) {
    const [name, setName] = useState(transition.label || transition.name || '');
    const [requiresApproval, setRequiresApproval] = useState(transition.requiresApproval || false);

    const fromState = workflow?.states?.find(s => s.id === transition.source || s.id === transition.fromStateId);
    const toState = workflow?.states?.find(s => s.id === transition.target || s.id === transition.toStateId);

    useEffect(() => {
        setName(transition.label || transition.name || '');
        setRequiresApproval(transition.requiresApproval || false);
    }, [transition]);

    const handleSave = () => {
        onUpdate(transition.id, {
            name,
            requiresApproval,
            fromStateId: transition.source || transition.fromStateId,
            toStateId: transition.target || transition.toStateId
        });
    };

    const handleDelete = () => {
        if (window.confirm(`Delete transition "${transition.label || transition.name}"?`)) {
            onDelete(transition.id);
            onClose();
        }
    };

    return (
        <div className="workflow-property-panel">
            <div className="property-panel-header">
                <h3>Transition Details</h3>
                <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">✕</button>
            </div>

            {!canEdit && (
                <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
                    <span>🔒</span> This workflow is active — editing is disabled.
                </div>
            )}

            <div className="property-panel-body">
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">Transition Name</label>
                    <input
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!canEdit}
                    />
                </div>

                <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold flex items-center gap-2">
                            <HiOutlineShieldCheck className="text-primary" />
                            Requires Approval
                        </label>
                        <Toggle
                            checked={requiresApproval}
                            onChange={canEdit ? setRequiresApproval : undefined}
                            disabled={!canEdit}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        If enabled, this transition will be blocked until authorized in the Approval Center.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Flow</label>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-info">{fromState?.name || 'Unknown'}</span>
                        <HiOutlineArrowRight className="text-muted" />
                        <span className="badge badge-info">{toState?.name || 'Unknown'}</span>
                    </div>
                </div>

                {canEdit && (
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="btn btn-primary w-full justify-center"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn btn-ghost text-error w-full justify-center"
                        >
                            <HiOutlineTrash /> Delete Transition
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
