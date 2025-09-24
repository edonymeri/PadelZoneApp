// src/hooks/useEventDisplay.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateEventLeaderboard } from '@/lib/leaderboard';

export function useEventDisplay(eventId: string) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshLeaderboard = useCallback(async () => {
    if (!eventId) return;
    
    setIsRefreshing(true);
    try {
      const data = await calculateEventLeaderboard(eventId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  // Auto-refresh leaderboard every 30 seconds in display mode
  useEffect(() => {
    refreshLeaderboard();
    
    const startAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        refreshLeaderboard().then(() => startAutoRefresh());
      }, 30000);
    };

    startAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshLeaderboard]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!eventId) return;

    const matchesChannel = supabase
      .channel(`event-${eventId}-matches`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `round_id=in.(select id from rounds where event_id=eq.${eventId})`
        },
        () => {
          refreshLeaderboard();
        }
      )
      .subscribe();

    const roundPointsChannel = supabase
      .channel(`event-${eventId}-round-points`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'round_points',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          refreshLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(roundPointsChannel);
    };
  }, [eventId, refreshLeaderboard]);

  return {
    leaderboard,
    isRefreshing,
    refreshLeaderboard
  };
}