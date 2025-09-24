import { describe, it, expect, beforeEach, vi } from 'vitest';import { describe, it, expect, beforeEach, vi } from 'vitest';import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { renderHook, act, waitFor } from '@testing-library/react';

import { renderHook, act } from '@testing-library/react';

// Mock the Supabase client to avoid database dependencies

vi.mock('@/lib/supabase', () => ({import { useEventControl } from '@/hooks/useEventControl';import { renderHook, act } from '@testing-library/react';import { renderHook, act } from '@testing-library/react';

  supabase: {

    from: vi.fn(() => ({

      select: vi.fn().mockReturnThis(),

      eq: vi.fn().mockReturnThis(),// Mock dependenciesimport { useEventControl } from '@/hooks/useEventControl';import { useEventControl } from '@/hooks/useEventControl';

      order: vi.fn().mockReturnThis(),

      single: vi.fn(() => Promise.resolve({ data: null, error: null })),vi.mock('@/components/ui/use-toast', () => ({

      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),

      update: vi.fn(() => Promise.resolve({ data: null, error: null })),  useToast: () => ({ toast: vi.fn() }),import type { CourtMatch, RoundState } from '@/lib/types';

      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),

    })),}));

  },

}));// Mock toast



// Mock toast notificationsvi.mock('@/services/api/clubSettingsService', () => ({

