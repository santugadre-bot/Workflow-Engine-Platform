import { useState, useMemo } from 'react';
import Modal from '../modals/Modal';
import { useAddProjectMember } from '../../api/projects';
import { useOrganizationMembers } from '../../api/organizations';
import useUIStore from '../../store/uiStore';
import { HiOutlineUserAdd, HiOutlineSearch, HiOutlineCheck } from 'react-icons/hi';
import clsx from 'clsx';

export default function AddProjectMemberModal({ isOpen, onClose, organizationId, projectId, currentMembers = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState('DEVELOPER');
    const addToast = useUIStore((s) => s.addToast);

    const { data: orgMembers, isLoading: isLoadingOrg } = useOrganizationMembers(organizationId);
    const addMemberMutation = useAddProjectMember(organizationId, projectId);

    const currentMemberIds = useMemo(() => new Set(currentMembers.map(m => m.userId)), [currentMembers]);

    const availableMembers = useMemo(() => {
        if (!orgMembers) return [];
        return orgMembers.filter(m => {
            const isAlreadyIn = currentMemberIds.has(m.userId);
            const matchesSearch = (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase());
            return !isAlreadyIn && matchesSearch;
        });
    }, [orgMembers, currentMemberIds, searchQuery]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        addMemberMutation.mutate(
            { email: selectedUser.email, role },
            {
                onSuccess: () => {
                    addToast(`Added ${selectedUser.displayName || selectedUser.email} to project`, 'success');
                    setSelectedUser(null);
                    setSearchQuery('');
                    onClose();
                },
                onError: (err) => {
                    addToast(err.response?.data?.message || 'Failed to add member to project', 'error');
                }
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Member from Organization"
            icon={<HiOutlineUserAdd className="text-brand-500" />}
        >
            <div className="p-6 pt-0 space-y-6">
                <div className="space-y-4">
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            className="input pl-10 w-full"
                            placeholder="Search organization directory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-border-subtle rounded-xl divide-y divide-border-subtle bg-bg-base/30">
                        {isLoadingOrg ? (
                            <div className="p-4 text-center text-text-muted text-sm italic">Loading members...</div>
                        ) : availableMembers.length > 0 ? (
                            availableMembers.map(member => (
                                <div
                                    key={member.userId}
                                    onClick={() => setSelectedUser(member)}
                                    className={clsx(
                                        "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                                        selectedUser?.userId === member.userId ? "bg-brand-500/10" : "hover:bg-bg-raised/60"
                                    )}
                                >
                                    <img
                                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || member.email)}&background=random`}
                                        className="w-8 h-8 rounded-full border border-border-subtle"
                                        alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-text-primary truncate">{member.displayName || 'Unknown'}</div>
                                        <div className="text-xs text-text-muted truncate">{member.email}</div>
                                    </div>
                                    {selectedUser?.userId === member.userId && (
                                        <HiOutlineCheck className="text-brand-500 w-5 h-5 shrink-0" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-text-muted italic">
                                    {searchQuery ? "No matching members found" : "No other organization members available"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleAdd} className="space-y-4 border-t border-border-subtle pt-6">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">Assign Project Role</label>
                        <select
                            className="input w-full bg-bg-base"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={!selectedUser}
                        >
                            <option value="PROJECT_ADMIN">Project Admin</option>
                            <option value="SCRUM_MASTER">Scrum Master</option>
                            <option value="TEAM_LEAD">Team Lead</option>
                            <option value="DEVELOPER">Developer</option>
                            <option value="QA">QA</option>
                            <option value="VIEWER">Viewer</option>
                            <option value="REPORTER">Reporter</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary min-w-[120px]"
                            disabled={!selectedUser || addMemberMutation.isPending}
                        >
                            {addMemberMutation.isPending ? <div className="spinner spinner-sm" /> : 'Add to Project'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
