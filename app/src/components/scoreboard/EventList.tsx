import { Link } from "react-router-dom";

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

interface EventListProps {
  events: EvMeta[];
  sortBy: "recent" | "name" | "players" | "courts";
  onSortChange: (sort: "recent" | "name" | "players" | "courts") => void;
}

export function EventList({ events, sortBy, onSortChange }: EventListProps) {
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

  const active = sortEvents(events.filter((e) => !e.ended_at));
  const completed = sortEvents(events.filter((e) => !!e.ended_at));

  const EventRow = ({ e }: { e: EvMeta }) => {
    const isPoints = (e.points_per_game || 0) > 0;
    const ended = !!e.ended_at;
    const lastActivity = e.last_activity ? new Date(e.last_activity).toLocaleString() : null;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{e.name}</h3>
              <span className="text-xs rounded-full border border-gray-300 px-2 py-1 text-gray-600 bg-gray-50">
                {isPoints ? `${e.points_per_game} pts` : `${e.round_minutes} min`}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                {e.courts} courts · {e.player_count || 0} players · {e.rounds_count || 0} rounds
              </div>
              <div>
                Created: {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
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
              <div className="text-lg font-semibold text-gray-900">{e.player_count || 0}</div>
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
              to={`/scoreboard/${e.id}`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              View Scoreboard
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="players">Most Players</option>
            <option value="courts">Most Courts</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold mb-1" style={{ color: '#0172fb' }}>
            {events.length}
          </div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {events.filter(e => !e.ended_at).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-amber-600 mb-1">
            {events.reduce((sum, e) => sum + (e.player_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Players</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {events.reduce((sum, e) => sum + (e.courts || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Courts</div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <h2 className="text-lg font-semibold text-gray-900">Active Events</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {active.length}
          </span>
        </div>
        {active.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500">No active events.</p>
          </div>
        ) : (
          <div className="space-y-4">{active.map((e) => <EventRow key={e.id} e={e} />)}</div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <h2 className="text-lg font-semibold text-gray-900">Completed Events</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {completed.length}
          </span>
        </div>
        {completed.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500">No completed events yet.</p>
          </div>
        ) : (
          <div className="space-y-4">{completed.map((e) => <EventRow key={e.id} e={e} />)}</div>
        )}
      </div>
    </div>
  );
}



