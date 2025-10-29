-- Add analysis tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_analyses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS analyses_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_analysis_date TIMESTAMP WITH TIME ZONE;

-- Update existing users to have default values
UPDATE users 
SET total_analyses = 0, 
    analyses_today = 0 
WHERE total_analyses IS NULL;
