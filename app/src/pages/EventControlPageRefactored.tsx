// src/pages/EventControlPageRefactored.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useEventControl } from "@/hooks/useEventControl";
import PlayerAvatar from "@/components/PlayerAvatar";
import CourtCard from "@/components/CourtCard";
import EventLoadingSkeleton from "@/components/event/EventLoadingSkeleton";
import ScorePad from "@/components/ScorePad";
import LeaderboardTable from "@/components/scoreboard/LeaderboardTable";
import { calculateEventLeaderboard } from "@/lib/leaderboard";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function EventControlPageRefactored() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view');
  const isDisplayMode = view === 'display' || view === 'tv';
  const isTvMode = view === 'tv';
  
  const {
    // State
    meta,
    players,
    roundNum,
    courts,
    history,
    initializing,
    padOpen,
    padTarget,
    startedAt,
    useKeypad,
    timeText,
    remainingMs,
    shouldShowTimer,

    // Actions
    setScore,
    startTimer,
    endRoundAndAdvance,
    endEvent,
    exportEventJSON,
    setUseKeypad,
    setPadOpen,
    setPadTarget,
  } = useEventControl(eventId);

  // Round navigation state
  const [viewingRoundNum, setViewingRoundNum] = useState(roundNum);
  const [isViewingHistorical, setIsViewingHistorical] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Load leaderboard
  useEffect(() => {
    if (!eventId) return;
    
    const loadLeaderboard = async () => {
      try {
        const lb = await calculateEventLeaderboard(eventId);
        setLeaderboard(lb);
      } catch (error) {
        console.warn('Failed to load leaderboard:', error);
      }
    };
    
    loadLeaderboard();
  }, [eventId, courts, roundNum]);

  // Update viewing round when current round changes
  useEffect(() => {
    if (!isViewingHistorical) {
      setViewingRoundNum(roundNum);
    }
  }, [roundNum, isViewingHistorical]);

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

  // Loading state
  if (initializing) {
    return <EventLoadingSkeleton courtCount={meta?.courts || 2} />;
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Event Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {meta.name}
              </h1>
              <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                <span>Round {roundNum}</span>
                {meta.points_per_game ? (
                  <span>{meta.points_per_game} pts mode</span>
                ) : meta.round_minutes ? (
                  <span>{meta.round_minutes} min rounds</span>
                ) : null}
                <span>{Object.keys(players).length} players</span>
                {meta.ended_at ? (
                  <span className="text-red-600 font-medium">Ended</span>
                ) : (
                  <span className="text-green-600 font-medium">Live</span>
                )}
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex flex-wrap gap-2 items-center">
              <button 
                onClick={() => setMode('control')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                  !view ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Control
              </button>
              <button 
                onClick={() => setMode('display')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                  view === 'display' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Display
              </button>
              <button 
                onClick={() => setMode('tv')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                  view === 'tv' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                TV Mode
              </button>
            </div>
          </div>
        </div>

        {/* Timer and Controls */}
        {!isDisplayMode && shouldShowTimer && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Timer</span>
                </div>
                {startedAt && (
                  <div className="text-lg font-mono font-semibold text-gray-900">
                    {timeText}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!startedAt && (
                  <Button onClick={startTimer} size="sm">
                    Start Round
                  </Button>
                )}
                <Button onClick={endRoundAndAdvance} size="sm" variant="outline">
                  End Round
                </Button>
                <Button onClick={endEvent} size="sm" variant="destructive">
                  End Event
                </Button>
                <Button onClick={exportEventJSON} size="sm" variant="ghost">
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Courts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {courts.map((court) => {
            const teamA = court.teamA.map(id => players[id]).filter(Boolean);
            const teamB = court.teamB.map(id => players[id]).filter(Boolean);
            
            const teamALabel = (
              <div className="flex items-center gap-2">
                {teamA.map(player => (
                  <div key={player.id} className="flex items-center gap-1">
                    <PlayerAvatar name={player.full_name} size={24} />
                    <span className="text-sm font-medium">{player.full_name}</span>
                  </div>
                ))}
              </div>
            );
            
            const teamBLabel = (
              <div className="flex items-center gap-2">
                {teamB.map(player => (
                  <div key={player.id} className="flex items-center gap-1">
                    <PlayerAvatar name={player.full_name} size={24} />
                    <span className="text-sm font-medium">{player.full_name}</span>
                  </div>
                ))}
              </div>
            );

            return (
              <CourtCard
                key={court.court_num}
                courtNum={court.court_num}
                teamALabel={teamALabel}
                teamBLabel={teamBLabel}
                scoreA={court.scoreA}
                scoreB={court.scoreB}
              >
                {!isDisplayMode && (
                  <div className="flex justify-end gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setPadTarget({
                          court: court.court_num,
                          side: "A",
                          value: court.scoreA || 0
                        });
                        setPadOpen(true);
                      }}
                    >
                      Score A
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setPadTarget({
                          court: court.court_num,
                          side: "B",
                          value: court.scoreB || 0
                        });
                        setPadOpen(true);
                      }}
                    >
                      Score B
                    </Button>
                  </div>
                )}
              </CourtCard>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {meta.ended_at ? 'Final Rankings' : 'Live Rankings'}
          </h2>
          <LeaderboardTable rows={leaderboard} />
        </div>

        {/* Score Pad Modal */}
        <ScorePad
          open={padOpen}
          onOpenChange={setPadOpen}
          label={padTarget ? 
            `Court ${padTarget.court} - Side ${padTarget.side}` : 
            "Score"
          }
          initial={padTarget?.value || 0}
          total={meta.points_per_game}
          onSubmit={(value) => {
            if (padTarget) {
              if (padTarget.side === "A") {
                setScore(padTarget.court, value, courts.find(c => c.court_num === padTarget.court)?.scoreB);
              } else {
                setScore(padTarget.court, courts.find(c => c.court_num === padTarget.court)?.scoreA, value);
              }
            }
            setPadOpen(false);
          }}
        />
      </div>
    </div>
  );
}