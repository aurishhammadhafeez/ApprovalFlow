-- Deep Clean Fix: Completely disable RLS and check for root causes
-- This migration will temporarily disable all security to identify the real issue

-- Step 1: Completely disable RLS on ALL tables to eliminate any recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to ensure complete clean slate
-- Users table
DROP POLICY IF EXISTS "users_org_isolation" ON users;
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
DROP POLICY IF EXISTS "Users can view own organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Invitations table
DROP POLICY IF EXISTS "invitations_org_isolation" ON invitations;
DROP POLICY IF EXISTS "Users can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view own organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

-- Organizations table
DROP POLICY IF EXISTS "organizations_own_only" ON organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage own organization" ON organizations;

-- User roles table
DROP POLICY IF EXISTS "user_roles_org_isolation" ON user_roles;
DROP POLICY IF EXISTS "Users can view organization user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can assign user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;

-- Roles table
DROP POLICY IF EXISTS "roles_view_all" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;

-- Workflows table
DROP POLICY IF EXISTS "workflows_org_isolation" ON workflows;
DROP POLICY IF EXISTS "Users can view organization workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete workflows" ON workflows;

-- Workflow steps table
DROP POLICY IF EXISTS "workflow_steps_org_isolation" ON workflow_steps;
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can manage workflow steps" ON workflow_steps;

-- Approvals table
DROP POLICY IF EXISTS "approvals_org_isolation" ON approvals;
DROP POLICY IF EXISTS "Users can view approvals" ON approvals;
DROP POLICY IF EXISTS "Users can create approvals" ON approvals;
DROP POLICY IF EXISTS "Users can update approvals" ON approvals;

-- Step 3: Check for any problematic triggers that might cause recursion
-- Drop any triggers that might be causing issues
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS update_approvals_updated_at ON approvals;
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;

-- Step 4: Drop the trigger function that might be problematic
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 5: Add comments to document the deep clean
COMMENT ON TABLE users IS 'Users table - RLS completely disabled for debugging';
COMMENT ON TABLE invitations IS 'Invitations table - RLS completely disabled for debugging';
COMMENT ON TABLE organizations IS 'Organizations table - RLS completely disabled for debugging';
COMMENT ON TABLE user_roles IS 'User roles table - RLS completely disabled for debugging';
COMMENT ON TABLE roles IS 'Roles table - RLS completely disabled for debugging';
COMMENT ON TABLE workflows IS 'Workflows table - RLS completely disabled for debugging';
COMMENT ON TABLE workflow_steps IS 'Workflow steps table - RLS completely disabled for debugging';
COMMENT ON TABLE approvals IS 'Approvals table - RLS completely disabled for debugging';

-- Step 6: Create a simple test policy on users table to verify basic functionality
-- This will help us test if the issue is with RLS or something else
CREATE POLICY "test_users_access" ON users
  FOR ALL USING (true);

-- Re-enable RLS only on users table for testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
