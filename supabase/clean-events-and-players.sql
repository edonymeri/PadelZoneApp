-- Clean Events and Players Data
-- This script will delete all events, players, and related data
-- while preserving clubs and club memberships

-- Delete data in the correct order (respecting foreign key constraints)
-- Start with the most dependent tables first

-- 1. Delete ELO history (depends on events, rounds, players)
DELETE FROM elo_history;

-- 2. Delete round points (depends on events, rounds, players)
DELETE FROM round_points;

-- 3. Delete matches (depends on rounds, players)
DELETE FROM matches;

-- 4. Delete rounds (depends on events)
DELETE FROM rounds;

-- 5. Delete event players (depends on events, players)
DELETE FROM event_players;

-- 6. Delete events (depends on clubs)
DELETE FROM events;

-- 7. Delete players (depends on clubs, player_groups)
DELETE FROM players;

-- 8. Delete player groups (depends on clubs)
DELETE FROM player_groups;

-- Verify cleanup
SELECT 'clubs' as table_name, COUNT(*) as count FROM clubs
UNION ALL
SELECT 'club_memberships', COUNT(*) FROM club_memberships
UNION ALL
SELECT 'player_groups', COUNT(*) FROM player_groups
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'event_players', COUNT(*) FROM event_players
UNION ALL
SELECT 'rounds', COUNT(*) FROM rounds
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'round_points', COUNT(*) FROM round_points
UNION ALL
SELECT 'elo_history', COUNT(*) FROM elo_history
ORDER BY table_name;

-- Database cleaned! 
-- Clubs and club_memberships should remain, everything else should be 0
