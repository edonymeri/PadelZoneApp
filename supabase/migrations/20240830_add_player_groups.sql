-- Migration: Add Player Groups/Categories System
-- Date: 2024-08-30

-- Create player_groups table
CREATE TABLE IF NOT EXISTS player_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id, name)
);

-- Add group_id to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES player_groups(id) ON DELETE SET NULL;

-- Add target_groups to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS target_groups jsonb;

-- Create some default groups for existing clubs
INSERT INTO player_groups (club_id, name, description, color, sort_order)
SELECT 
  c.id,
  'General',
  'Default group for all players',
  '#0172fb',
  1
FROM clubs c
WHERE NOT EXISTS (SELECT 1 FROM player_groups pg WHERE pg.club_id = c.id)
ON CONFLICT (club_id, name) DO NOTHING;

-- Optional: Create common skill-based groups
INSERT INTO player_groups (club_id, name, description, color, sort_order)
SELECT 
  c.id,
  grp.name,
  grp.description,
  grp.color,
  grp.sort_order
FROM clubs c
CROSS JOIN (
  VALUES 
    ('Beginners', 'New to padel, learning basics', '#10B981', 2),
    ('Intermediate', 'Comfortable with basic skills', '#F59E0B', 3),
    ('Advanced', 'Experienced players with strong technique', '#EF4444', 4),
    ('Competitive', 'Tournament-level players', '#8B5CF6', 5)
) AS grp(name, description, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM player_groups pg WHERE pg.club_id = c.id AND pg.name = grp.name)
ON CONFLICT (club_id, name) DO NOTHING;
