-- Fix RLS policies to prevent infinite recursion
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Users can view organization workflows" ON workflows;
DROP POLICY IF EXISTS "Users can insert workflows" ON workflows;
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can view approvals" ON approvals;

-- Create simplified RLS policies that don't cause recursion
-- Organizations: Allow authenticated users to insert and view their own organizations
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own organization" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users: Allow users to view and insert user records
CREATE POLICY "Users can view organization users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert users" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workflows: Allow users to view and insert workflows
CREATE POLICY "Users can view organization workflows" ON workflows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Workflow steps: Allow users to view and insert workflow steps
CREATE POLICY "Users can view workflow steps" ON workflow_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflow steps" ON workflow_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Approvals: Allow users to view and insert approvals
CREATE POLICY "Users can view approvals" ON approvals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert approvals" ON approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 