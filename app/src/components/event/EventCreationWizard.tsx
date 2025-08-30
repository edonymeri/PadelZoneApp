// src/components/event/EventCreationWizard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import CourtNamingStep from "@/components/event/CourtNamingStep";
import WildcardConfigStep from "@/components/event/WildcardConfigStep";
import PlayerAssignmentStep from "@/components/event/PlayerAssignmentStep";
import EventReviewStep from "@/components/event/EventReviewStep";
import type { UUID } from "@/lib/types";

// Basic Event Creation Form Component
const BasicEventForm = ({ 
  name, setName, 
  courts, setCourts, 
  mode, setMode, 
  ppg, setPPG, 
  roundMinutes, setRoundMinutes, 
  maxRounds, setMaxRounds, 
  eventDurationHours, setEventDurationHours, 
  useTimeLimit, setUseTimeLimit, 
  useRoundLimit, setUseRoundLimit, 
  requiredPlayers, 
  clubId, 
  handleNextStep, 
  handleCancelCreation 
}: {
  name: string;
  setName: (value: string) => void;
  courts: number;
  setCourts: (value: number) => void;
  mode: "points" | "time";
  setMode: (value: "points" | "time") => void;
  ppg: number;
  setPPG: (value: number) => void;
  roundMinutes: number;
  setRoundMinutes: (value: number) => void;
  maxRounds: number;
  setMaxRounds: (value: number) => void;
  eventDurationHours: number;
  setEventDurationHours: (value: number) => void;
  useTimeLimit: boolean;
  setUseTimeLimit: (value: boolean) => void;
  useRoundLimit: boolean;
  setUseRoundLimit: (value: boolean) => void;
  requiredPlayers: number;
  clubId: string;
  handleNextStep: () => void;
  handleCancelCreation: () => void;
}) => {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Step 1: Event Basics</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Set your event name, format, and courts. You'll name courts and add players next.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Name + Courts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-name">Event name</Label>
              <Input
                id="ev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mexicano Night — Thu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-courts">Courts</Label>
              <Input
                id="ev-courts"
                type="number"
                min={1}
                value={courts}
                onChange={(e) => setCourts(Number(e.target.value) || 1)}
              />
              <div className="text-xs text-muted-foreground">
                You'll need <span className="font-semibold">{requiredPlayers}</span> players for {courts} courts.
              </div>
            </div>
          </div>

          <Separator />

          {/* Mode selection */}
          <div className="space-y-3">
            <Label className="block">Format</Label>
            <div className="w-full max-w-[420px] segment">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="segment-btn"
                  aria-pressed={mode === "points"}
                  onClick={() => setMode("points")}
                >
                  Points
                </button>
                <button
                  type="button"
                  className="segment-btn"
                  aria-pressed={mode === "time"}
                  onClick={() => setMode("time")}
                >
                  Time
                </button>
              </div>
            </div>
          </div>

          {/* Mode-specific fields */}
          {mode === "points" ? (
            <div className="space-y-4">
              {/* Points per game */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-ppg">Points per game</Label>
                  <Input
                    id="ev-ppg"
                    type="number"
                    min={10}
                    value={ppg}
                    onChange={(e) => setPPG(Number(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Typical: 21 (also 24, 28, 32)
                  </div>
                </div>
              </div>

              {/* Round and Time Limits */}
              <div className="space-y-3">
                <Label className="block">Event Limits (Optional)</Label>
                
                {/* Round Limit */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-round-limit"
                    checked={useRoundLimit}
                    onCheckedChange={setUseRoundLimit}
                  />
                  <Label htmlFor="use-round-limit">Limit total rounds</Label>
                </div>
                
                {useRoundLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-max-rounds">Max rounds</Label>
                      <Input
                        id="ev-max-rounds"
                        type="number"
                        min={1}
                        value={maxRounds}
                        onChange={(e) => setMaxRounds(Number(e.target.value) || 0)}
                      />
                      <div className="text-xs text-muted-foreground">
                        Event ends after this many rounds
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Limit */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-time-limit"
                    checked={useTimeLimit}
                    onCheckedChange={setUseTimeLimit}
                  />
                  <Label htmlFor="use-time-limit">Limit total time</Label>
                </div>
                
                {useTimeLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-duration">Event duration (hours)</Label>
                      <Input
                        id="ev-duration"
                        type="number"
                        min={1}
                        max={24}
                        value={eventDurationHours}
                        onChange={(e) => setEventDurationHours(Number(e.target.value) || 0)}
                      />
                      <div className="text-xs text-muted-foreground">
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
                <Label htmlFor="ev-min">Round minutes</Label>
                <Input
                  id="ev-min"
                  type="number"
                  min={1}
                  value={roundMinutes}
                  onChange={(e) => setRoundMinutes(Number(e.target.value) || 0)}
                />
                <div className="text-xs text-muted-foreground">Score freezes when time is up.</div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button onClick={handleCancelCreation} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!clubId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next: Name Courts →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type Mode = "points" | "time";
type CreationStep = "basic" | "courts" | "wildcards" | "players" | "review";

interface EventCreationWizardProps {
  clubId: string;
  onEventCreated: () => void;
  onCancel: () => void;
}

export default function EventCreationWizard({ clubId, onEventCreated, onCancel }: EventCreationWizardProps) {
  const { toast } = useToast();

  // Multi-step event creation state
  const [creationStep, setCreationStep] = useState<CreationStep>("basic");
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Basic event info
  const [name, setName] = useState("");
  const [courts, setCourts] = useState<number>(4);
  const [mode, setMode] = useState<Mode>("points");
  const [ppg, setPPG] = useState<number>(21);
  const [roundMinutes, setRoundMinutes] = useState<number>(10);
  const [maxRounds, setMaxRounds] = useState<number>(8);
  const [eventDurationHours, setEventDurationHours] = useState<number>(3);
  const [useTimeLimit, setUseTimeLimit] = useState<boolean>(false);
  const [useRoundLimit, setUseRoundLimit] = useState<boolean>(true);

  // Step 2: Court naming
  const [courtNames, setCourtNames] = useState<string[]>([]);

  // Step 3: Wildcard configuration
  const [wildcardEnabled, setWildcardEnabled] = useState<boolean>(false);
  const [wildcardStartRound, setWildcardStartRound] = useState<number>(5);
  const [wildcardFrequency, setWildcardFrequency] = useState<number>(3);
  const [wildcardIntensity, setWildcardIntensity] = useState<'mild' | 'medium' | 'mayhem'>('medium');

  // Step 4: Player assignment
  const [selectedPlayers, setSelectedPlayers] = useState<UUID[]>([]);
  const [players, setPlayers] = useState<Record<string, { full_name: string; elo: number }>>({});

  const requiredPlayers = Math.max(1, courts) * 4;

  // Load players for player assignment step
  useEffect(() => {
    if (creationStep === "players" && clubId) {
      const loadPlayers = async () => {
        try {
          const { data, error } = await supabase
            .from('players')
            .select('id, full_name, elo')
            .eq('club_id', clubId)
            .order('full_name');

          if (error) throw error;
          
          const playersMap: Record<string, { full_name: string; elo: number }> = {};
          (data || []).forEach(player => {
            playersMap[player.id] = { full_name: player.full_name, elo: player.elo };
          });
          setPlayers(playersMap);
        } catch (error) {
          console.error('Failed to load players:', error);
        }
      };

      loadPlayers();
    }
  }, [creationStep, clubId]);

  // Multi-step navigation
  const handleNextStep = () => {
    switch (creationStep) {
      case "basic":
        if (!name.trim()) {
          toast({ variant: "destructive", title: "Event name is required" });
          return;
        }
        if (courts < 1) {
          toast({ variant: "destructive", title: "Courts must be ≥ 1" });
          return;
        }
        if (mode === "points" && ppg < 10) {
          toast({ variant: "destructive", title: "Points per game should be ≥ 10 (e.g., 21)" });
          return;
        }
        if (mode === "time" && roundMinutes <= 0) {
          toast({ variant: "destructive", title: "Round minutes must be > 0" });
          return;
        }
        if (mode === "points" && useRoundLimit && maxRounds <= 0) {
          toast({ variant: "destructive", title: "Max rounds must be > 0" });
          return;
        }
        if (mode === "points" && useTimeLimit && eventDurationHours <= 0) {
          toast({ variant: "destructive", title: "Event duration must be > 0" });
          return;
        }
        setCreationStep("courts");
        break;
      case "courts":
        setCreationStep("wildcards");
        break;
      case "wildcards":
        setCreationStep("players");
        break;
      case "players":
        if (selectedPlayers.length < 4) {
          toast({ variant: "destructive", title: "You need at least 4 players" });
          return;
        }
        setCreationStep("review");
        break;
    }
  };

  const handleBackStep = () => {
    switch (creationStep) {
      case "courts":
        setCreationStep("basic");
        break;
      case "wildcards":
        setCreationStep("courts");
        break;
      case "players":
        setCreationStep("wildcards");
        break;
      case "review":
        setCreationStep("players");
        break;
    }
  };

  const handleCancelCreation = () => {
    setCreationStep("basic");
    // Reset form state
    setName("");
    setCourts(4);
    setMode("points");
    setPPG(21);
    setRoundMinutes(10);
    setMaxRounds(8);
    setEventDurationHours(3);
    setUseTimeLimit(false);
    setUseRoundLimit(true);
    setCourtNames([]);
    setWildcardEnabled(false);
    setWildcardStartRound(5);
    setWildcardFrequency(3);
    setWildcardIntensity('medium');
    setSelectedPlayers([]);
    onCancel();
  };

  async function createEvent() {
    if (!clubId) {
      toast({
        variant: "destructive",
        title: "Select a club first",
        description: "Open Clubs and select/create a club.",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create the event
      const insertRow = {
        name: name.trim(),
        mode: mode === "points" ? "INDIVIDUAL" : "INDIVIDUAL", // Default to individual for now
        courts: Math.max(1, courts),
        court_names: courtNames,
        round_minutes: mode === "time" ? roundMinutes : 0,
        points_per_game: mode === "points" ? ppg : 0,
        max_rounds: mode === "points" && useRoundLimit ? maxRounds : null,
        event_duration_hours: mode === "points" && useTimeLimit ? eventDurationHours : null,
        wildcard_enabled: wildcardEnabled,
        wildcard_start_round: wildcardEnabled ? wildcardStartRound : null,
        wildcard_frequency: wildcardEnabled ? wildcardFrequency : null,
        wildcard_intensity: wildcardEnabled ? wildcardIntensity : null,
        club_id: clubId,
      };

      const { data: ev, error: evError } = await supabase
        .from("events")
        .insert(insertRow)
        .select("id")
        .single();

      if (evError) throw evError;
      if (!ev?.id) throw new Error("No event ID returned");

      // Insert selected players
      if (selectedPlayers.length > 0) {
        const playerInserts = selectedPlayers.map(playerId => ({
          event_id: ev.id,
          player_id: playerId,
        }));

        const { error: playerError } = await supabase
          .from("event_players")
          .insert(playerInserts);

        if (playerError) throw playerError;
      }

      toast({
        title: "Event created successfully!",
        description: `"${name}" is ready to go with ${selectedPlayers.length} players.`,
      });

      // Reset form and close
      handleCancelCreation();
      onEventCreated();
    } catch (error: any) {
      console.error("Failed to create event:", error);
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {creationStep === "basic" && (
        <BasicEventForm
          name={name}
          setName={setName}
          courts={courts}
          setCourts={setCourts}
          mode={mode}
          setMode={setMode}
          ppg={ppg}
          setPPG={setPPG}
          roundMinutes={roundMinutes}
          setRoundMinutes={setRoundMinutes}
          maxRounds={maxRounds}
          setMaxRounds={setMaxRounds}
          eventDurationHours={eventDurationHours}
          setEventDurationHours={setEventDurationHours}
          useTimeLimit={useTimeLimit}
          setUseTimeLimit={setUseTimeLimit}
          useRoundLimit={useRoundLimit}
          setUseRoundLimit={setUseRoundLimit}
          requiredPlayers={requiredPlayers}
          clubId={clubId}
          handleNextStep={handleNextStep}
          handleCancelCreation={handleCancelCreation}
        />
      )}
      {creationStep === "courts" && (
        <CourtNamingStep
          numberOfCourts={courts}
          courtNames={courtNames}
          onCourtNamesChange={setCourtNames}
          onNext={handleNextStep}
          onBack={handleBackStep}
        />
      )}
      {creationStep === "wildcards" && (
        <WildcardConfigStep
          wildcardEnabled={wildcardEnabled}
          setWildcardEnabled={setWildcardEnabled}
          wildcardStartRound={wildcardStartRound}
          setWildcardStartRound={setWildcardStartRound}
          wildcardFrequency={wildcardFrequency}
          setWildcardFrequency={setWildcardFrequency}
          wildcardIntensity={wildcardIntensity}
          setWildcardIntensity={setWildcardIntensity}
          onNext={handleNextStep}
          onBack={handleBackStep}
          isValid={true} // Always valid since wildcards are optional
        />
      )}
      {creationStep === "players" && (
        <PlayerAssignmentStep
          clubId={clubId}
          selectedPlayers={selectedPlayers}
          onSelectedPlayersChange={setSelectedPlayers}
          onNext={handleNextStep}
          onBack={handleBackStep}
        />
      )}
      {creationStep === "review" && (
        <EventReviewStep
          eventData={{
            name,
            mode: mode === "points" ? "INDIVIDUAL" : "INDIVIDUAL",
            courts,
            court_names: courtNames,
            round_minutes: mode === "time" ? roundMinutes : 0,
            points_per_game: mode === "points" ? ppg : 0,
            max_rounds: mode === "points" && useRoundLimit ? maxRounds : null,
            event_duration_hours: mode === "points" && useTimeLimit ? eventDurationHours : null,
            wildcard_enabled: wildcardEnabled,
            wildcard_start_round: wildcardEnabled ? wildcardStartRound : null,
            wildcard_frequency: wildcardEnabled ? wildcardFrequency : null,
            wildcard_intensity: wildcardEnabled ? wildcardIntensity : null,
          }}
          selectedPlayers={selectedPlayers}
          players={players}
          onBack={handleBackStep}
          onCreateEvent={createEvent}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
