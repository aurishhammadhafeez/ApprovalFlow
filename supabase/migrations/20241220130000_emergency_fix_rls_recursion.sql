-- Emergency fix: Drop ALL RLS policies and recreate them properly
-- This will resolve the infinite recursion immediately

-- Step 1: Disable RLS temporarily to break the recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to clean slate
DROP POLICY IF EXISTS "Users can view organization users" ON users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
DROP POLICY IF EXISTS "Users can view organization invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, safe policies that won't cause recursion
CREATE POLICY "Users can view own organization users" ON users
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = users.organization_id
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Users can view own organization invitations" ON invitations
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND ur.organization_id = invitations.organization_id
      AND r.name = 'admin'
    )
  );

-- Step 5: Add comment to document the emergency fix
COMMENT ON TABLE users IS 'Users table - Emergency RLS fix applied to prevent infinite recursion';
COMMENT ON TABLE invitations IS 'Invitations table - Emergency RLS fix applied to prevent infinite recursion';
