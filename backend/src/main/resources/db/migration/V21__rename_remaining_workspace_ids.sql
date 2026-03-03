-- Rename missed workspace_id columns in tasks, workflows, and audit_log tables
ALTER TABLE tasks RENAME COLUMN workspace_id TO organization_id;
ALTER TABLE workflows RENAME COLUMN workspace_id TO organization_id;
ALTER TABLE audit_log RENAME COLUMN workspace_id TO organization_id;

-- Cleanup any old indexes if they exist
ALTER INDEX IF EXISTS idx_tasks_workspace RENAME TO idx_tasks_organization;
ALTER INDEX IF EXISTS idx_workflows_workspace RENAME TO idx_workflows_organization;
ALTER INDEX IF EXISTS idx_audit_workspace RENAME TO idx_audit_organization;
