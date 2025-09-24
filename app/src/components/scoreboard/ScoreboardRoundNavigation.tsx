// src/components/scoreboard/ScoreboardRoundNavigation.tsx
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScoreboardRoundNavigationProps {
  viewingRoundNum: number;
  roundNum: number;
  allRounds: {id: string, round_num: number}[];
  isViewingHistorical: boolean;
  loadingHistorical: boolean;
  onRoundChange: (roundNum: number) => void;
}

export default function ScoreboardRoundNavigation({
  viewingRoundNum,
  roundNum,
  allRounds,
  isViewingHistorical,
  loadingHistorical,
  onRoundChange
}: ScoreboardRoundNavigationProps) {
  const canGoBack = viewingRoundNum > 1;
  const canGoForward = viewingRoundNum < roundNum;
  const availableRounds = allRounds.map(r => r.round_num).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isViewingHistorical && <History className="w-5 h-5 text-amber-600" />}
            {isViewingHistorical ? 'Historical Round' : 'Current Round'} {viewingRoundNum}
          </h2>
          
          {isViewingHistorical && (
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              Historical View
            </div>
          )}
          
          {loadingHistorical && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              Loading...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRoundChange(viewingRoundNum - 1)}
            disabled={!canGoBack}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
            Round {viewingRoundNum} of {Math.max(roundNum, Math.max(...availableRounds, 0))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRoundChange(viewingRoundNum + 1)}
            disabled={!canGoForward}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {isViewingHistorical && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onRoundChange(roundNum)}
              className="ml-2"
            >
              Back to Current
            </Button>
          )}
        </div>
      </div>

      {/* Round Quick Navigation */}
      {availableRounds.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Quick jump:</span>
            <div className="flex gap-1 flex-wrap">
              {availableRounds.map(num => (
                <button
                  key={num}
                  onClick={() => onRoundChange(num)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    num === viewingRoundNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}