-- Optimization: Add missing indexes for high-traffic query filters
-- Performance Impact: Drastically improves 'My Tasks' and 'Due Soon' queries

-- 1. Index for 'My Tasks' (Filter by Assignee)
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);

-- 2. Index for 'Urgent Tasks' (Filter by Due Date)
CREATE INDEX idx_tasks_duedate ON tasks(due_date);

-- 3. Composite Key for task lookups within a project (Project + Status)
CREATE INDEX idx_tasks_project_status ON tasks(project_id, current_state_id);
