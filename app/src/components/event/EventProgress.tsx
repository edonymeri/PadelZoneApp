// src/components/event/EventProgress.tsx
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CourtMatch } from "@/lib/types";

interface EventProgressProps {
  courts: CourtMatch[];
  roundNum: number;
  totalRounds?: number;
  hasRoundLimit?: boolean;
}

export default function EventProgress({ courts, roundNum, totalRounds, hasRoundLimit }: EventProgressProps) {
  const completedMatches = courts.filter(court => 
    court.scoreA !== undefined && court.scoreB !== undefined
  ).length;
  const totalMatches = courts.length;
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const getCourtStatus = (court: CourtMatch) => {
    if (court.scoreA === undefined || court.scoreB === undefined) {
      return { status: "waiting", label: "Waiting", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" };
    }
    return { status: "completed", label: "Completed", color: "bg-green-500/20 text-green-600 border-green-500/30" };
  };

  return (
    <div className="mb-4 space-y-3 animate-slide-in-top">
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
