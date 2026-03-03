import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { HiOutlineChevronLeft, HiPlus, HiX, HiExclamation } from 'react-icons/hi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api/tasks';

import RichTaskCard from './RichTaskCard';

const KanbanColumn = React.memo(({
    id,
    state,
    tasks,
    onTaskClick,
    isReadOnly,
    collapsed,
    onToggleCollapse,
    cardSettings,
    viewDensity,
    selectedTaskIds,
    onToggleSelect,
    // Feature B: quick-add
    canCreate,
    projectId,
    // Feature D: WIP limit (passed from workflow state config if present)
    wipLimit,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id || state.id,
        disabled: isReadOnly,
    });

    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    // Feature C: overdue count — use state.type (column-level) instead of t.stateType
    // (TaskResponse doesn't include stateType; the column itself knows its type)
    const isDoneColumn = state.type === 'DONE' || state.type === 'END';
    const overdueCount = useMemo(() => {
        if (isDoneColumn) return 0; // Tasks in DONE/END columns are never "overdue"
        const now = new Date();
        return tasks.filter((t) => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < now;
        }).length;
    }, [tasks, isDoneColumn]);

    // Feature D: WIP limit exceeded
    const wipExceeded = wipLimit && tasks.length > wipLimit;

    // Feature B: inline quick-add state
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickTitle, setQuickTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (title) => tasksApi.create(projectId, {
            title,
            stateId: state.id,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });

    const openQuickAdd = useCallback(() => {
        setShowQuickAdd(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const closeQuickAdd = useCallback(() => {
        setShowQuickAdd(false);
        setQuickTitle('');
    }, []);

    const submitQuickAdd = useCallback(async () => {
        const title = quickTitle.trim();
        if (!title || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync(title);
            setQuickTitle('');
            // keep form open for rapid entry
            setTimeout(() => inputRef.current?.focus(), 50);
        } finally {
            setIsSubmitting(false);
        }
    }, [quickTitle, isSubmitting, createMutation]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitQuickAdd();
        }
        if (e.key === 'Escape') closeQuickAdd();
    }, [submitQuickAdd, closeQuickAdd]);

    // ===================== COLLAPSED VIEW =====================
    if (collapsed) {
        return (
            <div
                ref={setNodeRef}
                className={`flex-shrink-0 h-full bg-bg-raised border border-border-default rounded-xl flex flex-col items-center py-4 w-12 cursor-pointer hover:bg-bg-hover transition-colors ${isOver ? 'ring-2 ring-indigo-400' : ''}`}
                onClick={onToggleCollapse}
                title={`Expand ${state.name}`}
            >
                <div className={`w-3 h-3 rounded-full status-${state.type.toLowerCase().replace('_', '-')} mb-4 shadow-sm`} />
                {overdueCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center mb-3 shadow">
                        {overdueCount}
                    </span>
                )}
                <div className="writing-vertical-rl text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap select-none rotate-180">
                    {state.name} <span className="text-text-muted ml-2">({tasks.length})</span>
                </div>
            </div>
        );
    }

    // ===================== EXPANDED VIEW =====================
    return (
        <div
            ref={setNodeRef}
            className={`kanban-column flex-shrink-0 w-80 bg-bg-base/80 backdrop-blur-sm rounded-xl flex flex-col max-h-full border transition-colors shadow-sm
                ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50 border-indigo-200' : wipExceeded ? 'border-amber-300' : 'border-border-subtle'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border-default mb-1 group">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ring-1 ring-white shadow-sm flex-shrink-0 status-${state.type.toLowerCase().replace('_', '-')}`}></span>
                    <h3 className="text-sm font-bold text-text-primary truncate">{state.name}</h3>
                    {/* Task count + optional WIP limit */}
                    <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center shadow-sm border flex-shrink-0
                            ${wipExceeded
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-bg-raised border-border-default text-text-secondary'
                            }`}
                        title={wipLimit ? `WIP limit: ${wipLimit}` : undefined}
                    >
                        {tasks.length}{wipLimit ? `/${wipLimit}` : ''}
                    </span>
                    {/* Feature C: overdue badge */}
                    {overdueCount > 0 && (
                        <span
                            className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md flex-shrink-0"
                            title={`${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`}
                        >
                            <HiExclamation className="w-3 h-3" />
                            {overdueCount}
                        </span>
                    )}
                    {/* Feature D: WIP warning */}
                    {wipExceeded && (
                        <span className="text-[10px] font-semibold text-amber-600" title="WIP limit exceeded">
                            Over limit
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* Feature B: quick-add button */}
                    {canCreate && !isReadOnly && !showQuickAdd && (
                        <button
                            onClick={openQuickAdd}
                            className="text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-hover rounded"
                            title="Quick add task"
                        >
                            <HiPlus className="w-4 h-4" />
                        </button>
                    )}
                    {!isReadOnly && (
                        <button
                            onClick={onToggleCollapse}
                            className="text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-hover rounded"
                            title="Collapse Column"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <SortableContext
                items={isReadOnly ? [] : taskIds}
                strategy={verticalListSortingStrategy}
                id={id || state.id}
                disabled={isReadOnly}
            >
                <div className={`flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 custom-scrollbar ${viewDensity === 'compact' ? 'space-y-1.5' : 'space-y-3'}`}>
                    {tasks.map((task) => (
                        <RichTaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                            showStoryPoints={cardSettings?.showStoryPoints}
                            showDueDate={cardSettings?.showDueDate}
                            showTags={cardSettings?.showTags}
                            showCover={cardSettings?.showCover}
                            showId={cardSettings?.showId}
                            compact={viewDensity === 'compact'}
                            isSelected={selectedTaskIds ? selectedTaskIds.has(task.id) : false}
                            onToggleSelect={onToggleSelect}
                        />
                    ))}

                    {tasks.length === 0 && !showQuickAdd && (
                        <div
                            className="h-24 rounded-lg border-2 border-dashed border-border-default flex flex-col items-center justify-center text-text-muted gap-1.5 m-1 cursor-pointer hover:border-accent hover:text-accent transition-colors"
                            onClick={canCreate && !isReadOnly ? openQuickAdd : undefined}
                        >
                            {isReadOnly ? (
                                <span className="text-xs">No tasks</span>
                            ) : (
                                <>
                                    <HiPlus className="w-4 h-4" />
                                    <span className="text-xs font-medium">Add task</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* Feature B: inline quick-add form */}
            {showQuickAdd && canCreate && (
                <div className="px-2 pb-2 pt-0">
                    <div className="bg-bg-base border border-accent/30 rounded-lg shadow-sm p-2 space-y-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Task title…"
                            className="w-full text-sm text-text-primary placeholder-text-muted bg-transparent border-none outline-none"
                            disabled={isSubmitting}
                        />
                        <div className="flex items-center justify-end gap-1.5">
                            <button
                                onClick={closeQuickAdd}
                                className="p-1 text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded transition-colors"
                                title="Cancel (Esc)"
                            >
                                <HiX className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={submitQuickAdd}
                                disabled={!quickTitle.trim() || isSubmitting}
                                className="text-xs font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? '…' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default KanbanColumn;
