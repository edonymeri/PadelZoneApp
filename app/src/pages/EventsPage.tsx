// src/pages/EventsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import EventCreationWizard from "@/components/event/EventCreationWizard";
import EventCard from "@/components/event/EventCard";
import { EventStats, EventFilters } from "@/components/event/EventFiltersAndStats";
// Removed unused EventCardSkeleton and EmptyState imports

type Ev = {
  id: string;
  name: string;
  courts: number;
  court_names?: string[];
  round_minutes: number | null;
  points_per_game: number | null;
  max_rounds: number | null;
  event_duration_hours: number | null;
  created_at?: string;
  ended_at?: string | null;
  club_id?: string | null;
  player_count?: number;
  rounds_count?: number;
  last_activity?: string | null;
};

type SortBy = "recent" | "name" | "players" | "courts" | "activity";

// ------- tiny cache helpers (sessionStorage) -------
const k = (id: string) => `ecache:${id}`;

async function prefetchEvent(eventId: string) {
  try {
    if (sessionStorage.getItem(k(eventId))) return;

    const [ev, eps, rounds] = await Promise.all([
      supabase
        .from("events")
        .select("id,name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,ended_at")
        .eq("id", eventId)
        .single(),
      supabase
        .from("event_players")
        .select("player_id, players!inner(id, full_name, elo)")
        .eq("event_id", eventId),
      supabase
        .from("rounds")
        .select("id, round_num, started_at")
        .eq("event_id", eventId)
        .order("round_num", { ascending: false })
        .limit(5),
    ]);
    if (!ev.data) return;

    // pick newest round that actually has matches
    let chosen = rounds.data?.[0] as any;
    let matches: any[] = [];
    if (rounds.data?.length) {
      for (const rr of rounds.data) {
        const ms = await supabase
          .from("matches")
          .select("*")
          .eq("round_id", rr.id)
          .order("court_num");
        if (ms.data?.length) {
          chosen = rr;
          matches = ms.data;
          break;
        }
      }
    }

    const payload = {
      meta: ev.data,
      players: (eps.data || []).map((r: any) => r.players),
      round: chosen || null,
      matches,
      cachedAt: Date.now(),
    };
    sessionStorage.setItem(k(eventId), JSON.stringify(payload));
  } catch {
    /* non-fatal */
  }
}

// ---------------------------------------------------



