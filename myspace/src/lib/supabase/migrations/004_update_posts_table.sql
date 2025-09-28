-- Update posts table to use UUID and add missing columns
-- First, check if posts table needs to be updated to use UUID

-- Add new columns if they don't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'friends' CHECK (privacy IN ('public', 'friends', 'private'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_bulletin BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update friends table structure to match what the code expects
DO $
BEGIN
    -- Check if friends table needs to be updated to use user_a/user_b columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'friends' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'friends' 
        AND column_name = 'user_a'
    ) THEN
        -- Rename columns to match expected structure
        ALTER TABLE friends RENAME COLUMN user_id TO user_a;
        ALTER TABLE friends RENAME COLUMN friend_id TO user_b;
        
        -- Remove the old status column and unique constraint if they exist
        ALTER TABLE friends DROP COLUMN IF EXISTS status;
        ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_friend_id_key;
        
        -- Add new unique constraint
        ALTER TABLE friends ADD CONSTRAINT friends_user_a_user_b_key UNIQUE (user_a, user_b);
    END IF;
END $;

-- Update posts table to use UUID as primary key (if not already)
-- This assumes your auth.users table uses UUID
DO $ 
BEGIN
    -- Check if posts.id is already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert posts table to use UUID
        ALTER TABLE posts ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE posts ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        
        -- Update comments table to match
        ALTER TABLE comments ALTER COLUMN post_id TYPE UUID USING gen_random_uuid();
        ALTER TABLE comments ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        
        -- Update friends table to use UUID
        ALTER TABLE friends ALTER COLUMN user_a TYPE UUID USING user_a::UUID;
        ALTER TABLE friends ALTER COLUMN user_b TYPE UUID USING user_b::UUID;
    END IF;
END $;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_posts_updated_at'
    ) THEN
        CREATE TRIGGER update_posts_updated_at 
        BEFORE UPDATE ON posts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create posts policies if they don't exist
DO $$
BEGIN
    -- Policy for viewing posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can view public posts and posts from friends'
    ) THEN
        CREATE POLICY "Users can view public posts and posts from friends" ON posts FOR SELECT USING (
            privacy = 'public' OR 
            user_id = auth.uid() OR
            (privacy = 'friends' AND EXISTS (
                SELECT 1 FROM friends 
                WHERE (user_a = auth.uid() AND user_b = posts.user_id) 
                   OR (user_b = auth.uid() AND user_a = posts.user_id)
            ))
        );
    END IF;

    -- Policy for creating posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can create their own posts'
    ) THEN
        CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy for updating posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can update their own posts'
    ) THEN
        CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy for deleting posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Users can delete their own posts'
    ) THEN
        CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;