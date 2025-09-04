/**
 * Comprehensive test for Americano Individual mode with real algorithms
 */

// Import the necessary functions and types
console.log('Setting up test environment...');

// Mock the engine functions for testing (since we can't easily import in Node.js)
function buildPartnerHistory(previousRounds) {
  const partnerHistory = {};
  
  previousRounds.forEach(roundData => {
    if (roundData && roundData.courts) {
      roundData.courts.forEach(court => {
        // Record partnerships for team A
        const [p1, p2] = court.teamA;
        if (!partnerHistory[p1]) partnerHistory[p1] = {};
        if (!partnerHistory[p2]) partnerHistory[p2] = {};
        
        partnerHistory[p1][p2] = (partnerHistory[p1][p2] || 0) + 1;
        partnerHistory[p2][p1] = (partnerHistory[p2][p1] || 0) + 1;
        
        // Record partnerships for team B
        const [p3, p4] = court.teamB;
        if (!partnerHistory[p3]) partnerHistory[p3] = {};
        if (!partnerHistory[p4]) partnerHistory[p4] = {};
        
        partnerHistory[p3][p4] = (partnerHistory[p3][p4] || 0) + 1;
        partnerHistory[p4][p3] = (partnerHistory[p4][p3] || 0) + 1;
      });
    }
  });
  
  return partnerHistory;
}

function calculateRestCounts(allPlayers, previousRounds) {
  const restCounts = {};
  allPlayers.forEach(player => restCounts[player] = 0);
  
  previousRounds.forEach(roundData => {
    if (roundData && roundData.courts) {
      const playingPlayers = new Set();
      roundData.courts.forEach(court => {
        court.teamA.forEach(p => playingPlayers.add(p));
        court.teamB.forEach(p => playingPlayers.add(p));
      });
      
      allPlayers.forEach(player => {
        if (!playingPlayers.has(player)) {
          restCounts[player]++;
        }
      });
    }
  });
  
  return restCounts;
}

function generateAmericanoIndividualPairings(allPlayers, numCourts, partnerHistory, restCounts) {
  const courts = [];
  const used = new Set();
  const playersPerCourt = 4;
  const totalPlaying = numCourts * playersPerCourt;
  
  // Sort players by rest count (prioritize those who have rested most)
  const sortedByRest = allPlayers
    .map(player => ({ player, restCount: restCounts[player] || 0 }))
    .sort((a, b) => b.restCount - a.restCount);
  
  // Select players to play this round
  const playingPlayers = sortedByRest.slice(0, totalPlaying).map(item => item.player);
  
  console.log(`  Selected to play: ${playingPlayers.join(', ')}`);
  
  // Create pairings with minimal partner repetition
  for (let courtNum = 1; courtNum <= numCourts; courtNum++) {
    const availablePlayers = playingPlayers.filter(p => !used.has(p));
    
    if (availablePlayers.length < 4) {
      throw new Error(`Not enough available players for court ${courtNum}`);
    }
    
    // Try to find players who haven't been partners before
    let bestPairing = null;
    let minPartnerHistory = Infinity;
    
    // Try different combinations of 4 players
    for (let i = 0; i < availablePlayers.length - 3; i++) {
      for (let j = i + 1; j < availablePlayers.length - 2; j++) {
        for (let k = j + 1; k < availablePlayers.length - 1; k++) {
          for (let l = k + 1; l < availablePlayers.length; l++) {
            const players = [availablePlayers[i], availablePlayers[j], availablePlayers[k], availablePlayers[l]];
            
            // Try different team arrangements
            const arrangements = [
              { teamA: [players[0], players[1]], teamB: [players[2], players[3]] },
              { teamA: [players[0], players[2]], teamB: [players[1], players[3]] },
              { teamA: [players[0], players[3]], teamB: [players[1], players[2]] }
            ];
            
            for (const arrangement of arrangements) {
              const [a1, a2] = arrangement.teamA;
              const [b1, b2] = arrangement.teamB;
              
              const partnerHistoryCount = 
                (partnerHistory[a1]?.[a2] || 0) + 
                (partnerHistory[b1]?.[b2] || 0);
              
              if (partnerHistoryCount < minPartnerHistory) {
                minPartnerHistory = partnerHistoryCount;
                bestPairing = {
                  court_num: courtNum,
                  teamA: arrangement.teamA,
                  teamB: arrangement.teamB,
                  players: players
                };
              }
            }
          }
        }
      }
    }
    
    if (!bestPairing) {
      // Fallback: just take first 4 available players
      bestPairing = {
        court_num: courtNum,
        teamA: [availablePlayers[0], availablePlayers[1]],
        teamB: [availablePlayers[2], availablePlayers[3]],
        players: availablePlayers.slice(0, 4)
      };
    }
    
    courts.push({
      court_num: bestPairing.court_num,
      teamA: bestPairing.teamA,
      teamB: bestPairing.teamB
    });
    
    // Mark these players as used
    bestPairing.players.forEach(p => used.add(p));
  }
  
  return courts;
}

