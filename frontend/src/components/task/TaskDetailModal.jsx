import { useEffect } from 'react';
import TaskDetailView from './detail/TaskDetailView';

export default function TaskDetailModal({ taskId, projectId, onClose, userRole }) {
    // Esc key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="slide-over" style={{ zIndex: 3000 }}> {/* Higher z-index than standard modals */}
            <div className="slide-over-overlay" onClick={onClose} />
            <div
                className="slide-over-content"
                style={{
                    width: '900px',
                    maxWidth: '95vw',
                    borderLeft: '1px solid var(--border-subtle)'
                }}
            >
                <TaskDetailView
                    taskId={taskId}
                    projectId={projectId}
                    onClose={onClose}
                    userRole={userRole}
                />
            </div>
        </div>
    );
}
