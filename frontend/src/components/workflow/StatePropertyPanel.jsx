import { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';

const STATE_TYPES = [
    { value: 'START', label: 'Start' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'END', label: 'End' }
];

export default function StatePropertyPanel({ state, onUpdate, onDelete, onClose, canEdit = true }) {
    const [formData, setFormData] = useState({
        name: state.name || '',
        type: state.type || 'IN_PROGRESS',
        wipLimit: state.wipLimit ?? '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(state.id, formData);
    };

    const handleDelete = () => {
        if (window.confirm(`Delete state "${state.name}"? Transitions connected to this state will also be deleted.`)) {
            onDelete(state.id);
            onClose();
        }
    };

    return (
        <div className="workflow-property-panel">
            <div className="property-panel-header">
                <h3>{canEdit ? 'Edit State' : 'State Details'}</h3>
                <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">✕</button>
            </div>

            {!canEdit && (
                <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
                    <span>🔒</span> This workflow is active — editing is disabled.
                </div>
            )}

            <form onSubmit={handleSubmit} className="property-panel-body">
                <div className="input-group mb-4">
                    <label>State Name</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. In Review"
                        disabled={!canEdit}
                    />
                </div>

                <div className="input-group mb-4">
                    <label>State Type</label>
                    <select
                        className="input"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        disabled={state.type === 'START' || !canEdit}
                    >
                        {STATE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {state.type === 'START' && (
                        <small className="text-muted">Cannot change START state type</small>
                    )}
                </div>

                <div className="input-group mb-4">
                    <label>WIP Limit <small className="text-muted font-normal">(leave empty for no limit)</small></label>
                    <input
                        type="number"
                        className="input"
                        min="1"
                        value={formData.wipLimit}
                        onChange={(e) => setFormData({ ...formData, wipLimit: e.target.value })}
                        placeholder="No limit"
                        disabled={!canEdit}
                    />
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary flex-1 justify-center">
                            Save Changes
                        </button>
                        {state.type !== 'START' && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn btn-danger btn-icon"
                                title="Delete State"
                            >
                                <HiOutlineTrash />
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
