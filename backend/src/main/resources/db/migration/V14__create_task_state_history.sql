-- Task State History for Analytics
CREATE TABLE task_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    state_id UUID NOT NULL REFERENCES workflow_states(id),
    changed_by_id UUID REFERENCES users(id),
    entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exited_at TIMESTAMP,
    duration BIGINT, -- Duration in seconds
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_task ON task_state_history(task_id);
CREATE INDEX idx_history_project ON task_state_history(project_id);
CREATE INDEX idx_history_workspace ON task_state_history(workspace_id);
CREATE INDEX idx_history_state ON task_state_history(state_id);
CREATE INDEX idx_history_entered ON task_state_history(entered_at);
