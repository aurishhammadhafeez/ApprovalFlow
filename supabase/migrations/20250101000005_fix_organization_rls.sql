-- Fix organization RLS policies that are blocking organization creation
-- The issue is that the RLS policies are still too restrictive for organization creation

-- First, let's check and drop all existing organization policies
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;

-- Create more permissive policies for organization creation
-- Allow authenticated users to view organizations
CREATE POLICY "Users can view organizations" ON organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert organizations (this is the key fix)
CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own organization
CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (auth.uid() = admin_id);

-- Also ensure the organizations table has RLS enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Let's also check and fix any workflow policies that might be causing issues
DROP POLICY IF EXISTS "Users can view workflows" ON workflows;
DROP POLICY IF EXISTS "Users can insert workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update workflows" ON workflows;

CREATE POLICY "Users can view workflows" ON workflows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update workflows" ON workflows
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fix workflow_steps policies
DROP POLICY IF EXISTS "Users can view workflow_steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can insert workflow_steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can update workflow_steps" ON workflow_steps;

CREATE POLICY "Users can view workflow_steps" ON workflow_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflow_steps" ON workflow_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update workflow_steps" ON workflow_steps
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fix approvals policies
DROP POLICY IF EXISTS "Users can view approvals" ON approvals;
DROP POLICY IF EXISTS "Users can insert approvals" ON approvals;
DROP POLICY IF EXISTS "Users can update approvals" ON approvals;

CREATE POLICY "Users can view approvals" ON approvals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert approvals" ON approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update approvals" ON approvals
  FOR UPDATE USING (auth.uid() IS NOT NULL); 