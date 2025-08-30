// src/components/EventAnalytics.tsx
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

interface EnhancedCourtMatch {
  court_num: number;
  teamA: [UUID, UUID];
  teamB: [UUID, UUID];
  scoreA?: number;
  scoreB?: number;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  startedAt?: string;
  pausedAt?: string;
  notes?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

interface EventAnalyticsProps {
  courts: EnhancedCourtMatch[];
  players: Record<UUID, Player>;
  history: any[];
  roundNum: number;
  isPointsMode: boolean;
  meta: any;
}

export default function EventAnalytics({ 
  courts, 
  players, 
  history, 
  roundNum, 
  isPointsMode, 
  meta 
}: EventAnalyticsProps) {
  
  // Calculate real-time statistics
  const stats = useMemo(() => {
    const totalMatches = history.length * courts.length;
    const completedMatches = courts.filter(c => c.scoreA !== undefined && c.scoreB !== undefined).length;
    const activeMatches = courts.filter(c => c.status === 'active').length;
    const pausedMatches = courts.filter(c => c.status === 'paused').length;
    
    // Calculate average scores
    const scores = courts
      .filter(c => c.scoreA !== undefined && c.scoreB !== undefined)
      .map(c => [c.scoreA!, c.scoreB!])
      .flat();
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    
    // Find most active court
    const courtActivity = courts.reduce((acc, court) => {
      acc[court.court_num] = (acc[court.court_num] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostActiveCourt = Object.entries(courtActivity)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    // Calculate player performance
    const playerStats = Object.values(players).map(player => {
      const playerMatches = courts.filter(c => 
        c.teamA.includes(player.id) || c.teamB.includes(player.id)
      );
      
      const wins = playerMatches.filter(c => {
        if (c.scoreA === undefined || c.scoreB === undefined) return false;
        const isTeamA = c.teamA.includes(player.id);
        return isTeamA ? c.scoreA > c.scoreB : c.scoreB > c.scoreA;
      }).length;
      
      const totalPlayed = playerMatches.filter(c => 
        c.scoreA !== undefined && c.scoreB !== undefined
      ).length;
      
      return {
        id: player.id,
        name: player.full_name,
        matches: totalPlayed,
        wins,
        winRate: totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0,
        elo: player.elo
      };
    });
    
    // Sort players by win rate
    const topPerformers = playerStats
      .filter(p => p.matches > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
    
    return {
      totalMatches,
      completedMatches,
      activeMatches,
      pausedMatches,
      averageScore,
      mostActiveCourt,
      completionRate: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
      topPerformers,
      playerStats
    };
  }, [courts, players, history]);

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Round {roundNum} Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.completedMatches}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.activeMatches}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.pausedMatches}</div>
              <div className="text-xs text-muted-foreground">Paused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.averageScore}</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{stats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Court Activity */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Court Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {courts.map(court => {
              const a1 = players[court.teamA[0]]?.full_name;
              const a2 = players[court.teamA[1]]?.full_name;
              const b1 = players[court.teamB[0]]?.full_name;
              const b2 = players[court.teamB[1]]?.full_name;
              
              return (
                <div key={court.court_num} className="flex items-center justify-between p-2 rounded-lg border border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Court {court.court_num}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      court.status === 'active' 
                        ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                        : court.status === 'paused'
                        ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                        : court.status === 'completed'
                        ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                        : 'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                    }`}>
                      {court.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a1} & {a2} vs {b1} & {b2}
                  </div>
                  <div className="text-sm font-medium">
                    {court.scoreA ?? 0} : {court.scoreB ?? 0}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {stats.topPerformers.length > 0 && (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topPerformers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-2 rounded-lg border border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {player.wins}/{player.matches} ({player.winRate}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Insights */}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Most Active Court:</span>
              <span className="font-medium">Court {stats.mostActiveCourt}</span>
            </div>
            <div className="flex justify-between">
              <span>Round Progress:</span>
              <span className="font-medium">{stats.completedMatches}/{courts.length} matches</span>
            </div>
            <div className="flex justify-between">
              <span>Average Score:</span>
              <span className="font-medium">{stats.averageScore} points</span>
            </div>
            {isPointsMode && meta?.points_per_game && (
              <div className="flex justify-between">
                <span>Target Score:</span>
                <span className="font-medium">{meta.points_per_game} points</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
