-- Add comprehensive club settings to the clubs table
-- Using JSON fields for flexible configuration without schema changes

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS scoring_config JSONB DEFAULT '{
  "defaultPointsMode": "points",
  "minPointsPerGame": 10,
  "maxPointsPerGame": 21,
  "defaultPointsPerGame": 21,
  "baseWinPoints": 3,
  "marginBonusThreshold": 10,
  "marginBonusPoints": 1,
  "maxPointsPerMatch": 5,
  "winnersCourtBonusEnabled": true,
  "winnersCourtBonusPoints": 1,
  "winnersCourtBonusStartRound": 5
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tournament_defaults JSONB DEFAULT '{
  "defaultFormat": "winners-court",
  "defaultScoringMode": "points",
  "defaultTimePerGame": 12,
  "defaultCourts": 4,
  "maxPlayersPerEvent": 32,
  "enableRoundLimits": false,
  "defaultMaxRounds": null,
  "enableTimeLimits": false,
  "defaultMaxDuration": null
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{
  "useCustomCourtNames": false,
  "customCourtNames": [],
  "eventTerminology": "Tournament",
  "playerTerminology": "Player"
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS elo_config JSONB DEFAULT '{
  "enabled": true,
  "startingElo": 1000,
  "kFactor": 16,
  "showEloToPlayers": true,
  "eloDecayEnabled": false,
  "eloDecayRate": 0,
  "eloFloor": 0,
  "eloCeiling": 3000
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS leaderboard_config JSONB DEFAULT '{
  "displayStats": ["total_score", "games_won", "goal_difference", "elo"],
  "sortPriority": ["total_score", "games_won", "goal_difference"],
  "showHistoricalRankings": true,
  "rankingPeriods": ["weekly", "monthly", "all-time"]
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS wildcard_config JSONB DEFAULT '{
  "enabledByDefault": false,
  "defaultFrequency": 3,
  "defaultIntensity": "medium",
  "defaultStartRound": 5,
  "allowMidTournament": true
}';

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS player_config JSONB DEFAULT '{
  "requirePlayerApproval": false,
  "allowGuestPlayers": true,
  "maxGuestsPerEvent": 4,
  "guestNamingPattern": "Guest {number}",
  "requirePlayerEmails": false,
  "enablePlayerProfiles": true
}';

-- Update existing clubs to have the default settings
UPDATE clubs 
SET 
  scoring_config = COALESCE(scoring_config, '{
    "defaultPointsMode": "points",
    "minPointsPerGame": 10,
    "maxPointsPerGame": 21,
    "defaultPointsPerGame": 21,
    "baseWinPoints": 3,
    "marginBonusThreshold": 10,
    "marginBonusPoints": 1,
    "maxPointsPerMatch": 5,
    "winnersCourtBonusEnabled": true,
    "winnersCourtBonusPoints": 1,
    "winnersCourtBonusStartRound": 5
  }'::jsonb),
  tournament_defaults = COALESCE(tournament_defaults, '{
    "defaultFormat": "winners-court",
    "defaultScoringMode": "points",
    "defaultTimePerGame": 12,
    "defaultCourts": 4,
    "maxPlayersPerEvent": 32,
    "enableRoundLimits": false,
    "defaultMaxRounds": null,
    "enableTimeLimits": false,
    "defaultMaxDuration": null
  }'::jsonb),
  branding_config = COALESCE(branding_config, '{
    "useCustomCourtNames": false,
    "customCourtNames": [],
    "eventTerminology": "Tournament",
    "playerTerminology": "Player"
  }'::jsonb),
  elo_config = COALESCE(elo_config, '{
    "enabled": true,
    "startingElo": 1000,
    "kFactor": 16,
    "showEloToPlayers": true,
    "eloDecayEnabled": false,
    "eloDecayRate": 0,
    "eloFloor": 0,
    "eloCeiling": 3000
  }'::jsonb),
  leaderboard_config = COALESCE(leaderboard_config, '{
    "displayStats": ["total_score", "games_won", "goal_difference", "elo"],
    "sortPriority": ["total_score", "games_won", "goal_difference"],
    "showHistoricalRankings": true,
    "rankingPeriods": ["weekly", "monthly", "all-time"]
  }'::jsonb),
  wildcard_config = COALESCE(wildcard_config, '{
    "enabledByDefault": false,
    "defaultFrequency": 3,
    "defaultIntensity": "medium",
    "defaultStartRound": 5,
    "allowMidTournament": true
  }'::jsonb),
  player_config = COALESCE(player_config, '{
    "requirePlayerApproval": false,
    "allowGuestPlayers": true,
    "maxGuestsPerEvent": 4,
    "guestNamingPattern": "Guest {number}",
    "requirePlayerEmails": false,
    "enablePlayerProfiles": true
  }'::jsonb)
WHERE scoring_config IS NULL 
   OR tournament_defaults IS NULL 
   OR branding_config IS NULL 
   OR elo_config IS NULL 
   OR leaderboard_config IS NULL 
   OR wildcard_config IS NULL 
   OR player_config IS NULL;

-- Create index on club settings for better query performance
CREATE INDEX IF NOT EXISTS idx_clubs_settings ON clubs USING gin (scoring_config, tournament_defaults, branding_config);

-- Add comments for documentation
COMMENT ON COLUMN clubs.scoring_config IS 'JSON configuration for scoring rules, points, bonuses';
COMMENT ON COLUMN clubs.tournament_defaults IS 'JSON configuration for default tournament settings';
COMMENT ON COLUMN clubs.branding_config IS 'JSON configuration for club branding and terminology';
COMMENT ON COLUMN clubs.elo_config IS 'JSON configuration for ELO rating system';
COMMENT ON COLUMN clubs.leaderboard_config IS 'JSON configuration for leaderboard display and ranking';
COMMENT ON COLUMN clubs.wildcard_config IS 'JSON configuration for wildcard tournament features';
COMMENT ON COLUMN clubs.player_config IS 'JSON configuration for player management settings';