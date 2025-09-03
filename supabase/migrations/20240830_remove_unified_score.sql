-- Remove unused unified_score column from round_points table
ALTER TABLE round_points DROP COLUMN IF EXISTS unified_score;

-- Note: We're keeping the event_summary table as it's still useful for storing final event results
-- but we're not using the unified_score column anymore
