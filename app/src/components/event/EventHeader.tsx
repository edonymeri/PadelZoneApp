// src/components/event/EventHeader.tsx
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, History, Users, Trophy } from "lucide-react";

interface EventHeaderProps {
  meta: {
    name: string;
    courts: number;
    round_minutes: number;
    points_per_game?: number;
    max_rounds?: number;
    event_duration_hours?: number;
    ended_at?: string | null;
  } | null;
  roundNum: number; // Currently viewing round number
  hasRoundLimit?: boolean;
  onRoundChange?: (roundNum: number) => void;
  totalCompletedRounds?: number; // Total rounds available to navigate to
  currentRoundNum?: number; // Actual current round (for "Back to Current")
  isViewingHistorical?: boolean;
  isWildcardRound?: boolean; // Is the currently viewing round a wildcard
  nextWildcardRound?: number | null; // Next wildcard round number
  useKeypad?: boolean;
  setUseKeypad?: (value: boolean) => void;
  eventId?: string;
}

export default function EventHeader({ 
  meta, 
  roundNum, 
  hasRoundLimit, 
  onRoundChange,
  totalCompletedRounds,
  currentRoundNum,
  isViewingHistorical = false,
  isWildcardRound = false,
  nextWildcardRound = null,
  useKeypad,
  setUseKeypad,
  eventId
}: EventHeaderProps) {
  const isPointsMode = (meta?.points_per_game ?? 0) > 0;
  const isEnded = !!meta?.ended_at;

  // Calculate total rounds for display
  const totalRounds = hasRoundLimit ? meta?.max_rounds : undefined;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 animate-slide-in-top">
      {/* Mobile-First Layout */}
      <div className="space-y-4">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{meta?.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start whitespace-nowrap ${
              isEnded 
                ? "bg-red-100 text-red-700 border border-red-200" 
                : "bg-green-100 text-green-700 border border-green-200"
            }`}>
              {isEnded ? "🔴 Ended" : "🟢 Active"}
            </span>
          </div>
          
          {/* Controls - Always visible at top on mobile */}
          <div className="flex flex-col gap-2 sm:hidden">
            <div className="flex gap-2">
              {useKeypad !== undefined && setUseKeypad && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1">
                  <Label htmlFor="keypad-mobile" className="text-xs font-medium text-gray-700">
                    Keypad
                  </Label>
                  <Switch 
                    id="keypad-mobile" 
                    checked={useKeypad} 
                    onCheckedChange={setUseKeypad}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              )}
              
              {eventId && (
                <Button asChild variant="outline" size="sm" className="border-gray-300 flex-1">
                  <Link to={`/players?eventId=${eventId}`} className="flex items-center justify-center">
                    <Users className="w-4 h-4 mr-1" />
                    Players
                  </Link>
                </Button>
              )}
              {eventId && (
                <Button asChild variant="outline" size="sm" className="border-gray-300 flex-1">
                  <Link to={`/scoreboard/${eventId}`} className="flex items-center justify-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    Scoreboard
                  </Link>
                </Button>
              )}
            </div>
            <Button asChild variant="outline" size="sm" className="border-gray-300">
              <Link to="/events" className="flex items-center justify-center">
                ← Events
              </Link>
            </Button>
          </div>
        </div>

        {/* Info Grid - Mobile responsive */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>{meta?.courts} courts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span>{isPointsMode ? `${meta?.points_per_game} pts` : `${meta?.round_minutes} min`}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            <span>Round {roundNum}{totalRounds ? ` of ${totalRounds}` : ''}</span>
          </div>
          {isWildcardRound && (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              <span className="text-purple-600 font-medium">🎲 Wildcard Round</span>
            </div>
          )}
          {!isWildcardRound && nextWildcardRound && (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span className="text-yellow-600">Next wildcard: Round {nextWildcardRound}</span>
            </div>
          )}
        </div>

        {/* Round Navigation - Mobile responsive */}
        {onRoundChange && totalCompletedRounds && totalCompletedRounds >= 1 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">View Round:</span>
                <span className="sm:hidden">Round:</span>
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRoundChange(Math.max(1, roundNum - 1))}
                  disabled={roundNum <= 1}
                  className="h-8 w-8 p-0 border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className={`px-3 py-1 rounded-lg text-sm font-medium flex-1 sm:flex-initial text-center ${
                  isViewingHistorical 
                    ? "bg-amber-100 text-amber-700 border border-amber-200" 
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}>
                  <span className="hidden sm:inline">Round {roundNum} {isViewingHistorical ? "(Historical)" : "(Current)"}</span>
                  <span className="sm:hidden">R{roundNum} {isViewingHistorical ? "(Past)" : "(Now)"}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRoundChange(Math.min(totalCompletedRounds || roundNum, roundNum + 1))}
                  disabled={roundNum >= (totalCompletedRounds || roundNum)}
                  className="h-8 w-8 p-0 border-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {isViewingHistorical && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRoundChange(currentRoundNum || totalCompletedRounds || roundNum)}
                  className="text-xs border-green-300 text-green-600 hover:bg-green-50 w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Back to Current</span>
                  <span className="sm:hidden">Current</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Controls - Hidden on mobile */}
        <div className="hidden sm:flex justify-end">
          <div className="flex items-center gap-3">
            {useKeypad !== undefined && setUseKeypad && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Label htmlFor="keypad-desktop" className="text-xs font-medium text-gray-700">
                  Keypad
                </Label>
                <Switch 
                  id="keypad-desktop" 
                  checked={useKeypad} 
                  onCheckedChange={setUseKeypad}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            )}
            
            {eventId && (
              <Button asChild variant="outline" className="border-gray-300 hover-scale transition-transform-smooth">
                <Link to={`/scoreboard/${eventId}`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Scoreboard
                </Link>
              </Button>
            )}
            {eventId && (
              <Button asChild variant="outline" className="border-gray-300 hover-scale transition-transform-smooth">
                <Link to={`/players?eventId=${eventId}`}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Players
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="border-gray-300 hover-scale transition-transform-smooth">
              <Link to="/events">← Back to Events</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
