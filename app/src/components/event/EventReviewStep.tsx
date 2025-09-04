// src/components/event/EventReviewStep.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EventReviewStepProps {
  eventData: {
    name: string;
    mode: string;
    format?: string;
    variant?: string | null;
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

  const getFormatLabel = (format?: string) => {
    switch (format) {
      case 'winners-court': return "Winner's Court";
      case 'americano': return 'Americano';
      default: return format || "Winner's Court";
    }
  };

  const getVariantLabel = (variant?: string | null) => {
    switch (variant) {
      case 'individual': return 'Individual';
      case 'team': return 'Team';
      default: return '';
    }
  };

  const getGameTypeLabel = () => {
    if (eventData.points_per_game) {
      return `${eventData.points_per_game} Points`;
    }
    return `${eventData.round_minutes} Minutes`;
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg bg-white w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-900">
          🎯 Review Your Event
        </CardTitle>
        <p className="text-center text-gray-600">
          Review all details before creating your event.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Event Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Event Name:</span>
                <span className="font-medium text-gray-900">{eventData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <Badge variant="outline" className="border-gray-300 text-gray-700">
                  {getFormatLabel(eventData.format)}
                  {eventData.variant && ` • ${getVariantLabel(eventData.variant)}`}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <Badge variant="outline" className="border-gray-300 text-gray-700">{getModeLabel(eventData.mode)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Game Type:</span>
                <Badge variant="outline" className="border-gray-300 text-gray-700">{getGameTypeLabel()}</Badge>
              </div>
              {eventData.max_rounds && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Rounds:</span>
                  <span className="font-medium text-gray-900">{eventData.max_rounds}</span>
                </div>
              )}
              {eventData.event_duration_hours && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{eventData.event_duration_hours} hours</span>
                </div>
              )}
              {eventData.wildcard_enabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🎲 Wildcards:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Round:</span>
                    <span className="font-medium text-gray-900">{eventData.wildcard_start_round}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium text-gray-900">Every {eventData.wildcard_frequency} rounds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intensity:</span>
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
            <h3 className="text-lg font-semibold text-gray-900">Courts</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Number of Courts:</span>
                <Badge variant="outline" className="border-gray-300 text-gray-700">{eventData.courts}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {eventData.court_names.map((courtName, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">Court {index + 1}:</span>
                    <span className="font-medium text-gray-900">{courtName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Players ({selectedPlayers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedPlayers.map((playerId) => {
              const player = players[playerId];
              if (!player) return null;
              
              const skillLevel = player.elo >= 1500 ? 'Expert' : player.elo >= 1200 ? 'Advanced' : 'Intermediate';
              const skillColor = player.elo >= 1500 ? 'text-green-600' : player.elo >= 1200 ? 'text-yellow-600' : 'text-red-600';
              
              return (
                <div key={playerId} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{player.full_name}</div>
                    <div className="text-sm text-gray-600">
                      ELO: {player.elo} • <span className={skillColor}>{skillLevel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">Event Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{eventData.courts}</div>
              <div className="text-sm text-gray-600">Courts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{selectedPlayers.length}</div>
              <div className="text-sm text-gray-600">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(selectedPlayers.length / 4)}
              </div>
              <div className="text-sm text-gray-600">Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {eventData.points_per_game || eventData.round_minutes}
              </div>
              <div className="text-sm text-gray-600">
                {eventData.points_per_game ? 'Points' : 'Minutes'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline" className="border-gray-300">
            ← Back
          </Button>
          <Button 
            onClick={onCreateEvent} 
            disabled={isCreating}
            style={{ backgroundColor: '#0172fb' }}
            className="hover:opacity-90 text-white disabled:opacity-50"
          >
            {isCreating ? 'Creating Event...' : '🚀 Create Event'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
