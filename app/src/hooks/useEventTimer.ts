// src/hooks/useEventTimer.ts
import { useState, useEffect } from "react";

export function useEventTimer(shouldShowTimer: boolean, startedAt: string | null, eventDurationHours?: number) {
  const [now, setNow] = useState<number>(Date.now());

  // Timer logic
  useEffect(() => {
    if (!shouldShowTimer || !startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [shouldShowTimer, startedAt]);

  // Calculate timer display and remaining time
  const timerInfo = (() => {
    if (!shouldShowTimer || !startedAt) {
      return { timeText: "", remainingMs: 0 };
    }

    const startMs = new Date(startedAt).getTime();
    const elapsedMs = now - startMs;

    if (eventDurationHours && eventDurationHours > 0) {
      // Event duration timer
      const totalMs = eventDurationHours * 60 * 60 * 1000;
      const remainingMs = Math.max(0, totalMs - elapsedMs);
      
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
      
      const timeText = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      return { timeText, remainingMs };
    } else {
      // Elapsed time
      const hours = Math.floor(elapsedMs / (60 * 60 * 1000));
      const minutes = Math.floor((elapsedMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((elapsedMs % (60 * 1000)) / 1000);
      
      const timeText = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      return { timeText, remainingMs: elapsedMs };
    }
  })();

  const startTimer = (roundId: string) => {
    if (!roundId) return;
    
    const startTime = new Date().toISOString();
    setNow(Date.now());
    // Update in database - implement this
    // updateRoundStartTime(roundId, startTime);
  };

  return {
    timeText: timerInfo.timeText,
    remainingMs: timerInfo.remainingMs,
    startTimer,
    setNow
  };
}