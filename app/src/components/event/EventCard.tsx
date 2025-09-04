// src/components/event/EventCard.tsx
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type Ev = {
  id: string;
  name: string;
  courts: number;
  court_names?: string[];
  round_minutes: number | null;
  points_per_game: number | null;
  max_rounds: number | null;
  event_duration_hours: number | null;
  created_at?: string;
  ended_at?: string | null;
  club_id?: string | null;
  player_count?: number;
  rounds_count?: number;
  last_activity?: string | null;
};

interface EventCardProps {
  e: Ev;
  isActive: boolean;
  prefetchEvent: (eventId: string) => void;
}

export default function EventCard({ e, isActive, prefetchEvent }: EventCardProps) {
  const isPoints = (e.points_per_game || 0) >= 10;
  const req = e.courts * 4;
  const created = e.created_at ? new Date(e.created_at).toLocaleString() : "";
  const lastActivity = e.last_activity ? new Date(e.last_activity).toLocaleString() : null;
  // Removed unused playerPercentage variable (was not referenced in UI)
  
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200"
      onMouseEnter={() => prefetchEvent(e.id)}
      onFocus={() => prefetchEvent(e.id)}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{e.name}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isActive ? 'Active' : 'Completed'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
            <span>{e.courts} court{e.courts > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
            <span>{e.player_count || 0}/{req} players</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
            <span>{e.rounds_count || 0} rounds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
            <span>{isPoints ? `${e.points_per_game} pts` : `${e.round_minutes} min`}</span>
          </div>
        </div>
        
        {lastActivity && isActive && (
          <div className="text-sm text-gray-500 mb-4">
            Last activity: {new Date(lastActivity).toLocaleDateString()}
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          Created {created.split(',')[0]}
        </div>
        
        <div className="flex flex-col gap-3">
          <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white w-full py-3">
            <Link
              to={`/event/${e.id}`}
              state={{
                seed: {
                  id: e.id,
                  name: e.name,
                  courts: e.courts,
                  court_names: e.court_names,
                  points_per_game: e.points_per_game,
                  round_minutes: e.round_minutes,
                  ended_at: e.ended_at,
                },
              }}
              onMouseEnter={() => prefetchEvent(e.id)}
              onFocus={() => prefetchEvent(e.id)}
            >
              Control Room
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full py-3">
            <Link to={`/scoreboard/${e.id}`}>
              Scoreboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{e.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isActive ? 'Active' : 'Completed'}
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>{e.courts} court{e.courts > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>{e.player_count || 0}/{req} players</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>{e.rounds_count || 0} rounds</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span>{isPoints ? `${e.points_per_game} pts` : `${e.round_minutes} min`}</span>
              </div>
            </div>
            
            {lastActivity && isActive && (
              <div className="text-xs text-gray-500 mb-3">
                Last activity: {new Date(lastActivity).toLocaleDateString()}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Created {created.split(',')[0]}
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button asChild variant="outline" size="sm">
              <Link to={`/scoreboard/${e.id}`}>
                Scoreboard
              </Link>
            </Button>
            
            <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link
                to={`/event/${e.id}`}
                state={{
                  seed: {
                    id: e.id,
                    name: e.name,
                    courts: e.courts,
                    court_names: e.court_names,
                    points_per_game: e.points_per_game,
                    round_minutes: e.round_minutes,
                    ended_at: e.ended_at,
                  },
                }}
                onMouseEnter={() => prefetchEvent(e.id)}
                onFocus={() => prefetchEvent(e.id)}
              >
                Control Room
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
