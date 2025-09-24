// src/hooks/useNightlyLeaderboard.ts
import { useState, useEffect } from "react";
import { calculateEventLeaderboard } from "@/lib/leaderboard";

export function useNightlyLeaderboard(eventId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await calculateEventLeaderboard(eventId);
        setLeaderboardData(data);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  return {
    leaderboardData,
    loading,
    error
  };
}