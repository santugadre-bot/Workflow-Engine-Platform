-- Add cover image to tasks
ALTER TABLE tasks ADD COLUMN cover_image VARCHAR(255);

-- Create subtasks table
CREATE TABLE subtasks (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_id UUID NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_subtask_task ON subtasks(task_id);

-- Create task_tags table for ElementCollection
CREATE TABLE task_tags (
    task_id UUID NOT NULL,
    tag VARCHAR(255),
    CONSTRAINT fk_task_tags_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_tags_task ON task_tags(task_id);
