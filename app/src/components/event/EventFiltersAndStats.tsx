// src/components/event/EventFiltersAndStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

type SortBy = "recent" | "name" | "players" | "courts" | "activity";

interface EventStatsProps {
  events: Ev[];
  active: Ev[];
  completed: Ev[];
}

export function EventStats({ events, active, completed }: EventStatsProps) {
  if (events.length === 0) return null;

  const stats = [
    {
      value: events.length,
      label: "Total Events",
      icon: "🏆",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100"
    },
    {
      value: active.length,
      label: "Active",
      icon: "🟢",
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100"
    },
    {
      value: completed.length,
      label: "Completed",
      icon: "✅",
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100"
    },
    {
      value: events.reduce((sum, e) => sum + (e.courts || 0), 0),
      label: "Total Courts",
      icon: "🏟️",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100"
    },
    {
      value: events.reduce((sum, e) => sum + (e.player_count || 0), 0),
      label: "Total Players",
      icon: "👥",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-gray-600 text-xs sm:text-sm font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

interface EventFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: SortBy;
  setSortBy: (value: SortBy) => void;
  showCompleted: boolean;
  setShowCompleted: (value: boolean) => void;
  totalEvents: number;
  filteredEvents: number;
}

export function EventFilters({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showCompleted,
  setShowCompleted,
  totalEvents,
  filteredEvents,
}: EventFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
      <div className="space-y-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>
        
        {/* Controls - Stacked on Mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 sm:flex-none px-3 py-3 sm:py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="players">Most Players</option>
              <option value="courts">Most Courts</option>
              <option value="activity">Last Activity</option>
            </select>
          </div>
          
          <label className="flex items-center gap-3 text-base sm:text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Show completed
          </label>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">
          Showing {filteredEvents} of {totalEvents} events
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>
    </div>
  );
}
