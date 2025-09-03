-- EMERGENCY FIX: Fix duplicate player issue in current round
-- Run this in your Supabase SQL Editor

-- Step 1: Identify the current active event and round
DO $$
DECLARE
    current_event_id UUID;
    current_round_id UUID;
    current_round_num INTEGER;
    player_count INTEGER;
    match_count INTEGER;
BEGIN
    -- Get current active event
    SELECT id INTO current_event_id 
    FROM events 
    WHERE ended_at IS NULL 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF current_event_id IS NULL THEN
        RAISE EXCEPTION 'No active event found';
    END IF;
    
    -- Get current round
    SELECT id, round_num INTO current_round_id, current_round_num
    FROM rounds 
    WHERE event_id = current_event_id 
    ORDER BY round_num DESC 
    LIMIT 1;
    
    IF current_round_id IS NULL THEN
        RAISE EXCEPTION 'No current round found';
    END IF;
    
    -- Get player count
    SELECT COUNT(*) INTO player_count
    FROM event_players 
    WHERE event_id = current_event_id;
    
    -- Get match count
    SELECT COUNT(*) INTO match_count
    FROM matches 
    WHERE round_id = current_round_id;
    
    RAISE NOTICE 'Working on Event ID: %, Round % (ID: %)', current_event_id, current_round_num, current_round_id;
    RAISE NOTICE 'Expected players: %, Current matches: %', player_count, match_count;
    
    -- Step 2: Check for duplicates
    WITH current_players AS (
        SELECT team_a_player1 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_a_player2 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_b_player1 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_b_player2 as player_id FROM matches WHERE round_id = current_round_id
    ),
    duplicate_check AS (
        SELECT player_id, COUNT(*) as appearances
        FROM current_players
        GROUP BY player_id
        HAVING COUNT(*) > 1
    )
    SELECT COUNT(*) INTO player_count FROM duplicate_check;
    
    IF player_count > 0 THEN
        RAISE NOTICE 'Found % duplicate players - fixing...', player_count;
        
        -- Step 3: Delete current matches
        DELETE FROM matches WHERE round_id = current_round_id;
        RAISE NOTICE 'Deleted current matches';
        
        -- Step 4: Get all event players and shuffle them
        WITH event_players AS (
            SELECT player_id 
            FROM event_players 
            WHERE event_id = current_event_id
            ORDER BY RANDOM()
        ),
        player_assignments AS (
            SELECT 
                player_id,
                ROW_NUMBER() OVER () as player_order
            FROM event_players
        )
        INSERT INTO matches (round_id, court_num, team_a_player1, team_a_player2, team_b_player1, team_b_player2)
        SELECT 
            current_round_id as round_id,
            (player_order - 1) / 4 + 1 as court_num,
            MAX(CASE WHEN (player_order - 1) % 4 = 0 THEN player_id END) as team_a_player1,
            MAX(CASE WHEN (player_order - 1) % 4 = 1 THEN player_id END) as team_a_player2,
            MAX(CASE WHEN (player_order - 1) % 4 = 2 THEN player_id END) as team_b_player1,
            MAX(CASE WHEN (player_order - 1) % 4 = 3 THEN player_id END) as team_b_player2
        FROM player_assignments
        GROUP BY (player_order - 1) / 4 + 1
        ORDER BY court_num;
        
        RAISE NOTICE 'Created new matches with shuffled players';
        
        -- Step 5: Verify the fix
        WITH verify_players AS (
            SELECT team_a_player1 as player_id FROM matches WHERE round_id = current_round_id
            UNION ALL
            SELECT team_a_player2 as player_id FROM matches WHERE round_id = current_round_id
            UNION ALL
            SELECT team_b_player1 as player_id FROM matches WHERE round_id = current_round_id
            UNION ALL
            SELECT team_b_player2 as player_id FROM matches WHERE round_id = current_round_id
        ),
        verify_duplicates AS (
            SELECT player_id, COUNT(*) as appearances
            FROM verify_players
            GROUP BY player_id
            HAVING COUNT(*) > 1
        )
        SELECT COUNT(*) INTO player_count FROM verify_duplicates;
        
        IF player_count = 0 THEN
            RAISE NOTICE 'SUCCESS: No duplicates found after fix!';
        ELSE
            RAISE NOTICE 'WARNING: Still found % duplicates after fix', player_count;
        END IF;
        
    ELSE
        RAISE NOTICE 'No duplicates found - round is valid';
    END IF;
    
END $$;

-- Step 6: Show the final result
SELECT 
    'FINAL RESULT' as status,
    m.court_num,
    p1.full_name as team_a_player1,
    p2.full_name as team_a_player2,
    p3.full_name as team_b_player1,
    p4.full_name as team_b_player2
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
