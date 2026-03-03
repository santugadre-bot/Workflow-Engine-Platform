-- Fix audit_log foreign key constraint to reference organizations instead of workspaces
-- Drop the old constraint that references workspaces
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_workspace_id_fkey;

-- Add the new constraint that references organizations
ALTER TABLE audit_log ADD CONSTRAINT audit_log_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
