-- ================================================================
-- ROOMIO CS UCC — Full Supabase Schema (v3)
-- Paste this entire file into: Supabase → SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS and IF NOT EXISTS on policies)
-- ================================================================

-- ── PROFILES ─────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  hall text,
  room_number text,
  department text default 'Computer Science',
  level text,
  theme text default 'dark',
  is_online boolean default false,
  created_at timestamptz default now()
);

-- ── POSTS ────────────────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  content text,
  image_url text,
  video_url text,
  post_type text default 'general',
  hall_tag text,
  created_at timestamptz default now()
);

-- ── REACTIONS ────────────────────────────────────────────────────
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text default 'like',
  unique(post_id, user_id)
);

-- ── COMMENTS ─────────────────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ── CONVERSATIONS ─────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid references profiles(id) on delete cascade,
  participant_two uuid references profiles(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  unique(participant_one, participant_two)
);

-- ── MESSAGES ─────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text,
  image_url text,
  video_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ── MARKETPLACE ───────────────────────────────────────────────────
create table if not exists marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric not null,
  image_url text,
  category text default 'other',
  hall text,
  is_sold boolean default false,
  created_at timestamptz default now()
);

-- ── NOTICES ──────────────────────────────────────────────────────
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  hall text,
  priority text default 'normal',
  created_at timestamptz default now()
);

-- ── SLIDES ───────────────────────────────────────────────────────
create table if not exists slides (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references profiles(id) on delete cascade,
  title text not null,
  course text,
  level text,
  description text,
  file_url text not null,
  file_name text,
  file_size bigint,
  file_type text,
  download_count int default 0,
  created_at timestamptz default now()
);

-- ── FRIENDSHIPS ──────────────────────────────────────────────────
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, receiver_id)
);

-- ================================================================
-- ADD MISSING COLUMNS (safe to re-run)
-- ================================================================
alter table posts    add column if not exists video_url text;
alter table messages add column if not exists image_url text;
alter table messages add column if not exists video_url text;
alter table profiles add column if not exists theme text default 'dark';
alter table profiles add column if not exists bio text;

-- ================================================================
-- REALTIME
-- ================================================================
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table friendships;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table profiles       enable row level security;
alter table posts           enable row level security;
alter table reactions       enable row level security;
alter table comments        enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table marketplace_items enable row level security;
alter table notices         enable row level security;
alter table slides          enable row level security;
alter table friendships     enable row level security;

-- ================================================================
-- RLS POLICIES
-- Drop and recreate so this file is re-runnable
-- ================================================================
do $$ begin

  -- profiles
  drop policy if exists "Public profiles" on profiles;
  drop policy if exists "Own profile insert" on profiles;
  drop policy if exists "Own profile update" on profiles;
  create policy "Public profiles"   on profiles for select using (true);
  create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);
  create policy "Own profile update" on profiles for update using (auth.uid() = id);

  -- posts
  drop policy if exists "Public posts" on posts;
  drop policy if exists "Auth insert posts" on posts;
  drop policy if exists "Own post delete" on posts;
  create policy "Public posts"      on posts for select using (true);
  create policy "Auth insert posts" on posts for insert with check (auth.uid() = author_id);
  create policy "Own post delete"   on posts for delete using (auth.uid() = author_id);

  -- reactions
  drop policy if exists "Public reactions" on reactions;
  drop policy if exists "Auth reactions" on reactions;
  drop policy if exists "Own reaction delete" on reactions;
  create policy "Public reactions"    on reactions for select using (true);
  create policy "Auth reactions"      on reactions for insert with check (auth.uid() = user_id);
  create policy "Own reaction delete" on reactions for delete using (auth.uid() = user_id);

  -- comments
  drop policy if exists "Public comments" on comments;
  drop policy if exists "Auth comments" on comments;
  create policy "Public comments" on comments for select using (true);
  create policy "Auth comments"   on comments for insert with check (auth.uid() = author_id);

  -- conversations
  drop policy if exists "Own conversations" on conversations;
  drop policy if exists "Auth create conversation" on conversations;
  drop policy if exists "Own conversation update" on conversations;
  create policy "Own conversations"       on conversations for select using (auth.uid() = participant_one or auth.uid() = participant_two);
  create policy "Auth create conversation" on conversations for insert with check (auth.uid() = participant_one or auth.uid() = participant_two);
  create policy "Own conversation update" on conversations for update using (auth.uid() = participant_one or auth.uid() = participant_two);

  -- messages
  drop policy if exists "Own messages" on messages;
  drop policy if exists "Auth send message" on messages;
  drop policy if exists "Own message update" on messages;
  create policy "Own messages"       on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
  create policy "Auth send message"  on messages for insert with check (auth.uid() = sender_id);
  create policy "Own message update" on messages for update using (auth.uid() = receiver_id);

  -- marketplace
  drop policy if exists "Public marketplace" on marketplace_items;
  drop policy if exists "Auth list item" on marketplace_items;
  drop policy if exists "Own item update" on marketplace_items;
  drop policy if exists "Own item delete" on marketplace_items;
  create policy "Public marketplace" on marketplace_items for select using (true);
  create policy "Auth list item"     on marketplace_items for insert with check (auth.uid() = seller_id);
  create policy "Own item update"    on marketplace_items for update using (auth.uid() = seller_id);
  create policy "Own item delete"    on marketplace_items for delete using (auth.uid() = seller_id);

  -- notices
  drop policy if exists "Public notices" on notices;
  drop policy if exists "Auth post notice" on notices;
  create policy "Public notices"   on notices for select using (true);
  create policy "Auth post notice" on notices for insert with check (auth.role() = 'authenticated');

  -- slides
  drop policy if exists "Public slides" on slides;
  drop policy if exists "Auth upload slide" on slides;
  drop policy if exists "Own slide delete" on slides;
  create policy "Public slides"    on slides for select using (true);
  create policy "Auth upload slide" on slides for insert with check (auth.uid() = uploader_id);
  create policy "Own slide delete" on slides for delete using (auth.uid() = uploader_id);

  -- friendships
  drop policy if exists "Own friendships" on friendships;
  create policy "Own friendships" on friendships for all
    using (auth.uid() = requester_id or auth.uid() = receiver_id);

end $$;

-- ================================================================
-- STORAGE
-- In Supabase dashboard: Storage → New bucket → name: roomio → Public ✓
-- ================================================================
-- insert into storage.buckets (id, name, public) values ('roomio', 'roomio', true)
-- on conflict do nothing;
