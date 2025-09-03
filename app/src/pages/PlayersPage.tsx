// src/pages/PlayersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { UUID } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PlayerCardSkeleton, EmptyState } from "@/components/ui/skeleton";
import { Users, Trophy, Target, TrendingUp, Award, UserPlus, Search, SortAsc, ArrowLeft, Crown, Star, Filter, Tag } from "lucide-react";
import { PlayerService, PlayerGroup } from "@/services/api/playerService";
import { GAME_CONFIG } from "@/utils/constants";

/** Avatars consistent with other pages */
function colorForName(name?: string) {
  const palette = ["#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#14B8A6","#A855F7","#EAB308","#22C55E","#EC4899"];
  if (!name) return palette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
function initials(name?: string) {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  const s = (i1 + i2).toUpperCase();
  return s || i1.toUpperCase() || "–";
}
function Avatar({ name, size = "sm" }: { name?: string; size?: "sm" | "md" | "lg" }) {
  const bg = colorForName(name);
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm", 
    lg: "h-16 w-16 text-lg"
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full grid place-content-center font-semibold shadow-lg transition-transform hover:scale-105`} style={{ background: bg, color: "white" }}>
      {initials(name)}
    </div>
  );
}

type Player = { 
  id: UUID; 
  full_name: string; 
  elo: number;
  group_id?: string;
  group?: PlayerGroup;
  events_played?: number;
  games_played?: number;
  win_rate?: number;
  total_points?: number;
};
type Ev = { id: UUID; courts: number; name: string };

export default function PlayersPage() {
  const [params] = useSearchParams();
  const eventId = params.get("eventId");
  const clubId = localStorage.getItem("clubId") || "";
  const { toast } = useToast?.() || { toast: (x: any) => alert(x?.description || x?.title || "Notice") };

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [inEvent, setInEvent] = useState<Set<string>>(new Set());
  const [eventMeta, setEventMeta] = useState<Ev | null>(null);

  const [filter, setFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [newName, setNewName] = useState("");
  const [newPlayerGroup, setNewPlayerGroup] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "elo" | "events" | "games" | "winrate">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Load club players + groups + event roster if eventId present
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        console.log("Loading players for clubId:", clubId);
        
        if (!clubId) {
          console.warn("No clubId found");
          setLoading(false);
          return;
        }

        // Load groups first (with fallback if table doesn't exist)
        console.log("Loading groups...");
        let groupsData = [];
        try {
          groupsData = await PlayerService.getPlayerGroups(clubId);
          console.log("Groups loaded:", groupsData);
        } catch (error) {
          console.warn("Groups table not found or error loading groups:", error);
          groupsData = [];
        }
        setGroups(groupsData);
        
        // Load players with group data (with fallback)
        console.log("Loading players...");
        let playersData = [];
        try {
          playersData = await PlayerService.getClubPlayers(clubId);
          console.log("Players data from PlayerService:", playersData);
        } catch (error) {
          console.warn("Error loading players with groups, falling back to basic query:", error);
          // Fallback to basic players query
          const { data: basicPlayers, error: basicError } = await supabase
          .from("players")
          .select("id, full_name, elo, club_id")
          .eq("club_id", clubId)
          .order("full_name");
          if (basicError) throw basicError;
          playersData = basicPlayers || [];
          console.log("Basic players data:", playersData);
        }
        
        // Convert to the expected format
        const ps = playersData.map(p => ({
          id: p.id,
          full_name: p.full_name,
          elo: p.elo,
          club_id: p.club_id,
          group_id: p.group_id,
          group: p.group
        }));
        console.log("Converted players:", ps);
        
        // Enhance players with statistics
        const enhancedPlayers = await Promise.all((ps || []).map(async (player: any) => {
          try {
            // Get events played count
            const { count: eventsCount } = await supabase
              .from("event_players")
              .select("*", { count: "exact", head: true })
              .eq("player_id", player.id);
            
            // Get games played and win rate
            const { data: matches } = await supabase
              .from("matches")
              .select("team_a_player1, team_a_player2, team_b_player1, team_b_player2, score_a, score_b")
              .or(`team_a_player1.eq.${player.id},team_a_player2.eq.${player.id},team_b_player1.eq.${player.id},team_b_player2.eq.${player.id}`)
              .not("score_a", "is", null)
              .not("score_b", "is", null);
            
            let gamesPlayed = 0, gamesWon = 0;
            if (matches) {
              gamesPlayed = matches.length;
              gamesWon = matches.filter((m: any) => {
                const onTeamA = m.team_a_player1 === player.id || m.team_a_player2 === player.id;
                const teamAScore = m.score_a || 0;
                const teamBScore = m.score_b || 0;
                return onTeamA ? teamAScore > teamBScore : teamBScore > teamAScore;
              }).length;
            }
            
            // Get total points
            const { data: points } = await supabase
              .from("round_points")
              .select("points")
              .eq("player_id", player.id);
            const totalPoints = (points || []).reduce((sum: number, r: any) => sum + (r.points || 0), 0);
            
            return {
              ...player,
              events_played: eventsCount || 0,
              games_played: gamesPlayed,
              win_rate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
              total_points: totalPoints
            };
          } catch (e) {
            console.warn(`Failed to load stats for player ${player.id}:`, e);
            return {
              ...player,
              events_played: 0,
              games_played: 0,
              win_rate: 0,
              total_points: 0
            };
          }
        }));
        
        setPlayers(enhancedPlayers as Player[]);

        if (eventId) {
          const { data: ev, error: eErr } = await supabase
            .from("events")
            .select("id, courts, name")
            .eq("id", eventId)
            .single();
          if (eErr) throw eErr;
          setEventMeta(ev as Ev);

          const { data: eps, error: epErr } = await supabase
            .from("event_players")
            .select("player_id")
            .eq("event_id", eventId);
          if (epErr) throw epErr;
          setInEvent(new Set((eps || []).map((r: any) => r.player_id as string)));
        } else {
          setEventMeta(null);
          setInEvent(new Set());
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "Load failed", description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, clubId, toast]);

  const searchTerm = filter.toLowerCase().trim();
  const filtered = useMemo(() => {
    let result = players.filter((p) => {
      // Text search filter
      if (searchTerm && !p.full_name.toLowerCase().includes(searchTerm)) return false;
      
      // Group filter
      if (groupFilter !== "all") {
        if (groupFilter === "unassigned") {
          return !p.group_id;
        } else {
          return p.group_id === groupFilter;
        }
      }
      
      return true;
    });
    
    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "elo":
          aVal = a.elo || 0;
          bVal = b.elo || 0;
          break;
        case "events":
          aVal = a.events_played || 0;
          bVal = b.events_played || 0;
          break;
        case "games":
          aVal = a.games_played || 0;
          bVal = b.games_played || 0;
          break;
        case "winrate":
          aVal = a.win_rate || 0;
          bVal = b.win_rate || 0;
          break;
        default:
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [players, filter, groupFilter, sortBy, sortOrder]);

  async function addPlayer() {
    const name = newName.trim();
    if (!name) {
      console.log("No name provided");
      return;
    }
    
    if (!clubId) {
      toast({ variant: "destructive", title: "Error", description: "No club selected. Please go to Settings first." });
      return;
    }
    
    console.log("Adding player:", name, "with group:", newPlayerGroup, "to club:", clubId);
    try {
      const insertData: any = { 
        full_name: name, 
        elo: GAME_CONFIG.DEFAULT_ELO, 
        club_id: clubId 
      };
      
      // Always use basic insert for now to avoid group-related errors
      const { data, error } = await supabase
        .from("players")
        .insert({ full_name: name, elo: GAME_CONFIG.DEFAULT_ELO, club_id: clubId })
        .select()
        .single();
      
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      
      console.log("Player added successfully:", data);
      
      setPlayers((p) => [...p, { 
        id: data.id, 
        full_name: data.full_name, 
        elo: data.elo
      }]);
      setNewName("");
      setNewPlayerGroup("");
      toast({ title: "Player added", description: `${name} has been added successfully!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Add failed", description: e.message || String(e) });
    }
  }

  async function toggleInEvent(pid: string) {
    if (!eventId) return;
    setSaving(pid);
    const isIn = inEvent.has(pid);
    try {
      if (!isIn) {
        const { error } = await supabase.from("event_players").insert({ event_id: eventId, player_id: pid });
        if (error) throw error;
        setInEvent((prev) => new Set([...prev, pid]));
        toast({ title: "Added to event", description: players.find((p) => p.id === pid)?.full_name });
      } else {
        const { error } = await supabase.from("event_players").delete().eq("event_id", eventId).eq("player_id", pid);
        if (error) throw error;
        setInEvent((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        toast({ title: "Removed from event", description: players.find((p) => p.id === pid)?.full_name });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message || String(e) });
    } finally {
      setSaving(null);
    }
  }

  const needed = eventMeta ? eventMeta.courts * 4 : null;
  const selected = inEvent.size;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {eventId && (
              <Button variant="outline" size="sm" asChild className="border-gray-300">
                <Link to={`/event/${eventId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                {eventId && eventMeta ? `${eventMeta.name} Players` : "Club Players"}
              </h1>
              <p className="text-gray-600 mt-1">
                {eventId && eventMeta 
                  ? `Managing players for this event • ${eventMeta.courts} courts • Need ${needed} players`
                  : "Manage your club's player roster and statistics"
                }
              </p>
        </div>
          </div>
        </div>

        {/* Event Selection Banner */}
        {eventId && eventMeta && (
          <Card className="border-2 shadow-lg" style={{ borderColor: '#0172fb', backgroundColor: '#f8faff' }}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0172fb' }}>
                    <Trophy className="w-6 h-6 text-white" />
      </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{eventMeta.name}</h3>
                    <p className="text-gray-700 text-sm">
                      Select players for this event • {eventMeta.courts} courts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#0172fb' }}>{selected}</div>
                    <div className="text-sm text-gray-600">Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{needed}</div>
                    <div className="text-sm text-gray-600">Needed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{needed ? needed - selected : 0}</div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Controls */}
        <Card className="border-2 shadow-lg bg-white" style={{ borderColor: '#0172fb' }}>
          <CardHeader className="pb-4 border-b" style={{ borderColor: '#0172fb20' }}>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5" style={{ color: '#0172fb' }} />
              Player Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
                  <Search className="w-4 h-4" style={{ color: '#0172fb' }} />
                  Search Players
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#0172fb' }} />
                  <Input 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                    placeholder="Search by name..." 
                    className="pl-11 h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm"
                    style={{ '--tw-ring-color': '#0172fb40' } as any}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
                  />
          </div>
        </div>

              {/* Group Filter */}
              <div className="flex-1">
                <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
                  <Filter className="w-4 h-4" style={{ color: '#0172fb' }} />
                  Filter by Group
                </Label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm rounded-md px-3 focus:outline-none transition-colors"
                  style={{ '--tw-ring-color': '#0172fb40' } as any}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
                >
                  <option value="all">All Players</option>
                  <option value="unassigned">Unassigned</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
            </div>

              {/* Add Player */}
              <div className="flex-1">
                <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
                  <UserPlus className="w-4 h-4" style={{ color: '#0172fb' }} />
                  Add New Player
                </Label>
                <div className="space-y-3">
                  <Input
                    id="new-player-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Novak"
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    className="h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm"
                    style={{ '--tw-ring-color': '#0172fb40' } as any}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
                  />
                  {groups.length > 0 && (
                    <select
                      value={newPlayerGroup}
                      onChange={(e) => setNewPlayerGroup(e.target.value)}
                      className="w-full h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm rounded-md px-3 focus:outline-none transition-colors"
                      style={{ '--tw-ring-color': '#0172fb40' } as any}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
                    >
                      <option value="">No Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button 
                    onClick={addPlayer} 
                    disabled={!newName.trim()} 
                    className="w-full h-12 px-6 text-white font-bold shadow-lg hover:shadow-xl border-0 transition-all duration-200"
                    style={{ 
                      backgroundColor: '#0172fb',
                      borderColor: '#0172fb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0056d3';
                      e.currentTarget.style.borderColor = '#0056d3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0172fb';
                      e.currentTarget.style.borderColor = '#0172fb';
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Player
            </Button>
          </div>
      </div>

              {/* Sort Controls */}
              <div className="lg:w-72">
                <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-purple-500" />
                  Sort & Filter
                </Label>
                <div className="flex gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 h-12 text-sm border-2 border-gray-400 bg-white px-4 py-3 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-medium text-gray-900 shadow-sm"
                  >
                    <option value="name">Name</option>
                    <option value="elo">ELO Rating</option>
                    <option value="events">Events Played</option>
                    <option value="games">Games Played</option>
                    <option value="winrate">Win Rate</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    className="h-12 w-12 p-0 border-2 border-gray-400 hover:border-purple-500 hover:bg-purple-50 shadow-sm"
                  >
                    <SortAsc className={`w-5 h-5 text-purple-600 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {!loading && players.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-2 shadow-lg bg-white" style={{ borderColor: '#0172fb' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#0172fb' }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold" style={{ color: '#0172fb' }}>{players.length}</div>
                <div className="text-sm text-gray-600">Total Players</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(players.reduce((sum, p) => sum + (p.elo || 0), 0) / players.length)}
                </div>
                <div className="text-sm text-gray-600">Avg ELO</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(players.reduce((sum, p) => sum + (p.win_rate || 0), 0) / players.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Win Rate</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {players.reduce((sum, p) => sum + (p.total_points || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {players.reduce((sum, p) => sum + (p.events_played || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Events</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Group Breakdown */}
        {!loading && groups.length > 0 && (
          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5" style={{ color: '#0172fb' }} />
                Player Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {groups.map(group => {
                  const playersInGroup = players.filter(p => p.group_id === group.id);
                  const unassignedCount = players.filter(p => !p.group_id).length;
                  
                  return (
                    <div
                      key={group.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                        groupFilter === group.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}
                      onClick={() => setGroupFilter(groupFilter === group.id ? 'all' : group.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium text-gray-900">{group.name}</span>
                        {group.description && (
                          <span className="text-sm text-gray-500">• {group.description}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-gray-600">
                        {playersInGroup.length} player{playersInGroup.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
                
                {/* Unassigned players */}
                {players.filter(p => !p.group_id).length > 0 && (
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      groupFilter === 'unassigned' ? 'bg-gray-50 border-gray-400' : 'border-gray-200'
                    }`}
                    onClick={() => setGroupFilter(groupFilter === 'unassigned' ? 'all' : 'unassigned')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border border-dashed border-gray-400 bg-gray-100" />
                      <span className="font-medium text-gray-700">Unassigned</span>
                      <span className="text-sm text-gray-500">• Players without a group</span>
                    </div>
                    <Badge variant="outline" className="text-gray-600">
                      {players.filter(p => !p.group_id).length} player{players.filter(p => !p.group_id).length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PlayerCardSkeleton key={i} />
            ))}
          </div>
      ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon="👥"
                title="No players found"
                description={searchTerm ? `No players match "${searchTerm}". Try adjusting your search.` : "Start building your padel community by adding players to this club."}
                action={!searchTerm ? (
                  <Button onClick={() => {
                    document.getElementById('new-player-name')?.focus();
                  }} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add First Player
                  </Button>
                ) : undefined}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((p, index) => {
            const isIn = eventId ? inEvent.has(p.id) : false;
              const skillLevel = p.elo >= 1500 ? 'Expert' : p.elo >= 1200 ? 'Advanced' : p.elo >= 1000 ? 'Intermediate' : 'Beginner';
              const skillColor = p.elo >= 1500 ? 'text-purple-600' : p.elo >= 1200 ? 'text-blue-600' : p.elo >= 1000 ? 'text-green-600' : 'text-amber-600';
              const isTopPlayer = index < 3 && sortBy === 'elo' && sortOrder === 'desc';
              
            return (
                <Card
                key={p.id}
                  className={`transition-all duration-200 hover:shadow-xl hover:scale-[1.01] cursor-pointer bg-white border-2 shadow-md ${
                    isIn ? 'bg-blue-50' : 'hover:shadow-blue-100'
                  } ${isTopPlayer ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''}`}
                  style={{
                    borderColor: isIn ? '#0172fb' : isTopPlayer ? '#f59e0b' : '#e5e7eb'
                  }}
                onClick={() => eventId && !saving ? toggleInEvent(p.id) : undefined}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar and Rank */}
                        <div className="relative">
                          <Avatar name={p.full_name} size="md" />
                          {isTopPlayer && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {isIn && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Star className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-bold text-xl text-gray-900 truncate">{p.full_name}</h3>
                            {p.group && (
                              <Badge 
                                className="font-semibold border-0 text-white"
                                style={{ backgroundColor: p.group.color }}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {p.group.name}
                              </Badge>
                            )}
                            <Badge variant="outline" className={`${skillColor} border-current font-semibold`}>
                              {skillLevel}
                            </Badge>
                            {isTopPlayer && (
                              <Badge className="bg-yellow-200 text-yellow-900 border-yellow-400 font-bold">
                                #{index + 1} Player
                              </Badge>
                            )}
                          </div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4" style={{ color: '#0172fb' }} />
                              <span className="text-gray-600">ELO:</span>
                              <span className="font-bold" style={{ color: '#0172fb' }}>{Math.round(p.elo)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Events:</span>
                              <span className="font-bold text-gray-800">{p.events_played || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Games:</span>
                              <span className="font-bold text-gray-800">{p.games_played || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Win Rate:</span>
                              <span className={`font-bold ${p.win_rate && p.win_rate >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                {p.win_rate || 0}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Points:</span>
                              <span className="font-bold text-gray-800">{p.total_points || 0}</span>
                            </div>
                          </div>
                  </div>
                </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 ml-4">
                  <Button
                          variant="outline"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                          className="border-gray-400 text-gray-800 hover:bg-gray-100 font-semibold shadow-sm"
                  >
                          <Link to={`/player/${p.id}`}>View Profile</Link>
                  </Button>

                        {eventId && (
                    <Button
                      size="sm"
                      variant={isIn ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!saving) toggleInEvent(p.id);
                      }}
                      disabled={saving === p.id}
                            className={isIn 
                              ? "border-red-400 text-red-700 hover:bg-red-50 font-semibold shadow-sm" 
                              : "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                            }
                          >
                            {isIn 
                              ? (saving === p.id ? "Removing..." : "Remove from Event") 
                              : (saving === p.id ? "Adding..." : "Add to Event")
                            }
                    </Button>
                  )}
                </div>
              </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
