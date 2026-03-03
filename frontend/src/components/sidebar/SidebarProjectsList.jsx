import { memo, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { HiOutlineStar, HiStar, HiOutlineChevronRight } from 'react-icons/hi';
import { useProjects } from '../../api/projects';
import useUIStore from '../../store/uiStore';

const MAX_VISIBLE = 8;

const STATUS_DOT = {
    ACTIVE: 'bg-emerald-400',
    IN_PROGRESS: 'bg-emerald-400',
    PLANNED: 'bg-amber-400',
    ON_HOLD: 'bg-amber-400',
    COMPLETED: 'bg-zinc-500',
    ARCHIVED: 'bg-zinc-600',
};

function getStatusDot(status) {
    return STATUS_DOT[status] || 'bg-zinc-500';
}

const ProjectRow = memo(function ProjectRow({ project, orgId, isFavorite, onPin }) {
    const handlePin = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onPin(project);
    }, [project, onPin]);

    return (
        <NavLink
            to={`/projects/${orgId}/${project.id}`}
            className={({ isActive }) => `
                group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150
                ${isActive
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium shadow-[inset_0_0_0_1px_var(--sidebar-active-border)]'
                    : 'text-sidebar-text'}
            `}
        >
            {({ isActive }) => (
                <>
                    {/* Active left indicator */}
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-active-bar shadow-[0_0_6px_var(--sidebar-active-bar)]" />
                    )}

                    {/* Status dot */}
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(project.status)}`} />

                    {/* Name */}
                    <span className="flex-1 truncate">{project.name}</span>

                    {/* Pin button */}
                    <button
                        onClick={handlePin}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        className={`flex-shrink-0 transition-all ${isFavorite
                            ? 'text-amber-400 opacity-100'
                            : 'text-sidebar-text-muted opacity-0 group-hover:opacity-100 hover:text-amber-400'
                            }`}
                    >
                        {isFavorite
                            ? <HiStar className="w-3.5 h-3.5" />
                            : <HiOutlineStar className="w-3.5 h-3.5" />
                        }
                    </button>
                </>
            )}
        </NavLink>
    );
});

export default function SidebarProjectsList({ organizationId, isCollapsed }) {
    const { data: projects, isLoading } = useProjects(organizationId);
    const favorites = useUIStore((s) => s.favorites);
    const toggleFavorite = useUIStore((s) => s.toggleFavorite);

    const handlePin = useCallback((project) => {
        const path = `/projects/${organizationId}/${project.id}`;
        toggleFavorite(organizationId, { path, label: project.name });
    }, [organizationId, toggleFavorite]);

    if (isCollapsed) return null;

    if (isLoading) {
        return (
            <div className="px-3 py-2 space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-7 rounded-lg animate-pulse bg-sidebar-hover-bg" />
                ))}
            </div>
        );
    }

    const visible = (projects || []).slice(0, MAX_VISIBLE);
    const hasMore = (projects || []).length > MAX_VISIBLE;

    if (visible.length === 0) {
        return (
            <p className="px-3 py-2 text-xs italic text-sidebar-section-text">
                No projects yet
            </p>
        );
    }

    return (
        <div className="space-y-0.5">
            {visible.map((project) => {
                const path = `/projects/${organizationId}/${project.id}`;
                const isFavorite = favorites.some((f) => f.path === path);
                return (
                    <ProjectRow
                        key={project.id}
                        project={project}
                        orgId={organizationId}
                        isFavorite={isFavorite}
                        onPin={handlePin}
                    />
                );
            })}

            {hasMore && (
                <Link
                    to={`/projects/${organizationId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors hover:text-indigo-500 text-sidebar-section-text"
                >
                    View all projects
                    <HiOutlineChevronRight className="w-3 h-3" />
                </Link>
            )}
        </div>
    );
}
