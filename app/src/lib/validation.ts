// Runtime validation schemas using Zod
import { z } from 'zod';

// Core entity schemas
export const PlayerSchema = z.object({
  id: z.string().uuid('Invalid player ID format'),
  full_name: z.string().min(1, 'Player name is required').max(100, 'Player name too long'),
  elo: z.number().min(0, 'ELO cannot be negative').max(3000, 'ELO too high'),
});

export const MatchSideSchema = z.tuple([
  z.string().uuid('Invalid player ID in team'),
  z.string().uuid('Invalid player ID in team')
]);

export const CourtMatchSchema = z.object({
  court_num: z.number().int().min(1, 'Court number must be at least 1'),
  teamA: MatchSideSchema,
  teamB: MatchSideSchema,
  scoreA: z.number().int().min(0).max(50).optional(),
  scoreB: z.number().int().min(0).max(50).optional(),
});

export const RoundStateSchema = z.object({
  roundNum: z.number().int().min(1, 'Round number must be at least 1'),
  courts: z.array(CourtMatchSchema).min(1, 'Must have at least one court'),
});

// Tournament configuration schemas
export const TournamentConfigSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(200, 'Tournament name too long'),
  courts: z.number().int().min(1, 'Must have at least 1 court').max(10, 'Too many courts'),
  format: z.enum(['winners-court', 'americano'], {
    errorMap: () => ({ message: 'Invalid tournament format' })
  }),
  variant: z.enum(['individual', 'team']).optional(),
  points_per_game: z.number().int().min(0).max(100).optional(),
  round_minutes: z.number().int().min(1).max(300).optional(),
  max_rounds: z.number().int().min(1).max(50).optional(),
  event_duration_hours: z.number().min(0.5).max(24).optional(),
  wildcard_enabled: z.boolean().optional(),
  wildcard_start_round: z.number().int().min(2).optional(),
  wildcard_frequency: z.number().int().min(1).max(10).optional(),
  wildcard_intensity: z.enum(['mild', 'medium', 'mayhem']).optional(),
})
.refine((data) => {
  // Either points_per_game OR round_minutes must be provided
  return data.points_per_game || data.round_minutes;
}, {
  message: "Either points per game or round duration must be specified",
  path: ["points_per_game"]
})
.refine((data) => {
  // If wildcard enabled, must have start round
  if (data.wildcard_enabled && !data.wildcard_start_round) {
    return false;
  }
  return true;
}, {
  message: "Wildcard start round required when wildcards are enabled",
  path: ["wildcard_start_round"]
});

// Score entry validation
export const ScoreEntrySchema = z.object({
  courtNum: z.number().int().min(1),
  scoreA: z.number().int().min(0).max(50),
  scoreB: z.number().int().min(0).max(50),
  eventId: z.string().uuid('Invalid event ID'),
  roundNum: z.number().int().min(1),
})
.refine((data) => {
  // Scores cannot be equal (no ties allowed)
  return data.scoreA !== data.scoreB;
}, {
  message: "Tied scores are not allowed",
  path: ["scoreB"]
});

// Player registration validation
export const PlayerRegistrationSchema = z.object({
  full_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  elo: z.number().min(0).max(3000).optional().default(1200),
  club_id: z.string().uuid('Invalid club ID'),
});

// Event creation validation (separate schema due to refinements)
export const EventCreationSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(200, 'Tournament name too long'),
  courts: z.number().int().min(1, 'Must have at least 1 court').max(10, 'Too many courts'),
  format: z.enum(['winners-court', 'americano']),
  variant: z.enum(['individual', 'team']).optional(),
  points_per_game: z.number().int().min(0).max(100).optional(),
  round_minutes: z.number().int().min(1).max(300).optional(),
  max_rounds: z.number().int().min(1).max(50).optional(),
  event_duration_hours: z.number().min(0.5).max(24).optional(),
  wildcard_enabled: z.boolean().optional(),
  wildcard_start_round: z.number().int().min(2).optional(),
  wildcard_frequency: z.number().int().min(1).max(10).optional(),
  wildcard_intensity: z.enum(['mild', 'medium', 'mayhem']).optional(),
  club_id: z.string().uuid('Invalid club ID'),
  player_ids: z.array(z.string().uuid()).min(4, 'Need at least 4 players').max(24, 'Too many players'),
  court_names: z.array(z.string()).optional(),
})
.refine((data) => {
  return data.points_per_game || data.round_minutes;
}, {
  message: "Either points per game or round duration must be specified",
  path: ["points_per_game"]
});

