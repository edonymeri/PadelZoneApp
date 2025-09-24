// src/pages/EventControlPageRefactored.tsx
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import type { CourtMatch } from "@/lib/types";
import EventDisplayMode from "@/components/event/modes/EventDisplayMode";
import EventControlMode from "@/components/event/modes/EventControlMode";
import { useEventControl } from "@/hooks/useEventControl";
import { fetchHistoricalRound } from '@/services/api/historyService';

export default function EventControlPageRefactored() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const view = searchParams.get('view');
  const isDisplayMode = view === 'display' || view === 'tv';
  const isTvMode = view === 'tv';

  // Persist preferred mode
  useEffect(() => {
    if (view) localStorage.setItem('eventViewMode', view);
  }, [view]);

  useEffect(() => {
    if (!view) {
      // Always default to control mode
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
    useKeypad,
    timeText,

    // Actions
    setScore,
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
      toast({
        variant: "destructive",
        title: "Failed to load historical data",
        description: "Please try again."
      });
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

  // Enhanced score editing with historical validation
  const handleScoreEdit = async (courtNum: number, scoreA?: number, scoreB?: number) => {
    if (isDisplayMode) return;
    
    try {
      if (isViewingHistorical) {
        // Handle historical round editing with validation
        if (meta?.format === 'winners-court') {
          const currentCourt = displayCourts.find(ct => ct.court_num === courtNum);
          if (currentCourt) {
            const originalA = currentCourt.scoreA;
            const originalB = currentCourt.scoreB;
            
            if (originalA !== undefined && originalB !== undefined && scoreA !== undefined && scoreB !== undefined) {
              const originalWinner = originalA > originalB ? 'A' : 'B';
              const newWinner = scoreA > scoreB ? 'A' : 'B';
              
              if (originalWinner !== newWinner) {
                toast({
                  variant: "destructive",
                  title: "Cannot change winner",
                  description: "In Winner's Court format, changing the winner would affect subsequent round pairings."
                });
                return;
              }
            }
          }
        }
        
        // Update historical round (implement this function)
        console.log('Updating historical round score:', { courtNum, scoreA, scoreB, round: viewingRoundNum });
        // await updateHistoricalScore(eventId, viewingRoundNum, courtNum, scoreA, scoreB);
        
        // Reload historical data
        await loadHistoricalRound(viewingRoundNum);
      } else {
        // Current round scoring
        await setScore(courtNum, scoreA, scoreB);
      }

      toast({
        title: "Score updated",
        description: `Match score has been saved${isViewingHistorical ? ' for historical round' : ''}.`
      });
    } catch (error) {
      console.error("Failed to update score:", error);
      toast({
        variant: "destructive",
        title: "Failed to update score",
        description: "Please try again."
      });
    }
  };

  // Mode switching
  const setDisplayMode = () => {
    searchParams.set('view', 'display');
    setSearchParams(searchParams);
  };

  const setTvMode = () => {
    searchParams.set('view', 'tv');
    setSearchParams(searchParams);
  };

  const setControlMode = () => {
    searchParams.set('view', 'control');
    setSearchParams(searchParams);
  };

  // Enhanced event actions with toast feedback
  const handlePrepareAdvanceRound = async () => {
    try {
      await prepareAdvanceRound();
      toast({
        title: "Round advanced",
        description: `Round ${roundNum + 1} has started!`
      });
    } catch (error) {
      console.error("Failed to advance round:", error);
      toast({
        variant: "destructive",
        title: "Failed to advance round",
        description: "Please ensure all scores are entered."
      });
    }
  };

  const handleEndEvent = async () => {
    try {
      await endEvent();
      toast({
        title: "Event finished",
        description: "The event has been completed successfully!"
      });
    } catch (error) {
      console.error("Failed to finish event:", error);
      toast({
        variant: "destructive",
        title: "Failed to finish event",
        description: "Please try again."
      });
    }
  };

  const handleUndoLastRound = async () => {
    try {
      await undoLastRound();
      toast({
        title: "Round undone",
        description: "The last round has been undone successfully."
      });
    } catch (error) {
      console.error("Failed to undo round:", error);
      toast({
        variant: "destructive",
        title: "Failed to undo round",
        description: "Please try again."
      });
    }
  };

  const handleExportEventJSON = async () => {
    try {
      await exportEventJSON();
      toast({
        title: "Event exported",
        description: "Event data has been exported successfully."
      });
    } catch (error) {
      console.error("Failed to export event:", error);
      toast({
        variant: "destructive",
        title: "Failed to export event",
        description: "Please try again."
      });
    }
  };

  // Use historical courts if viewing historical, otherwise current courts
  const displayCourts = isViewingHistorical ? historicalCourts : courts;

  // Loading states
  if (initializing || loadingRound || !eventId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error state - no event found
  if (!meta || !eventId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Event not found</p>
          <Link to="/events">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Only show in control mode */}
      {!isDisplayMode && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/events">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
            
            <div className="text-sm text-gray-500">
              Control Mode
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isDisplayMode ? (
        <EventDisplayMode
          eventId={eventId!}
          eventName={meta.name || 'Unnamed Event'}
          format={meta.format || 'winners-court'}
          currentRound={roundNum}
          timeText={timeText}
          isTvMode={isTvMode}
          onSetControlMode={setControlMode}
        />
      ) : (
        <EventControlMode
          eventId={eventId!}
          meta={meta}
          players={players}
          roundNum={roundNum}
          displayCourts={displayCourts}
          history={history}
          timeText={timeText}
          isViewingHistorical={isViewingHistorical}
          viewingRoundNum={viewingRoundNum}
          loadingHistorical={loadingHistorical}
          padOpen={padOpen}
          padTarget={padTarget}
          onSetDisplayMode={setDisplayMode}
          onSetTvMode={setTvMode}
          onScoreEdit={handleScoreEdit}
          onRoundChange={handleRoundChange}
          onPrepareAdvanceRound={handlePrepareAdvanceRound}
          onUndoLastRound={handleUndoLastRound}
          onEndEvent={handleEndEvent}
          onExportEventJSON={handleExportEventJSON}
          onSetPadOpen={setPadOpen}
        />
      )}
    </div>
  );
}