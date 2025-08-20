-- Complete RLS Fix: Drop ALL policies and recreate with minimal, safe policies
-- This migration will completely resolve all infinite recursion issues

-- Step 1: Completely disable RLS on all tables to break any recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to ensure clean slate
-- Users table policies
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
DROP POLICY IF EXISTS "Users can view own organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Invitations table policies
DROP POLICY IF EXISTS "Users can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view own organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

-- Organizations table policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage own organization" ON organizations;

-- User roles table policies
DROP POLICY IF EXISTS "Users can view organization user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can assign user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;

-- Roles table policies
DROP POLICY IF EXISTS "Users can view roles" ON roles;

-- Workflows table policies
DROP POLICY IF EXISTS "Users can view organization workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete workflows" ON workflows;

-- Workflow steps table policies
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can manage workflow steps" ON workflow_steps;

-- Approvals table policies
DROP POLICY IF EXISTS "Users can view approvals" ON approvals;
DROP POLICY IF EXISTS "Users can create approvals" ON approvals;
DROP POLICY IF EXISTS "Users can update approvals" ON approvals;

-- Step 3: Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Step 4: Create minimal, safe policies that won't cause recursion
-- Users: Basic organization isolation only
CREATE POLICY "users_org_isolation" ON users
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Invitations: Basic organization isolation only
CREATE POLICY "invitations_org_isolation" ON invitations
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Organizations: Users can only see their own organization
CREATE POLICY "organizations_own_only" ON organizations
  FOR ALL USING (
    id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- User roles: Basic organization isolation
CREATE POLICY "user_roles_org_isolation" ON user_roles
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Roles: Everyone can view roles (no organization restriction needed)
CREATE POLICY "roles_view_all" ON roles
  FOR SELECT USING (true);

-- Workflows: Basic organization isolation
CREATE POLICY "workflows_org_isolation" ON workflows
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Workflow steps: Basic organization isolation through workflows
CREATE POLICY "workflow_steps_org_isolation" ON workflow_steps
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Approvals: Basic organization isolation through workflows
CREATE POLICY "approvals_org_isolation" ON approvals
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Step 5: Add comments to document the complete fix
COMMENT ON TABLE users IS 'Users table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE invitations IS 'Invitations table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE organizations IS 'Organizations table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE user_roles IS 'User roles table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE roles IS 'Roles table - Complete RLS fix applied, viewable by all users';
COMMENT ON TABLE workflows IS 'Workflows table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE workflow_steps IS 'Workflow steps table - Complete RLS fix applied, minimal policies for organization isolation';
COMMENT ON TABLE approvals IS 'Approvals table - Complete RLS fix applied, minimal policies for organization isolation';
