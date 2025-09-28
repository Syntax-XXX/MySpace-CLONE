# Supabase Storage Setup

## Required Storage Buckets

### 1. Media Bucket
Create a bucket named `media` for storing post attachments (images, videos).

**Settings:**
- Name: `media`
- Public: `true` (for public access to media files)
- File size limit: `50MB` (adjust as needed)
- Allowed MIME types: `image/*`, `video/*`

**RLS Policies:**
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
);

-- Allow public read access to media files
CREATE POLICY "Public can view media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow users to update their own media files
CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media files
CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
    bucket_id = 'media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. Avatars Bucket (if not already exists)
Create a bucket named `avatars` for storing user profile pictures.

**Settings:**
- Name: `avatars`
- Public: `true`
- File size limit: `5MB`
- Allowed MIME types: `image/*`

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create the buckets with the settings above
4. Apply the RLS policies
5. Run the database migrations in order:
   - `001_init_tables.sql`
   - `002_profile_customization.sql`
   - `003_media_table.sql`
   - `004_update_posts_table.sql`

## File Organization

Files are organized by user ID:
```
media/
├── {user_id}/
│   ├── {timestamp}_0.jpg
│   ├── {timestamp}_1.png
│   └── ...
```

This ensures users can only access their own files and provides good organization.