-- Convert tables to use UUID if they're still using SERIAL/INTEGER
-- This migration should be run after the friends table structure is fixed

-- Check and convert users table to UUID if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND data_type = 'integer'
    ) THEN
        -- Convert users table
        ALTER TABLE users ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        
        -- Update all referencing tables
        ALTER TABLE friends ALTER COLUMN user_a TYPE UUID USING gen_random_uuid();
        ALTER TABLE friends ALTER COLUMN user_b TYPE UUID USING gen_random_uuid();
        ALTER TABLE posts ALTER COLUMN user_id TYPE UUID USING gen_random_uuid();
        ALTER TABLE comments ALTER COLUMN user_id TYPE UUID USING gen_random_uuid();
        
        -- Convert posts and comments IDs to UUID
        ALTER TABLE posts ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE comments ALTER COLUMN post_id TYPE UUID USING gen_random_uuid();
        ALTER TABLE comments ALTER COLUMN id TYPE UUID USING gen_random_uuid();
    END IF;
END $$;

-- Create trigger for updated_at on posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();