import React from 'react';
import { HiCheck, HiOutlineArrowRight, HiOutlineClock } from 'react-icons/hi';

export default function TaskListItem({ task, onToggleComplete, onClick, isUpdating, compact = false, isSelected = false, onToggleSelect }) {
    const isCompleted = ['DONE', 'COMPLETED'].includes(task.currentState);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'text-red-600 bg-red-50 ring-red-500/20';
            case 'HIGH': return 'text-orange-600 bg-orange-50 ring-orange-500/20';
            case 'MEDIUM': return 'text-blue-600 bg-blue-50 ring-blue-500/20';
            default: return 'text-slate-600 bg-slate-50 ring-slate-500/20';
        }
    };

    // Helper to format date safely
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className={`
            group grid grid-cols-12 gap-4 items-center 
            px-4 ${compact ? 'py-2' : 'py-4'} 
            bg-white border rounded-xl hover:shadow-md transition-all duration-200 
            ${isSelected ? 'border-primary/50 bg-indigo-50/30' : (isCompleted ? 'border-slate-100 opacity-75' : 'border-slate-200 hover:border-indigo-300')}
        `}>
            {/* Actions (Col 1) - Select & Complete */}
            <div className="col-span-1 flex items-center justify-center gap-3">
                {/* Selection Checkbox */}
                <div
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
                    className={`
                        w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all
                        ${isSelected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-slate-300 bg-white opacity-0 group-hover:opacity-100'
                        }
                    `}
                >
                    {isSelected && <HiCheck className="w-3 h-3 text-white" />}
                </div>

                {/* Complete Button */}
                <button
                    className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 text-white hover:border-indigo-500 hover:bg-indigo-500'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task);
                    }}
                    disabled={isUpdating}
                    title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                >
                    <HiCheck className={`w-3.5 h-3.5 transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
            </div>

            {/* Title & Meta (Col 5) */}
            <div className="col-span-5 min-w-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onClick(task)}
                        className={`text-sm font-medium truncate text-left hover:underline ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 hover:text-indigo-600'}`}
                    >
                        {task.title}
                    </button>
                    {task.isBlocked && !isCompleted && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                            Blocked
                        </span>
                    )}
                </div>
                {!compact && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                            {task.currentState}
                        </span>
                    </div>
                )}
            </div>

            {/* Project (Col 2) */}
            <div className="col-span-2 flex items-center text-xs text-slate-500 truncate">
                <span className="w-2 h-2 rounded-full bg-slate-300 mr-2 flex-shrink-0"></span>
                <span className="truncate" title={task.projectName}>{task.projectName}</span>
            </div>

            {/* Priority (Col 2) */}
            <div className="col-span-2 flex items-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ring-1 ring-inset ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
            </div>

            {/* Due Date (Col 2) - Right Align */}
            <div className="col-span-2 flex items-center justify-end">
                {(task.startDate || task.dueDate) && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${task.daysDue < 0 && !isCompleted ? 'text-red-600' : 'text-slate-500'}`}>
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {task.startDate && task.endDate ? (
                            <span title={`${new Date(task.startDate).toLocaleString()} - ${new Date(task.endDate).toLocaleString()}`}>
                                {new Date(task.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                {new Date(task.startDate).toDateString() !== new Date(task.endDate).toDateString() ?
                                    ` - ${new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                                    :
                                    (compact ? '' : ` ${new Date(task.startDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`)
                                }
                            </span>
                        ) : (
                            formatDate(task.dueDate)
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}
