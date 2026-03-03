import React from 'react';

export default function TaskSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl animate-pulse">
            {/* Checkbox circle */}
            <div className="flex-none w-6 h-6 rounded-full bg-slate-200" />

            <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <div className="h-4 bg-slate-200 rounded w-1/3" />

                {/* Meta info row */}
                <div className="flex items-center gap-3">
                    <div className="h-3 bg-slate-200 rounded w-16" />
                    <div className="h-3 bg-slate-200 rounded w-12" />
                    <div className="h-3 bg-slate-200 rounded w-20" />
                </div>
            </div>

            {/* Date */}
            <div className="flex-none w-16 h-4 bg-slate-200 rounded" />
        </div>
    );
}
