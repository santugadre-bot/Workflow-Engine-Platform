-- Clear all data from tables
-- Disable foreign key checks temporarily by truncating in the correct order

-- Clear tasks first (has foreign keys to many tables)
TRUNCATE TABLE tasks CASCADE;

-- Clear workflow-related tables
TRUNCATE TABLE workflow_transitions CASCADE;
TRUNCATE TABLE workflow_states CASCADE;
TRUNCATE TABLE workflows CASCADE;

-- Clear project tables
TRUNCATE TABLE project_members CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Clear RBAC tables
TRUNCATE TABLE organization_members CASCADE;

-- Clear organization tables
TRUNCATE TABLE organizations CASCADE;

-- Clear user tables
TRUNCATE TABLE users CASCADE;

-- Clear SLA tables if they exist
TRUNCATE TABLE sla_violations CASCADE;

-- Clear any audit or history tables
TRUNCATE TABLE flyway_schema_history CASCADE;

-- Note: The CASCADE option will automatically truncate all dependent tables
