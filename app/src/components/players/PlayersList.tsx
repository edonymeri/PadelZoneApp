// src/components/players/PlayersList.tsx
import PlayerAvatar from "@/components/PlayerAvatar";
import { MoreVertical, Trophy, Users, Clock, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Player } from "@/lib/types";

interface PlayersListProps {
  players: Player[];
  onDeletePlayer: (playerId: string) => void;
  onEditPlayer: (playerId: string, newName: string) => void;
  currentEventId?: string;
}

interface PlayerWithExtendedStats extends Player {
  group_name?: string;
  wins?: number;
  total_games?: number;
  last_played?: string;
}

// Simple dropdown menu component
function SimpleDropdown({ 
  trigger, 
  children, 
  isOpen, 
  onToggle 
}: { 
  trigger: React.ReactNode; 
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={onToggle}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownMenuItem({ 
  children, 
  onClick, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${className}`}
    >
      {children}
    </button>
  );
}

export default function PlayersList({ 
  players, 
  onDeletePlayer, 
  onEditPlayer,
  currentEventId 
}: PlayersListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleEditStart = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.full_name);
    setOpenDropdown(null);
  };

  const handleEditSave = () => {
    if (editingId && editName.trim()) {
      onEditPlayer(editingId, editName.trim());
      setEditingId(null);
      setEditName("");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDeletePlayer = (playerId: string) => {
    onDeletePlayer(playerId);
    setOpenDropdown(null);
  };

  const formatLastPlayed = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays < 7) return `${diffDays - 1} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
        <p className="text-gray-500">Add your first player to get started with the tournament!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player) => {
        const extendedPlayer = player as PlayerWithExtendedStats;
        const winRate = extendedPlayer.total_games 
          ? Math.round(((extendedPlayer.wins || 0) / extendedPlayer.total_games) * 100)
          : 0;

        return (
          <div 
            key={player.id} 
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              {/* Player Info */}
              <div className="flex items-center gap-3 flex-1">
                <PlayerAvatar name={player.full_name} size={48} />
                
                <div className="flex-1 min-w-0">
                  {editingId === player.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave();
                          if (e.key === "Escape") handleEditCancel();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleEditSave}
                        className="text-green-600 hover:text-green-700 px-2 py-1 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="text-gray-500 hover:text-gray-600 px-2 py-1 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-gray-900 truncate">{player.full_name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Trophy className="w-3 h-3" />
                          <span>{Math.round(player.elo)} ELO</span>
                        </div>
                        
                        {extendedPlayer.group_name && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-3 h-3" />
                            <span>{extendedPlayer.group_name}</span>
                          </div>
                        )}
                        
                        {extendedPlayer.total_games && extendedPlayer.total_games > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Trophy className="w-3 h-3" />
                            <span>{winRate}% ({extendedPlayer.wins || 0}/{extendedPlayer.total_games})</span>
                          </div>
                        )}
                        
                        {extendedPlayer.last_played && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatLastPlayed(extendedPlayer.last_played)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {editingId !== player.id && (
                <SimpleDropdown
                  isOpen={openDropdown === player.id}
                  onToggle={() => setOpenDropdown(openDropdown === player.id ? null : player.id)}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  }
                >
                  <DropdownMenuItem onClick={() => handleEditStart(player)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Name
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeletePlayer(player.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Player
                  </DropdownMenuItem>
                </SimpleDropdown>
              )}
            </div>

            {/* Player Status Badge */}
            {currentEventId && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active in Current Event
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}