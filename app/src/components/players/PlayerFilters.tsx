// src/components/players/PlayerFilters.tsx
import { Search, Filter, SortAsc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlayerGroup {
  id: string;
  name: string;
}

interface PlayerFiltersProps {
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  groupFilter: string;
  setGroupFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  groups: PlayerGroup[];
}

export default function PlayerFilters({
  searchFilter,
  setSearchFilter,
  groupFilter,
  setGroupFilter,
  sortBy,
  setSortBy,
  groups
}: PlayerFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: '#0172fb' }} />
            Search Players
          </Label>
          <Input
            placeholder="Search by name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm"
            style={{ '--tw-ring-color': '#0172fb40' } as any}
            onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
          />
        </div>

        {/* Group Filter */}
        {groups.length > 0 && (
          <div className="flex-1">
            <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: '#0172fb' }} />
              Filter by Group
            </Label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm rounded-md px-3 focus:outline-none transition-colors"
              style={{ '--tw-ring-color': '#0172fb40' } as any}
              onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
            >
              <option value="all">All Players</option>
              <option value="unassigned">Unassigned</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="flex-1">
          <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
            <SortAsc className="w-4 h-4" style={{ color: '#0172fb' }} />
            Sort by
          </Label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm rounded-md px-3 focus:outline-none transition-colors"
            style={{ '--tw-ring-color': '#0172fb40' } as any}
            onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
          >
            <option value="name">Name (A-Z)</option>
            <option value="elo">ELO Rating</option>
            <option value="games">Games Played</option>
            <option value="winRate">Win Rate</option>
            <option value="events">Events Played</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchFilter || groupFilter !== "all") && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            {searchFilter && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Search: "{searchFilter}"
              </span>
            )}
            {groupFilter !== "all" && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Group: {groupFilter === "unassigned" ? "Unassigned" : 
                  groups.find(g => g.id === groupFilter)?.name || "Unknown"}
              </span>
            )}
            <button 
              onClick={() => {
                setSearchFilter("");
                setGroupFilter("all");
              }}
              className="text-blue-600 hover:text-blue-800 text-xs underline ml-2"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}