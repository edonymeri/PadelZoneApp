// src/components/event/EventCreationWizard.tsx
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useEventCreation } from "@/hooks/useEventCreation";
import { useClubBranding } from "@/hooks/useClubBranding";
import BasicEventForm from "@/components/event/forms/BasicEventForm";
import CourtNamingStep from "@/components/event/CourtNamingStep";
import WildcardConfigStep from "@/components/event/WildcardConfigStep";
import PlayerAssignmentStep from "@/components/event/PlayerAssignmentStep";
import EventReviewStep from "@/components/event/EventReviewStep";
import type { UUID } from "@/lib/types";

type CreationStep = "basic" | "courts" | "wildcards" | "players" | "review";

interface EventCreationWizardProps {
  clubId: string;
  onEventCreated: () => void;
  onCancel: () => void;
}

export default function EventCreationWizard({ clubId, onEventCreated, onCancel }: EventCreationWizardProps) {
  const { toast } = useToast();
  const [creationStep, setCreationStep] = useState<CreationStep>("basic");
  
  const {
    eventData,
    updateEventData,
    selectedPlayers,
    setSelectedPlayers,
    players,
    validationErrors,
    isCreating,
    createEvent: handleCreateEvent,
    resetForm,
    validateStep,
    loadPlayers
  } = useEventCreation(clubId);

  const { getEventTerminology, getPlayerTerminology } = useClubBranding(clubId);

  // Load players when reaching players step
  useEffect(() => {
    if (creationStep === "players") {
      loadPlayers();
    }
  }, [creationStep, loadPlayers]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [creationStep]);

  const getNextStep = (currentStep: CreationStep): CreationStep => {
    const stepFlow: Record<CreationStep, CreationStep> = {
      basic: "courts",
      courts: eventData.format === "americano" ? "players" : "wildcards",
      wildcards: "players",
      players: "review",
      review: "review" // Terminal state
    };
    return stepFlow[currentStep];
  };

  const getPreviousStep = (currentStep: CreationStep): CreationStep => {
    const stepFlow: Record<CreationStep, CreationStep> = {
      basic: "basic", // Terminal state
      courts: "basic",
      wildcards: "courts",
      players: eventData.format === "americano" ? "courts" : "wildcards",
      review: "players"
    };
    return stepFlow[currentStep];
  };

  const handleNextStep = async () => {
    const validation = await validateStep(creationStep, selectedPlayers);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({ variant: "destructive", title: error });
      });
      return;
    }

    const nextStep = getNextStep(creationStep);
    if (nextStep !== creationStep) {
      setCreationStep(nextStep);
    }
  };

  const handleBackStep = () => {
    const previousStep = getPreviousStep(creationStep);
    if (previousStep !== creationStep) {
      setCreationStep(previousStep);
    }
  };

  const handleCancelCreation = () => {
    setCreationStep("basic");
    resetForm();
    onCancel();
  };

  const createEvent = async () => {
    const success = await handleCreateEvent(selectedPlayers);
    if (success) {
      toast({
        title: "Event created successfully!",
        description: `"${eventData.name}" is ready to go with ${selectedPlayers.length} players.`,
      });
      handleCancelCreation();
      onEventCreated();
    }
  };

  const stepComponents = {
    basic: (
      <BasicEventForm
        eventData={eventData}
        onUpdate={updateEventData}
        validationErrors={validationErrors}
        onNext={handleNextStep}
        onCancel={handleCancelCreation}
        getEventTerminology={getEventTerminology}
        getPlayerTerminology={getPlayerTerminology}
      />
    ),
    courts: (
      <CourtNamingStep
        numberOfCourts={eventData.courts}
        format={eventData.format}
        variant={eventData.variant}
        courtNames={eventData.courtNames}
        onCourtNamesChange={(names) => updateEventData({ courtNames: names })}
        onNext={handleNextStep}
        onBack={handleBackStep}
      />
    ),
    wildcards: eventData.format === "winners-court" ? (
      <WildcardConfigStep
        wildcardEnabled={eventData.wildcardEnabled}
        setWildcardEnabled={(enabled) => updateEventData({ wildcardEnabled: enabled })}
        wildcardStartRound={eventData.wildcardStartRound}
        setWildcardStartRound={(round) => updateEventData({ wildcardStartRound: round })}
        wildcardFrequency={eventData.wildcardFrequency}
        setWildcardFrequency={(freq) => updateEventData({ wildcardFrequency: freq })}
        wildcardIntensity={eventData.wildcardIntensity}
        setWildcardIntensity={(intensity) => updateEventData({ wildcardIntensity: intensity })}
        onNext={handleNextStep}
        onBack={handleBackStep}
        isValid={true}
      />
    ) : null,
    players: (
      <PlayerAssignmentStep
        clubId={clubId}
        selectedPlayers={selectedPlayers}
        onSelectedPlayersChange={setSelectedPlayers}
        onNext={handleNextStep}
        onBack={handleBackStep}
        requiredPlayers={eventData.requiredPlayers}
        format={eventData.format}
      />
    ),
    review: (
      <EventReviewStep
        eventData={{
          name: eventData.name,
          mode: eventData.mode === "points" ? "INDIVIDUAL" : "INDIVIDUAL",
          format: eventData.format,
          variant: eventData.format === "americano" ? eventData.variant : null,
          courts: eventData.courts,
          court_names: eventData.courtNames,
          round_minutes: eventData.mode === "time" ? eventData.roundMinutes : 0,
          points_per_game: eventData.mode === "points" ? eventData.ppg : 0,
          max_rounds: eventData.mode === "points" && eventData.useRoundLimit ? eventData.maxRounds : null,
          event_duration_hours: eventData.mode === "points" && eventData.useTimeLimit ? eventData.eventDurationHours : null,
          wildcard_enabled: eventData.wildcardEnabled,
          wildcard_start_round: eventData.wildcardEnabled ? eventData.wildcardStartRound : null,
          wildcard_frequency: eventData.wildcardEnabled ? eventData.wildcardFrequency : null,
          wildcard_intensity: eventData.wildcardEnabled ? eventData.wildcardIntensity : null,
        }}
        selectedPlayers={selectedPlayers}
        players={players}
        onBack={handleBackStep}
        onCreateEvent={createEvent}
        isCreating={isCreating}
      />
    ),
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto px-4 py-6">
      {stepComponents[creationStep]}
    </div>
  );
}