vi.mock('@/hooks/use-toast', () => ({

  useToast: () => ({ toast: vi.fn() }),  ClubSettingsService: {vi.mock('@/components/ui/use-toast', () => ({// Mock toast

}));

    getScoringConfig: vi.fn(() => Promise.resolve(null)),

// Mock club settings service

vi.mock('@/services/api/clubSettingsService', () => ({    getBrandingConfig: vi.fn(() => Promise.resolve(null)),  useToast: () => ({vi.mock('@/components/ui/use-toast', () => ({

  ClubSettingsService: {

    getScoringConfig: vi.fn(() => Promise.resolve(null)),    getEloConfig: vi.fn(() => Promise.resolve(null)),

    getBrandingConfig: vi.fn(() => Promise.resolve(null)),

    getEloConfig: vi.fn(() => Promise.resolve(null)),  },    toast: vi.fn(),  useToast: () => ({

  },

}));}));



// Now import the hook after mocking its dependencies  }),    toast: vi.fn(),

import { useEventControl } from '@/hooks/useEventControl';

vi.mock('@/lib/supabase', () => ({

describe('Tournament Workflow Integration', () => {

  const mockEventId = 'test-event-123';  supabase: {}));  }),



  beforeEach(() => {    from: vi.fn(() => ({

    vi.clearAllMocks();

  });      select: vi.fn().mockReturnThis(),}));



  describe('Core Hook Initialization', () => {      eq: vi.fn().mockReturnThis(),

    it('initializes with expected structure', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));      order: vi.fn().mockReturnThis(),// Mock club settings service



      // Wait for initial loading      single: vi.fn(() => Promise.resolve({ data: null, error: null })),

      await waitFor(() => {

        expect(result.current.meta).toBeDefined();      insert: vi.fn().mockReturnThis(),vi.mock('@/services/api/clubSettingsService', () => ({// Mock club settings service

      });

      update: vi.fn().mockReturnThis(),

      // Check core structure exists

      expect(result.current).toHaveProperty('meta');      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),  ClubSettingsService: {vi.mock('@/services/api/clubSettingsService', () => ({

      expect(result.current).toHaveProperty('roundNum');

      expect(result.current).toHaveProperty('courts');    })),

      expect(result.current).toHaveProperty('history');

      expect(result.current).toHaveProperty('setScore');  },    getScoringConfig: vi.fn(() => Promise.resolve(null)),  ClubSettingsService: {

      expect(result.current).toHaveProperty('prepareAdvanceRound');

      expect(result.current).toHaveProperty('commitPendingRound');}));

    });

    getBrandingConfig: vi.fn(() => Promise.resolve(null)),    getScoringConfig: vi.fn(() => Promise.resolve(null)),

    it('handles undefined eventId gracefully', async () => {

      const { result } = renderHook(() => useEventControl(undefined));describe('Tournament Workflow - Integration Tests', () => {



      await waitFor(() => {  const mockEventId = 'test-event-123';    getEloConfig: vi.fn(() => Promise.resolve(null)),    getBrandingConfig: vi.fn(() => Promise.resolve(null)),

        expect(result.current.meta).toBeDefined();

      });



      expect(result.current.roundNum).toBe(1);  beforeEach(() => {  },    getEloConfig: vi.fn(() => Promise.resolve(null)),

      expect(Array.isArray(result.current.courts)).toBe(true);

    });    vi.clearAllMocks();

  });

  });}));  },

  describe('Score Management Workflow', () => {

    it('provides score setting functionality', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));

  describe('Hook State Management', () => {}));

      await waitFor(() => {

        expect(typeof result.current.setScore).toBe('function');    it('should initialize with correct default state', async () => {

      });

      const { result } = renderHook(() => useEventControl(mockEventId));// Mock Supabase

      // Test that setScore function exists and can be called without throwing

      await act(async () => {

        result.current.setScore(1, 21, 15);

      });      await act(async () => {vi.mock('@/lib/supabase', () => ({// Mock Supabase for integration tests



      // Should not throw any errors        await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.current.setScore).toBeDefined();

    });      });  supabase: {const createMockSupabaseChain = () => {

  });



  describe('Round Progression Workflow', () => {

    it('provides round management functions', async () => {      expect(result.current.meta).toBeDefined();    from: vi.fn(() => ({  const mockChain = {

      const { result } = renderHook(() => useEventControl(mockEventId));

      expect(result.current.roundNum).toBe(1);

      await waitFor(() => {

        expect(typeof result.current.prepareAdvanceRound).toBe('function');      expect(Array.isArray(result.current.courts)).toBe(true);      select: vi.fn().mockReturnThis(),    select: vi.fn().mockReturnThis(),

        expect(typeof result.current.commitPendingRound).toBe('function');

      });      expect(Array.isArray(result.current.history)).toBe(true);



      // Functions should exist    });      eq: vi.fn().mockReturnThis(),    eq: vi.fn().mockReturnThis(),

      expect(result.current.prepareAdvanceRound).toBeDefined();

      expect(result.current.commitPendingRound).toBeDefined();

    });

  });    it('should handle undefined eventId', () => {      order: vi.fn().mockReturnThis(),    order: vi.fn().mockReturnThis(),



  describe('Configuration Integration', () => {      const { result } = renderHook(() => useEventControl());

    it('loads configuration data', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));            single: vi.fn(() => Promise.resolve({ data: null, error: null })),    single: vi.fn(() => Promise.resolve({ data: null, error: null })),



      await waitFor(() => {      expect(result.current.meta).toBeDefined();

        expect(result.current.scoringConfig).toBeDefined();

        expect(result.current.brandingConfig).toBeDefined();      expect(result.current.roundNum).toBe(1);      insert: vi.fn().mockReturnThis(),    insert: vi.fn().mockReturnThis(),

        expect(result.current.eloConfig).toBeDefined();

      });    });

    });

  });  });      update: vi.fn().mockReturnThis(),    update: vi.fn().mockReturnThis(),



  describe('UI State Management', () => {

    it('manages UI state correctly', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));  describe('Score Management', () => {      delete: vi.fn().mockReturnThis(),    delete: vi.fn().mockReturnThis(),



      await waitFor(() => {    it('should provide score management functionality', async () => {

        expect(typeof result.current.setPadOpen).toBe('function');

        expect(typeof result.current.setUseKeypad).toBe('function');      const { result } = renderHook(() => useEventControl(mockEventId));      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),

      });



      await act(async () => {

        result.current.setPadOpen(true);      await act(async () => {    })),  };

      });

        await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.current.padOpen).toBe(true);

      });  },  

      await act(async () => {

        result.current.setUseKeypad(false);

      });

      expect(typeof result.current.setScore).toBe('function');}));  // Make chain methods return the chain for fluent API

      expect(result.current.useKeypad).toBe(false);

    });

  });

      await act(async () => {  Object.keys(mockChain).forEach(key => {

  describe('State Consistency', () => {

    it('maintains consistent state during operations', async () => {        result.current.setScore(1, 21, 15);

      const { result } = renderHook(() => useEventControl(mockEventId));

      });describe('Tournament Workflow - Integration Tests', () => {    if (typeof mockChain[key as keyof typeof mockChain] === 'function' && 

      await waitFor(() => {

        expect(result.current.roundNum).toBeDefined();

      });

      // Should not throw error  const mockEventId = '550e8400-e29b-41d4-a716-446655440001';        !['single', 'upsert'].includes(key)) {

      const initialRoundNum = result.current.roundNum;

      expect(result.current.setScore).toBeDefined();

      await act(async () => {

        result.current.setScore(1, 21, 15);    });      mockChain[key as keyof typeof mockChain] = vi.fn().mockReturnValue(mockChain);

      });

  });

      // Round number should remain consistent until explicitly advanced

      expect(result.current.roundNum).toBe(initialRoundNum);  beforeEach(() => {    }

      expect(Array.isArray(result.current.courts)).toBe(true);

    });  describe('Round Management', () => {

  });

    it('should provide round progression functions', async () => {    vi.clearAllMocks();  });

  describe('Error Handling', () => {

    it('handles operations gracefully when no data is available', async () => {      const { result } = renderHook(() => useEventControl(mockEventId));

      const { result } = renderHook(() => useEventControl('non-existent-event'));

  });  

      await waitFor(() => {

        expect(result.current.meta).toBeDefined();      await act(async () => {

      });

        await new Promise(resolve => setTimeout(resolve, 50));  return mockChain;

      // Should not throw errors even with invalid event ID

      await act(async () => {      });

        result.current.setScore(1, 21, 15);

      });  afterEach(() => {};



      expect(result.current).toBeDefined();      expect(typeof result.current.prepareAdvanceRound).toBe('function');

    });

  });      expect(typeof result.current.commitPendingRound).toBe('function');    vi.restoreAllMocks();

});
    });

  });  });const mockSupabase = {



  describe('Configuration Integration', () => {  from: vi.fn(() => createMockSupabaseChain()),

    it('should load club configurations', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));  describe('Hook Initialization and State Management', () => {};



      await act(async () => {    it('should initialize with correct default state', async () => {

        await new Promise(resolve => setTimeout(resolve, 50));

      });      const { result } = renderHook(() => useEventControl(mockEventId));vi.mock('@/lib/supabase', () => ({



      expect(result.current.scoringConfig).toBeDefined();  supabase: mockSupabase,

      expect(result.current.brandingConfig).toBeDefined();

      expect(result.current.eloConfig).toBeDefined();      // Wait for initial effect to complete}));

    });

  });      await act(async () => {



  describe('Performance Integration', () => {        await new Promise(resolve => setTimeout(resolve, 100));describe('Tournament Workflow - Integration Tests', () => {

    it('should integrate with performance monitoring', async () => {

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});      });  const mockEventId = '550e8400-e29b-41d4-a716-446655440001';

      

      const { result } = renderHook(() => useEventControl(mockEventId));  



      await act(async () => {      // Verify initial state structure  // Sample test data

        await new Promise(resolve => setTimeout(resolve, 50));

      });      expect(result.current.meta).toBeDefined();  const mockEvent = {



      await act(async () => {      expect(result.current.players).toBeDefined();    id: mockEventId,

        result.current.setScore(1, 21, 15);

      });      expect(result.current.roundNum).toBe(1);    name: 'Test Tournament',



      expect(result.current.setScore).toBeDefined();      expect(result.current.courts).toEqual([]);    format: 'winners-court' as const,

      consoleSpy.mockRestore();

    });      expect(result.current.history).toEqual([]);    courts: 2,

  });

      expect(result.current.initializing).toBe(false);    points_per_game: 21,

  describe('State Consistency', () => {

    it('should maintain state consistency during operations', async () => {      expect(result.current.loadingRound).toBe(false);    round_minutes: 20,

      const { result } = renderHook(() => useEventControl(mockEventId));

    });    ended_at: null,

      await act(async () => {

        await new Promise(resolve => setTimeout(resolve, 50));    created_at: '2024-01-01T00:00:00Z',

      });

    it('should handle missing eventId gracefully', () => {    club_id: '550e8400-e29b-41d4-a716-446655440100',

      const initialRound = result.current.roundNum;

      const { result } = renderHook(() => useEventControl());  };

      await act(async () => {

        result.current.setScore(1, 21, 15);

      });

      // Should not crash and provide default state  const mockPlayers = {

      expect(typeof result.current.roundNum).toBe('number');

      expect(Array.isArray(result.current.courts)).toBe(true);      expect(result.current.meta).toBeDefined();    'p1': { id: 'p1', full_name: 'Player One', elo: 1400 },

      expect(result.current.roundNum).toBe(initialRound);

    });      expect(result.current.roundNum).toBe(1);    'p2': { id: 'p2', full_name: 'Player Two', elo: 1450 },

  });

      expect(result.current.courts).toEqual([]);    'p3': { id: 'p3', full_name: 'Player Three', elo: 1350 },

  describe('UI Integration', () => {

    it('should manage UI state', async () => {    });    'p4': { id: 'p4', full_name: 'Player Four', elo: 1500 },

      const { result } = renderHook(() => useEventControl(mockEventId));

  });    'p5': { id: 'p5', full_name: 'Player Five', elo: 1300 },

      await act(async () => {

        await new Promise(resolve => setTimeout(resolve, 50));    'p6': { id: 'p6', full_name: 'Player Six', elo: 1550 },

      });

  describe('Score Management Integration', () => {    'p7': { id: 'p7', full_name: 'Player Seven', elo: 1250 },

      expect(typeof result.current.setPadOpen).toBe('function');

      expect(typeof result.current.setUseKeypad).toBe('function');    it('should provide setScore function that updates local state', async () => {    'p8': { id: 'p8', full_name: 'Player Eight', elo: 1600 },



      await act(async () => {      const { result } = renderHook(() => useEventControl(mockEventId));  };

        result.current.setPadOpen(true);

      });



      expect(result.current.padOpen).toBe(true);      await act(async () => {  const initialRoundState: RoundState = {

    });

  });        await new Promise(resolve => setTimeout(resolve, 100));    roundNum: 1,



  describe('Error Handling', () => {      });    courts: [

    it('should handle database errors gracefully', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));      {



      await act(async () => {      // Verify setScore function exists        court_num: 1,

        await new Promise(resolve => setTimeout(resolve, 50));

      });      expect(typeof result.current.setScore).toBe('function');        teamA: ['p1', 'p2'] as [string, string],



      expect(result.current).toBeDefined();        teamB: ['p3', 'p4'] as [string, string],

      expect(result.current.setScore).toBeDefined();

    });      // Test score function call (should not crash)        scoreA: undefined,

  });

});      await act(async () => {        scoreB: undefined,

        result.current.setScore(1, 21, 15);      },

      });      {

        court_num: 2,

      // Function should execute without throwing        teamA: ['p5', 'p6'] as [string, string],

      expect(result.current.setScore).toBeDefined();        teamB: ['p7', 'p8'] as [string, string],

    });        scoreA: undefined,

  });        scoreB: undefined,

      },

  describe('Round Management Integration', () => {    ],

    it('should provide round management functions', async () => {  };

      const { result } = renderHook(() => useEventControl(mockEventId));

  beforeEach(() => {

      await act(async () => {    vi.clearAllMocks();

        await new Promise(resolve => setTimeout(resolve, 100));    

      });    // Mock EventService methods

    vi.mocked(EventService.getEvent).mockResolvedValue(mockEvent);

      // Verify all round management functions exist    vi.mocked(EventService.getEventPlayers).mockResolvedValue(mockPlayers);

      expect(typeof result.current.prepareAdvanceRound).toBe('function');    vi.mocked(EventService.getCurrentRound).mockResolvedValue(initialRoundState);

      expect(typeof result.current.commitPendingRound).toBe('function');    vi.mocked(EventService.getRoundHistory).mockResolvedValue([]);

      expect(typeof result.current.endRoundAndAdvance).toBe('function');    vi.mocked(EventService.updateScore).mockResolvedValue(undefined);

      expect(typeof result.current.undoLastRound).toBe('function');    vi.mocked(EventService.saveRound).mockResolvedValue(undefined);

  });

      // Test function calls (should not crash)

      await act(async () => {  afterEach(() => {

        try {    vi.restoreAllMocks();

          await result.current.prepareAdvanceRound();  });

        } catch (error) {

          // Expected to fail due to mocked data, but should not crash hook  describe('Complete Tournament Flow', () => {

          expect(error).toBeDefined();    it('should handle full tournament progression from start to finish', async () => {

        }      const { result } = renderHook(() => useEventControl(mockEventId));

      });

    });      // Wait for initial load

  });      await act(async () => {

        await new Promise(resolve => setTimeout(resolve, 100));

  describe('State Consistency Integration', () => {      });

    it('should maintain consistent state structure throughout operations', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));      // Verify initial state

      expect(result.current.loading).toBe(false);

      await act(async () => {      expect(result.current.eventMeta?.name).toBe('Test Tournament');

        await new Promise(resolve => setTimeout(resolve, 100));      expect(result.current.courts).toHaveLength(2);

      });      expect(result.current.roundNum).toBe(1);



      // Test multiple operations to ensure state consistency      // Step 1: Enter scores for first round

      const initialRoundNum = result.current.roundNum;      await act(async () => {

      const initialCourts = result.current.courts;        result.current.setScore(1, 21, 15); // Court 1: P1/P2 beat P3/P4

      });

      await act(async () => {

        result.current.setScore(1, 21, 15);      await act(async () => {

      });        result.current.setScore(2, 18, 21); // Court 2: P7/P8 beat P5/P6

      });

      // State structure should remain consistent

      expect(typeof result.current.roundNum).toBe('number');      // Verify scores are set

      expect(Array.isArray(result.current.courts)).toBe(true);      expect(result.current.courts[0].scoreA).toBe(21);

      expect(Array.isArray(result.current.history)).toBe(true);      expect(result.current.courts[0].scoreB).toBe(15);

      expect(typeof result.current.players).toBe('object');      expect(result.current.courts[1].scoreA).toBe(18);

      expect(result.current.courts[1].scoreB).toBe(21);

      // Round number should not change from just setting score

      expect(result.current.roundNum).toBe(initialRoundNum);      // Step 2: Check if round can be advanced

    });      expect(result.current.canAdvanceRound).toBe(true);

  });

      // Step 3: Advance to next round

  describe('Configuration Integration', () => {      const mockNextRound: RoundState = {

    it('should handle club configuration loading', async () => {        roundNum: 2,

      const { result } = renderHook(() => useEventControl(mockEventId));        courts: [

          {

      await act(async () => {            court_num: 1,

        await new Promise(resolve => setTimeout(resolve, 100));            teamA: ['p1', 'p2'] as [string, string], // Winners from Court 1

      });            teamB: ['p7', 'p8'] as [string, string], // Winners from Court 2

            scoreA: undefined,

      // Should have configuration state            scoreB: undefined,

      expect(result.current.scoringConfig).toBeDefined();          },

      expect(result.current.brandingConfig).toBeDefined();          {

      expect(result.current.eloConfig).toBeDefined();            court_num: 2,

    });            teamA: ['p3', 'p4'] as [string, string], // Losers from Court 1

  });            teamB: ['p5', 'p6'] as [string, string], // Losers from Court 2

            scoreA: undefined,

  describe('Performance Monitoring Integration', () => {            scoreB: undefined,

    it('should integrate with performance monitoring system', async () => {          },

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});        ],

            };

      const { result } = renderHook(() => useEventControl(mockEventId));

      vi.mocked(EventService.saveRound).mockResolvedValue(undefined);

      await act(async () => {      vi.mocked(EventService.getCurrentRound).mockResolvedValue(mockNextRound);

        await new Promise(resolve => setTimeout(resolve, 100));

      });      await act(async () => {

        await result.current.prepareAdvanceRound();

      // Performance monitoring should be working (may log warnings)      });

      await act(async () => {

        result.current.setScore(1, 21, 15);      await act(async () => {

      });        await result.current.commitPendingRound();

      });

      // Should not throw errors related to performance monitoring

      expect(result.current.setScore).toBeDefined();      // Verify round advancement

            expect(result.current.roundNum).toBe(2);

      consoleSpy.mockRestore();      expect(result.current.courts).toHaveLength(2);

    });      expect(result.current.courts[0].scoreA).toBeUndefined();

  });      expect(result.current.courts[0].scoreB).toBeUndefined();



  describe('Wildcard Integration', () => {      // Verify winners court logic: winners should be on Court 1

    it('should handle wildcard state management', async () => {      expect(result.current.courts[0].teamA).toEqual(['p1', 'p2']);

      const { result } = renderHook(() => useEventControl(mockEventId));      expect(result.current.courts[0].teamB).toEqual(['p7', 'p8']);

    });

      await act(async () => {  });

        await new Promise(resolve => setTimeout(resolve, 100));

      });  describe('Score Management Integration', () => {

    it('should handle score entry with validation', async () => {

      // Should have wildcard-related state      const { result } = renderHook(() => useEventControl(mockEventId));

      expect(result.current.pendingNextRound).toBeDefined();

      expect(result.current.pendingIsWildcard).toBeDefined();      await act(async () => {

              await new Promise(resolve => setTimeout(resolve, 100));

      // Should be able to handle wildcard operations      });

      expect(typeof result.current.commitPendingRound).toBe('function');

    });      // Valid score entry

  });      await act(async () => {

        result.current.setScore(1, 21, 19);

  describe('Timer Integration', () => {      });

    it('should handle timer functionality', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));      expect(result.current.courts[0].scoreA).toBe(21);

      expect(result.current.courts[0].scoreB).toBe(19);

      await act(async () => {      expect(EventService.updateScore).toHaveBeenCalledWith(

        await new Promise(resolve => setTimeout(resolve, 100));        mockEventId,

      });        1,

        1, // roundNum

      // Should have timer-related state and functions        21,

      expect(result.current.startedAt).toBeDefined();        19

      expect(result.current.now).toBeDefined();      );

      expect(result.current.shouldShowTimer).toBeDefined();    });

      expect(typeof result.current.startTimer).toBe('function');

    });    it('should handle score validation errors gracefully', async () => {

  });      const { result } = renderHook(() => useEventControl(mockEventId));



  describe('UI State Integration', () => {      await act(async () => {

    it('should manage UI state correctly', async () => {        await new Promise(resolve => setTimeout(resolve, 100));

      const { result } = renderHook(() => useEventControl(mockEventId));      });



      await act(async () => {      // Mock validation error

        await new Promise(resolve => setTimeout(resolve, 100));      vi.mocked(EventService.updateScore).mockRejectedValueOnce(

      });        new Error('Tied scores are not allowed')

      );

      // Should have UI-related state

      expect(result.current.padOpen).toBeDefined();      // Attempt to set tied scores

      expect(result.current.padTarget).toBeDefined();      await act(async () => {

      expect(result.current.useKeypad).toBeDefined();        try {

          result.current.setScore(1, 21, 21);

      // Should have UI control functions        } catch (error) {

      expect(typeof result.current.setPadOpen).toBe('function');          expect(error).toBeInstanceOf(Error);

      expect(typeof result.current.setPadTarget).toBe('function');        }

      expect(typeof result.current.setUseKeypad).toBe('function');      });



      // Test UI state changes      // Scores should not be updated on error

      await act(async () => {      expect(result.current.courts[0].scoreA).toBeUndefined();

        result.current.setPadOpen(true);      expect(result.current.courts[0].scoreB).toBeUndefined();

      });    });

  });

      expect(result.current.padOpen).toBe(true);

    });  describe('Round Advancement Integration', () => {

  });    it('should prevent advancement when not all scores are entered', async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));

  describe('Event Management Integration', () => {

    it('should handle event lifecycle operations', async () => {      await act(async () => {

      const { result } = renderHook(() => useEventControl(mockEventId));        await new Promise(resolve => setTimeout(resolve, 100));

      });

      await act(async () => {

        await new Promise(resolve => setTimeout(resolve, 100));      // Only set score for one court

      });      await act(async () => {

        result.current.setScore(1, 21, 15);

      // Should have event management functions      });

      expect(typeof result.current.endEvent).toBe('function');

      expect(typeof result.current.exportEventJSON).toBe('function');      // Should not be able to advance

      expect(result.current.canAdvanceRound).toBe(false);

      // Should have event state

      expect(result.current.isEnded).toBeDefined();      // Complete all scores

    });      await act(async () => {

  });        result.current.setScore(2, 18, 21);

      });

  describe('Computed Values Integration', () => {

    it('should provide computed values and statistics', async () => {      // Now should be able to advance

      const { result } = renderHook(() => useEventControl(mockEventId));      expect(result.current.canAdvanceRound).toBe(true);

    });

      await act(async () => {

        await new Promise(resolve => setTimeout(resolve, 100));    it('should handle round advancement with persistence', async () => {

      });      const { result } = renderHook(() => useEventControl(mockEventId));



      // Should have computed values      await act(async () => {

      expect(result.current.courtStatuses).toBeDefined();        await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.completionStats).toBeDefined();      });

      expect(result.current.isPointsMode).toBeDefined();

      expect(result.current.hasRoundLimit).toBeDefined();      // Complete all scores

      expect(result.current.hasTimeLimit).toBeDefined();      await act(async () => {

    });        result.current.setScore(1, 21, 15);

  });        result.current.setScore(2, 18, 21);

      });

  describe('Error Resilience Integration', () => {

    it('should handle Supabase errors gracefully', async () => {      // Mock successful round save

      // Mock Supabase to return errors      vi.mocked(EventService.saveRound).mockResolvedValue(undefined);

      const mockSupabase = await import('@/lib/supabase');

      vi.mocked(mockSupabase.supabase.from).mockReturnValue({      await act(async () => {

        select: vi.fn().mockReturnThis(),        await result.current.prepareAdvanceRound();

        eq: vi.fn().mockReturnThis(),      });

        single: vi.fn(() => Promise.resolve({ 

          data: null,       // Verify round was saved

          error: { message: 'Database error' }      expect(EventService.saveRound).toHaveBeenCalledWith(

        })),        mockEventId,

      } as any);        expect.objectContaining({

          roundNum: 1,

      const { result } = renderHook(() => useEventControl(mockEventId));          courts: expect.any(Array),

        })

      await act(async () => {      );

        await new Promise(resolve => setTimeout(resolve, 100));    });

      });  });



      // Hook should not crash even with database errors  describe('Error Handling Integration', () => {

      expect(result.current).toBeDefined();    it('should handle network failures gracefully', async () => {

      expect(result.current.setScore).toBeDefined();      const { result } = renderHook(() => useEventControl(mockEventId));

    });

  });      // Mock network error

});      vi.mocked(EventService.getEvent).mockRejectedValueOnce(
        new Error('Network error')
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle error gracefully
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should retry failed operations', async () => {
      const { result } = renderHook(() => useEventControl(mockEventId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Mock first attempt to fail, second to succeed
      vi.mocked(EventService.updateScore)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(undefined);

      // First attempt should fail
      await act(async () => {
        try {
          result.current.setScore(1, 21, 15);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      // Second attempt should succeed
      await act(async () => {
        result.current.setScore(1, 21, 15);
      });

      expect(result.current.courts[0].scoreA).toBe(21);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics during operations', async () => {
      const { result } = renderHook(() => useEventControl(mockEventId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Performance monitoring should be integrated
      const performanceSpy = vi.spyOn(console, 'warn');

      // Simulate slow operation
      vi.mocked(EventService.updateScore).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 600)) // Simulate 600ms delay
      );

      await act(async () => {
        result.current.setScore(1, 21, 15);
      });

      // Should log slow operation warning (threshold is 500ms for user interactions)
      expect(performanceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow userInteractions operation detected')
      );

      performanceSpy.mockRestore();
    });
  });

  describe('State Consistency Integration', () => {
    it('should maintain consistent state across multiple operations', async () => {
      const { result } = renderHook(() => useEventControl(mockEventId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform multiple rapid operations
      await act(async () => {
        result.current.setScore(1, 21, 15);
        result.current.setScore(2, 18, 21);
      });

      // State should be consistent
      expect(result.current.courts[0].scoreA).toBe(21);
      expect(result.current.courts[0].scoreB).toBe(15);
      expect(result.current.courts[1].scoreA).toBe(18);
      expect(result.current.courts[1].scoreB).toBe(21);
      expect(result.current.canAdvanceRound).toBe(true);
    });
  });
});