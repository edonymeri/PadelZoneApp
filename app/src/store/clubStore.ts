import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ClubService, type Club } from '@/services';

interface ClubState {
  // Club data
  clubs: Club[];
  activeClubId: string | null;
  activeClub: Club | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Actions
  loadClubs: () => Promise<void>;
  createClub: (name: string) => Promise<Club | null>;
  setActiveClub: (clubId: string | null) => void;
  updateClub: (clubId: string, updates: Partial<Pick<Club, 'name'>>) => Promise<void>;
  deleteClub: (clubId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useClubStore = create<ClubState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        clubs: [],
        activeClubId: null,
        activeClub: null,
        loading: false,
        error: null,

        // Actions
        loadClubs: async () => {
          set({ loading: true, error: null });
          
          try {
            const clubs = await ClubService.getClubs();
            const { activeClubId } = get();
            const activeClub = clubs.find(c => c.id === activeClubId) || null;
            
            set({
              clubs,
              activeClub,
              loading: false,
            });
          } catch (error: any) {
            set({
              loading: false,
              error: error.message || 'Failed to load clubs',
            });
          }
        },

        createClub: async (name: string) => {
          try {
            const newClub = await ClubService.createClub(name);
            const { clubs } = get();
            
            set({
              clubs: [newClub, ...clubs],
              activeClubId: newClub.id,
              activeClub: newClub,
            });
            
            return newClub;
          } catch (error: any) {
            set({ error: error.message || 'Failed to create club' });
            return null;
          }
        },

        setActiveClub: (clubId: string | null) => {
          const { clubs } = get();
          const activeClub = clubId ? clubs.find(c => c.id === clubId) || null : null;
          
          set({
            activeClubId: clubId,
            activeClub,
          });
        },

        updateClub: async (clubId: string, updates: Partial<Pick<Club, 'name'>>) => {
          try {
            const updatedClub = await ClubService.updateClub(clubId, updates);
            const { clubs, activeClubId } = get();
            
            const updatedClubs = clubs.map(club =>
              club.id === clubId ? updatedClub : club
            );
            
            set({
              clubs: updatedClubs,
              activeClub: activeClubId === clubId ? updatedClub : get().activeClub,
            });
          } catch (error: any) {
            set({ error: error.message || 'Failed to update club' });
          }
        },

        deleteClub: async (clubId: string) => {
          try {
            await ClubService.deleteClub(clubId);
            const { clubs, activeClubId } = get();
            
            const updatedClubs = clubs.filter(club => club.id !== clubId);
            
            set({
              clubs: updatedClubs,
              activeClubId: activeClubId === clubId ? null : activeClubId,
              activeClub: activeClubId === clubId ? null : get().activeClub,
            });
          } catch (error: any) {
            set({ error: error.message || 'Failed to delete club' });
          }
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      {
        name: 'club-store',
        // Persist active club selection
        partialize: (state) => ({
          activeClubId: state.activeClubId,
        }),
      }
    ),
    {
      name: 'club-store',
    }
  )
);
