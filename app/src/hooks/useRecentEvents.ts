import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EvMeta = {
  id: string;
  name: string;
  courts: number;
  round_minutes: number | null;
  points_per_game: number | null;
  ended_at?: string | null;
  created_at?: string | null;
  club_id?: string | null;
  player_count?: number;
  rounds_count?: number;
  last_activity?: string | null;
};

export function useRecentEvents() {
  const [recentEvents, setRecentEvents] = useState<EvMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "players" | "courts">("recent");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const clubId = localStorage.getItem("clubId") || "";

      try {
        let rows: EvMeta[] = [];
        if (clubId) {
          // Try OR (club or null). If RLS / PostgREST blocks .or, fall back below.
          const { data, error } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .or(`club_id.eq.${clubId},club_id.is.null`)
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          rows = (data || []) as EvMeta[];
        } else {
          // No club selected: just grab latest across all (RLS will still scope)
          const { data, error } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          rows = (data || []) as EvMeta[];
        }

        // Fallback if OR failed / returned nothing but we DO have a clubId
        if (rows.length === 0 && clubId) {
          const combined: EvMeta[] = [];
          const { data: byClub } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .eq("club_id", clubId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (byClub) combined.push(...(byClub as EvMeta[]));

          const { data: noClub } = await supabase
            .from("events")
            .select(
              "id,name,courts,round_minutes,points_per_game,ended_at,created_at,club_id"
            )
            .is("club_id", null)
            .order("created_at", { ascending: false })
            .limit(20);
          if (noClub) combined.push(...(noClub as EvMeta[]));

          rows = combined;
        }

        // Enhance events with statistics
        const enhancedEvents = await Promise.all(rows.map(async (event: any) => {
          try {
            // Get player count
            const { count: playerCount } = await supabase
              .from("event_players")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            
            // Get rounds count
            const { count: roundsCount } = await supabase
              .from("rounds")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            
            // Get last activity
            const { data: lastRound } = await supabase
              .from("rounds")
              .select("created_at")
              .eq("event_id", event.id)
              .order("created_at", { ascending: false })
              .limit(1);
            
            return {
              ...event,
              player_count: playerCount || 0,
              rounds_count: roundsCount || 0,
              last_activity: lastRound?.[0]?.created_at || null
            };
          } catch (e) {
            console.warn(`Failed to load stats for event ${event.id}:`, e);
            return {
              ...event,
              player_count: 0,
              rounds_count: 0,
              last_activity: null
            };
          }
        }));
        
        setRecentEvents(enhancedEvents);
      } catch (err: any) {
        console.warn("Scoreboard recent events fetch error:", err?.message || err);
        setErrorMsg("Could not load recent events.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortEvents = (events: EvMeta[]) => {
    switch (sortBy) {
      case "name":
        return events.sort((a, b) => a.name.localeCompare(b.name));
      case "players":
        return events.sort((a, b) => (b.player_count || 0) - (a.player_count || 0));
      case "courts":
        return events.sort((a, b) => (b.courts || 0) - (a.courts || 0));
      case "recent":
      default:
        return events.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
    }
  };

  return {
    recentEvents,
    loading,
    errorMsg,
    sortBy,
    setSortBy,
    sortEvents,
  };
}



