-- Fix missing user roles after migration
-- This will assign admin role to existing users who don't have roles

-- Step 1: Get the admin role ID
DO $$
DECLARE
    admin_role_id UUID;
    user_record RECORD;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    IF admin_role_id IS NULL THEN
        RAISE NOTICE 'Admin role not found, creating it';
        INSERT INTO roles (name, description, permissions) 
        VALUES ('admin', 'Full access to all features and user management', '{"all": true}')
        RETURNING id INTO admin_role_id;
    END IF;
    
    -- Loop through all users who don't have roles assigned
    FOR user_record IN 
        SELECT u.id, u.organization_id 
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.id IS NULL 
        AND u.organization_id IS NOT NULL
    LOOP
        -- Assign admin role to each user
        INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
        VALUES (user_record.id, admin_role_id, user_record.organization_id, user_record.id)
        ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned admin role to user %', user_record.id;
    END LOOP;
END $$;

-- Step 2: Verify the fix
SELECT 
    u.name,
    u.email,
    r.name as role_name,
    u.organization_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.organization_id IS NOT NULL
ORDER BY u.name;
