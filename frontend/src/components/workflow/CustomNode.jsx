import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineCheckCircle, HiOutlinePlay, HiOutlineStop } from 'react-icons/hi';

const NODE_STYLES = {
    START: {
        header: 'bg-emerald-500',
        icon: <HiOutlinePlay className="w-4 h-4 text-white" />,
        label: 'Start',
        border: 'border-emerald-200',
        handle: 'bg-emerald-500'
    },
    IN_PROGRESS: {
        header: 'bg-blue-600',
        icon: <HiOutlineCog className="w-4 h-4 text-white" />,
        label: 'Process',
        border: 'border-blue-200',
        handle: 'bg-blue-600'
    },
    DONE: {
        header: 'bg-purple-600',
        icon: <HiOutlineCheckCircle className="w-4 h-4 text-white" />,
        label: 'Done',
        border: 'border-purple-200',
        handle: 'bg-purple-600'
    },
    END: {
        header: 'bg-rose-500',
        icon: <HiOutlineStop className="w-4 h-4 text-white" />,
        label: 'End',
        border: 'border-rose-200',
        handle: 'bg-rose-500'
    }
};

// Fallback icon import if needed, though defined above correctly
import { HiOutlineCog } from 'react-icons/hi';

function CustomNode({ data, selected }) {
    const { name, type, editable, onEdit, onDelete } = data;
    const style = NODE_STYLES[type] || NODE_STYLES.IN_PROGRESS;

    return (
        <div className={`
            w-64 bg-white rounded-xl shadow-sm border-2 transition-all duration-200 group overflow-hidden
            ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 border-transparent shadow-lg' : style.border}
            ${editable ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
        `}>
            {/* Input Handle */}
            {type !== 'START' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={`w-3 h-3 !bg-slate-300 border-2 border-white transition-colors hover:!bg-indigo-500`}
                />
            )}

            {/* Header */}
            <div className={`${style.header} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    {style.icon}
                    <span className="text-xs font-bold text-white uppercase tracking-wider opacity-90">
                        {style.label}
                    </span>
                </div>
                {/* Actions (Only visible in edit mode) */}
                {editable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                            className="p-1 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
                            title="Edit"
                        >
                            <HiOutlinePencil size={12} />
                        </button>
                        {type !== 'START' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                className="p-1 rounded bg-white/20 text-white hover:bg-white/30 hover:text-red-100 transition-colors"
                                title="Delete"
                            >
                                <HiOutlineTrash size={12} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-3 bg-white">
                <div className="font-semibold text-slate-800 text-sm line-clamp-2">
                    {name}
                </div>
            </div>

            {/* Output Handle */}
            {type !== 'END' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={`w-3 h-3 !bg-slate-300 border-2 border-white transition-colors hover:!bg-indigo-500`}
                />
            )}
        </div>
    );
}

export default memo(CustomNode);
