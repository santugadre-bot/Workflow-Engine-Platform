import React, { useState, useRef, useEffect } from 'react';
import { HiSearch, HiViewBoards, HiViewList, HiTag, HiX, HiMenu, HiViewGrid } from 'react-icons/hi';

function TagDropdown({ availableTags, selectedTags, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (tag) => {
        onChange(
            selectedTags.includes(tag)
                ? selectedTags.filter(t => t !== tag)
                : [...selectedTags, tag]
        );
    };

    if (availableTags.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 pl-3 pr-3 py-2 border rounded-lg text-sm transition-colors
                    ${selectedTags.length > 0
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
            >
                <HiTag className="w-4 h-4" />
                Tags
                {selectedTags.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedTags.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[160px] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {availableTags.map(tag => (
                        <label
                            key={tag}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                        >
                            <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={() => toggle(tag)}
                                className="rounded border-slate-300 text-primary focus:ring-primary/20"
                            />
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                {tag}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProjectToolbar({
    viewMode,
    setViewMode,
    filters,
    setFilters,
    members = [],
    availableTags = [],
    density,
    setDensity,
    hideViewSwitcher = false,
}) {
    const hasActiveFilters = filters.search || filters.priority || filters.assigneeId || filters.tags.length > 0;

    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            {/* Left Side: Search & Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                {/* Search */}
                <div className="relative group">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56 transition-all"
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

                {/* Priority Filter */}
                <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-primary hover:bg-slate-50 transition-colors cursor-pointer"
                >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>

                {/* Assignee Filter */}
                <select
                    value={filters.assigneeId || ''}
                    onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
                    className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-primary hover:bg-slate-50 transition-colors cursor-pointer"
                >
                    <option value="">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    {members.map(m => (
                        <option key={m.id} value={m.userId}>{m.displayName}</option>
                    ))}
                </select>

                {/* Tag Filter */}
                <TagDropdown
                    availableTags={availableTags}
                    selectedTags={filters.tags}
                    onChange={(tags) => setFilters({ ...filters, tags })}
                />

                {/* Clear All Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={() => setFilters({ search: '', priority: '', assigneeId: '', tags: [], groupBy: filters.groupBy })}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0"
                    >
                        <HiX className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            {/* Right Side: Density Toggle (board only) + View Switcher */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Group By Filter */}
                {viewMode === 'BOARD' && (
                    <select
                        value={filters.groupBy || ''}
                        onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                        className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-primary hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <option value="">No Grouping</option>
                        <option value="assigneeId">Group by Assignee</option>
                        <option value="priority">Group by Priority</option>
                    </select>
                )}
                {/* Density toggle — only when density prop is passed (board view) */}
                {setDensity && viewMode === 'BOARD' && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg" title="Card density">
                        <button
                            onClick={() => setDensity('comfortable')}
                            className={`p-1.5 rounded-md transition-all ${density === 'comfortable' || !density
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            title="Comfortable"
                        >
                            <HiViewGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDensity('compact')}
                            className={`p-1.5 rounded-md transition-all ${density === 'compact'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            title="Compact"
                        >
                            <HiMenu className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* View Switcher */}
                {!hideViewSwitcher && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('BOARD')}
                            className={`p-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'BOARD'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <HiViewBoards className="w-5 h-5" />
                            <span className="hidden sm:inline">Board</span>
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'LIST'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <HiViewList className="w-5 h-5" />
                            <span className="hidden sm:inline">List</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

