import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { EventData } from "@/hooks/useEventCreation";

interface BasicEventFormProps {
  eventData: EventData;
  onUpdate: (updates: Partial<EventData>) => void;
  validationErrors: { name?: boolean; courts?: boolean; ppg?: boolean };
  onNext: () => void;
  onCancel: () => void;
  getEventTerminology: () => string;
  getPlayerTerminology: () => string;
}

export default function BasicEventForm({
  eventData,
  onUpdate,
  validationErrors,
  onNext,
  onCancel,
  getEventTerminology,
  getPlayerTerminology
}: BasicEventFormProps) {
  
  const getFormatDescription = (format: "winners-court" | "americano", variant?: "individual" | "team" | null) => {
    switch (format) {
      case "winners-court":
        return "Classic tournament format where winners advance and losers drop down courts. Perfect for competitive play.";
      case "americano":
        if (variant === "individual") {
          return "Social format where players rotate partners each round. Everyone plays with everyone exactly once.";
        } else if (variant === "team") {
          return "Team-based format with fixed partnerships using Swiss-style pairing for competitive balance.";
        }
        return "Choose Individual (rotating partners) or Team (fixed partnerships) variant below.";
      default:
        return "Set your event format, courts, and basic settings.";
    }
  };

  const getFormatButtonDescription = (format: "winners-court" | "americano") => {
    switch (format) {
      case "winners-court":
        return "Winners advance up courts, competitive ranking";
      case "americano":
        return "Social play with partner rotation or team format";
      default:
        return "";
    }
  };

  const getPlaceholderText = () => {
    if (eventData.format === "americano") {
      return eventData.variant === "team"
        ? `Americano Teams ${getEventTerminology()} — Thu`
        : `Americano Social ${getEventTerminology()} — Thu`;
    }
    return `Winner's Court ${getEventTerminology()} — Thu`;
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg bg-white w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-gray-900">Step 1: Event Basics</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {getFormatDescription(eventData.format, eventData.variant)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Name + Courts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-name" className="text-sm font-medium text-gray-700">Event name</Label>
              <Input
                id="ev-name"
                value={eventData.name}
                onChange={(e) => {
                  onUpdate({ name: e.target.value });
                  if (validationErrors.name) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.name;
                    // Note: We'd need to expose setValidationErrors for this to work
                    // For now, we'll rely on the hook to clear errors
                  }
                }}
                placeholder={getPlaceholderText()}
                className={`bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 ${
                  validationErrors.name 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-courts" className="text-sm font-medium text-gray-700">Courts</Label>
              <Input
                id="ev-courts"
                type="number"
                min={1}
                value={eventData.courts}
                onChange={(e) => {
                  onUpdate({ courts: Number(e.target.value) || 1 });
                  if (validationErrors.courts) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.courts;
                    // Note: We'd need to expose setValidationErrors for this to work
                  }
                }}
                className={`bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 ${
                  validationErrors.courts 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              <div className="text-xs text-gray-600">
                You'll need <span className="font-semibold">{eventData.requiredPlayers}</span> {getPlayerTerminology()} for {eventData.courts} courts.
              </div>
            </div>
          </div>

          <Separator />

          {/* Format selection */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-gray-700">Format</Label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  eventData.format === "winners-court"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onUpdate({ format: "winners-court", variant: null })}
              >
                Winner's Court
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  eventData.format === "americano"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onUpdate({ format: "americano", variant: "individual" })}
              >
                Americano
              </button>
            </div>
            
            {/* Format-specific description */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-medium text-gray-900">
                  {eventData.format === "winners-court" ? "Winner's Court:" : "Americano:"}
                </span>{" "}
                {getFormatButtonDescription(eventData.format)}
              </p>
            </div>

            {eventData.format === "americano" && (
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">Americano Variant</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      eventData.variant === "individual"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => onUpdate({ variant: "individual" })}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      eventData.variant === "team"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => onUpdate({ variant: "team" })}
                  >
                    Team
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  {eventData.variant === "individual" 
                    ? "Players rotate partners each round, maximize partner variety"
                    : "Fixed teams compete in Swiss-style or round-robin format"
                  }
                </div>
              </div>
            )}
          </div>

          {/* Mode selection */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-gray-700">Scoring Mode</Label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  eventData.mode === "points"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onUpdate({ mode: "points" })}
              >
                Points
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  eventData.mode === "time"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onUpdate({ mode: "time" })}
              >
                Time
              </button>
            </div>
          </div>

          {/* Mode-specific fields */}
          {eventData.mode === "points" ? (
            <div className="space-y-4">
              {/* Points per game */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-ppg" className="text-sm font-medium text-gray-700">Points per game</Label>
                  <Input
                    id="ev-ppg"
                    type="number"
                    min={10}
                    value={eventData.ppg}
                    onChange={(e) => onUpdate({ ppg: Number(e.target.value) || 0 })}
                    className={`bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 ${
                      validationErrors.ppg 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                  />
                  <div className="text-xs text-gray-600">
                    Typical: 21 (also 24, 28, 32)
                  </div>
                </div>
              </div>

              {/* Round and Time Limits */}
              <div className="space-y-3">
                <Label className="block text-sm font-medium text-gray-700">Event Limits (Optional)</Label>
                
                {/* Round Limit */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-round-limit"
                    checked={eventData.useRoundLimit}
                    onCheckedChange={(checked) => onUpdate({ useRoundLimit: checked })}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="use-round-limit" className="text-sm text-gray-700">Limit total rounds</Label>
                </div>
                
                {eventData.useRoundLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-max-rounds" className="text-sm font-medium text-gray-700">Max rounds</Label>
                      <Input
                        id="ev-max-rounds"
                        type="number"
                        min={1}
                        value={eventData.maxRounds}
                        onChange={(e) => onUpdate({ maxRounds: Number(e.target.value) || 0 })}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-xs text-gray-600">
                        Event ends after this many rounds
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Limit */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-time-limit"
                    checked={eventData.useTimeLimit}
                    onCheckedChange={(checked) => onUpdate({ useTimeLimit: checked })}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="use-time-limit" className="text-sm text-gray-700">Limit total time</Label>
                </div>
                
                {eventData.useTimeLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-duration" className="text-sm font-medium text-gray-700">Event duration (hours)</Label>
                      <Input
                        id="ev-duration"
                        type="number"
                        min={1}
                        max={24}
                        value={eventData.eventDurationHours}
                        onChange={(e) => onUpdate({ eventDurationHours: Number(e.target.value) || 0 })}
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-xs text-gray-600">
                        Event ends after this time
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ev-min" className="text-sm font-medium text-gray-700">Round minutes</Label>
                <Input
                  id="ev-min"
                  type="number"
                  min={1}
                  value={eventData.roundMinutes}
                  onChange={(e) => onUpdate({ roundMinutes: Number(e.target.value) || 0 })}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-600">Score freezes when time is up.</div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button onClick={onCancel} variant="outline" className="border-gray-300">
              Cancel
            </Button>
            <Button
              onClick={onNext}
              style={{ backgroundColor: '#0172fb' }}
              className="hover:opacity-90 text-white"
            >
              Next: Name Courts →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}