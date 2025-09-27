import { describe, it, expect } from 'vitest';

import { nextAmericanoRound, AmericanoPairingOptions } from '@/lib/engine';
import type { RoundState } from '@/lib/types';

describe('Americano individual format with 9 players', () => {
  it('rotates the rest slot so each player sits exactly once across nine rounds', () => {
  const players = Array.from({ length: 9 }, (_, index) => `Player (${index + 1})`);
    const courts = 2;

    const options: AmericanoPairingOptions = {
      format: 'americano',
      variant: 'individual',
      antiRepeatWindow: 3,
      restBalancing: true,
    };

    const restCounts = new Map(players.map((player) => [player, 0]));
  const partnershipCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();

    let previousRounds: RoundState[] = [];

    // Run nine rounds so each player should rest once.
    console.log('\n🎾 Americano mock tournament — 9 players across two courts');

    for (let iteration = 0; iteration < players.length; iteration++) {
      const nextRoundState = nextAmericanoRound(
        iteration,
        courts,
        players,
        previousRounds,
        options
      );

      const playing = new Set<string>();
      nextRoundState.courts.forEach((court) => {
        court.teamA.forEach((player) => playing.add(player));
        court.teamB.forEach((player) => playing.add(player));

        const teamAPair = [...court.teamA].sort().join(' + ');
        const teamBPair = [...court.teamB].sort().join(' + ');
        partnershipCounts.set(teamAPair, (partnershipCounts.get(teamAPair) ?? 0) + 1);
        partnershipCounts.set(teamBPair, (partnershipCounts.get(teamBPair) ?? 0) + 1);

        court.teamA.forEach((playerA) => {
          court.teamB.forEach((playerB) => {
            const opponentsKey = [playerA, playerB].sort().join(' vs ');
            opponentCounts.set(opponentsKey, (opponentCounts.get(opponentsKey) ?? 0) + 1);
          });
        });
      });

      const resting = players.filter((player) => !playing.has(player));
      expect(resting.length).toBe(1);

      const roundNumber = iteration + 1;
      console.log(`\nRound ${roundNumber}`);
      nextRoundState.courts.forEach((court) => {
        console.log(
          `  Court ${court.court_num}: ${court.teamA.join(' & ')} vs ${court.teamB.join(' & ')}`
        );
      });
      console.log(`  Resting: ${resting[0]}`);

      const restingPlayer = resting[0];
      restCounts.set(restingPlayer, restCounts.get(restingPlayer)! + 1);

      previousRounds = [...previousRounds, nextRoundState];
    }

    console.log('\n🧮 Rest tracker');
    players.forEach((player) => {
      console.log(`  ${player}: rested ${restCounts.get(player)} round(s)`);
    });

    console.log('\n🤝 Partnership frequency');
    Array.from(partnershipCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .forEach(([pair, count]) => {
        console.log(`  ${pair}: ${count} match(es)`);
      });

    const expectedUniquePartnerships = (players.length * (players.length - 1)) / 2;
    expect(partnershipCounts.size).toBe(expectedUniquePartnerships);
    partnershipCounts.forEach((count) => {
      expect(count).toBe(1);
    });

    console.log('\n⚔️ Opponent frequency');
    Array.from(opponentCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .forEach(([pair, count]) => {
        console.log(`  ${pair}: ${count} game(s)`);
      });

    restCounts.forEach((count) => {
      expect(count).toBe(1);
    });
  });
});
