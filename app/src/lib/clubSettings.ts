// Club configuration types for dynamic settings

// Format-specific configuration interfaces
export interface FormatSpecificScoringConfig {
  baseWinPoints: number;
  marginBonusThreshold: number;
  marginBonusPoints: number;
  maxPointsPerMatch: number;
  winnersCourtBonusEnabled: boolean;
  winnersCourtBonusPoints: number;
  winnersCourtBonusStartRound: number;
}

export interface ScoringConfig {
  defaultPointsMode: 'points' | 'time';
  minPointsPerGame: number;
  maxPointsPerGame: number;
  defaultPointsPerGame: number;
  
  // Format-specific configurations
  winnersCourtConfig: FormatSpecificScoringConfig;
  americanoConfig: FormatSpecificScoringConfig;
  
  // Legacy fields for backward compatibility
  baseWinPoints: number;
  marginBonusThreshold: number;
  marginBonusPoints: number;
  maxPointsPerMatch: number;
  winnersCourtBonusEnabled: boolean;
  winnersCourtBonusPoints: number;
  winnersCourtBonusStartRound: number;
}

// Format-specific ELO configuration
export interface FormatSpecificEloConfig {
  kFactor: number;
  eloFloor: number;
  eloCeiling: number;
  maxEloGainPerMatch: number;
  maxEloLossPerMatch: number;
}

export interface EloConfig {
  enabled: boolean;
  startingElo: number;
  showEloToPlayers: boolean;
  eloDecayEnabled: boolean;
  eloDecayRate: number;
  
  // Format-specific configurations
  winnersCourtConfig: FormatSpecificEloConfig;
  americanoIndividualConfig: FormatSpecificEloConfig;
  americanoTeamConfig: FormatSpecificEloConfig;
  
  // Legacy fields for backward compatibility
  kFactor: number;
  eloFloor: number;
  eloCeiling: number;
}

// Format-aware player management
export interface PlayerManagementConfig {
  allowPartialFill: boolean;
  autoFillFromWaitlist: boolean;
  maxPlayersPerEvent: number;
  
  // Format-specific constraints
  winnersCourtMinPlayers: number;
  winnersCourtMaxPlayers: number;
  americanoMinPlayers: number;
  americanoMaxPlayers: number;
  americanoRequireEvenPlayers: boolean;
  americanoRequireCompleteRotation: boolean;
}

export interface TournamentDefaults {
  defaultFormat: 'winners-court' | 'americano';
  defaultScoringMode: 'points' | 'time';
  defaultTimePerGame: number;
  defaultCourts: number;
  maxPlayersPerEvent: number;
  enableRoundLimits: boolean;
  defaultMaxRounds: number | null;
  enableTimeLimits: boolean;
  defaultMaxDuration: number | null;
}

export interface BrandingConfig {
  useCustomCourtNames: boolean;
  customCourtNames: string[];
  eventTerminology: string;
  playerTerminology: string;
}

export interface EloConfig {
  enabled: boolean;
  startingElo: number;
  kFactor: number;
  showEloToPlayers: boolean;
  eloDecayEnabled: boolean;
  eloDecayRate: number;
  eloFloor: number;
  eloCeiling: number;
}

export interface LeaderboardConfig {
  displayStats: string[];
  sortPriority: ('total_score' | 'games_won' | 'goal_difference' | 'elo')[];
  showHistoricalRankings: boolean;
  rankingPeriods: ('weekly' | 'monthly' | 'season' | 'all-time')[];
  
  // Format-specific leaderboard configurations
  winnersCourtStats: string[];
  americanoStats: string[];
  individualModeStats: string[];
  teamModeStats: string[];
}

export interface WildcardConfig {
  enabledByDefault: boolean;
  defaultFrequency: number;
  defaultIntensity: 'mild' | 'medium' | 'mayhem';
  defaultStartRound: number;
  allowMidTournament: boolean;
  
  // Format-specific wildcard rules
  enabledForWinnersCourt: boolean;
  enabledForAmericano: boolean;
}

export interface PlayerConfig {
  // Basic player management
  requirePlayerApproval: boolean;
  allowGuestPlayers: boolean;
  maxGuestsPerEvent: number;
  guestNamingPattern: string;
  requirePlayerEmails: boolean;
  enablePlayerProfiles: boolean;
  
  // Advanced player management
  allowPartialFill: boolean;
  autoFillFromWaitlist: boolean;
  maxPlayersPerEvent: number;
  
  // Format-specific constraints
  winnersCourtMinPlayers: number;
  winnersCourtMaxPlayers: number;
  americanoMinPlayers: number;
  americanoMaxPlayers: number;
  americanoRequireEvenPlayers: boolean;
  americanoRequireCompleteRotation: boolean;
}

export interface ClubSettings {
  scoring_config: ScoringConfig;
  tournament_defaults: TournamentDefaults;
  branding_config: BrandingConfig;
  elo_config: EloConfig;
  leaderboard_config: LeaderboardConfig;
  wildcard_config: WildcardConfig;
  player_config: PlayerConfig;
}

