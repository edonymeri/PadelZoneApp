// src/components/event/PlayerAssignmentStep.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import type { UUID } from "@/lib/types";

interface Player {
  id: UUID;
  full_name: string;
  elo: number;
}

interface PlayerAssignmentStepProps {
  clubId: string;
  selectedPlayers: UUID[];
  onSelectedPlayersChange: (players: UUID[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PlayerAssignmentStep({
  clubId,
  selectedPlayers,
  onSelectedPlayersChange,
  onNext,
  onBack
}: PlayerAssignmentStepProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load club players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, full_name, elo')
          .eq('club_id', clubId)
          .order('full_name');

        if (error) throw error;
        setPlayers(data || []);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [clubId]);

  const handlePlayerToggle = (playerId: UUID) => {
    const newSelection = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter(id => id !== playerId)
      : [...selectedPlayers, playerId];
    onSelectedPlayersChange(newSelection);
  };

  const handleSelectAll = () => {
    const allPlayerIds = players.map(p => p.id);
    onSelectedPlayersChange(allPlayerIds);
  };

  const handleClearAll = () => {
    onSelectedPlayersChange([]);
  };

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSkillLevel = (elo: number) => {
    if (elo >= 1500) return { label: 'Expert', color: 'bg-green-500' };
    if (elo >= 1200) return { label: 'Advanced', color: 'bg-yellow-500' };
    return { label: 'Intermediate', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">Loading players...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          👥 Add Players to Event
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Select players from your club to participate in this event.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSelectAll} variant="outline" size="sm">
              Select All
            </Button>
            <Button onClick={handleClearAll} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
        </div>

        {/* Player Count */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
          </Badge>
        </div>

        {/* Players List */}
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredPlayers.map((player) => {
            const skillLevel = getSkillLevel(player.elo);
            const isSelected = selectedPlayers.includes(player.id);
            
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-background/50 hover:bg-background/80'
                }`}
                onClick={() => handlePlayerToggle(player.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => handlePlayerToggle(player.id)}
                  className="data-[state=checked]:bg-blue-600"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">{player.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      ELO: {player.elo}
                    </Badge>
                    <Badge className={`text-xs ${skillLevel.color}`}>
                      {skillLevel.label}
                    </Badge>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  {isSelected ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No players found matching your search.' : 'No players in your club yet.'}
          </div>
        )}

        {/* Validation */}
        {selectedPlayers.length < 4 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              ⚠️ You need at least 4 players to start an event. Currently selected: {selectedPlayers.length}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={selectedPlayers.length < 4}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next: Review Event →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
