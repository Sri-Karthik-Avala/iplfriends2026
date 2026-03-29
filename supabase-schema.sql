-- ========================================================
-- IPL FRIENDS LEAGUE : SUPABASE SCHEMA
-- ========================================================
-- INSTRUCTIONS: Open your Supabase Dashboard, go to the SQL Editor (left sidebar),
-- paste this entire snippet, and click "RUN".

-- 1. Create Players Table
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  team_color text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Match Summaries Table (for AI outputs)
create table if not exists public.match_summaries (
  match_id text primary key,
  summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Match Results Table (for daily points)
create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  player_id uuid references public.players(id) on delete cascade not null,
  rank integer not null,
  dream11_points numeric not null,
  league_points integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Initial Roster Injection
-- This instantly pre-loads your 7 friends into the new Postgres database so you don't lose them!
insert into public.players (id, name, team, team_color, image_url) values 
('3b83648a-69f8-4036-96ec-c3e03102d9c1', 'Siri', 'Sunrisers Hyderabad', '#F26522', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c2', 'Sasank', 'Royal Challengers Bengaluru', '#EC1C24', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c3', 'Donga', 'Sunrisers Hyderabad', '#F26522', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c4', 'Sampath', 'Sunrisers Hyderabad', '#F26522', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c5', 'Ak', 'Kolkata Knight Riders', '#3A225D', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c6', 'Umesh', 'Mumbai Indians', '#004BA0', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'),
('3b83648a-69f8-4036-96ec-c3e03102d9c7', 'Rohit', 'Punjab Kings', '#D71920', 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png')
on conflict (id) do nothing;
