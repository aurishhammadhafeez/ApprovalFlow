-- Migration: Move roles from users table to user_roles table
-- This migration ensures proper role management using the user_roles junction table

-- Step 1: Create a temporary function to migrate existing roles
CREATE OR REPLACE FUNCTION migrate_user_roles()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    role_record RECORD;
BEGIN
    -- Loop through all users that have a role
    FOR user_record IN 
        SELECT id, role, organization_id 
        FROM users 
        WHERE role IS NOT NULL AND role != '' AND organization_id IS NOT NULL
    LOOP
        -- Find the role ID for the role name
        SELECT id INTO role_record FROM roles WHERE name = user_record.role;
        
        -- If role exists, create user_role entry
        IF FOUND THEN
            INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
            VALUES (user_record.id, role_record.id, user_record.organization_id, user_record.id)
            ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
        ELSE
            -- If role doesn't exist, assign default 'user' role
            SELECT id INTO role_record FROM roles WHERE name = 'user';
            IF FOUND THEN
                INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
                VALUES (user_record.id, role_record.id, user_record.organization_id, user_record.id)
                ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Execute the migration
SELECT migrate_user_roles();

-- Step 3: Drop the temporary function
DROP FUNCTION migrate_user_roles();

-- Step 4: Remove the role column from users table
ALTER TABLE users DROP COLUMN role;

-- Step 5: Update RLS policies to use user_roles table
-- Drop existing policies that reference the old role column
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
DROP POLICY IF EXISTS "Users can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

-- Recreate policies using user_roles table
-- Users can only see users in their organization
CREATE POLICY "Users can view organization users" ON users
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Only admins can manage users in their organization
CREATE POLICY "Admins can manage organization users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = users.organization_id
      AND r.name = 'admin'
    )
  );

-- Invitations: Users can only see invitations for their organization
CREATE POLICY "Users can view organization invitations" ON invitations
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Invitations: Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = invitations.organization_id
      AND r.name = 'admin'
    )
  );

-- Invitations: Only admins can update invitations
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = invitations.organization_id
      AND r.name = 'admin'
    )
  );

-- Invitations: Only admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = invitations.organization_id
      AND r.name = 'admin'
    )
  );

-- Step 6: Add comment to document the migration
COMMENT ON TABLE users IS 'Users table - roles are now managed through user_roles junction table';
COMMENT ON TABLE user_roles IS 'User-role assignments within organizations - replaces the old role column in users table';
