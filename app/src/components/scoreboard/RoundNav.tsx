// src/components/scoreboard/RoundNav.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

type Round = { id: string; round_num: number };

export interface RoundNavProps {
  viewingRoundNum: number;
  currentRoundNum: number;
  loadingHistorical: boolean;
  isViewingHistorical: boolean;
  matchCount: number;
  allRounds: Round[];
  onChange: (newRoundNum: number) => void;
  showBackToCurrent?: boolean;
  variant?: "tv" | "normal";
}

export default function RoundNav({
  viewingRoundNum,
  currentRoundNum,
  loadingHistorical,
  isViewingHistorical,
  matchCount,
  allRounds,
  onChange,
  showBackToCurrent = false,
  variant = "normal",
}: RoundNavProps) {
  if (variant === "tv") {
    return (
      <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={() => onChange(Math.max(1, viewingRoundNum - 1))}
            disabled={viewingRoundNum <= 1 || loadingHistorical}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-6xl font-bold">Round {viewingRoundNum}</h1>
            {isViewingHistorical && (
              <span className="text-xl opacity-75">(Historical)</span>
            )}
          </div>

          <button
            onClick={() => onChange(Math.min(currentRoundNum, viewingRoundNum + 1))}
            disabled={viewingRoundNum >= currentRoundNum || loadingHistorical}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        <p className="text-2xl opacity-90">
          {matchCount > 0 ? `${matchCount} matches` : "No matches yet"}
        </p>

        {allRounds.length > 1 && (
          <div className="flex justify-center mt-4">
            <select
              value={viewingRoundNum}
              onChange={(e) => onChange(Number(e.target.value))}
              className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white font-semibold"
              disabled={loadingHistorical}
            >
              {allRounds.map((round) => (
                <option key={round.id} value={round.round_num} className="text-black">
                  Round {round.round_num}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // normal variant
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => onChange(Math.max(1, viewingRoundNum - 1))}
          disabled={viewingRoundNum <= 1 || loadingHistorical}
          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-bold text-gray-900">Round {viewingRoundNum}</h2>
          {isViewingHistorical && (
            <span className="text-sm text-gray-500">(Historical)</span>
          )}
        </div>

        <button
          onClick={() => onChange(Math.min(currentRoundNum, viewingRoundNum + 1))}
          disabled={viewingRoundNum >= currentRoundNum || loadingHistorical}
          className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="text-gray-600 mb-3">
        {matchCount > 0 ? `${matchCount} matches in progress` : "No matches yet"}
      </p>

      {allRounds.length > 1 && (
        <div className="flex justify-center">
          <select
            value={viewingRoundNum}
            onChange={(e) => onChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
            disabled={loadingHistorical}
          >
            {allRounds.map((round) => (
              <option key={round.id} value={round.round_num}>
                Round {round.round_num}
              </option>
            ))}
          </select>
        </div>
      )}

      {showBackToCurrent && isViewingHistorical && (
        <div className="mt-3">
          <button
            onClick={() => onChange(currentRoundNum)}
            className="px-3 py-2 text-xs border border-green-300 text-green-600 rounded-lg hover:bg-green-50"
          >
            Back to Current
          </button>
        </div>
      )}
    </div>
  );
}


