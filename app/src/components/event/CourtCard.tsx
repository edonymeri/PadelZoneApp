// src/components/event/CourtCard.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import type { CourtMatch, UUID } from "@/lib/types";
import { supabase } from "@/lib/supabase";

type Player = { id: UUID; full_name: string; elo: number };

interface CourtCardProps {
  court: CourtMatch;
  players: Record<UUID, Player>;
  useKeypad: boolean;
  isPointsMode: boolean;
  courtNames?: string[]; // Custom court names from event
  isHistorical?: boolean; // If true, shows read-only historical data
  isWildcardRound?: boolean; // If true, shows wildcard round styling
  setScore: (courtNum: number, scoreA?: number, scoreB?: number) => void;
  setPadTarget: (target: { court: number; side: "A" | "B"; value: number }) => void;
  setPadOpen: (open: boolean) => void;
}

/** Deterministic non-blue avatar color */
function colorForName(name?: string) {
  const palette = ["#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#14B8A6","#A855F7","#EAB308","#22C55E","#EC4899"];
  if (!name) return palette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** Initials avatar with enhanced hover effects */
function InitialAvatar({ name, playerId, players, courtNum }: { 
  name?: string; 
  playerId?: UUID; 
  players?: Record<UUID, Player>;
  courtNum?: number;
}) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "–";
  const bg = colorForName(name);
  const player = playerId && players ? players[playerId] : null;
  
  return (
    <div className="relative group">
      <div className="h-8 w-8 md:h-6 md:w-6 shrink-0 grid place-content-center rounded-full text-sm md:text-[11px] font-semibold cursor-pointer hover:scale-110 transition-transform-smooth"
           style={{ background: bg, color: "white" }} aria-hidden title={name || ""}>
        {initials}
      </div>
      
             {/* Enhanced Player Stats Tooltip */}
       {player && (
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-sm rounded-lg border border-border/50 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] min-w-[200px]">
          <div className="text-center font-semibold text-blue-300 mb-2">{name}</div>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>ELO Rating:</span>
              <span className="text-yellow-300">{player.elo}</span>
            </div>
            <div className="flex justify-between">
              <span>Court:</span>
              <span className="text-green-300">{courtNum}</span>
            </div>
            <div className="flex justify-between">
              <span>Team:</span>
              <span className="text-blue-300">A</span>
            </div>
            <div className="flex justify-between">
              <span>Skill Level:</span>
              <span className={player.elo >= 1500 ? 'text-green-300' : player.elo >= 1200 ? 'text-yellow-300' : 'text-red-300'}>
                {player.elo >= 1500 ? 'Expert' : player.elo >= 1200 ? 'Advanced' : 'Intermediate'}
              </span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
        </div>
      )}
    </div>
  );
}

