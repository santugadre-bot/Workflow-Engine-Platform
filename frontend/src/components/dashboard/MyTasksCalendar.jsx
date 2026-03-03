import React, { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    isToday,
    setHours,
    setMinutes,
    getHours
} from 'date-fns';
import {
    HiChevronLeft,
    HiChevronRight,
    HiOutlineCheckCircle,
    HiOutlineClock
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function MyTasksCalendar({ tasks, organizationId, onTaskClick }) {
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        if (viewMode === 'month') {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart);
            const endDate = endOfWeek(monthEnd);
            return eachDayOfInterval({ start: startDate, end: endDate });
        } else if (viewMode === 'week') {
            const startDate = startOfWeek(currentDate);
            const endDate = endOfWeek(currentDate);
            return eachDayOfInterval({ start: startDate, end: endDate });
        } else {
            return [currentDate];
        }
    }, [currentDate, viewMode]);

    // Group tasks by date string (YYYY-MM-DD) for O(1) lookup
    const tasksByDate = useMemo(() => {
        const grouped = {};
        tasks.forEach(task => {
            // Use startDate if available, else dueDate
            const dateStr = task.startDate || task.dueDate;
            if (dateStr) {
                const dateKey = format(new Date(dateStr), 'yyyy-MM-dd');
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const next = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prev = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
            {/* Calendar Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 min-w-[150px]">
                        {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                        {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
                        {viewMode === 'day' && format(currentDate, 'MMMM d, yyyy')}
                    </h2>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={prev}
                            className="p-1 hover:bg-white hover:text-indigo-600 rounded-md transition-all text-slate-500"
                        >
                            <HiChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={next}
                            className="p-1 hover:bg-white hover:text-indigo-600 rounded-md transition-all text-slate-500"
                        >
                            <HiChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    {['month', 'week', 'day'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`
                                px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all
                                ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {/* Weekday Headers for Month/Week */}
                <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} border-b border-slate-200 flex-none`}>
                    {calendarDays.slice(0, viewMode === 'day' ? 1 : 7).map(day => (
                        <div key={day.toString()} className="py-2 text-center border-r border-slate-200 bg-slate-50 last:border-r-0">
                            <div className="text-xs font-semibold text-slate-500">{format(day, 'EEE')}</div>
                            <div className={`text-sm font-bold ${isToday(day) ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {viewMode === 'month' ? (
                        <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                            {calendarDays.map((day, dayIdx) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayTasks = tasksByDate[dateKey] || [];
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`min-h-[100px] border-b border-r border-slate-200 p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50/50 
                                            ${!isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'} 
                                            ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-indigo-600 text-white' : !isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                                            {dayTasks.map(task => (
                                                <TaskPill key={task.id} task={task} onClick={() => onTaskClick && onTaskClick(task)} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Week / Day View (Time Grid) */
                        <div className="relative min-h-[1440px]"> {/* 24h * 60px/h = 1440px */}
                            {/* Time Labels (Background) */}
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <div key={hour} className="absolute w-full h-[60px] border-b border-slate-100 flex items-start group" style={{ top: hour * 60 }}>
                                    <span className="text-[10px] text-slate-400 -mt-2 bg-white px-1 ml-1 group-hover:text-slate-600">
                                        {format(setHours(new Date(), hour), 'h a')}
                                    </span>
                                </div>
                            ))}

                            {/* Column Columns */}
                            <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} h-full absolute inset-0 pointer-events-none`}>
                                {calendarDays.map((day, dayIdx) => (
                                    <div key={day.toString()} className="border-r border-slate-100 h-full relative pointer-events-auto">
                                        {/* Tasks for this day */}
                                        {(tasksByDate[format(day, 'yyyy-MM-dd')] || []).map(task => {
                                            // Calculate position
                                            const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : new Date());
                                            const end = task.endDate ? new Date(task.endDate) : addDays(start, 0); // Default duration?

                                            // If no time, default to All Day (top) - logic needed
                                            // Simplified: use hours from date
                                            let startMin = getHours(start) * 60 + start.getMinutes();
                                            let durationMin = task.endDate ? (end - start) / 60000 : 60; // Default 1h
                                            if (durationMin < 30) durationMin = 30; // Min height

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick && onTaskClick(task)}
                                                    className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border-l-4 overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm ${getPriorityColor(task.priority)}`}
                                                    style={{
                                                        top: `${startMin}px`,
                                                        height: `${durationMin}px`,
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <div className="font-semibold truncate">{task.title}</div>
                                                    <div className="text-[10px] opacity-80 truncate">
                                                        {format(start, 'h:mm a')} - {task.endDate ? format(end, 'h:mm a') : '...'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TaskPill({ task, onClick }) {
    const isCompleted = ['DONE', 'COMPLETED'].includes(task.currentState);

    const priorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <button
            onClick={onClick}
            className={`
                group text-[10px] p-1.5 rounded border border-l-2 truncate transition-all text-left w-full
                ${isCompleted
                    ? 'bg-slate-50 border-slate-200 text-slate-400 border-l-slate-300 line-through'
                    : `${priorityColor(task.priority)} hover:shadow-sm hover:translate-x-0.5`
                }
                ${task.currentState === 'IN_PROGRESS' && !isCompleted ? 'border-l-indigo-500' : ''}
                ${task.priority === 'CRITICAL' && !isCompleted ? 'border-l-red-500' : ''}
            `}
            title={task.title}
        >
            <div className="flex items-center gap-1">
                {isCompleted && <HiOutlineCheckCircle className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate">{task.title}</span>
            </div>
        </button>
    );
}
