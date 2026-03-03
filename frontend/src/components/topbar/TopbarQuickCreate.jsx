import { useState, useRef, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { HiPlus, HiOutlineClipboardList, HiOutlineFolder, HiOutlineLightningBolt } from 'react-icons/hi';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import useUIStore from '../../store/uiStore';
import { useOrganizationMembers } from '../../api/organizations';
import { useProject } from '../../api/projects';
import { canCreateIssue, canManageSprint } from '../../utils/projectPermissions';
import { isOrgAdmin } from '../../utils/orgPermissions';

/**
 * TopbarQuickCreate — context-aware + permission-driven creation button.
 *
 * Rules:
 * - Never shows disabled options — hide entirely if no permission
 * - Inside project: shows Task (if canCreateIssue) and Sprint (if canManageSprint)
 * - Org admin: shows New Project
 * - If nothing is available: renders nothing
 */
export default function TopbarQuickCreate() {
    const { user } = useAuth();
    const { organizationId, projectId } = useParams();
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);
    const openModal = useUIStore((s) => s.openModal);

    const orgId = organizationId || activeOrganizationId;

    // Get org membership to derive org role
    const { data: members } = useOrganizationMembers(orgId);
    const myOrgMembership = members?.find((m) => m.userId === user?.userId);
    const orgRole = myOrgMembership?.role;

    // Get project to derive project role
    const { data: project } = useProject(orgId, projectId);
    const projectRole = project?.role;

    // Derive available actions
    const insideProject = !!projectId;
    const canTask = insideProject && canCreateIssue(projectRole);
    const canSprint = insideProject && canManageSprint(projectRole);
    const canProject = isOrgAdmin(orgRole);

    const actions = [];
    if (canTask) actions.push({
        label: 'New Task',
        icon: HiOutlineClipboardList,
        color: 'text-purple-500 bg-purple-50',
        onClick: () => openModal('createTask', { organizationId: orgId, projectId }),
    });
    if (canSprint) actions.push({
        label: 'New Sprint',
        icon: HiOutlineLightningBolt,
        color: 'text-blue-500 bg-blue-50',
        onClick: () => openModal('createSprint', { organizationId: orgId, projectId }),
    });
    if (canProject) actions.push({
        label: 'New Project',
        icon: HiOutlineFolder,
        color: 'text-emerald-500 bg-emerald-50',
        onClick: () => openModal('createProject', { organizationId: orgId }),
    });

    // Nothing available — render nothing
    if (actions.length === 0) return null;

    // Single action — render as direct button
    if (actions.length === 1) {
        const action = actions[0];
        const Icon = action.icon;
        return (
            <button
                onClick={action.onClick}
                title={action.label}
                className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-sm font-medium rounded-lg
                    hover:bg-primary/90 transition-colors shadow-sm"
            >
                <HiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
            </button>
        );
    }

    // Multiple actions — dropdown
    return (
        <Menu as="div" className="relative">
            {({ open }) => (
                <>
                    <Menu.Button
                        className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-sm font-medium rounded-lg
                            hover:bg-primary/90 transition-colors shadow-sm"
                        title="Create new…"
                    >
                        <HiPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create</span>
                    </Menu.Button>

                    <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-slate-200 rounded-xl shadow-xl focus:outline-none p-1 z-[1100]">
                            {actions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Menu.Item key={action.label}>
                                        {({ active }) => (
                                            <button
                                                onClick={action.onClick}
                                                className={`${active ? 'bg-slate-50' : ''} flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 rounded-lg transition-colors text-left`}
                                            >
                                                <div className={`p-1.5 rounded-md ${action.color}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                {action.label}
                                            </button>
                                        )}
                                    </Menu.Item>
                                );
                            })}
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
}
