/**
 * Americano Tournament Scoring System
 * 
 * In Americano format, each player earns individual points based on their team's performance.
 * Key principles:
 * - Each player gets their team's score as individual points
 * - No court hierarchy bonuses (all courts are equal)
 * - No special bonuses for defending or promoting
 * - Simple, transparent scoring system
 */

/**
 * Calculate points for a player in Americano format
 * @param opts Scoring options
 * @returns Points earned by the player
 */
export function americanoPointsForPlayer(opts: {
  teamScore: number;        // The score of the player's team
  won: boolean;            // Whether the team won
  court: number;           // Court number (for reference, no bonus)
}) {
  // In Americano, each player gets their team's score as individual points
  // This is the core difference from Winner's Court format
  return opts.teamScore;
}

/**
 * Calculate round points for all players in an Americano match
 * @param courtMatch The court match with scores
 * @returns Array of individual player points
 */
export function calculateAmericanoRoundPoints(courtMatch: {
  court_num: number;
  teamA: [string, string];
  teamB: [string, string];
  scoreA?: number;
  scoreB?: number;
}) {
  const points: Array<{
    playerId: string;
    points: number;
    court: number;
    teamScore: number;
    won: boolean;
  }> = [];

  if (courtMatch.scoreA === undefined || courtMatch.scoreB === undefined) {
    return points; // Return empty if scores not entered
  }

  const teamAWon = courtMatch.scoreA > courtMatch.scoreB;
  const teamBWon = courtMatch.scoreB > courtMatch.scoreA;

  // Team A players
  courtMatch.teamA.forEach(playerId => {
    points.push({
      playerId,
      points: americanoPointsForPlayer({
        teamScore: courtMatch.scoreA!,
        won: teamAWon,
        court: courtMatch.court_num
      }),
      court: courtMatch.court_num,
      teamScore: courtMatch.scoreA!,
      won: teamAWon
    });
  });

  // Team B players
  courtMatch.teamB.forEach(playerId => {
    points.push({
      playerId,
      points: americanoPointsForPlayer({
        teamScore: courtMatch.scoreB!,
        won: teamBWon,
        court: courtMatch.court_num
      }),
      court: courtMatch.court_num,
      teamScore: courtMatch.scoreB!,
      won: teamBWon
    });
  });

  return points;
}

/**
 * Determine Americano tournament winners
 * Winner is the player with the highest total individual points
 */
export function determineAmericanoWinners(playerStats: Array<{
  player_id: string;
  total_score: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}>) {
  if (playerStats.length === 0) return [];

  // Sort by total score (primary), then by games won (tiebreaker)
  const sorted = playerStats.sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    // Tiebreaker: games won
    return b.games_won - a.games_won;
  });

  const highestScore = sorted[0].total_score;
  
  // Return all players with the highest score (handles ties)
  return sorted.filter(player => player.total_score === highestScore);
}

/**
 * Calculate individual statistics for Americano format
 * This is simpler than Winner's Court as there are no court-specific bonuses
 */
export function calculateAmericanoPlayerStats(
  playerId: string,
  allMatches: Array<{
    team_a_player1: string;
    team_a_player2: string;
    team_b_player1: string;
    team_b_player2: string;
    score_a: number;
    score_b: number;
  }>,
  allRoundPoints: Array<{
    player_id: string;
    points: number;
  }>
) {
  let totalScore = 0;
  let gamesPlayed = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  // Calculate from round points
  allRoundPoints
    .filter(rp => rp.player_id === playerId)
    .forEach(rp => {
      totalScore += rp.points;
    });

  // Calculate from matches
  allMatches.forEach(match => {
    const isTeamA = match.team_a_player1 === playerId || match.team_a_player2 === playerId;
    const isTeamB = match.team_b_player1 === playerId || match.team_b_player2 === playerId;
    
    if (isTeamA || isTeamB) {
      gamesPlayed++;
      
      if (isTeamA) {
        goalsFor += match.score_a;
        goalsAgainst += match.score_b;
        if (match.score_a > match.score_b) {
          gamesWon++;
        } else {
          gamesLost++;
        }
      } else {
        goalsFor += match.score_b;
        goalsAgainst += match.score_a;
        if (match.score_b > match.score_a) {
          gamesWon++;
        } else {
          gamesLost++;
        }
      }
    }
  });

  return {
    player_id: playerId,
    total_score: totalScore,
    games_played: gamesPlayed,
    games_won: gamesWon,
    games_lost: gamesLost,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_difference: goalsFor - goalsAgainst
  };
}
