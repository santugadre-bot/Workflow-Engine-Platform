import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from 'reactflow';
import { HiX } from 'react-icons/hi';

export default function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data
}) {
    const { setEdges } = useReactFlow();
    const [aspect, setAspect] = React.useState('contain');
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 20, // Smooth corners
    });

    const onEdgeClick = (evt) => {
        evt.stopPropagation();
        if (data?.editable && data?.onDelete) {
            data.onDelete(id);
        }
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan group"
                >
                    <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200 text-xs font-medium text-slate-600 flex items-center gap-2 hover:border-indigo-300 transition-colors">
                        {label || 'Transition'}

                        {data?.editable && (
                            <button
                                className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                onClick={onEdgeClick}
                                title="Delete Connection"
                            >
                                <HiX size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
