import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiSearch, HiOutlineViewBoards, HiOutlineCog, HiLightningBolt } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';
import { organizationsApi, projectsApi } from '../../api';

export default function CommandPalette() {
    const navigate = useNavigate();
    const { commandPaletteOpen, closeCommandPalette, activeOrganizationId, setActiveOrganizationId } = useUIStore();
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const { data: organizations } = useQuery({
        queryKey: ['organizations'],
        queryFn: organizationsApi.list,
        enabled: commandPaletteOpen,
    });

    const { data: activeProjects } = useQuery({
        queryKey: ['projects', activeOrganizationId],
        queryFn: () => projectsApi.list(activeOrganizationId),
        enabled: commandPaletteOpen && !!activeOrganizationId,
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                useUIStore.getState().openCommandPalette();
            }
            if (e.key === 'Escape') {
                closeCommandPalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeCommandPalette]);

    useEffect(() => {
        if (commandPaletteOpen) {
            inputRef.current?.focus();
            setQuery('');
        }
    }, [commandPaletteOpen]);

    if (!commandPaletteOpen) return null;

    const filteredItems = [];

    if (organizations) {
        organizations.forEach(org => {
            if (org.name.toLowerCase().includes(query.toLowerCase())) {
                filteredItems.push({
                    id: `org-${org.id}`,
                    name: org.name,
                    type: 'Organization',
                    icon: <HiOutlineViewBoards />,
                    action: () => {
                        setActiveOrganizationId(org.id);
                        navigate('/dashboard');
                        closeCommandPalette();
                    }
                });
            }
        });
    }

    if (activeProjects) {
        activeProjects.forEach(p => {
            if (p.name.toLowerCase().includes(query.toLowerCase())) {
                filteredItems.push({
                    id: `p-${p.id}`,
                    name: p.name,
                    type: 'Project',
                    icon: <HiOutlineCog />,
                    action: () => {
                        navigate(`/projects/${activeOrganizationId}/${p.id}`);
                        closeCommandPalette();
                    }
                });
            }
        });
    }

    return (
        <div className="modal-overlay" onClick={closeCommandPalette}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <div className="command-input-wrapper">
                    <HiSearch className="search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search projects, organizations, or run commands..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="kbd-hint">ESC</div>
                </div>

                <div className="command-results">
                    {filteredItems.length === 0 ? (
                        <div className="no-results">No matches found.</div>
                    ) : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="command-item"
                                onClick={item.action}
                            >
                                <span className="item-icon">{item.icon}</span>
                                <span className="item-name">{item.name}</span>
                                <span className="item-type">{item.type}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="command-footer">
                    <span><kbd>↵</kbd> Select</span>
                    <span><kbd>↑↓</kbd> Navigate</span>
                </div>
            </div>
        </div>
    );
}
