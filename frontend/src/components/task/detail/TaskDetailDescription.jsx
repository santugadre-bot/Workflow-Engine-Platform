import { useState, useRef, useEffect } from 'react';
import { useUpdateTask } from '../../../api/tasks';
import useUIStore from '../../../store/uiStore';
import { canEditTask } from '../../../utils/permissions';
import { useAuth } from '../../../context/AuthContext';

export default function TaskDetailDescription({ task, projectId, userRole }) {
    const { user } = useAuth();
    const isCreator = user && (task.creatorId === user.id || task.creatorId === user.userId);
    const canEdit = canEditTask(userRole) || isCreator;

    const [description, setDescription] = useState(task.description || '');
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef(null);
    const addToast = useUIStore((s) => s.addToast);
    const updateMutation = useUpdateTask(projectId, task.id);

    useEffect(() => {
        setDescription(task.description || '');
    }, [task.description]);

    const handleSave = () => {
        if (description === (task.description || '')) {
            setIsEditing(false);
            return;
        }

        updateMutation.mutate({ description }, {
            onSuccess: () => {
                setIsEditing(false);
                addToast('Description updated', 'success');
            },
            onError: () => addToast('Failed to update description', 'error')
        });
    };

    const handleCancel = () => {
        setDescription(task.description || '');
        setIsEditing(false);
    };

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [description, isEditing]);

    if (isEditing) {
        return (
            <div className="mb-8">
                <label className="text-xs font-bold text-muted uppercase mb-2 block tracking-wider">Description</label>
                <div className="bg-bg-raised border border-accent rounded-lg p-2">
                    <textarea
                        ref={textareaRef}
                        className="w-full bg-transparent border-none focus:ring-0 p-2 min-h-[120px] resize-none leading-relaxed"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a more detailed description..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border-muted">
                        <button className="btn btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 group">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                {canEdit && (
                    <button
                        className="text-xs text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </button>
                )}
            </div>

            <div
                className={`prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed p-2 -ml-2 rounded ${canEdit ? 'hover:bg-bg-hover/30 cursor-pointer transition-colors' : ''}`}
                onClick={() => canEdit && setIsEditing(true)}
            >
                {description ? (
                    <div className="whitespace-pre-wrap">{description}</div>
                ) : (
                    <span className="text-text-muted italic">No description provided. Click to add one.</span>
                )}
            </div>
        </div>
    );
}
