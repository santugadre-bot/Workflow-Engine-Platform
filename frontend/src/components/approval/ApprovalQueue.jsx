import { useState } from 'react';
import { HiCheck, HiX, HiOutlineClipboardCheck, HiOutlineClock } from 'react-icons/hi';
import { differenceInHours } from 'date-fns';
import { usePendingApprovals, useProcessApproval } from '../../api/approvals';
import useUIStore from '../../store/uiStore';

function UrgencyDot({ createdAt }) {
    const hours = differenceInHours(new Date(), new Date(createdAt));
    const color = hours < 1 ? 'bg-emerald-500' : hours < 24 ? 'bg-amber-400' : 'bg-red-500';
    return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} title={`${hours < 24 ? hours + 'h' : Math.floor(hours / 24) + 'd'} ago`} />;
}

// Mini inline modal for widget context (simpler than the full CommentModal)
function MiniModal({ req, action, onConfirm, onClose }) {
    const [comment, setComment] = useState('');
    const isReject = action === 'REJECTED';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-bg-raised rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4">
                <h4 className="font-bold text-text-primary mb-1 text-sm">
                    {isReject ? '❌ Reject' : '✅ Approve'}: {req.taskTitle}
                </h4>
                <textarea
                    className="input w-full resize-none text-sm mt-3"
                    rows={2}
                    placeholder={isReject ? 'Reason (recommended)…' : 'Comment (optional)…'}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-2 mt-3">
                    <button className="btn btn-secondary btn-sm flex-1" onClick={onClose}>Cancel</button>
                    <button
                        className={`btn btn-sm flex-1 justify-center ${isReject ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
                        onClick={() => onConfirm(comment)}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ApprovalQueue({ organizationId }) {
    const { data: approvals, isLoading } = usePendingApprovals(organizationId);
    const processMutation = useProcessApproval(organizationId);
    const addToast = useUIStore(s => s.addToast);
    const [modal, setModal] = useState(null); // { req, action }

    const handleConfirm = (comment) => {
        const { req, action } = modal;
        setModal(null);
        processMutation.mutate({ requestId: req.id, status: action, comment }, {
            onSuccess: () => addToast(`Request ${action.toLowerCase()}d`, 'success'),
            onError: () => addToast('Failed to process request', 'error'),
        });
    };

    if (isLoading) return <div className="spinner m-4" />;

    if (!approvals?.length) return (
        <div className="p-8 text-center text-text-muted">
            <HiOutlineClipboardCheck className="mx-auto text-3xl mb-2 opacity-20" />
            <p className="text-sm">No pending approvals</p>
        </div>
    );

    return (
        <div className="space-y-2 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Pending Approvals ({approvals.length})
            </h3>
            {approvals.map(req => (
                <div
                    key={req.id}
                    className="rounded-xl border border-border-subtle bg-bg-raised px-3 py-2.5 flex items-center gap-3 group hover:border-border-strong transition-all"
                >
                    <UrgencyDot createdAt={req.createdAt} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{req.taskTitle}</p>
                        <p className="text-xs text-text-muted truncate">
                            {req.fromStateName && req.toStateName
                                ? `${req.fromStateName} → ${req.toStateName}`
                                : req.transitionName}
                            {req.projectName && <> · {req.projectName}</>}
                        </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="btn btn-ghost btn-sm btn-icon text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => setModal({ req, action: 'APPROVED' })}
                            title="Approve"
                            disabled={processMutation.isPending}
                        >
                            <HiCheck />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm btn-icon text-red-600 hover:bg-red-500/10"
                            onClick={() => setModal({ req, action: 'REJECTED' })}
                            title="Reject"
                            disabled={processMutation.isPending}
                        >
                            <HiX />
                        </button>
                    </div>
                </div>
            ))}

            {modal && (
                <MiniModal
                    req={modal.req}
                    action={modal.action}
                    onConfirm={handleConfirm}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
