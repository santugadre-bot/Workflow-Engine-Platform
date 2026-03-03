import { useNavigate } from 'react-router-dom';
import { HiOutlineFolderAdd, HiOutlineUserAdd, HiOutlineLightningBolt, HiOutlineClipboardList, HiCheck } from 'react-icons/hi';


export default function OnboardingChecklist({ stats, organizationId }) {
    const navigate = useNavigate();

    const steps = [
        {
            id: 'project',
            label: 'Create your first Project',
            description: 'Projects organize your team\'s work.',
            completed: stats.projectCount > 0,
            icon: HiOutlineFolderAdd,
            action: () => navigate(`/organizations/${organizationId}/projects`)
        },
        {
            id: 'members',
            label: 'Invite team members',
            description: 'Collaborate with your team.',
            completed: stats.memberCount > 1, // Assumes creator is 1 member
            icon: HiOutlineUserAdd,
            action: () => navigate(`/organizations/${organizationId}/members`)
        },
        {
            id: 'workflow',
            label: 'Create a Workflow',
            description: 'Define how work gets done.',
            completed: stats.workflowCount > 0,
            icon: HiOutlineLightningBolt,
            action: () => navigate(`/organizations/${organizationId}/workflows`)
        },
        {
            id: 'task',
            label: 'Create your first Task',
            description: 'Start tracking work items.',
            completed: stats.taskCount > 0,
            icon: HiOutlineClipboardList,
            action: () => navigate(`/organizations/${organizationId}/projects`)
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    return (
        <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-end mb-8 border-b border-[var(--border-subtle)] pb-6">
                <div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Let's get started!
                    </h3>
                    <p className="text-[var(--text-secondary)] m-0">
                        Complete these steps to set up your organization.
                    </p>
                </div>
                <div className="w-[200px] text-right">
                    <span className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                        {completedCount}/{steps.length} Completed
                    </span>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={step.id}
                            className={`
                                flax items-center gap-4 p-5 
                                bg-white/5 border border-white/5 rounded-xl 
                                transition-all duration-200
                                ${step.completed
                                    ? 'cursor-default opacity-70 bg-green-500/5 border-green-500/10'
                                    : 'cursor-pointer hover:bg-white/5 hover:-translate-y-0.5 hover:border-white/10 group'
                                }
                            `}
                            onClick={!step.completed ? step.action : undefined}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
                                ${step.completed
                                    ? 'bg-green-500/15 text-green-500'
                                    : 'bg-white/5 text-[var(--text-secondary)]'
                                }
                            `}>
                                {step.completed ? <HiCheck /> : <Icon />}
                            </div>

                            <div className="flex-1">
                                <h4 className={`
                                    m-0 mb-1 text-base
                                    ${step.completed
                                        ? 'line-through text-[var(--text-secondary)]'
                                        : 'text-[var(--text-primary)]'
                                    }
                                `}>
                                    {step.label}
                                </h4>
                                <p className="m-0 text-sm text-[var(--text-secondary)]">
                                    {step.description}
                                </p>
                            </div>

                            {!step.completed && (
                                <button className="
                                    bg-[var(--primary)] text-white border-0 py-2 px-4 rounded-md 
                                    text-sm font-medium cursor-pointer 
                                    opacity-0 -translate-x-2.5 transition-all duration-200
                                    group-hover:opacity-100 group-hover:translate-x-0
                                ">
                                    Start
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
