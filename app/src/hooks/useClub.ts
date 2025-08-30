import { useCallback } from 'react';
import { ClubService, type Club } from '@/services';
import { useSupabaseQuery, useSupabaseQueryList, useSupabaseMutation } from './useSupabaseQuery';

/**
 * Hook for managing clubs
 */
export function useClubs() {
  const clubsQuery = useSupabaseQueryList(
    () => ClubService.getClubs(),
    []
  );

  const createClubMutation = useSupabaseMutation<Club, string>();

  const createClub = useCallback(async (name: string) => {
    const result = await createClubMutation.mutate(
      (name) => ClubService.createClub(name),
      name
    );

    if (result) {
      clubsQuery.refetch();
    }

    return result;
  }, [createClubMutation, clubsQuery]);

  return {
    clubs: clubsQuery.data,
    loading: clubsQuery.loading,
    error: clubsQuery.error,
    refetch: clubsQuery.refetch,
    createClub,
    creating: createClubMutation.loading,
    createError: createClubMutation.error,
  };
}

/**
 * Hook for managing a single club
 */
export function useClub(clubId: string | null) {
  const clubQuery = useSupabaseQuery(
    () => ClubService.getClub(clubId!),
    [clubId],
    { enabled: !!clubId }
  );

  const updateClubMutation = useSupabaseMutation<Club, { clubId: string; updates: Partial<Pick<Club, 'name'>> }>();
  const deleteClubMutation = useSupabaseMutation<void, string>();

  const updateClub = useCallback(async (updates: Partial<Pick<Club, 'name'>>) => {
    if (!clubId) return null;

    const result = await updateClubMutation.mutate(
      ({ clubId, updates }) => ClubService.updateClub(clubId, updates),
      { clubId, updates }
    );

    if (result) {
      clubQuery.refetch();
    }

    return result;
  }, [clubId, updateClubMutation, clubQuery]);

  const deleteClub = useCallback(async () => {
    if (!clubId) return;

    await deleteClubMutation.mutate(
      (id) => ClubService.deleteClub(id),
      clubId
    );
  }, [clubId, deleteClubMutation]);

  return {
    club: clubQuery.data,
    loading: clubQuery.loading,
    error: clubQuery.error,
    refetch: clubQuery.refetch,
    updateClub,
    deleteClub,
    updating: updateClubMutation.loading,
    deleting: deleteClubMutation.loading,
    updateError: updateClubMutation.error,
    deleteError: deleteClubMutation.error,
  };
}
