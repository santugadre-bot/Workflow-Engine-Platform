import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi';

const TaskCard = React.memo(({ task, onClick, isOverlay }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: isOverlay, // Disable sortable logic if it's the overlay
        data: {
            type: 'Task',
            task,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const getDueDateLabel = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays <= 7) return `Due in ${diffDays}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const priorityClass = task.priority ? `badge-priority-${task.priority.toLowerCase()}` : 'badge-neutral';

    if (isOverlay) {
        return (
            <div className="task-card task-card-overlay">
                <div className="task-card-header">
                    {task.priority && <span className={`badge ${priorityClass}`}>{task.priority}</span>}
                </div>
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <HiOutlineUser className="w-4 h-4" />
                        <span>{task.assigneeName || 'Unassigned'}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue ? 'task-card-overdue' : ''}`}
            onClick={() => onClick && onClick(task.id)}
        >
            <div className="task-card-header flex justify-between items-center mb-2">
                {task.priority && <span className={`badge ${priorityClass} text-xs`}>{task.priority}</span>}
                {/* ID or other quick info could go here */}
            </div>

            <div className="task-title font-medium text-sm mb-3 text-gray-900 line-clamp-2">
                {task.title}
            </div>

            <div className="task-meta flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                <div className="flex items-center gap-2">
                    {task.assigneeName ? (
                        <div className="avatar-xs bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" title={task.assigneeName}>
                            {task.assigneeName[0]}
                        </div>
                    ) : (
                        <div className="avatar-xs bg-gray-100 text-gray-400 rounded-full w-6 h-6 flex items-center justify-center">
                            <HiOutlineUser className="w-3 h-3" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {task.dueDate && (
                        <span className={`due-date flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            <HiOutlineCalendar className="w-3 h-3" />
                            {getDueDateLabel(task.dueDate)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

export default TaskCard;
