import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineFolder, HiOutlineClipboardList, HiOutlineHome, HiOutlineInbox, HiOutlineCheckCircle, HiOutlineX } from 'react-icons/hi';
import { useQueryClient } from '@tanstack/react-query';
import useUIStore from '../../store/uiStore';

/**
 * CommandPalette — full-screen modal command palette.
 *
 * Triggered by: ⌘K / Ctrl+K / '/' (from TopbarSearch)
 * Closed by: Escape / click outside / result selection
 *
 * Searches: projects, tasks (from cache), quick nav links
 * No heavy animation — simple fade.
 */
export default function CommandPalette() {
    const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
    const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();
    const qc = useQueryClient();

    // Focus input when opened
    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery('');
            setResults(getDefaultResults(activeOrganizationId));
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen, activeOrganizationId]);

    // Escape to close
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') closeCommandPalette();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [closeCommandPalette]);

    const search = useCallback((q) => {
        if (!q.trim()) {
            setResults(getDefaultResults(activeOrganizationId));
            return;
        }

        const lower = q.toLowerCase();
        const found = [];

        // Quick nav matches
        QUICK_NAV.forEach((item) => {
            if (item.label.toLowerCase().includes(lower)) {
                found.push({ ...item, path: item.path(activeOrganizationId) });
            }
        });

        // Projects from cache
        const projects = qc.getQueryData(['projects', activeOrganizationId]) || [];
        projects.forEach((p) => {
            if (p.name?.toLowerCase().includes(lower)) {
                found.push({
                    type: 'project',
                    id: p.id,
                    label: p.name,
                    path: `/projects/${activeOrganizationId}/${p.id}`,
                    icon: HiOutlineFolder,
                    group: 'Projects',
                });
            }
        });

        // Tasks from any cached task list
        qc.getQueryCache().getAll().forEach((entry) => {
            if (entry.queryKey[0] === 'tasks' && Array.isArray(entry.state.data)) {
                entry.state.data.forEach((task) => {
                    if (task.title?.toLowerCase().includes(lower)) {
                        found.push({
                            type: 'task',
                            id: task.id,
                            label: task.title,
                            path: `/projects/${activeOrganizationId}/${task.projectId}/tasks/${task.id}`,
                            icon: HiOutlineClipboardList,
                            group: 'Tasks',
                            meta: task.status,
                        });
                    }
                });
            }
        });

        setResults(found.slice(0, 10));
        setSelectedIndex(0);
    }, [qc, activeOrganizationId]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(val), 200);
    };

    const handleSelect = (result) => {
        navigate(result.path);
        closeCommandPalette();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    };

    if (!commandPaletteOpen) return null;

    // Group results
    const grouped = groupResults(results);

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4"
            onClick={closeCommandPalette}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                    <HiOutlineSearch className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tasks, projects, pages…"
                        className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                    <button
                        onClick={closeCommandPalette}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto py-2">
                    {results.length === 0 && query.trim() && (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                            No results for <span className="font-medium text-slate-600">"{query}"</span>
                        </div>
                    )}

                    {Object.entries(grouped).map(([group, items]) => (
                        <div key={group}>
                            <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                {group}
                            </div>
                            {items.map((result, idx) => {
                                const globalIdx = results.indexOf(result);
                                const Icon = result.icon;
                                const isSelected = globalIdx === selectedIndex;
                                return (
                                    <button
                                        key={`${result.type}-${result.id || result.label}`}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isSelected ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-md flex-shrink-0 ${result.type === 'project' ? 'bg-blue-50 text-blue-500' :
                                                result.type === 'task' ? 'bg-purple-50 text-purple-500' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{result.label}</p>
                                            {result.meta && (
                                                <p className="text-xs text-slate-400">{result.meta}</p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">↵ Open</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">↑↓</kbd> Navigate
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">↵</kbd> Open
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">Esc</kbd> Close
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUICK_NAV = [
    { type: 'nav', label: 'Dashboard', icon: HiOutlineHome, group: 'Navigation', path: () => '/dashboard' },
    { type: 'nav', label: 'Inbox', icon: HiOutlineInbox, group: 'Navigation', path: () => '/inbox' },
    { type: 'nav', label: 'My Tasks', icon: HiOutlineCheckCircle, group: 'Navigation', path: (orgId) => `/organizations/${orgId}/tasks/my` },
];

function getDefaultResults(activeOrganizationId) {
    return QUICK_NAV.map((item) => ({ ...item, path: item.path(activeOrganizationId) }));
}

function groupResults(results) {
    return results.reduce((acc, result) => {
        const group = result.group || 'Results';
        if (!acc[group]) acc[group] = [];
        acc[group].push(result);
        return acc;
    }, {});
}
