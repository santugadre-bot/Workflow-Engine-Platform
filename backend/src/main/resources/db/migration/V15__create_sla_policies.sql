-- SLA Policies
CREATE TABLE sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    state_id UUID REFERENCES workflow_states(id), -- Null means "Any State" (though usually specific)
    priority VARCHAR(20), -- Null means "Any Priority"
    duration_hours INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- NOTIFY_ASSIGNEE, NOTIFY_MANAGER, ESCALATE
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sla_project ON sla_policies(project_id);
CREATE INDEX idx_sla_workspace ON sla_policies(workspace_id);
