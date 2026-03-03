import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    organizationsApi,
    useOrganizationMembers,
    useRemoveMember,
    useUpdateMemberRole,
    useRemoveMembersBulk,
    useTransferOwnership
} from '../api/organizations';
import { useAuth } from '../context/AuthContext';
import useUIStore from '../store/uiStore';
import {
    HiOutlineUserAdd,
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlineShieldCheck,
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiDotsVertical,
    HiChevronLeft,
    HiChevronRight,
    HiArrowLeft,
    HiOutlineSwitchHorizontal,
    HiOutlineDownload,
    HiOutlineExclamationCircle,
    HiOutlineCollection,
} from 'react-icons/hi';
import InviteOrganizationMemberModal from '../components/organization/InviteOrganizationMemberModal';
import AssignToProjectModal from '../components/organization/AssignToProjectModal';
import clsx from 'clsx';

export default function OrganizationMembersPage() {
    const { organizationId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: members, isLoading, error } = useOrganizationMembers(organizationId);
    const removeMemberMutation = useRemoveMember(organizationId);
    const updateRoleMutation = useUpdateMemberRole(organizationId);
    const bulkRemoveMutation = useRemoveMembersBulk(organizationId);
    const addToast = useUIStore((s) => s.addToast);

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [userToAssign, setUserToAssign] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [selectedMembers, setSelectedMembers] = useState(new Set());
    const [quickAdd, setQuickAdd] = useState({ email: '', role: 'MEMBER' });
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [transferTarget, setTransferTarget] = useState(null); // member to transfer ownership to
    const itemsPerPage = 10;

    const addMemberMutation = useMutation({
        mutationFn: (data) => organizationsApi.addMember(organizationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'members'] });
            addToast('Member added successfully', 'success');
            setQuickAdd({ email: '', role: 'MEMBER' });
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to add member', 'error');
        }
    });

    const currentUserRole = members?.find(m => m.userId === (user?.userId || user?.id))?.role;
    const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
    const isOwner = isSuperAdmin || currentUserRole === 'OWNER';
    const isAdmin = isOwner || currentUserRole === 'ADMIN'; // OWNER inherits all admin privileges

    const transferOwnershipMutation = useTransferOwnership(organizationId);

    const handleExportCSV = () => {
        if (!members?.length) return;
        const headers = ['Name', 'Email', 'Role', 'Joined', 'Assigned Tasks'];
        const rows = members.map(m => [
            m.displayName || '',
            m.email || '',
            m.role || '',
            m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '',
            m.assignedTaskCount ?? 0
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'members.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleTransferOwnership = (member) => {
        setTransferTarget(member);
        setOpenMenuId(null);
    };

    const confirmTransfer = () => {
        if (!transferTarget) return;
        transferOwnershipMutation.mutate(
            { toUserId: transferTarget.userId, fromUserId: user.id },
            {
                onSuccess: () => { addToast(`Ownership transferred to ${transferTarget.displayName}`, 'success'); setTransferTarget(null); },
                onError: (err) => { addToast(err.response?.data?.message || 'Failed to transfer ownership', 'error'); setTransferTarget(null); }
            }
        );
    };

    const handleRemove = (member) => {
        if (member.userId === user?.id) {
            addToast('You cannot remove yourself', 'warning');
            return;
        }
        if (!window.confirm(`Are you sure you want to remove ${member.displayName || member.email}?`)) return;

        removeMemberMutation.mutate(member.userId, {
            onSuccess: () => addToast('Member removed successfully', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Failed to remove member', 'error')
        });
    };

    const handleRoleChange = (member, newRole) => {
        if (member.role === newRole) return;

        updateRoleMutation.mutate({ userId: member.userId, role: newRole }, {
            onSuccess: () => addToast('Role updated successfully', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update role', 'error')
        });
    };

    const handleQuickAdd = (e) => {
        e.preventDefault();
        if (!quickAdd.email.trim()) return;
        addMemberMutation.mutate(quickAdd);
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
        if (userId === user?.id) return; // Can't select self for removal
        const next = new Set(selectedMembers);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        setSelectedMembers(next);
    };

    const handleBulkRemove = () => {
        if (selectedMembers.size === 0) return;
        if (!window.confirm(`Are you sure you want to remove ${selectedMembers.size} members from this organization?`)) return;

        bulkRemoveMutation.mutate(Array.from(selectedMembers), {
            onSuccess: () => {
                addToast(`Successfully removed ${selectedMembers.size} members`, 'success');
                setSelectedMembers(new Set());
            },
            onError: (err) => addToast(err.response?.data?.message || 'Failed to remove members', 'error')
        });
    };

    const filteredMembers = useMemo(() => {
        if (!members) return [];
        return members.filter(m => {
            const matchesSearch = (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (error) return <div className="p-8 text-danger">Failed to load members: {error.message}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Breadcrumb / Back Navigation */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/organizations/${organizationId}`)}
                    className="flex items-center text-sm font-medium text-text-muted hover:text-brand-500 transition-colors group"
                >
                    <HiArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Organization Dashboard
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Organization Directory</h1>
                    <p className="text-text-secondary">Manage access and track activity for all organization members.</p>
                </div>
                <div className="flex items-center gap-2">
                    {members?.length > 0 && (
                        <button
                            onClick={handleExportCSV}
                            className="btn btn-secondary"
                            title="Export members as CSV"
                        >
                            <HiOutlineDownload className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="btn btn-primary shadow-sm"
                        >
                            <HiOutlineUserAdd className="w-4 h-4 mr-2" />
                            Invite Member
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Add Form (Admin Only) */}
            {isAdmin && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                    <form
                        onSubmit={handleQuickAdd}
                        className="bg-bg-raised border border-brand-500/20 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-end gap-4"
                    >
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1.5 ml-1">
                                Add Direct Member
                            </label>
                            <div className="relative">
                                <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="email"
                                    className="input pl-10 w-full border-border-subtle bg-bg-base focus:border-brand-500"
                                    placeholder="colleague@example.com"
                                    value={quickAdd.email}
                                    onChange={(e) => setQuickAdd({ ...quickAdd, email: e.target.value })}
                                    required
                                    disabled={addMemberMutation.isPending}
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
                                Organization Role
                            </label>
                            <select
                                className="input w-full border-border-subtle bg-bg-base"
                                value={quickAdd.role}
                                onChange={(e) => setQuickAdd({ ...quickAdd, role: e.target.value })}
                                disabled={addMemberMutation.isPending}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="VIEWER">Viewer</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full md:w-auto h-[42px] px-6"
                            disabled={!quickAdd.email || addMemberMutation.isPending}
                        >
                            {addMemberMutation.isPending ? (
                                <div className="spinner spinner-sm" />
                            ) : (
                                <>
                                    <HiOutlinePlus className="w-5 h-5 mr-2" />
                                    Add Member
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-bg-raised border border-border-subtle rounded-t-lg p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {isAdmin && (
                        <input
                            type="checkbox"
                            className="rounded border-border-subtle text-brand-500 focus:ring-brand-500"
                            checked={selectedMembers.size === filteredMembers.filter(m => m.userId !== user?.id).length && filteredMembers.length > 0}
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
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <select
                        className="input text-sm h-9"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admins</option>
                        <option value="MEMBER">Members</option>
                        <option value="VIEWER">Viewers</option>
                    </select>

                    {selectedMembers.size > 0 ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                            <span className="text-sm font-medium text-brand-500">
                                {selectedMembers.size} Selected
                            </span>
                            <button
                                onClick={handleBulkRemove}
                                className="btn btn-ghost text-danger hover:bg-danger/10 px-3 py-1.5 h-auto text-sm"
                                disabled={bulkRemoveMutation.isPending}
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
                                {isAdmin && (
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
                                <th className="p-4 font-medium text-center">Active Tasks</th>
                                <th className="p-4 font-medium w-48">Workload %</th>
                                <th className="p-4 font-medium hidden md:table-cell">Last Active</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-sm">
                            {paginatedMembers.length > 0 ? (
                                paginatedMembers.map((member) => (
                                    <tr key={member.userId} className="hover:bg-bg-raised/40 transition-colors group">
                                        {isAdmin && (
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
                                                    src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || member.email)}&background=random`}
                                                    alt={member.displayName || member.email}
                                                    className="w-10 h-10 rounded-full object-cover border border-border-subtle shadow-sm shrink-0"
                                                />
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="font-semibold text-text-primary truncate">
                                                        {member.displayName || 'Unknown User'}
                                                        {member.userId === user?.id && <span className="ml-2 text-xs font-normal text-text-muted">(You)</span>}
                                                    </span>
                                                    <span className="text-xs text-text-muted truncate">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                member.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                                    member.role === 'VIEWER' ? 'bg-bg-overlay text-text-secondary border-border-subtle' :
                                                        'bg-brand-500/10 text-brand-600 border-brand-500/20'
                                            )}>
                                                {member.role === 'ADMIN' && <HiOutlineShieldCheck className="w-3.5 h-3.5" />}
                                                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-medium text-text-secondary">
                                            {member.assignedTaskCount || 0}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-border-muted rounded-full h-1.5 overflow-hidden flex-1">
                                                    <div
                                                        className={clsx(
                                                            "h-full rounded-full transition-all duration-500",
                                                            member.workloadScore > 80 ? 'bg-danger' :
                                                                member.workloadScore > 50 ? 'bg-warning' : 'bg-brand-500'
                                                        )}
                                                        style={{ width: `${Math.min(member.workloadScore || 0, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-text-secondary whitespace-nowrap w-8 text-right">
                                                    {Math.min(member.workloadScore || 0, 100)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-text-muted whitespace-nowrap">
                                            {member.lastActiveAt ? (() => {
                                                const diff = Date.now() - new Date(member.lastActiveAt).getTime();
                                                const mins = Math.floor(diff / 60000);
                                                const hours = Math.floor(mins / 60);
                                                const days = Math.floor(hours / 24);
                                                if (mins < 60) return `${mins <= 0 ? 1 : mins}m ago`;
                                                if (hours < 24) return `${hours}h ago`;
                                                return `${days}d ago`;
                                            })() : 'Never'}
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
                                            {isAdmin && member.userId !== user?.id && (
                                                <div className="relative inline-block text-left"
                                                    onMouseLeave={() => setOpenMenuId(null)}>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                                                        className="p-1.5 text-text-muted hover:bg-bg-hover rounded-md transition-colors outline-none focus:ring-2 focus:ring-brand-500/50"
                                                    >
                                                        <HiDotsVertical className="w-5 h-5" />
                                                    </button>

                                                    {openMenuId === member.userId && (
                                                        <div className="absolute right-0 top-full mt-1 w-40 bg-bg-raised border border-border-subtle rounded-lg shadow-xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle mb-1">
                                                                Actions
                                                            </div>
                                                            <div className="px-1">
                                                                {['ADMIN', 'MEMBER', 'VIEWER'].map(role => (
                                                                    member.role !== role && (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => {
                                                                                handleRoleChange(member, role);
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover hover:text-brand-600 rounded-md transition-colors"
                                                                        >
                                                                            Change Role to {role.charAt(0) + role.slice(1).toLowerCase()}
                                                                        </button>
                                                                    )
                                                                ))}
                                                                <div className="h-px bg-border-subtle my-1 mx-2" />
                                                                {isOwner && member.role !== 'OWNER' && (
                                                                    <button
                                                                        onClick={() => handleTransferOwnership(member)}
                                                                        className="w-full text-left px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-500/10 rounded-md transition-colors flex items-center gap-2"
                                                                    >
                                                                        <HiOutlineSwitchHorizontal className="w-4 h-4" />
                                                                        Transfer Ownership
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setUserToAssign(member);
                                                                        setIsAssignModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-500/10 rounded-md transition-colors flex items-center gap-2"
                                                                >
                                                                    <HiOutlineCollection className="w-4 h-4" />
                                                                    Add to Project
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleRemove(member);
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
                                    <td colSpan={isAdmin ? 8 : 7} className="p-16 text-center">
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

            <InviteOrganizationMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                organizationId={organizationId}
            />

            <AssignToProjectModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setUserToAssign(null);
                }}
                organizationId={organizationId}
                userToAssign={userToAssign}
            />

            {/* Transfer Ownership Confirmation Dialog */}
            {transferTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-bg-raised border border-border-subtle rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                                <HiOutlineExclamationCircle className="w-7 h-7 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">Transfer Ownership</h3>
                            <p className="text-sm text-text-secondary">
                                You are about to transfer ownership of this organization to{' '}
                                <span className="font-semibold text-text-primary">{transferTarget.displayName}</span>.
                                You will be downgraded to <span className="font-semibold">Admin</span>.
                            </p>
                            <p className="text-xs text-danger/80 mt-3 font-medium">This action cannot be undone without the new owner's cooperation.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTransferTarget(null)}
                                className="btn btn-ghost flex-1"
                                disabled={transferOwnershipMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmTransfer}
                                className="btn flex-1 bg-amber-500 hover:bg-amber-600 text-white border-0"
                                disabled={transferOwnershipMutation.isPending}
                            >
                                {transferOwnershipMutation.isPending ? <span className="spinner" /> : 'Confirm Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
