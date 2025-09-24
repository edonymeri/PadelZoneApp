// src/components/scoreboard/ScoreboardHeader.tsx
import { Monitor, MonitorX, Trophy, Users, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type EvMeta = {
  id: string;
  name: string;
  courts: number;
  round_minutes: number | null;
  points_per_game: number | null;
  ended_at?: string | null;
  created_at?: string | null;
  club_id?: string | null;
  player_count?: number;
  rounds_count?: number;
  last_activity?: string | null;
};

interface ScoreboardHeaderProps {
  meta: EvMeta;
  tvMode: boolean;
  setTvMode: (mode: boolean) => void;
  playerCount: number;
  roundNum: number;
  isEnded: boolean;
}

export default function ScoreboardHeader({
  meta,
  tvMode,
  setTvMode,
  playerCount,
  roundNum,
  isEnded
}: ScoreboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meta.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {playerCount} players
              </span>
              <span>{meta.courts} courts</span>
              {!isEnded && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Round {roundNum}
                </span>
              )}
              {isEnded && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  Tournament Ended
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - TV Mode Toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant={tvMode ? "default" : "outline"}
            size="sm"
            onClick={() => setTvMode(!tvMode)}
            className="flex items-center gap-2"
          >
            {tvMode ? (
              <>
                <MonitorX className="w-4 h-4" />
                Exit TV Mode
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                TV Mode
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}