export default function CourtCard({
  court,
  players,
  useKeypad,
  isPointsMode,
  courtNames,
  isHistorical = false,
  isWildcardRound = false,
  setScore,
  setPadTarget,
  setPadOpen
}: CourtCardProps) {
  const a1 = players[court.teamA[0]]?.full_name;
  const a2 = players[court.teamA[1]]?.full_name;
  const b1 = players[court.teamB[0]]?.full_name;
  const b2 = players[court.teamB[1]]?.full_name;

  // Get custom court name or fallback to default
  const getCourtName = (courtNum: number) => {
    if (courtNames && courtNames[courtNum - 1]) {
      return courtNames[courtNum - 1];
    }
    return courtNum === 1 ? "Winners Court" : `Court ${courtNum}`;
  };

  // Team Chemistry state
  const [teamChemistry, setTeamChemistry] = useState<{
    teamA: { gamesPlayed: number; winRate: number; avgScore: number; lastPlayed: string | null };
    teamB: { gamesPlayed: number; winRate: number; avgScore: number; lastPlayed: string | null };
  } | null>(null);

  // Team Chemistry effect
  useEffect(() => {
    const fetchTeamChemistry = async () => {
      try {
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .not('score_a', 'is', null)
          .not('score_b', 'is', null);
        
        if (matches) {
          const isTeamFormed = (match: any, player1: string, player2: string) => {
            return (
              (match.team_a_player1 === player1 && match.team_a_player2 === player2) ||
              (match.team_a_player1 === player2 && match.team_a_player2 === player1) ||
              (match.team_b_player1 === player1 && match.team_b_player2 === player2) ||
              (match.team_b_player1 === player2 && match.team_b_player2 === player1)
            );
          };
          
          const didTeamWin = (match: any, player1: string, player2: string) => {
            const isOnTeamA = (match.team_a_player1 === player1 && match.team_a_player2 === player2) ||
                              (match.team_a_player1 === player2 && match.team_a_player2 === player1);
            const isOnTeamB = (match.team_b_player1 === player1 && match.team_b_player2 === player2) ||
                              (match.team_b_player1 === player2 && match.team_b_player2 === player1);
            
            if (isOnTeamA) return match.score_a > match.score_b;
            else if (isOnTeamB) return match.score_b > match.score_a;
            return false;
          };
          
          const getTeamScore = (match: any, player1: string, player2: string) => {
            const isOnTeamA = (match.team_a_player1 === player1 && match.team_a_player2 === player2) ||
                              (match.team_a_player1 === player2 && match.team_a_player2 === player1);
            const isOnTeamB = (match.team_b_player1 === player1 && match.team_b_player2 === player2) ||
                              (match.team_b_player1 === player2 && match.team_b_player2 === player1);
            
            if (isOnTeamA) return match.score_a;
            else if (isOnTeamB) return match.score_b;
            return 0;
          };
          
          const teamAMatches = matches.filter(match => 
            isTeamFormed(match, court.teamA[0], court.teamA[1])
          );
          
          const teamBMatches = matches.filter(match => 
            isTeamFormed(match, court.teamB[0], court.teamB[1])
          );
          
          const calculateTeamStats = (teamMatches: any[], teamPlayers: string[]) => {
            if (teamMatches.length === 0) return { gamesPlayed: 0, winRate: 0, avgScore: 0, lastPlayed: null };
            
            let wins = 0;
            let totalScore = 0;
            let lastPlayed: string | null = null;
            
            teamMatches.forEach(match => {
              if (didTeamWin(match, teamPlayers[0], teamPlayers[1])) wins++;
              totalScore += getTeamScore(match, teamPlayers[0], teamPlayers[1]);
              if (!lastPlayed || match.created_at > lastPlayed) lastPlayed = match.created_at;
            });
            
            return {
              gamesPlayed: teamMatches.length,
              winRate: Math.round((wins / teamMatches.length) * 100),
              avgScore: Math.round(totalScore / teamMatches.length),
              lastPlayed: lastPlayed ? new Date(lastPlayed).toLocaleDateString() : null
            };
          };
          
          setTeamChemistry({
            teamA: calculateTeamStats(teamAMatches, court.teamA),
            teamB: calculateTeamStats(teamBMatches, court.teamB)
          });
        }
      } catch (error) {
        console.warn('Failed to fetch team chemistry:', error);
      }
    };
    
    fetchTeamChemistry();
  }, [court.teamA, court.teamB]);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-200 hover:shadow-md ${
        isHistorical
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 opacity-90"
          : isWildcardRound
            ? "border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-purple-100 animate-pulse"
            : court.court_num === 1 
              ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50" 
              : "border-gray-200"
      }`}
    >
        {/* Court Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              court.court_num === 1 
                ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                : "bg-gradient-to-br from-gray-500 to-gray-600"
            }`}>
              <span className="text-white font-bold text-lg">
                {court.court_num === 1 ? "👑" : "🏟️"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Court {court.court_num}</h3>
                {isHistorical && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">
                    Historical
                  </span>
                )}
                {isWildcardRound && !isHistorical && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg animate-pulse">
                    🎲 Wildcard
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                {getCourtName(court.court_num)}
              </p>
            </div>
          </div>
          
          {court.court_num === 1 && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
              👑 Winners Court
            </span>
          )}
        </div>

        {/* Modern Progress Indicator - The "spice" line! */}
        {court.scoreA !== undefined && court.scoreB !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Match Progress</span>
              <span>{Math.max(court.scoreA, court.scoreB)} pts</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out rounded-full ${
                  court.court_num === 1 
                    ? "bg-gradient-to-r from-blue-400 to-blue-600" 
                    : "bg-gradient-to-r from-green-400 to-green-500"
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(court.scoreA || 0, court.scoreB || 0) > 0 ? 
                    (Math.max(court.scoreA || 0, court.scoreB || 0) / 21) * 100 : 5)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Modern Teams Display with Chemistry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Team A */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500">TEAM A</div>
              {teamChemistry && (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    teamChemistry.teamA.gamesPlayed > 0 ? 
                      (teamChemistry.teamA.winRate >= 60 ? 'bg-green-400' : 
                       teamChemistry.teamA.winRate >= 40 ? 'bg-yellow-400' : 'bg-red-400') :
                      'bg-gray-300'
                  }`} title={`${teamChemistry.teamA.gamesPlayed} games, ${teamChemistry.teamA.winRate}% win rate`}></span>
                  <span className="text-xs text-gray-500">
                    {teamChemistry.teamA.gamesPlayed > 0 ? `${teamChemistry.teamA.winRate}%` : 'New'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <InitialAvatar name={a1} playerId={court.teamA[0]} players={players} courtNum={court.court_num} />
              <span className="font-medium text-gray-900 truncate">{a1 || "Player 1"}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <InitialAvatar name={a2} playerId={court.teamA[1]} players={players} courtNum={court.court_num} />
              <span className="font-medium text-gray-900 truncate">{a2 || "Player 2"}</span>
            </div>
            {teamChemistry && teamChemistry.teamA.gamesPlayed > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {teamChemistry.teamA.gamesPlayed} games • Avg {teamChemistry.teamA.avgScore} pts
              </div>
            )}
          </div>

          {/* VS with Chemistry Balance */}
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-600 font-bold text-lg">VS</span>
            </div>
            {teamChemistry && (
              <div className="text-xs text-gray-500">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                  (() => {
                    const teamAGames = teamChemistry.teamA.gamesPlayed;
                    const teamBGames = teamChemistry.teamB.gamesPlayed;
                    if (teamAGames === 0 && teamBGames === 0) return 'bg-blue-100 text-blue-600';
                    if (Math.abs(teamAGames - teamBGames) <= 2) return 'bg-green-100 text-green-600';
                    return 'bg-orange-100 text-orange-600';
                  })()
                }`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  {(() => {
                    const teamAGames = teamChemistry.teamA.gamesPlayed;
                    const teamBGames = teamChemistry.teamB.gamesPlayed;
                    if (teamAGames === 0 && teamBGames === 0) return 'Fresh Match';
                    if (Math.abs(teamAGames - teamBGames) <= 2) return 'Balanced';
                    return 'Experience Gap';
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500">TEAM B</div>
              {teamChemistry && (
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    teamChemistry.teamB.gamesPlayed > 0 ? 
                      (teamChemistry.teamB.winRate >= 60 ? 'bg-green-400' : 
                       teamChemistry.teamB.winRate >= 40 ? 'bg-yellow-400' : 'bg-red-400') :
                      'bg-gray-300'
                  }`} title={`${teamChemistry.teamB.gamesPlayed} games, ${teamChemistry.teamB.winRate}% win rate`}></span>
                  <span className="text-xs text-gray-500">
                    {teamChemistry.teamB.gamesPlayed > 0 ? `${teamChemistry.teamB.winRate}%` : 'New'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <InitialAvatar name={b1} playerId={court.teamB[0]} players={players} courtNum={court.court_num} />
              <span className="font-medium text-gray-900 truncate">{b1 || "Player 1"}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <InitialAvatar name={b2} playerId={court.teamB[1]} players={players} courtNum={court.court_num} />
              <span className="font-medium text-gray-900 truncate">{b2 || "Player 2"}</span>
            </div>
            {teamChemistry && teamChemistry.teamB.gamesPlayed > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {teamChemistry.teamB.gamesPlayed} games • Avg {teamChemistry.teamB.avgScore} pts
              </div>
            )}
          </div>
        </div>

        {/* Modern Scoring Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {useKeypad ? (
              <>
                <Button
                  variant="outline"
                  aria-label={`Enter score for Team A on Court ${court.court_num}`}
                  onClick={() => {
                    setPadTarget({ court: court.court_num, side: "A", value: court.scoreA ?? 0 });
                    setPadOpen(true);
                  }}
                  className="h-16 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 bg-white text-gray-900 shadow-sm"
                >
                  Team A: <span className="text-blue-600">{court.scoreA ?? 0}</span>
                </Button>
                <Button
                  variant="outline"
                  aria-label={`Enter score for Team B on Court ${court.court_num}`}
                  onClick={() => {
                    setPadTarget({ court: court.court_num, side: "B", value: court.scoreB ?? 0 });
                    setPadOpen(true);
                  }}
                  className="h-16 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 bg-white text-gray-900 shadow-sm"
                >
                  Team B: <span className="text-blue-600">{court.scoreB ?? 0}</span>
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team A Score</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={court.scoreA ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (isPointsMode) setScore(court.court_num, Number.isNaN(v) ? undefined : v, undefined);
                      else setScore(court.court_num, Number.isNaN(v) ? undefined : v, court.scoreB);
                    }}
                    className="h-16 text-center text-3xl font-bold border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder:text-gray-400"
                  />
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team B Score</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={court.scoreB ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (isPointsMode) setScore(court.court_num, undefined, Number.isNaN(v) ? undefined : v);
                      else setScore(court.court_num, court.scoreA, Number.isNaN(v) ? undefined : v);
                    }}
                    className="h-16 text-center text-3xl font-bold border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </>
            )}
          </div>
        </div>
          </div>
  );
}
