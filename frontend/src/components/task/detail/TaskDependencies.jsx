import { useState } from 'react';
import { useTaskLinks, useCreateTaskLink, useDeleteTaskLink, useTasks } from '../../../api/tasks';
import { HiOutlineLink, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { canLinkIssue } from '../../../utils/permissions';

export default function TaskDependencies({ taskId, projectId, userRole }) {
    const { data: links = [], isLoading: linksLoading } = useTaskLinks(taskId);
    const { data: allTasks = [] } = useTasks(projectId);
    const createLink = useCreateTaskLink(taskId);
    const deleteLink = useDeleteTaskLink(taskId);

    const [isLinking, setIsLinking] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [linkType, setLinkType] = useState('BLOCKS');

    const canLink = canLinkIssue(userRole);

    const handleCreateLink = (e) => {
        e.preventDefault();
        if (!selectedTaskId) return;

        createLink.mutate({
            targetTaskId: selectedTaskId,
            linkType: linkType
        }, {
            onSuccess: () => {
                setIsLinking(false);
                setSelectedTaskId('');
            }
        });
    };

    if (linksLoading) return <div className="animate-pulse h-8 bg-muted/20 rounded mt-8" />;

    return (
        <div className="mt-10 border-t border-border/50 pt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <HiOutlineLink className="text-accent" /> Dependencies
                </h3>
                {canLink && !isLinking && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsLinking(true)}
                    >
                        <HiOutlinePlus /> Add Link
                    </button>
                )}
            </div>

            {isLinking && (
                <form onSubmit={handleCreateLink} className="flex items-center gap-3 mb-4 p-3 bg-muted/20 rounded-lg border border-border/50">
                    <select
                        className="input input-sm border-none bg-bg-base"
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value)}
                    >
                        <option value="BLOCKS">Blocks</option>
                        <option value="IS_BLOCKED_BY">Is Blocked By</option>
                        <option value="RELATES_TO">Relates To</option>
                        <option value="DUPLICATES">Duplicates</option>
                    </select>

                    <select
                        className="input input-sm border-none bg-bg-base flex-1"
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select a Task...</option>
                        {allTasks.filter(t => t.id !== taskId).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={createLink.isPending}
                        >
                            {createLink.isPending ? 'Linking...' : 'Link'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm text-text-muted"
                            onClick={() => setIsLinking(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {links.length === 0 && !isLinking ? (
                <p className="text-sm text-text-muted italic">No linked tasks.</p>
            ) : (
                <div className="space-y-2">
                    {links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 rounded bg-bg-base border border-border/50 hover:border-accent/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${link.linkType === 'BLOCKS' ? 'bg-danger/10 text-danger' :
                                    link.linkType === 'IS_BLOCKED_BY' ? 'bg-warning/10 text-warning' :
                                        'bg-muted/10 text-text-muted'
                                    }`}>
                                    {link.linkType.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium truncate max-w-[300px]" title={link.targetTaskTitle}>
                                    {link.targetTaskTitle}
                                </span>
                                <span className="text-xs text-text-muted badge badge-outline whitespace-nowrap">
                                    {link.targetTaskState}
                                </span>
                            </div>

                            {canLink && (
                                <button
                                    className="btn btn-ghost btn-icon text-text-muted hover:text-danger hover:bg-danger/10 p-1 h-auto min-h-0"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to remove this link?')) {
                                            deleteLink.mutate(link.targetTaskId);
                                        }
                                    }}
                                    disabled={deleteLink.isPending}
                                    title="Unlink"
                                >
                                    <HiOutlineTrash size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
