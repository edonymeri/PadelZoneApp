
export function expectedScore(ra: number, rb: number) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

export function updateEloTeamVsTeam(
  teamAEloAvg: number,
  teamBEloAvg: number,
  aWon: boolean,
  K = 16
) {
  const Ea = expectedScore(teamAEloAvg, teamBEloAvg);
  const Sa = aWon ? 1 : 0;
  const deltaA = Math.round(K * (Sa - Ea));
  return deltaA; // apply +deltaA to both A players, -deltaA to both B players
}
