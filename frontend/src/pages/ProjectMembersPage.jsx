import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    useProjectMembers,
    useRemoveProjectMember,
    useUpdateProjectMemberRole,
    useRemoveProjectMembersBulk
} from '../api/projects';
import { useAuth } from '../context/AuthContext';
import useUIStore from '../store/uiStore';
import {
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlineShieldCheck,
    HiDotsVertical,
    HiChevronLeft,
    HiChevronRight,
    HiArrowLeft,
    HiOutlineUserAdd
} from 'react-icons/hi';
import clsx from 'clsx';
import MemberInsightsPanel from '../components/project/MemberInsightsPanel';
import RemoveMemberModal from '../components/project/RemoveMemberModal';
import AddProjectMemberModal from '../components/project/AddProjectMemberModal';

export default function ProjectMembersPage() {
    const { project, organizationId, projectId } = useOutletContext();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: members, isLoading, error } = useProjectMembers(organizationId, projectId);

    const removeMemberMutation = useRemoveProjectMember(organizationId, projectId);
    const updateRoleMutation = useUpdateProjectMemberRole(organizationId, projectId);
    const removeMembersBulkMutation = useRemoveProjectMembersBulk(organizationId, projectId);
    const addToast = useUIStore((s) => s.addToast);

    const currentUserRole = project?.role;
    const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
    const isProjectAdmin = isSuperAdmin || currentUserRole === 'PROJECT_ADMIN';

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const [selectedMembers, setSelectedMembers] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState(null);
    const itemsPerPage = 10;

    // Phase 2 Advanced UI State
    const [insightsMember, setInsightsMember] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleRemoveClick = (member) => {
        if (member.userId === user?.id) {
            addToast('You cannot remove yourself', 'warning');
            return;
        }
        setMemberToRemove(member);
    };

    const confirmRemove = (userId, reassignTo) => {
        return new Promise((resolve, reject) => {
            const payload = reassignTo ? { reassignTo } : {};
            removeMemberMutation.mutate(userId, {
                // Future Implementation: Send reassignTo logic to backend if supported
                onSuccess: () => {
                    addToast('Member removed successfully', 'success');
                    resolve();
                },
                onError: (err) => {
                    addToast(err.response?.data?.message || 'Failed to remove member', 'error');
                    reject(err);
                }
            });
        });
    };

    const handleBulkRemove = () => {
        if (selectedMembers.size === 0) return;
        if (!window.confirm(`Are you sure you want to remove ${selectedMembers.size} members from this project?`)) return;

        removeMembersBulkMutation.mutate(Array.from(selectedMembers), {
            onSuccess: () => {
                addToast(`Successfully removed ${selectedMembers.size} members`, 'success');
                setSelectedMembers(new Set());
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to remove members', 'error')
        });
    };

    const handleRoleChange = (member, newRole) => {
        if (member.role === newRole) return;

        updateRoleMutation.mutate({ memberId: member.userId, role: newRole }, {
            onSuccess: () => addToast('Role updated successfully', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update role', 'error')
        });
    };

    const toggleSelectAll = () => {
        const eligibleMembers = filteredMembers.filter(m => m.userId !== user?.id);
        if (selectedMembers.size === eligibleMembers.length && eligibleMembers.length > 0) {
            setSelectedMembers(new Set());
        } else {
            setSelectedMembers(new Set(eligibleMembers.map(m => m.userId)));
        }
    };

    const toggleSelectMember = (userId) => {
        const next = new Set(selectedMembers);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        setSelectedMembers(next);
    };

    const filteredMembers = useMemo(() => {
        if (!members) return [];
        return members.filter(m => {
            const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMembers.slice(start, start + itemsPerPage);
    }, [filteredMembers, currentPage]);

    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter]);

    if (isLoading) return <div className="p-8 flex justify-center"><div className="spinner spinner-lg" /></div>;
    if (error) return <div className="p-8 text-danger">Failed to load team members: {error.message}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Breadcrumb / Back Navigation */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/organizations/${organizationId}/projects/${projectId}`)}
                    className="flex items-center text-sm font-medium text-text-muted hover:text-brand-500 transition-colors group"
                >
                    <HiArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Project Board
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Project Team</h1>
                    <p className="text-text-secondary">Manage members, roles, and track workload for this project.</p>
                </div>
                {isProjectAdmin && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn btn-primary shadow-sm h-11"
                    >
                        <HiOutlineUserAdd className="w-5 h-5 mr-2" />
                        Invite Member
                    </button>
                )}
            </div>


            {/* Toolbar */}
            <div className="bg-bg-raised border border-border-subtle rounded-t-lg p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {isProjectAdmin && (
                        <input
                            type="checkbox"
                            className="rounded border-border-subtle text-brand-500 focus:ring-brand-500"
                            checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                            onChange={toggleSelectAll}
                        />
                    )}
                    <div className="relative flex-1 sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                            <HiOutlineSearch />
                        </div>
                        <input
                            type="text"
                            className="input pl-10 w-full"
                            placeholder="Search team members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        className="input w-full sm:w-40 bg-bg-base"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="PROJECT_ADMIN">Project Admin</option>
                        <option value="TEAM_LEAD">Team Lead</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="QA">QA</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="REPORTER">Reporter</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {selectedMembers.size > 0 ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                            <span className="text-sm font-medium text-brand-500">
                                {selectedMembers.size} Selected
                            </span>
                            <button
                                onClick={handleBulkRemove}
                                className="btn btn-ghost text-danger hover:bg-danger/10 px-3 py-1.5 h-auto text-sm"
                                disabled={removeMembersBulkMutation.isPending}
                            >
                                <HiOutlineTrash className="w-4 h-4 mr-1.5" />
                                Remove Selected
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-text-muted font-medium">
                            {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-base border border-t-0 border-border-subtle rounded-b-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-bg-overlay/50 border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                                {isProjectAdmin && (
                                    <th className="p-4 w-12 font-medium">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border-subtle text-brand-500 focus:ring-brand-500 cursor-pointer"
                                            checked={selectedMembers.size === filteredMembers.filter(m => m.userId !== user?.id).length && filteredMembers.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="p-4 font-medium">Member</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium min-w-[200px]">Workload & Tasks</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-sm">
                            {paginatedMembers.length > 0 ? (
                                paginatedMembers.map((member) => (
                                    <tr
                                        key={member.userId}
                                        className="hover:bg-bg-raised/40 transition-colors group cursor-pointer"
                                        onClick={(e) => {
                                            // Don't open panel if clicking checkbox or action menu
                                            if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) return;
                                            setInsightsMember(member);
                                        }}
                                    >
                                        {isProjectAdmin && (
                                            <td className="p-4 align-middle">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-border-subtle text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                    checked={selectedMembers.has(member.userId)}
                                                    onChange={() => toggleSelectMember(member.userId)}
                                                    disabled={member.userId === user?.id}
                                                />
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email)}&background=random`}
                                                    alt={member.name || member.email}
                                                    className="w-10 h-10 rounded-full object-cover border border-border-subtle shadow-sm shrink-0"
                                                />
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="font-semibold text-text-primary truncate">
                                                        {member.name || 'Unknown User'}
                                                        {member.userId === user?.id && <span className="ml-2 text-xs font-normal text-text-muted">(You)</span>}
                                                    </span>
                                                    <span className="text-xs text-text-muted truncate">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                member.role === 'PROJECT_ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                                    member.role === 'VIEWER' || member.role === 'REPORTER' ? 'bg-bg-overlay text-text-secondary border-border-subtle' :
                                                        'bg-brand-500/10 text-brand-600 border-brand-500/20'
                                            )}>
                                                {member.role === 'PROJECT_ADMIN' && <HiOutlineShieldCheck className="w-3.5 h-3.5" />}
                                                {member.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-bg-overlay rounded-full overflow-hidden flex">
                                                        {(() => {
                                                            const score = member.workloadScore || 0;
                                                            // Workload score visualizer: e.g. <30 is decent, 30-70 moderate, >70 is high
                                                            const colorClass = score > 70 ? 'bg-danger' : score > 30 ? 'bg-warning' : 'bg-success';
                                                            const widthPercent = Math.min(100, Math.max(5, score));
                                                            return <div className={`h-full ${colorClass}`} style={{ width: `${widthPercent}%` }} />;
                                                        })()}
                                                    </div>
                                                    <span className="text-xs font-semibold text-text-secondary w-5 text-right">
                                                        {member.assignedTaskCount || 0}
                                                    </span>
                                                </div>
                                                {member.activeTaskTitles && member.activeTaskTitles.length > 0 ? (
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        {member.activeTaskTitles.slice(0, 2).map((t, idx) => (
                                                            <div key={idx} className="text-[11px] text-text-muted truncate max-w-[200px] flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                                                                {t}
                                                            </div>
                                                        ))}
                                                        {member.activeTaskTitles.length > 2 && (
                                                            <div className="text-[10px] text-text-muted italic pl-2">
                                                                +{member.activeTaskTitles.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-text-muted italic">No active tasks</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={clsx(
                                                    "w-2 h-2 rounded-full",
                                                    member.status === 'ONLINE' ? 'bg-success animate-pulse' :
                                                        member.status === 'IDLE' ? 'bg-warning' : 'bg-border-strong'
                                                )} />
                                                <span className="text-xs font-medium text-text-secondary capitalize">
                                                    {member.status ? member.status.toLowerCase() : 'Offline'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right relative">
                                            {isProjectAdmin && member.userId !== user?.id && (
                                                <div className="relative inline-block text-left"
                                                    onMouseLeave={() => setOpenMenuId(null)}>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                                                        className="p-1.5 text-text-muted hover:bg-bg-hover rounded-md transition-colors outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    >
                                                        <HiDotsVertical className="w-5 h-5" />
                                                    </button>

                                                    {openMenuId === member.userId && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-bg-raised border border-border-subtle rounded-lg shadow-xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle mb-1">
                                                                Actions
                                                            </div>
                                                            <div className="px-1">
                                                                {['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER', 'QA', 'VIEWER', 'REPORTER'].map(role => (
                                                                    member.role !== role && (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => {
                                                                                handleRoleChange(member, role);
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover hover:text-brand-600 rounded-md transition-colors"
                                                                        >
                                                                            Change Role to {role.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                                        </button>
                                                                    )
                                                                ))}
                                                                <div className="h-px bg-border-subtle my-1 mx-2" />
                                                                <button
                                                                    onClick={(e) => {
                                                                        handleRemoveClick(member);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    disabled={removeMemberMutation.isPending}
                                                                    className="w-full text-left px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-colors flex items-center gap-2"
                                                                >
                                                                    <HiOutlineTrash className="w-4 h-4" />
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isProjectAdmin ? 6 : 5} className="p-16 text-center">
                                        <div className="w-12 h-12 bg-bg-overlay rounded-full flex items-center justify-center mx-auto mb-3">
                                            <HiOutlineSearch className="w-6 h-6 text-text-muted" />
                                        </div>
                                        <h3 className="text-text-primary font-medium">No members found</h3>
                                        <p className="text-sm text-text-muted mt-1">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredMembers.length > itemsPerPage && (
                    <div className="border-t border-border-subtle bg-bg-overlay/30 px-4 py-3 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:block">
                            <p className="text-sm text-text-secondary">
                                Showing <span className="font-medium text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-text-primary">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
                                <span className="font-medium text-text-primary">{filteredMembers.length}</span> members
                            </p>
                        </div>
                        <div className="flex flex-1 justify-between sm:justify-end gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-secondary btn-sm h-8 px-3"
                            >
                                <HiChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-secondary btn-sm h-8 px-3"
                            >
                                Next
                                <HiChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <MemberInsightsPanel
                isOpen={!!insightsMember}
                onClose={() => setInsightsMember(null)}
                member={insightsMember}
            />

            <RemoveMemberModal
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                member={memberToRemove}
                allMembers={members}
                onConfirmRemove={confirmRemove}
            />

            <AddProjectMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                organizationId={organizationId}
                projectId={projectId}
                currentMembers={members}
            />
        </div>
    );
}
