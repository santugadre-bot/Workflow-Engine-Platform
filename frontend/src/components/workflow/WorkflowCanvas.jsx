import { useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
    stateNode: CustomNode
};

const edgeTypes = {
    custom: CustomEdge
};

const defaultEdgeOptions = {
    animated: false,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1'
    },
    type: 'custom',
};

export default function WorkflowCanvas({
    workflow,
    editable = false,
    onNodeDragStop,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
    onNodeDelete,
    onEdgeDelete,
    onNodeEdit,
    selectedNode,
    selectedEdge
}) {
    // 1. Initialize State
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);

    // 2. Sync Workflow Data to Nodes/Edges
    useEffect(() => {
        if (!workflow) return;

        const newNodes = workflow.states?.map((state, index) => ({
            id: state.id,
            type: 'stateNode',
            position: {
                x: state.positionX || index * 250,
                y: state.positionY || 100
            },
            data: {
                name: state.name,
                type: state.type,
                editable,
                onEdit: () => onNodeEdit?.(state),
                onDelete: () => onNodeDelete?.(state.id)
            },
            draggable: editable
        })) || [];

        const newEdges = workflow.transitions?.map((transition) => ({
            id: transition.id,
            source: transition.fromStateId,
            target: transition.toStateId,
            type: 'custom',
            label: transition.name,
            data: {
                editable,
                onDelete: () => onEdgeDelete?.(transition.id)
            },
            ...defaultEdgeOptions,
            animated: workflow.active
        })) || [];

        setNodes(newNodes);
        setEdges(newEdges);
    }, [workflow, editable, onNodeEdit, onNodeDelete, onEdgeDelete, setNodes, setEdges]);

    // 3. Handlers
    const handleNodesChange = useCallback((changes) => {
        onNodesChangeInternal(changes);
        onNodesChange?.(changes);
    }, [onNodesChangeInternal, onNodesChange]);

    const handleEdgesChange = useCallback((changes) => {
        onEdgesChangeInternal(changes);
        onEdgesChange?.(changes);
    }, [onEdgesChangeInternal, onEdgesChange]);

    const handleConnect = useCallback((connection) => {
        if (!editable) return;
        onConnect?.(connection);
    }, [editable, onConnect]);

    const handleNodeDragStop = useCallback((event, node) => {
        onNodeDragStop?.(node.id, node.position);
    }, [onNodeDragStop]);

    return (
        <div className="workflow-canvas-container h-full w-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onNodeDragStop={handleNodeDragStop}
                onNodeClick={(e, node) => onNodeClick?.(node)}
                onEdgeClick={(e, edge) => onEdgeClick?.(edge)}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                attributionPosition="bottom-right"
                nodesDraggable={editable}
                nodesConnectable={editable}
                elementsSelectable={true}
                snapToGrid={true}
                snapGrid={[15, 15]}
            >
                <Background color="#cbd5e1" gap={15} size={1} variant="dots" />
                <Controls showInteractive={false} className="bg-white shadow-xl border border-slate-100 rounded-lg p-1" />
                <MiniMap
                    nodeColor={(node) => {
                        const typeColors = {
                            START: '#10b981',
                            IN_PROGRESS: '#3b82f6',
                            DONE: '#8b5cf6',
                            END: '#ef4444'
                        };
                        return typeColors[node.data.type] || '#3b82f6';
                    }}
                    maskColor="rgba(241, 245, 249, 0.7)"
                    className="border border-slate-200 shadow-lg rounded-lg overflow-hidden"
                />
            </ReactFlow>
        </div>
    );
}
