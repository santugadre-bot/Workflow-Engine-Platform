import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { HiX } from 'react-icons/hi';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import useUIStore from '../../store/uiStore';

export default function QuickAddTaskModal({ organizationId, onClose }) {
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [isLoading, setIsLoading] = useState(false);

    const queryClient = useQueryClient();
    const addToast = useUIStore(s => s.addToast);

    // Fetch Projects
    const { data: projects = [] } = useQuery({
        queryKey: ['projects', organizationId],
        queryFn: () => projectsApi.list(organizationId),
    });

    // Create Task Mutation
    const createTaskMutation = useMutation({
        mutationFn: (data) => tasksApi.create(data.projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tasks', organizationId]);
            addToast('Task created successfully', 'success');
            onClose();
        },
        onError: () => {
            addToast('Failed to create task', 'error');
            setIsLoading(false);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !projectId) return;

        setIsLoading(true);
        createTaskMutation.mutate({
            title,
            projectId,
            priority,
            currentState: 'TODO', // Default state
            organizationId
        });
    };

    return (
        <Transition.Root show={true} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <HiX className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start w-full">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Quick Add Task
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
                                                    <input
                                                        type="text"
                                                        id="title"
                                                        autoFocus
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="What needs to be done?"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project</label>
                                                        <select
                                                            id="project"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            value={projectId}
                                                            onChange={(e) => setProjectId(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Select Project...</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                                        <select
                                                            id="priority"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            value={priority}
                                                            onChange={(e) => setPriority(e.target.value)}
                                                        >
                                                            <option value="LOW">Low</option>
                                                            <option value="MEDIUM">Medium</option>
                                                            <option value="HIGH">High</option>
                                                            <option value="CRITICAL">Critical</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading || !title || !projectId}
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isLoading ? 'Creating...' : 'Create Task'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                        onClick={onClose}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
