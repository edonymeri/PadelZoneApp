import { supabase } from '@/lib/supabase';
import type { CourtMatch, UUID } from '@/lib/types';

export async function fetchHistoricalRound(eventId: string, roundNumber: number): Promise<CourtMatch[]> {
  const { data: roundData, error: roundError } = await supabase
    .from('rounds')
    .select('id, round_num')
    .eq('event_id', eventId)
    .eq('round_num', roundNumber)
    .single();

  if (roundError || !roundData) return [];

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('round_id', roundData.id);

  if (!matches) return [];

  return matches
    .filter(
      (m) =>
        m.team_a_player1 &&
        m.team_a_player2 &&
        m.team_b_player1 &&
        m.team_b_player2
    )
    .map((m) => ({
      court_num: m.court_num,
      teamA: [m.team_a_player1 as UUID, m.team_a_player2 as UUID],
      teamB: [m.team_b_player1 as UUID, m.team_b_player2 as UUID],
      scoreA: m.score_a || 0,
      scoreB: m.score_b || 0,
    }));
}
