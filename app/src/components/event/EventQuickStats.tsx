// src/components/event/EventQuickStats.tsx
import { ChevronDown, ChevronUp, Trophy, Users, Target } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CourtMatch } from "@/lib/types";

type Player = { id: string; full_name: string; elo: number };

interface EventQuickStatsProps {
  courts: CourtMatch[];
  players: Record<string, Player>;
  roundNum: number;
  isTimeMode: boolean;
  timeText: string;
  hasTimeLimit?: boolean;
  isWildcardRound?: boolean;
  nextWildcardRound?: number | null;
}

export default function EventQuickStats({ 
  courts, 
  players, 
  roundNum, 
  isTimeMode, 
  timeText,
  hasTimeLimit,
  isWildcardRound = false,
  nextWildcardRound = null
}: EventQuickStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedMatches = courts.filter(court => 
    court.scoreA !== undefined && court.scoreB !== undefined
  ).length;
  const totalMatches = courts.length;
  const completionRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  const totalPlayers = Object.keys(players).length;
  const activePlayers = new Set(
    courts.flatMap(court => [...court.teamA, ...court.teamB])
  ).size;

  const averageScore = completedMatches > 0 
    ? Math.round(
        courts.reduce((sum, court) => {
          if (court.scoreA !== undefined && court.scoreB !== undefined) {
            return sum + court.scoreA + court.scoreB;
          }
          return sum;
        }, 0) / (completedMatches * 2)
      )
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Quick Stats</h3>
            <p className="text-gray-600 text-sm">Round {roundNum} overview</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Always visible stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold mb-1" style={{ color: '#0172fb' }}>{completionRate}%</div>
          <div className="text-sm text-gray-600">Completion</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{completedMatches}/{totalMatches}</div>
          <div className="text-sm text-gray-600">Matches</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">{activePlayers}</div>
          <div className="text-sm text-gray-600">Active Players</div>
        </div>
        {(isTimeMode || hasTimeLimit) && (
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{timeText}</div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
        )}
      </div>

      {/* Expanded stats */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">{totalPlayers} Total Players</div>
                <div className="text-xs text-gray-600">Registered</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">{averageScore}</div>
                <div className="text-xs text-gray-600">Avg Score</div>
              </div>
            </div>
            
            {/* Wildcard info */}
            {(isWildcardRound || nextWildcardRound) && (
              <div className="flex items-center gap-3 col-span-2">
                <span className="text-2xl">🎲</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {isWildcardRound ? 'Wildcard Round Active!' : `Next Wildcard: Round ${nextWildcardRound}`}
                  </div>
                  <div className="text-xs text-gray-600">
                    {isWildcardRound ? 'Players randomly redistributed' : 'Chaos incoming!'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Court breakdown */}
          <div>
            <div className="text-sm font-medium text-gray-900 mb-3">Court Status:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {courts.map((court) => {
                const isComplete = court.scoreA !== undefined && court.scoreB !== undefined;
                return (
                  <div 
                    key={court.court_num}
                    className={`text-xs p-2 rounded-lg border font-medium ${
                      isComplete 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}
                  >
                    Court {court.court_num}: {isComplete ? '✓' : '⏳'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
