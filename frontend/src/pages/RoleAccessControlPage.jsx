import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    HiArrowLeft,
    HiOutlineShieldCheck,
    HiOutlineRefresh,
    HiOutlineLockClosed,
} from 'react-icons/hi';
import { organizationsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { safeStorage } from '../utils/safeStorage';
import { isOrgAdmin } from '../utils/permissions';

// Read systemRole reliably — from context first, then safeStorage fallback
function getSystemRole(user) {
    if (user?.systemRole) return user.systemRole;
    try {
        const stored = safeStorage.getItem('user');
        if (stored) return JSON.parse(stored)?.systemRole;
    } catch (_) { }
    return null;
}

// ─── Data Definitions ────────────────────────────────────────────────────────

const ORG_PAGES = [
    { key: 'dashboard', label: 'Dashboard', desc: 'View the main org dashboard' },
    { key: 'analytics', label: 'Analytics', desc: 'View org-level analytics and reports' },
    { key: 'approvals', label: 'Approvals', desc: 'Access approval center queue' },
    { key: 'workflows', label: 'Workflows', desc: 'View and use org workflows' },
    { key: 'projects', label: 'Projects', desc: 'Browse and enter projects' },
    { key: 'members', label: 'Members Page', desc: 'View organization directory' },
    { key: 'settings', label: 'Settings', desc: 'Edit organization settings' },
    { key: 'activity', label: 'Activity Log', desc: 'View org activity history' },
    { key: 'access_control', label: 'Access Control', desc: 'Manage role-based permissions' },
    { key: 'invite_member', label: 'Invite Member', desc: 'Add new members to org' },
    { key: 'remove_member', label: 'Remove Member', desc: 'Remove members from org' },
    { key: 'manage_roles', label: 'Manage Roles', desc: 'Change member roles' },
    { key: 'view_metrics', label: 'View Metrics', desc: 'Access performance metrics' },
];

const PROJECT_PAGES = [
    { key: 'view_project', label: 'View Project', desc: 'Access project overview' },
    { key: 'board', label: 'Project Board', desc: 'View and update the kanban board' },
    { key: 'backlog', label: 'Project Backlog', desc: 'View and manage the backlog' },
    { key: 'project_analytics', label: 'Project Analytics', desc: 'View project-level analytics' },
    { key: 'project_settings', label: 'Project Settings', desc: 'Modify project configuration' },
    { key: 'project_members', label: 'Project Members', desc: 'View and manage project team' },
    { key: 'automation', label: 'Automation', desc: 'Manage project automation rules' },
    { key: 'create_issue', label: 'Create Issue', desc: 'Create new tasks and issues' },
    { key: 'edit_issue', label: 'Edit Issue', desc: 'Modify existing tasks/issues' },
    { key: 'delete_issue', label: 'Delete Issue', desc: 'Permanently remove tasks' },
    { key: 'assign_issue', label: 'Assign Issue', desc: 'Assign tasks to team members' },
    { key: 'comment_issue', label: 'Comment on Issue', desc: 'Add comments to tasks' },
    { key: 'manage_sprints', label: 'Manage Sprints', desc: 'Create and control sprints' },
    { key: 'manage_board', label: 'Manage Board', desc: 'Configure board columns/workflow' },
    { key: 'invite_to_project', label: 'Invite Member (Project)', desc: 'Add members to project team' },
];

const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];
const PROJECT_ROLES = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER', 'QA', 'VIEWER', 'REPORTER'];

// Columns locked by backend (OWNER always has full access)
const ORG_LOCKED_ROLES = ['OWNER'];

// Default access matrix — mirrors backend RolePermissionService
const DEFAULT_ORG_ACCESS = {
    dashboard: { OWNER: true, ADMIN: true, MEMBER: true },
    analytics: { OWNER: true, ADMIN: true, MEMBER: false },
    approvals: { OWNER: true, ADMIN: true, MEMBER: true },
    workflows: { OWNER: true, ADMIN: true, MEMBER: false },
    projects: { OWNER: true, ADMIN: true, MEMBER: true },
    members: { OWNER: true, ADMIN: true, MEMBER: false },
    settings: { OWNER: true, ADMIN: true, MEMBER: false },
    activity: { OWNER: true, ADMIN: true, MEMBER: true },
    access_control: { OWNER: true, ADMIN: true, MEMBER: false },
    invite_member: { OWNER: true, ADMIN: true, MEMBER: false },
    remove_member: { OWNER: true, ADMIN: true, MEMBER: false },
    manage_roles: { OWNER: true, ADMIN: true, MEMBER: false },
    view_metrics: { OWNER: true, ADMIN: true, MEMBER: false },
};

