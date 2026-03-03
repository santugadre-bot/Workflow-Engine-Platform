import { HiOutlineUserGroup, HiOutlineClock, HiOutlineChartBar, HiPlus, HiOutlineCog } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { canManageSettings } from '../../utils/permissions';

export default function ProjectHeader({ project, organizationId, onEdit, action }) {
    if (!project) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-success bg-success/10 ring-success/20';
            case 'AT_RISK': return 'text-danger bg-danger/10 ring-danger/20';
            case 'ON_TRACK': return 'text-primary bg-primary/10 ring-primary/20';
            default: return 'text-text-muted bg-bg-overlay ring-border-default/20';
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 px-8 py-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb & Meta */}
                <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                    <Link to={`/dashboard`} className="hover:text-indigo-600">Home</Link>
                    <span>/</span>
                    <Link to={`/projects/${organizationId}`} className="hover:text-indigo-600">Projects</Link>
                    <span>/</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded textxs font-medium ring-1 ring-inset ${getStatusColor(project.status)}`}>
                        {project.status?.replace('_', ' ') || 'ACTIVE'}
                    </span>
                </div>

                {/* Main Header Content */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                        <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {canManageSettings(project?.role) && (
                            <Link to={`/organizations/${organizationId}/projects/${project.id}/settings`} className="btn btn-secondary">
                                <HiOutlineCog className="w-5 h-5 text-slate-400" />
                                Settings
                            </Link>
                        )}
                        {action}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-slate-900">{project.loopTaskCount}</span>
                            <span className="text-xs text-slate-400">items</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-slate-900">
                                {project.loopTaskCount > 0 ? Math.round((project.completedTaskCount / project.loopTaskCount) * 100) : 0}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success rounded-full"
                                    style={{ width: `${project.loopTaskCount > 0 ? (project.completedTaskCount / project.loopTaskCount) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Velocity</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-slate-900">{project.velocity || 0}</span>
                            <span className="text-xs text-emerald-600 font-medium">tasks/week</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team</span>
                        <div className="flex -space-x-2 mt-1">
                            {project.members && project.members.length > 0 ? (
                                project.members.map((member, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-medium text-indigo-700" title={member}>
                                        {member.charAt(0)}
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">No members</span>
                            )}
                            {project.members?.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-500">
                                    +{project.members.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
