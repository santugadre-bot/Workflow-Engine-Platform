import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    HiOutlineHome, HiOutlineCheckCircle, HiOutlineInbox,
    HiOutlineLightningBolt, HiOutlineChartPie,
    HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineCog,
    HiOutlineStar, HiOutlineClock, HiOutlinePlus, HiOutlineShieldCheck,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import useUIStore from '../../store/uiStore';
import { useOrganizationMembers, useOrganizations } from '../../api/organizations';
import { useUnreadNotificationsCount } from '../../api/notifications';
import { usePendingApprovalsCount } from '../../api/approvals';
import { isOrgAdmin } from '../../utils/orgPermissions';
import { safeStorage } from '../../utils/safeStorage';

// Sub-components
import SidebarNavItem from '../sidebar/SidebarNavItem';
import SidebarSectionHeader from '../sidebar/SidebarSectionHeader';
import SidebarOrgSwitcher from '../sidebar/SidebarOrgSwitcher';
import SidebarCurrentProject from '../sidebar/SidebarCurrentProject';
import SidebarFooter from '../sidebar/SidebarFooter';
import SidebarProjectsList from '../sidebar/SidebarProjectsList';

/** Deterministic color from org ID */
function getOrganizationColor(id) {
    const colors = [
        'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
        'bg-rose-500', 'bg-orange-500', 'bg-emerald-500', 'bg-cyan-500',
    ];
    if (!id) return colors[0];
    return colors[id.charCodeAt(0) % colors.length];
}

/** Load section collapse state from safeStorage */
function loadSections() {
    try {
        const stored = safeStorage.getItem('sidebar_sections');
        if (stored) return JSON.parse(stored);
    } catch (_) { }
    return { recents: true, favorites: true, projects: true };
}

/** Persist section collapse state to safeStorage */
function saveSections(sections) {
    try {
        safeStorage.setItem('sidebar_sections', JSON.stringify(sections));
    } catch (_) { }
}

