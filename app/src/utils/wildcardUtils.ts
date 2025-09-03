// src/utils/wildcardUtils.ts
import type { CourtMatch, UUID } from "@/lib/types";
import type { Event } from "@/services/api/eventService";

/**
 * Determines if a given round should be a wildcard round
 */
export function isWildcardRound(roundNum: number, event: Event | Pick<Event, 'wildcard_enabled' | 'wildcard_start_round' | 'wildcard_frequency'>): boolean {
  console.log('🎲 isWildcardRound check:', {
    roundNum,
    wildcard_enabled: event.wildcard_enabled,
    wildcard_start_round: event.wildcard_start_round,
    wildcard_frequency: event.wildcard_frequency
  });
  
  if (!event.wildcard_enabled) {
    console.log('🎲 Wildcard not enabled');
    return false;
  }
  if (!event.wildcard_start_round || !event.wildcard_frequency) {
    console.log('🎲 Missing wildcard config');
    return false;
  }
  if (roundNum < event.wildcard_start_round) {
    console.log('🎲 Round too early');
    return false;
  }
  
  // Check if this round number hits our frequency
  const roundsSinceStart = roundNum - event.wildcard_start_round + 1;
  const isWildcard = roundsSinceStart % event.wildcard_frequency === 1;
  console.log('🎲 Wildcard calculation:', { roundsSinceStart, frequency: event.wildcard_frequency, isWildcard });
  return isWildcard;
}

/**
 * Gets the next wildcard round number after the given round
 */
export function getNextWildcardRound(roundNum: number, event: Event | Pick<Event, 'wildcard_enabled' | 'wildcard_start_round' | 'wildcard_frequency'>): number | null {
  if (!event.wildcard_enabled || !event.wildcard_start_round || !event.wildcard_frequency) {
    return null;
  }
  
  // If we haven't reached the start round yet
  if (roundNum < event.wildcard_start_round) {
    return event.wildcard_start_round;
  }
  
  // Find the next wildcard round
  const roundsSinceStart = roundNum - event.wildcard_start_round + 1;
  const roundsUntilNext = event.wildcard_frequency - (roundsSinceStart % event.wildcard_frequency);
  
  if (roundsUntilNext === event.wildcard_frequency) {
    // Current round is a wildcard, next one is frequency rounds away
    return roundNum + event.wildcard_frequency;
  } else {
    // Next wildcard is roundsUntilNext away
    return roundNum + roundsUntilNext;
  }
}

/**
 * Applies wildcard shuffle to courts based on intensity
 */
export function applyWildcardShuffle(courts: CourtMatch[], intensity: 'mild' | 'medium' | 'mayhem'): CourtMatch[] {
  console.log('🎲 Starting wildcard shuffle with intensity:', intensity);
  
  // Extract all players from all courts
  const allPlayers: UUID[] = courts.flatMap(court => [
    ...court.teamA,
    ...court.teamB
  ]);

  // Validate input - no duplicates in original courts
  const uniqueOriginalPlayers = new Set(allPlayers);
  if (uniqueOriginalPlayers.size !== allPlayers.length) {
    console.error('🚨 DUPLICATE PLAYER DETECTED in original courts:', {
      allPlayers,
      uniqueCount: uniqueOriginalPlayers.size,
      totalCount: allPlayers.length
    });
    throw new Error('Duplicate player detected in original courts');
  }

  console.log('✅ Original courts validated - no duplicates');

  let newPlayers: UUID[];

  switch (intensity) {
    case 'mild':
      // Swap ~25% of players between adjacent courts
      newPlayers = mildShuffle(allPlayers, courts.length);
      break;
    
    case 'medium':
      // Redistribute ~50% of players across all courts
      newPlayers = mediumShuffle(allPlayers);
      break;
    
    case 'mayhem':
      // Complete randomization of all player positions
      newPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      break;
    
    default:
      newPlayers = allPlayers;
  }

  // Redistribute players back to courts (4 players per court)
  const newCourts: CourtMatch[] = courts.map((court, index) => {
    const startIndex = index * 4;
    const teamA = [newPlayers[startIndex], newPlayers[startIndex + 1]];
    const teamB = [newPlayers[startIndex + 2], newPlayers[startIndex + 3]];
    
    // Validate no duplicates within this court
    const courtPlayers = [...teamA, ...teamB];
    const uniquePlayers = new Set(courtPlayers);
    if (uniquePlayers.size !== 4) {
      console.error('🚨 DUPLICATE PLAYER DETECTED in court', index + 1, ':', {
        teamA,
        teamB,
        courtPlayers,
        uniqueCount: uniquePlayers.size
      });
      throw new Error(`Duplicate player detected in court ${index + 1}`);
    }
    
    return {
      ...court,
      teamA: teamA as [UUID, UUID],
      teamB: teamB as [UUID, UUID],
      scoreA: undefined, // Reset scores for new matchups
      scoreB: undefined
    };
  });

  // Validate no duplicates across all courts
  const allShuffledPlayers = newCourts.flatMap(court => [...court.teamA, ...court.teamB]);
  const uniqueAllShuffledPlayers = new Set(allShuffledPlayers);
  if (uniqueAllShuffledPlayers.size !== allShuffledPlayers.length) {
    console.error('🚨 DUPLICATE PLAYER DETECTED across all courts:', {
      allShuffledPlayers,
      uniqueCount: uniqueAllShuffledPlayers.size,
      totalCount: allShuffledPlayers.length
    });
    throw new Error('Duplicate player detected across courts');
  }

  console.log('✅ Wildcard shuffle completed successfully - no duplicates');
  return newCourts;
}

