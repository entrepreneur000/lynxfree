-- Add is_banned column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on banned users
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
