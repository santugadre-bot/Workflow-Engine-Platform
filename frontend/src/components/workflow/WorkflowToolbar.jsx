import { HiPlus, HiOutlineCheck, HiOutlineCog, HiOutlineTemplate } from 'react-icons/hi';

export default function WorkflowToolbar({
    workflow,
    onAddState,
    onValidate,
    onSettings,
    onAutoLayout,
    canEdit = false
}) {
    const stateCount = workflow?.states?.length || 0;
    const transitionCount = workflow?.transitions?.length || 0;
    const isActive = workflow?.active;

    return (
        <div className="workflow-toolbar">
            <div className="toolbar-section">
                <div className="workflow-stats">
                    <span className="stat-badge">
                        <strong>{stateCount}</strong> States
                    </span>
                    <span className="stat-badge">
                        <strong>{transitionCount}</strong> Transitions
                    </span>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`}>
                        {isActive ? 'Active' : 'Draft'}
                    </span>
                </div>
            </div>

            <div className="toolbar-section">
                {canEdit && (
                    <>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={onAddState}
                            disabled={isActive}
                        >
                            <HiPlus /> Add State
                        </button>

                        {stateCount >= 2 && !isActive && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={onAutoLayout}
                                title="Auto-arrange all states into a tidy layout"
                            >
                                <HiOutlineTemplate /> Auto Layout
                            </button>
                        )}

                        {!isActive && stateCount >= 2 && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={onValidate}
                            >
                                <HiOutlineCheck /> Validate & Activate
                            </button>
                        )}

                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onSettings}
                        >
                            <HiOutlineCog />
                        </button>
                    </>
                )}

                {/* Settings available even for read-only/active workflows for admins */}
                {!canEdit && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onSettings}
                        title="Workflow settings"
                    >
                        <HiOutlineCog />
                    </button>
                )}
            </div>
        </div>
    );
}
