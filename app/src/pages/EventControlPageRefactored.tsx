// src/pages/EventControlPageRefactored.tsx
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Historical data is now loaded via a dedicated service
import type { CourtMatch } from "@/lib/types";
import ScorePad from "@/components/ScorePad";
import EventHeader from "@/components/event/EventHeader";
import EventControls from "@/components/event/EventControls";
import CourtCard from "@/components/event/CourtCard";
import EventActionBar from "@/components/event/EventActionBar";
import EventProgress from "@/components/event/EventProgress";
import EventQuickStats from "@/components/event/EventQuickStats";
import EventLoadingSkeleton from "@/components/event/EventLoadingSkeleton";
import { supabase } from "@/lib/supabase";
import WildcardModal from "@/components/event/WildcardModal";
import { useEventControl } from "@/hooks/useEventControl";
import { fetchHistoricalRound } from '@/services/api/historyService';
import { isWildcardRound, getNextWildcardRound } from "@/utils/wildcardUtils";
import { diffRounds } from "@/utils/wildcardDiff";

import { Nightly, Season } from "./NightlySeason";
import { calculateEventLeaderboard } from "@/lib/leaderboard";
import LeaderboardTable from "@/components/scoreboard/LeaderboardTable";

export default function EventControlPageRefactored() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view');
  const isDisplayMode = view === 'display' || view === 'tv';
  const isTvMode = view === 'tv';
  // Persist preferred mode
  useEffect(() => {
    if (view) localStorage.setItem('eventViewMode', view);
  }, [view]);
  useEffect(() => {
    if (!view) {
      // Always default to control mode - don't use saved preference for now
      searchParams.set('view', 'control');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const {
    // State
  meta,
  players,
  roundNum,
  courts,
  history,
  initializing,
  loadingRound,
  padOpen,
  padTarget,
  startedAt,
  useKeypad,
  isPointsMode,
  shouldShowTimer,
  hasRoundLimit,
  hasTimeLimit,
  timeText,
  remainingMs,

    // Actions
    setScore,
    startTimer,
  endRoundAndAdvance, // deprecated inside hook but kept for fallback
  prepareAdvanceRound,
  commitPendingRound,
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
      const courtsData = await fetchHistoricalRound(eventId, roundNumber);
      setHistoricalCourts(courtsData);
    } catch (e) {
      console.error('Error loading historical round:', e);
      setHistoricalCourts([]);
    } finally {
      setLoadingHistorical(false);
    }
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

  // Create a wrapper for setScore that includes historical editing validation
  const handleScoreEdit = async (courtNum: number, scoreA?: number, scoreB?: number) => {
    if (isDisplayMode) return;
    
    if (isViewingHistorical) {
      // Handle historical round editing
      if (meta?.format === 'winners-court') {
        // For historical Winner's Court rounds, validate that winner doesn't change
        const currentCourt = displayCourts.find(ct => ct.court_num === courtNum);
        if (currentCourt) {
          const originalA = currentCourt.scoreA;
          const originalB = currentCourt.scoreB;
          
          if (originalA !== undefined && originalB !== undefined && scoreA !== undefined && scoreB !== undefined) {
            const originalWinner = originalA > originalB ? 'A' : 'B';
            const newWinner = scoreA > scoreB ? 'A' : 'B';
            
            if (originalWinner !== newWinner) {
              alert("Cannot change winner in Winner's Court format - this would affect subsequent round pairings. You can only adjust the winning team's score.");
              return;
            }
          }
        }
      }
      
      // Update historical round in database
      try {
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .select('id')
          .eq('event_id', eventId)
          .eq('round_num', viewingRoundNum)
          .single();

        if (roundError || !roundData) {
          console.error('Failed to find historical round:', roundError);
          return;
        }

        const updates: any = {};
        if (scoreA !== undefined) updates.score_a = scoreA;
        if (scoreB !== undefined) updates.score_b = scoreB;

        const { error } = await supabase
          .from('matches')
          .update(updates)
          .eq('round_id', roundData.id)
          .eq('court_num', courtNum);

        if (error) {
          console.error('Failed to update historical score:', error);
          alert('Failed to update score');
          return;
        }

        // Update local state
        setHistoricalCourts(prev => prev.map(ct => {
          if (ct.court_num !== courtNum) return ct;
          const updated = { ...ct };
          if (scoreA !== undefined) updated.scoreA = scoreA;
          if (scoreB !== undefined) updated.scoreB = scoreB;
          return updated;
        }));
        
      } catch (error) {
        console.error('Error updating historical score:', error);
        alert('Failed to update score');
      }
    } else {
      // For current round, use regular setScore
      setScore(courtNum, scoreA, scoreB);
    }
  };

  // Check if tournament is complete for display
  const isAmericanoComplete = useMemo(() => {
    if (meta?.format !== 'americano' || meta?.variant !== 'individual' || !players || !history) {
      return false;
    }
    
    const allPlayers = Object.keys(players);
    if (allPlayers.length === 0) return false;
    
    // Quick calculation: for N players, need N-1 rounds to complete
    const expectedRounds = allPlayers.length - 1;
    return history.length >= expectedRounds;
  }, [meta?.format, meta?.variant, players, history]);

  // Calculate total completed rounds (can navigate to all rounds from 1 to current)
  const totalCompletedRounds = roundNum;

  // Wildcard state
  const [showWildcardModal, setShowWildcardModal] = useState(false);
  const [wildcardChanges, setWildcardChanges] = useState<Array<{
    courtNum: number;
    from: string[];
    to: string[];
  }>>([]);

  // Enriched leaderboard for display / tv modes
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const [prevPoints, setPrevPoints] = useState<Record<string, number>>({});
  const [tvPage, setTvPage] = useState<'courts' | 'leaderboard'>('courts');
  
  // Manual leaderboard refresh function
  const refreshLeaderboard = async () => {
    if (!eventId || !isDisplayMode) return;
    
    try {
      const leaderboardData = await calculateEventLeaderboard(eventId);
      
      // Map previous ranks for movement detection
      const newPrev: Record<string, number> = {};
      const newPrevPoints: Record<string, number> = {};
      leaderboardData.forEach((row, idx) => { 
        newPrev[row.player_id] = idx + 1; 
        newPrevPoints[row.player_id] = row.total_score;
      });
      
      setLeaderboard(leaderboardData.map((r, idx) => ({ 
        ...r, 
        prev_rank: prevRanks[r.player_id],
        rank_change: prevRanks[r.player_id] ? prevRanks[r.player_id] - (idx + 1) : 0,
        points_change: prevPoints[r.player_id] ? r.total_score - prevPoints[r.player_id] : 0
      })));
      setPrevRanks(newPrev);
      setPrevPoints(newPrevPoints);
    } catch (e) {
      console.error('Failed to refresh leaderboard:', e);
      setLeaderboard([]);
    }
  };
  
  useEffect(() => {
    if (!eventId || !isDisplayMode) return;
    // Only load leaderboard on initial mount for display modes
    refreshLeaderboard();
  }, [eventId, isDisplayMode]);

  // TV auto rotate sections every 12s
  useEffect(() => {
    if (!isTvMode) return;
    const id = setInterval(() => {
      setTvPage(p => p === 'courts' ? 'leaderboard' : 'courts');
    }, 12000);
    return () => clearInterval(id);
  }, [isTvMode]);

  // Use historical courts if viewing historical, otherwise current courts
  const displayCourts = isViewingHistorical ? historicalCourts : courts;
  
  // Wrap round completion actions to refresh leaderboard
  const handleEndRoundAndAdvance = async () => {
    await endRoundAndAdvance();
    // Refresh leaderboard after round completion
    if (isDisplayMode) {
      await refreshLeaderboard();
    }
  };

  const handlePrepareAdvanceRound = async () => {
    const result = await prepareAdvanceRound();
    // Refresh leaderboard after round preparation/completion
    if (isDisplayMode) {
      await refreshLeaderboard();
    }
    return result;
  };

  const handleCommitPendingRound = async () => {
    await commitPendingRound();
    // Refresh leaderboard after committing pending round
    if (isDisplayMode) {
      await refreshLeaderboard();
    }
  };
  
  // Check if next round will be a wildcard (only for Winner's Court format)
  const nextRoundIsWildcard = useMemo(() => {
    return meta && meta.format === 'winners-court' ? isWildcardRound(roundNum + 1, meta as any) : false;
  }, [meta, roundNum]);
  
  // Generate wildcard changes
  // const generateWildcardChanges = (beforeCourts: CourtMatch[], afterCourts: CourtMatch[]) => { /* future implementation */ };

  // Handle wildcard modal completion
  const handleWildcardComplete = () => {
    setShowWildcardModal(false);
    setWildcardChanges([]);
  };

  // Wildcard-aware round advancement - show preview before advancing
  const handleWildcardRoundAdvance = async () => {
    if (isViewingHistorical) return;
    if (!meta) { 
      await handleEndRoundAndAdvance(); 
      return; 
    }

    // Prepare next round (deferred for wildcard)
    const result = await handlePrepareAdvanceRound();
    if (result?.deferred && result.next) {
      // Build diff changes for modal
      const diffs = result.next!.courts.map((newCourt) => {
        const prevCourt = courts.find(c => c.court_num === newCourt.court_num);
        const fmt = (team: any) => team.map((pid: any) => players[pid]?.full_name || '—');
        return {
          courtNum: newCourt.court_num,
          from: prevCourt ? [...fmt(prevCourt.teamA), ...fmt(prevCourt.teamB)] : [],
          to: [...fmt(newCourt.teamA), ...fmt(newCourt.teamB)]
        };
      });
      diffRounds(courts, result.next!.courts); // computed for future scoreboard highlights
      setWildcardChanges(diffs);
      setShowWildcardModal(true);
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

  // Toggle helpers
  const setMode = (mode: 'control' | 'display' | 'tv') => {
    if (mode === 'control') {
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.set('view', mode);
      setSearchParams(searchParams, { replace: true });
    }
  };

  // TV Mode uses same layout as display mode, just larger text
  // TV mode gets split-screen layout: 66% courts, 33% leaderboard
  if (isTvMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
          {/* Unified Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate flex items-center gap-2">
                {meta?.name || 'Event'}
                {meta && isWildcardRound(roundNum, meta as any) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold">🎲 Wildcard</span>
                )}
              </h1>
              <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
                <span>Round {roundNum}</span>
                {meta?.points_per_game ? (<span>{meta.points_per_game} pts mode</span>) : meta?.round_minutes ? (<span>{meta.round_minutes} min rounds</span>) : null}
                <span>{Object.keys(players).length} players</span>
                {meta?.ended_at ? <span className="text-red-600 font-medium">Ended</span> : <span className="text-green-600 font-medium">Live</span>}
              </div>
              {!isWildcardRound(roundNum, meta as any) && meta && (
                (() => { const nxt = getNextWildcardRound(roundNum, meta as any); if (!nxt) return null; return (
                  <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 inline-flex items-center gap-1 px-2 py-1 rounded-md mt-1">🎲 Next Wildcard Round {nxt}</div>
                ); })()
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => setMode('control')} className="px-3 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50">Control</button>
              <button onClick={() => setMode('display')} className="px-3 py-1.5 rounded-md text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50">Display</button>
              <button onClick={() => setMode('tv')} className="px-3 py-1.5 rounded-md text-sm font-medium border bg-blue-600 text-white border-blue-600">TV</button>
            </div>
          </div>

          {/* TV Split Layout: 60% Courts + 40% Leaderboard */}
          <div className="flex gap-6">
            {/* Left: Courts (60%) */}
            <div className="flex-[3]">
              {loadingHistorical ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading historical round data...</p>
                </div>
              ) : (
                <div className="grid gap-6 h-full" style={{
                  gridTemplateColumns: displayCourts.length === 1 ? '1fr' :
                                      displayCourts.length === 2 ? 'repeat(2, 1fr)' :
                                      displayCourts.length === 3 ? 'repeat(2, 1fr)' :
                                      displayCourts.length === 4 ? 'repeat(2, 1fr)' :
                                      displayCourts.length <= 6 ? 'repeat(3, 1fr)' :
                                      'repeat(3, 1fr)',
                  gridTemplateRows: displayCourts.length <= 2 ? '1fr' :
                                   displayCourts.length <= 4 ? 'repeat(2, 1fr)' :
                                   displayCourts.length <= 6 ? 'repeat(2, 1fr)' :
                                   'repeat(3, 1fr)',
                  minHeight: '70vh'
                }}>
                  {displayCourts.map((court) => (
                    <div key={court.court_num} className="transition-all">
                      <CourtCard
                        court={court}
                        players={players}
                        useKeypad={false}
                        isPointsMode={isPointsMode}
                        courtNames={meta?.court_names}
                        isHistorical={isViewingHistorical}
                        isWildcardRound={meta ? isWildcardRound(viewingRoundNum, meta as any) : false}
                        displayMode={true}
                        tvMode={true}
                        format={meta?.format}
                        setScore={() => {}}
                        setPadTarget={() => {}}
                        setPadOpen={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Leaderboard (40%) */}
            <div className="flex-[2] bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">🏆 Live Rankings</h3>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.player_id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        index < 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Rank */}
                        <div className={`text-lg font-bold w-8 text-center ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-800'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Rank change */}
                        {player.prev_rank && player.rank_change !== undefined && player.rank_change !== 0 && (
                          <div className={`text-sm font-bold ${
                            player.rank_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {player.rank_change > 0 ? '▲' : '▼'}
                          </div>
                        )}

                        {/* Player name */}
                        <div className="text-sm font-medium text-gray-900 truncate flex-1">
                          {player.full_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right ml-2">
                        {/* W-L Record */}
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {player.games_won}-{player.games_lost}
                          </div>
                          <div className="text-xs text-gray-500">W-L</div>
                        </div>
                        
                        {/* Goal Difference */}
                        <div className="text-center">
                          <div className={`text-sm font-semibold ${
                            player.goal_difference > 0 ? 'text-green-600' :
                            player.goal_difference < 0 ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {player.goal_difference > 0 ? '+' : ''}{player.goal_difference}
                          </div>
                          <div className="text-xs text-gray-500">+/-</div>
                        </div>

                        {/* Total Points */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(player.total_score * 10) / 10}
                          </div>
                          <div className="text-xs text-gray-500">Pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Unified Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate flex items-center gap-2">
              {meta?.name || 'Event'}
              {meta && isWildcardRound(roundNum, meta as any) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold">🎲 Wildcard</span>
              )}
            </h1>
            <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
              <span>Round {roundNum}</span>
              {meta?.points_per_game ? (<span>{meta.points_per_game} pts mode</span>) : meta?.round_minutes ? (<span>{meta.round_minutes} min rounds</span>) : null}
              <span>{Object.keys(players).length} players</span>
              {meta?.ended_at ? <span className="text-red-600 font-medium">Ended</span> : <span className="text-green-600 font-medium">Live</span>}
            </div>
            {!isWildcardRound(roundNum, meta as any) && meta && (
              (() => { const nxt = getNextWildcardRound(roundNum, meta as any); if (!nxt) return null; return (
                <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 inline-flex items-center gap-1 px-2 py-1 rounded-md mt-1">🎲 Next Wildcard Round {nxt}</div>
              ); })()
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => setMode('control')} className={`px-3 py-1.5 rounded-md text-sm font-medium border ${!isDisplayMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Control</button>
              <button onClick={() => setMode('display')} className={`px-3 py-1.5 rounded-md text-sm font-medium border ${view==='display' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Display</button>
              <button onClick={() => setMode('tv')} className={`px-3 py-1.5 rounded-md text-sm font-medium border ${view==='tv' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>TV</button>
            </div>
            {!isDisplayMode && (
              <div className="flex justify-start">
                <button 
                  onClick={() => setUseKeypad(!useKeypad)} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    useKeypad 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{useKeypad ? '📱' : '⌨️'}</span>
                  {useKeypad ? 'Keypad Mode' : 'Desktop Input'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historical Mode Warning */}
        {isViewingHistorical && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-amber-600" />
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

        {/* Round Navigation Controls */}
        {!isDisplayMode && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Round Navigation</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prevRound = Math.max(1, viewingRoundNum - 1);
                    if (prevRound !== viewingRoundNum) {
                      handleRoundChange(prevRound);
                    }
                  }}
                  disabled={viewingRoundNum <= 1}
                  className="px-3 py-1 text-xs"
                >
                  ← Previous
                </Button>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded font-medium text-sm">
                  Round {viewingRoundNum}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const maxRound = Math.max(roundNum, (history || []).length);
                    const nextRound = Math.min(maxRound, viewingRoundNum + 1);
                    if (nextRound !== viewingRoundNum) {
                      handleRoundChange(nextRound);
                    }
                  }}
                  disabled={viewingRoundNum >= Math.max(roundNum, (history || []).length)}
                  className="px-3 py-1 text-xs"
                >
                  Next →
                </Button>
                {viewingRoundNum !== roundNum && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoundChange(roundNum)}
                    className="px-3 py-1 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    Current Round
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

       {!isDisplayMode && (
         <EventProgress 
           courts={displayCourts} 
           roundNum={viewingRoundNum} 
           totalRounds={meta?.max_rounds}
           hasRoundLimit={hasRoundLimit}
           format={meta?.format}
           variant={meta?.variant}
           players={players}
           history={history}
         />
       )}

       {/* Quick Stats */}
       {!isDisplayMode && (
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
       )}

       {/* Controls */}
       {!isDisplayMode && (
         <EventControls
           shouldShowTimer={shouldShowTimer}
           startedAt={startedAt}
           remainingMs={remainingMs}
           timeText={timeText}
           useKeypad={useKeypad}
           setUseKeypad={setUseKeypad}
           startTimer={startTimer}
           eventId={eventId}
         />
       )}

      {/* Courts */}
      <div className={isDisplayMode ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "grid gap-4 stagger-animate"}>
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
            <div key={court.court_num} className={isDisplayMode ? "transition-all" : undefined}>
              <CourtCard
                court={court}
                players={players}
                useKeypad={!isDisplayMode && useKeypad && !isViewingHistorical}
                isPointsMode={isPointsMode}
                courtNames={meta?.court_names}
                isHistorical={isViewingHistorical}
                isWildcardRound={meta ? isWildcardRound(viewingRoundNum, meta as any) : false}
                displayMode={isDisplayMode}
                tvMode={isTvMode}
                format={meta?.format}
                setScore={isDisplayMode ? () => {} : handleScoreEdit}
                setPadTarget={isDisplayMode || isViewingHistorical ? () => {} : setPadTarget}
                setPadOpen={isDisplayMode || isViewingHistorical ? () => {} : setPadOpen}
              />
            </div>
          ))
        )}
      </div>

      {/* Action Bar or Display Leaderboard (non-TV) */}
      {(!isDisplayMode && !isTvMode) ? (
        <EventActionBar
          loadingRound={loadingRound}
          endRoundAndAdvance={isViewingHistorical ? () => {} : handleWildcardRoundAdvance}
          undoLastRound={isViewingHistorical ? () => {} : undoLastRound}
          endEvent={isViewingHistorical ? () => {} : endEvent}
          exportEventJSON={exportEventJSON}
          nextRoundIsWildcard={nextRoundIsWildcard}
          disabled={isViewingHistorical}
          isAmericanoComplete={isAmericanoComplete}
        />
      ) : (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">🏆 Live Leaderboard <span className="text-xs text-gray-400 font-normal">(Top 8)</span></h3>
          <LeaderboardTable 
            rows={leaderboard.slice(0,8) as any} 
            largeScale={isTvMode}
          />
        </div>
      )}

      {/* Wildcard Modal */}
      {!isDisplayMode && !isTvMode && (
        <WildcardModal
          isOpen={showWildcardModal}
          roundNum={roundNum + 1}
          intensity={meta?.wildcard_intensity || 'medium'}
          courtChanges={wildcardChanges}
          onComplete={() => {
            handleCommitPendingRound();
            handleWildcardComplete();
          }}
        />
      )}

      {/* Modern Leaderboards */}
      {!isDisplayMode && (
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
  )}

  {/* Score keypad dialog */}
  {(!isDisplayMode && !isTvMode) && (
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
            if (padTarget.side === "A") handleScoreEdit(padTarget.court, val, undefined);
            else handleScoreEdit(padTarget.court, undefined, val);
          }}
        />
      )}
      </div>
    </div>
  );
}
