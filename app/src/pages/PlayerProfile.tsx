// src/pages/PlayerProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, Target, Trophy, TrendingUp, Award, Edit, ArrowLeft, Star, Crown, Tag } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PlayerGroup } from "@/services/api/playerService";

// Optional: tiny recharts chart for ELO trend (safe to remove if you prefer)
// If you haven't installed recharts, run: npm i recharts

/* ---------- Avatar helpers (deterministic, non-blue) ---------- */
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
function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const bg = colorForName(name);
  return (
    <div
      className="rounded-full grid place-content-center text-white font-semibold shadow-lg transition-transform hover:scale-105"
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.3) }}
    >
      {initials(name)}
    </div>
  );
}

type PlayerRow = { id: string; full_name: string; elo: number; club_id?: string | null; group_id?: string | null; group?: PlayerGroup | null };
type EventRow = { id: string; name: string; status?: string; created_at?: string };

/* ============================ Player Profile ============================ */
export default function PlayerProfile() {
  const { playerId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [eventsPlayed, setEventsPlayed] = useState<number>(0);

  // player
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);

  // edit
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // aggregates
  const [games, setGames] = useState({ played: 0, won: 0, lost: 0, pf: 0, pa: 0, score: 0 });
  const [eloSeries, setEloSeries] = useState<Array<{ date: string; elo: number }>>([]);
  const [clubRanking, setClubRanking] = useState<{ position: number; total: number } | null>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Player info with group data
        let playerData;
        try {
          const { data, error: playerError } = await supabase
            .from("players")
            .select(`
              id, 
              full_name, 
              elo, 
              club_id,
              group_id,
              group:player_groups(id, name, description, color)
            `)
            .eq("id", playerId)
            .single();
          if (playerError) throw playerError;
          playerData = data;
        } catch (groupError) {
          // Fallback to basic query if groups table doesn't exist
          console.warn("Groups not available, falling back to basic player query:", groupError);
          const { data, error: playerError } = await supabase
            .from("players")
            .select("id, full_name, elo, club_id")
            .eq("id", playerId)
            .single();
          if (playerError) throw playerError;
          playerData = data;
        }
        
        setPlayer(playerData);
        setNameDraft(playerData.full_name || "");

        // Club name
        if (playerData.club_id) {
          const { data: clubData } = await supabase
            .from("clubs")
            .select("name")
            .eq("id", playerData.club_id)
            .single();
          if (clubData) setClubName(clubData.name);
        }

        // Events played count
        const { count: eventsCount } = await supabase
          .from("event_players")
          .select("*", { count: "exact", head: true })
          .eq("player_id", playerId);
        setEventsPlayed(eventsCount || 0);

        // Game stats
        const { data: matches } = await supabase
          .from("matches")
          .select("team_a_player1, team_a_player2, team_b_player1, team_b_player2, score_a, score_b")
          .or(`team_a_player1.eq.${playerId},team_a_player2.eq.${playerId},team_b_player1.eq.${playerId},team_b_player2.eq.${playerId}`)
          .not("score_a", "is", null)
          .not("score_b", "is", null);

        if (matches) {
          const played = matches.length;
          let won = 0;
          let pf = 0;
          let pa = 0;

          matches.forEach((m: any) => {
            const onTeamA = m.team_a_player1 === playerId || m.team_a_player2 === playerId;
            const teamAScore = m.score_a || 0;
            const teamBScore = m.score_b || 0;
            
            if (onTeamA) {
              pf += teamAScore;
              pa += teamBScore;
              if (teamAScore > teamBScore) won++;
            } else {
              pf += teamBScore;
              pa += teamAScore;
              if (teamBScore > teamAScore) won++;
            }
          });

          setGames({
            played,
            won,
            lost: played - won,
            pf,
            pa,
            score: pf
          });
        }

        // Club ranking
        if (playerData.club_id) {
          const { data: allPlayers } = await supabase
            .from("players")
            .select("id, elo")
            .eq("club_id", playerData.club_id)
            .order("elo", { ascending: false });

          if (allPlayers) {
            const position = allPlayers.findIndex(p => p.id === playerId) + 1;
            setClubRanking({ position, total: allPlayers.length });
          }
        }

        // ELO trend (simplified)
        const { data: eloHistory } = await supabase
          .from("round_points")
          .select("created_at, elo_after")
          .eq("player_id", playerId)
          .order("created_at", { ascending: true })
          .limit(20);

        if (eloHistory && eloHistory.length > 0) {
          const series = eloHistory.map(r => ({
            date: new Date(r.created_at).toLocaleDateString(),
            elo: r.elo_after || 1000
          }));
          setEloSeries(series);
        }

      } catch (e: any) {
        console.error("Error loading player:", e);
        setErr(e.message || "Failed to load player");
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId]);

  async function saveName() {
    if (!player || !nameDraft.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("players")
        .update({ full_name: nameDraft.trim() })
        .eq("id", player.id);
      if (error) throw error;
      
      setPlayer({ ...player, full_name: nameDraft.trim() });
      setEditing(false);
      toast({ title: "Player updated", description: "Name saved successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    } finally {
      setSaving(false);
    }
  }

  const diff = games.pf - games.pa;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Player Profile</h1>
            <p className="text-gray-600 mt-1">
              Detailed statistics and performance metrics
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="border-gray-300">
            <Link to="/players">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Link>
          </Button>
        </div>

        {/* Player Header Card */}
        <Card className="border-2 shadow-lg bg-white" style={{ borderColor: '#0172fb' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar name={player?.full_name} size={80} />
                  {clubRanking && clubRanking.position <= 3 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {editing ? (
                    <div className="space-y-3">
                      <Input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Player name"
                        className="font-bold text-xl max-w-xs h-12 border-2 border-gray-400 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={saveName} 
                          disabled={saving}
                          className="text-white font-semibold"
                          style={{ backgroundColor: '#0172fb' }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-gray-400">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900">{player?.full_name}</h1>
                        {player?.group && (
                          <Badge 
                            className="font-semibold border-0 text-white"
                            style={{ backgroundColor: player.group.color }}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {player.group.name}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className="border-current font-semibold"
                          style={{ color: '#0172fb' }}
                        >
                          {player?.elo && player.elo >= 1500 ? 'Expert' :
                           player?.elo && player.elo >= 1200 ? 'Advanced' :
                           player?.elo && player.elo >= 1000 ? 'Intermediate' : 'Beginner'}
                        </Badge>
                        {clubRanking && clubRanking.position <= 3 && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            #{clubRanking.position} Player
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" style={{ color: '#0172fb' }} />
                          <span>ELO:</span>
                          <span className="font-bold" style={{ color: '#0172fb' }}>{player?.elo || 0}</span>
                        </div>
                        {clubName && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>{clubName}</span>
                          </div>
                        )}
                        {clubRanking && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-gray-500" />
                            <span>Rank {clubRanking.position}/{clubRanking.total}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!editing && (
                  <Button 
                    variant="outline" 
                    onClick={() => setEditing(true)}
                    className="border-gray-400 text-gray-800 hover:bg-gray-50 font-semibold"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {err ? (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{err}</div>
        ) : null}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-2 shadow-lg bg-white" style={{ borderColor: '#0172fb' }}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#0172fb' }}>
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold" style={{ color: '#0172fb' }}>{eventsPlayed}</div>
              <div className="text-sm text-gray-600">Events Played</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{games.played}</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-green-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{games.won}</div>
              <div className="text-sm text-gray-600">Won</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-red-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{games.lost}</div>
              <div className="text-sm text-gray-600">Lost</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-purple-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                diff >= 0 ? "bg-green-100" : "bg-red-100"
              }`}>
                <Award className={`w-6 h-6 ${
                  diff >= 0 ? "text-green-600" : "text-red-600"
                }`} />
              </div>
              <div className={`text-2xl font-bold ${
                diff >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {diff >= 0 ? `+${diff}` : diff}
              </div>
              <div className="text-sm text-gray-600">Points Diff</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200 shadow-lg bg-white hover:border-blue-200 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {games.played > 0 ? Math.round((games.won / games.played) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* ELO Trend Chart */}
          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#0172fb' }} />
                ELO Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eloSeries.length > 1 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eloSeries}>
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                        domain={['dataMin - 20', 'dataMax + 20']}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-white p-3 shadow-lg border-gray-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-xs uppercase text-gray-500">
                                      Date
                                    </span>
                                    <span className="font-bold text-gray-800">
                                      {label}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs uppercase text-gray-500">
                                      ELO
                                    </span>
                                    <span className="font-bold" style={{ color: '#0172fb' }}>
                                      {payload[0].value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="elo" 
                        strokeWidth={3} 
                        stroke="#0172fb"
                        dot={{ fill: '#0172fb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#0172fb', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>Not enough data to show trend</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance and Club Standing */}
          <div className="space-y-6">
            
            {/* Performance */}
            <Card className="border-2 border-gray-200 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5" style={{ color: '#0172fb' }} />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Win Rate:</span>
                    <span className="font-bold text-lg" style={{ color: '#0172fb' }}>
                      {games.played > 0 ? Math.round((games.won / games.played) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Avg Points/Game:</span>
                    <span className="font-bold text-lg text-gray-800">
                      {games.played > 0 ? Math.round(games.pf / games.played) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Avg Against/Game:</span>
                    <span className="font-bold text-lg text-gray-800">
                      {games.played > 0 ? Math.round(games.pa / games.played) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Club Standing */}
            <Card className="border-2 shadow-lg bg-white" style={{ borderColor: '#0172fb' }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Crown className="w-5 h-5" style={{ color: '#0172fb' }} />
                  Club Standing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clubRanking ? (
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-3" style={{ color: '#0172fb' }}>
                      {clubRanking.position}/{clubRanking.total}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Star className="w-4 h-4" style={{ color: '#0172fb' }} />
                      <span className="font-medium">Active Member</span>
                    </div>
                    {clubRanking.position <= 3 && (
                      <Badge className="mt-3 bg-yellow-100 text-yellow-800 border-yellow-300">
                        🏆 Top 3 Player
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Crown className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>Ranking not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
          </div>
        </div>

        {/* Season Progress */}
        <Card className="border-2 border-gray-200 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: '#0172fb' }} />
              Season Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {games.played > 0 ? Math.round((games.won / games.played) * 100) : 0}%
                </div>
                <div className="text-sm text-green-700 font-medium">Win Rate</div>
              </div>
              <div className="text-center p-4 rounded-lg border-2" style={{ backgroundColor: '#f8faff', borderColor: '#0172fb40' }}>
                <div className="text-3xl font-bold mb-2" style={{ color: '#0172fb' }}>
                  {games.score}
                </div>
                <div className="text-sm font-medium" style={{ color: '#0172fb' }}>Total Points</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                diff >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className={`text-3xl font-bold mb-2 ${
                  diff >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {diff >= 0 ? `+${diff}` : diff}
                </div>
                <div className={`text-sm font-medium ${
                  diff >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>Point Differential</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center p-4 rounded-lg border-2" style={{ 
                backgroundColor: games.played === 0 ? '#f8faff' : 
                                games.won > games.lost ? '#f0fdf4' : 
                                games.won === games.lost ? '#fefce8' : '#fef2f2',
                borderColor: games.played === 0 ? '#0172fb40' : 
                            games.won > games.lost ? '#22c55e40' : 
                            games.won === games.lost ? '#eab30840' : '#ef444440'
              }}>
                <div className="text-lg font-semibold" style={{ 
                  color: games.played === 0 ? '#0172fb' : 
                        games.won > games.lost ? '#16a34a' : 
                        games.won === games.lost ? '#ca8a04' : '#dc2626'
                }}>
                  {games.played === 0 ? "🎾 No games played yet this season" :
                   games.won > games.lost ? "🔥 Having a great season!" :
                   games.won === games.lost ? "⚖️ Even keel this season" :
                   "📈 Room for improvement this season"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <RecentEvents playerId={playerId!} />
      </div>
    </div>
  );
}

/* ---------- Recent events component (lightweight) ---------- */
function RecentEvents({ playerId }: { playerId: string }) {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log("🔍 Fetching recent events for player:", playerId);
        
        // Try a simpler approach - get event IDs first, then fetch event details
        const { data: eventPlayerData, error: epError } = await supabase
          .from("event_players")
          .select("event_id")
          .eq("player_id", playerId);

        console.log("🔗 Event-Player relationships:", { data: eventPlayerData, error: epError });

        if (eventPlayerData && eventPlayerData.length > 0) {
          const eventIds = eventPlayerData.map(ep => ep.event_id);
          
          const { data: eventsData, error: eventsError } = await supabase
            .from("events")
            .select("id, name, ended_at, created_at")
            .in("id", eventIds)
            .order("created_at", { ascending: false })
            .limit(10);

          console.log("🏆 Events data:", { data: eventsData, error: eventsError });

          if (eventsData) {
            const events = eventsData.map((e: any) => ({
              id: e.id,
              name: e.name,
              status: e.ended_at ? "Completed" : "Active",
              created_at: e.created_at
            }));
            console.log("📋 Final processed events:", events);
            setRows(events);
          }
        } else {
          console.log("📋 No event-player relationships found");
          setRows([]);
        }
      } catch (e) {
        console.error("❌ Failed to load recent events:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId]);

  if (loading) {
    return (
      <Card className="border-2 border-gray-200 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: '#0172fb' }} />
          Recent Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.created_at!).toLocaleDateString()}
                  </div>
                </div>
                <Badge 
                  className={event.status === "Active" 
                    ? "bg-green-100 text-green-800 border-green-300" 
                    : "bg-gray-100 text-gray-800 border-gray-300"
                  }
                >
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p>No recent events found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}