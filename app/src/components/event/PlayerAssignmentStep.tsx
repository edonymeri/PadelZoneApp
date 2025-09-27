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
  requiredPlayers?: number;
  format?: string;
}

export default function PlayerAssignmentStep({
  clubId,
  selectedPlayers,
  onSelectedPlayersChange,
  onNext,
  onBack,
  requiredPlayers = 4,
  format = "winners-court"
}: PlayerAssignmentStepProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const singleRestCapacity = requiredPlayers + 1;
  const courtCount = Math.max(1, Math.round(requiredPlayers / 4));

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
    <Card className="border-2 border-gray-200 shadow-lg bg-white w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-gray-900">
          👥 Add Players to Event
        </CardTitle>
        <p className="text-center text-gray-600">
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
              className="w-full bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSelectAll} variant="outline" size="sm" className="border-gray-300">
              Select All
            </Button>
            <Button onClick={handleClearAll} variant="outline" size="sm" className="border-gray-300">
              Clear All
            </Button>
          </div>
        </div>

        {/* Player Count */}
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-blue-100 text-blue-800 border-blue-200">
            {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
          </Badge>
          <div className="text-sm text-gray-600">
            {format === 'americano' ? (
              <span>
                <strong>Americano format:</strong> Works best in groups of four. With {courtCount} court{courtCount === 1 ? '' : 's'} you can roster {requiredPlayers} players, or add a {singleRestCapacity}th player to rotate rest each round.
              </span>
            ) : (
              <span>
                <strong>Winners Court format:</strong> Minimum {requiredPlayers} players recommended
              </span>
            )}
          </div>
          {format === 'americano' && selectedPlayers.length === singleRestCapacity && (
            <div className="text-sm text-blue-600">
              ℹ️ We'll rotate the extra player so everyone rests evenly.
            </div>
          )}
          {selectedPlayers.length < requiredPlayers && (
            <div className="text-sm text-orange-600 font-medium">
              ⚠️ Need at least {requiredPlayers - selectedPlayers.length} more player{requiredPlayers - selectedPlayers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredPlayers.map((player) => {
            const skillLevel = getSkillLevel(player.elo);
            const isSelected = selectedPlayers.includes(player.id);
            
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
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
                    <span className="font-medium text-lg text-gray-900">{player.full_name}</span>
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                      ELO: {player.elo}
                    </Badge>
                    <Badge className={`text-xs text-white ${skillLevel.color}`}>
                      {skillLevel.label}
                    </Badge>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-600">
                  {isSelected ? '✓ Selected' : 'Click to select'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No players found matching your search.' : 'No players in your club yet.'}
          </div>
        )}

        {/* Validation */}
        {selectedPlayers.length < 4 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ You need at least 4 players to start an event. Currently selected: {selectedPlayers.length}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline" className="border-gray-300">
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={selectedPlayers.length < 4}
            style={{ backgroundColor: '#0172fb' }}
            className="hover:opacity-90 text-white disabled:opacity-50"
          >
            Next: Review Event →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
