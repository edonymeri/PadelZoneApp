// src/components/scoreboard/EventSelectionView.tsx
import { Monitor, Trophy, Users, Target, Clock, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

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

interface EventSelectionViewProps {
  recentEvents: EvMeta[];
  loading: boolean;
  errorMsg: string | null;
  sortBy: "recent" | "name" | "players" | "courts";
  setSortBy: (sort: "recent" | "name" | "players" | "courts") => void;
}

export default function EventSelectionView({
  recentEvents,
  loading,
  errorMsg,
  sortBy,
  setSortBy
}: EventSelectionViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = recentEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortEvents = (events: EvMeta[]) => {
    switch (sortBy) {
      case "name":
        return events.sort((a, b) => a.name.localeCompare(b.name));
      case "players":
        return events.sort((a, b) => (b.player_count || 0) - (a.player_count || 0));
      case "courts":
        return events.sort((a, b) => (b.courts || 0) - (a.courts || 0));
      case "recent":
      default:
        return events.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
    }
  };

  const active = sortEvents(filteredEvents.filter((e) => !e.ended_at));
  const completed = sortEvents(filteredEvents.filter((e) => !!e.ended_at));

  const EventCard = ({ event }: { event: EvMeta }) => {
    const isPoints = (event.points_per_game || 0) > 0;
    const ended = !!event.ended_at;
    const lastActivity = event.last_activity ? new Date(event.last_activity).toLocaleString() : null;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{event.name}</h3>
              <span className="text-xs rounded-full border border-gray-300 px-2 py-1 text-gray-600 bg-gray-50">
                {isPoints ? `${event.points_per_game} pts` : `${event.round_minutes} min`}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                {event.courts} courts · {event.player_count || 0} players · {event.rounds_count || 0} rounds
              </div>
              <div>
                Created: {event.created_at ? new Date(event.created_at).toLocaleString() : "—"}
                {lastActivity && !ended && (
                  <span className="ml-2 text-green-600">
                    • Last activity: {lastActivity}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{event.player_count || 0}</div>
              <div className="text-xs text-gray-500">players</div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                ended
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {ended ? "Completed" : "Active"}
            </div>
            <Link
              to={`/scoreboard/${event.id}`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              View Scoreboard
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scoreboard</h1>
          <p className="text-gray-600">
            Choose an event to view its live scoreboard.
          </p>
        </div>

        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{errorMsg}</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {recentEvents.filter(e => !e.ended_at).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {recentEvents.reduce((sum, e) => sum + (e.player_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {recentEvents.reduce((sum, e) => sum + (e.courts || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Courts</div>
              </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name</option>
                    <option value="players">Players</option>
                    <option value="courts">Courts</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Events Lists */}
            {active.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Active Events ({active.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {active.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gray-500" />
                    Completed Events ({completed.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {completed.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {filteredEvents.length === 0 && !loading && (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No events found' : 'No events yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search terms.'
                    : 'Create your first tournament to get started with live scoring.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}