// src/components/event/EventActionBar.tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EventActionBarProps {
  loadingRound: boolean;
  endRoundAndAdvance: () => void;
  undoLastRound: () => void;
  endEvent: () => void;
  exportEventJSON: () => void;
  nextRoundIsWildcard?: boolean;
  disabled?: boolean;
}

export default function EventActionBar({
  loadingRound,
  endRoundAndAdvance,
  undoLastRound,
  endEvent,
  exportEventJSON,
  nextRoundIsWildcard = false,
  disabled = false
}: EventActionBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 sticky bottom-4 z-20 animate-slide-in-bottom">
      <div className="flex flex-col gap-3">
        {/* Primary Action - Full width on mobile */}
        <Button
          onClick={endRoundAndAdvance}
          disabled={loadingRound || disabled}
          className={`w-full px-4 sm:px-6 py-3 rounded-xl font-semibold text-base sm:text-lg hover-scale transition-transform-smooth animate-bounce-in ${
            disabled 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {loadingRound ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">Processing</span>
            </>
          ) : disabled ? (
            <>
              <span className="mr-2">🔒</span>
              <span className="hidden sm:inline">Historical Mode</span>
              <span className="sm:hidden">Historical</span>
            </>
          ) : nextRoundIsWildcard ? (
            <>
              <span className="mr-2">🎲</span>
              <span className="hidden sm:inline">End Round & Wildcard!</span>
              <span className="sm:hidden">End & Wildcard!</span>
            </>
          ) : (
            <>
              <span className="mr-2">🚀</span>
              <span className="hidden sm:inline">End Round & Advance</span>
              <span className="sm:hidden">End & Advance</span>
            </>
          )}
        </Button>
        
        {/* Secondary Actions - Grid layout for better mobile spacing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 stagger-animate">
          <Button 
            variant="outline" 
            onClick={undoLastRound} 
            disabled={disabled}
            className={`px-3 py-2 text-sm hover-lift transition-transform-smooth ${
              disabled ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-gray-300"
            }`}
          >
            <span className="mr-1 sm:mr-2">↶</span>
            <span className="hidden sm:inline">Undo</span>
            <span className="sm:hidden">Undo</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={endEvent} 
            disabled={disabled}
            className={`px-3 py-2 text-sm hover-lift transition-transform-smooth ${
              disabled ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-red-300 text-red-600 hover:bg-red-50"
            }`}
          >
            <span className="mr-1 sm:mr-2">🏁</span>
            <span className="hidden sm:inline">End Event</span>
            <span className="sm:hidden">End</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={exportEventJSON} 
            className="px-3 py-2 text-sm border-gray-300 hover-lift transition-transform-smooth col-span-2 sm:col-span-1"
          >
            <span className="mr-1 sm:mr-2">📥</span>
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export JSON</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
