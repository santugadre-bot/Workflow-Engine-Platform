-- Refactor generic 'workspace' to specific 'organization'
ALTER TABLE workspaces RENAME TO organizations;

-- Rename foreign key constraints if they exist (Postgres usually handles table rename but constraint names remain old)
-- We will rename columns first
ALTER TABLE projects RENAME COLUMN workspace_id TO organization_id;

-- Rename workspace_members and its columns
ALTER TABLE workspace_members RENAME TO organization_members;
ALTER TABLE organization_members RENAME COLUMN workspace_id TO organization_id;

-- Update notifications
ALTER TABLE notifications RENAME COLUMN workspace_id TO organization_id;

-- Update approval_requests
ALTER TABLE approval_requests RENAME COLUMN workspace_id TO organization_id;

-- Update sla_policies
ALTER TABLE sla_policies RENAME COLUMN workspace_id TO organization_id;

-- Update task_state_history
ALTER TABLE task_state_history RENAME COLUMN workspace_id TO organization_id;

-- Update users
ALTER TABLE users ADD COLUMN system_role VARCHAR(255) NOT NULL DEFAULT 'USER';

-- Create project_members
CREATE TABLE project_members (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Index for project members
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
