-- Fix duplicate player issue in current round
-- This script will identify and fix duplicate players in the current active round

-- First, let's see what the current state looks like
SELECT 'Current matches with potential duplicates:' as info;
SELECT 
    m.round_id,
    m.court_num,
    m.team_a_player1,
    m.team_a_player2,
    m.team_b_player1,
    m.team_b_player2,
    p1.full_name as player1_name,
    p2.full_name as player2_name,
    p3.full_name as player3_name,
    p4.full_name as player4_name
FROM matches m
LEFT JOIN players p1 ON m.team_a_player1 = p1.id
LEFT JOIN players p2 ON m.team_a_player2 = p2.id
LEFT JOIN players p3 ON m.team_b_player1 = p3.id
LEFT JOIN players p4 ON m.team_b_player2 = p4.id
WHERE m.round_id = (
    SELECT id FROM rounds 
    WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
    ORDER BY round_num DESC LIMIT 1
)
ORDER BY m.court_num;

-- Find duplicate players in the current round
SELECT 'Duplicate players found:' as info;
WITH current_round_matches AS (
    SELECT 
        m.team_a_player1 as player_id,
        m.court_num,
        'Team A' as team
    FROM matches m
    WHERE m.round_id = (
        SELECT id FROM rounds 
        WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
        ORDER BY round_num DESC LIMIT 1
    )
    UNION ALL
    SELECT 
        m.team_a_player2 as player_id,
        m.court_num,
        'Team A' as team
    FROM matches m
    WHERE m.round_id = (
        SELECT id FROM rounds 
        WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
        ORDER BY round_num DESC LIMIT 1
    )
    UNION ALL
    SELECT 
        m.team_b_player1 as player_id,
        m.court_num,
        'Team B' as team
    FROM matches m
    WHERE m.round_id = (
        SELECT id FROM rounds 
        WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
        ORDER BY round_num DESC LIMIT 1
    )
    UNION ALL
    SELECT 
        m.team_b_player2 as player_id,
        m.court_num,
        'Team B' as team
    FROM matches m
    WHERE m.round_id = (
        SELECT id FROM rounds 
        WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
        ORDER BY round_num DESC LIMIT 1
    )
)
SELECT 
    crm.player_id,
    p.full_name,
    COUNT(*) as appearances,
    STRING_AGG(crm.court_num || ' ' || crm.team, ', ') as locations
FROM current_round_matches crm
JOIN players p ON crm.player_id = p.id
GROUP BY crm.player_id, p.full_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Find missing players (players who should be in the round but aren't)
SELECT 'Missing players (not in current round):' as info;
WITH current_round_players AS (
    SELECT DISTINCT player_id FROM (
        SELECT team_a_player1 as player_id FROM matches m
        WHERE m.round_id = (
            SELECT id FROM rounds 
            WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
            ORDER BY round_num DESC LIMIT 1
        )
        UNION ALL
        SELECT team_a_player2 as player_id FROM matches m
        WHERE m.round_id = (
            SELECT id FROM rounds 
            WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
            ORDER BY round_num DESC LIMIT 1
        )
        UNION ALL
        SELECT team_b_player1 as player_id FROM matches m
        WHERE m.round_id = (
            SELECT id FROM rounds 
            WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
            ORDER BY round_num DESC LIMIT 1
        )
        UNION ALL
        SELECT team_b_player2 as player_id FROM matches m
        WHERE m.round_id = (
            SELECT id FROM rounds 
            WHERE event_id = (SELECT id FROM events WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1)
            ORDER BY round_num DESC LIMIT 1
        )
    )
),
event_players AS (
    SELECT ep.player_id
    FROM event_players ep
    JOIN events e ON ep.event_id = e.id
    WHERE e.ended_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT 1
)
SELECT 
    ep.player_id,
    p.full_name
FROM event_players ep
JOIN players p ON ep.player_id = p.id
WHERE ep.player_id NOT IN (SELECT player_id FROM current_round_players);

-- Show all event players for reference
SELECT 'All event players:' as info;
SELECT 
    ep.player_id,
    p.full_name
FROM event_players ep
JOIN players p ON ep.player_id = p.id
JOIN events e ON ep.event_id = e.id
WHERE e.ended_at IS NULL
ORDER BY e.created_at DESC, p.full_name
LIMIT 1;
