import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HiX, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api';
import useUIStore from '../../store/uiStore';

export default function CreateOrganizationModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: organizationsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            addToast('Organization created successfully', 'success');
            setName('');
            setDescription('');
            onClose();
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to create organization', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        createMutation.mutate({ name, description });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-raised border border-border-subtle p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-text-primary">
                                        Create New Organization
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                                        <HiX className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="input-group">
                                        <label className="text-xs font-bold text-text-secondary uppercase">
                                            Organization Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                                <HiOutlineOfficeBuilding />
                                            </div>
                                            <input
                                                type="text"
                                                className="input pl-10 w-full"
                                                placeholder="e.g. Acme Corp"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="text-xs font-bold text-text-secondary uppercase">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            className="input w-full h-24 resize-none"
                                            placeholder="What is this organization for?"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary px-6"
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? <span className="spinner" /> : 'Create Organization'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
