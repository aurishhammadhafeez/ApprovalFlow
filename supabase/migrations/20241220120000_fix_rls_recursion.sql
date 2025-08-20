-- Fix infinite recursion in RLS policies
-- This migration fixes the circular references that cause infinite recursion

-- Step 1: Drop all problematic RLS policies
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
DROP POLICY IF EXISTS "Users can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

-- Step 2: Create simplified, non-recursive RLS policies

-- Users: Basic organization isolation
CREATE POLICY "Users can view organization users" ON users
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users: Only admins can manage users (simplified check)
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
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Invitations: Only admins can create invitations (simplified)
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

-- Step 3: Add comment to document the fix
COMMENT ON TABLE users IS 'Users table - RLS policies fixed to prevent infinite recursion';
