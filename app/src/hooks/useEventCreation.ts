import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ClubSettingsService } from "@/services/api/clubSettingsService";
import { 
  DEFAULT_TOURNAMENT_DEFAULTS, 
  DEFAULT_SCORING_CONFIG, 
  validatePlayerCountForFormat 
} from "@/lib/clubSettings";
import { useToast } from "@/components/ui/use-toast";
import type { UUID } from "@/lib/types";

type Mode = "points" | "time";
type CreationStep = "basic" | "courts" | "wildcards" | "players" | "review";

export interface EventData {
  name: string;
  courts: number;
  mode: Mode;
  format: "winners-court" | "americano";
  variant: "individual" | "team" | null;
  ppg: number;
  roundMinutes: number;
  maxRounds: number;
  eventDurationHours: number;
  useTimeLimit: boolean;
  useRoundLimit: boolean;
  courtNames: string[];
  wildcardEnabled: boolean;
  wildcardStartRound: number;
  wildcardFrequency: number;
  wildcardIntensity: 'mild' | 'medium' | 'mayhem';
  requiredPlayers: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useEventCreation(clubId: string) {
  const { toast } = useToast();
  
  const [eventData, setEventData] = useState<EventData>({
    name: "",
    courts: DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts,
    mode: DEFAULT_TOURNAMENT_DEFAULTS.defaultScoringMode,
    format: DEFAULT_TOURNAMENT_DEFAULTS.defaultFormat,
    variant: null,
    ppg: DEFAULT_SCORING_CONFIG.defaultPointsPerGame,
    roundMinutes: DEFAULT_TOURNAMENT_DEFAULTS.defaultTimePerGame,
    maxRounds: DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxRounds || 8,
    eventDurationHours: DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxDuration || 3,
    useTimeLimit: DEFAULT_TOURNAMENT_DEFAULTS.enableTimeLimits,
    useRoundLimit: DEFAULT_TOURNAMENT_DEFAULTS.enableRoundLimits,
    courtNames: [],
    wildcardEnabled: false,
    wildcardStartRound: 5,
    wildcardFrequency: 3,
    wildcardIntensity: 'medium',
    requiredPlayers: DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts * 4,
  });

  const [selectedPlayers, setSelectedPlayers] = useState<UUID[]>([]);
  const [players, setPlayers] = useState<Record<string, { full_name: string; elo: number }>>({});
  const [playerConfig, setPlayerConfig] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: boolean;
    courts?: boolean;
    ppg?: boolean;
  }>({});

  // Calculate required players when courts or format changes
  useEffect(() => {
    const basicRequired = Math.max(1, eventData.courts) * 4;
    
    let requiredPlayers = basicRequired;
    if (playerConfig) {
      const validation = validatePlayerCountForFormat(basicRequired, eventData.format, playerConfig);
      if (!validation.valid) {
        requiredPlayers = eventData.format === 'winners-court' 
          ? playerConfig.winnersCourtMinPlayers 
          : playerConfig.americanoMinPlayers;
      }
    }
    
    if (requiredPlayers !== eventData.requiredPlayers) {
      setEventData(prev => ({ ...prev, requiredPlayers }));
    }
  }, [eventData.courts, eventData.format, playerConfig, eventData.requiredPlayers]);

  // Load club-specific defaults on component mount
  useEffect(() => {
    if (clubId) {
      loadClubDefaults();
    }
  }, [clubId]);

  const loadClubDefaults = async () => {
    try {
      const [tournamentDefaults, scoringConfig, playerConfiguration] = await Promise.all([
        ClubSettingsService.getTournamentDefaults(clubId),
        ClubSettingsService.getScoringConfig(clubId),
        ClubSettingsService.getPlayerConfig(clubId),
      ]);

      setEventData(prev => ({
        ...prev,
        courts: tournamentDefaults.defaultCourts,
        mode: tournamentDefaults.defaultScoringMode,
        format: tournamentDefaults.defaultFormat,
        roundMinutes: tournamentDefaults.defaultTimePerGame,
        maxRounds: tournamentDefaults.defaultMaxRounds || 8,
        eventDurationHours: tournamentDefaults.defaultMaxDuration || 3,
        useTimeLimit: tournamentDefaults.enableTimeLimits,
        useRoundLimit: tournamentDefaults.enableRoundLimits,
        ppg: scoringConfig.defaultPointsPerGame,
      }));

      setPlayerConfig(playerConfiguration);
    } catch (error) {
      console.error('Failed to load club defaults:', error);
    }
  };

  const loadPlayers = useCallback(async () => {
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
  }, [clubId]);

