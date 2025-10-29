-- Enable delete permissions for users table
-- This ensures the admin can delete users from the database

-- First, check if RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows deleting users
-- Note: In production, you should use proper authentication
-- For now, we'll allow deletes with the anon key (admin panel usage)
DROP POLICY IF EXISTS "Enable delete for admin" ON users;

CREATE POLICY "Enable delete for admin" ON users
  FOR DELETE
  USING (true);

-- Also ensure select, insert, and update policies exist
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON users;
CREATE POLICY "Enable insert for all users" ON users
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON users;
CREATE POLICY "Enable update for all users" ON users
  FOR UPDATE
  USING (true);
