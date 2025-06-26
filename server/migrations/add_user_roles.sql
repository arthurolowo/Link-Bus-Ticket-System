-- Add isVerified and isAdmin columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update existing users
UPDATE users SET is_verified = FALSE WHERE is_verified IS NULL;
UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL; 