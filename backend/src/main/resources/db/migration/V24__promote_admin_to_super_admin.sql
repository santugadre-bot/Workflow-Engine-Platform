-- Promote admin@gmail.com to SUPER_ADMIN for development purposes
UPDATE users 
SET system_role = 'SUPER_ADMIN', 
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@gmail.com';
