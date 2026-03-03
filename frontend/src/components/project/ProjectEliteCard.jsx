import { useNavigate } from 'react-router-dom';
import {
    HiOutlineDotsVertical,
    HiOutlineClock,
    HiOutlineLightningBolt,
    HiOutlineCheckCircle,
    HiOutlineExclamation
} from 'react-icons/hi';

export default function ProjectEliteCard({ project, organizationId, onEdit }) {
    const navigate = useNavigate();

    // Calculate progress (default to 0 if data missing during transition)
    const completed = project.completedTaskCount || 0;
    const total = project.totalTaskCount || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status Logic
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-success bg-success/10 ring-success/20';
            case 'ON_HOLD': return 'text-warning bg-warning/10 ring-warning/20';
            case 'CANCELLED': return 'text-danger bg-danger/10 ring-danger/20';
            case 'DRAFT': return 'text-text-muted bg-bg-overlay ring-border-default/20';
            case 'ACTIVE': return 'text-primary bg-primary/10 ring-primary/20';
            default: return 'text-text-muted bg-bg-overlay ring-border-default/20';
        }
    };

    const getProgressBarColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-success';
            case 'AT_RISK': return 'bg-danger';
            default: return 'bg-primary';
        }
    };

    return (
        <div
            onClick={() => navigate(`/projects/${organizationId}/${project.id}`)}
            className={`group relative bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${project.archived ? 'opacity-70 grayscale-[0.2]' : 'hover:-translate-y-1'}`}
        >
            {/* Glossy Header Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent-hover text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                            <HiOutlineClock className="w-3 h-3" />
                            Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                    className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <HiOutlineDotsVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Description (Truncated) */}
            <p className="text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                {project.description || "No description provided."}
            </p>

            {/* Stats & Progress */}
            <div className="space-y-3 mb-5">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressBarColor(project.status)} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex gap-2 items-center">
                        {project.archived && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-slate-500 bg-slate-100 ring-1 ring-slate-500/20">
                                ARCHIVED
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md font-bold ${getStatusColor(project.explicitStatus || 'ACTIVE')}`}>
                            {(project.explicitStatus || 'ACTIVE').replace('_', ' ')}
                        </span>
                        {/* Secondary Health Indicator */}
                        {(project.explicitStatus === 'ACTIVE' || !project.explicitStatus) && project.status === 'AT_RISK' && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-danger bg-danger/10 ring-1 ring-danger/20" title="Project is at risk based on overdue tasks">
                                AT RISK
                            </span>
                        )}
                    </div>
                    <span className="text-slate-400">
                        {completed}/{total} Tasks
                    </span>
                </div>
            </div>

            {/* Footer: Workflow & Team */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                    {project.workflowId ? (
                        <>
                            <HiOutlineLightningBolt className="w-3.5 h-3.5 text-amber-500" />
                            <span>Workflow Active</span>
                        </>
                    ) : (
                        <>
                            <HiOutlineExclamation className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400">No Workflow</span>
                        </>
                    )}
                </div>

                {/* Team Facepile */}
                <div className="flex -space-x-2">
                    {project.members && project.members.length > 0 ? (
                        project.members.map((member, i) => (
                            <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                                title={member}
                            >
                                {member.charAt(0)}
                            </div>
                        ))
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] text-slate-400">
                            -
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
