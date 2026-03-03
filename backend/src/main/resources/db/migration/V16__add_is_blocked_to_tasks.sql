ALTER TABLE tasks
ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_task_blocked ON tasks(is_blocked);
