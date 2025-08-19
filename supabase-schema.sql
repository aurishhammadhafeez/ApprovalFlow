-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  description TEXT,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,  -- Email must be unique across all organizations
  name TEXT,
  role TEXT DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on email (already enforced by UNIQUE NOT NULL)
-- This ensures one email can only be in one organization

-- Roles table for better role management
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles junction table for more flexible role assignment
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id, organization_id)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full access to all features and user management', '{"all": true}'),
  ('manager', 'Can manage workflows and approve requests', '{"workflows": true, "approve": true, "view_users": true}'),
  ('user', 'Can create workflows and submit approvals', '{"workflows": true, "submit": true}'),
  ('viewer', 'Read-only access to workflows', '{"view": true}');

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT,
  type TEXT,
  description TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow steps table
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  approver_email TEXT,
  order_index INTEGER NOT NULL,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workflows_organization_id ON workflows(organization_id);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_approvals_workflow_id ON approvals(workflow_id);
CREATE INDEX idx_approvals_step_id ON approvals(step_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own organization" ON organizations
  FOR INSERT WITH CHECK (true);

-- Users: Users can only see users in their organization
CREATE POLICY "Users can view organization users" ON users
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Workflows: Users can only see workflows in their organization
CREATE POLICY "Users can view organization workflows" ON workflows
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert workflows" ON workflows
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Workflow steps: Users can only see steps for workflows in their organization
CREATE POLICY "Users can view workflow steps" ON workflow_steps
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflows 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Approvals: Users can only see approvals for workflows in their organization
CREATE POLICY "Users can view approvals" ON approvals
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflows 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- Roles: Users can view all roles (for role assignment)
CREATE POLICY "Users can view roles" ON roles
  FOR SELECT USING (true);

-- User roles: Users can only see user roles in their organization
CREATE POLICY "Users can view organization user roles" ON user_roles
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- User roles: Only admins can assign roles
CREATE POLICY "Admins can assign user roles" ON user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = user_roles.organization_id
      AND r.name = 'admin'
    )
  );

-- User roles: Only admins can update roles
CREATE POLICY "Admins can update user roles" ON user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = user_roles.organization_id
      AND r.name = 'admin'
    )
  );

-- User roles: Only admins can delete roles
CREATE POLICY "Admins can delete user roles" ON user_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = user_roles.organization_id
      AND r.name = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 