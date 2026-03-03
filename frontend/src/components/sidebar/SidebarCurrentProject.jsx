import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    HiOutlineViewGrid,
    HiOutlineViewBoards,
    HiOutlineCollection,
    HiOutlineLightningBolt,
    HiOutlineChartPie,
    HiOutlineCog,
    HiOutlineChevronLeft,
    HiOutlineUserGroup,
    HiOutlineClipboardList,
} from 'react-icons/hi';
import { projectsApi } from '../../api';
import { useProjectMembers } from '../../api/projects';
import { useSprints } from '../../api/sprints';
import { useAuth } from '../../context/AuthContext';
import SidebarNavItem from './SidebarNavItem';


/**
 * SidebarCurrentProject — project context mode.
 * Role-aware: hides nav items the current user cannot access.
 *
 * REPORTER sees: Overview | Reports (Analytics) | Tasks (read-only)
 * VIEWER sees:   Overview | Board | Analytics
 * Others see:    all items relevant to their role
 */
export default function SidebarCurrentProject({ activeOrganizationId, isCollapsed }) {
    const { projectId } = useParams();
    const { user } = useAuth();
    const qc = useQueryClient();

    const { data: project } = useQuery({
        queryKey: ['projects', activeOrganizationId, projectId],
        queryFn: () => projectsApi.getById(activeOrganizationId, projectId),
        enabled: !!activeOrganizationId && !!projectId,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch current user's project membership to get their role
    const { data: projectMembers } = useProjectMembers(activeOrganizationId, projectId);

    const userId = user?.userId || user?.id;
    const myProjectRole = project?.role || projectMembers?.find(m => m.userId === userId)?.role || 'MEMBER';


    const isReporter = myProjectRole === 'REPORTER';
    const isViewer = myProjectRole === 'VIEWER';
    const isContributor = !isReporter && !isViewer; // DEVELOPER, QA, TEAM_LEAD, SCRUM_MASTER, PROJECT_ADMIN

    const { data: sprints } = useSprints(projectId);
    const activeSprint = sprints?.find(s => s.status === 'ACTIVE');

    // Sprint progress from cache — zero extra fetches
    const cachedTasks = qc.getQueryData(['tasks', projectId]);
    const sprintTasks = Array.isArray(cachedTasks)
        ? cachedTasks.filter(t => t.sprintId === activeSprint?.id)
        : [];
    const sprintDone = sprintTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const sprintTotal = sprintTasks.length;
    const sprintProgress = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
    const showProgress = activeSprint && sprintTotal > 0;

    if (!projectId) return null;

    const base = `/projects/${activeOrganizationId}/${projectId}`;

    // Collapsed icon-only mode
    if (isCollapsed) {
        return (
            <div className="space-y-0.5 pt-2 border-t border-sidebar-border">
                <SidebarNavItem to={base} icon={HiOutlineViewGrid} label="Overview" end isCollapsed={isCollapsed} />
                {!isReporter && (
                    <SidebarNavItem to={`${base}/board`} icon={HiOutlineViewBoards} label="Board" isCollapsed={isCollapsed} />
                )}
                {isContributor && (
                    <SidebarNavItem to={`${base}/backlog`} icon={HiOutlineCollection} label="Backlog" isCollapsed={isCollapsed} />
                )}
                {isReporter && (
                    <SidebarNavItem to={`${base}/tasks`} icon={HiOutlineClipboardList} label="Tasks" isCollapsed={isCollapsed} />
                )}
                <SidebarNavItem to={`${base}/analytics`} icon={HiOutlineChartPie} label="Analytics" isCollapsed={isCollapsed} />
                {isContributor && (
                    <>
                        <SidebarNavItem to={`${base}/workflow`} icon={HiOutlineLightningBolt} label="Workflow" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`${base}/team`} icon={HiOutlineUserGroup} label="Team" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`${base}/automation`} icon={HiOutlineLightningBolt} label="Automation" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`${base}/settings`} icon={HiOutlineCog} label="Settings" isCollapsed={isCollapsed} />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1 pt-2 border-t border-sidebar-border">
            {/* Back to Projects */}
            <Link
                to={`/projects/${activeOrganizationId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors group text-sidebar-text-muted"
            >
                <HiOutlineChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                Back to Projects
            </Link>

            {/* Project identity + sprint indicator */}
            <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate text-text-primary" title={project?.name}>
                    {project?.name || '…'}
                </p>

                {/* Reporter role badge */}
                {isReporter && (
                    <span className="mt-1 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-200">
                        📊 Reporter View
                    </span>
                )}

                {activeSprint && (
                    <div className="mt-1.5 space-y-1">
                        <p className="text-[10px] font-medium truncate text-sidebar-section-text">
                            {activeSprint.name}
                            {showProgress && ` · ${sprintDone}/${sprintTotal} Done`}
                        </p>
                        {showProgress && (
                            <div className="h-1 rounded-full overflow-hidden bg-sidebar-hover-bg">
                                <div
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${sprintProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Role-filtered project nav links */}
            <div className="space-y-0.5">
                <SidebarNavItem to={base} icon={HiOutlineViewGrid} label="Overview" end isCollapsed={isCollapsed} />

                {/* Board: REPORTER cannot access */}
                {!isReporter && (
                    <SidebarNavItem to={`${base}/board`} icon={HiOutlineViewBoards} label="Board" isCollapsed={isCollapsed} />
                )}

                {/* Backlog: contributors only */}
                {isContributor && (
                    <SidebarNavItem to={`${base}/backlog`} icon={HiOutlineCollection} label="Backlog" isCollapsed={isCollapsed} />
                )}

                {/* Read-only task list: Reporter & Viewer */}
                {(isReporter || isViewer) && (
                    <SidebarNavItem to={`${base}/tasks`} icon={HiOutlineClipboardList} label="Tasks" isCollapsed={isCollapsed} />
                )}

                {/* Analytics: all roles */}
                <SidebarNavItem to={`${base}/analytics`} icon={HiOutlineChartPie} label={isReporter ? 'Reports' : 'Analytics'} isCollapsed={isCollapsed} />

                {/* Workflow: contributors only */}
                {isContributor && (
                    <SidebarNavItem to={`${base}/workflow`} icon={HiOutlineLightningBolt} label="Workflow" isCollapsed={isCollapsed} />
                )}

                {/* Team: PROJECT_ADMIN + TEAM_LEAD */}
                {(myProjectRole === 'PROJECT_ADMIN' || myProjectRole === 'TEAM_LEAD' || myProjectRole === 'SCRUM_MASTER') && (
                    <SidebarNavItem to={`${base}/team`} icon={HiOutlineUserGroup} label="Team" isCollapsed={isCollapsed} />
                )}

                {/* Automation: managers only */}
                {(myProjectRole === 'PROJECT_ADMIN' || myProjectRole === 'SCRUM_MASTER' || myProjectRole === 'TEAM_LEAD') && (
                    <SidebarNavItem to={`${base}/automation`} icon={HiOutlineLightningBolt} label="Automation" isCollapsed={isCollapsed} />
                )}

                {/* Settings: PROJECT_ADMIN only */}
                {myProjectRole === 'PROJECT_ADMIN' && (
                    <SidebarNavItem to={`${base}/settings`} icon={HiOutlineCog} label="Settings" isCollapsed={isCollapsed} />
                )}
            </div>
        </div>
    );
}
