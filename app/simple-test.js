// Simple test to verify Americano Individual mode with 8 players
const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

console.log('🎾 Testing Americano Individual Mode with 8 Players');
console.log('=' .repeat(60));
console.log(`Players: ${players.join(', ')}`);
console.log('Courts: 1 (4 play, 4 rest each round)');
console.log('');

// Mock the nextAmericanoRound function for testing
function mockAmericanoRound(roundIndex, numCourts, allPlayers) {
  // Simple rotation logic for testing
  const playersPerCourt = 4;
  const totalPlaying = numCourts * playersPerCourt;
  
  // Rotate who plays each round
  const offset = (roundIndex * 2) % allPlayers.length;
  const playing = [];
  
  for (let i = 0; i < totalPlaying; i++) {
    playing.push(allPlayers[(offset + i) % allPlayers.length]);
  }
  
  // Create pairs
  const courts = [];
  for (let c = 0; c < numCourts; c++) {
    const startIdx = c * 4;
    courts.push({
      court_num: c + 1,
      teamA: [playing[startIdx], playing[startIdx + 1]],
      teamB: [playing[startIdx + 2], playing[startIdx + 3]]
    });
  }
  
  return { courts };
}

// Test 6 rounds
let previousRounds = [];
for (let round = 1; round <= 6; round++) {
  console.log(`--- ROUND ${round} ---`);
  
  const result = mockAmericanoRound(round - 1, 1, players);
  
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
  console.log('');
  
  previousRounds.push(result);
}

console.log('✅ Basic rotation test completed');
console.log('Note: This is a simplified test. The actual Americano algorithm');
console.log('includes partner rotation and rest balancing logic.');
