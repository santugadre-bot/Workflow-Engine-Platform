import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import ApprovalCenter from '../components/approval/ApprovalCenter';
import { HiOutlineCog, HiOutlineUsers, HiOutlineCreditCard, HiOutlineTrash, HiOutlineExclamation, HiOutlineChartPie, HiOutlineClipboardList, HiOutlineLockClosed } from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { organizationsApi } from '../api';
import useUIStore from '../store/uiStore';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function OrganizationSettingsPage() {
    const { organizationId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useUIStore();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    // Fetch Organization Details
    const { data: organization, isLoading } = useQuery({
        queryKey: ['organizations', organizationId],
        queryFn: () => organizationsApi.getById(organizationId),
        enabled: !!organizationId,
    });

    // Fetch members to determine current user's real role
    const { data: members } = useQuery({
        queryKey: ['organizations', organizationId, 'members'],
        queryFn: () => organizationsApi.listMembers(organizationId),
        enabled: !!organizationId,
    });

    const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
    const currentUserRole = members?.find(m => m.userId === user?.id)?.role;
    const isOwner = isSuperAdmin || currentUserRole === 'OWNER';
    const isAdmin = isOwner || currentUserRole === 'ADMIN';

    if (isLoading) return <AppLayout><div className="loading-center"><div className="spinner" /></div></AppLayout>;

    return (
        <AppLayout title="Organization Settings">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Settings Sidebar */}
                <div className="lg:col-span-1">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <HiOutlineCog className="w-5 h-5 flex-shrink-0" />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'members' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <HiOutlineUsers className="w-5 h-5 flex-shrink-0" />
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <HiOutlineChartPie className="w-5 h-5 flex-shrink-0" />
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'approvals' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <HiOutlineClipboardList className="w-5 h-5 flex-shrink-0" />
                            Approvals
                        </button>
                        {/* Future: Billing */}
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-400 cursor-not-allowed">
                            <HiOutlineCreditCard className="w-5 h-5 flex-shrink-0" />
                            Billing (Pro)
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {activeTab === 'general' && <GeneralOrganizationSettings organization={organization} addToast={addToast} navigate={navigate} isOwner={isOwner} isAdmin={isAdmin} />}
                    {activeTab === 'members' && <OrganizationMembersSettings organization={organization} addToast={addToast} />}
                    {activeTab === 'analytics' && (
                        <div className="animate-in fade-in duration-300">
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Organization Analytics</h3>
                            <AnalyticsDashboard organizationId={organizationId} />
                        </div>
                    )}
                    {activeTab === 'approvals' && (
                        <div className="animate-in fade-in duration-300">
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Approval Center</h3>
                            <ApprovalCenter organizationId={organizationId} />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function GeneralOrganizationSettings({ organization, addToast, navigate, isOwner, isAdmin }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: organization?.name,
            description: organization?.description
        }
    });

    const updateOrgMutation = useMutation({
        mutationFn: (data) => organizationsApi.update(organization.id, data),
        onSuccess: () => addToast('Organization updated successfully', 'success'),
        onError: (err) => addToast(err.response?.data?.message || 'Failed to update', 'error')
    });

    const deleteOrgMutation = useMutation({
        mutationFn: () => organizationsApi.delete(organization.id),
        onSuccess: () => {
            addToast('Organization deleted', 'success');
            navigate('/dashboard');
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to delete', 'error')
    });

    const onSubmit = (data) => updateOrgMutation.mutate(data);

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
            deleteOrgMutation.mutate();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* General Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-1">Organization General</h3>
                <p className="text-sm text-slate-500 mb-6">Manage your organization's basic information.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
                    <div className="input-group">
                        <label>Organization Name</label>
                        <input {...register('name', { required: 'Name is required' })} className="input" disabled={!isAdmin} />
                        {errors.name && <span className="input-error">{errors.name.message}</span>}
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea {...register('description')} className="input h-24 resize-none" disabled={!isAdmin} />
                    </div>

                    {isAdmin && (
                        <div className="pt-2">
                            <button type="submit" className="btn btn-primary" disabled={updateOrgMutation.isPending}>
                                {updateOrgMutation.isPending ? <span className="spinner" /> : 'Save Changes'}
                            </button>
                        </div>
                    )}
                    {!isAdmin && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                            <HiOutlineLockClosed className="w-3.5 h-3.5" /> You need Admin or Owner role to edit settings.
                        </p>
                    )}
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <h3 className="text-lg font-medium text-red-800 mb-1">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">Once you delete an organization, there is no going back. Please be certain.</p>
                {isOwner ? (
                    <button onClick={handleDelete} className="btn bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300">
                        <HiOutlineTrash className="w-4 h-4 mr-2" />
                        Delete this Organization
                    </button>
                ) : (
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <HiOutlineLockClosed className="w-3.5 h-3.5" /> Only the organization owner can delete this organization.
                    </p>
                )}
            </div>
        </div>
    );
}

function OrganizationMembersSettings({ organization, addToast }) {
    const queryClient = useQueryClient();

    // Fetch Members
    const { data: members, isLoading } = useQuery({
        queryKey: ['organization-members', organization.id],
        queryFn: () => organizationsApi.listMembers(organization.id),
    });

    const removeMemberMutation = useMutation({
        mutationFn: (memberId) => organizationsApi.removeMember(organization.id, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries(['organization-members', organization.id]);
            addToast('Member removed', 'success');
        },
        onError: (err) => addToast('Failed to remove member', 'error')
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ memberId, role }) => organizationsApi.updateMemberRole(organization.id, memberId, role),
        onSuccess: () => {
            queryClient.invalidateQueries(['organization-members', organization.id]);
            addToast('Role updated', 'success');
        },
        onError: (err) => addToast('Failed to update role', 'error')
    });

    if (isLoading) return <div className="text-center p-8"><span className="spinner" /></div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-slate-900">Team Members</h3>
                    <p className="text-sm text-slate-500">Manage who has access to this organization.</p>
                </div>
                <button className="btn btn-primary">Invite Member</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Member</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {members?.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                            {member.user.displayName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{member.user.displayName}</p>
                                            <p className="text-xs text-slate-500">{member.user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={member.role}
                                        onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                                        className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -ml-2"
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="VIEWER">Viewer</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {member.joinedAt ? formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true }) : 'Recently'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => { if (window.confirm('Remove this member?')) removeMemberMutation.mutate(member.id) }}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Remove Member"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
