// src/pages/EventControlPageRefactored.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { CourtMatch } from "@/lib/types";
import { Nightly, Season } from "./NightlySeason";
import ScorePad from "@/components/ScorePad";
import EventHeader from "@/components/event/EventHeader";
import EventControls from "@/components/event/EventControls";
import CourtCard from "@/components/event/CourtCard";
import EventActionBar from "@/components/event/EventActionBar";
import EventProgress from "@/components/event/EventProgress";
import EventQuickStats from "@/components/event/EventQuickStats";
import EventLoadingSkeleton from "@/components/event/EventLoadingSkeleton";
import WildcardModal from "@/components/event/WildcardModal";
import { useEventControl } from "@/hooks/useEventControl";
import { isWildcardRound, applyWildcardShuffle, getNextWildcardRound } from "@/utils/wildcardUtils";

export default function EventControlPageRefactored() {
  const { eventId } = useParams();
  
  const {
    // State
    meta,
    players,
    roundNum,
    courts,
    history,
    nightlyCount,
    initializing,
    loadingRound,
    padOpen,
    padTarget,
    startedAt,
    now,
    roundId,
    useKeypad,
    isPointsMode,
    isTimeMode,
    shouldShowTimer,
    hasRoundLimit,
    hasTimeLimit,
    isEnded,
    timeText,
    remainingMs,

    // Actions
    setScore,
    startTimer,
    endRoundAndAdvance,
    undoLastRound,
    endEvent,
    exportEventJSON,
    setUseKeypad,
    setPadOpen,
    setPadTarget,
  } = useEventControl(eventId);

  // Round navigation state
  const [viewingRoundNum, setViewingRoundNum] = useState(roundNum);
  const [isViewingHistorical, setIsViewingHistorical] = useState(false);
  const [historicalCourts, setHistoricalCourts] = useState<CourtMatch[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  
  // Update viewing round when current round changes
  useEffect(() => {
    if (!isViewingHistorical) {
      setViewingRoundNum(roundNum);
    }
  }, [roundNum, isViewingHistorical]);

  // Load historical round data
  const loadHistoricalRound = async (roundNumber: number) => {
    if (!eventId) return;
    
    setLoadingHistorical(true);
    try {
      console.log(`Loading historical data for event ${eventId}, round ${roundNumber}`);
      
      // First, let's see what rounds exist for this event
      const { data: allRounds } = await supabase
        .from('rounds')
        .select('id, round_num, finished')
        .eq('event_id', eventId)
        .order('round_num');
      
      console.log('All rounds for this event:', allRounds);
      
      // Get the round data for the specific round number
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .eq('event_id', eventId)
        .eq('round_num', roundNumber) // Using round_num instead of round_number
        .single();

      console.log(`Round data for round ${roundNumber}:`, roundData);

      if (roundData) {
        // Get matches for this round
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .eq('round_id', roundData.id);

        console.log('Matches data:', matches);

        if (matches && matches.length > 0) {
          // Convert matches to court format - ensure all required fields
          const historicalCourtData: CourtMatch[] = matches
            .filter(match => 
              match.team_a_player1 && 
              match.team_a_player2 && 
              match.team_b_player1 && 
              match.team_b_player2
            )
            .map(match => ({
              court_num: match.court_num,
              teamA: [match.team_a_player1, match.team_a_player2],
              teamB: [match.team_b_player1, match.team_b_player2],
              scoreA: match.score_a || 0,
              scoreB: match.score_b || 0,
            }));
          
          console.log('Historical court data:', historicalCourtData);
          setHistoricalCourts(historicalCourtData);
        } else {
          console.log('No matches found for this round');
          setHistoricalCourts([]);
        }
      } else {
        console.log('No round data found for round', roundNumber);
        setHistoricalCourts([]);
      }
    } catch (error) {
      console.error('Error loading historical round:', error);
      setHistoricalCourts([]);
    }
    setLoadingHistorical(false);
  };

  // Handle round navigation
  const handleRoundChange = async (newRoundNum: number) => {
    console.log(`Navigating to round ${newRoundNum}, current round is ${roundNum}`);
    setViewingRoundNum(newRoundNum);
    const isHistorical = newRoundNum < roundNum;
    setIsViewingHistorical(isHistorical);
    
    if (isHistorical) {
      console.log(`Loading historical data for round ${newRoundNum}`);
      await loadHistoricalRound(newRoundNum);
    } else {
      // Back to current round - clear historical data
      console.log('Returning to current round');
      setHistoricalCourts([]);
    }
  };

  // Calculate total completed rounds (can navigate to all rounds from 1 to current)
  const totalCompletedRounds = roundNum;

  // Wildcard state
  const [showWildcardModal, setShowWildcardModal] = useState(false);
  const [wildcardChanges, setWildcardChanges] = useState<Array<{
    courtNum: number;
    from: string[];
    to: string[];
  }>>([]);

  // Use historical courts if viewing historical, otherwise current courts
  const displayCourts = isViewingHistorical ? historicalCourts : courts;
  
  // Check if next round will be a wildcard
  const nextRoundIsWildcard = meta ? isWildcardRound(roundNum + 1, meta as any) : false;
  
  // Debug wildcard detection
  console.log('🎲 Wildcard Debug:', {
    roundNum,
    nextRound: roundNum + 1,
    meta: meta ? {
      wildcard_enabled: meta.wildcard_enabled,
      wildcard_start_round: meta.wildcard_start_round,
      wildcard_frequency: meta.wildcard_frequency,
      wildcard_intensity: meta.wildcard_intensity
    } : null,
    nextRoundIsWildcard
  });
  
  // Generate wildcard changes
  const generateWildcardChanges = (beforeCourts: CourtMatch[], afterCourts: CourtMatch[]) => {
    return beforeCourts.map((beforeCourt, index) => {
      const afterCourt = afterCourts[index];
      const beforePlayers = [...beforeCourt.teamA, ...beforeCourt.teamB];
      const afterPlayers = [...afterCourt.teamA, ...afterCourt.teamB];
      
      return {
        courtNum: beforeCourt.court_num,
        from: beforePlayers.map(playerId => players[playerId]?.full_name || 'Unknown').filter(Boolean),
        to: afterPlayers.map(playerId => players[playerId]?.full_name || 'Unknown').filter(Boolean)
      };
    });
  };

  // Handle wildcard modal completion
  const handleWildcardComplete = () => {
    setShowWildcardModal(false);
    setWildcardChanges([]);
  };

  // Wildcard-aware round advancement - show preview before advancing
  const handleWildcardRoundAdvance = async () => {
    if (!meta || isViewingHistorical) {
      await endRoundAndAdvance();
      return;
    }
    
    const nextRound = roundNum + 1;
    const willBeWildcard = isWildcardRound(nextRound, meta as any);
    
    if (willBeWildcard && meta.wildcard_intensity) {
      console.log('🎲 Next round will be a wildcard!');
      
      // Show wildcard modal first
      setShowWildcardModal(true);
      
      // After a brief delay, advance the round (which now includes wildcard logic in the hook)
      setTimeout(async () => {
        await endRoundAndAdvance();
        // Modal will close automatically after showing the results
        setTimeout(() => {
          setShowWildcardModal(false);
        }, 3000);
      }, 2000);
    } else {
      // Normal round advancement
      await endRoundAndAdvance();
    }
  };

  // Debug logging
  console.log('Display state:', {
    isViewingHistorical,
    viewingRoundNum,
    currentRoundNum: roundNum,
    historicalCourtsCount: historicalCourts.length,
    currentCourtsCount: courts.length,
    displayCourtsCount: displayCourts.length,
    nextRoundIsWildcard
  });

  // Loading state
  if (initializing) {
    return <EventLoadingSkeleton courtCount={meta?.courts || 2} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <EventHeader 
          meta={meta} 
          roundNum={viewingRoundNum} 
          hasRoundLimit={hasRoundLimit}
          onRoundChange={handleRoundChange}
          totalCompletedRounds={totalCompletedRounds}
          currentRoundNum={roundNum}
          isViewingHistorical={isViewingHistorical}
          isWildcardRound={meta ? isWildcardRound(viewingRoundNum, meta as any) : false}
          nextWildcardRound={meta ? getNextWildcardRound(viewingRoundNum, meta as any) : null}
          useKeypad={useKeypad}
          setUseKeypad={setUseKeypad}
          eventId={eventId}
        />

        {/* Historical Mode Warning */}
        {isViewingHistorical && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <History className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800">Viewing Historical Round</h4>
                <p className="text-sm text-amber-700">
                  You're viewing Round {viewingRoundNum}. Scores can be edited but new rounds cannot be started from here.
                </p>
              </div>
            </div>
          </div>
        )}

       {/* Progress */}
       <EventProgress 
         courts={displayCourts} 
         roundNum={viewingRoundNum} 
         totalRounds={meta?.max_rounds}
         hasRoundLimit={hasRoundLimit}
       />

       {/* Quick Stats */}
       <EventQuickStats
         courts={displayCourts}
         players={players}
         roundNum={viewingRoundNum}
         isTimeMode={shouldShowTimer}
         timeText={timeText}
         hasTimeLimit={hasTimeLimit}
         isWildcardRound={meta ? isWildcardRound(viewingRoundNum, meta as any) : false}
         nextWildcardRound={meta ? getNextWildcardRound(viewingRoundNum, meta as any) : null}
       />

       {/* Controls */}
       <EventControls
         isTimeMode={isTimeMode}
         shouldShowTimer={shouldShowTimer}
         startedAt={startedAt}
         remainingMs={remainingMs}
         timeText={timeText}
         useKeypad={useKeypad}
         setUseKeypad={setUseKeypad}
         startTimer={startTimer}
         eventId={eventId}
       />

      {/* Courts */}
      <div className="grid gap-4 stagger-animate">
        {loadingHistorical ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading historical round data...</p>
          </div>
        ) : displayCourts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {isViewingHistorical 
                ? `No match data found for Round ${viewingRoundNum}` 
                : "No courts available"
              }
            </p>
          </div>
        ) : (
          displayCourts.map((court) => (
          <CourtCard
            key={court.court_num}
            court={court}
            players={players}
            useKeypad={useKeypad && !isViewingHistorical}
            isPointsMode={isPointsMode}
            courtNames={meta?.court_names}
            isHistorical={isViewingHistorical}
            isWildcardRound={meta ? isWildcardRound(viewingRoundNum, meta as any) : false}
            setScore={isViewingHistorical ? () => {} : setScore}
            setPadTarget={isViewingHistorical ? () => {} : setPadTarget}
            setPadOpen={isViewingHistorical ? () => {} : setPadOpen}
          />
          ))
        )}
      </div>

      {/* Action Bar */}
      <EventActionBar
        loadingRound={loadingRound}
        endRoundAndAdvance={isViewingHistorical ? () => {} : handleWildcardRoundAdvance}
        undoLastRound={isViewingHistorical ? () => {} : undoLastRound}
        endEvent={isViewingHistorical ? () => {} : endEvent}
        exportEventJSON={exportEventJSON}
        nextRoundIsWildcard={nextRoundIsWildcard}
        disabled={isViewingHistorical}
      />

      {/* Wildcard Modal */}
      <WildcardModal
        isOpen={showWildcardModal}
        roundNum={roundNum + 1}
        intensity={meta?.wildcard_intensity || 'medium'}
        courtChanges={[]} // Will be populated dynamically or shown as pure announcement
        onComplete={handleWildcardComplete}
      />

        {/* Modern Leaderboards */}
        <div className="mt-8 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-lg">🏆</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Nightly Leaderboard</h3>
                <p className="text-gray-600 text-sm">Current tournament standings</p>
              </div>
            </div>
            {initializing ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              eventId && <Nightly eventId={eventId} players={players} />
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <details className="group">
              <summary className="cursor-pointer select-none px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Season ELO Rankings</h3>
                    <p className="text-gray-600 text-sm">Club-wide player rankings</p>
                  </div>
                  <div className="ml-auto transform transition-transform group-open:rotate-180">
                    <span className="text-gray-400">▼</span>
                  </div>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <Season clubId={localStorage.getItem("clubId") || ""} />
              </div>
            </details>
          </div>
        </div>

      {/* Score keypad dialog */}
      <ScorePad
        open={padOpen}
        onOpenChange={setPadOpen}
        label={(() => {
          const ct = courts.find((c) => c.court_num === padTarget.court);
          if (!ct) return `Court ${padTarget.court}`;
          const team = padTarget.side === "A" ? ct.teamA : ct.teamB;
          const n1 = players[team[0]]?.full_name ?? "—";
          const n2 = players[team[1]]?.full_name ?? "—";
          const courtName = meta?.court_names?.[padTarget.court - 1] || `Court ${padTarget.court}`;
          return `${courtName} — ${n1} & ${n2}`;
        })()}
        initial={padTarget.value}
        total={isPointsMode ? meta?.points_per_game : undefined}
        onSubmit={(val) => {
          if (padTarget.side === "A") setScore(padTarget.court, val, undefined);
          else setScore(padTarget.court, undefined, val);
        }}
      />
      </div>
    </div>
  );
}
