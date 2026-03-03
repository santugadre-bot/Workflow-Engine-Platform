import { useState, useEffect, useRef } from 'react';
import { useUpdateTask } from '../../api/tasks';
import useUIStore from '../../store/uiStore';
import { canEditIssue } from '../../utils/permissions';

export default function InlineStoryPoints({ taskId, projectId, initialPoints, userRole }) {
    const [isEditing, setIsEditing] = useState(false);
    const [points, setPoints] = useState(initialPoints || '');
    const inputRef = useRef(null);
    const addToast = useUIStore((s) => s.addToast);
    const updateMutation = useUpdateTask(projectId, taskId);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const numericPoints = points === '' ? null : parseInt(points);
        if (numericPoints === initialPoints) {
            setIsEditing(false);
            return;
        }

        updateMutation.mutate({ storyPoints: numericPoints }, {
            onSuccess: () => {
                setIsEditing(false);
                addToast('Points updated', 'success');
            },
            onError: () => {
                setPoints(initialPoints || '');
                setIsEditing(false);
                addToast('Failed to update points', 'error');
            }
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setPoints(initialPoints || '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="number"
                className="w-10 h-6 text-[10px] font-black text-center border-2 border-primary rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <button
            onClick={(e) => {
                if (!canEditIssue(userRole)) return;
                e.stopPropagation();
                setIsEditing(true);
            }}
            className={`w-10 h-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-all border ${points
                ? 'bg-slate-900 text-white border-slate-900 group-hover:bg-primary group-hover:border-primary'
                : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-slate-400 hover:text-slate-500'
                } ${!canEditIssue(userRole) ? 'cursor-default' : 'cursor-pointer'}`}
            title={canEditIssue(userRole) ? "Edit Story Points" : "Story Points (Read-only)"}
        >
            {points || '--'}
        </button>
    );
}
