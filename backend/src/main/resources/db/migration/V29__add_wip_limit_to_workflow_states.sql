-- V29: Add wip_limit column to workflow_states for WIP limit indicator feature
ALTER TABLE workflow_states ADD COLUMN IF NOT EXISTS wip_limit INTEGER;
