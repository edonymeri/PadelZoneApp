// src/components/players/AddPlayerForm.tsx
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PlayerGroup {
  id: string;
  name: string;
}

interface AddPlayerFormProps {
  newName: string;
  setNewName: (name: string) => void;
  newPlayerGroup: string;
  setNewPlayerGroup: (groupId: string) => void;
  groups: PlayerGroup[];
  adding: boolean;
  onAddPlayer: () => void;
}

export default function AddPlayerForm({
  newName,
  setNewName,
  newPlayerGroup,
  setNewPlayerGroup,
  groups,
  adding,
  onAddPlayer
}: AddPlayerFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newName.trim()) {
      onAddPlayer();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <Label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
        <UserPlus className="w-4 h-4" style={{ color: '#0172fb' }} />
        Add New Player
      </Label>
      
      <div className="space-y-3">
        <Input
          id="new-player-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Alex Novak"
          onKeyDown={handleKeyDown}
          className="h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm"
          style={{ '--tw-ring-color': '#0172fb40' } as any}
          onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
        />
        
        {groups.length > 0 && (
          <select
            value={newPlayerGroup}
            onChange={(e) => setNewPlayerGroup(e.target.value)}
            className="w-full h-12 border-2 border-gray-400 focus:ring-2 bg-white text-gray-900 font-medium shadow-sm rounded-md px-3 focus:outline-none transition-colors"
            style={{ '--tw-ring-color': '#0172fb40' } as any}
            onFocus={(e) => e.currentTarget.style.borderColor = '#0172fb'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#9CA3AF'}
          >
            <option value="">No Group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
        
        <Button 
          onClick={onAddPlayer}
          disabled={!newName.trim() || adding}
          className="w-full h-12 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: '#0172fb' }}
        >
          {adding ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Player
            </>
          )}
        </Button>
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2">
        Players are automatically assigned a starting ELO rating of 1500. 
        You can assign them to a group for better organization.
      </p>
    </div>
  );
}