export default function EventsPage() {
  const { toast } = useToast();
  const clubId = useMemo(() => localStorage.getItem("clubId") || "", []);
  const [clubName, setClubName] = useState<string>("");
  const [events, setEvents] = useState<Ev[]>([]);
  const [orphans, setOrphans] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  // Enhanced state for new features
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [showCompleted, setShowCompleted] = useState(true);

  // Event creation wizard
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Enhanced filtering and sorting
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.player_count?.toString().includes(query) ||
        e.courts.toString().includes(query)
      );
    }

    // Apply status filter
    if (!showCompleted) {
      filtered = filtered.filter(e => !e.ended_at);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "players":
          return (b.player_count || 0) - (a.player_count || 0);
        case "courts":
          return b.courts - a.courts;
        case "activity":
          const aActivity = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          const bActivity = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          return bActivity - aActivity;
        case "recent":
        default:
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bCreated - aCreated;
      }
    });

    return sorted;
  }, [events, searchQuery, sortBy, showCompleted]);

  // Split filtered events
  const active = filteredAndSortedEvents.filter((e) => !e.ended_at);
  const completed = filteredAndSortedEvents.filter((e) => !!e.ended_at);

  async function load() {
    setLoading(true);
    let got: Ev[] = [];
    try {
      if (clubId) {
        // fetch club name (visual only)
        const { data: c } = await supabase.from("clubs").select("name").eq("id", clubId).single();
        setClubName(c?.name || clubId);

        const { data, error } = await supabase
          .from("events")
          .select("id,name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,ended_at,created_at,club_id")
          .or(`club_id.eq.${clubId},club_id.is.null`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        
        // Enhance events with statistics
        const enhancedEvents = await Promise.all((data || []).map(async (event: any) => {
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
            
            // Get last activity (most recent round with matches)
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
        
        got = enhancedEvents as Ev[];
      } else {
        setClubName("");
        const { data, error } = await supabase
          .from("events")
          .select("id,name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,ended_at,created_at,club_id")
          .is("club_id", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        
        // Enhance events with statistics
        const enhancedEvents = await Promise.all((data || []).map(async (event: any) => {
          try {
            const { count: playerCount } = await supabase
              .from("event_players")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            
            const { count: roundsCount } = await supabase
              .from("rounds")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id);
            
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
        
        got = enhancedEvents as Ev[];
      }
    } catch {
      // fallback if .or is blocked by RLS
      const res: Ev[] = [];
      if (clubId) {
        const { data: byClub } = await supabase
          .from("events")
          .select("id,name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,ended_at,created_at,club_id")
          .eq("club_id", clubId)
          .order("created_at", { ascending: false });
        if (byClub) res.push(...(byClub as Ev[]));
      }
      const { data: noClub } = await supabase
        .from("events")
        .select("id,name,courts,court_names,round_minutes,points_per_game,max_rounds,event_duration_hours,ended_at,created_at,club_id")
        .is("club_id", null)
        .order("created_at", { ascending: false });
      if (noClub) res.push(...(noClub as Ev[]));
      
      // Enhance fallback events with statistics
      const enhancedFallbackEvents = await Promise.all(res.map(async (event: any) => {
        try {
          const { count: playerCount } = await supabase
            .from("event_players")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          
          const { count: roundsCount } = await supabase
            .from("rounds")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          
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
          console.warn(`Failed to load stats for fallback event ${event.id}:`, e);
          return {
            ...event,
            player_count: 0,
            rounds_count: 0,
            last_activity: null
          };
        }
      }));
      
      got = enhancedFallbackEvents as Ev[];
    }

    setEvents(got);

    // orphans for attach tool
    const { data: oData } = await supabase
      .from("events")
      .select("id,name,created_at,club_id")
      .is("club_id", null)
      .order("created_at", { ascending: false })
      .limit(50);
    setOrphans((oData || []) as Ev[]);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);



  // Event creation handlers
  const handleEventCreated = () => {
    setShowCreateForm(false);
    load(); // Reload events to show the new one
  };

  const handleCancelCreation = () => {
    setShowCreateForm(false);
  };

  async function attachOrphansToCurrentClub() {
    if (!clubId) {
      toast({ variant: "destructive", title: "No club selected" });
      return;
    }
    if (orphans.length === 0) return;
    if (!confirm(`Attach ${orphans.length} orphan event(s) to this club?`)) return;
    setFixing(true);
    const { error } = await supabase.from("events").update({ club_id: clubId }).is("club_id", null);
    setFixing(false);
    if (error) {
      toast({ variant: "destructive", title: "Attach failed", description: error.message });
      return;
    }
    toast({ title: "Attached", description: "Orphan events linked to this club." });
    await load();
  }





  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Clean Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Events</h1>
              <p className="text-gray-600 text-base sm:text-lg">Manage your padel tournaments and track progress</p>
            </div>
          </div>
        </div>

        {/* Clean Active club banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Active club:</span>
                <span className="ml-2 font-semibold text-gray-900 text-base sm:text-sm">
                  {clubId ? (clubName || clubId) : "No club selected"}
                </span>
              </div>
            </div>
            <Link 
              to="/" 
              className="text-blue-600 hover:text-blue-800 font-medium text-base sm:text-sm transition-colors"
            >
              Switch Club
            </Link>
          </div>
        </div>

        {/* Event Creation */}
        {showCreateForm ? (
          <EventCreationWizard
            clubId={clubId}
            onEventCreated={handleEventCreated}
            onCancel={handleCancelCreation}
          />
        ) : (
          /* Clean Create Event Button */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">+</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Event</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Set up a new padel tournament with custom courts and player management.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={!clubId}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              Create Event
            </Button>
            {!clubId && (
              <p className="text-red-500 text-sm mt-3">
                Please select a club first
              </p>
            )}
          </div>
        )}

      {/* Summary Stats */}
      {!loading && <EventStats events={events} active={active} completed={completed} />}

        {/* Events Section */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first padel tournament event.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search and Filters */}
            <EventFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showCompleted={showCompleted}
              setShowCompleted={setShowCompleted}
              totalEvents={events.length}
              filteredEvents={filteredAndSortedEvents.length}
            />

            {/* Active Events */}
            {active.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Active Events</h2>
                  </div>
                  <span className="text-sm text-gray-500">{active.length} events</span>
                </div>
                <div className="space-y-4">
                  {active.map((e) => (
                    <EventCard key={e.id} e={e} isActive={true} prefetchEvent={prefetchEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Events */}
            {showCompleted && completed.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Completed Events</h2>
                  </div>
                  <span className="text-sm text-gray-500">{completed.length} events</span>
                </div>
                <div className="space-y-4">
                  {completed.map((e) => (
                    <EventCard key={e.id} e={e} isActive={false} prefetchEvent={prefetchEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* No events found */}
            {active.length === 0 && (!showCompleted || completed.length === 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to find events.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setShowCompleted(true);
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Orphans attach tool */}
        {orphans.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unassigned Events Found</h3>
                <p className="text-gray-600 mb-4">
                  Found {orphans.length} event{orphans.length > 1 ? 's' : ''} without a club assignment. 
                  Attach them to your current club to manage them properly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={attachOrphansToCurrentClub} 
                    disabled={!clubId || fixing}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {fixing ? "Attaching..." : "Attach to Current Club"}
                  </Button>
                  {!clubId && (
                    <p className="text-orange-600 text-sm self-center font-medium">
                      Please select a club first
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
