-- Add new columns to users table for enhanced profile customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT; -- JSON string for theme data
ALTER TABLE users ADD COLUMN IF NOT EXISTS sections TEXT; -- JSON string for profile sections
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links TEXT; -- JSON string for social links
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update users table to use UUID as primary key (if not already)
-- This assumes your auth.users table uses UUID
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    allow_messages BOOLEAN DEFAULT true,
    profile_music_url VARCHAR(255),
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    digest_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (digest_frequency IN ('off', 'daily', 'weekly', 'monthly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    theme TEXT, -- JSON string for user theme preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create profile_views table for tracking profile visits
CREATE TABLE IF NOT EXISTS profile_views (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create profile_sections table for more structured section management
CREATE TABLE IF NOT EXISTS profile_sections (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    section_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    style_config TEXT, -- JSON string for section-specific styling
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create social_links table for better social media management
CREATE TABLE IF NOT EXISTS social_links (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    display_text VARCHAR(100),
    icon VARCHAR(10),
    visible BOOLEAN DEFAULT true,
    link_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_sections_user_id ON profile_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profile_sections_updated_at BEFORE UPDATE ON profile_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default profile sections for existing users
INSERT INTO profile_sections (user_id, section_type, title, content, section_order, visible)
SELECT 
    id,
    'about',
    'About Me',
    COALESCE(bio, ''),
    1,
    true
FROM users 
WHERE bio IS NOT NULL AND bio != ''
ON CONFLICT DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profile sections policies
CREATE POLICY "Users can manage their own sections" ON profile_sections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view visible sections" ON profile_sections FOR SELECT USING (visible = true);

-- Social links policies
CREATE POLICY "Users can manage their own social links" ON social_links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view visible social links" ON social_links FOR SELECT USING (visible = true);

-- Profile views policies
CREATE POLICY "Users can view their own profile views" ON profile_views FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Anyone can insert profile views" ON profile_views FOR INSERT WITH CHECK (true);