const DEFAULT_PROJECT_ACCESS = {
    view_project: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: true, REPORTER: true },
    board: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: true, REPORTER: false },
    backlog: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: true, REPORTER: false },
    project_analytics: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: true, REPORTER: true },
    project_settings: { PROJECT_ADMIN: true, SCRUM_MASTER: false, TEAM_LEAD: false, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    project_members: { PROJECT_ADMIN: true, SCRUM_MASTER: false, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    automation: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    create_issue: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: false, REPORTER: true },
    edit_issue: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: false, REPORTER: false },
    delete_issue: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    assign_issue: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: false, REPORTER: false },
    comment_issue: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: true, QA: true, VIEWER: true, REPORTER: true },
    manage_sprints: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    manage_board: { PROJECT_ADMIN: true, SCRUM_MASTER: true, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
    invite_to_project: { PROJECT_ADMIN: true, SCRUM_MASTER: false, TEAM_LEAD: true, DEVELOPER: false, QA: false, VIEWER: false, REPORTER: false },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadConfig(orgId, type, defaults) {
    const stored = safeStorage.getItem(`accessControl:${orgId}:${type}`);
    return stored ? JSON.parse(stored) : defaults;
}

function saveConfig(orgId, type, config) {
    safeStorage.setItem(`accessControl:${orgId}:${type}`, JSON.stringify(config));
}

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => !disabled && onChange(!checked)}
            title={disabled ? 'This permission is always granted and cannot be changed.' : undefined}
            className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}
            `}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
    );
}

// ─── Permission Table ─────────────────────────────────────────────────────────

function PermissionTable({ pages, roles, lockedRoles, access, onChange, roleColors }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-sm min-w-[700px]">
                <thead>
                    <tr className="bg-bg-overlay border-b border-border-subtle">
                        <th className="px-5 py-3 text-left font-semibold text-text-secondary w-64">Page / Feature</th>
                        {roles.map(role => (
                            <th key={role} className="px-4 py-3 text-center font-semibold text-text-secondary whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${roleColors[role] || 'bg-bg-overlay text-text-secondary border-border-subtle'}`}>
                                    {lockedRoles.includes(role) && <HiOutlineLockClosed className="w-3 h-3" />}
                                    {role.replace('_', ' ')}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                    {pages.map(page => (
                        <tr key={page.key} className="hover:bg-bg-raised/40 transition-colors group">
                            <td className="px-5 py-3.5">
                                <p className="font-medium text-text-primary">{page.label}</p>
                                <p className="text-xs text-text-muted">{page.desc}</p>
                            </td>
                            {roles.map(role => {
                                const locked = lockedRoles.includes(role);
                                const checked = access[page.key]?.[role] ?? false;
                                return (
                                    <td key={role} className="px-4 py-3.5 text-center">
                                        <div className="flex justify-center">
                                            <Toggle
                                                checked={checked}
                                                disabled={locked}
                                                onChange={(val) => onChange(page.key, role, val)}
                                            />
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoleAccessControlPage() {
    const { organizationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('org');
    const [orgAccess, setOrgAccess] = useState(() => loadConfig(organizationId, 'org', DEFAULT_ORG_ACCESS));
    const [projectAccess, setProjectAccess] = useState(() => loadConfig(organizationId, 'project', DEFAULT_PROJECT_ACCESS));

    const { data: members, isLoading: membersLoading } = useQuery({
        queryKey: ['organizations', organizationId, 'members'],
        queryFn: () => organizationsApi.listMembers(organizationId),
        enabled: !!organizationId,
    });

    const systemRole = getSystemRole(user);
    const isSuperAdminUser = systemRole === 'SUPER_ADMIN';
    // user object uses 'userId' (not 'id') — see AuthContext
    const currentUserRole = members?.find(m => m.userId === (user?.userId || user?.id))?.role;
    const hasAccess = isSuperAdminUser || isOrgAdmin(currentUserRole);

    // Don't flash the locked view while members are loading — SUPER_ADMIN might not be in any org
    if (membersLoading && !isSuperAdminUser) {
        return <div className="p-8 flex justify-center"><div className="spinner spinner-lg" /></div>;
    }

    const handleOrgChange = (pageKey, role, val) => {
        const next = { ...orgAccess, [pageKey]: { ...orgAccess[pageKey], [role]: val } };
        setOrgAccess(next);
        saveConfig(organizationId, 'org', next);
    };

    const handleProjectChange = (pageKey, role, val) => {
        const next = { ...projectAccess, [pageKey]: { ...projectAccess[pageKey], [role]: val } };
        setProjectAccess(next);
        saveConfig(organizationId, 'project', next);
    };

    const handleRestoreDefaults = () => {
        if (!window.confirm('Reset all permissions to their default values?')) return;
        setOrgAccess(DEFAULT_ORG_ACCESS);
        setProjectAccess(DEFAULT_PROJECT_ACCESS);
        safeStorage.removeItem(`accessControl:${organizationId}:org`);
        safeStorage.removeItem(`accessControl:${organizationId}:project`);
    };

    const ORG_ROLE_COLORS = {
        OWNER: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        MEMBER: 'bg-brand-500/10 text-brand-600 border-brand-500/20',
    };
    const PROJECT_ROLE_COLORS = {
        PROJECT_ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        SCRUM_MASTER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        TEAM_LEAD: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
        DEVELOPER: 'bg-brand-500/10 text-brand-600 border-brand-500/20',
        QA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        VIEWER: 'bg-bg-overlay text-text-secondary border-border-subtle',
        REPORTER: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    };

    if (!hasAccess) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center pt-24">
                <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineLockClosed className="w-8 h-8 text-danger" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Access Restricted</h2>
                <p className="text-text-secondary mb-6">You need to be an Admin or Owner to manage access control.</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/organizations/${organizationId}/settings`)}
                    className="flex items-center text-sm font-medium text-text-muted hover:text-brand-500 transition-colors group mb-5"
                >
                    <HiArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Settings
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                                <HiOutlineShieldCheck className="w-5 h-5 text-brand-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Role Access Control</h1>
                        </div>
                        <p className="text-text-secondary ml-[52px]">Configure which roles can access which pages and features. Changes are saved automatically.</p>
                    </div>
                    <button
                        onClick={handleRestoreDefaults}
                        className="btn btn-secondary flex items-center gap-2 shrink-0"
                    >
                        <HiOutlineRefresh className="w-4 h-4" />
                        Restore Defaults
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mb-6 flex items-start gap-3 p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl text-sm text-brand-600">
                <HiOutlineLockClosed className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>OWNER</strong> columns are locked — Owners always have full access. Changes here are saved locally and will be synced to the backend in a future update.</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-bg-overlay rounded-lg mb-6 w-fit">
                <button
                    onClick={() => setActiveTab('org')}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'org' ? 'bg-bg-raised text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                >
                    🏢 Organization Roles
                </button>
                <button
                    onClick={() => setActiveTab('project')}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'project' ? 'bg-bg-raised text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                >
                    🗂️ Project Roles
                </button>
            </div>

            {/* Org Roles Matrix */}
            {activeTab === 'org' && (
                <div className="animate-in fade-in duration-200">
                    <p className="text-sm text-text-muted mb-4">
                        Controls which organization-level pages and actions each role can access.
                    </p>
                    <PermissionTable
                        pages={ORG_PAGES}
                        roles={ORG_ROLES}
                        lockedRoles={ORG_LOCKED_ROLES}
                        access={orgAccess}
                        onChange={handleOrgChange}
                        roleColors={ORG_ROLE_COLORS}
                    />
                </div>
            )}

            {/* Project Roles Matrix */}
            {activeTab === 'project' && (
                <div className="animate-in fade-in duration-200">
                    <p className="text-sm text-text-muted mb-4">
                        Controls which project-level pages, boards, and issue operations each project role can perform.
                    </p>
                    <PermissionTable
                        pages={PROJECT_PAGES}
                        roles={PROJECT_ROLES}
                        lockedRoles={[]}
                        access={projectAccess}
                        onChange={handleProjectChange}
                        roleColors={PROJECT_ROLE_COLORS}
                    />
                </div>
            )}
        </div>
    );
}
