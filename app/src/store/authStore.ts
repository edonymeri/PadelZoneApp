import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

interface AuthState {
  // Auth data
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        loading: true,

        // Actions
        signIn: async (email: string, password: string) => {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw new Error(error.message);
          }
        },

        signUp: async (email: string, password: string) => {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            throw new Error(error.message);
          }
        },

        signOut: async () => {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            throw new Error(error.message);
          }
          
          set({ user: null, session: null });
        },

        initialize: async () => {
          set({ loading: true });
          
          try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ 
              session, 
              user: session?.user || null,
              loading: false 
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({ loading: false });
          }
        },

        setSession: (session: Session | null) => {
          set({ 
            session, 
            user: session?.user || null,
            loading: false 
          });
        },
      }),
      {
        name: 'auth-store',
        // Only persist non-sensitive data
        partialize: (state) => ({
          user: state.user,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);
