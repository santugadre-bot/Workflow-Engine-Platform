import { useLocation, Link } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi';
import { useQueryClient } from '@tanstack/react-query';
import useUIStore from '../../store/uiStore';

/**
 * TopbarBreadcrumb — context-driven breadcrumb trail.
 *
 * Reads route + cached query data to build human-readable crumbs.
 * Max 3 levels. Last item is non-clickable. Long names are truncated.
 *
 * Desktop: full trail
 * Tablet/Mobile: collapses to last 1 segment only
 */
export default function TopbarBreadcrumb() {
    const location = useLocation();
    const qc = useQueryClient();
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    // Pull names from React Query cache — zero extra fetches
    const organizations = qc.getQueryData(['organizations']) || [];
    const activeOrg = organizations.find((o) => o.id === activeOrganizationId);

    const crumbs = buildCrumbs(location.pathname, activeOrg, qc, activeOrganizationId);

    if (crumbs.length === 0) return null;

    // Limit to 3 levels
    const visible = crumbs.slice(-3);

    return (
        <nav aria-label="Breadcrumb" className="flex items-center min-w-0">
            {/* Mobile: show only last crumb */}
            <ol className="flex items-center gap-1 min-w-0">
                {visible.map((crumb, i) => {
                    const isLast = i === visible.length - 1;
                    const isFirst = i === 0;

                    return (
                        <li
                            key={`${crumb.path}-${i}`}
                            className={`flex items-center gap-1 min-w-0 ${!isFirst ? '' : ''}`}
                        >
                            {/* Separator — hide before first item */}
                            {!isFirst && (
                                <HiChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-[var(--topbar-crumb-sep)]" />
                            )}

                            {/* Hide earlier crumbs on mobile */}
                            <span className={`${!isLast && i < visible.length - 2 ? 'hidden sm:flex' : 'flex'} items-center`}>
                                {isLast ? (
                                    <span
                                        className="text-sm font-medium truncate max-w-[140px] text-[var(--topbar-crumb-last)]"
                                        title={crumb.label}
                                    >
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={crumb.path}
                                        className="text-sm transition-colors truncate max-w-[100px] hover:text-indigo-500 text-[var(--topbar-crumb-link)]"
                                        title={crumb.label}
                                    >
                                        {crumb.label}
                                    </Link>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/** Build breadcrumb array from pathname + cached data */
function buildCrumbs(pathname, activeOrg, qc, activeOrganizationId) {
    const crumbs = [];
    const segments = pathname.split('/').filter(Boolean);

    // Route patterns we understand
    // /dashboard
    if (pathname === '/dashboard') {
        crumbs.push({ label: 'Dashboard', path: '/dashboard' });
        return crumbs;
    }

    // /inbox
    if (pathname === '/inbox') {
        crumbs.push({ label: 'Inbox', path: '/inbox' });
        return crumbs;
    }

    // /profile
    if (pathname === '/profile') {
        crumbs.push({ label: 'Profile', path: '/profile' });
        return crumbs;
    }

    // /projects/:orgId  — projects list
    if (segments[0] === 'projects' && segments.length === 2) {
        const orgName = activeOrg?.name || 'Organization';
        crumbs.push({ label: orgName, path: '/dashboard' });
        crumbs.push({ label: 'Projects', path: `/projects/${segments[1]}` });
        return crumbs;
    }

    // /projects/:orgId/:projectId/...
    if (segments[0] === 'projects' && segments.length >= 3) {
        const orgId = segments[1];
        const projectId = segments[2];
        const orgName = activeOrg?.name || 'Organization';

        // Try to get project name from cache
        const project = qc.getQueryData(['projects', orgId, projectId]);
        const projectName = project?.name || 'Project';

        crumbs.push({ label: orgName, path: `/projects/${orgId}` });
        crumbs.push({ label: projectName, path: `/projects/${orgId}/${projectId}` });

        // Sub-section
        if (segments[3]) {
            const section = SECTION_LABELS[segments[3]] || capitalize(segments[3]);
            crumbs.push({ label: section, path: pathname });
        }
        return crumbs;
    }

    // /organizations/:orgId/...
    if (segments[0] === 'organizations' && segments.length >= 2) {
        const orgName = activeOrg?.name || 'Organization';
        crumbs.push({ label: orgName, path: `/projects/${segments[1]}` });

        if (segments[2]) {
            const section = SECTION_LABELS[segments[2]] || capitalize(segments[2]);
            crumbs.push({ label: section, path: pathname });
        }
        return crumbs;
    }

    // /workflows/:orgId
    if (segments[0] === 'workflows') {
        const orgName = activeOrg?.name || 'Organization';
        crumbs.push({ label: orgName, path: `/projects/${segments[1]}` });
        crumbs.push({ label: 'Workflows', path: pathname });
        return crumbs;
    }

    return crumbs;
}

const SECTION_LABELS = {
    analytics: 'Analytics',
    settings: 'Settings',
    members: 'Members',
    approvals: 'Approvals',
    automation: 'Automation',
    backlog: 'Backlog',
    board: 'Board',
    tasks: 'Tasks',
    my: 'My Tasks',
    sprints: 'Sprints',
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
