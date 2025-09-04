/**
 * Test Americano Individual mode with 8 players, 2 courts (no resting)
 */

// Same helper functions from previous test
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

function generateAmericanoIndividualPairings2Courts(allPlayers, partnerHistory) {
  const courts = [];
  const used = new Set();
  
  // For 2 courts with 8 players, all players play every round
  const playingPlayers = [...allPlayers];
  
  console.log(`  All players playing: ${playingPlayers.join(', ')}`);
  
  // Create pairings for 2 courts with minimal partner repetition
  for (let courtNum = 1; courtNum <= 2; courtNum++) {
    const availablePlayers = playingPlayers.filter(p => !used.has(p));
    
    if (availablePlayers.length < 4) {
      throw new Error(`Not enough available players for court ${courtNum}`);
    }
    
    // Find best pairing with minimal partner history
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

function mockNextAmericanoRound2Courts(roundIndex, allPlayers, previousRounds) {
  const partnerHistory = buildPartnerHistory(previousRounds);
  
  console.log(`  Partner history summary:`);
  Object.entries(partnerHistory).forEach(([player, partners]) => {
    const partnersStr = Object.entries(partners).map(([p, count]) => `${p}:${count}`).join(',');
    if (partnersStr) {
      console.log(`    ${player} -> {${partnersStr}}`);
    }
  });
  
  const courts = generateAmericanoIndividualPairings2Courts(allPlayers, partnerHistory);
  
  return { courts };
}

// Test with 8 players, 2 courts (everyone plays every round)
console.log('🎾 Testing Americano Individual Mode with 8 Players (2 Courts)');
console.log('=' .repeat(60));

const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const numCourts = 2;

console.log(`Players: ${players.join(', ')}`);
console.log(`Courts: ${numCourts} (all 8 players play every round)`);
console.log('');

let previousRounds = [];

// Test 7 rounds to see if we can get unique partnerships
for (let round = 1; round <= 7; round++) {
  console.log(`--- ROUND ${round} ---`);
  
  try {
    const result = mockNextAmericanoRound2Courts(round - 1, players, previousRounds);
    
    console.log('Courts:');
    result.courts.forEach(court => {
      const teamA = `${court.teamA[0]}-${court.teamA[1]}`;
      const teamB = `${court.teamB[0]}-${court.teamB[1]}`;
      console.log(`    Court ${court.court_num}: ${teamA} vs ${teamB}`);
    });
    
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

console.log('Partner combinations and frequency:');
Object.entries(partnerCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([partnership, count]) => {
    console.log(`  ${partnership}: ${count} time(s)`);
  });

// Check for repeated partnerships
const repeatedPartnerships = Object.entries(partnerCounts).filter(([,count]) => count > 1);
if (repeatedPartnerships.length > 0) {
  console.log('');
  console.log('⚠️  Repeated partnerships:');
  repeatedPartnerships.forEach(([partnership, count]) => {
    console.log(`  ${partnership}: ${count} times`);
  });
} else {
  console.log('');
  console.log('✅ No repeated partnerships - perfect partner rotation!');
}

// Mathematical check
const totalPossiblePartnerships = (players.length * (players.length - 1)) / 2; // C(8,2) = 28
const roundsCompleted = previousRounds.length;
const partnershipsPerRound = numCourts * 2; // 2 partnerships per court
const totalPartnerships = roundsCompleted * partnershipsPerRound;

console.log('');
console.log('📈 Mathematical Analysis:');
console.log(`Total possible partnerships with 8 players: ${totalPossiblePartnerships}`);
console.log(`Partnerships created in ${roundsCompleted} rounds: ${totalPartnerships}`);
console.log(`Theoretical rounds needed for each pair to play once: ${Math.ceil(totalPossiblePartnerships / partnershipsPerRound)}`);

console.log('');
console.log('✅ Americano Individual Mode (2 Courts) test completed!');
console.log('');
console.log('Key observations:');
console.log('• All 8 players play every round (no resting)');
console.log('• Algorithm tries to minimize repeated partnerships');
console.log('• With 8 players, there are 28 possible partnerships');
console.log('• Each round creates 4 partnerships (2 courts × 2 teams per court)');
console.log('• Perfect rotation would require 7 rounds for each pair to play exactly once');
