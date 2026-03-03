-- V27: Create task_attachments table
-- Stores file metadata for files attached to tasks.
-- Files are stored on disk under uploads/attachments/{taskId}/

CREATE TABLE task_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL,
    uploaded_by_id  UUID NOT NULL,
    file_name       VARCHAR(512) NOT NULL,
    file_url        VARCHAR(1024) NOT NULL,
    mime_type       VARCHAR(255),
    file_size_bytes BIGINT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachment_task ON task_attachments(task_id);
