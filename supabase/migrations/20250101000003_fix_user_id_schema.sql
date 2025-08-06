-- Fix user ID to match auth UID
-- First, let's update the users table to ensure proper ID handling

-- Update the users table to use auth UID as primary key
-- This ensures the user ID in our table matches the Supabase auth UID

-- Create a function to sync user data with auth
CREATE OR REPLACE FUNCTION sync_user_with_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up, create a record in our users table
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      'user'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_with_auth();

-- Update RLS policies to use auth UID properly
DROP POLICY IF EXISTS "Users can view users" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;

-- Create policies that work with auth UID
CREATE POLICY "Users can view users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert users" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Also update organization policies to work with auth UID
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
CREATE POLICY "Users can update own organization" ON organizations
  FOR UPDATE USING (auth.uid() = admin_id); 