// Default configurations (fallbacks)
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  defaultPointsMode: 'points',
  minPointsPerGame: 10,
  maxPointsPerGame: 21,
  defaultPointsPerGame: 21,
  
  // Format-specific configurations
  winnersCourtConfig: {
    baseWinPoints: 3,
    marginBonusThreshold: 10,
    marginBonusPoints: 1,
    maxPointsPerMatch: 5,
    winnersCourtBonusEnabled: true,
    winnersCourtBonusPoints: 1,
    winnersCourtBonusStartRound: 5,
  },
  americanoConfig: {
    baseWinPoints: 2,
    marginBonusThreshold: 8,
    marginBonusPoints: 1,
    maxPointsPerMatch: 4,
    winnersCourtBonusEnabled: false,
    winnersCourtBonusPoints: 0,
    winnersCourtBonusStartRound: 999,
  },
  
  // Legacy fields for backward compatibility
  baseWinPoints: 3,
  marginBonusThreshold: 10,
  marginBonusPoints: 1,
  maxPointsPerMatch: 5,
  winnersCourtBonusEnabled: true,
  winnersCourtBonusPoints: 1,
  winnersCourtBonusStartRound: 5,
};

export const DEFAULT_TOURNAMENT_DEFAULTS: TournamentDefaults = {
  defaultFormat: 'winners-court',
  defaultScoringMode: 'points',
  defaultTimePerGame: 12,
  defaultCourts: 4,
  maxPlayersPerEvent: 32,
  enableRoundLimits: false,
  defaultMaxRounds: null,
  enableTimeLimits: false,
  defaultMaxDuration: null,
};

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  useCustomCourtNames: false,
  customCourtNames: [],
  eventTerminology: 'Tournament',
  playerTerminology: 'Player',
};

export const DEFAULT_ELO_CONFIG: EloConfig = {
  enabled: true,
  startingElo: 1000,
  showEloToPlayers: true,
  eloDecayEnabled: false,
  eloDecayRate: 0,
  
  // Format-specific configurations
  winnersCourtConfig: {
    kFactor: 20,
    eloFloor: 0,
    eloCeiling: 3000,
    maxEloGainPerMatch: 50,
    maxEloLossPerMatch: 50,
  },
  americanoIndividualConfig: {
    kFactor: 16,
    eloFloor: 0,
    eloCeiling: 2500,
    maxEloGainPerMatch: 30,
    maxEloLossPerMatch: 30,
  },
  americanoTeamConfig: {
    kFactor: 12,
    eloFloor: 0,
    eloCeiling: 2500,
    maxEloGainPerMatch: 25,
    maxEloLossPerMatch: 25,
  },
  
  // Legacy fields for backward compatibility
  kFactor: 16,
  eloFloor: 0,
  eloCeiling: 3000,
};

export const DEFAULT_LEADERBOARD_CONFIG: LeaderboardConfig = {
  displayStats: ['total_score', 'games_won', 'goal_difference', 'elo'],
  sortPriority: ['total_score', 'games_won', 'goal_difference'],
  showHistoricalRankings: true,
  rankingPeriods: ['weekly', 'monthly', 'all-time'],
  
  // Format-specific leaderboard configurations
  winnersCourtStats: ['total_score', 'games_won', 'court_promotions', 'elo'],
  americanoStats: ['total_score', 'games_won', 'partnership_variety', 'elo'],
  individualModeStats: ['individual_score', 'matches_played', 'win_rate', 'elo'],
  teamModeStats: ['team_score', 'team_wins', 'partnership_wins', 'team_elo'],
};

export const DEFAULT_WILDCARD_CONFIG: WildcardConfig = {
  enabledByDefault: false,
  defaultFrequency: 3,
  defaultIntensity: 'medium',
  defaultStartRound: 5,
  allowMidTournament: true,
  
  // Format-specific wildcard rules
  enabledForWinnersCourt: true,
  enabledForAmericano: false,
};

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  // Basic player management
  requirePlayerApproval: false,
  allowGuestPlayers: true,
  maxGuestsPerEvent: 4,
  guestNamingPattern: 'Guest {number}',
  requirePlayerEmails: false,
  enablePlayerProfiles: true,
  
  // Advanced player management
  allowPartialFill: true,
  autoFillFromWaitlist: false,
  maxPlayersPerEvent: 32,
  
  // Format-specific constraints
  winnersCourtMinPlayers: 8,
  winnersCourtMaxPlayers: 32,
  americanoMinPlayers: 8,
  americanoMaxPlayers: 24,
  americanoRequireEvenPlayers: false,
  americanoRequireCompleteRotation: true,
};

// Utility functions for format-specific configuration
export function getFormatSpecificScoringConfig(
  scoringConfig: ScoringConfig, 
  format: 'winners-court' | 'americano'
): FormatSpecificScoringConfig {
  return format === 'winners-court' 
    ? scoringConfig.winnersCourtConfig 
    : scoringConfig.americanoConfig;
}

