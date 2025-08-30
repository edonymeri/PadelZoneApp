// src/components/event/EventReviewStep.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EventReviewStepProps {
  eventData: {
    name: string;
    mode: string;
    courts: number;
    court_names: string[];
    round_minutes: number;
    points_per_game?: number;
    max_rounds?: number;
    event_duration_hours?: number;
    wildcard_enabled?: boolean;
    wildcard_start_round?: number;
    wildcard_frequency?: number;
    wildcard_intensity?: 'mild' | 'medium' | 'mayhem';
  };
  selectedPlayers: string[];
  players: Record<string, { full_name: string; elo: number }>;
  onBack: () => void;
  onCreateEvent: () => void;
  isCreating: boolean;
}

export default function EventReviewStep({
  eventData,
  selectedPlayers,
  players,
  onBack,
  onCreateEvent,
  isCreating
}: EventReviewStepProps) {
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'INDIVIDUAL': return 'Individual';
      case 'TEAMS': return 'Teams';
      default: return mode;
    }
  };

  const getGameTypeLabel = () => {
    if (eventData.points_per_game) {
      return `${eventData.points_per_game} Points`;
    }
    return `${eventData.round_minutes} Minutes`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          🎯 Review Your Event
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Review all details before creating your event.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-300">Event Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event Name:</span>
                <span className="font-medium">{eventData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant="outline">{getModeLabel(eventData.mode)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Game Type:</span>
                <Badge variant="outline">{getGameTypeLabel()}</Badge>
              </div>
              {eventData.max_rounds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Rounds:</span>
                  <span className="font-medium">{eventData.max_rounds}</span>
                </div>
              )}
              {eventData.event_duration_hours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{eventData.event_duration_hours} hours</span>
                </div>
              )}
              {eventData.wildcard_enabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🎲 Wildcards:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Round:</span>
                    <span className="font-medium">{eventData.wildcard_start_round}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">Every {eventData.wildcard_frequency} rounds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intensity:</span>
                    <Badge variant="outline" className={
                      eventData.wildcard_intensity === 'mild' ? 'bg-green-50 text-green-700 border-green-200' :
                      eventData.wildcard_intensity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }>
                      {eventData.wildcard_intensity?.charAt(0).toUpperCase() + eventData.wildcard_intensity?.slice(1)}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Courts Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-300">Courts</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Courts:</span>
                <Badge variant="outline">{eventData.courts}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {eventData.court_names.map((courtName, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-muted-foreground">Court {index + 1}:</span>
                    <span className="font-medium text-green-300">{courtName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-300">Players ({selectedPlayers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedPlayers.map((playerId) => {
              const player = players[playerId];
              if (!player) return null;
              
              const skillLevel = player.elo >= 1500 ? 'Expert' : player.elo >= 1200 ? 'Advanced' : 'Intermediate';
              const skillColor = player.elo >= 1500 ? 'text-green-300' : player.elo >= 1200 ? 'text-yellow-300' : 'text-red-300';
              
              return (
                <div key={playerId} className="flex items-center gap-3 p-3 border rounded-lg bg-background/50">
                  <div className="flex-1">
                    <div className="font-medium">{player.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      ELO: {player.elo} • <span className={skillColor}>{skillLevel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-3">Event Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-300">{eventData.courts}</div>
              <div className="text-sm text-muted-foreground">Courts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">{selectedPlayers.length}</div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300">
                {Math.floor(selectedPlayers.length / 4)}
              </div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">
                {eventData.points_per_game || eventData.round_minutes}
              </div>
              <div className="text-sm text-muted-foreground">
                {eventData.points_per_game ? 'Points' : 'Minutes'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
          <Button 
            onClick={onCreateEvent} 
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? 'Creating Event...' : '🎾 Create Event'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
