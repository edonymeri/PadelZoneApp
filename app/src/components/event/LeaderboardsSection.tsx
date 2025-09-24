// src/components/event/LeaderboardsSection.tsx
import { Nightly, Season } from "@/pages/NightlySeason";

interface Player {
  id: string;
  full_name: string;
  elo: number;
}

interface LeaderboardsSectionProps {
  eventId: string;
  players: Record<string, Player>;
  clubId: string;
  initializing: boolean;
}

export default function LeaderboardsSection({
  eventId,
  players,
  clubId,
  initializing
}: LeaderboardsSectionProps) {
  return (
    <div className="mt-8 space-y-8">
      {/* Nightly Leaderboard */}
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
          <Nightly eventId={eventId} players={players} />
        )}
      </div>

      {/* Season ELO Rankings */}
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
            <Season clubId={clubId} />
          </div>
        </details>
      </div>
    </div>
  );
}