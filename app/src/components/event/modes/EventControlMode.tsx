// src/components/event/modes/EventControlMode.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Users, Trophy, History, Monitor } from "lucide-react";
import CourtCard from "@/components/event/CourtCard";
import EventActionBar from "@/components/event/EventActionBar";
import ScorePad from "@/components/ScorePad";
import type { CourtMatch } from "@/lib/types";

interface EventControlModeProps {
  eventId: string;
  meta: any;
  players: any;
  roundNum: number;
  displayCourts: CourtMatch[];
  history: any[];
  timeText?: string;
  isViewingHistorical: boolean;
  viewingRoundNum: number;
  loadingHistorical: boolean;
  padOpen: boolean;
  padTarget: any;
  
  // Actions
  onSetDisplayMode: () => void;
  onSetTvMode: () => void;
  onScoreEdit: (courtNum: number, scoreA?: number, scoreB?: number) => Promise<void>;
  onRoundChange: (roundNum: number) => void;
  onPrepareAdvanceRound: () => void;
  onUndoLastRound: () => void;
  onEndEvent: () => void;
  onExportEventJSON: () => void;
  onSetPadOpen: (open: boolean) => void;
}

export default function EventControlMode({
  eventId,
  meta,
  players,
  roundNum,
  displayCourts,
  history,
  timeText,
  isViewingHistorical,
  viewingRoundNum,
  loadingHistorical,
  padOpen,
  padTarget,
  onSetDisplayMode,
  onSetTvMode,
  onScoreEdit,
  onRoundChange,
  onPrepareAdvanceRound,
  onUndoLastRound,
  onEndEvent,
  onExportEventJSON,
  onSetPadOpen
}: EventControlModeProps) {

  const eventFormat = meta?.format || '';
  const eventName = meta?.name || 'Unnamed Event';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Control Header */}
      <Card className="border-2 border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {eventName}
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                  {eventFormat === "winners-court" ? "Winner's Court" : 
                   eventFormat === "americano" ? "Americano" : eventFormat}
                </Badge>
                <Badge variant="outline" className="border-gray-300 text-gray-700 px-3 py-1">
                  Round {isViewingHistorical ? viewingRoundNum : roundNum}
                  {isViewingHistorical && " (Historical)"}
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
                onClick={onSetDisplayMode}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Display Mode
              </Button>
              <Button
                onClick={onSetTvMode}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Monitor className="h-4 w-4 mr-2" />
                TV Mode
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Round Navigation for Historical Viewing */}
      {history.length > 1 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-600" />
              <CardTitle className="text-sm font-medium text-gray-700">Round History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {history.map((_, idx) => (
                <Button
                  key={idx + 1}
                  onClick={() => onRoundChange(idx + 1)}
                  variant={viewingRoundNum === idx + 1 ? "default" : "outline"}
                  size="sm"
                  disabled={loadingHistorical}
                  className={viewingRoundNum === idx + 1 ? "bg-blue-600" : ""}
                >
                  Round {idx + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Court Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayCourts.map((court) => (
          <CourtCard
            key={`${court.court_num}-${viewingRoundNum}`}
            court={court}
            players={players}
            useKeypad={true}
            isPointsMode={true}
            courtNames={meta?.court_names}
            isHistorical={false}
            format={eventFormat}
            setScore={onScoreEdit}
            setPadTarget={() => {}}
            setPadOpen={onSetPadOpen}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-lg font-semibold text-gray-900">{roundNum}</div>
            <div className="text-sm text-gray-600">Current Round</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-semibold text-gray-900">
              {Object.keys(players || {}).length}
            </div>
            <div className="text-sm text-gray-600">Players</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-gray-900">{meta?.courts || 0}</div>
            <div className="text-sm text-gray-600">Courts</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-gray-900">{displayCourts.length}</div>
            <div className="text-sm text-gray-600">Matches</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar - Only show for current round */}
      {!isViewingHistorical && (
        <EventActionBar
          loadingRound={false}
          endRoundAndAdvance={onPrepareAdvanceRound}
          undoLastRound={() => {}}
          endEvent={onEndEvent}
          exportEventJSON={() => {}}
          nextRoundIsWildcard={false}
          disabled={false}
          isAmericanoComplete={false}
        />
      )}

      {/* Score Pad Modal */}
      {padOpen && (
        <ScorePad
          open={padOpen}
          onOpenChange={() => onSetPadOpen(false)}
          label="Score Input"
          onSubmit={async (scoreA: number) => {
            if (padTarget) {
              await onScoreEdit(padTarget.court_num, scoreA, 0);
              onSetPadOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}