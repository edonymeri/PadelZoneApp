// src/pages/PlayersPageRefactored.tsx
import { useState, useEffect } from "react";
import PlayersPageHeader from "@/components/players/PlayersPageHeader";
import EventSelectionBanner from "@/components/players/EventSelectionBanner";
import AddPlayerForm from "@/components/players/AddPlayerForm";
import PlayerFilters from "@/components/players/PlayerFilters";
import PlayersList from "@/components/players/PlayersList";
import { usePlayer } from "@/hooks/usePlayer";
import { useEvent } from "@/hooks/useEvent";
import { Player } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function PlayersPageRefactored() {
  // Player state
  const { 
    addPlayer, 
    deletePlayer, 
    updatePlayer, 
    allPlayers, 
    loading: playersLoading 
  } = usePlayer();

  // Event state
  const { currentEvent } = useEvent();
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newPlayerGroup, setNewPlayerGroup] = useState("");
  const [adding, setAdding] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "elo" | "wins">("name");
  
  // Player groups (simplified for this refactor)
  const [groups] = useState([
    { id: "beginners", name: "Beginners" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" }
  ]);

  const { toast } = useToast();

  // Filtered and sorted players
  const filteredPlayers = allPlayers
    .filter(player => {
      const matchesSearch = player.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === "all" || 
        (player as any).group_id === selectedGroup ||
        (selectedGroup === "none" && !(player as any).group_id);
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "elo":
          return b.elo - a.elo;
        case "wins":
          const aWins = (a as any).wins || 0;
          const bWins = (b as any).wins || 0;
          return bWins - aWins;
        case "name":
        default:
          return a.full_name.localeCompare(b.full_name);
      }
    });

  const handleAddPlayer = async () => {
    if (!newName.trim()) return;

    setAdding(true);
    try {
      await addPlayer(newName.trim(), newPlayerGroup || undefined);
      setNewName("");
      setNewPlayerGroup("");
      toast({
        title: "Player Added",
        description: `${newName.trim()} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    try {
      await deletePlayer(playerId);
      toast({
        title: "Player Deleted",
        description: `${player.full_name} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPlayer = async (playerId: string, newName: string) => {
    try {
      await updatePlayer(playerId, { full_name: newName });
      toast({
        title: "Player Updated",
        description: "Player name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGroup("all");
    setSortBy("name");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PlayersPageHeader 
        playerCount={allPlayers.length}
        filteredCount={filteredPlayers.length}
        hasFilters={searchTerm || selectedGroup !== "all" || sortBy !== "name"}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <EventSelectionBanner 
          currentEvent={currentEvent}
          playerCount={allPlayers.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Player Form */}
          <div className="lg:col-span-1">
            <AddPlayerForm
              newName={newName}
              setNewName={setNewName}
              newPlayerGroup={newPlayerGroup}
              setNewPlayerGroup={setNewPlayerGroup}
              groups={groups}
              adding={adding}
              onAddPlayer={handleAddPlayer}
            />
          </div>

          {/* Right Column - Filters and Players List */}
          <div className="lg:col-span-2 space-y-6">
            <PlayerFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              sortBy={sortBy}
              setSortBy={setSortBy}
              groups={groups}
              onClearFilters={clearFilters}
              playerCount={filteredPlayers.length}
              totalCount={allPlayers.length}
            />

            {playersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading players...</p>
              </div>
            ) : (
              <PlayersList
                players={filteredPlayers}
                onDeletePlayer={handleDeletePlayer}
                onEditPlayer={handleEditPlayer}
                currentEventId={currentEvent?.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}