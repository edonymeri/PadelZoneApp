-- Add format column to events table
ALTER TABLE events 
ADD COLUMN format text DEFAULT 'winners-court' 
CHECK (format IN ('winners-court', 'americano'));
alter table events add column if not exists variant text;

-- Update format column to use proper values for existing events
update events set format = 'mexicano' where format is null or format = 'mexicano';

-- Add constraint for format values
alter table events add constraint events_format_check 
  check (format in ('mexicano', 'winners', 'americano'));

-- Add constraint for variant values (only required for americano)
alter table events add constraint events_variant_check 
  check (
    (format != 'americano') or 
    (format = 'americano' and variant in ('individual', 'team'))
  );

-- Optional: Create teams table for Team Americano (we can implement this later)
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player1_id uuid not null references players(id),
  player2_id uuid not null references players(id),
  name text, -- optional team name
  created_at timestamptz default now(),
  unique(event_id, player1_id, player2_id)
);

alter table teams enable row level security;

-- Teams policies (similar to other tables)
create policy "members read teams" on teams
for select using (exists (
  select 1 from events e 
  join club_memberships m on m.club_id = e.club_id 
  where e.id = event_id and m.user_id = auth.uid()
));

create policy "organizers write teams" on teams
for insert with check (exists (
  select 1 from events e 
  join club_memberships m on m.club_id = e.club_id 
  where e.id = event_id and m.user_id = auth.uid() and m.role in ('owner','organizer')
));

create policy "organizers update teams" on teams
for update using (exists (
  select 1 from events e 
  join club_memberships m on m.club_id = e.club_id 
  where e.id = event_id and m.user_id = auth.uid() and m.role in ('owner','organizer')
));
