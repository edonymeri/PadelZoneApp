-- TARGETED FIX: Replace duplicate player with missing player
-- This keeps all existing pairs intact, only fixes the duplicate

DO $$
DECLARE
    current_event_id UUID;
    current_round_id UUID;
    duplicate_player_id UUID;
    missing_player_id UUID;
    duplicate_count INTEGER;
    missing_count INTEGER;
    match_id_to_update UUID;
    position_to_update TEXT;
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
    SELECT id INTO current_round_id
    FROM rounds 
    WHERE event_id = current_event_id 
    ORDER BY round_num DESC 
    LIMIT 1;
    
    IF current_round_id IS NULL THEN
        RAISE EXCEPTION 'No current round found';
    END IF;
    
    RAISE NOTICE 'Working on Event ID: %, Round ID: %', current_event_id, current_round_id;
    
    -- Find duplicate player
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
        LIMIT 1
    )
    SELECT player_id, appearances INTO duplicate_player_id, duplicate_count FROM duplicate_check;
    
    IF duplicate_player_id IS NULL THEN
        RAISE NOTICE 'No duplicate player found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found duplicate player: % (appears % times)', duplicate_player_id, duplicate_count;
    
    -- Find missing player
    WITH current_players AS (
        SELECT team_a_player1 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_a_player2 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_b_player1 as player_id FROM matches WHERE round_id = current_round_id
        UNION ALL
        SELECT team_b_player2 as player_id FROM matches WHERE round_id = current_round_id
    )
    SELECT ep.player_id INTO missing_player_id
    FROM event_players ep
    WHERE ep.event_id = current_event_id
    AND ep.player_id NOT IN (SELECT player_id FROM current_players)
    LIMIT 1;
    
    IF missing_player_id IS NULL THEN
        RAISE NOTICE 'No missing player found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found missing player: %', missing_player_id;
    
    -- Show current state before fix
    RAISE NOTICE 'Current matches before fix:';
    FOR match_record IN 
        SELECT 
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
        WHERE m.round_id = current_round_id
        ORDER BY m.court_num
    LOOP
        RAISE NOTICE 'Court %: % & % vs % & %', 
            match_record.court_num, 
            match_record.team_a_player1, 
            match_record.team_a_player2, 
            match_record.team_b_player1, 
            match_record.team_b_player2;
    END LOOP;
    
    -- Find which match has the duplicate player and replace it
    -- We'll replace the SECOND occurrence of the duplicate player
    WITH duplicate_positions AS (
        SELECT 
            id,
            court_num,
            'team_a_player1' as position,
            team_a_player1 as player_id
        FROM matches 
        WHERE round_id = current_round_id AND team_a_player1 = duplicate_player_id
        UNION ALL
        SELECT 
            id,
            court_num,
            'team_a_player2' as position,
            team_a_player2 as player_id
        FROM matches 
        WHERE round_id = current_round_id AND team_a_player2 = duplicate_player_id
        UNION ALL
        SELECT 
            id,
            court_num,
            'team_b_player1' as position,
            team_b_player1 as player_id
        FROM matches 
        WHERE round_id = current_round_id AND team_b_player1 = duplicate_player_id
        UNION ALL
        SELECT 
            id,
            court_num,
            'team_b_player2' as position,
            team_b_player2 as player_id
        FROM matches 
        WHERE round_id = current_round_id AND team_b_player2 = duplicate_player_id
        ORDER BY court_num, position
        OFFSET 1  -- Skip the first occurrence, replace the second
        LIMIT 1
    )
    SELECT id, court_num, position INTO match_id_to_update, missing_count, position_to_update
    FROM duplicate_positions;
    
    IF match_id_to_update IS NULL THEN
        RAISE NOTICE 'Could not find second occurrence of duplicate player';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Replacing duplicate player in Court %, Position %', missing_count, position_to_update;
    
    -- Update the match to replace the duplicate with the missing player
    IF position_to_update = 'team_a_player1' THEN
        UPDATE matches 
        SET team_a_player1 = missing_player_id 
        WHERE id = match_id_to_update;
    ELSIF position_to_update = 'team_a_player2' THEN
        UPDATE matches 
        SET team_a_player2 = missing_player_id 
        WHERE id = match_id_to_update;
    ELSIF position_to_update = 'team_b_player1' THEN
        UPDATE matches 
        SET team_b_player1 = missing_player_id 
        WHERE id = match_id_to_update;
    ELSIF position_to_update = 'team_b_player2' THEN
        UPDATE matches 
        SET team_b_player2 = missing_player_id 
        WHERE id = match_id_to_update;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Replaced duplicate player with missing player';
    
    -- Show final state after fix
    RAISE NOTICE 'Final matches after fix:';
    FOR match_record IN 
        SELECT 
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
        WHERE m.round_id = current_round_id
        ORDER BY m.court_num
    LOOP
        RAISE NOTICE 'Court %: % & % vs % & %', 
            match_record.court_num, 
            match_record.team_a_player1, 
            match_record.team_a_player2, 
            match_record.team_b_player1, 
            match_record.team_b_player2;
    END LOOP;
    
    -- Verify no duplicates remain
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
    SELECT COUNT(*) INTO duplicate_count FROM verify_duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE 'VERIFICATION: No duplicates remain - fix successful!';
    ELSE
        RAISE NOTICE 'WARNING: Still found % duplicates after fix', duplicate_count;
    END IF;
    
END $$;

-- Show the final result
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
