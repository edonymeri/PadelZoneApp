// src/pages/NightlySeason.tsx
import type { UUID } from "@/lib/types";
import { MiniAvatar } from "@/components/nightly/MiniAvatar";
import { LeaderboardTable } from "@/components/nightly/LeaderboardTable";
import { SeasonEloList } from "@/components/nightly/SeasonEloList";
import { useNightlyLeaderboard } from "@/hooks/useNightlyLeaderboard";
import { useSeasonElo } from "@/hooks/useSeasonElo";

/* ========================= Nightly Leaderboard ========================= */

type PlayerRecord = { id: UUID; full_name: string; elo: number };
type NightlyProps = {
  eventId: string;
  players: Record<UUID, PlayerRecord>; // from EventControl (roster map)
};

/**
 * Shows one table: Player | Won | Lost | ± | Score
 * - Score = SUM(round_points.points) per player for this event
 * - Won/Lost/± derived from matches in all rounds of this event
 * - Player name and avatar link to /player/:id
 */
export function Nightly({ eventId, players }: NightlyProps) {
  const { leaderboardData, loading, error } = useNightlyLeaderboard(eventId);

  return (
    <LeaderboardTable
      eventId={eventId}
      players={players}
      leaderboardData={leaderboardData}
      loading={loading}
      error={error}
    />
  );
}

/* ============================== Season (ELO) ============================== */

type SeasonProps = { clubId: string };

export function Season({ clubId }: SeasonProps) {
  const { players, loading, error } = useSeasonElo(clubId);

  return <SeasonEloList players={players} loading={loading} error={error} />;
}