export function getFormatSpecificEloConfig(
  eloConfig: EloConfig, 
  format: 'winners-court' | 'americano',
  variant?: 'individual' | 'team'
): FormatSpecificEloConfig {
  if (format === 'winners-court') {
    return eloConfig.winnersCourtConfig;
  }
  
  // Americano format
  return variant === 'team' 
    ? eloConfig.americanoTeamConfig 
    : eloConfig.americanoIndividualConfig;
}

export function getFormatSpecificLeaderboardStats(
  leaderboardConfig: LeaderboardConfig,
  format: 'winners-court' | 'americano',
  variant?: 'individual' | 'team'
): string[] {
  if (format === 'winners-court') {
    return leaderboardConfig.winnersCourtStats;
  }
  
  // Americano format
  if (variant === 'individual') {
    return leaderboardConfig.individualModeStats;
  } else if (variant === 'team') {
    return leaderboardConfig.teamModeStats;
  }
  
  return leaderboardConfig.americanoStats;
}

export function validatePlayerCountForFormat(
  playerCount: number,
  format: 'winners-court' | 'americano',
  playerConfig: PlayerConfig,
  options?: { courts?: number }
): { valid: boolean; message?: string } {
  if (format === 'winners-court') {
    if (playerCount < playerConfig.winnersCourtMinPlayers) {
      return { 
        valid: false, 
        message: `Winners Court requires at least ${playerConfig.winnersCourtMinPlayers} players` 
      };
    }
    if (playerCount > playerConfig.winnersCourtMaxPlayers) {
      return { 
        valid: false, 
        message: `Winners Court supports maximum ${playerConfig.winnersCourtMaxPlayers} players` 
      };
    }
  } else {
    // Americano format
    if (playerCount < playerConfig.americanoMinPlayers) {
      return { 
        valid: false, 
        message: `Americano requires at least ${playerConfig.americanoMinPlayers} players` 
      };
    }
    if (playerCount > playerConfig.americanoMaxPlayers) {
      return { 
        valid: false, 
        message: `Americano supports maximum ${playerConfig.americanoMaxPlayers} players` 
      };
    }
    const courts = options?.courts;
    const basePlayers = courts ? courts * 4 : undefined;
    const allowsSingleRest = basePlayers !== undefined && playerCount === basePlayers + 1;

    if (playerConfig.americanoRequireEvenPlayers && playerCount % 2 !== 0 && !allowsSingleRest) {
      return { 
        valid: false, 
        message: 'Americano requires an even number of players' 
      };
    }

    if (!playerConfig.americanoRequireEvenPlayers && playerCount % 2 !== 0 && !allowsSingleRest) {
      if (basePlayers) {
        return {
          valid: false,
          message: `With ${courts} court${courts === 1 ? '' : 's'}, roster either ${basePlayers} or ${basePlayers + 1} players so rounds stay balanced`
        };
      }
      return { 
        valid: false, 
        message: 'Americano supports at most one rotating rest slot each round' 
      };
    }

    if (basePlayers && playerCount < basePlayers) {
      return {
        valid: false,
        message: `Americano with ${courts} court${courts === 1 ? '' : 's'} needs at least ${basePlayers} players`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Get format-specific leaderboard configuration
 */
export function getFormatSpecificLeaderboardConfig(
  format: 'winners-court' | 'americano',
  variant: 'individual' | 'team' | null,
  leaderboardConfig: LeaderboardConfig
): { displayStats: string[]; sortPriority: string[] } {
  let displayStats: string[];
  
  if (format === 'winners-court') {
    displayStats = leaderboardConfig.winnersCourtStats.length > 0 
      ? leaderboardConfig.winnersCourtStats 
      : leaderboardConfig.displayStats;
  } else {
    // Americano format
    displayStats = leaderboardConfig.americanoStats.length > 0 
      ? leaderboardConfig.americanoStats 
      : leaderboardConfig.displayStats;
  }
  
  // Further refine by individual vs team mode
  if (variant === 'individual' && leaderboardConfig.individualModeStats.length > 0) {
    displayStats = leaderboardConfig.individualModeStats;
  } else if (variant === 'team' && leaderboardConfig.teamModeStats.length > 0) {
    displayStats = leaderboardConfig.teamModeStats;
  }
  
  return {
    displayStats,
    sortPriority: leaderboardConfig.sortPriority
  };
}

/**
 * Check if wildcards are enabled for a specific format
 */
export function isWildcardEnabledForFormat(
  format: 'winners-court' | 'americano',
  wildcardConfig: WildcardConfig
): boolean {
  if (format === 'winners-court') {
    return wildcardConfig.enabledForWinnersCourt;
  } else {
    return wildcardConfig.enabledForAmericano;
  }
}

export const DEFAULT_CLUB_SETTINGS: ClubSettings = {
  scoring_config: DEFAULT_SCORING_CONFIG,
  tournament_defaults: DEFAULT_TOURNAMENT_DEFAULTS,
  branding_config: DEFAULT_BRANDING_CONFIG,
  elo_config: DEFAULT_ELO_CONFIG,
  leaderboard_config: DEFAULT_LEADERBOARD_CONFIG,
  wildcard_config: DEFAULT_WILDCARD_CONFIG,
  player_config: DEFAULT_PLAYER_CONFIG,
};