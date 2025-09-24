// src/pages/ScoreboardRefactored.tsx
import { useState } from "react";
import { useScoreboardState } from "@/hooks/useScoreboardState";
import ScoreboardHeader from "@/components/scoreboard/ScoreboardHeader";
import EventSelectionView from "@/components/scoreboard/EventSelectionView";
import ScoreboardRoundNavigation from "@/components/scoreboard/ScoreboardRoundNavigation";
import CourtsGrid from "@/components/scoreboard/CourtsGrid";
import ScoreboardLeaderboard from "@/components/scoreboard/ScoreboardLeaderboard";
import EventWinners from "@/components/event/EventWinners";

export default function ScoreboardRefactored() {
  const {
    eventId,
    meta,
    roundNum,
    courts,
    players,
    loading,
    recentEvents,
    errorMsg,
    leaderboard,
    eventWinners,
    viewingRoundNum,
    isViewingHistorical,
    historicalCourts,
    loadingHistorical,
    allRounds,
    handleRoundChange,
    isEnded,
    playerCount,
    isPointsMode
  } = useScoreboardState();

  // TV Mode state
  const [tvMode, setTvMode] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "players" | "courts">("recent");

  // If no eventId, show event selection view
  if (!eventId) {
    return (
      <EventSelectionView
        recentEvents={recentEvents}
        loading={loading}
        errorMsg={errorMsg}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    );
  }

  // TV Mode Layout
  if (tvMode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-8">
          {/* TV Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-4">{meta?.name}</h1>
            <div className="text-2xl text-gray-300 space-x-8">
              <span>{playerCount} Players</span>
              <span>{meta?.courts} Courts</span>
              {!isEnded && <span>Round {viewingRoundNum}</span>}
              {isEnded && <span className="text-red-400">Tournament Ended</span>}
            </div>
            <button
              onClick={() => setTvMode(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Exit TV Mode
            </button>
          </div>

          {/* TV Courts Grid */}
          <div className="mb-8">
            <CourtsGrid
              courts={courts}
              historicalCourts={historicalCourts}
              players={players}
              isViewingHistorical={isViewingHistorical}
              loading={loading}
              loadingHistorical={loadingHistorical}
              errorMsg={errorMsg}
            />
          </div>

          {/* TV Leaderboard - Condensed */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-3xl font-bold mb-4 text-center">
              {isEnded ? 'Final Rankings' : 'Live Rankings'}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Top Performers</h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="flex items-center gap-2">
                        <span className="font-bold w-8">#{idx + 1}</span>
                        <span>{row.playerName}</span>
                      </span>
                      <span className="font-bold text-yellow-400">{row.totalPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Recent Results</h3>
                <div className="space-y-2">
                  {leaderboard.slice(5, 10).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="flex items-center gap-2">
                        <span className="font-bold w-8">#{idx + 6}</span>
                        <span>{row.playerName}</span>
                      </span>
                      <span className="font-bold text-blue-400">{row.totalPoints} pts</span>
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

  // Normal Mode Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {meta && (
        <ScoreboardHeader
          meta={meta}
          tvMode={tvMode}
          setTvMode={setTvMode}
          playerCount={playerCount}
          roundNum={roundNum}
          isEnded={isEnded}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !meta ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading scoreboard...</p>
          </div>
        ) : (
          <>
            {/* Event Winners - Show at top if tournament ended */}
            {isEnded && eventWinners && (
              <div className="mb-8">
                <EventWinners winners={eventWinners} />
              </div>
            )}

            {/* Round Navigation */}
            {meta && allRounds.length > 1 && (
              <ScoreboardRoundNavigation
                viewingRoundNum={viewingRoundNum}
                roundNum={roundNum}
                allRounds={allRounds}
                isViewingHistorical={isViewingHistorical}
                loadingHistorical={loadingHistorical}
                onRoundChange={handleRoundChange}
              />
            )}

            {/* Courts Display */}
            <div className="mb-8">
              <CourtsGrid
                courts={courts}
                historicalCourts={historicalCourts}
                players={players}
                isViewingHistorical={isViewingHistorical}
                loading={loading}
                loadingHistorical={loadingHistorical}
                errorMsg={errorMsg}
              />
            </div>

            {/* Leaderboard */}
            <ScoreboardLeaderboard
              leaderboard={leaderboard}
              eventWinners={eventWinners}
              isEnded={isEnded}
            />
          </>
        )}
      </div>
    </div>
  );
}