export default function Sidebar() {
    const params = useParams();
    const isCollapsed = !useUIStore((s) => s.sidebarOpen);

    // Global UI state
    const {
        activeOrganizationId: storeOrganizationId,
        openModal,
        favorites,
        loadFavorites,
        recents,
        loadRecents,
    } = useUIStore();

    // Fetch organizations for switcher
    // Fetch organizations for switcher
    const { data: organizations } = useOrganizations();

    // Derive active org: URL param > store > first org
    const activeOrganizationId =
        params.organizationId || storeOrganizationId || organizations?.[0]?.id;

    // Sync store if URL param differs
    useEffect(() => {
        if (activeOrganizationId && activeOrganizationId !== storeOrganizationId) {
            useUIStore.getState().setActiveOrganizationId(activeOrganizationId);
        }
    }, [activeOrganizationId, storeOrganizationId]);

    const activeOrg = organizations?.find(o => o.id === activeOrganizationId);

    // Badges
    const { data: unreadNotifications } = useUnreadNotificationsCount();
    const { data: pendingApprovals } = usePendingApprovalsCount(activeOrganizationId);

    // Section collapse state — persisted to safeStorage
    const [sections, setSections] = useState(loadSections);
    const toggleSection = (key) => {
        setSections(prev => {
            const next = { ...prev, [key]: !prev[key] };
            saveSections(next);
            return next;
        });
    };

    // Load favorites & recents when org changes
    useEffect(() => {
        if (activeOrganizationId) {
            loadFavorites(activeOrganizationId);
            loadRecents(activeOrganizationId);
        }
    }, [activeOrganizationId]);

    // Permission: is current user an org admin?
    const { user } = useAuth();
    const { data: orgMembers } = useOrganizationMembers(activeOrganizationId);
    const myMembership = orgMembers?.find(m => m.userId === (user?.userId || user?.id));
    const orgRole = myMembership?.role;
    const canSeeAdminTools = isOrgAdmin(orgRole);

    const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

    return (
        <aside
            className={`
                fixed left-0 top-0 h-screen z-50
                transition-all duration-300 ease-in-out flex flex-col
                ${sidebarWidth}
            `}
            style={{
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
            }}
        >
            {/* Header: Organization Switcher */}
            <SidebarOrgSwitcher
                organizations={organizations}
                activeOrganizationId={activeOrganizationId}
                activeOrg={activeOrg}
                isCollapsed={isCollapsed}
                getOrgColor={getOrganizationColor}
            />

            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">

                {/* 1. Primary Navigation */}
                <div className="space-y-0.5 mb-4">
                    <SidebarNavItem to="/dashboard" icon={HiOutlineHome} label="Dashboard" isCollapsed={isCollapsed} />
                    <SidebarNavItem to={`/organizations/${activeOrganizationId}/tasks/my`} icon={HiOutlineCheckCircle} label="My Tasks" isCollapsed={isCollapsed} />
                    <SidebarNavItem to="/inbox" icon={HiOutlineInbox} label="Inbox" badge={unreadNotifications} badgeColor="bg-rose-500" isCollapsed={isCollapsed} />
                </div>

                {/* 2. Favorites — always shown, empty state if empty */}
                {!isCollapsed && (
                    <div className="space-y-0.5">
                        <SidebarSectionHeader
                            label="Favorites"
                            isOpen={sections.favorites}
                            onToggle={() => toggleSection('favorites')}
                            icon={HiOutlineStar}
                        />
                        {sections.favorites && (
                            <div className="animate-in slide-in-from-top-1 fade-in duration-150">
                                {favorites.length === 0 ? (
                                    <p className="px-3 py-2 text-xs italic leading-relaxed" style={{ color: 'var(--sidebar-section-text)' }}>
                                        No favorites yet · Star items to pin here
                                    </p>
                                ) : (
                                    favorites.map(fav => (
                                        <SidebarNavItem key={fav.path} to={fav.path} icon={HiOutlineStar} label={fav.label} isCollapsed={isCollapsed} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Recents — always shown, empty state if empty */}
                {!isCollapsed && (
                    <div className="space-y-0.5">
                        <SidebarSectionHeader
                            label="Recents"
                            isOpen={sections.recents}
                            onToggle={() => toggleSection('recents')}
                            icon={HiOutlineClock}
                        />
                        {sections.recents && (
                            <div className="animate-in slide-in-from-top-1 fade-in duration-150">
                                {recents.length === 0 ? (
                                    <p className="px-3 py-2 text-xs italic leading-relaxed" style={{ color: 'var(--sidebar-section-text)' }}>
                                        No recent items yet
                                    </p>
                                ) : (
                                    recents.map(item => (
                                        <SidebarNavItem key={item.path} to={item.path} icon={HiOutlineClock} label={item.label} isCollapsed={isCollapsed} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Projects — flat list OR project context mode */}
                {activeOrganizationId && (
                    <div className="space-y-0.5 mt-2">
                        {/* Project context mode — shown when inside a project route */}
                        <SidebarCurrentProject
                            activeOrganizationId={activeOrganizationId}
                            isCollapsed={isCollapsed}
                        />

                        {/* Projects list — shown when NOT inside a project route */}
                        <SidebarProjectsSection
                            activeOrganizationId={activeOrganizationId}
                            isCollapsed={isCollapsed}
                            isOpen={sections.projects}
                            onToggle={() => toggleSection('projects')}
                            openModal={openModal}
                            canSeeAdminTools={canSeeAdminTools}
                        />
                    </div>
                )}

                {/* 5. Organization Tools — permission-gated */}
                {activeOrganizationId && !isCollapsed && (
                    <div className="space-y-0.5 mt-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
                        <SidebarSectionHeader
                            label="Organization"
                            isOpen={true} // Always open for now, or toggleable if desired
                            onToggle={() => { }} // No-op for now
                            icon={HiOutlineUserGroup}
                        />
                        {canSeeAdminTools && (
                            <SidebarNavItem to={`/workflows/${activeOrganizationId}`} icon={HiOutlineLightningBolt} label="Workflows" end isCollapsed={isCollapsed} />
                        )}
                        <SidebarNavItem to={`/organizations/${activeOrganizationId}/analytics`} icon={HiOutlineChartPie} label="Analytics" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`/organizations/${activeOrganizationId}/approvals`} icon={HiOutlineClipboardList} label="Approvals" badge={pendingApprovals} badgeColor="bg-blue-500" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`/organizations/${activeOrganizationId}/members`} icon={HiOutlineUserGroup} label="Members" isCollapsed={isCollapsed} />
                        {canSeeAdminTools && (
                            <>
                                <SidebarNavItem to={`/organizations/${activeOrganizationId}/settings`} icon={HiOutlineCog} label="Settings" isCollapsed={isCollapsed} />
                                <SidebarNavItem to={`/organizations/${activeOrganizationId}/access-control`} icon={HiOutlineShieldCheck} label="Access Control" isCollapsed={isCollapsed} />
                            </>
                        )}
                    </div>
                )}

                {/* Collapsed: show org tool icons */}
                {activeOrganizationId && isCollapsed && (
                    <div className="space-y-0.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
                        <SidebarNavItem to={`/organizations/${activeOrganizationId}/analytics`} icon={HiOutlineChartPie} label="Analytics" isCollapsed={isCollapsed} />
                        <SidebarNavItem to={`/organizations/${activeOrganizationId}/approvals`} icon={HiOutlineClipboardList} label="Approvals" badge={pendingApprovals} badgeColor="bg-blue-500" isCollapsed={isCollapsed} />
                        {canSeeAdminTools && (
                            <>
                                <SidebarNavItem to={`/organizations/${activeOrganizationId}/settings`} icon={HiOutlineCog} label="Settings" isCollapsed={isCollapsed} />
                                <SidebarNavItem to={`/organizations/${activeOrganizationId}/access-control`} icon={HiOutlineShieldCheck} label="Access Control" isCollapsed={isCollapsed} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Collapse Toggle */}
            <SidebarFooter isCollapsed={isCollapsed} />
        </aside>
    );
}

/**
 * Projects section — only shown when NOT inside a project route.
 * Extracted to avoid hook-in-conditional issues.
 */
function SidebarProjectsSection({ activeOrganizationId, isCollapsed, isOpen, onToggle, openModal, canSeeAdminTools }) {
    const { projectId } = useParams();

    // Hide this section when inside a project (SidebarCurrentProject takes over)
    if (projectId) return null;

    return (
        <>
            {!isCollapsed && (
                <div className="flex items-center justify-between px-3 py-1 mt-2">
                    <button
                        onClick={onToggle}
                        className="text-[10px] font-semibold uppercase tracking-wider transition-colors flex-1 text-left"
                        style={{ color: 'var(--sidebar-section-text)' }}
                    >
                        Projects
                    </button>
                    {canSeeAdminTools && (
                        <button
                            onClick={() => openModal('createProject', { organizationId: activeOrganizationId })}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--sidebar-section-text)' }}
                            title="New Project"
                        >
                            <HiOutlinePlus className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
            {(isOpen || isCollapsed) && (
                <SidebarProjectsList
                    organizationId={activeOrganizationId}
                    isCollapsed={isCollapsed}
                />
            )}
        </>
    );
}
