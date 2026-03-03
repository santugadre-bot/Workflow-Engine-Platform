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
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import KanbanColumn from '../kanban/KanbanColumn';
import RichTaskCard from '../kanban/RichTaskCard';

const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

// Map simplified generic states for personal board
const GENERIC_STATES = [
    { id: 'TODO', name: 'To Do', type: 'TODO', color: '#cbd5e1' },
    { id: 'IN_PROGRESS', name: 'In Progress', type: 'IN_PROGRESS', color: '#3b82f6' },
    { id: 'DONE', name: 'Done', type: 'DONE', color: '#10b981' }
];

export default function MyTasksBoard({ tasks, onTaskUpdate, onTaskClick, cardSettings, grouping, viewDensity }) {
    const [activeId, setActiveId] = useState(null);
    const [collapsedColumns, setCollapsedColumns] = useState({});

    // Swimlanes Logic
    const swimlanes = useMemo(() => {
        if (grouping === 'project') {
            const groups = {};
            tasks.forEach(t => {
                const key = t.projectName || 'No Project';
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });
            return Object.entries(groups)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([title, laneTasks]) => ({ id: title, title, tasks: laneTasks }));
        }

        if (grouping === 'priority') {
            const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
            const groups = { 'NONE': [] };
            tasks.forEach(t => {
                const p = t.priority || 'NONE';
                if (!groups[p]) groups[p] = [];
                groups[p].push(t);
            });
            return priorities
                .filter(p => groups[p] && groups[p].length > 0)
                .map(p => ({
                    id: p,
                    title: p === 'NONE' ? 'No Priority' : p.charAt(0) + p.slice(1).toLowerCase(), // Capitalize
                    tasks: groups[p]
                }));
        }

        // Default (Date or None) - Single Swimlane
        return [{ id: 'all', title: '', tasks }];
    }, [tasks, grouping]);

    // Helper: Group tasks by status for a specific swimlane
    const getTasksByColumn = (laneTasks) => {
        const grouped = {
            'TODO': [],
            'IN_PROGRESS': [],
            'DONE': []
        };
        laneTasks.forEach(task => {
            let status = task.currentState;
            if (status === 'COMPLETED') status = 'DONE';
            if (!grouped[status]) status = 'TODO';
            grouped[status].push(task);
        });
        // Sort by position/date
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
        return grouped;
    };

    // Global active task for overlay
    const activeTask = useMemo(
        () => tasks.find((task) => task.id === activeId),
        [activeId, tasks]
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const overId = over.id;
        let destinationStatus = null;

        // 1. Dropped on column (ID is like "status" or "status-swimlaneId"?)
        // If we have multiple swimlanes, columns need unique droppable IDs?
        // DndKit needs unique IDs.
        // Current implementation uses 'TODO', 'IN_PROGRESS' which are unique global constants in `GENERIC_STATES`.
        // If we have multiple swimlanes, we have multiple "TODO" columns.
        // We MUST suffix column IDs with swimlane ID: `TODO::ProjectA`.

        // Parsing Drop ID
        const activeTaskObj = tasks.find(t => t.id === active.id);
        // If Swimlanes enabled, we also need to update the Swimlane Key (e.g. Project)?
        // Usually Personal Board doesn't move tasks between projects via D&D easily unless intent is explicit.
        // For now, I'll assume tasks stay in their swimlane or strict status change.

        // Let's refine Column Droppable ID:
        // genericId: "TODO", "IN_PROGRESS"
        // If I keep IDs simple, DndKit might get confused if multiple "TODO" droppables exist? Yes.
        // I MUST make Droppable IDs unique: `${state.id}::${swimlane.id}`.

        // Handle Drag End Parsing:
        if (overId.includes('::')) {
            const [status, laneId] = overId.split('::');
            destinationStatus = status;
            // Potentially update Project if laneId changed?
            // "Project" is usually read-only in this view or hard to change.
            // I'll stick to Status Update only for now.
        } else if (GENERIC_STATES.find(s => s.id === overId)) {
            destinationStatus = overId;
        } else {
            // Dropped on Task
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                destinationStatus = overTask.currentState === 'COMPLETED' ? 'DONE' : overTask.currentState;
            }
        }

        if (destinationStatus) {
            const currentTask = tasks.find(t => t.id === active.id);
            // ... update logic
            if (onTaskUpdate && currentTask) {
                onTaskUpdate(active.id, destinationStatus);
            }
        }
    };

    const toggleColumn = (statusId) => {
        setCollapsedColumns(prev => ({ ...prev, [statusId]: !prev[statusId] }));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full overflow-x-auto pb-4 custom-scrollbar">
                {swimlanes.map(swimlane => {
                    const laneTasksByColumn = getTasksByColumn(swimlane.tasks);

                    return (
                        <div key={swimlane.id} className="min-w-fit mb-8">
                            {swimlane.id !== 'all' && (
                                <div className="sticky left-0 flex items-center gap-2 mb-3 px-1">
                                    <div className="h-px bg-slate-200 flex-grow max-w-[20px]"></div>
                                    <h3 className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                        {swimlane.title}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {swimlane.tasks.length} tasks
                                    </span>
                                    <div className="h-px bg-slate-200 flex-grow"></div>
                                </div>
                            )}

                            <div className="flex gap-6 items-start">
                                {GENERIC_STATES.map((state) => (
                                    <KanbanColumn
                                        key={`${state.id}::${swimlane.id}`}
                                        id={`${state.id}::${swimlane.id}`} // Unique ID
                                        state={state}
                                        tasks={laneTasksByColumn[state.id] || []}
                                        onTaskClick={(id) => onTaskClick && onTaskClick(tasks.find(t => t.id === id))}
                                        isReadOnly={false}
                                        collapsed={collapsedColumns[state.id]}
                                        onToggleCollapse={() => toggleColumn(state.id)}
                                        cardSettings={cardSettings}
                                        viewDensity={viewDensity}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <RichTaskCard
                            task={activeTask}
                            isOverlay
                            showDueDate={cardSettings?.showDueDate}
                            showTags={cardSettings?.showTags}
                            showCover={cardSettings?.showCover}
                            showStoryPoints={cardSettings?.showStoryPoints}
                            showId={cardSettings?.showId}
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
