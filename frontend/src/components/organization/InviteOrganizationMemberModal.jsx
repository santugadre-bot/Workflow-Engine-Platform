import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HiX, HiOutlineMail, HiOutlineUserAdd, HiOutlineUser } from 'react-icons/hi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api';
import useUIStore from '../../store/uiStore';

const ROLES = [
    { value: 'ADMIN', label: 'Admin', desc: 'Full access — can manage members & settings' },
    { value: 'MEMBER', label: 'Member', desc: 'Standard access — can create and manage tasks' },
];

export default function InviteOrganizationMemberModal({ isOpen, onClose, organizationId }) {
    const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'create'
    // Invite existing user
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBER');
    // Create new user
    const [newUser, setNewUser] = useState({ displayName: '', email: '', role: 'MEMBER' });

    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['organizations', organizationId, 'members'] });

    const inviteMutation = useMutation({
        mutationFn: (data) => organizationsApi.addMember(organizationId, data),
        onSuccess: () => {
            invalidate();
            addToast('Member added successfully', 'success');
            setEmail('');
            setRole('MEMBER');
            onClose();
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to add member. Make sure the user exists.', 'error')
    });

    const createMutation = useMutation({
        mutationFn: (data) => organizationsApi.addMember(organizationId, { email: data.email, role: data.role }),
        onSuccess: () => {
            invalidate();
            addToast('Member added successfully', 'success');
            setNewUser({ displayName: '', email: '', role: 'MEMBER' });
            onClose();
        },
        onError: (err) => addToast(err.response?.data?.message || 'User not found. Please ensure the account exists.', 'error')
    });

    const handleInviteSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        inviteMutation.mutate({ email, role });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!newUser.email.trim()) return;
        createMutation.mutate(newUser);
    };

    const isPending = inviteMutation.isPending || createMutation.isPending;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-raised border border-border-subtle p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-text-primary">
                                        Add Member
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                                        <HiX className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 p-1 bg-bg-overlay rounded-lg mb-5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('invite')}
                                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${activeTab === 'invite'
                                                ? 'bg-bg-raised text-text-primary shadow-sm'
                                                : 'text-text-muted hover:text-text-secondary'
                                            }`}
                                    >
                                        <HiOutlineMail className="w-4 h-4" /> Invite by Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('create')}
                                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-md transition-all ${activeTab === 'create'
                                                ? 'bg-bg-raised text-text-primary shadow-sm'
                                                : 'text-text-muted hover:text-text-secondary'
                                            }`}
                                    >
                                        <HiOutlineUserAdd className="w-4 h-4" /> Add New User
                                    </button>
                                </div>

                                {/* Tab: Invite by Email */}
                                {activeTab === 'invite' && (
                                    <form onSubmit={handleInviteSubmit} className="space-y-4">
                                        <p className="text-xs text-text-muted">
                                            Enter the email of an existing platform user to add them to this organization.
                                        </p>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                                    <HiOutlineMail />
                                                </div>
                                                <input
                                                    type="email"
                                                    className="input pl-10 w-full"
                                                    placeholder="colleague@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Role</label>
                                            <div className="space-y-2">
                                                {ROLES.map(r => (
                                                    <label key={r.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${role === r.value ? 'border-brand-500 bg-brand-500/5' : 'border-border-subtle hover:border-brand-500/40'
                                                        }`}>
                                                        <input type="radio" name="invite-role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                                                            <p className="text-xs text-text-muted">{r.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2 flex justify-end gap-3">
                                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={isPending}>
                                                {isPending ? <span className="spinner" /> : 'Add Member'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Tab: Add New User */}
                                {activeTab === 'create' && (
                                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                                        <p className="text-xs text-text-muted">
                                            Enter the details of the new user. Their account must already exist on the platform.
                                        </p>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Display Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                                    <HiOutlineUser />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="input pl-10 w-full"
                                                    placeholder="Jane Smith"
                                                    value={newUser.displayName}
                                                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                                    <HiOutlineMail />
                                                </div>
                                                <input
                                                    type="email"
                                                    className="input pl-10 w-full"
                                                    placeholder="jane@example.com"
                                                    value={newUser.email}
                                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Role</label>
                                            <div className="space-y-2">
                                                {ROLES.map(r => (
                                                    <label key={r.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${newUser.role === r.value ? 'border-brand-500 bg-brand-500/5' : 'border-border-subtle hover:border-brand-500/40'
                                                        }`}>
                                                        <input type="radio" name="create-role" value={r.value} checked={newUser.role === r.value} onChange={() => setNewUser({ ...newUser, role: r.value })} className="mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                                                            <p className="text-xs text-text-muted">{r.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2 flex justify-end gap-3">
                                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={isPending}>
                                                {isPending ? <span className="spinner" /> : 'Add to Organization'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
