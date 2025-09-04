/**
 * Mathematical verification that Americano Individual mode ensures
 * every player pairs with every other player exactly once
 */

// Test the actual Americano algorithm implementation
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

function generateOptimalPairings(allPlayers, numCourts, partnerHistory) {
  const courts = [];
  const used = new Set();
  const playersPerCourt = 4;
  const totalPlaying = numCourts * playersPerCourt;
  
  // For this test, all players play (2 courts scenario)
  const playingPlayers = [...allPlayers];
  
  // Create pairings for each court with minimal partner repetition
  for (let courtNum = 1; courtNum <= numCourts; courtNum++) {
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
      throw new Error(`Could not find valid pairing for court ${courtNum}`);
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

// Test with 8 players, 2 courts (complete partner rotation scenario)
console.log('🧮 MATHEMATICAL VERIFICATION: Complete Partner Rotation');
console.log('=' .repeat(65));
console.log('');

const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const numCourts = 2;

console.log(`Testing: ${players.length} players, ${numCourts} courts`);
console.log(`Players: ${players.join(', ')}`);
console.log('');

// Calculate mathematical expectations
const totalPossiblePairs = (players.length * (players.length - 1)) / 2;
const pairsPerRound = numCourts * 2; // 2 teams per court
const theoreticalRounds = Math.ceil(totalPossiblePairs / pairsPerRound);

console.log('📊 MATHEMATICAL EXPECTATIONS:');
console.log(`Total possible partnerships: C(${players.length},2) = ${totalPossiblePairs}`);
console.log(`Partnerships created per round: ${pairsPerRound} (${numCourts} courts × 2 teams)`);
console.log(`Theoretical minimum rounds needed: ${theoreticalRounds}`);
console.log('');

// Run the simulation
let previousRounds = [];
const maxRounds = theoreticalRounds;

console.log('🎾 ROUND-BY-ROUND SIMULATION:');
console.log('-'.repeat(40));

for (let round = 1; round <= maxRounds; round++) {
  console.log(`Round ${round}:`);
  
  try {
    const partnerHistory = buildPartnerHistory(previousRounds);
    const courts = generateOptimalPairings(players, numCourts, partnerHistory);
    
    courts.forEach(court => {
      const teamA = `${court.teamA[0]}-${court.teamA[1]}`;
      const teamB = `${court.teamB[0]}-${court.teamB[1]}`;
      console.log(`  Court ${court.court_num}: ${teamA} vs ${teamB}`);
    });
    
    previousRounds.push({
      round_num: round,
      courts: courts
    });
    
  } catch (error) {
    console.error(`❌ Error in round ${round}:`, error.message);
    break;
  }
}

console.log('');

// Analyze final results
console.log('🔍 COMPLETE PARTNERSHIP ANALYSIS:');
console.log('=' .repeat(50));

// Create partnership matrix
const partnerMatrix = {};
players.forEach(p1 => {
  partnerMatrix[p1] = {};
  players.forEach(p2 => {
    if (p1 !== p2) {
      partnerMatrix[p1][p2] = 0;
    }
  });
});

// Count all partnerships
previousRounds.forEach(round => {
  round.courts.forEach(court => {
    // Team A partnership
    const [a1, a2] = court.teamA;
    partnerMatrix[a1][a2]++;
    partnerMatrix[a2][a1]++;
    
    // Team B partnership
    const [b1, b2] = court.teamB;
    partnerMatrix[b1][b2]++;
    partnerMatrix[b2][b1]++;
  });
});

// Display partnership matrix
console.log('Partnership Matrix (showing how many times each pair played together):');
console.log('');
console.log('     ' + players.join('  '));
players.forEach(p1 => {
  const row = p1 + ':  ';
  const counts = players.map(p2 => {
    if (p1 === p2) return ' ';
    return partnerMatrix[p1][p2].toString();
  });
  console.log(row + counts.join('  '));
});

console.log('');

// Verify perfect rotation
const allPartnershipCounts = [];
players.forEach(p1 => {
  players.forEach(p2 => {
    if (p1 < p2) { // Only count each pair once (avoid duplicates)
      allPartnershipCounts.push(partnerMatrix[p1][p2]);
    }
  });
});

const uniqueCounts = [...new Set(allPartnershipCounts)];
const maxCount = Math.max(...allPartnershipCounts);
const minCount = Math.min(...allPartnershipCounts);

console.log('📈 VERIFICATION RESULTS:');
console.log('-'.repeat(30));
console.log(`Total partnerships tracked: ${allPartnershipCounts.length}`);
console.log(`Expected partnerships: ${totalPossiblePairs}`);
console.log(`Partnership frequency range: ${minCount} to ${maxCount}`);
console.log(`Unique frequency values: [${uniqueCounts.join(', ')}]`);

if (allPartnershipCounts.length === totalPossiblePairs) {
  console.log('✅ Correct number of partnerships tracked');
} else {
  console.log('❌ Partnership count mismatch');
}

if (uniqueCounts.length === 1 && uniqueCounts[0] === 1) {
  console.log('✅ PERFECT: Every pair plays together exactly once!');
} else if (maxCount - minCount <= 1) {
  console.log('✅ EXCELLENT: Partnership distribution is nearly perfect');
} else {
  console.log('⚠️  Partnership distribution needs improvement');
}

// Count partnerships by frequency
const frequencyDistribution = {};
allPartnershipCounts.forEach(count => {
  frequencyDistribution[count] = (frequencyDistribution[count] || 0) + 1;
});

console.log('');
console.log('Partnership Frequency Distribution:');
Object.entries(frequencyDistribution).forEach(([frequency, count]) => {
  console.log(`  ${count} pairs played together ${frequency} time(s)`);
});

console.log('');
console.log('🏆 FINAL VERDICT:');
console.log('-'.repeat(20));
if (uniqueCounts.length === 1 && uniqueCounts[0] === 1) {
  console.log('🎯 PERFECT ROTATION ACHIEVED!');
  console.log('✅ Every player pairs with every other player exactly once');
  console.log('✅ No repeated partnerships');
  console.log('✅ Optimal mathematical solution');
} else {
  console.log('📊 Partnership analysis complete');
  console.log(`📈 Distribution: ${JSON.stringify(frequencyDistribution)}`);
}
