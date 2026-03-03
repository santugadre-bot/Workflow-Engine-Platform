import { useState } from 'react';
import { HiOutlineExclamationCircle, HiOutlineUserRemove, HiOutlineOfficeBuilding } from 'react-icons/hi';
import clsx from 'clsx';
import useUIStore from '../../store/uiStore';

export default function RemoveMemberModal({
    isOpen,
    onClose,
    member,
    allMembers = [],
    onConfirmRemove
}) {
    const addToast = useUIStore((s) => s.addToast);
    const [reassignTo, setReassignTo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !member) return null;

    const hasTasks = member.assignedTaskCount > 0;
    const eligibleAssignees = allMembers.filter(m => m.userId !== member.userId);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirmRemove(member.userId, reassignTo || null);
            onClose();
            // Reset state
            setReassignTo('');
        } catch (error) {
            console.error('Failed to remove member:', error);
            addToast('Failed to remove member or reassign tasks', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={!isSubmitting ? onClose : undefined}>
            <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header border-b-0 pb-0">
                    <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                        <HiOutlineUserRemove className="w-6 h-6 text-danger" />
                    </div>
                </div>

                <div className="px-6 py-2">
                    <h2 className="text-xl font-bold text-text-primary mb-2">Remove {member.name}?</h2>
                    <p className="text-sm text-text-secondary">
                        This action will remove the user from the project and immediately revoke their access.
                    </p>
                </div>

                {hasTasks && (
                    <div className="mx-6 my-4 bg-warning/10 border border-warning/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <HiOutlineExclamationCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-warning-strong">Action Required: Active Tasks</h4>
                                <p className="text-xs text-text-secondary mt-1">
                                    {member.name} is currently assigned to <strong className="text-text-primary">{member.assignedTaskCount} active tasks</strong>.
                                    You can reassign them now or leave them unassigned.
                                </p>

                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                                        Reassign Tasks To
                                    </label>
                                    <select
                                        className="input w-full bg-bg-base"
                                        value={reassignTo}
                                        onChange={(e) => setReassignTo(e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Leave Unassigned (Move to Backlog)</option>
                                        {eligibleAssignees.map(a => (
                                            <option key={a.userId} value={a.userId}>
                                                {a.name || a.email} ({a.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!hasTasks && (
                    <div className="mx-6 my-4 bg-bg-raised border border-border-subtle rounded-xl p-4 flex items-center gap-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-success shrink-0" />
                        <p className="text-sm text-text-secondary">
                            Good news! This user has <strong className="text-text-primary">0 active tasks</strong>, so removal is safe and requires no reassignment.
                        </p>
                    </div>
                )}

                <div className="p-6 pt-4 flex items-center justify-end gap-3 border-t border-border-subtle bg-bg-raised rounded-b-xl mt-4">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn btn-primary bg-danger text-white border-transparent hover:bg-danger-hover"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <span className="spinner spinner-sm" /> : `Yes, Remove ${member.name.split(' ')[0]}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
