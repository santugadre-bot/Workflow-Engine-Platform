-- Create boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    project_id UUID NOT NULL,
    columns_config TEXT,
    CONSTRAINT fk_board_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_board_project ON boards(project_id);

-- Create sprints table
CREATE TABLE sprints (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    started_at DATE,
    completed_at DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'FUTURE',
    project_id UUID NOT NULL,
    CONSTRAINT fk_sprint_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_sprint_project ON sprints(project_id);
CREATE INDEX idx_sprint_status ON sprints(status);

-- Add sprint_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID;
ALTER TABLE tasks ADD CONSTRAINT fk_task_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_task_sprint ON tasks(sprint_id);