/**
 * Mild shuffle: Swap players between adjacent courts
 */
function mildShuffle(players: UUID[], courtCount: number): UUID[] {
  const result = [...players];
  const swapCount = Math.floor(players.length * 0.25); // ~25% of players
  
  for (let i = 0; i < swapCount; i++) {
    // Pick two adjacent courts
    const court1 = Math.floor(Math.random() * (courtCount - 1));
    const court2 = court1 + 1;
    
    // Pick random positions within those courts
    const pos1 = court1 * 4 + Math.floor(Math.random() * 4);
    const pos2 = court2 * 4 + Math.floor(Math.random() * 4);
    
    // Swap the players
    [result[pos1], result[pos2]] = [result[pos2], result[pos1]];
  }
  
  return result;
}

/**
 * Medium shuffle: Redistribute ~50% of players across all courts
 */
function mediumShuffle(players: UUID[]): UUID[] {
  const result = [...players];
  const shuffleCount = Math.floor(players.length * 0.5); // ~50% of players
  
  // Create a list of unique indices to shuffle
  const availableIndices = Array.from({ length: players.length }, (_, i) => i);
  const indicesToShuffle = [];
  const playersToShuffle = [];
  
  // Select unique random indices
  for (let i = 0; i < shuffleCount; i++) {
    if (availableIndices.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const selectedIndex = availableIndices.splice(randomIndex, 1)[0];
    indicesToShuffle.push(selectedIndex);
    playersToShuffle.push(result[selectedIndex]);
  }
  
  // Shuffle the selected players
  playersToShuffle.sort(() => Math.random() - 0.5);
  
  // Place them back in the new positions
  indicesToShuffle.forEach((index, i) => {
    result[index] = playersToShuffle[i];
  });
  
  return result;
}

/**
 * Get wildcard intensity display info
 */
export function getWildcardIntensityInfo(intensity: 'mild' | 'medium' | 'mayhem') {
  const intensityMap = {
    mild: {
      emoji: '🔄',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      name: 'Mild Shuffle',
      description: 'Gentle mixing between adjacent courts'
    },
    medium: {
      emoji: '⚡',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      name: 'Medium Chaos',
      description: 'Balanced redistribution across all courts'
    },
    mayhem: {
      emoji: '🌪️',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200', 
      name: 'Total Mayhem',
      description: 'Complete randomization - anyone anywhere!'
    }
  };
  
  return intensityMap[intensity];
}

/**
 * Generate a wildcard preview message
 */
export function generateWildcardPreview(event: Event | Pick<Event, 'wildcard_enabled' | 'wildcard_start_round' | 'wildcard_frequency' | 'wildcard_intensity'>): string {
  if (!event.wildcard_enabled || !event.wildcard_start_round || !event.wildcard_frequency) {
    return "No wildcards configured";
  }
  
  const intensity = getWildcardIntensityInfo(event.wildcard_intensity || 'medium');
  const roundsList = [];
  
  // Generate first few wildcard rounds
  for (let i = 0; i < 3; i++) {
    const wildcardRound = event.wildcard_start_round + (i * event.wildcard_frequency);
    roundsList.push(wildcardRound);
  }
  
  return `${intensity.emoji} Wildcards start Round ${event.wildcard_start_round}, then every ${event.wildcard_frequency} rounds (${roundsList.join(', ')}, ...)`;
}
