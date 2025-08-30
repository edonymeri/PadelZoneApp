import { supabase } from '@/lib/supabase';

export interface Player {
  id: string;
  full_name: string;
  elo: number;
  club_id?: string | null;
  group_id?: string | null;
  photo_url?: string | null;
  created_at?: string;
  group?: PlayerGroup | null; // populated in queries with joins
}

export interface PlayerGroup {
  id: string;
  club_id: string;
  name: string;
  description?: string | null;
  color: string;
  sort_order: number;
  created_at?: string;
}

export interface PlayerStats {
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  eventsPlayed: number;
}

export class PlayerService {
  /**
   * Get all groups for a club
   */
  static async getPlayerGroups(clubId: string): Promise<PlayerGroup[]> {
    const { data, error } = await supabase
      .from('player_groups')
      .select('*')
      .eq('club_id', clubId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new player group
   */
  static async createPlayerGroup(group: Omit<PlayerGroup, 'id' | 'created_at'>): Promise<PlayerGroup> {
    const { data, error } = await supabase
      .from('player_groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a player group
   */
  static async updatePlayerGroup(groupId: string, updates: Partial<PlayerGroup>): Promise<PlayerGroup> {
    const { data, error } = await supabase
      .from('player_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a player group
   */
  static async deletePlayerGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('player_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  }
  /**
   * Get player by ID
   */
  static async getPlayer(playerId: string): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error) throw new Error(`Failed to load player: ${error.message}`);
    return data;
  }

  /**
   * Get players for a club
   */
  static async getClubPlayers(clubId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        group:player_groups(*)
      `)
      .eq('club_id', clubId)
      .order('full_name', { ascending: true });

    if (error) throw new Error(`Failed to load club players: ${error.message}`);
    return data || [];
  }

  /**
   * Create a new player
   */
  static async createPlayer(player: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single();

    if (error) throw new Error(`Failed to create player: ${error.message}`);
    return data;
  }

  /**
   * Update a player
   */
  static async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update player: ${error.message}`);
    return data;
  }

  /**
   * Delete a player
   */
  static async deletePlayer(playerId: string): Promise<void> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) throw new Error(`Failed to delete player: ${error.message}`);
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(playerId: string): Promise<PlayerStats> {
    try {
      // Get events this player has participated in
      const { data: eventRows, error: evErr } = await supabase
        .from('event_players')
        .select('event_id')
        .eq('player_id', playerId);

      if (evErr) throw evErr;

      const eventsPlayed = new Set((eventRows || []).map((r: any) => r.event_id as string)).size;

      // Get all rounds to find matches this player was in
      const { data: rounds } = await supabase
        .from('rounds')
        .select('id,event_id')
        .order('id', { ascending: true });

      const roundIds = (rounds || []).map((r: any) => r.id);
      let played = 0, won = 0, lost = 0, pointsFor = 0, pointsAgainst = 0;

      if (roundIds.length > 0) {
        // Get matches where this player participated
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .in('round_id', roundIds)
          .or(`team_a_player1.eq.${playerId},team_a_player2.eq.${playerId},team_b_player1.eq.${playerId},team_b_player2.eq.${playerId}`);

        for (const match of matches || []) {
          if (match.score_a == null || match.score_b == null) continue;

          const isTeamA = match.team_a_player1 === playerId || match.team_a_player2 === playerId;
          const myScore = isTeamA ? match.score_a : match.score_b;
          const opponentScore = isTeamA ? match.score_b : match.score_a;

          played++;
          pointsFor += myScore;
          pointsAgainst += opponentScore;

          if (myScore > opponentScore) won++;
          else if (myScore < opponentScore) lost++;
        }
      }

      return {
        played,
        won,
        lost,
        pointsFor,
        pointsAgainst,
        eventsPlayed
      };
    } catch (error: any) {
      console.warn('Failed to load player stats:', error.message);
      return {
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        eventsPlayed: 0
      };
    }
  }

  /**
   * Get player ELO history
   */
  static async getPlayerEloHistory(playerId: string): Promise<Array<{ date: string; elo: number }>> {
    const { data, error } = await supabase
      .from('elo_history')
      .select('elo_after, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to load ELO history:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      date: row.created_at?.split('T')[0] || 'Unknown',
      elo: row.elo_after
    }));
  }

  /**
   * Search players by name
   */
  static async searchPlayers(query: string, clubId?: string): Promise<Player[]> {
    let supabaseQuery = supabase
      .from('players')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .order('full_name', { ascending: true })
      .limit(20);

    if (clubId) {
      supabaseQuery = supabaseQuery.eq('club_id', clubId);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw new Error(`Failed to search players: ${error.message}`);
    return data || [];
  }

  /**
   * Get top players by ELO for a club
   */
  static async getTopPlayers(clubId?: string, limit = 10): Promise<Player[]> {
    let query = supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
      .limit(limit);

    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to load top players: ${error.message}`);
    return data || [];
  }
}
