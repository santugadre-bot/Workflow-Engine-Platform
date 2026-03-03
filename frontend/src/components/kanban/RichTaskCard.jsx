import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    HiOutlineMenuAlt2,
    HiOutlineChatAlt,
    HiOutlinePaperClip,
    HiCheck,
    HiOutlineClock,
    HiPlus,
    HiLockClosed
} from 'react-icons/hi';

export default function RichTaskCard({
    task,
    onClick,
    isOverlay,
    showStoryPoints = true,
    showDueDate = true,
    showTags = true,
    showCover = true,
    showId = false,
    compact = false,
    isSelected = false,
    onToggleSelect
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            case 'MEDIUM': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                // If clicking the checkbox area, don't open task
                if (e.target.closest('[data-checkbox]')) return;
                onClick(task.id);
            }}
            className={`
                group relative rounded-xl border shadow-sm ${compact ? 'p-2.5' : 'p-3.5'}
                hover:shadow-md transition-all cursor-grab active:cursor-grabbing
                ${isSelected ? 'border-primary/50 bg-primary/5 shadow-primary/10' : task.isBlocked ? 'border-danger bg-danger/10 hover:border-danger/80' : 'border-border-subtle bg-bg-raised hover:border-accent'}
                ${isOverlay ? 'shadow-xl rotate-2 scale-105 cursor-grabbing' : ''}
            `}
        >
            {/* Checkbox (visible on hover or when selected) */}
            {onToggleSelect && (
                <div
                    data-checkbox="true"
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
                    className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all
                        ${isSelected
                            ? 'bg-primary border-primary text-white'
                            : 'border-border-default bg-bg-base opacity-0 group-hover:opacity-100'}`}
                >
                    {isSelected && <HiCheck className="w-3 h-3" />}
                </div>
            )}

            {/* Cover Image */}
            {task.coverImage && showCover && (
                <div className={`rounded-lg overflow-hidden relative ${compact ? 'h-24 mb-2' : 'h-32 mb-3'}`}>
                    <img src={task.coverImage} alt="Cover" className="w-full h-full object-cover" />
                </div>
            )}

            {/* Tags & ID */}
            {(showTags || showId) && (
                <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mb-1.5' : 'mb-2'}`}>
                    {showId && (
                        <span className="text-[10px] font-mono text-text-muted">#{task.id.substring(0, 4)}</span>
                    )}
                    {showTags && (
                        <>
                            {task.isBlocked && (
                                <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold tracking-tight bg-red-100/80 px-1.5 py-0.5 rounded">
                                    <HiLockClosed className="w-3 h-3" />
                                    BLOCKED
                                </div>
                            )}
                            {task.priority && (
                                <div className={`w-8 h-1 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`} />
                            )}
                            {task.tags?.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-bg-hover text-text-secondary text-[9px] uppercase font-bold rounded tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Title */}
            <h4 className={`font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-2 ${compact ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                {task.title}
            </h4>

            {/* Footer Metadata */}
            <div className={`flex items-center justify-between border-t border-border-subtle ${compact ? 'pt-1.5 mt-1.5' : 'pt-3 mt-3'}`}>
                <div className="flex items-center gap-3">
                    {/* Subtasks */}
                    {task.subtaskCount > 0 && (
                        <div className={`flex items-center gap-1 text-xs ${task.completedSubtaskCount === task.subtaskCount ? 'text-emerald-600' : 'text-text-muted'}`}>
                            <HiOutlineMenuAlt2 className="w-3.5 h-3.5" />
                            <span>{task.completedSubtaskCount}/{task.subtaskCount}</span>
                        </div>
                    )}

                    {/* ... rest of metadata ... */}

                    {/* Comments */}
                    {task.commentCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                            <HiOutlineChatAlt className="w-3.5 h-3.5" />
                            <span>{task.commentCount}</span>
                        </div>
                    )}

                    {/* Story Points */}
                    {showStoryPoints && task.storyPoints > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-text-primary text-bg-base text-[9px] font-black uppercase tracking-tighter shadow-sm">
                            {task.storyPoints}
                        </div>
                    )}

                    {/* Date Range or Due Date */}
                    {showDueDate && (task.startDate || task.dueDate) && (
                        <div className={`flex items-center gap-1 text-xs ${task.daysDue < 0 && !['DONE', 'COMPLETED'].includes(task.currentState) ? 'text-red-600 font-medium' : 'text-text-muted'}`}>
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            {task.startDate && task.endDate ? (
                                <span className="truncate max-w-[100px]" title={`${new Date(task.startDate).toLocaleString()} - ${new Date(task.endDate).toLocaleString()}`}>
                                    {new Date(task.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    {new Date(task.startDate).toDateString() !== new Date(task.endDate).toDateString() ?
                                        ` - ${new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                                        :
                                        ` ${new Date(task.startDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                                    }
                                </span>
                            ) : (
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                            {task.daysDue < 0 && !['DONE', 'COMPLETED'].includes(task.currentState) && <span>(Overdue)</span>}
                        </div>
                    )}
                </div>

                {/* Assignee Avatar */}
                {task.assigneeId ? (
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold ring-2 ring-bg-base">
                        {(task.assigneeName || 'U').charAt(0)}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-border-default flex items-center justify-center text-text-muted">
                        <HiPlus className="w-3 h-3" />
                    </div>
                )}
            </div>
        </div>
    );
}
