-- Add position columns for drag-and-drop canvas support
ALTER TABLE workflow_states
    ADD COLUMN position_x DOUBLE PRECISION DEFAULT 0 NOT NULL,
    ADD COLUMN position_y DOUBLE PRECISION DEFAULT 0 NOT NULL;
