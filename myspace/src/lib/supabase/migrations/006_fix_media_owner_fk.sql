-- Fix media.owner foreign key to reference users(id) instead of profiles(id)
-- This migration is safe to run multiple times.

-- 1) Drop existing FK if it points to the wrong table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'media'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'media_owner_fkey'
      AND ccu.table_name = 'profiles'
  ) THEN
    ALTER TABLE media DROP CONSTRAINT media_owner_fkey;
  END IF;
END $$;

-- 2) Ensure owner column type is UUID (matches users.id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media'
      AND column_name = 'owner'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE media ALTER COLUMN owner TYPE uuid USING owner::uuid;
  END IF;
END $$;

-- 3) Recreate FK to users(id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'media'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'owner'
  ) THEN
    ALTER TABLE media
      ADD CONSTRAINT media_owner_fkey
      FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Optional: verify posts.user_id also references users(id)
-- (Uncomment if you need to enforce it)
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1
--     FROM information_schema.table_constraints tc
--     WHERE tc.table_name = 'posts'
--       AND tc.constraint_type = 'FOREIGN KEY'
--       AND tc.constraint_name = 'posts_user_id_fkey_to_profiles'
--   ) THEN
--     ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey_to_profiles;
--   END IF;
--   BEGIN
--     ALTER TABLE posts
--       ADD CONSTRAINT posts_user_id_fkey
--       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--   EXCEPTION WHEN duplicate_object THEN
--     -- ignore if it already exists
--   END;
-- END $$;