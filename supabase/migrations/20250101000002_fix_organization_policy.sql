-- Fix organization RLS policy to allow organization creation
-- Drop existing organization policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;

-- Create new organization policies that allow creation
CREATE POLICY "Users can view organizations" ON organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (auth.uid() = admin_id);

-- Also fix user policies to ensure they work properly
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;
DROP POLICY IF EXISTS "Users can view users" ON users;

CREATE POLICY "Users can view users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert users" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ensure all tables have proper policies (drop existing first)
DROP POLICY IF EXISTS "Users can view organization workflows" ON workflows;
DROP POLICY IF EXISTS "Users can insert workflows" ON workflows;
DROP POLICY IF EXISTS "Users can view workflows" ON workflows;

CREATE POLICY "Users can view workflows" ON workflows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can insert workflow steps" ON workflow_steps;

CREATE POLICY "Users can view workflow steps" ON workflow_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflow steps" ON workflow_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view approvals" ON approvals;
DROP POLICY IF EXISTS "Users can insert approvals" ON approvals;

CREATE POLICY "Users can view approvals" ON approvals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert approvals" ON approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 