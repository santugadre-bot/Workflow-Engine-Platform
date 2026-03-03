import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';

const STATE_TYPE_COLORS = {
    START: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '#059669' },
    IN_PROGRESS: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: '#2563eb' },
    DONE: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: '#7c3aed' },
    END: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '#dc2626' }
};

function WorkflowStateNode({ data, selected }) {
    const { name, type, editable, onEdit, onDelete } = data;
    const colors = STATE_TYPE_COLORS[type] || STATE_TYPE_COLORS.IN_PROGRESS;

    return (
        <>
            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="workflow-node-handle"
                style={{ background: colors.border }}
            />

            <div
                className={`workflow-state-node ${selected ? 'selected' : ''}`}
                style={{
                    background: colors.bg,
                    borderColor: selected ? '#fff' : colors.border,
                }}
            >
                <div className="state-node-header">
                    <span className="state-type-badge">{type}</span>
                    {editable && (
                        <div className="state-node-actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.();
                                }}
                                className="state-action-btn"
                                title="Edit State"
                            >
                                <HiOutlinePencil size={14} />
                            </button>
                            {type !== 'START' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.();
                                    }}
                                    className="state-action-btn delete"
                                    title="Delete State"
                                >
                                    <HiOutlineTrash size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="state-node-name">{name}</div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="workflow-node-handle"
                style={{ background: colors.border }}
            />
        </>
    );
}

export default memo(WorkflowStateNode);
