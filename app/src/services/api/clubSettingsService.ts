import { supabase } from '@/lib/supabase';
import type { 
  ClubSettings, 
  ScoringConfig, 
  TournamentDefaults, 
  BrandingConfig,
  EloConfig,
  LeaderboardConfig,
  WildcardConfig,
  PlayerConfig
} from '@/lib/clubSettings';
import { DEFAULT_CLUB_SETTINGS } from '@/lib/clubSettings';

export class ClubSettingsService {
  /**
   * Get all club settings for a specific club
   */
  static async getClubSettings(clubId: string): Promise<ClubSettings> {
    try {
      const { data: club, error } = await supabase
        .from('clubs')
        .select(`
          scoring_config,
          tournament_defaults,
          branding_config,
          elo_config,
          leaderboard_config,
          wildcard_config,
          player_config
        `)
        .eq('id', clubId)
        .single();

      if (error) {
        console.error('Error fetching club settings:', error);
        return DEFAULT_CLUB_SETTINGS;
      }

      // Merge with defaults to ensure all properties exist
      return {
        scoring_config: { ...DEFAULT_CLUB_SETTINGS.scoring_config, ...club.scoring_config },
        tournament_defaults: { ...DEFAULT_CLUB_SETTINGS.tournament_defaults, ...club.tournament_defaults },
        branding_config: { ...DEFAULT_CLUB_SETTINGS.branding_config, ...club.branding_config },
        elo_config: { ...DEFAULT_CLUB_SETTINGS.elo_config, ...club.elo_config },
        leaderboard_config: { ...DEFAULT_CLUB_SETTINGS.leaderboard_config, ...club.leaderboard_config },
        wildcard_config: { ...DEFAULT_CLUB_SETTINGS.wildcard_config, ...club.wildcard_config },
        player_config: { ...DEFAULT_CLUB_SETTINGS.player_config, ...club.player_config },
      };
    } catch (error) {
      console.error('Error in getClubSettings:', error);
      return DEFAULT_CLUB_SETTINGS;
    }
  }

  /**
   * Update specific configuration section
   */
  static async updateScoringConfig(clubId: string, config: Partial<ScoringConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          scoring_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating scoring config:', error);
      return false;
    }
  }

  static async updateTournamentDefaults(clubId: string, config: Partial<TournamentDefaults>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          tournament_defaults: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating tournament defaults:', error);
      return false;
    }
  }

  static async updateBrandingConfig(clubId: string, config: Partial<BrandingConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          branding_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating branding config:', error);
      return false;
    }
  }

  static async updateEloConfig(clubId: string, config: Partial<EloConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          elo_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating ELO config:', error);
      return false;
    }
  }

  static async updateLeaderboardConfig(clubId: string, config: Partial<LeaderboardConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          leaderboard_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating leaderboard config:', error);
      return false;
    }
  }

  static async updateWildcardConfig(clubId: string, config: Partial<WildcardConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          wildcard_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating wildcard config:', error);
      return false;
    }
  }

  static async updatePlayerConfig(clubId: string, config: Partial<PlayerConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          player_config: config
        })
        .eq('id', clubId);

      return !error;
    } catch (error) {
      console.error('Error updating player config:', error);
      return false;
    }
  }

  /**
   * Get a specific configuration section
   */
  static async getScoringConfig(clubId: string): Promise<ScoringConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.scoring_config;
  }

  static async getTournamentDefaults(clubId: string): Promise<TournamentDefaults> {
    const settings = await this.getClubSettings(clubId);
    return settings.tournament_defaults;
  }

  static async getBrandingConfig(clubId: string): Promise<BrandingConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.branding_config;
  }

  static async getEloConfig(clubId: string): Promise<EloConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.elo_config;
  }

  static async getLeaderboardConfig(clubId: string): Promise<LeaderboardConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.leaderboard_config;
  }

  static async getWildcardConfig(clubId: string): Promise<WildcardConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.wildcard_config;
  }

  static async getPlayerConfig(clubId: string): Promise<PlayerConfig> {
    const settings = await this.getClubSettings(clubId);
    return settings.player_config;
  }

  /**
   * Reset specific configuration to defaults
   */
  static async resetScoringConfig(clubId: string): Promise<boolean> {
    return this.updateScoringConfig(clubId, DEFAULT_CLUB_SETTINGS.scoring_config);
  }

  static async resetTournamentDefaults(clubId: string): Promise<boolean> {
    return this.updateTournamentDefaults(clubId, DEFAULT_CLUB_SETTINGS.tournament_defaults);
  }

  /**
   * Validate configuration values
   */
  static validateScoringConfig(config: Partial<ScoringConfig>): string[] {
    const errors: string[] = [];

    if (config.minPointsPerGame && config.maxPointsPerGame && config.minPointsPerGame >= config.maxPointsPerGame) {
      errors.push('Minimum points must be less than maximum points');
    }

    if (config.baseWinPoints && config.baseWinPoints < 0) {
      errors.push('Base win points cannot be negative');
    }

    if (config.marginBonusThreshold && config.marginBonusThreshold < 1) {
      errors.push('Margin bonus threshold must be at least 1');
    }

    if (config.winnersCourtBonusStartRound && config.winnersCourtBonusStartRound < 1) {
      errors.push('Winners court bonus start round must be at least 1');
    }

    return errors;
  }

  static validateTournamentDefaults(config: Partial<TournamentDefaults>): string[] {
    const errors: string[] = [];

    if (config.defaultCourts && config.defaultCourts < 1) {
      errors.push('Number of courts must be at least 1');
    }

    if (config.maxPlayersPerEvent && config.maxPlayersPerEvent < 4) {
      errors.push('Maximum players must be at least 4');
    }

    if (config.defaultTimePerGame && config.defaultTimePerGame < 1) {
      errors.push('Time per game must be at least 1 minute');
    }

    return errors;
  }
}