  const updateEventData = useCallback((updates: Partial<EventData>) => {
    setEventData(prev => ({ ...prev, ...updates }));
    
    // Clear related validation errors when updating
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if ('name' in updates) delete newErrors.name;
      if ('courts' in updates) delete newErrors.courts;
      if ('ppg' in updates) delete newErrors.ppg;
      return newErrors;
    });
  }, []);

  const validateStep = useCallback(async (step: CreationStep, playersList: UUID[]): Promise<ValidationResult> => {
    const errors: string[] = [];

    switch (step) {
      case "basic":
        if (!eventData.name.trim()) errors.push("Event name is required");
        if (eventData.courts < 1) errors.push("Courts must be ≥ 1");
        if (eventData.mode === "points" && eventData.ppg < 10) errors.push("Points per game should be ≥ 10");
        if (eventData.mode === "time" && eventData.roundMinutes <= 0) errors.push("Round minutes must be > 0");
        if (eventData.mode === "points" && eventData.useRoundLimit && eventData.maxRounds <= 0) errors.push("Max rounds must be > 0");
        if (eventData.mode === "points" && eventData.useTimeLimit && eventData.eventDurationHours <= 0) errors.push("Event duration must be > 0");
        break;

      case "players":
        if (playerConfig) {
          const validation = validatePlayerCountForFormat(playersList.length, eventData.format, playerConfig);
          if (!validation.valid && validation.message) {
            errors.push(validation.message);
          }
        } else if (playersList.length < 4) {
          errors.push("You need at least 4 players");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [eventData, playerConfig]);

  const createEvent = useCallback(async (playersList: UUID[]): Promise<boolean> => {
    if (!clubId) {
      toast({
        variant: "destructive",
        title: "Select a club first",
        description: "Open Clubs and select/create a club.",
      });
      return false;
    }

    setIsCreating(true);

    try {
      const insertRow = {
        name: eventData.name.trim(),
        mode: eventData.mode === "points" ? "INDIVIDUAL" : "INDIVIDUAL",
        format: eventData.format,
        variant: eventData.format === "americano" ? eventData.variant : null,
        courts: Math.max(1, eventData.courts),
        court_names: eventData.courtNames,
        round_minutes: eventData.mode === "time" ? eventData.roundMinutes : 0,
        points_per_game: eventData.mode === "points" ? eventData.ppg : 0,
        max_rounds: eventData.mode === "points" && eventData.useRoundLimit ? eventData.maxRounds : null,
        event_duration_hours: eventData.mode === "points" && eventData.useTimeLimit ? eventData.eventDurationHours : null,
        wildcard_enabled: eventData.format === "winners-court" ? eventData.wildcardEnabled : false,
        wildcard_start_round: eventData.format === "winners-court" && eventData.wildcardEnabled ? eventData.wildcardStartRound : null,
        wildcard_frequency: eventData.format === "winners-court" && eventData.wildcardEnabled ? eventData.wildcardFrequency : null,
        wildcard_intensity: eventData.format === "winners-court" && eventData.wildcardEnabled ? eventData.wildcardIntensity : null,
        club_id: clubId,
      };

      const { data: ev, error: evError } = await supabase
        .from("events")
        .insert(insertRow)
        .select("id")
        .single();

      if (evError) throw evError;
      if (!ev?.id) throw new Error("No event ID returned");

      if (playersList.length > 0) {
        const playerInserts = playersList.map(playerId => ({
          event_id: ev.id,
          player_id: playerId,
        }));

        const { error: playerError } = await supabase
          .from("event_players")
          .insert(playerInserts);

        if (playerError) throw playerError;
      }

      return true;
    } catch (error: any) {
      console.error("Failed to create event:", error);
      toast({
        variant: "destructive",
        title: "Failed to create event",
        description: error.message || "Please try again.",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [clubId, eventData, toast]);

  const resetForm = useCallback(() => {
    setEventData({
      name: "",
      courts: DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts,
      mode: DEFAULT_TOURNAMENT_DEFAULTS.defaultScoringMode,
      format: DEFAULT_TOURNAMENT_DEFAULTS.defaultFormat,
      variant: null,
      ppg: DEFAULT_SCORING_CONFIG.defaultPointsPerGame,
      roundMinutes: DEFAULT_TOURNAMENT_DEFAULTS.defaultTimePerGame,
      maxRounds: DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxRounds || 8,
      eventDurationHours: DEFAULT_TOURNAMENT_DEFAULTS.defaultMaxDuration || 3,
      useTimeLimit: DEFAULT_TOURNAMENT_DEFAULTS.enableTimeLimits,
      useRoundLimit: DEFAULT_TOURNAMENT_DEFAULTS.enableRoundLimits,
      courtNames: [],
      wildcardEnabled: false,
      wildcardStartRound: 5,
      wildcardFrequency: 3,
      wildcardIntensity: 'medium',
      requiredPlayers: DEFAULT_TOURNAMENT_DEFAULTS.defaultCourts * 4,
    });
    setSelectedPlayers([]);
    setValidationErrors({});
  }, []);

  return {
    eventData,
    updateEventData,
    selectedPlayers,
    setSelectedPlayers,
    players,
    validationErrors,
    isCreating,
    createEvent,
    resetForm,
    validateStep,
    loadPlayers,
  };
}