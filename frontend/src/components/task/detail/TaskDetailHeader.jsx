import { useState, useEffect } from 'react';
import { HiOutlineShare, HiOutlineTrash, HiX, HiCheck, HiOutlineLink } from 'react-icons/hi';
import { useUpdateTask, useDeleteTask } from '../../../api/tasks';
import useUIStore from '../../../store/uiStore';
import { canEditTask, canDeleteIssue } from '../../../utils/permissions';
import { useAuth } from '../../../context/AuthContext';

export default function TaskDetailHeader({ task, projectId, onClose, userRole }) {
    const { user } = useAuth();
    const isCreator = user && (task.creatorId === user.id || task.creatorId === user.userId);
    const canEdit = canEditTask(userRole) || isCreator;

    const [title, setTitle] = useState(task.title);
    const [isEditing, setIsEditing] = useState(false);
    const addToast = useUIStore((s) => s.addToast);

    const updateMutation = useUpdateTask(projectId, task.id);
    const deleteMutation = useDeleteTask(projectId);

    useEffect(() => {
        setTitle(task.title);
    }, [task.title]);

    const handleTitleSave = () => {
        if (!title.trim() || title === task.title) {
            setIsEditing(false);
            return;
        }
        updateMutation.mutate({ title }, {
            onSuccess: () => {
                setIsEditing(false);
                addToast('Task renamed', 'success');
            },
            onError: () => addToast('Failed to rename task', 'error')
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setTitle(task.title);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Delete this task? This cannot be undone.')) {
            deleteMutation.mutate(task.id, {
                onSuccess: () => {
                    onClose();
                    addToast('Task deleted', 'success');
                }
            });
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast('Link copied to clipboard', 'success');
    };

    return (
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 mb-6">
            {/* Top Row: Breadcrumbs & Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="font-mono text-xs bg-bg-base px-2 py-1 rounded border border-border-subtle">
                        TASK-{task.id.slice(0, 8)}
                    </span>
                    <span className="text-border-muted">/</span>
                    <span className="truncate max-w-[200px]">{task.project?.name || 'Project'}</span>
                </div>

                <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={handleCopyLink} title="Copy Link">
                        <HiOutlineLink />
                    </button>
                    {canDeleteIssue(userRole) && (
                        <button className="btn btn-ghost btn-sm btn-icon text-text-muted hover:text-danger" onClick={handleDelete} title="Delete Task">
                            <HiOutlineTrash />
                        </button>
                    )}
                    <div className="w-px h-4 bg-border-subtle mx-2" />
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
                        <HiX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Title Row */}
            <div className="group">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            className="text-2xl font-bold bg-bg-base border border-accent rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-accent/20"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                ) : (
                    <h1
                        onClick={() => canEdit && setIsEditing(true)}
                        className={`text-2xl font-bold text-text-primary leading-tight ${canEdit ? 'cursor-text hover:bg-bg-hover/50 -mx-2 px-2 rounded transition-colors' : ''}`}
                    >
                        {task.title}
                    </h1>
                )}
            </div>
        </div>
    );
}
