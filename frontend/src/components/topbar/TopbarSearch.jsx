import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineFolder, HiOutlineClipboardList, HiOutlineUser } from 'react-icons/hi';
import { useQueryClient } from '@tanstack/react-query';
import useUIStore from '../../store/uiStore';

/**
 * TopbarSearch — enterprise search input.
 *
 * Behavior:
 * - Debounced 300ms — does NOT navigate on keystroke
 * - Shows inline dropdown with top 5 results (tasks, projects, users)
 * - Navigate only on result selection
 * - ⌘K / Ctrl+K / '/' → opens CommandPalette
 * - Mobile: hides input, shows icon that opens CommandPalette
 */
export default function TopbarSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();
    const qc = useQueryClient();
    const openCommandPalette = useUIStore((s) => s.openCommandPalette);
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    // Global keyboard shortcut: ⌘K / Ctrl+K / '/'
    useEffect(() => {
        const handler = (e) => {
            const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
            const isCmdK = (e.metaKey || e.ctrlKey) && e.key === 'k';

            // Don't hijack '/' when typing in an input/textarea
            if (isSlash) {
                const tag = document.activeElement?.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
            }

            if (isSlash || isCmdK) {
                e.preventDefault();
                openCommandPalette();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [openCommandPalette]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search against cached data
    const search = useCallback((q) => {
        if (!q.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const lower = q.toLowerCase();
        const found = [];

        // Search projects from cache
        const projects = qc.getQueryData(['projects', activeOrganizationId]) || [];
        projects.forEach((p) => {
            if (p.name?.toLowerCase().includes(lower) && found.length < 5) {
                found.push({
                    type: 'project',
                    id: p.id,
                    label: p.name,
                    path: `/projects/${activeOrganizationId}/${p.id}`,
                    icon: HiOutlineFolder,
                    meta: 'Project',
                });
            }
        });

        // Search tasks from any cached task list
        const allCacheKeys = qc.getQueryCache().getAll();
        allCacheKeys.forEach((entry) => {
            if (entry.queryKey[0] === 'tasks' && Array.isArray(entry.state.data)) {
                entry.state.data.forEach((task) => {
                    if (task.title?.toLowerCase().includes(lower) && found.length < 8) {
                        found.push({
                            type: 'task',
                            id: task.id,
                            label: task.title,
                            path: `/projects/${activeOrganizationId}/${task.projectId}/tasks/${task.id}`,
                            icon: HiOutlineClipboardList,
                            meta: task.status || 'Task',
                        });
                    }
                });
            }
        });

        setResults(found.slice(0, 5));
        setIsOpen(found.length > 0);
    }, [qc, activeOrganizationId]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(val), 300);
    };

    const handleSelect = (result) => {
        navigate(result.path);
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
            inputRef.current?.blur();
        }
    };

    const isMac = navigator.platform?.toUpperCase().includes('MAC');
    const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            {/* Desktop search input */}
            <div className="relative hidden sm:block group">
                <HiOutlineSearch
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? 'text-primary' : 'text-slate-400'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={`Search…`}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-16 text-sm
                        focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
                        transition-all placeholder:text-slate-400"
                />
                {/* Shortcut hint */}
                <button
                    onClick={openCommandPalette}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium
                        text-slate-400 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
                    tabIndex={-1}
                    title="Open command palette"
                >
                    {shortcutHint}
                </button>
            </div>

            {/* Mobile: icon only → opens command palette */}
            <button
                onClick={openCommandPalette}
                className="sm:hidden p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                title="Search"
            >
                <HiOutlineSearch className="w-5 h-5" />
            </button>

            {/* Inline results dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-[1100] overflow-hidden">
                    <div className="py-1">
                        {results.map((result) => {
                            const Icon = result.icon;
                            return (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className={`p-1.5 rounded-md flex-shrink-0 ${result.type === 'project' ? 'bg-blue-50 text-blue-500' :
                                            result.type === 'task' ? 'bg-purple-50 text-purple-500' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{result.label}</p>
                                        <p className="text-xs text-slate-400">{result.meta}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="border-t border-slate-100 px-3 py-2">
                        <button
                            onClick={openCommandPalette}
                            className="text-xs text-slate-400 hover:text-primary transition-colors"
                        >
                            Press {shortcutHint} for full search
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
