// src/components/event/CourtsGrid.tsx
import { CourtMatch } from "@/lib/types";
import CourtCard from "@/components/event/CourtCard";

interface Player {
  id: string;
  full_name: string;
  elo: number;
}

interface EventMeta {
  court_names?: string[];
  format?: string;
  points_per_game?: number;
}

interface PadTarget {
  court: number;
  side: "A" | "B";
  value?: number;
}

interface CourtsGridProps {
  courts: CourtMatch[];
  players: Record<string, Player>;
  meta: EventMeta | null;
  isDisplayMode: boolean;
  isTvMode: boolean;
  isViewingHistorical: boolean;
  initializing: boolean;
  roundNum: number;
  viewingRoundNum: number;
  isPointsMode: boolean;
  onScoreEdit: (courtNum: number, scoreA?: number, scoreB?: number) => void;
  onPadOpen: (target: PadTarget) => void;
}

export default function CourtsGrid({
  courts,
  players,
  meta,
  isDisplayMode,
  isTvMode,
  isViewingHistorical,
  initializing,
  roundNum,
  viewingRoundNum,
  isPointsMode,
  onScoreEdit,
  onPadOpen
}: CourtsGridProps) {
  if (initializing) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up round {roundNum}...</p>
      </div>
    );
  }

  const courtsToDisplay = courts.filter(court => court.court_num > 0);
  const gridColumns = Math.min(courtsToDisplay.length, 3);

  return (
    <div 
      className="grid gap-6 h-full" 
      style={{
        gridTemplateColumns: gridColumns === 1 ? '1fr' 
          : gridColumns === 2 ? 'repeat(2, 1fr)' 
          : 'repeat(auto-fit, minmax(300px, 1fr))'
      }}
    >
      {courtsToDisplay.map((court) => {
        const teamA = court.teamA?.length === 2 ? court.teamA : [null, null];
        const teamB = court.teamB?.length === 2 ? court.teamB : [null, null];
        
        const playerA1 = teamA[0] ? players[teamA[0]] : null;
        const playerA2 = teamA[1] ? players[teamA[1]] : null;
        const playerB1 = teamB[0] ? players[teamB[0]] : null;
        const playerB2 = teamB[1] ? players[teamB[1]] : null;

        return (
          <div key={court.court_num} className="transition-all">
            <CourtCard
              court={court}
              players={players}
              useKeypad={!isDisplayMode && !isTvMode}
              isPointsMode={isPointsMode}
              courtNames={meta?.court_names}
              isHistorical={isViewingHistorical}
              displayMode={isDisplayMode}
              tvMode={isTvMode}
              format={meta?.format}
              setScore={onScoreEdit}
              setPadTarget={(target) => onPadOpen(target)}
              setPadOpen={(open) => {
                // This will be handled by the parent component
              }}
            />
          </div>
        );
      })}
    </div>
  );
}