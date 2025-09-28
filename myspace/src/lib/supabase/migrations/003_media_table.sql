-- Create media table for storing post attachments
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    owner UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    url VARCHAR(500),
    mime_type VARCHAR(100),
    size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);

-- Create trigger for updated_at
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Media policies
CREATE POLICY "Users can view media for posts they can see" ON media FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = media.post_id
    )
);

CREATE POLICY "Users can manage their own media" ON media FOR ALL USING (auth.uid() = owner);