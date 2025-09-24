// src/components/event/RoundNavigation.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface RoundNavigationProps {
  roundNum: number;
  viewingRoundNum: number;
  totalRounds: number;
  isViewingHistorical: boolean;
  onRoundChange: (roundNum: number) => void;
  disabled?: boolean;
}

export default function RoundNavigation({
  roundNum,
  viewingRoundNum,
  totalRounds,
  isViewingHistorical,
  onRoundChange,
  disabled = false
}: RoundNavigationProps) {
  const canGoPrevious = viewingRoundNum > 1;
  const canGoNext = viewingRoundNum < roundNum;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRoundChange(viewingRoundNum - 1)}
        disabled={disabled || !canGoPrevious}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex-1 text-center">
        <div className="text-sm font-medium text-gray-900">
          {isViewingHistorical ? (
            <>
              <span className="text-orange-600">Viewing Round {viewingRoundNum}</span>
              <span className="text-gray-500 text-xs ml-2">(Historical)</span>
            </>
          ) : (
            <span>Current Round {roundNum}</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Round {viewingRoundNum} of {Math.max(roundNum, totalRounds)}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onRoundChange(viewingRoundNum + 1)}
        disabled={disabled || !canGoNext}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>

      {isViewingHistorical && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRoundChange(roundNum)}
          disabled={disabled}
          className="flex items-center gap-1 ml-2"
          title="Return to current round"
        >
          <RotateCcw className="w-4 h-4" />
          Current
        </Button>
      )}
    </div>
  );
}