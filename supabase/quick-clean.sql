-- Quick Database Cleanup
-- Run this in your Supabase SQL Editor to clean all data

-- Delete all data (in correct order to respect foreign keys)
DELETE FROM elo_history;
DELETE FROM round_points;
DELETE FROM matches;
DELETE FROM rounds;
DELETE FROM event_players;
DELETE FROM events;
DELETE FROM players;
DELETE FROM player_groups;
DELETE FROM club_memberships;
DELETE FROM clubs;

-- Verify all tables are empty
SELECT 'clubs' as table_name, COUNT(*) as count FROM clubs
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'rounds', COUNT(*) FROM rounds
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'round_points', COUNT(*) FROM round_points
UNION ALL
SELECT 'elo_history', COUNT(*) FROM elo_history
ORDER BY table_name;
