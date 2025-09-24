// src/components/event/EventHeaderSection.tsx
import { Link } from "react-router-dom";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextWildcardRound } from "@/utils/wildcardUtils";

interface EventMeta {
  name: string;
  format: string;
  points_per_game?: number;
  round_minutes?: number;
  wildcard_intensity?: string;
  court_names?: string[];
}

interface EventHeaderSectionProps {
  meta: EventMeta | null;
  roundNum: number;
  totalPlayers: number;
  eventId: string;
  isDisplayMode: boolean;
  isTvMode: boolean;
}

export default function EventHeaderSection({ 
  meta, 
  roundNum, 
  totalPlayers, 
  eventId, 
  isDisplayMode,
  isTvMode
}: EventHeaderSectionProps) {
  const nextWildcardRound = meta ? getNextWildcardRound(roundNum, meta as any) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
          {meta?.name || 'Loading...'}
        </h1>
        <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
          <span>Round {roundNum}</span>
          <span>•</span>
          <span>{totalPlayers} players</span>
          <span>•</span>
          <span className="capitalize">{meta?.format?.replace('-', ' ') || 'Loading'}</span>
        </div>
        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
          {meta?.points_per_game && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
              {meta.points_per_game} pts/game
            </span>
          )}
          {meta?.round_minutes && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
              {meta.round_minutes} min rounds
            </span>
          )}
          {nextWildcardRound && (
            <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 inline-flex items-center gap-1 px-2 py-1 rounded-md mt-1">
              🎲 Next Wildcard Round {nextWildcardRound}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {!isDisplayMode && !isTvMode && (
          <Link to={`/events/${eventId}/history`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              History
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}