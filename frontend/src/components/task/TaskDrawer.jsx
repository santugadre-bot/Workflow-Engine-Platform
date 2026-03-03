import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TaskDetailView from './detail/TaskDetailView';
import { X } from 'lucide-react';
import { useProjectMembers } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';

export default function TaskDrawer({ projectId: propProjectId, onClose }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { organizationId, projectId: routeProjectId, taskId: routeTaskId } = useParams();
    const { user } = useAuth();

    // Prioritize prop if available (for My Tasks page), otherwise use route param
    const projectId = propProjectId || routeProjectId;

    // Support both route param and query param (?task=...)
    const queryTaskId = searchParams.get('task');
    const taskId = routeTaskId || queryTaskId;

    const isOpen = !!taskId;

    // ── Derive current user's project role so all sub-components get correct guards ──
    const { data: projectMembers } = useProjectMembers(organizationId, projectId);
    const userId = user?.userId || user?.id;
    const userRole = projectMembers?.find(m => m.userId === userId)?.role;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else if (queryTaskId) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('task');
            setSearchParams(newParams);
        } else if (routeTaskId) {
            navigate('..');
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl">
                                    <div className="flex h-full flex-col bg-white shadow-xl">
                                        <div className="relative flex-1 overflow-y-auto">
                                            {taskId && (
                                                <TaskDetailView
                                                    taskId={taskId}
                                                    projectId={projectId}
                                                    organizationId={organizationId}
                                                    userRole={userRole}
                                                    onClose={handleClose}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
