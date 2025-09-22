// src/components/event/EventCreationWizard.tsx
import { useState, useEffect, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ClubSettingsService } from "@/services/api/clubSettingsService";
import { DEFAULT_TOURNAMENT_DEFAULTS, DEFAULT_SCORING_CONFIG, validatePlayerCountForFormat } from "@/lib/clubSettings";
import { useClubBranding } from "@/hooks/useClubBranding";
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
  format, setFormat,
  variant, setVariant,
  ppg, setPPG, 
  roundMinutes, setRoundMinutes, 
  maxRounds, setMaxRounds, 
  eventDurationHours, setEventDurationHours, 
  useTimeLimit, setUseTimeLimit, 
  useRoundLimit, setUseRoundLimit, 
  requiredPlayers, 
  clubId, 
  handleNextStep, 
  handleCancelCreation,
  validationErrors,
  setValidationErrors,
  getEventTerminology,
  getPlayerTerminology
}: {
  name: string;
  setName: (value: string) => void;
  courts: number;
  setCourts: (value: number) => void;
  mode: "points" | "time";
  setMode: (value: "points" | "time") => void;
  format: "winners-court" | "americano";
  setFormat: (value: "winners-court" | "americano") => void;
  variant: "individual" | "team" | null;
  setVariant: (value: "individual" | "team" | null) => void;
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
  validationErrors: { name?: boolean; courts?: boolean; ppg?: boolean };
  setValidationErrors: (errors: { name?: boolean; courts?: boolean; ppg?: boolean }) => void;
  getEventTerminology: () => string;
  getPlayerTerminology: () => string;
}) => {
  // Helper function to get format-specific descriptions
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

  return (
    <Card className="border-2 border-gray-200 shadow-lg bg-white w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-gray-900">Step 1: Event Basics</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {getFormatDescription(format, variant)}
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
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Clear validation error when user starts typing
                    if (validationErrors.name) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.name;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder={
                    format === "americano" 
                      ? variant === "team"
                        ? `Americano Teams ${getEventTerminology()} — Thu`
                        : `Americano Social ${getEventTerminology()} — Thu`
                      : `Winner's Court ${getEventTerminology()} — Thu`
                  }
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
                  value={courts}
                  onChange={(e) => {
                    setCourts(Number(e.target.value) || 1);
                    // Clear validation error when user starts typing
                    if (validationErrors.courts) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.courts;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={`bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 ${
                    validationErrors.courts 
                      ? "border-red-500 focus:border-red-500" 
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              <div className="text-xs text-gray-600">
                You'll need <span className="font-semibold">{requiredPlayers}</span> players for {courts} courts.
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
                  format === "winners-court"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setFormat("winners-court");
                  setVariant(null);
                }}
              >
                Winner's Court
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  format === "americano"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setFormat("americano");
                  setVariant("individual"); // Default to individual
                }}
              >
                Americano
              </button>
            </div>
            
            {/* Format-specific description */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-medium text-gray-900">
                  {format === "winners-court" ? "Winner's Court:" : "Americano:"}
                </span>{" "}
                {getFormatButtonDescription(format)}
              </p>
            </div>

            {format === "americano" && (
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-700">Americano Variant</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      variant === "individual"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setVariant("individual")}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      variant === "team"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setVariant("team")}
                  >
                    Team
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  {variant === "individual" 
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
                  mode === "points"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setMode("points")}
              >
                Points
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === "time"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setMode("time")}
              >
                Time
              </button>
            </div>
          </div>          {/* Mode-specific fields */}
          {mode === "points" ? (
            <div className="space-y-4">
              {/* Points per game */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-ppg" className="text-sm font-medium text-gray-700">Points per game</Label>
                  <Input
                    id="ev-ppg"
                    type="number"
                    min={10}
                    value={ppg}
                    onChange={(e) => {
                      setPPG(Number(e.target.value) || 0);
                      // Clear validation error when user starts typing
                      if (validationErrors.ppg) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.ppg;
                        setValidationErrors(newErrors);
                      }
                    }}
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
                    checked={useRoundLimit}
                    onCheckedChange={setUseRoundLimit}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="use-round-limit" className="text-sm text-gray-700">Limit total rounds</Label>
                </div>
                
                {useRoundLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-max-rounds" className="text-sm font-medium text-gray-700">Max rounds</Label>
                      <Input
                        id="ev-max-rounds"
                        type="number"
                        min={1}
                        value={maxRounds}
                        onChange={(e) => setMaxRounds(Number(e.target.value) || 0)}
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
                    checked={useTimeLimit}
                    onCheckedChange={setUseTimeLimit}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="use-time-limit" className="text-sm text-gray-700">Limit total time</Label>
                </div>
                
                {useTimeLimit && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ev-duration" className="text-sm font-medium text-gray-700">Event duration (hours)</Label>
                      <Input
                        id="ev-duration"
                        type="number"
                        min={1}
                        max={24}
                        value={eventDurationHours}
                        onChange={(e) => setEventDurationHours(Number(e.target.value) || 0)}
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
                  value={roundMinutes}
                  onChange={(e) => setRoundMinutes(Number(e.target.value) || 0)}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-600">Score freezes when time is up.</div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button onClick={handleCancelCreation} variant="outline" className="border-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!clubId}
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

  // Club branding configuration
  const { getEventTerminology, getPlayerTerminology } = useClubBranding(clubId);

  // Multi-step event creation state
  const [creationStep, setCreationStep] = useState<CreationStep>("basic");
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Basic event info
  const [name, setName] = useState("");
  const [courts, setCourts] = useState<number>(DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts);
  const [mode, setMode] = useState<Mode>(DEFAULT_TOURNAMENT_DEFAULTS.defaultScoringMode);
  const [format, setFormat] = useState<"winners-court" | "americano">(DEFAULT_TOURNAMENT_DEFAULTS.defaultFormat);
  const [variant, setVariant] = useState<"individual" | "team" | null>(null);
  const [ppg, setPPG] = useState<number>(DEFAULT_SCORING_CONFIG.defaultPointsPerGame);
  const [roundMinutes, setRoundMinutes] = useState<number>(DEFAULT_TOURNAMENT_DEFAULTS.defaultTimePerGame);
  const [maxRounds, setMaxRounds] = useState<number>(DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxRounds || 8);
  const [eventDurationHours, setEventDurationHours] = useState<number>(DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxDuration || 3);
  const [useTimeLimit, setUseTimeLimit] = useState<boolean>(DEFAULT_TOURNAMENT_DEFAULTS.enableTimeLimits);
  const [useRoundLimit, setUseRoundLimit] = useState<boolean>(DEFAULT_TOURNAMENT_DEFAULTS.enableRoundLimits);

  // Step 2: Court naming
  const [courtNames, setCourtNames] = useState<string[]>([]);

  // Step 3: Wildcard configuration
  const [wildcardEnabled, setWildcardEnabled] = useState<boolean>(false);
  const [wildcardStartRound, setWildcardStartRound] = useState<number>(5);
  const [wildcardFrequency, setWildcardFrequency] = useState<number>(3);
  const [wildcardIntensity, setWildcardIntensity] = useState<'mild' | 'medium' | 'mayhem'>('medium');

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    name?: boolean;
    courts?: boolean;
    ppg?: boolean;
  }>({});

  // Step 4: Player assignment
  const [selectedPlayers, setSelectedPlayers] = useState<UUID[]>([]);
  const [players, setPlayers] = useState<Record<string, { full_name: string; elo: number }>>({});
  const [playerConfig, setPlayerConfig] = useState<any>(null);

  // Format-aware required players calculation
  const requiredPlayers = useMemo(() => {
    const basicRequired = Math.max(1, courts) * 4;
    
    // Add format-specific validation if player config is loaded
    if (playerConfig) {
      const validation = validatePlayerCountForFormat(basicRequired, format, playerConfig);
      if (!validation.valid) {
        // Return minimum valid count for the format
        return format === 'winners-court' 
          ? playerConfig.winnersCourtMinPlayers 
          : playerConfig.americanoMinPlayers;
      }
    }
    
    return basicRequired;
  }, [courts, format, playerConfig]);

  // Load club-specific tournament defaults on component mount
  useEffect(() => {
    if (clubId) {
      const loadClubDefaults = async () => {
        try {
          // Load tournament defaults
          const tournamentDefaults = await ClubSettingsService.getTournamentDefaults(clubId);
          
          // Load scoring configuration for points per game default
          const scoringConfig = await ClubSettingsService.getScoringConfig(clubId);
          
          // Load player configuration for format validation
          const playerConfiguration = await ClubSettingsService.getPlayerConfig(clubId);
          
          // Update state with club-specific defaults
          setCourts(tournamentDefaults.defaultCourts);
          setMode(tournamentDefaults.defaultScoringMode);
          setFormat(tournamentDefaults.defaultFormat);
          setRoundMinutes(tournamentDefaults.defaultTimePerGame);
          setMaxRounds(tournamentDefaults.defaultMaxRounds || 8);
          setEventDurationHours(tournamentDefaults.defaultMaxDuration || 3);
          setUseTimeLimit(tournamentDefaults.enableTimeLimits);
          setUseRoundLimit(tournamentDefaults.enableRoundLimits);
          
          // Set points per game from scoring config
          setPPG(scoringConfig.defaultPointsPerGame);
          
          // Set player configuration
          setPlayerConfig(playerConfiguration);
        } catch (error) {
          console.error('Failed to load club defaults:', error);
          // Defaults are already set from DEFAULT_TOURNAMENT_DEFAULTS
        }
      };
      
      loadClubDefaults();
    }
  }, [clubId]);

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

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [creationStep]);

  // Multi-step navigation
  const handleNextStep = () => {
    // Reset validation errors
    setValidationErrors({});
    
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    switch (creationStep) {
      case "basic":
        const errors: { name?: boolean; courts?: boolean; ppg?: boolean } = {};
        
        if (!name.trim()) {
          errors.name = true;
          toast({ variant: "destructive", title: "Event name is required" });
        }
        if (courts < 1) {
          errors.courts = true;
          toast({ variant: "destructive", title: "Courts must be ≥ 1" });
        }
        if (mode === "points" && ppg < 10) {
          errors.ppg = true;
          toast({ variant: "destructive", title: "Points per game should be ≥ 10 (e.g., 21)" });
        }
        if (mode === "time" && roundMinutes <= 0) {
          toast({ variant: "destructive", title: "Round minutes must be > 0" });
        }
        if (mode === "points" && useRoundLimit && maxRounds <= 0) {
          toast({ variant: "destructive", title: "Max rounds must be > 0" });
        }
        if (mode === "points" && useTimeLimit && eventDurationHours <= 0) {
          toast({ variant: "destructive", title: "Event duration must be > 0" });
        }
        
        // If there are errors, set them and return
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
        
        setCreationStep("courts");
        break;
      case "courts":
        // Skip wildcards step for Americano format
        if (format === "americano") {
          setCreationStep("players");
        } else {
          setCreationStep("wildcards");
        }
        break;
      case "wildcards":
        setCreationStep("players");
        break;
      case "players":
        // Use format-aware player validation
        if (playerConfig) {
          const validation = validatePlayerCountForFormat(selectedPlayers.length, format, playerConfig);
          if (!validation.valid) {
            toast({ 
              variant: "destructive", 
              title: validation.message || `You need ${requiredPlayers} players for this format` 
            });
            return;
          }
        } else if (selectedPlayers.length < 4) {
          toast({ variant: "destructive", title: "You need at least 4 players" });
          return;
        }
        setCreationStep("review");
        break;
    }
  };

  const handleBackStep = () => {
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    switch (creationStep) {
      case "courts":
        setCreationStep("basic");
        break;
      case "wildcards":
        setCreationStep("courts");
        break;
      case "players":
        // Skip wildcards step for Americano format when going back
        if (format === "americano") {
          setCreationStep("courts");
        } else {
          setCreationStep("wildcards");
        }
        break;
      case "review":
        setCreationStep("players");
        break;
    }
  };

  const handleCancelCreation = () => {
    setCreationStep("basic");
    // Reset form state to defaults
    setName("");
    setCourts(DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts);
    setMode(DEFAULT_TOURNAMENT_DEFAULTS.defaultScoringMode);
    setFormat(DEFAULT_TOURNAMENT_DEFAULTS.defaultFormat);
    setVariant(null);
    setPPG(DEFAULT_SCORING_CONFIG.defaultPointsPerGame);
    setRoundMinutes(DEFAULT_TOURNAMENT_DEFAULTS.defaultTimePerGame);
    setMaxRounds(DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxRounds || 8);
    setEventDurationHours(DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxDuration || 3);
    setUseTimeLimit(DEFAULT_TOURNAMENT_DEFAULTS.enableTimeLimits);
    setUseRoundLimit(DEFAULT_TOURNAMENT_DEFAULTS.enableRoundLimits);
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
        format: format,
        variant: format === "americano" ? variant : null,
        courts: Math.max(1, courts),
        court_names: courtNames,
        round_minutes: mode === "time" ? roundMinutes : 0,
        points_per_game: mode === "points" ? ppg : 0,
        max_rounds: mode === "points" && useRoundLimit ? maxRounds : null,
        event_duration_hours: mode === "points" && useTimeLimit ? eventDurationHours : null,
        // Only include wildcard settings for Winner's Court format
        wildcard_enabled: format === "winners-court" ? wildcardEnabled : false,
        wildcard_start_round: format === "winners-court" && wildcardEnabled ? wildcardStartRound : null,
        wildcard_frequency: format === "winners-court" && wildcardEnabled ? wildcardFrequency : null,
        wildcard_intensity: format === "winners-court" && wildcardEnabled ? wildcardIntensity : null,
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
    <div className="space-y-6 w-full max-w-4xl mx-auto px-4 py-6">
      {creationStep === "basic" && (
        <BasicEventForm
          name={name}
          setName={setName}
          courts={courts}
          setCourts={setCourts}
          mode={mode}
          setMode={setMode}
          format={format}
          setFormat={setFormat}
          variant={variant}
          setVariant={setVariant}
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
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          getEventTerminology={getEventTerminology}
          getPlayerTerminology={getPlayerTerminology}
        />
      )}
      {creationStep === "courts" && (
        <CourtNamingStep
          numberOfCourts={courts}
          format={format}
          variant={variant}
          courtNames={courtNames}
          onCourtNamesChange={setCourtNames}
          onNext={handleNextStep}
          onBack={handleBackStep}
        />
      )}
      {creationStep === "wildcards" && format === "winners-court" && (
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
          requiredPlayers={requiredPlayers}
          format={format}
        />
      )}
      {creationStep === "review" && (
        <EventReviewStep
          eventData={{
            name,
            mode: mode === "points" ? "INDIVIDUAL" : "INDIVIDUAL",
            format: format,
            variant: format === "americano" ? variant : null,
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
