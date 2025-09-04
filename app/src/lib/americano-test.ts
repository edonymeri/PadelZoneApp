/**
 * Test file for Americano Individual mode with 8 players
 * This will verify that the pairing algorithms work correctly
 */

import { nextAmericanoRound, AmericanoPairingOptions } from './engine';

// Test with 8 players (2 courts, 4 players per court, 4 players resting)
const testAmericanoIndividual8Players = () => {
  console.log('🎾 Testing Americano Individual Mode with 8 Players');
  console.log('=' .repeat(60));
  
  // 8 players: A, B, C, D, E, F, G, H
  const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const numCourts = 1; // With 8 players and 1 court, 4 play and 4 rest each round
  
  const options: AmericanoPairingOptions = {
    format: 'americano',
    variant: 'individual',
    antiRepeatWindow: 3,
    restBalancing: true
  };
  
  console.log(`Players: ${players.join(', ')}`);
  console.log(`Courts: ${numCourts}`);
  console.log(`Format: ${options.variant} Americano`);
  console.log('');
  
  let previousRounds: any[] = [];
  
  // Test 6 rounds to see full rotation
  for (let round = 1; round <= 6; round++) {
    console.log(`--- ROUND ${round} ---`);
    
    try {
      const result = nextAmericanoRound(
        round - 1, // 0-based round index
        numCourts,
        players,
        previousRounds,
        options
      );
      
      console.log('Courts:');
      result.courts.forEach(court => {
        const teamA = `${court.teamA[0]}-${court.teamA[1]}`;
        const teamB = `${court.teamB[0]}-${court.teamB[1]}`;
        console.log(`  Court ${court.court_num}: ${teamA} vs ${teamB}`);
      });
      
      // Track who's playing and who's resting
      const playingPlayers = new Set();
      result.courts.forEach(court => {
        court.teamA.forEach(p => playingPlayers.add(p));
        court.teamB.forEach(p => playingPlayers.add(p));
      });
      
      const restingPlayers = players.filter(p => !playingPlayers.has(p));
      console.log(`Resting: ${restingPlayers.join(', ')}`);
      
      // Add to previous rounds for next iteration
      previousRounds.push({
        round_num: round,
        courts: result.courts
      });
      
      console.log('');
      
    } catch (error) {
      console.error(`Error in round ${round}:`, error);
      break;
    }
  }
  
  // Analyze partner combinations across all rounds
  console.log('📊 PARTNER ANALYSIS');
  console.log('=' .repeat(40));
  
  const partnerCounts: Record<string, number> = {};
  
  previousRounds.forEach((round, idx) => {
    round.courts.forEach((court: any) => {
      // Team A partnership
      const teamA = [court.teamA[0], court.teamA[1]].sort().join('-');
      partnerCounts[teamA] = (partnerCounts[teamA] || 0) + 1;
      
      // Team B partnership
      const teamB = [court.teamB[0], court.teamB[1]].sort().join('-');
      partnerCounts[teamB] = (partnerCounts[teamB] || 0) + 1;
    });
  });
  
  console.log('Partner combinations and frequency:');
  Object.entries(partnerCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([partnership, count]) => {
      console.log(`  ${partnership}: ${count} time(s)`);
    });
  
  // Check for any repeated partnerships
  const repeatedPartnerships = Object.entries(partnerCounts).filter(([,count]) => count > 1);
  if (repeatedPartnerships.length > 0) {
    console.log('⚠️  Repeated partnerships found:');
    repeatedPartnerships.forEach(([partnership, count]) => {
      console.log(`    ${partnership}: ${count} times`);
    });
  } else {
    console.log('✅ No repeated partnerships - perfect rotation!');
  }
  
  // Analyze rest distribution
  console.log('');
  console.log('💤 REST ANALYSIS');
  console.log('=' .repeat(40));
  
  const restCounts: Record<string, number> = {};
  players.forEach(player => restCounts[player] = 0);
  
  previousRounds.forEach(round => {
    const playingPlayers = new Set();
    round.courts.forEach((court: any) => {
      court.teamA.forEach((p: string) => playingPlayers.add(p));
      court.teamB.forEach((p: string) => playingPlayers.add(p));
    });
    
    players.forEach(player => {
      if (!playingPlayers.has(player)) {
        restCounts[player]++;
      }
    });
  });
  
  console.log('Rest distribution:');
  Object.entries(restCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([player, restCount]) => {
      console.log(`  ${player}: ${restCount} round(s) resting`);
    });
  
  const maxRest = Math.max(...Object.values(restCounts));
  const minRest = Math.min(...Object.values(restCounts));
  const restDifference = maxRest - minRest;
  
  console.log(`Rest balance: ${minRest}-${maxRest} (difference: ${restDifference})`);
  
  if (restDifference <= 1) {
    console.log('✅ Rest distribution is well balanced!');
  } else {
    console.log('⚠️  Rest distribution could be improved');
  }
};

// Also test with 2 courts (full play, no resting)
const testAmericanoIndividual8Players2Courts = () => {
  console.log('');
  console.log('🎾 Testing Americano Individual Mode with 8 Players, 2 Courts');
  console.log('=' .repeat(60));
  
  const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const numCourts = 2; // All 8 players play every round
  
  const options: AmericanoPairingOptions = {
    format: 'americano',
    variant: 'individual',
    antiRepeatWindow: 3,
    restBalancing: true
  };
  
  console.log(`Players: ${players.join(', ')}`);
  console.log(`Courts: ${numCourts}`);
  console.log('All players play every round');
  console.log('');
  
  let previousRounds: any[] = [];
  
  // Test 4 rounds to see rotation patterns
  for (let round = 1; round <= 4; round++) {
    console.log(`--- ROUND ${round} ---`);
    
    try {
      const result = nextAmericanoRound(
        round - 1,
        numCourts,
        players,
        previousRounds,
        options
      );
      
      result.courts.forEach(court => {
        const teamA = `${court.teamA[0]}-${court.teamA[1]}`;
        const teamB = `${court.teamB[0]}-${court.teamB[1]}`;
        console.log(`  Court ${court.court_num}: ${teamA} vs ${teamB}`);
      });
      
      previousRounds.push({
        round_num: round,
        courts: result.courts
      });
      
      console.log('');
      
    } catch (error) {
      console.error(`Error in round ${round}:`, error);
      break;
    }
  }
  
  // Quick partner analysis
  const partnerCounts: Record<string, number> = {};
  
  previousRounds.forEach(round => {
    round.courts.forEach((court: any) => {
      const teamA = [court.teamA[0], court.teamA[1]].sort().join('-');
      const teamB = [court.teamB[0], court.teamB[1]].sort().join('-');
      partnerCounts[teamA] = (partnerCounts[teamA] || 0) + 1;
      partnerCounts[teamB] = (partnerCounts[teamB] || 0) + 1;
    });
  });
  
  console.log('Partner combinations:');
  Object.entries(partnerCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([partnership, count]) => {
      console.log(`  ${partnership}: ${count} time(s)`);
    });
};

// Run the tests
export const runAmericanoTests = () => {
  testAmericanoIndividual8Players();
  testAmericanoIndividual8Players2Courts();
};

// Export for direct execution
export { testAmericanoIndividual8Players, testAmericanoIndividual8Players2Courts };
