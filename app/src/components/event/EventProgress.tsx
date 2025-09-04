// src/components/event/EventProgress.tsx
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CourtMatch } from "@/lib/types";

interface EventProgressProps {
  courts: CourtMatch[];
  roundNum: number;
  totalRounds?: number;
  hasRoundLimit?: boolean;
  format?: string;
  variant?: string;
  players?: Record<string, any>;
  history?: Array<{ roundNum: number; courts: CourtMatch[] }>;
}

export default function EventProgress({ 
  courts, 
  roundNum, 
  totalRounds, 
  hasRoundLimit,
  format,
  variant,
  players,
  history
}: EventProgressProps) {
  const completedMatches = courts.filter(court => 
    court.scoreA !== undefined && court.scoreB !== undefined
  ).length;
  const totalMatches = courts.length;
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  // Check if Americano tournament is mathematically complete
  const isAmericanoComplete = format === 'americano' && variant === 'individual' && players && history && (() => {
    const allPlayers = Object.keys(players);
    if (allPlayers.length === 0) return false;
    
    // Quick calculation: for N players, need N-1 rounds to complete
    const expectedRounds = allPlayers.length - 1;
    return history.length >= expectedRounds;
  })();

  const getCourtStatus = (court: CourtMatch) => {
    if (court.scoreA === undefined || court.scoreB === undefined) {
      return { status: "waiting", label: "Waiting", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" };
    }
    return { status: "completed", label: "Completed", color: "bg-green-500/20 text-green-600 border-green-500/30" };
  };

  return (
    <div className="mb-4 space-y-3 animate-slide-in-top">
      {/* Tournament Completion Banner */}
      {isAmericanoComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Tournament Complete!</h3>
              <p className="text-sm text-green-700">
                All players have partnered with each other in this Americano tournament.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      <Progress value={progressPercentage} className="h-2 animate-scale-in" />

      {/* Court Status Badges */}
      <div className="flex flex-wrap gap-2 stagger-animate">
        {courts.map((court) => {
          const { status, label, color } = getCourtStatus(court);
          return (
            <Badge 
              key={court.court_num} 
              variant="outline" 
              className={`text-xs ${color} w-full sm:w-auto text-center hover-scale transition-transform-smooth`}
            >
              Court {court.court_num}: {label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
