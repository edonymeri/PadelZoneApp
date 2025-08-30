
-- Supabase schema for Mexicano + Winners Court (Individual default)

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  -- Settings fields
  description text,
  contact_email text,
  phone text,
  address text,
  website text,
  timezone text default 'UTC',
  default_round_minutes int default 12,
  default_courts int default 4,
  default_points_per_game int,
  logo_url text,
  primary_color text default '#0172fb',
  secondary_color text default '#01CBFC'
);

-- Player groups/categories within a club
create table if not exists player_groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  description text,
  color text default '#6B7280', -- hex color for UI
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(club_id, name) -- prevent duplicate group names within a club
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  group_id uuid references player_groups(id) on delete set null,
  full_name text not null,
  photo_url text,
  elo int not null default 1000,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  mode text not null default 'INDIVIDUAL', -- or 'TEAMS'
  courts int not null check (courts between 1 and 16),
  court_names jsonb, -- array of court names ["Winners Court", "Court 2", etc.]
  round_minutes int not null default 12,
  points_per_game int, -- null for time mode, >0 for points mode
  max_rounds int, -- null for unlimited, >0 for round limit
  event_duration_hours int, -- null for unlimited, >0 for time limit
  wildcard_enabled boolean default false, -- enable wildcard rounds
  wildcard_start_round int default 5, -- round to start wildcards (after hierarchy established)
  wildcard_frequency int default 3, -- every N rounds after start
  wildcard_intensity text default 'medium', -- 'mild', 'medium', 'mayhem'
  target_groups jsonb, -- array of group IDs that can participate, null = all groups
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists event_players (
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  primary key (event_id, player_id)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_num int not null,
  finished boolean not null default false,
  created_at timestamptz default now(),
  unique(event_id, round_num)
);

-- Each court in a round has exactly one match (two sides, two players each for individual mode)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  court_num int not null,
  team_a_player1 uuid not null references players(id),
  team_a_player2 uuid not null references players(id),
  team_b_player1 uuid not null references players(id),
  team_b_player2 uuid not null references players(id),
  score_a int, -- nullable until entered
  score_b int,
  created_at timestamptz default now(),
  unique(round_id, court_num)
);

-- Nightly points per player per round (derived from matches + mapping), materialized for fast leaderboards
create table if not exists round_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  points numeric not null,
  court_num int not null,
  promoted boolean not null default false,
  defended_c1 boolean not null default false,
  created_at timestamptz default now(),
  unique(round_id, player_id)
);

-- ELO history (per player per round)
create table if not exists elo_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  elo_before int not null,
  elo_after int not null,
  delta int not null,
  created_at timestamptz default now()
);

-- Basic RLS
alter table clubs enable row level security;
alter table players enable row level security;
alter table events enable row level security;
alter table event_players enable row level security;
alter table rounds enable row level security;
alter table matches enable row level security;
alter table round_points enable row level security;
alter table elo_history enable row level security;

-- Policies: club owner and invited organizers (via membership) can read/write. For brevity, we use owner-only here.
create table if not exists club_memberships (
  club_id uuid references clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'organizer', -- 'owner' | 'organizer' | 'viewer'
  primary key (club_id, user_id)
);

alter table club_memberships enable row level security;

create policy "members read clubs" on clubs
for select using (exists (select 1 from club_memberships m where m.club_id = id and m.user_id = auth.uid()));

create policy "owners insert clubs" on clubs
for insert with check (owner_id = auth.uid());

create policy "owners update clubs" on clubs
for update using (owner_id = auth.uid());

create policy "members read players" on players
for select using (exists (select 1 from clubs c join club_memberships m on m.club_id = c.id where c.id = club_id and m.user_id = auth.uid()));

create policy "organizers write players" on players
for insert with check (exists (select 1 from clubs c join club_memberships m on m.club_id = c.id where c.id = club_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

create policy "organizers update players" on players
for update using (exists (select 1 from clubs c join club_memberships m on m.club_id = c.id where c.id = club_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

-- Similar policies for events/rounds/matches
create policy "members read events" on events
for select using (exists (select 1 from club_memberships m where m.club_id = club_id and m.user_id = auth.uid()));

create policy "organizers write events" on events
for insert with check (exists (select 1 from club_memberships m where m.club_id = club_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

create policy "organizers update events" on events
for update using (exists (select 1 from club_memberships m where m.club_id = club_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

create policy "members read rounds" on rounds
for select using (exists (select 1 from events e join club_memberships m on m.club_id = e.club_id where e.id = event_id and m.user_id = auth.uid()));

create policy "organizers write rounds" on rounds
for insert with check (exists (select 1 from events e join club_memberships m on m.club_id = e.club_id where e.id = event_id and exists (select 1 from club_memberships m2 where m2.club_id=e.club_id and m2.user_id = auth.uid() and m2.role in ('owner','organizer'))));

create policy "organizers update rounds" on rounds
for update using (exists (select 1 from events e join club_memberships m on m.club_id = e.club_id where e.id = event_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

create policy "members read matches" on matches
for select using (exists (select 1 from rounds r join events e on e.id=r.event_id join club_memberships m on m.club_id=e.club_id where r.id = round_id and m.user_id = auth.uid()));

create policy "organizers write matches" on matches
for insert with check (exists (select 1 from rounds r join events e on e.id=r.event_id join club_memberships m on m.club_id=e.club_id where r.id = round_id and exists (select 1 from club_memberships m2 where m2.club_id=e.club_id and m2.user_id = auth.uid() and m2.role in ('owner','organizer'))));

create policy "organizers update matches" on matches
for update using (exists (select 1 from rounds r join events e on e.id=r.event_id join club_memberships m on m.club_id=e.club_id where r.id = round_id and m.user_id = auth.uid() and m.role in ('owner','organizer')));

create policy "members read round_points" on round_points
for select using (exists (select 1 from events e join club_memberships m on m.club_id = e.club_id where e.id = event_id and m.user_id = auth.uid()));

create policy "members read elo_history" on elo_history
for select using (exists (select 1 from events e join club_memberships m on m.club_id = e.club_id where e.id = event_id and m.user_id = auth.uid()));
