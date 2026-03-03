import { useTask } from '../../../api/tasks';
import { useProject } from '../../../api/projects';
import { useOrganizationMembers } from '../../../api/organizations';
import TaskDetailHeader from './TaskDetailHeader';
import TaskDetailSidebar from './TaskDetailSidebar';
import TaskDetailDescription from './TaskDetailDescription';
import TaskDetailActivity from './TaskDetailActivity';
import TaskDependencies from './TaskDependencies';
import TaskAttachments from '../TaskAttachments';

export default function TaskDetailView({ taskId, projectId, onClose, userRole, organizationId }) {
    const { data: task, isLoading: taskLoading, error: taskError } = useTask(taskId);
    const { data: project, isLoading: projectLoading } = useProject(organizationId, projectId);
    const { data: members = [] } = useOrganizationMembers(organizationId);

    const isLoading = taskLoading || projectLoading;
    const error = taskError;

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="spinner spinner-lg mb-4" />
                <p className="text-text-muted animate-pulse">Loading task details...</p>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="text-danger text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Failed to load task</h3>
                <p className="text-text-secondary mb-6">{error?.message || 'Task not found or access denied.'}</p>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-bg-base text-text-primary">
            {/* Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur-sm px-8 pt-6">
                <TaskDetailHeader
                    task={task}
                    projectId={projectId}
                    onClose={onClose}
                    userRole={userRole}
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content (Left 2/3) */}
                        <div className="lg:col-span-2">
                            <TaskDetailDescription
                                task={task}
                                projectId={projectId}
                                userRole={userRole}
                            />

                            <TaskDependencies
                                taskId={taskId}
                                projectId={projectId}
                                userRole={userRole}
                            />

                            <TaskDetailActivity
                                taskId={taskId}
                                userRole={userRole}
                                members={members}
                            />
                        </div>

                        {/* Sidebar (Right 1/3) */}
                        <div className="lg:col-span-1 border-l border-border-subtle/50 lg:pl-12">
                            <TaskDetailSidebar
                                task={task}
                                projectId={projectId}
                                userRole={userRole}
                                showDueDate={project?.showDueDate}
                                showStoryPoints={project?.showStoryPoints}
                            />
                            <TaskAttachments
                                taskId={taskId}
                                userRole={userRole}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
