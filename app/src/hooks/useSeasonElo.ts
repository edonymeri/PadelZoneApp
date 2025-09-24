// src/hooks/useSeasonElo.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type SeasonPlayer = { id: string; full_name: string; elo: number };

export function useSeasonElo(clubId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<SeasonPlayer[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!clubId) { 
          setPlayers([]); 
          setLoading(false); 
          return; 
        }
        const { data, error } = await supabase
          .from("players")
          .select("id, full_name, elo")
          .eq("club_id", clubId)
          .order("elo", { ascending: false })
          .limit(1000);
        if (error) throw error;
        setPlayers((data || []) as SeasonPlayer[]);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  return {
    players,
    loading,
    error
  };
}