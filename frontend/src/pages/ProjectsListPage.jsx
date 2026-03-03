import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    HiPlus,
    HiOutlineFolder,
    HiOutlineViewGrid,
    HiOutlineViewList,
} from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { projectsApi, organizationsApi } from '../api';
import useUIStore from '../store/uiStore';
import { canCreateProject } from '../utils/orgPermissions';
import ProjectEliteCard from '../components/project/ProjectEliteCard';

export default function ProjectsListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);
    const openModal = useUIStore((s) => s.openModal);
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updated');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showArchived, setShowArchived] = useState(false);

    // Fetch organization details
    const { data: organization } = useQuery({
        queryKey: ['organizations', activeOrganizationId],
        queryFn: () => organizationsApi.getById(activeOrganizationId),
        enabled: !!activeOrganizationId,
    });

    // Fetch projects
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', activeOrganizationId],
        queryFn: () => projectsApi.list(activeOrganizationId),
        enabled: !!activeOrganizationId,
    });

    // Filter & Sort — wrapped in useMemo; .slice() prevents mutating the cached array
    const sortedProjects = useMemo(() => {
        if (!projects) return [];
        const filtered = projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesArchived = showArchived ? true : !p.archived;
            return matchesSearch && matchesStatus && matchesArchived;
        });
        return filtered.slice().sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'updated') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            return 0;
        });
    }, [projects, searchQuery, filterStatus, sortBy]);

    // Stats for Header (exclude archived from active count)
    const activeProjects = projects?.filter(p => !p.archived && p.status !== 'COMPLETED').length || 0;
    const completedProjects = projects?.filter(p => !p.archived && p.status === 'COMPLETED').length || 0;

    return (
        <AppLayout title="Projects List">
            <div className="max-w-7xl mx-auto pb-10 space-y-6">
                <div className="pt-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                {activeProjects} Active
                            </span>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {completedProjects} Done
                            </span>
                        </div>

                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-3 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm w-44"
                        />

                        {/* Status filter */}
                        <select
                            className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="ON_TRACK">On Track</option>
                            <option value="AT_RISK">At Risk</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        {/* Sort — Bug #6 fix: was dead state, now has a UI control */}
                        <select
                            className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="updated">Last Updated</option>
                            <option value="created">Date Created</option>
                            <option value="name">Name A–Z</option>
                        </select>

                        <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                            <button
                                className={`p-1 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <HiOutlineViewGrid className="w-4 h-4" />
                            </button>
                            <button
                                className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setViewMode('list')}
                            >
                                <HiOutlineViewList className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Show Archived Toggle */}
                        <div className="flex items-center gap-2 px-2">
                            <label className="text-xs font-medium text-slate-600 cursor-pointer flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                />
                                Show Archived
                            </label>
                        </div>

                        {organization && canCreateProject(organization.role) && (
                            <button
                                className="btn btn-primary btn-sm shadow-sm hover:shadow-md transition-all px-3 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium ml-1"
                                onClick={() => openModal('createProject', { organizationId: activeOrganizationId })}
                            >
                                <HiPlus className="w-3.5 h-3.5" />
                                New
                            </button>
                        )}
                    </div>

                </div>

                {isLoading ? (
                    <div className="flex justify-start py-20">
                        <div className="spinner spinner-xl text-primary" />
                    </div>
                ) : !sortedProjects || sortedProjects.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <HiOutlineFolder className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No projects found</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first project in this organization.'}
                        </p>
                        {organization && canCreateProject(organization.role) && !searchQuery && (
                            <button
                                className="btn btn-primary mt-6"
                                onClick={() => openModal('createProject', { organizationId: activeOrganizationId })}
                            >
                                <HiPlus className="w-5 h-5 mr-2" />
                                Create Project
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {sortedProjects.map(project => (
                                    <ProjectEliteCard
                                        key={project.id}
                                        project={project}
                                        organizationId={activeOrganizationId}
                                        onEdit={(p) => openModal('editProject', { project })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Progress</th>
                                            <th className="px-6 py-4">Last Updated</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedProjects.map(project => (
                                            <tr
                                                key={project.id}
                                                onClick={() => navigate(`/projects/${activeOrganizationId}/${project.id}`)}
                                                className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                                        {project.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 line-clamp-1">{project.description}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                            ${project.archived ? 'bg-slate-100 text-slate-500' :
                                                            project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                                project.status === 'AT_RISK' ? 'bg-red-100 text-red-700' :
                                                                    'bg-blue-100 text-blue-700'}`}>
                                                        {project.archived ? 'ARCHIVED' : (project.status?.replace('_', ' ') || 'ACTIVE')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-[150px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${(project.completedTaskCount / (project.totalTaskCount || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            {Math.round((project.completedTaskCount / (project.totalTaskCount || 1)) * 100)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View →
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
