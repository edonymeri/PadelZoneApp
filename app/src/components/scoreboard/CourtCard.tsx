import { Link } from "react-router-dom";
import type { CourtMatch } from "@/lib/types";

type Player = { id: string; full_name: string; elo: number };

interface CourtCardProps {
  court: CourtMatch;
  players: Record<string, Player>;
  variant?: "normal" | "tv";
}

export function CourtCard({ court, players, variant = "normal" }: CourtCardProps) {
  const teamAScore = court.scoreA ?? 0;
  const teamBScore = court.scoreB ?? 0;
  const isWinnersCourt = court.court_num === 1;
  const hasScore = teamAScore > 0 || teamBScore > 0;
  const teamAWinning = teamAScore > teamBScore;
  const teamBWinning = teamBScore > teamAScore;

  if (variant === "tv") {
    return (
      <div
        className={`rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 ${
          isWinnersCourt 
            ? "border-blue-400 bg-blue-50 shadow-blue-200/50" 
            : "bg-white border-gray-200 hover:shadow-xl"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Court {court.court_num}
            {isWinnersCourt && (
              <span className="ml-2 text-blue-600 text-lg">👑</span>
            )}
          </h3>
          {hasScore && (
            <div className={`text-sm px-3 py-1 rounded-full font-bold ${
              teamAWinning 
                ? "bg-green-100 text-green-800 border border-green-300"
                : teamBWinning
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-gray-100 text-gray-800 border border-gray-300"
            }`}>
              {teamAWinning ? "Team A" : teamBWinning ? "Team B" : "Tied"}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 items-center gap-4 mb-6">
          <div className="text-center">
            <div className="font-bold text-lg text-gray-700 mb-2">Team A</div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-900 truncate">
                {players[court.teamA[0]]?.full_name || 'Player 1'}
              </div>
              <div className="text-lg font-semibold text-gray-900 truncate">
                {players[court.teamA[1]]?.full_name || 'Player 2'}
              </div>
            </div>
          </div>
          <div className="text-center text-gray-400 text-3xl font-bold">VS</div>
          <div className="text-center">
            <div className="font-bold text-lg text-gray-700 mb-2">Team B</div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-900 truncate">
                {players[court.teamB[0]]?.full_name || 'Player 1'}
              </div>
              <div className="text-lg font-semibold text-gray-900 truncate">
                {players[court.teamB[1]]?.full_name || 'Player 2'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">
            <span className={teamAWinning ? "text-green-600" : "text-gray-700"}>
              {teamAScore}
            </span>
            <span className="text-gray-400 mx-3">:</span>
            <span className={teamBWinning ? "text-blue-600" : "text-gray-700"}>
              {teamBScore}
            </span>
          </div>
          {!hasScore && (
            <div className="text-lg text-gray-500 font-medium">
              Starting soon...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
        isWinnersCourt 
          ? "border-blue-300 bg-blue-50" 
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Court {court.court_num}
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
      
      <div className="grid grid-cols-3 items-center gap-4 mb-6">
        <div className="text-center">
          <div className="font-medium text-sm text-gray-500 mb-2">Team A</div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {players[court.teamA[0]]?.full_name || 'Player 1'}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {players[court.teamA[1]]?.full_name || 'Player 2'}
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 text-xl font-bold">VS</div>
        <div className="text-center">
          <div className="font-medium text-sm text-gray-500 mb-2">Team B</div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {players[court.teamB[0]]?.full_name || 'Player 1'}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {players[court.teamB[1]]?.full_name || 'Player 2'}
            </div>
          </div>
        </div>
      </div>
      
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
}



