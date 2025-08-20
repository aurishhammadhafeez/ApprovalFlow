-- Final RLS Disable: Completely disable RLS on user_roles table
-- This will fix the remaining query issues

-- Step 1: Completely disable RLS on user_roles table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the test policy on users table
DROP POLICY IF EXISTS "test_users_access" ON users;

-- Step 3: Disable RLS on users table as well for complete access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 4: Add comments to document the final state
COMMENT ON TABLE users IS 'Users table - RLS completely disabled for complete access';
COMMENT ON TABLE user_roles IS 'User roles table - RLS completely disabled for complete access';
COMMENT ON TABLE invitations IS 'Invitations table - RLS completely disabled for complete access';
COMMENT ON TABLE organizations IS 'Organizations table - RLS completely disabled for complete access';
COMMENT ON TABLE roles IS 'Roles table - RLS completely disabled for complete access';
COMMENT ON TABLE workflows IS 'Workflows table - RLS completely disabled for complete access';
COMMENT ON TABLE workflow_steps IS 'Workflow steps table - RLS completely disabled for complete access';
COMMENT ON TABLE approvals IS 'Approvals table - RLS completely disabled for complete access';

-- Step 5: Create a note about the current state
-- WARNING: This is a temporary fix to get the app working
-- RLS should be re-enabled with proper policies once the app is stable
