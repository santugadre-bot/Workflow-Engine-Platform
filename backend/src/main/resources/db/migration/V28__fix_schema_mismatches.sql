-- V28: Fix schema mismatches between entities and database
-- Fixes Hibernate validation errors and resulting 500 errors

-- 1. Fix User password column
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users RENAME COLUMN password_hash TO password;
    END IF;
END $$;

-- 2. Add governance fields to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_due_date BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_story_points BOOLEAN NOT NULL DEFAULT true;

-- 3. Add agile fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
