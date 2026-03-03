import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineShieldCheck, HiOutlineCheck, HiOutlineX, HiChevronRight,
    HiOutlineClock, HiOutlineSearch, HiOutlineFilter, HiOutlineCheckCircle,
    HiOutlineExclamationCircle, HiOutlineChevronDown, HiOutlineSwitchHorizontal,
    HiOutlineSelector, HiOutlineLockClosed,
} from 'react-icons/hi';
import { formatDistanceToNow, differenceInHours, isThisWeek } from 'date-fns';
import {
    usePendingApprovals, useApprovalHistory,
    useProcessApproval, useBulkProcessApprovals,
} from '../../api/approvals';
import { useOrganizationMembers } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import useUIStore from '../../store/uiStore';


// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUrgency(createdAt) {
    const hours = differenceInHours(new Date(), new Date(createdAt));
    if (hours < 1) return { label: '< 1h', color: 'text-emerald-600 bg-emerald-500/10' };
    if (hours < 24) return { label: `${hours}h`, color: 'text-amber-600 bg-amber-500/10' };
    return { label: `${Math.floor(hours / 24)}d`, color: 'text-red-600 bg-red-500/10' };
}

function AvatarInitials({ initials, size = 'md' }) {
    const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    return (
        <div className={`${sz} rounded-full bg-brand-500/15 text-brand-600 font-bold flex items-center justify-center shrink-0 select-none`}>
            {initials || '?'}
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        APPROVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-red-500/10 text-red-700 border-red-200',
        PENDING: 'bg-amber-500/10 text-amber-700 border-amber-200',
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || map.PENDING}`}>
            {status === 'APPROVED' ? '✅ Approved' : status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}
        </span>
    );
}

// ─── Comment Modal ────────────────────────────────────────────────────────────

function CommentModal({ action, targets, onConfirm, onClose }) {
    const [comment, setComment] = useState('');
    const isReject = action === 'REJECTED';
    const isBulk = targets.length > 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-bg-raised rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReject ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        {isReject
                            ? <HiOutlineX className="w-5 h-5 text-red-600" />
                            : <HiOutlineCheck className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">
                            {isReject ? 'Reject' : 'Approve'}{isBulk ? ` ${targets.length} Requests` : ''}
                        </h3>
                        {!isBulk && targets[0] && (
                            <p className="text-xs text-text-muted truncate max-w-xs">{targets[0].taskTitle}</p>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {isReject ? 'Reason for rejection' : 'Comment'}
                        {!isReject && <span className="text-text-muted font-normal ml-1">(optional)</span>}
                    </label>
                    <textarea
                        className="input w-full resize-none"
                        rows={3}
                        placeholder={isReject ? 'Provide a reason so the requester can understand…' : 'Add a note (optional)…'}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Enter' && e.metaKey) onConfirm(comment);
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                    {isReject && !comment.trim() && (
                        <p className="text-xs text-amber-600 mt-1">A reason helps the requester improve their next submission.</p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
                    <button
                        className={`btn flex-1 justify-center ${isReject ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
                        onClick={() => onConfirm(comment)}
                    >
                        {isReject ? 'Confirm Reject' : 'Confirm Approve'}
                    </button>
                </div>
                <p className="text-center text-xs text-text-muted mt-2">⌘+Enter to confirm · Esc to cancel</p>
            </div>
        </div>
    );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function PendingCard({ req, organizationId, isSelected, onSelect, onAction, disabled }) {
    const urgency = getUrgency(req.createdAt);
    return (
        <div className={`bg-bg-raised rounded-xl border transition-all hover:shadow-md ${isSelected ? 'border-brand-500 shadow-sm shadow-brand-500/10' : 'border-border-subtle'}`}>
            {/* Top strip */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-0">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(req.id)}
                    className="accent-brand-500 w-3.5 h-3.5"
                />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.color}`}>
                    {urgency.label} ago
                </span>
                {req.projectName && (
                    <span className="text-xs bg-bg-overlay text-text-muted border border-border-subtle px-2 py-0.5 rounded-full">
                        {req.projectName}
                    </span>
                )}
            </div>

            <div className="p-4 pt-2 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Task title */}
                    <h3 className="font-bold text-text-primary truncate">
                        {req.taskTitle}
                    </h3>

                    {/* From → To state */}
                    {(req.fromStateName || req.toStateName) && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="bg-bg-overlay text-text-secondary border border-border-subtle px-2 py-0.5 rounded-md font-medium">
                                {req.fromStateName || '?'}
                            </span>
                            <HiChevronRight className="text-text-muted w-3.5 h-3.5 shrink-0" />
                            <span className="bg-brand-500/10 text-brand-600 border border-brand-500/20 px-2 py-0.5 rounded-md font-medium">
                                {req.toStateName || '?'}
                            </span>
                            <span className="text-text-muted">via <em>{req.transitionName}</em></span>
                        </div>
                    )}

                    {/* Requester */}
                    <div className="flex items-center gap-2">
                        <AvatarInitials initials={req.requesterInitials} size="sm" />
                        <span className="text-xs text-text-muted">
                            Requested by <span className="font-semibold text-text-secondary">{req.requesterName}</span>
                        </span>
                    </div>

                    {/* Reason */}
                    {req.comment && (
                        <p className="text-xs text-text-muted italic bg-bg-overlay rounded-lg px-3 py-1.5 border-l-2 border-border-strong">
                            "{req.comment}"
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    <button
                        className="btn btn-sm flex-1 md:flex-none bg-bg-base hover:bg-red-50 text-red-600 border border-border-subtle hover:border-red-200 gap-1.5 justify-center"
                        onClick={() => onAction([req], 'REJECTED')}
                        disabled={disabled}
                    >
                        <HiOutlineX className="w-4 h-4" /> Reject
                    </button>
                    <button
                        className="btn btn-sm btn-primary flex-1 md:flex-none gap-1.5 justify-center"
                        onClick={() => onAction([req], 'APPROVED')}
                        disabled={disabled}
                    >
                        <HiOutlineCheck className="w-4 h-4" /> Approve
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryCard({ req }) {
    const isApproved = req.status === 'APPROVED';
    return (
        <div className="bg-bg-raised rounded-xl border border-border-subtle px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <StatusBadge status={req.status} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{req.taskTitle}</p>
                {(req.fromStateName || req.toStateName) && (
                    <p className="text-xs text-text-muted">
                        {req.fromStateName} → {req.toStateName}
                        {req.projectName && <> · <span className="font-medium">{req.projectName}</span></>}
                    </p>
                )}
                {req.comment && (
                    <p className="text-xs text-text-muted italic mt-0.5">"{req.comment}"</p>
                )}
            </div>
            <div className="text-right shrink-0">
                <p className="text-xs text-text-muted">
                    by <span className="font-medium text-text-secondary">{req.approverName || 'Admin'}</span>
                </p>
                <p className="text-xs text-text-muted">
                    {req.processedAt ? formatDistanceToNow(new Date(req.processedAt), { addSuffix: true }) : ''}
                </p>
            </div>
        </div>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ pending, history }) {
    const approvedThisWeek = history?.filter(r => r.status === 'APPROVED' && r.processedAt && isThisWeek(new Date(r.processedAt))).length || 0;
    const rejectedThisWeek = history?.filter(r => r.status === 'REJECTED' && r.processedAt && isThisWeek(new Date(r.processedAt))).length || 0;

    const avgHours = useMemo(() => {
        const processed = (history || []).filter(r => r.createdAt && r.processedAt);
        if (!processed.length) return null;
        const avg = processed.reduce((sum, r) => sum + differenceInHours(new Date(r.processedAt), new Date(r.createdAt)), 0) / processed.length;
        return avg < 1 ? '< 1h' : avg < 24 ? `${Math.round(avg)}h` : `${(avg / 24).toFixed(1)}d`;
    }, [history]);

    const tiles = [
        { label: 'Pending', value: pending?.length ?? 0, icon: '⏳', color: 'text-amber-600' },
        { label: 'Approved This Week', value: approvedThisWeek, icon: '✅', color: 'text-emerald-600' },
        { label: 'Rejected This Week', value: rejectedThisWeek, icon: '❌', color: 'text-red-600' },
        { label: 'Avg Response', value: avgHours ?? '—', icon: '⏱️', color: 'text-text-secondary' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {tiles.map(t => (
                <div key={t.label} className="bg-bg-raised border border-border-subtle rounded-xl px-4 py-3">
                    <p className="text-xs text-text-muted mb-0.5">{t.label}</p>
                    <p className={`text-xl font-bold ${t.color}`}>{t.icon} {t.value}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApprovalCenter({ organizationId }) {
    const addToast = useUIStore(s => s.addToast);
    const { user } = useAuth();
    const [tab, setTab] = useState('pending');
    const [search, setSearch] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [sortOrder, setSortOrder] = useState('oldest');
    const [selected, setSelected] = useState([]);
    const [modal, setModal] = useState(null);

    // Derive the current user's org role to show read-only banner for MEMBER
    const { data: members } = useOrganizationMembers(organizationId);
    const userId = user?.userId || user?.id;
    const myOrgRole = members?.find(m => m.userId === userId)?.role;
    const isReadOnly = myOrgRole === 'MEMBER' || (!myOrgRole && myOrgRole !== 'ADMIN' && myOrgRole !== 'OWNER');

    const { data: approvals, isLoading } = usePendingApprovals(organizationId);
    const { data: history, isLoading: historyLoading } = useApprovalHistory(organizationId);
    const processMutation = useProcessApproval(organizationId);
    const bulkMutation = useBulkProcessApprovals(organizationId);

    // All unique project names for filter dropdown
    const projectOptions = useMemo(() => {
        const all = [...(approvals || []), ...(history || [])];
        return [...new Set(all.map(r => r.projectName).filter(Boolean))].sort();
    }, [approvals, history]);

    // Filtered + sorted pending list
    const filteredPending = useMemo(() => {
        let list = approvals || [];
        if (search) list = list.filter(r =>
            r.taskTitle?.toLowerCase().includes(search.toLowerCase()) ||
            r.requesterName?.toLowerCase().includes(search.toLowerCase())
        );
        if (filterProject) list = list.filter(r => r.projectName === filterProject);
        list = [...list].sort((a, b) => {
            if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            return (a.projectName || '').localeCompare(b.projectName || '');
        });
        return list;
    }, [approvals, search, filterProject, sortOrder]);

    const filteredHistory = useMemo(() => {
        let list = history || [];
        if (search) list = list.filter(r =>
            r.taskTitle?.toLowerCase().includes(search.toLowerCase()) ||
            r.requesterName?.toLowerCase().includes(search.toLowerCase())
        );
        if (filterProject) list = list.filter(r => r.projectName === filterProject);
        return list;
    }, [history, search, filterProject]);

    const allSelected = selected.length === filteredPending.length && filteredPending.length > 0;

    const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(allSelected ? [] : filteredPending.map(r => r.id));

    const openModal = (targets, action) => setModal({ targets, action });

    const handleActionConfirm = async (comment) => {
        const { targets, action } = modal;
        setModal(null);
        const isBulk = targets.length > 1;

        try {
            if (isBulk) {
                await bulkMutation.mutateAsync({ requestIds: targets.map(t => t.id), status: action, comment });
                addToast(`${targets.length} requests ${action.toLowerCase()}`, 'success');
                setSelected([]);
            } else {
                await processMutation.mutateAsync({ requestId: targets[0].id, status: action, comment });
                addToast(`Request ${action.toLowerCase()}`, 'success');
            }
        } catch {
            addToast('Failed to process request', 'error');
        }
    };

    const selectedApprovals = filteredPending.filter(r => selected.includes(r.id));

    if (isLoading) {
        return <div className="flex justify-center p-12"><div className="spinner spinner-lg" /></div>;
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Read-only banner for non-admin viewers */}
            {isReadOnly && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <HiOutlineLockClosed className="w-4 h-4 shrink-0 text-amber-500" />
                    <div>
                        <span className="font-semibold">View-only mode — </span>
                        you can monitor pending and processed approvals but only Admins and Owners can approve or reject requests.
                    </div>
                </div>
            )}

            {/* Stats */}
            <StatsBar pending={approvals} history={history} />

            {/* Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-1 bg-bg-overlay rounded-xl p-1 border border-border-subtle">
                    {[
                        { key: 'pending', label: `Pending`, count: approvals?.length },
                        { key: 'history', label: 'History', count: history?.length },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.key ? 'bg-bg-raised text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            {t.label}
                            {t.count != null && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-brand-500/10 text-brand-600' : 'bg-bg-raised text-text-muted'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search + filter toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search task or requester…"
                            className="input pl-8 py-1.5 text-sm h-8 w-48"
                        />
                    </div>

                    {projectOptions.length > 0 && (
                        <select
                            value={filterProject}
                            onChange={e => setFilterProject(e.target.value)}
                            className="input py-1.5 text-sm h-8 pr-7"
                        >
                            <option value="">All Projects</option>
                            {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    )}

                    {tab === 'pending' && (
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="input py-1.5 text-sm h-8 pr-7"
                        >
                            <option value="oldest">Oldest First</option>
                            <option value="newest">Newest First</option>
                            <option value="project">Project A–Z</option>
                        </select>
                    )}
                </div>
            </div>

            {/* ── Pending Tab ────────────────── */}
            {tab === 'pending' && (
                <div className="space-y-3">
                    {/* Select-all + bulk bar */}
                    {filteredPending.length > 0 && (
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="accent-brand-500"
                                />
                                {allSelected ? 'Deselect All' : `Select All (${filteredPending.length})`}
                            </label>

                            {selected.length > 0 && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                                    <span className="text-xs text-text-muted font-medium">{selected.length} selected</span>
                                    <button
                                        className="btn btn-sm bg-bg-base hover:bg-red-50 text-red-600 border border-border-subtle hover:border-red-200 gap-1.5"
                                        onClick={() => openModal(selectedApprovals, 'REJECTED')}
                                        disabled={bulkMutation.isPending}
                                    >
                                        <HiOutlineX className="w-3.5 h-3.5" /> Reject ({selected.length})
                                    </button>
                                    <button
                                        className="btn btn-sm btn-primary gap-1.5"
                                        onClick={() => openModal(selectedApprovals, 'APPROVED')}
                                        disabled={bulkMutation.isPending}
                                    >
                                        <HiOutlineCheck className="w-3.5 h-3.5" /> Approve ({selected.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {filteredPending.length === 0 ? (
                        <div className="bg-bg-overlay rounded-xl border border-dashed border-border-subtle p-12 text-center">
                            <div className="w-16 h-16 bg-bg-raised rounded-full flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                                <HiOutlineShieldCheck className="text-3xl text-text-muted" />
                            </div>
                            <p className="text-base font-semibold text-text-primary">All caught up!</p>
                            <p className="text-sm text-text-muted mt-1">
                                {search || filterProject ? 'No requests match your filters.' : 'No pending approval requests.'}
                            </p>
                        </div>
                    ) : (
                        filteredPending.map(req => (
                            <PendingCard
                                key={req.id}
                                req={req}
                                organizationId={organizationId}
                                isSelected={selected.includes(req.id)}
                                onSelect={toggleSelect}
                                onAction={openModal}
                                disabled={processMutation.isPending || bulkMutation.isPending}
                            />
                        ))
                    )}
                </div>
            )}

            {/* ── History Tab ────────────────── */}
            {tab === 'history' && (
                <div className="space-y-2">
                    {historyLoading ? (
                        <div className="flex justify-center py-8"><div className="spinner" /></div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-bg-overlay rounded-xl border border-dashed border-border-subtle p-12 text-center">
                            <p className="text-sm text-text-muted">No processed requests yet.</p>
                        </div>
                    ) : (
                        filteredHistory.map(req => <HistoryCard key={req.id} req={req} />)
                    )}
                </div>
            )}

            {/* Info banner */}
            <div className="mt-6 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 flex gap-3 items-start">
                <div className="p-2 bg-brand-500/10 rounded-lg shrink-0">
                    <HiOutlineShieldCheck className="text-brand-600 w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-text-primary mb-0.5">Enterprise Governance</p>
                    <p className="text-xs text-text-muted leading-relaxed">
                        Enable approvals on any transition via the Workflow Builder.
                        Use them for sensitive moves like <strong>Production Release</strong> or <strong>Budget Approval</strong>.
                    </p>
                </div>
            </div>

            {/* Comment Modal */}
            {modal && (
                <CommentModal
                    action={modal.action}
                    targets={modal.targets}
                    onConfirm={handleActionConfirm}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
