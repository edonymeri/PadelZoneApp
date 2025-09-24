// src/components/scoreboard/CourtsGrid.tsx
import { diffRounds } from "@/utils/wildcardDiff";
import type { CourtMatch, UUID } from "@/lib/types";

type Player = { id: UUID; full_name: string; elo: number };

interface CourtsGridProps {
  courts: CourtMatch[];
  historicalCourts: CourtMatch[];
  players: Record<UUID, Player>;
  isViewingHistorical: boolean;
  loading: boolean;
  loadingHistorical: boolean;
  errorMsg: string | null;
}

export default function CourtsGrid({
  courts,
  historicalCourts,
  players,
  isViewingHistorical,
  loading,
  loadingHistorical,
  errorMsg
}: CourtsGridProps) {
  const currentCourts = isViewingHistorical ? historicalCourts : courts;

  if (loading || loadingHistorical) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="mt-6 h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMsg) {
    return <div className="py-16 text-center text-red-600">{errorMsg}</div>;
  }

  if (currentCourts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No matches in this round yet.</p>
      </div>
    );
  }

  // Calculate moved players for animation
  const prev = null; // Could fetch previous round for highlighting
  const diff = diffRounds(prev, currentCourts);
  const moved = diff.movedPlayerIds;
  const playerMoved = (pid: any) => moved.has(pid);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {currentCourts.map((ct) => {
        const teamAScore = ct.scoreA ?? 0;
        const teamBScore = ct.scoreB ?? 0;
        const isWinnersCourt = ct.court_num === 1;
        const hasScore = teamAScore > 0 || teamBScore > 0;
        const teamAWinning = teamAScore > teamBScore;
        const teamBWinning = teamBScore > teamAScore;
        
        return (
          <div
            key={ct.court_num}
            className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
              isWinnersCourt 
                ? "border-blue-300 bg-blue-50" 
                : "bg-white border-gray-200 hover:shadow-md"
            }`}
          >
            {/* Court Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Court {ct.court_num}
                {isWinnersCourt && (
                  <span className="ml-2 text-blue-600 text-sm">🏆 Winners Court</span>
                )}
              </h3>
              {hasScore && (
                <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                  teamAWinning 
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : teamBWinning
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}>
                  {teamAWinning ? "Team A Leading" : teamBWinning ? "Team B Leading" : "Tied"}
                </div>
              )}
            </div>
            
            {/* Teams */}
            <div className="grid grid-cols-3 items-center gap-4 mb-6">
              {/* Team A */}
              <div className="text-center">
                <div className="font-medium text-sm text-gray-500 mb-2">Team A</div>
                <div className="space-y-1">
                  <div className={`text-sm font-medium truncate ${
                    playerMoved(ct.teamA[0]) ? 'text-purple-700 animate-pulse' : 'text-gray-900'
                  }`}>
                    {players[ct.teamA[0]]?.full_name || 'Player 1'}
                  </div>
                  <div className={`text-sm font-medium truncate ${
                    playerMoved(ct.teamA[1]) ? 'text-purple-700 animate-pulse' : 'text-gray-900'
                  }`}>
                    {players[ct.teamA[1]]?.full_name || 'Player 2'}
                  </div>
                </div>
              </div>
              
              {/* VS */}
              <div className="text-center text-gray-400 text-xl font-bold">VS</div>
              
              {/* Team B */}
              <div className="text-center">
                <div className="font-medium text-sm text-gray-500 mb-2">Team B</div>
                <div className="space-y-1">
                  <div className={`text-sm font-medium truncate ${
                    playerMoved(ct.teamB[0]) ? 'text-purple-700 animate-pulse' : 'text-gray-900'
                  }`}>
                    {players[ct.teamB[0]]?.full_name || 'Player 1'}
                  </div>
                  <div className={`text-sm font-medium truncate ${
                    playerMoved(ct.teamB[1]) ? 'text-purple-700 animate-pulse' : 'text-gray-900'
                  }`}>
                    {players[ct.teamB[1]]?.full_name || 'Player 2'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Score */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                <span className={teamAWinning ? "text-green-600" : "text-gray-700"}>
                  {teamAScore}
                </span>
                <span className="text-gray-400 mx-4">:</span>
                <span className={teamBWinning ? "text-blue-600" : "text-gray-700"}>
                  {teamBScore}
                </span>
              </div>
              {!hasScore && (
                <div className="text-sm text-gray-500">
                  Match not started
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}