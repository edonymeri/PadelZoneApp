import { useCallback } from 'react';

import { PlayerService, type Player, type PlayerStats } from '@/services';

import { useSupabaseQuery, useSupabaseQueryList, useSupabaseMutation } from './useSupabaseQuery';

/**
 * Hook for managing a single player
 */
export function usePlayer(playerId: string | null) {
  const playerQuery = useSupabaseQuery(
    () => PlayerService.getPlayer(playerId!),
    [playerId],
    { enabled: !!playerId }
  );

  const statsQuery = useSupabaseQuery(
    () => PlayerService.getPlayerStats(playerId!),
    [playerId],
    { enabled: !!playerId }
  );

  const eloHistoryQuery = useSupabaseQueryList(
    () => PlayerService.getPlayerEloHistory(playerId!),
    [playerId],
    { enabled: !!playerId }
  );

  const updatePlayerMutation = useSupabaseMutation<Player, { playerId: string; updates: Partial<Player> }>();

  const updatePlayer = useCallback(async (updates: Partial<Player>) => {
    if (!playerId) return null;

    const result = await updatePlayerMutation.mutate(
      ({ playerId, updates }) => PlayerService.updatePlayer(playerId, updates),
      { playerId, updates }
    );

    if (result) {
      playerQuery.refetch();
    }

    return result;
  }, [playerId, updatePlayerMutation, playerQuery]);

  return {
    player: playerQuery.data,
    stats: statsQuery.data,
    eloHistory: eloHistoryQuery.data,
    loading: playerQuery.loading || statsQuery.loading,
    error: playerQuery.error || statsQuery.error || eloHistoryQuery.error,
    refetch: () => {
      playerQuery.refetch();
      statsQuery.refetch();
      eloHistoryQuery.refetch();
    },
    updatePlayer,
    updating: updatePlayerMutation.loading,
    updateError: updatePlayerMutation.error,
  };
}

/**
 * Hook for managing club players
 */
export function useClubPlayers(clubId: string | null) {
  const playersQuery = useSupabaseQueryList(
    () => PlayerService.getClubPlayers(clubId!),
    [clubId],
    { enabled: !!clubId }
  );

  const createPlayerMutation = useSupabaseMutation<Player, Omit<Player, 'id' | 'created_at'>>();
  const deletePlayerMutation = useSupabaseMutation<void, string>();

  const createPlayer = useCallback(async (playerData: Omit<Player, 'id' | 'created_at'>) => {
    const result = await createPlayerMutation.mutate(
      (data) => PlayerService.createPlayer(data),
      playerData
    );

    if (result) {
      playersQuery.refetch();
    }

    return result;
  }, [createPlayerMutation, playersQuery]);

  const deletePlayer = useCallback(async (playerId: string) => {
    await deletePlayerMutation.mutate(
      (id) => PlayerService.deletePlayer(id),
      playerId
    );

    playersQuery.refetch();
  }, [deletePlayerMutation, playersQuery]);

  return {
    players: playersQuery.data,
    loading: playersQuery.loading,
    error: playersQuery.error,
    refetch: playersQuery.refetch,
    createPlayer,
    deletePlayer,
    creating: createPlayerMutation.loading,
    deleting: deletePlayerMutation.loading,
    createError: createPlayerMutation.error,
    deleteError: deletePlayerMutation.error,
  };
}

/**
 * Hook for player search
 */
export function usePlayerSearch(query: string, clubId?: string) {
  const searchQuery = useSupabaseQueryList(
    () => PlayerService.searchPlayers(query, clubId),
    [query, clubId],
    { enabled: query.length >= 2 } // Only search when query is at least 2 characters
  );

  return {
    players: searchQuery.data,
    loading: searchQuery.loading,
    error: searchQuery.error,
  };
}

/**
 * Hook for top players
 */
export function useTopPlayers(clubId?: string, limit = 10) {
  const topPlayersQuery = useSupabaseQueryList(
    () => PlayerService.getTopPlayers(clubId, limit),
    [clubId, limit]
  );

  return {
    players: topPlayersQuery.data,
    loading: topPlayersQuery.loading,
    error: topPlayersQuery.error,
    refetch: topPlayersQuery.refetch,
  };
}
