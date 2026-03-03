import { useState } from 'react';
import { useTaskComments, useTaskHistory, useAddComment } from '../../../api/tasks';
import useUIStore from '../../../store/uiStore';
import { canAddComment } from '../../../utils/permissions';
import { HiOutlineChatAlt, HiOutlineClock, HiOutlinePaperAirplane } from 'react-icons/hi';
import MentionInput from '../MentionInput';

export default function TaskDetailActivity({ taskId, userRole, members = [] }) {
    const [activeTab, setActiveTab] = useState('comments');
    const [comment, setComment] = useState('');
    const addToast = useUIStore((s) => s.addToast);

    const { data: comments, isLoading: commentsLoading } = useTaskComments(taskId);
    const { data: history, isLoading: historyLoading } = useTaskHistory(taskId);
    const addCommentMutation = useAddComment(taskId);

    const handlePostComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        addCommentMutation.mutate({ content: comment }, {
            onSuccess: () => {
                setComment('');
                addToast('Comment posted', 'success');
            },
            onError: () => addToast('Failed to post comment', 'error')
        });
    };

    return (
        <div className="mt-8 border-t border-border-subtle pt-6">
            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-border-muted">
                <button
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'comments' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                    onClick={() => setActiveTab('comments')}
                >
                    <div className="flex items-center gap-2">
                        <HiOutlineChatAlt /> Comments ({comments?.length || 0})
                    </div>
                </button>
                <button
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                    onClick={() => setActiveTab('history')}
                >
                    <div className="flex items-center gap-2">
                        <HiOutlineClock /> History
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
                {activeTab === 'comments' && (
                    <div className="space-y-6">
                        {/* Comment Input */}
                        {canAddComment(userRole) && (
                            <form onSubmit={handlePostComment} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    ME
                                </div>
                                <div className="flex-1 relative">
                                    <MentionInput
                                        value={comment}
                                        onChange={setComment}
                                        members={members}
                                        placeholder="Write a comment... use @ to mention teammates"
                                        className="w-full bg-bg-raised border border-border-muted rounded-lg p-3 text-sm focus:ring-2 focus:ring-accent/20 resize-none min-h-[80px]"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handlePostComment(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute bottom-3 right-3 btn btn-primary btn-sm btn-icon"
                                        disabled={!comment.trim() || addCommentMutation.isPending}
                                        title="Post Comment"
                                    >
                                        <HiOutlinePaperAirplane className="rotate-90" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Comment List */}
                        <div className="space-y-6 pl-11"> {/* Indent to align with input avatar logic implicitly */}
                            {commentsLoading ? (
                                <div className="text-center py-4"><div className="spinner" /></div>
                            ) : comments?.length === 0 ? (
                                <p className="text-sm text-text-muted italic">No comments yet.</p>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="group relative">
                                        <div className="absolute -left-11 top-0 w-8 h-8 rounded-full bg-bg-overlay border border-border-subtle flex items-center justify-center text-xs text-text-secondary font-bold">
                                            {(c.userName || 'U')[0]}
                                        </div>
                                        <div className="bg-bg-raised/50 border border-border-subtle rounded-lg p-3 hover:border-border-muted transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-text-primary">{c.userName}</span>
                                                <span className="text-xs text-text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                                                {c.content.split(/(@\w+)/g).map((part, i) =>
                                                    part.startsWith('@')
                                                        ? <span key={i} className="text-primary font-semibold">{part}</span>
                                                        : part
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="relative pl-4 border-l-2 border-border-subtle space-y-6 ml-2">
                        {historyLoading ? (
                            <div className="text-center py-4"><div className="spinner" /></div>
                        ) : history?.length === 0 ? (
                            <p className="text-sm text-text-muted italic pl-4">No history yet.</p>
                        ) : (
                            history.map((h) => (
                                <div key={h.id} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-bg-base border-2 border-border-muted" />
                                    <div className="text-sm">
                                        <span className="font-semibold text-text-primary">{h.performedByName}</span>
                                        <span className="text-text-muted mx-1">
                                            {h.transitionName === 'Initial' ? 'created the task in' : `moved task from ${h.fromStateName} to`}
                                        </span>
                                        <span className="font-semibold text-accent">{h.toStateName}</span>
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5">
                                        {new Date(h.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
