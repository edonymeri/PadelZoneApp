// src/components/event/EventActionBar.tsx

import { Button } from "@/components/ui/button";

interface EventActionBarProps {
  loadingRound: boolean;
  endRoundAndAdvance: () => void;
  undoLastRound: () => void;
  endEvent: () => void;
  exportEventJSON: () => void;
  nextRoundIsWildcard?: boolean;
  disabled?: boolean;
  isAmericanoComplete?: boolean;
}

export default function EventActionBar({
  loadingRound,
  endRoundAndAdvance,
  undoLastRound,
  endEvent,
  exportEventJSON,
  nextRoundIsWildcard = false,
  disabled = false,
  isAmericanoComplete = false
}: EventActionBarProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 z-20 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Primary Action */}
        <Button
          onClick={endRoundAndAdvance}
          disabled={loadingRound || disabled}
          size="sm"
          className={`px-4 py-2 text-sm font-medium ${
            disabled 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : isAmericanoComplete
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loadingRound ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : disabled ? (
            <>
              <span className="mr-2">🔒</span>
              Historical Mode
            </>
          ) : isAmericanoComplete ? (
            <>
              <span className="mr-2">🏆</span>
              Tournament Complete
            </>
          ) : nextRoundIsWildcard ? (
            <>
              <span className="mr-2">🎲</span>
              End Round & Wildcard
            </>
          ) : (
            <>
              <span className="mr-2">🚀</span>
              End Round & Advance
            </>
          )}
        </Button>
        
        {/* Secondary Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={undoLastRound} 
            disabled={disabled}
            className={`px-3 py-2 text-sm ${
              disabled ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700"
            }`}
          >
            <span className="mr-1">↶</span>
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={endEvent} 
            disabled={disabled}
            className={`px-3 py-2 text-sm ${
              disabled ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-red-300 text-red-600 hover:bg-red-50"
            }`}
          >
            <span className="mr-1">🏁</span>
            End Event
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportEventJSON} 
            className="px-3 py-2 text-sm border-gray-300 text-gray-700"
          >
            <span className="mr-1">📥</span>
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
