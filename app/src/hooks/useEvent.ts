import { useCallback } from 'react';
import { EventService, type Event, type EventPlayer, type Round, type Match } from '@/services';
import { useSupabaseQuery, useSupabaseQueryList, useSupabaseMutation } from './useSupabaseQuery';

/**
 * Hook for managing a single event
 */
export function useEvent(eventId: string | null) {
  const eventQuery = useSupabaseQuery(
    () => EventService.getEvent(eventId!),
    [eventId],
    { enabled: !!eventId }
  );

  const playersQuery = useSupabaseQueryList(
    () => EventService.getEventPlayers(eventId!),
    [eventId],
    { enabled: !!eventId }
  );

  const roundsQuery = useSupabaseQueryList(
    () => EventService.getEventRounds(eventId!),
    [eventId],
    { enabled: !!eventId }
  );

  const updateEventMutation = useSupabaseMutation<Event, { eventId: string; updates: Partial<Event> }>();

  const updateEvent = useCallback(async (updates: Partial<Event>) => {
    if (!eventId) return null;
    
    const result = await updateEventMutation.mutate(
      ({ eventId, updates }) => EventService.updateEvent(eventId, updates),
      { eventId, updates }
    );

    if (result) {
      eventQuery.refetch();
    }

    return result;
  }, [eventId, updateEventMutation, eventQuery]);

  const addPlayersToEvent = useCallback(async (playerIds: string[]) => {
    if (!eventId) return;

    const mutation = useSupabaseMutation<void, { eventId: string; playerIds: string[] }>();
    await mutation.mutate(
      ({ eventId, playerIds }) => EventService.addPlayersToEvent(eventId, playerIds),
      { eventId, playerIds }
    );

    playersQuery.refetch();
  }, [eventId, playersQuery]);

  const removePlayersFromEvent = useCallback(async (playerIds: string[]) => {
    if (!eventId) return;

    const mutation = useSupabaseMutation<void, { eventId: string; playerIds: string[] }>();
    await mutation.mutate(
      ({ eventId, playerIds }) => EventService.removePlayersFromEvent(eventId, playerIds),
      { eventId, playerIds }
    );

    playersQuery.refetch();
  }, [eventId, playersQuery]);

  return {
    event: eventQuery.data,
    players: playersQuery.data,
    rounds: roundsQuery.data,
    loading: eventQuery.loading || playersQuery.loading || roundsQuery.loading,
    error: eventQuery.error || playersQuery.error || roundsQuery.error,
    refetch: () => {
      eventQuery.refetch();
      playersQuery.refetch();
      roundsQuery.refetch();
    },
    updateEvent,
    addPlayersToEvent,
    removePlayersFromEvent,
    updating: updateEventMutation.loading,
    updateError: updateEventMutation.error,
  };
}

/**
 * Hook for managing events list
 */
export function useEvents(clubId?: string) {
  const eventsQuery = useSupabaseQueryList(
    () => EventService.getEvents(clubId),
    [clubId]
  );

  const createEventMutation = useSupabaseMutation<Event, Omit<Event, 'id' | 'created_at'>>();

  const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'created_at'>) => {
    const result = await createEventMutation.mutate(
      (data) => EventService.createEvent(data),
      eventData
    );

    if (result) {
      eventsQuery.refetch();
    }

    return result;
  }, [createEventMutation, eventsQuery]);

  return {
    events: eventsQuery.data,
    loading: eventsQuery.loading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
    createEvent,
    creating: createEventMutation.loading,
    createError: createEventMutation.error,
  };
}

/**
 * Hook for managing a specific round with matches
 */
export function useRound(eventId: string | null) {
  const latestRoundQuery = useSupabaseQuery(
    () => EventService.getLatestRoundWithMatches(eventId!),
    [eventId],
    { enabled: !!eventId, refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  const updateScoreMutation = useSupabaseMutation<void, {
    roundId: string;
    courtNum: number;
    scoreA: number;
    scoreB: number;
  }>();

  const updateMatchScore = useCallback(async (
    courtNum: number,
    scoreA: number,
    scoreB: number
  ) => {
    const round = latestRoundQuery.data?.round;
    if (!round) return;

    await updateScoreMutation.mutate(
      ({ roundId, courtNum, scoreA, scoreB }) => 
        EventService.updateMatchScore(roundId, courtNum, scoreA, scoreB),
      { roundId: round.id, courtNum, scoreA, scoreB }
    );

    // Refetch to get updated data
    latestRoundQuery.refetch();
  }, [latestRoundQuery, updateScoreMutation]);

  return {
    round: latestRoundQuery.data?.round || null,
    matches: latestRoundQuery.data?.matches || [],
    loading: latestRoundQuery.loading,
    error: latestRoundQuery.error,
    refetch: latestRoundQuery.refetch,
    updateMatchScore,
    updatingScore: updateScoreMutation.loading,
    updateScoreError: updateScoreMutation.error,
  };
}
