-- Fix friends table structure to match what the code expects
-- This migration updates the friends table from (user_id, friend_id, status) to (user_a, user_b)

-- First, check if we need to update the friends table structure
DO $$
BEGIN
    -- Check if friends table has the old structure
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'friends' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'friends' 
        AND column_name = 'user_a'
    ) THEN
        -- Drop existing constraints first
        ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_friend_id_key;
        
        -- Rename columns to match expected structure
        ALTER TABLE friends RENAME COLUMN user_id TO user_a;
        ALTER TABLE friends RENAME COLUMN friend_id TO user_b;
        
        -- Remove the status column since the new structure doesn't use it
        ALTER TABLE friends DROP COLUMN IF EXISTS status;
        
        -- Add new unique constraint
        ALTER TABLE friends ADD CONSTRAINT friends_user_a_user_b_key UNIQUE (user_a, user_b);
    END IF;
END $$;

-- Add missing columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'friends' CHECK (privacy IN ('public', 'friends', 'private'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_bulletin BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create basic policies for posts (simplified version)
DROP POLICY IF EXISTS "Users can view public posts and posts from friends" ON posts;
CREATE POLICY "Users can view public posts and posts from friends" ON posts FOR SELECT USING (
    privacy = 'public' OR 
    user_id = auth.uid() OR
    (privacy = 'friends' AND EXISTS (
        SELECT 1 FROM friends 
        WHERE (user_a = auth.uid() AND user_b = posts.user_id) 
           OR (user_b = auth.uid() AND user_a = posts.user_id)
    ))
);

DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);