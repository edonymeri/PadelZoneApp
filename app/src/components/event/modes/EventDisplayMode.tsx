// src/components/event/modes/EventDisplayMode.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Eye, Clock } from "lucide-react";
import LeaderboardTable from "@/components/scoreboard/LeaderboardTable";
import { useEventDisplay } from "@/hooks/useEventDisplay";

interface EventDisplayModeProps {
  eventId: string;
  eventName: string;
  format: string;
  currentRound: number;
  timeText?: string;
  isTvMode?: boolean;
  onSetControlMode: () => void;
}

export default function EventDisplayMode({
  eventId,
  eventName,
  format,
  currentRound,
  timeText,
  isTvMode = false,
  onSetControlMode
}: EventDisplayModeProps) {
  const { leaderboard, isRefreshing, refreshLeaderboard } = useEventDisplay(eventId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Event Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className={`font-bold text-gray-900 mb-2 ${isTvMode ? 'text-3xl' : 'text-2xl'}`}>
                {eventName}
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                  {format === "winners-court" ? "Winner's Court" : 
                   format === "americano" ? "Americano" : format}
                </Badge>
                <Badge variant="outline" className="border-gray-300 text-gray-700 px-3 py-1">
                  Round {currentRound}
                </Badge>
                {timeText && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700 px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeText}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshLeaderboard}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              {!isTvMode && (
                <Button
                  onClick={onSetControlMode}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Control Mode
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Live Leaderboard */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`font-semibold text-gray-900 ${isTvMode ? 'text-xl' : 'text-lg'}`}>
              Live Rankings
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LeaderboardTable 
            rows={leaderboard} 
            largeScale={isTvMode}
          />
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        Rankings update automatically every 30 seconds
      </div>
    </div>
  );
}