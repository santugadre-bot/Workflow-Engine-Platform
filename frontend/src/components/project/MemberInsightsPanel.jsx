import { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineTicket, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

export default function MemberInsightsPanel({ isOpen, onClose, member }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    if (!member) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div
                className={clsx(
                    "fixed inset-y-0 right-0 w-full max-w-md bg-bg-base shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border-subtle",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-raised">
                    <h2 className="text-lg font-bold text-text-primary">Member Insights</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary rounded-full transition-colors outline-none"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Profile Section */}
                    <div className="p-6 border-b border-border-subtle">
                        <div className="flex items-start gap-4">
                            <img
                                src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email)}&background=random`}
                                alt={member.name}
                                className="w-16 h-16 rounded-2xl object-cover border border-border-subtle shadow-sm"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">{member.name}</h3>
                                <p className="text-sm text-text-muted">{member.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-600 border border-brand-500/20 capitalize">
                                        {member.role?.toLowerCase()}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            member.status === 'ONLINE' ? 'bg-success animate-pulse' :
                                                member.status === 'IDLE' ? 'bg-warning' : 'bg-border-strong'
                                        )} />
                                        <span className="capitalize">{member.status?.toLowerCase() || 'Offline'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-6 grid grid-cols-2 gap-4 border-b border-border-subtle bg-bg-overlay/20">
                        <div className="bg-bg-raised p-4 rounded-xl border border-border-subtle">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <HiOutlineTicket className="w-4 h-4" /> Active Tasks
                            </div>
                            <div className="text-2xl font-black text-text-primary">{member.assignedTaskCount || 0}</div>
                        </div>
                        <div className="bg-bg-raised p-4 rounded-xl border border-border-subtle">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <HiOutlineClock className="w-4 h-4" /> Workload
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "text-2xl font-black",
                                    member.workloadScore > 80 ? 'text-danger' :
                                        member.workloadScore > 50 ? 'text-warning' : 'text-brand-600'
                                )}>
                                    {Math.min(member.workloadScore || 0, 100)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Active Tasks List */}
                    <div className="p-6">
                        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                            <HiOutlineCheckCircle className="text-brand-500 w-5 h-5" />
                            Current Focus
                        </h4>

                        {member.activeTaskTitles && member.activeTaskTitles.length > 0 ? (
                            <ul className="space-y-3">
                                {member.activeTaskTitles.map((title, idx) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 bg-bg-raised border border-border-subtle rounded-lg hover:border-brand-500/30 transition-colors">
                                        <HiOutlineTicket className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
                                        <span className="text-sm text-text-primary font-medium line-clamp-2">{title}</span>
                                    </li>
                                ))}
                                {member.assignedTaskCount > member.activeTaskTitles.length && (
                                    <li className="text-center pt-2">
                                        <span className="text-xs font-bold text-text-muted hover:text-brand-500 cursor-pointer uppercase tracking-wider">
                                            + {member.assignedTaskCount - member.activeTaskTitles.length} more tasks
                                        </span>
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <div className="text-center py-8 bg-bg-raised rounded-xl border border-border-subtle border-dashed">
                                <p className="text-sm text-text-muted font-medium">No active tasks right now.</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="p-6 pt-0">
                        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                            <HiOutlineClock className="text-brand-500 w-5 h-5" />
                            Recent Activity
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Last Active</span>
                                <span className="font-medium text-text-primary">
                                    {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleString() : 'Never'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Last Task Completed</span>
                                <span className="font-medium text-text-primary">
                                    {member.lastTaskCompletedAt ? new Date(member.lastTaskCompletedAt).toLocaleString() : 'No tasks completed yet'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Joined Project</span>
                                <span className="font-medium text-text-primary">
                                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-subtle bg-bg-raised">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary w-full"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}
