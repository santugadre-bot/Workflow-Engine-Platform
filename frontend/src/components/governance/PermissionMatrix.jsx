import React from 'react';
import {
    canCreateIssue,
    canEditIssue,
    canDeleteIssue,
    canAssignIssue,
    canTransitionTask,
    canManageSprint,
    canConfigureBoard,
    canManageSettings
} from '../../utils/permissions';
import { HiCheck, HiX } from 'react-icons/hi';

const ROLES = [
    { id: 'PROJECT_ADMIN', name: 'Project Admin' },
    { id: 'SCRUM_MASTER', name: 'Scrum Master' },
    { id: 'TEAM_LEAD', name: 'Team Lead' },
    { id: 'DEVELOPER', name: 'Developer' },
    { id: 'QA', name: 'QA' },
    { id: 'REPORTER', name: 'Reporter' },
    { id: 'VIEWER', name: 'Viewer' },
];

const CAPABILITIES = [
    { name: 'Create Issue', check: canCreateIssue },
    { name: 'Edit Issue', check: canEditIssue },
    { name: 'Delete Issue', check: canDeleteIssue },
    { name: 'Assign Issue', check: canAssignIssue },
    { name: 'Transition Task', check: canTransitionTask },
    { name: 'Manage Sprints', check: canManageSprint },
    { name: 'Configure Board', check: canConfigureBoard },
    { name: 'Manage Settings', check: canManageSettings },
];

export default function PermissionMatrix() {
    return (
        <div className="card overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-bg-raised">
                <h3 className="text-lg font-bold text-text-primary">Permission Matrix</h3>
                <p className="text-sm text-text-secondary">Visual mapping of role-based access control policies.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-base border-b border-border-subtle">
                            <th className="px-6 py-4 text-xs font-bold uppercase text-text-muted sticky left-0 bg-bg-base z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Capability</th>
                            {ROLES.map(role => (
                                <th key={role.id} className="px-6 py-4 text-xs font-bold uppercase text-text-muted text-center min-w-[120px]">
                                    {role.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {CAPABILITIES.map((cap, idx) => (
                            <tr key={idx} className="hover:bg-bg-hover transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-text-primary sticky left-0 bg-white group-hover:bg-bg-hover z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    {cap.name}
                                </td>
                                {ROLES.map(role => {
                                    const hasAccess = cap.check(role.id);
                                    return (
                                        <td key={role.id} className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                {hasAccess ? (
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                                        <HiCheck className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-bg-base text-text-muted flex items-center justify-center opacity-30">
                                                        <HiX className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-bg-base border-t border-border-subtle">
                <p className="text-[10px] text-text-secondary italic">
                    Note: Organization Admins and Owners always inherit Project Admin permissions.
                </p>
            </div>
        </div>
    );
}
