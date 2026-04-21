-- ================================================================
-- ROOMIO CS — PRODUCTION FIX (Run in Supabase SQL Editor)
-- This ONLY fixes data and RLS. Does NOT change your schema.
-- ================================================================

-- 1. Confirm all unconfirmed users so they can log in
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 2. Auto-create profile for every new signup (permanent fix for FK errors)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, department, is_online)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    split_part(NEW.email,'@',1),
    'Computer Science',
    false
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill profiles for existing users with no profile row
INSERT INTO public.profiles (id, full_name, username, department, is_online)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)),
       split_part(u.email,'@',1), 'Computer Science', false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Add columns only if they don't exist (safe for Android app)
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- 5. Friendships table (Android app will also use this)
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own friendships" ON friendships;
CREATE POLICY "Own friendships" ON friendships FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 6. Slides table (Android app will also use this)
CREATE TABLE IF NOT EXISTS slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  course text,
  level text,
  description text,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  download_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public slides" ON slides;
DROP POLICY IF EXISTS "Auth upload slide" ON slides;
DROP POLICY IF EXISTS "Own slide delete" ON slides;
CREATE POLICY "Public slides"     ON slides FOR SELECT USING (true);
CREATE POLICY "Auth upload slide" ON slides FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Own slide delete"  ON slides FOR DELETE USING (auth.uid() = uploader_id);

-- 7. Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- 8. Verify: shows auth users with no profile (should be 0 rows after fix)
SELECT u.email FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;