// Validation helper functions
export function validateTournamentConfig(data: unknown) {
  return TournamentConfigSchema.safeParse(data);
}

export function validateScoreEntry(data: unknown) {
  return ScoreEntrySchema.safeParse(data);
}

export function validatePlayerRegistration(data: unknown) {
  return PlayerRegistrationSchema.safeParse(data);
}

export function validateEventCreation(data: unknown) {
  return EventCreationSchema.safeParse(data);
}

export function validateRoundState(data: unknown) {
  return RoundStateSchema.safeParse(data);
}

// Custom validation for tournament-specific rules
export function validatePlayerCountForFormat(playerCount: number, format: 'winners-court' | 'americano', courts: number) {
  const requiredPlayers = courts * 4;
  
  if (format === 'winners-court') {
    if (playerCount !== requiredPlayers) {
      return {
        success: false,
        error: `Winners Court requires exactly ${requiredPlayers} players for ${courts} courts`
      };
    }
  }
  
  if (format === 'americano') {
    if (playerCount < 4) {
      return {
        success: false,
        error: 'Americano requires at least 4 players'
      };
    }

    if (playerCount < requiredPlayers) {
      return {
        success: false,
        error: `Americano with ${courts} court${courts === 1 ? '' : 's'} needs at least ${requiredPlayers} players`
      };
    }

    const allowsSingleRest = playerCount === requiredPlayers + 1;
    if (playerCount % 2 !== 0 && !allowsSingleRest) {
      return {
        success: false,
        error: `Americano supports up to one rotating rest slot. With ${courts} court${courts === 1 ? '' : 's'}, roster ${requiredPlayers} or ${requiredPlayers + 1} players.`
      };
    }
  }
  
  return { success: true };
}

// Tournament integrity validation
export function validateTournamentIntegrity(rounds: unknown[]) {
  const errors: string[] = [];
  
  try {
    const validatedRounds = rounds.map(round => {
      const result = RoundStateSchema.safeParse(round);
      if (!result.success) {
        errors.push(`Invalid round data: ${result.error.message}`);
        return null;
      }
      return result.data;
    }).filter(Boolean);

    // Check for duplicate players in same round
    validatedRounds.forEach((round, index) => {
      if (!round) return;
      
      const allPlayers = round.courts.flatMap(court => [...court.teamA, ...court.teamB]);
      const uniquePlayers = new Set(allPlayers);
      
      if (allPlayers.length !== uniquePlayers.size) {
        errors.push(`Round ${index + 1}: Duplicate players found`);
      }
    });

    // Check player count consistency across rounds
    if (validatedRounds.length > 1) {
      const firstRoundPlayerCount = validatedRounds[0]?.courts.length * 4;
      
      validatedRounds.forEach((round, index) => {
        if (!round) return;
        
        const currentPlayerCount = round.courts.length * 4;
        if (currentPlayerCount !== firstRoundPlayerCount) {
          errors.push(`Round ${index + 1}: Inconsistent player count`);
        }
      });
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export type inference
export type Player = z.infer<typeof PlayerSchema>;
export type CourtMatch = z.infer<typeof CourtMatchSchema>;
export type RoundState = z.infer<typeof RoundStateSchema>;
export type TournamentConfig = z.infer<typeof TournamentConfigSchema>;
export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export type PlayerRegistration = z.infer<typeof PlayerRegistrationSchema>;
export type EventCreation = z.infer<typeof EventCreationSchema>;