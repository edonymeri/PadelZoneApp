// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  CalendarDays, 
  Users, 
  Trophy, 
  TrendingUp, 
  Plus, 
  Activity, 
  Clock,
  Target,
  Zap,
  ChevronRight,
  Play,
  Calendar
} from "lucide-react";

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalPlayers: number;
  activePlayers: number;
  completedTournaments: number;
  averageEventDuration: number;
}

interface RecentEvent {
  id: string;
  name: string;
  created_at: string;
  ended_at: string | null;
  player_count: number;
  status: 'active' | 'completed' | 'upcoming';
}

interface TopPlayer {
  id: string;
  full_name: string;
  elo: number;
  recent_games: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const clubId = useMemo(() => localStorage.getItem("clubId") || "", []);
  const [clubName, setClubName] = useState<string>("");
  
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalPlayers: 0,
    activePlayers: 0,
    completedTournaments: 0,
    averageEventDuration: 0
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    loadDashboardData();
  }, [clubId]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      await Promise.all([
        loadClubInfo(),
        loadStats(),
        loadRecentEvents(),
        loadTopPlayers()
      ]);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast({
        variant: "destructive",
        title: "Failed to load dashboard",
        description: "Please refresh the page to try again."
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadClubInfo() {
    const { data } = await supabase
      .from("clubs")
      .select("name")
      .eq("id", clubId)
      .single();
    
    if (data) {
      setClubName(data.name);
    }
  }

  async function loadStats() {
    // Get events stats
    const { data: events } = await supabase
      .from("events")
      .select("id, ended_at, started_at")
      .eq("club_id", clubId);

    // Get players stats
    const { data: players } = await supabase
      .from("players")
      .select("id, created_at")
      .eq("club_id", clubId);

    // Get recent activity (players who played in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentActivity } = await supabase
      .from("round_points")
      .select("player_id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .in("event_id", events?.map(e => e.id) || []);

    const activeEvents = events?.filter(e => !e.ended_at).length || 0;
    const completedEvents = events?.filter(e => e.ended_at).length || 0;
    const activePlayers = new Set(recentActivity?.map(rp => rp.player_id)).size;

    // Calculate average event duration for completed events
    const completedEventsWithDuration = events?.filter(e => e.ended_at && e.started_at) || [];
    const averageDuration = completedEventsWithDuration.length > 0 
      ? completedEventsWithDuration.reduce((sum, event) => {
          const start = new Date(event.started_at);
          const end = new Date(event.ended_at!);
          return sum + (end.getTime() - start.getTime());
        }, 0) / completedEventsWithDuration.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    setStats({
      totalEvents: events?.length || 0,
      activeEvents,
      totalPlayers: players?.length || 0,
      activePlayers,
      completedTournaments: completedEvents,
      averageEventDuration: Math.round(averageDuration * 10) / 10
    });
  }

  async function loadRecentEvents() {
    const { data } = await supabase
      .from("events")
      .select(`
        id, 
        name, 
        created_at, 
        ended_at,
        event_players(player_id)
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      const events: RecentEvent[] = data.map(event => ({
        id: event.id,
        name: event.name,
        created_at: event.created_at,
        ended_at: event.ended_at,
        player_count: event.event_players?.length || 0,
        status: event.ended_at ? 'completed' : 'active'
      }));
      setRecentEvents(events);
    }
  }

  async function loadTopPlayers() {
    const { data } = await supabase
      .from("players")
      .select(`
        id, 
        full_name, 
        elo,
        round_points(created_at)
      `)
      .eq("club_id", clubId)
      .order("elo", { ascending: false })
      .limit(5);

    if (data) {
      const players: TopPlayer[] = data.map(player => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentGames = player.round_points?.filter(rp => 
          new Date(rp.created_at) > thirtyDaysAgo
        ).length || 0;

        return {
          id: player.id,
          full_name: player.full_name,
          elo: player.elo,
          recent_games: recentGames
        };
      });
      setTopPlayers(players);
    }
  }

  if (!clubId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Club</h3>
            <p className="text-gray-600 mb-4">
              Please select a club from the header to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening at <span className="font-semibold" style={{ color: '#0172fb' }}>{clubName}</span>
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button asChild className="bg-gray-800 hover:bg-gray-900">
              <Link to="/players">
                <Users className="w-4 h-4 mr-2" />
                Manage Players
              </Link>
            </Button>
            <Button asChild style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }} className="hover:opacity-90">
              <Link to="/events">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6" style={{ color: '#0172fb' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeEvents}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Players</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPlayers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Players</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.activePlayers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Events */}
          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: '#0172fb' }} />
                  Recent Events
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/events" className="text-blue-600 hover:text-blue-700">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            event.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{event.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{event.player_count} players</span>
                              <span>{new Date(event.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {event.status === 'active' && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/event/${event.id}`}>
                            <Play className="w-4 h-4 mr-1" />
                            Manage
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No events yet</p>
                  <Button asChild className="mt-3" style={{ backgroundColor: '#0172fb' }}>
                    <Link to="/events">Create your first event</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top Players
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/players" className="text-blue-600 hover:text-blue-700">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topPlayers.length > 0 ? (
                <div className="space-y-4">
                  {topPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{player.full_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>ELO: {player.elo}</span>
                            <span>{player.recent_games} recent games</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/player/${player.id}`}>
                          <TrendingUp className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No players yet</p>
                  <Button asChild className="mt-3" variant="outline">
                    <Link to="/players">Add your first player</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-900">{stats.completedTournaments}</p>
              <p className="text-sm text-gray-600">Completed Tournaments</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-900">{stats.averageEventDuration}h</p>
              <p className="text-sm text-gray-600">Avg. Event Duration</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPlayers > 0 ? Math.round((stats.activePlayers / stats.totalPlayers) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Player Engagement</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
