// src/components/event/EventControls.tsx
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { UUID } from "@/lib/types";

interface EventControlsProps {
  isTimeMode: boolean;
  shouldShowTimer: boolean;
  startedAt: string | null;
  remainingMs: number;
  timeText: string;
  useKeypad: boolean;
  setUseKeypad: (value: boolean) => void;
  startTimer: () => void;
  eventId?: string;
}

export default function EventControls({
  isTimeMode,
  shouldShowTimer,
  startedAt,
  remainingMs,
  timeText,
  useKeypad,
  setUseKeypad,
  startTimer,
  eventId
}: EventControlsProps) {
  // Only show this component if there are timer controls to display
  if (!shouldShowTimer) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Round Timer</h3>
            <p className="text-sm text-gray-600">Control match timing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <Button 
            onClick={startTimer}
            style={{ backgroundColor: '#0172fb' }}
            className="hover:opacity-90 text-white px-6 py-2 rounded-xl font-semibold transition-opacity"
          >
            ⏱️ Start Timer
          </Button>
          <div className={`px-4 py-3 rounded-xl border-2 font-mono text-sm font-bold ${
            remainingMs === 0 
              ? "border-red-200 bg-red-50 text-red-700" 
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}>
            {timeText}
          </div>
        </div>
      </div>
    </div>
  );
}
