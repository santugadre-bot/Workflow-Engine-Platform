import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    HiPlus, HiOutlineOfficeBuilding, HiOutlineCheckCircle, HiFilter, HiChevronDown, HiOutlineLockClosed
} from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { organizationsApi } from '../api';
import { dashboardApi } from '../api/dashboard';
import useUIStore from '../store/uiStore';
import { useAuth } from '../context/AuthContext';
import { canCreateOrganization } from '../utils/permissions';
import DashboardStatsCard from '../components/dashboard/DashboardStatsCard';
import DashboardActivityFeed from '../components/dashboard/DashboardActivityFeed';
import MyTasksSection from '../components/dashboard/MyTasksSection';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import CreateOrganizationModal from '../components/modals/CreateOrganizationModal';

export default function DashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canCreateOrg = canCreateOrganization(user?.systemRole);

    // Single useUIStore subscription with individual selectors — prevents unnecessary re-renders
    const activeOrganizationId = useUIStore(s => s.activeOrganizationId);
    const setActiveOrganizationId = useUIStore(s => s.setActiveOrganizationId);
    const addToast = useUIStore(s => s.addToast);
    const searchQuery = useUIStore(s => s.searchQuery);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activityFilter, setActivityFilter] = useState('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { data: organizations, isLoading: isOrgsLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: organizationsApi.list,
    });

    // Fetch organization stats
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats', activeOrganizationId],
        queryFn: () => organizationsApi.getStats(activeOrganizationId),
        enabled: !!activeOrganizationId,
    });

    // Fetch recent activity
    const { data: activity } = useQuery({
        queryKey: ['organization-activity', activeOrganizationId],
        queryFn: () => dashboardApi.getActivity(activeOrganizationId, 20),
        enabled: !!activeOrganizationId,
    });

    const filteredActivity = activity?.filter(item => {
        if (activityFilter === 'ALL') return true;
        if (activityFilter === 'TASKS') return item.actionType.includes('TASK');
        if (activityFilter === 'PROJECTS') return item.actionType.includes('PROJECT');
        if (activityFilter === 'WORKFLOWS') return item.actionType.includes('WORKFLOW');
        return true;
    });

    const createOrgMutation = useMutation({
        mutationFn: (data) => organizationsApi.create(data),
        onSuccess: (newOrg) => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            setActiveOrganizationId(newOrg.id);
            setIsCreateModalOpen(false);
            addToast('Organization created successfully', 'success');
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to create organization', 'error'),
    });

    // Auto-select first organization if none selected
    useEffect(() => {
        if (organizations?.length > 0 && !activeOrganizationId) {
            setActiveOrganizationId(organizations[0].id);
        }
    }, [organizations, activeOrganizationId, setActiveOrganizationId]);

    // Filter organizations by search query
    const filteredOrganizations = organizations?.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If no organizations, show empty state
    if (!isOrgsLoading && (!organizations || organizations.length === 0)) {
        return (
            <AppLayout title="Dashboard">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <HiOutlineOfficeBuilding className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No organizations yet</h3>
                    <p className="text-slate-500 max-w-md mb-6">Create your first organization to start organizing your projects and workflows.</p>
                    {canCreateOrg ? (
                        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                            <HiPlus className="w-5 h-5 mr-2" /> Create Organization
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
                            <HiOutlineLockClosed className="w-4 h-4 shrink-0" />
                            You are not in any organization yet. Contact a System Admin to create one for you.
                        </div>
                    )}
                </div>
                <CreateOrganizationModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={createOrgMutation.mutate}
                    isCreating={createOrgMutation.isPending}
                />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Dashboard">

            {/* SaaS Elite Layout: 12-Column Grid */}
            <div className="space-y-6">

                {/* Row 1: Actionable KPIs (4 Cards) */}
                {stats && <DashboardStatsCard stats={stats} />}

                {/* Row 2: Charts & Insights */}
                {stats && activeOrganizationId && (
                    <DashboardCharts organizationId={activeOrganizationId} stats={stats} />
                )}

                {/* Row 3: Operational Focus - Conditional Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Needs Attention Panel */}
                    {(stats?.overdueTaskCount > 0 || activity?.length === 0) && (
                        <div className={`rounded-xl border border-white/5 flex flex-col h-[300px] bg-white/5 ${activity?.length > 0 ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between rounded-t-xl">
                                <h3 className="font-semibold text-zinc-200">Needs Attention</h3>
                                <button
                                    onClick={() => navigate(`/organizations/${activeOrganizationId}/tasks/my`)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {stats?.overdueTaskCount > 0 ? (
                                    <>
                                        <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg flex items-start gap-3">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-red-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-red-300">
                                                    {stats.overdueTaskCount} Overdue Task{stats.overdueTaskCount !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-xs text-red-400/70 mt-1">Requires immediate action.</p>
                                            </div>
                                        </div>
                                        <MyTasksSection organizationId={activeOrganizationId} embedded={true} />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-lg border border-dashed border-white/8">
                                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                            <HiOutlineCheckCircle className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-zinc-200 font-medium">All caught up!</h4>
                                        <p className="text-xs text-zinc-500 max-w-xs mt-1">No overdue tasks or immediate blockers.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Smart Activity Feed */}
                    {activity?.length > 0 && (
                        <div className={`${stats?.overdueTaskCount > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} rounded-xl border border-white/5 flex flex-col h-[300px] bg-white/5`}>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between rounded-t-xl">
                                <h3 className="font-semibold text-zinc-200">Activity Stream</h3>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/6 transition-colors"
                                    >
                                        <HiFilter className="w-3.5 h-3.5" />
                                        Filter: <span className="font-medium text-zinc-300">{activityFilter === 'ALL' ? 'All' : activityFilter.charAt(0) + activityFilter.slice(1).toLowerCase()}</span>
                                        <HiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFilterOpen ? 'transform rotate-180' : ''}`} />
                                    </button>
                                    {isFilterOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border border-white/10 py-1 z-10 bg-[#1a1a1f]">
                                            {['ALL', 'TASKS', 'PROJECTS', 'WORKFLOWS'].map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => {
                                                        setActivityFilter(filter);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 ${activityFilter === filter ? 'text-indigo-400 font-medium' : 'text-zinc-400'}`}
                                                >
                                                    {filter === 'ALL' ? 'All Activity' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                <DashboardActivityFeed activities={filteredActivity} />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Single Create Organization Modal instance */}
            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={createOrgMutation.mutate}
                isCreating={createOrgMutation.isPending}
            />
        </AppLayout >
    );
}