function mockNextAmericanoRound(roundIndex, numCourts, allPlayers, previousRounds) {
  const partnerHistory = buildPartnerHistory(previousRounds);
  const restCounts = calculateRestCounts(allPlayers, previousRounds);
  
  console.log(`  Rest counts: ${Object.entries(restCounts).map(([p, c]) => `${p}:${c}`).join(', ')}`);
  
  const courts = generateAmericanoIndividualPairings(allPlayers, numCourts, partnerHistory, restCounts);
  
  return { courts };
}

// Test with 8 players, 1 court
console.log('🎾 Testing Americano Individual Mode with 8 Players (1 Court)');
console.log('=' .repeat(60));

const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const numCourts = 1;

console.log(`Players: ${players.join(', ')}`);
console.log(`Courts: ${numCourts} (4 play, 4 rest each round)`);
console.log('');

let previousRounds = [];

// Test 8 rounds to see full rotation
for (let round = 1; round <= 8; round++) {
  console.log(`--- ROUND ${round} ---`);
  
  try {
    const result = mockNextAmericanoRound(round - 1, numCourts, players, previousRounds);
    
    console.log('Courts:');
    result.courts.forEach(court => {
      const teamA = `${court.teamA[0]}-${court.teamA[1]}`;
      const teamB = `${court.teamB[0]}-${court.teamB[1]}`;
      console.log(`    Court ${court.court_num}: ${teamA} vs ${teamB}`);
    });
    
    // Track who's playing and who's resting
    const playingPlayers = new Set();
    result.courts.forEach(court => {
      court.teamA.forEach(p => playingPlayers.add(p));
      court.teamB.forEach(p => playingPlayers.add(p));
    });
    
    const restingPlayers = players.filter(p => !playingPlayers.has(p));
    console.log(`  Resting: ${restingPlayers.join(', ')}`);
    
    // Add to previous rounds
    previousRounds.push({
      round_num: round,
      courts: result.courts
    });
    
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error in round ${round}:`, error.message);
    break;
  }
}

// Analyze results
console.log('📊 ANALYSIS');
console.log('=' .repeat(40));

// Partner analysis
const partnerCounts = {};
previousRounds.forEach(round => {
  round.courts.forEach(court => {
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

// Rest analysis
const finalRestCounts = calculateRestCounts(players, previousRounds);
console.log('');
console.log('Final rest distribution:');
Object.entries(finalRestCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([player, restCount]) => {
    console.log(`  ${player}: ${restCount} round(s) resting`);
  });

const maxRest = Math.max(...Object.values(finalRestCounts));
const minRest = Math.min(...Object.values(finalRestCounts));
console.log(`Rest balance: ${minRest}-${maxRest} (difference: ${maxRest - minRest})`);

console.log('');
console.log('✅ Americano Individual Mode test completed!');
console.log('');
console.log('Key observations:');
console.log('• Each round, 4 players play and 4 players rest');
console.log('• Partner combinations should vary to give everyone different partners');
console.log('• Rest should be balanced so everyone sits out roughly the same number of rounds');
console.log('• The algorithm prioritizes players who have rested more for the next round');
