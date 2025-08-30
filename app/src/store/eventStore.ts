import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EventService, type Event, type EventPlayer, type Round, type Match } from '@/services';
import type { CourtMatch, UUID } from '@/lib/types';

interface EventState {
  // Current event data
  currentEvent: Event | null;
  players: Record<UUID, EventPlayer['players']>;
  rounds: Round[];
  currentRound: Round | null;
  matches: Match[];
  courts: CourtMatch[];
  
  // UI state
  loading: boolean;
  error: string | null;
  updatingScore: boolean;
  scoreUpdateError: string | null;
  
  // Actions
  loadEvent: (eventId: string) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  addPlayersToEvent: (eventId: string, playerIds: string[]) => Promise<void>;
  removePlayersFromEvent: (eventId: string, playerIds: string[]) => Promise<void>;
  updateMatchScore: (courtNum: number, scoreA: number, scoreB: number) => Promise<void>;
  createRound: (eventId: string) => Promise<void>;
  refreshCurrentRound: (eventId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearEvent: () => void;
}

function convertMatchesToCourts(matches: Match[], players: Record<UUID, EventPlayer['players']>): CourtMatch[] {
  return matches.map(match => ({
    court_num: match.court_num,
    teamA: [match.team_a_player1, match.team_a_player2] as [UUID, UUID],
    teamB: [match.team_b_player1, match.team_b_player2] as [UUID, UUID],
    scoreA: match.score_a,
    scoreB: match.score_b,
  }));
}

export const useEventStore = create<EventState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentEvent: null,
      players: {},
      rounds: [],
      currentRound: null,
      matches: [],
      courts: [],
      loading: false,
      error: null,
      updatingScore: false,
      scoreUpdateError: null,

      // Actions
      loadEvent: async (eventId: string) => {
        set({ loading: true, error: null });
        
        try {
          const [event, eventPlayers, rounds] = await Promise.all([
            EventService.getEvent(eventId),
            EventService.getEventPlayers(eventId),
            EventService.getEventRounds(eventId),
          ]);

          // Convert players array to lookup object
          const playersMap: Record<UUID, EventPlayer['players']> = {};
          eventPlayers.forEach(ep => {
            playersMap[ep.players.id] = ep.players;
          });

          // Get latest round with matches
          const { round, matches } = await EventService.getLatestRoundWithMatches(eventId);
          const courts = convertMatchesToCourts(matches, playersMap);

          set({
            currentEvent: event,
            players: playersMap,
            rounds,
            currentRound: round,
            matches,
            courts,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || 'Failed to load event',
          });
        }
      },

      updateEvent: async (eventId: string, updates: Partial<Event>) => {
        try {
          const updatedEvent = await EventService.updateEvent(eventId, updates);
          set({ currentEvent: updatedEvent });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update event' });
        }
      },

      addPlayersToEvent: async (eventId: string, playerIds: string[]) => {
        try {
          await EventService.addPlayersToEvent(eventId, playerIds);
          // Reload event data to get updated players
          await get().loadEvent(eventId);
        } catch (error: any) {
          set({ error: error.message || 'Failed to add players to event' });
        }
      },

      removePlayersFromEvent: async (eventId: string, playerIds: string[]) => {
        try {
          await EventService.removePlayersFromEvent(eventId, playerIds);
          // Reload event data to get updated players
          await get().loadEvent(eventId);
        } catch (error: any) {
          set({ error: error.message || 'Failed to remove players from event' });
        }
      },

      updateMatchScore: async (courtNum: number, scoreA: number, scoreB: number) => {
        const { currentRound, players } = get();
        if (!currentRound) return;

        set({ updatingScore: true, scoreUpdateError: null });

        try {
          // Optimistic update
          const updatedCourts = get().courts.map(court =>
            court.court_num === courtNum
              ? { ...court, scoreA, scoreB }
              : court
          );
          set({ courts: updatedCourts });

          // Update in database
          await EventService.updateMatchScore(currentRound.id, courtNum, scoreA, scoreB);
          
          set({ updatingScore: false });
        } catch (error: any) {
          // Revert optimistic update on error
          const { round, matches } = await EventService.getLatestRoundWithMatches(currentRound.event_id);
          if (round && matches) {
            const courts = convertMatchesToCourts(matches, players);
            set({ courts });
          }
          
          set({
            updatingScore: false,
            scoreUpdateError: error.message || 'Failed to update score',
          });
        }
      },

      createRound: async (eventId: string) => {
        const { rounds } = get();
        const nextRoundNum = Math.max(...rounds.map(r => r.round_num), 0) + 1;
        
        try {
          const newRound = await EventService.createRound(eventId, nextRoundNum);
          set({
            rounds: [...rounds, newRound],
            currentRound: newRound,
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to create round' });
        }
      },

      refreshCurrentRound: async (eventId: string) => {
        try {
          const { round, matches } = await EventService.getLatestRoundWithMatches(eventId);
          const { players } = get();
          const courts = convertMatchesToCourts(matches, players);

          set({
            currentRound: round,
            matches,
            courts,
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to refresh round' });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearEvent: () => {
        set({
          currentEvent: null,
          players: {},
          rounds: [],
          currentRound: null,
          matches: [],
          courts: [],
          loading: false,
          error: null,
          updatingScore: false,
          scoreUpdateError: null,
        });
      },
    }),
    {
      name: 'event-store',
    }
  )
);
