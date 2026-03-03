import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiOutlineClipboardList, HiOutlineUser, HiOutlineCog, HiOutlineLightningBolt, HiOutlineFolder } from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { auditApi } from '../api';

const ACTION_ICONS = {
    TASK_CREATED: <HiOutlineClipboardList />,
    TASK_TRANSITIONED: <HiOutlineLightningBolt />,
    TASK_UPDATED: <HiOutlineCog />,
    COMMENT_ADDED: <HiOutlineClipboardList />,
    WORKSPACE_CREATED: <HiOutlineFolder />, // Legacy support for old logs
    ORGANIZATION_CREATED: <HiOutlineFolder />,
    PROJECT_CREATED: <HiOutlineFolder />,
    WORKFLOW_CREATED: <HiOutlineLightningBolt />,
    MEMBER_ADDED: <HiOutlineUser />,
};

export default function ActivityLogPage() {
    const { organizationId } = useParams();
    const [page, setPage] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['activity', organizationId, page],
        queryFn: () => auditApi.getActivity(organizationId, page, 20),
    });

    const activities = data?.content || [];
    const totalPages = data?.totalPages || 0;

    return (
        <AppLayout title="Activity Log">
            {isLoading ? (
                <div className="loading-center"><div className="spinner spinner-lg" /></div>
            ) : activities.length === 0 ? (
                <div className="empty-state">
                    <div className="icon"><HiOutlineClipboardList /></div>
                    <h3>No activity yet</h3>
                    <p>Activity will appear here as you work on your projects</p>
                </div>
            ) : (
                <>
                    <div className="activity-list">
                        {activities.map((item) => (
                            <div key={item.id} className="activity-item">
                                <div className="activity-icon">
                                    {ACTION_ICONS[item.actionType] || <HiOutlineCog />}
                                </div>
                                <div className="activity-body">
                                    <div className="activity-action">
                                        <strong>{item.userName}</strong>{' '}
                                        {formatAction(item.actionType, item.entityType)}
                                    </div>
                                    <div className="activity-time">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4" style={{ padding: 'var(--sp-4) 0' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                            >
                                Previous
                            </button>
                            <span className="text-sm text-muted">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}

function formatAction(actionType, entityType) {
    const actions = {
        TASK_CREATED: 'created a task',
        TASK_TRANSITIONED: 'moved a task',
        TASK_UPDATED: 'updated a task',
        COMMENT_ADDED: 'added a comment',
        WORKSPACE_CREATED: 'created the organization',
        ORGANIZATION_CREATED: 'created the organization',
        PROJECT_CREATED: 'created a project',
        WORKFLOW_CREATED: 'created a workflow',
        WORKFLOW_ACTIVATED: 'activated a workflow',
        MEMBER_ADDED: 'added a member',
    };
    return actions[actionType] || `performed ${actionType} on ${entityType}`;
}
