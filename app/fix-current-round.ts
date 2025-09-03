// Emergency fix for duplicate player issue in current round
import { supabase } from "@/lib/supabase";

async function fixCurrentRound() {
  console.log('🚨 EMERGENCY FIX: Resolving duplicate player issue...');
  
  try {
    // Get the current active event
    const { data: currentEvent, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .is('ended_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (eventError || !currentEvent) {
      throw new Error('No active event found');
    }
    
    console.log(`📊 Working on event: ${currentEvent.name} (${currentEvent.id})`);
    
    // Get the current round
    const { data: currentRound, error: roundError } = await supabase
      .from('rounds')
      .select('id, round_num')
      .eq('event_id', currentEvent.id)
      .order('round_num', { ascending: false })
      .limit(1)
      .single();
    
    if (roundError || !currentRound) {
      throw new Error('No current round found');
    }
    
    console.log(`🎯 Working on round: ${currentRound.round_num} (${currentRound.id})`);
    
    // Get all matches in the current round
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('round_id', currentRound.id)
      .order('court_num');
    
    if (matchesError || !matches) {
      throw new Error('Failed to fetch matches');
    }
    
    console.log(`🏟️ Found ${matches.length} matches in current round`);
    
    // Get all event players
    const { data: eventPlayers, error: playersError } = await supabase
      .from('event_players')
      .select('player_id')
      .eq('event_id', currentEvent.id);
    
    if (playersError || !eventPlayers) {
      throw new Error('Failed to fetch event players');
    }
    
    const expectedPlayerIds = eventPlayers.map(ep => ep.player_id);
    console.log(`👥 Expected players: ${expectedPlayerIds.length}`);
    
    // Extract all current players from matches
    const currentPlayers: string[] = [];
    matches.forEach(match => {
      currentPlayers.push(match.team_a_player1, match.team_a_player2, match.team_b_player1, match.team_b_player2);
    });
    
    // Find duplicates and missing players
    const playerCounts = new Map<string, number>();
    currentPlayers.forEach(playerId => {
      playerCounts.set(playerId, (playerCounts.get(playerId) || 0) + 1);
    });
    
    const duplicates = Array.from(playerCounts.entries()).filter(([_, count]) => count > 1);
    const missingPlayers = expectedPlayerIds.filter(playerId => !currentPlayers.includes(playerId));
    
    console.log(`🔍 Analysis:`);
    console.log(`   Duplicates found: ${duplicates.length}`);
    console.log(`   Missing players: ${missingPlayers.length}`);
    
    if (duplicates.length === 0 && missingPlayers.length === 0) {
      console.log('✅ No issues found! Current round is valid.');
      return;
    }
    
    // Show details
    if (duplicates.length > 0) {
      console.log('\n🚨 DUPLICATE PLAYERS:');
      for (const [playerId, count] of duplicates) {
        console.log(`   Player ${playerId}: appears ${count} times`);
      }
    }
    
    if (missingPlayers.length > 0) {
      console.log('\n❌ MISSING PLAYERS:');
      for (const playerId of missingPlayers) {
        console.log(`   Player ${playerId}: not in current round`);
      }
    }
    
    // Fix the issue by regenerating the round
    console.log('\n🔧 FIXING: Regenerating current round...');
    
    // Delete current matches
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('round_id', currentRound.id);
    
    if (deleteError) {
      throw new Error(`Failed to delete matches: ${deleteError.message}`);
    }
    
    console.log('🗑️ Deleted current matches');
    
    // Create new matches with correct player distribution
    const newMatches = [];
    const shuffledPlayers = [...expectedPlayerIds].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < matches.length; i++) {
      const startIndex = i * 4;
      newMatches.push({
        round_id: currentRound.id,
        court_num: i + 1,
        team_a_player1: shuffledPlayers[startIndex],
        team_a_player2: shuffledPlayers[startIndex + 1],
        team_b_player1: shuffledPlayers[startIndex + 2],
        team_b_player2: shuffledPlayers[startIndex + 3],
      });
    }
    
    // Insert new matches
    const { error: insertError } = await supabase
      .from('matches')
      .insert(newMatches);
    
    if (insertError) {
      throw new Error(`Failed to insert new matches: ${insertError.message}`);
    }
    
    console.log('✅ Inserted new matches');
    
    // Verify the fix
    const { data: verifyMatches, error: verifyError } = await supabase
      .from('matches')
      .select('*')
      .eq('round_id', currentRound.id)
      .order('court_num');
    
    if (verifyError || !verifyMatches) {
      throw new Error('Failed to verify fix');
    }
    
    const verifyPlayers: string[] = [];
    verifyMatches.forEach(match => {
      verifyPlayers.push(match.team_a_player1, match.team_a_player2, match.team_b_player1, match.team_b_player2);
    });
    
    const verifyPlayerCounts = new Map<string, number>();
    verifyPlayers.forEach(playerId => {
      verifyPlayerCounts.set(playerId, (verifyPlayerCounts.get(playerId) || 0) + 1);
    });
    
    const verifyDuplicates = Array.from(verifyPlayerCounts.entries()).filter(([_, count]) => count > 1);
    const verifyMissing = expectedPlayerIds.filter(playerId => !verifyPlayers.includes(playerId));
    
    console.log('\n🔍 VERIFICATION:');
    console.log(`   Duplicates: ${verifyDuplicates.length} (should be 0)`);
    console.log(`   Missing: ${verifyMissing.length} (should be 0)`);
    
    if (verifyDuplicates.length === 0 && verifyMissing.length === 0) {
      console.log('🎉 SUCCESS: Round fixed successfully!');
      console.log('\n📋 New match assignments:');
      verifyMatches.forEach(match => {
        console.log(`   Court ${match.court_num}: ${match.team_a_player1}, ${match.team_a_player2} vs ${match.team_b_player1}, ${match.team_b_player2}`);
      });
    } else {
      console.log('❌ FAILED: Issues still exist after fix');
    }
    
  } catch (error) {
    console.error('💥 ERROR:', error);
    throw error;
  }
}

// Run the fix
fixCurrentRound()
  .then(() => {
    console.log('\n✅ Emergency fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Emergency fix failed:', error);
    process.exit(1);
  });
