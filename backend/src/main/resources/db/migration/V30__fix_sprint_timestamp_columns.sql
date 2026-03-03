-- V30: Fix sprint timestamp precision
-- 'started_at' and 'completed_at' were DATE, losing time-of-day information.
-- Sprint start/complete events happen at a specific point in time, so TIMESTAMP is correct.
ALTER TABLE sprints ALTER COLUMN started_at TYPE TIMESTAMP USING started_at::timestamp;
ALTER TABLE sprints ALTER COLUMN completed_at TYPE TIMESTAMP USING completed_at::timestamp;
