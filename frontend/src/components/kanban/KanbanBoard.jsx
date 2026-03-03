import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
    arrayMove,
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import RichTaskCard from './RichTaskCard';
import { canTransitionTask } from '../../utils/permissions';
import { createPortal } from 'react-dom';

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export default function KanbanBoard({ states, tasks, onTaskMove, onTaskReorder, onTaskClick, userRole, showStoryPoints, showDueDate, selectedTaskIds, onToggleSelect, viewDensity, canCreate, projectId, groupBy, members }) {
    const [activeId, setActiveId] = useState(null);
    const [collapsedColumns, setCollapsedColumns] = useState({});

    // Group tasks by column AND by swimlane
    const { swimlanes, tasksBySwimlaneAndColumn } = useMemo(() => {
        if (!groupBy) {
            const grouped = { all: {} };
            states.forEach(state => {
                grouped.all[state.id] = tasks.filter(t => t.currentStateId === state.id)
                    .sort((a, b) => (a.position - b.position || 0));
            });
            return { swimlanes: [{ id: 'all', title: '' }], tasksBySwimlaneAndColumn: grouped };
        }

        const lanesMap = {};
        const grouped = {};

        tasks.forEach(task => {
            let key = 'unassigned';
            let title = 'Unassigned';

            if (groupBy === 'assigneeId') {
                key = task.assigneeId || 'unassigned';
                if (key !== 'unassigned') {
                    const member = members?.find(m => m.userId === key);
                    title = member?.displayName || task.assigneeName || 'Unknown User';
                }
            } else if (groupBy === 'priority') {
                key = task.priority || 'NONE';
                title = key;
            }

            if (!lanesMap[key]) {
                lanesMap[key] = { id: key, title };
                grouped[key] = {};
                states.forEach(state => { grouped[key][state.id] = []; });
            }
            if (!grouped[key][task.currentStateId]) grouped[key][task.currentStateId] = [];
            grouped[key][task.currentStateId].push(task);
        });

        const sortedLanes = Object.values(lanesMap).sort((a, b) => a.title.localeCompare(b.title));

        Object.keys(grouped).forEach(laneId => {
            states.forEach(state => {
                grouped[laneId][state.id].sort((a, b) => (a.position - b.position || 0));
            });
        });

        return { swimlanes: sortedLanes, tasksBySwimlaneAndColumn: grouped };
    }, [states, tasks, groupBy, members]);

    const activeTask = useMemo(
        () => tasks.find((task) => task.id === activeId),
        [activeId, tasks]
    );


    // Bug #2 fix: toggle handler for column collapse
    const handleToggleCollapse = (stateId) => {
        setCollapsedColumns(prev => ({ ...prev, [stateId]: !prev[stateId] }));
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Find the task and source column
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const sourceColumnId = activeTask.currentStateId;

        // Find destination column logic
        let destinationColumnId = null;

        if (typeof overId === 'string' && overId.includes('::')) {
            destinationColumnId = overId.split('::')[0];
        } else if (states.find(s => s.id === overId)) {
            destinationColumnId = overId;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                destinationColumnId = overTask.currentStateId;
            }
        }

        if (!destinationColumnId) return;

        if (sourceColumnId === destinationColumnId) {
            const groupKeyId = groupBy === 'assigneeId' ? (activeTask.assigneeId || 'unassigned') : (groupBy === 'priority' ? (activeTask.priority || 'NONE') : 'all');
            const columnTasks = tasksBySwimlaneAndColumn[groupKeyId][sourceColumnId];

            const oldIndex = columnTasks.findIndex(t => t.id === activeId);
            const newIndex = columnTasks.findIndex(t => t.id === overId);

            if (oldIndex !== newIndex && onTaskReorder && oldIndex >= 0 && newIndex >= 0) {
                onTaskReorder(activeId, newIndex);
            }
        } else {
            onTaskMove(activeId, destinationColumnId);
        }
    };

    const isReadOnly = !canTransitionTask(userRole);

    // Disable sensors entirely for read-only roles (VIEWER, REPORTER)
    const activeSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const noSensors = useSensors(); // empty — disables DnD
    const boardSensors = isReadOnly ? noSensors : activeSensors;

    return (
        <DndContext
            sensors={boardSensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {isReadOnly && (
                <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <span className="text-amber-500">🔒</span>
                    <span><strong>View-only Board —</strong> your role does not have permission to move tasks between states.</span>
                </div>
            )}
            <div className={`flex flex-col gap-6 ${isReadOnly ? 'select-none' : ''}`}>

                {swimlanes.map((lane) => (
                    <div key={lane.id} className="swimlane-group border border-border-default rounded-xl bg-bg-raised overflow-hidden shadow-sm">
                        {groupBy && (
                            <div className="bg-bg-base px-5 py-3 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm relative z-10">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                                        <span className="text-text-secondary capitalize mr-1">{groupBy === 'assigneeId' ? 'Assignee' : 'Priority'}:</span>
                                        <span className="text-accent bg-accent/10 px-2 py-0.5 rounded ml-1">{lane.title}</span>
                                    </h3>
                                    <span className="text-text-secondary text-xs font-medium bg-bg-hover px-2 py-0.5 rounded-full border border-border-subtle">
                                        {states.reduce((acc, state) => acc + (tasksBySwimlaneAndColumn[lane.id][state.id]?.length || 0), 0)} tasks
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className={`flex items-start gap-4 overflow-x-auto p-4 kanban-board`}>
                            {states.map((state) => (
                                <KanbanColumn
                                    key={`${state.id}::${lane.id}`}
                                    id={`${state.id}::${lane.id}`}
                                    state={state}
                                    tasks={tasksBySwimlaneAndColumn[lane.id][state.id] || []}
                                    onTaskClick={onTaskClick}
                                    isReadOnly={isReadOnly}
                                    showStoryPoints={showStoryPoints}
                                    showDueDate={showDueDate}
                                    collapsed={!!collapsedColumns[state.id]}
                                    onToggleCollapse={() => handleToggleCollapse(state.id)}
                                    selectedTaskIds={selectedTaskIds}
                                    onToggleSelect={onToggleSelect}
                                    viewDensity={viewDensity}
                                    canCreate={canCreate}
                                    projectId={projectId}
                                    wipLimit={state.wipLimit || null}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <RichTaskCard
                            task={activeTask}
                            isOverlay
                            showStoryPoints={showStoryPoints}
                            showDueDate={showDueDate}
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
