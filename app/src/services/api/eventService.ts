import { supabase } from '@/lib/supabase';
import type { UUID } from '@/lib/types';

export interface Event {
  id: string;
  name: string;
  mode?: string;
  courts: number;
  court_names?: string[]; // ["Winners Court", "Court 2", etc.]
  round_minutes: number;
  points_per_game?: number;
  max_rounds?: number;
  event_duration_hours?: number;
  wildcard_enabled?: boolean;
  wildcard_start_round?: number;
  wildcard_frequency?: number;
  wildcard_intensity?: 'mild' | 'medium' | 'mayhem';
  ended_at?: string | null;
  created_at?: string;
  club_id?: string | null;
  public_code?: string;
}

export interface EventPlayer {
  event_id: string;
  player_id: string;
  players: {
    id: string;
    full_name: string;
    elo: number;
  };
}

export interface Round {
  id: string;
  event_id: string;
  round_num: number;
  finished: boolean;
  started_at?: string;
  created_at?: string;
}

export interface Match {
  id: string;
  round_id: string;
  court_num: number;
  team_a_player1: string;
  team_a_player2: string;
  team_b_player1: string;
  team_b_player2: string;
  score_a?: number;
  score_b?: number;
  created_at?: string;
}

export class EventService {
  /**
   * Get event by ID
   */
  static async getEvent(eventId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw new Error(`Failed to load event: ${error.message}`);
    return data;
  }

  /**
   * Get all events for a club (or public events)
   */
  static async getEvents(clubId?: string): Promise<Event[]> {
    const query = supabase
      .from('events')
      .select('id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id')
      .order('created_at', { ascending: false });

    if (clubId) {
      // Try OR query first, fallback if RLS blocks it
      try {
        const { data, error } = await query.or(`club_id.eq.${clubId},club_id.is.null`);
        if (error) throw error;
        return data || [];
      } catch {
        // Fallback: separate queries
        const [clubEvents, publicEvents] = await Promise.all([
          supabase.from('events').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
          supabase.from('events').select('*').is('club_id', null).order('created_at', { ascending: false })
        ]);
        
        return [...(clubEvents.data || []), ...(publicEvents.data || [])];
      }
    } else {
      const { data, error } = await query.is('club_id', null);
      if (error) throw new Error(`Failed to load events: ${error.message}`);
      return data || [];
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to create event: ${error.message}`);
    return data;
  }

  /**
   * Update an event
   */
  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update event: ${error.message}`);
    return data;
  }

  /**
   * Get players for an event
   */
  static async getEventPlayers(eventId: string): Promise<EventPlayer[]> {
    const { data, error } = await supabase
      .from('event_players')
      .select('event_id, player_id, players!inner(id, full_name, elo)')
      .eq('event_id', eventId);

    if (error) throw new Error(`Failed to load event players: ${error.message}`);
    const normalized = (data || []).map((row: any) => ({
      event_id: row.event_id,
      player_id: row.player_id,
      players: Array.isArray(row.players) ? row.players[0] : row.players,
    })) as EventPlayer[];
    return normalized;
  }

  /**
   * Add players to an event
   */
  static async addPlayersToEvent(eventId: string, playerIds: string[]): Promise<void> {
    const inserts = playerIds.map(playerId => ({ event_id: eventId, player_id: playerId }));
    
    const { error } = await supabase
      .from('event_players')
      .insert(inserts);

    if (error) throw new Error(`Failed to add players to event: ${error.message}`);
  }

  /**
   * Remove players from an event
   */
  static async removePlayersFromEvent(eventId: string, playerIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .in('player_id', playerIds);

    if (error) throw new Error(`Failed to remove players from event: ${error.message}`);
  }

  /**
   * Get rounds for an event
   */
  static async getEventRounds(eventId: string): Promise<Round[]> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_num', { ascending: true });

    if (error) throw new Error(`Failed to load event rounds: ${error.message}`);
    return data || [];
  }

  /**
   * Create a new round
   */
  static async createRound(eventId: string, roundNum: number): Promise<Round> {
    const { data, error } = await supabase
      .from('rounds')
      .insert({ event_id: eventId, round_num: roundNum })
      .select()
      .single();

    if (error) throw new Error(`Failed to create round: ${error.message}`);
    return data;
  }

  /**
   * Get matches for a round
   */
  static async getRoundMatches(roundId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('round_id', roundId)
      .order('court_num', { ascending: true });

    if (error) throw new Error(`Failed to load round matches: ${error.message}`);
    return data || [];
  }

  /**
   * Update match score
   */
  static async updateMatchScore(
    roundId: string, 
    courtNum: number, 
    scoreA: number, 
    scoreB: number
  ): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ score_a: scoreA, score_b: scoreB })
      .eq('round_id', roundId)
      .eq('court_num', courtNum);

    if (error) throw new Error(`Failed to update match score: ${error.message}`);
  }

  /**
   * Create matches for a round
   */
  static async createMatches(matches: Omit<Match, 'id' | 'created_at'>[]): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .insert(matches)
      .select();

    if (error) throw new Error(`Failed to create matches: ${error.message}`);
    return data || [];
  }

  /**
   * Get latest round with matches for an event
   */
  static async getLatestRoundWithMatches(eventId: string): Promise<{
    round: Round | null;
    matches: Match[];
  }> {
    // Get rounds ordered by round_num descending
    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_num', { ascending: false });

    if (roundsError) throw new Error(`Failed to load rounds: ${roundsError.message}`);

    if (!rounds || rounds.length === 0) {
      return { round: null, matches: [] };
    }

    // Find the latest round that has matches
    for (const round of rounds) {
      const matches = await this.getRoundMatches(round.id);
      if (matches.length > 0) {
        return { round, matches };
      }
    }

    // If no rounds have matches, return the latest round with empty matches
    return { round: rounds[0], matches: [] };
  }

  /**
   * Get round points for an event
   */
  static async getRoundPoints(eventId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('round_points')
      .select('*')
      .eq('event_id', eventId)
      .order('points', { ascending: false });

    if (error) throw new Error(`Failed to load round points: ${error.message}`);
    return data || [];
  }

  /**
   * Get ELO history for an event
   */
  static async getEloHistory(eventId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('elo_history')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to load ELO history: ${error.message}`);
    return data || [];
  }
}
