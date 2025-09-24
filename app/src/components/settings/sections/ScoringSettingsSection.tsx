// src/components/settings/sections/ScoringSettingsSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trophy, Save, Target, Clock } from "lucide-react";

interface ScoringSettings {
  default_points_per_game: number | null;
  default_round_minutes: number;
  enable_margin_bonus: boolean;
  margin_bonus_threshold: number;
  margin_bonus_points: number;
  enable_winners_court_bonus: boolean;
  winners_court_bonus_points: number;
  enable_start_rounds: boolean;
  start_rounds_count: number;
  max_consecutive_constraints: boolean;
  max_consecutive_count: number;
  enable_rotation_constraints: boolean;
  rotation_min_gap: number;
}

interface ScoringSettingsSectionProps {
  clubId: string;
  settings: ScoringSettings;
  setSettings: React.Dispatch<React.SetStateAction<ScoringSettings>>;
  saving: boolean;
  onSave: () => Promise<boolean>;
}

export default function ScoringSettingsSection({ 
  clubId,
  settings, 
  setSettings, 
  saving, 
  onSave 
}: ScoringSettingsSectionProps) {
  
  if (!clubId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Scoring Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Please select a club first to configure scoring settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-6 h-6 mr-2" />
            Scoring Configuration
          </h1>
          <p className="text-gray-600">Configure how tournaments are scored and structured</p>
        </div>
        <Button onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Game Duration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Game Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="round-minutes">Round Duration (minutes)</Label>
            <Input
              id="round-minutes"
              type="number"
              min="5"
              max="30"
              value={settings.default_round_minutes}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                default_round_minutes: parseInt(e.target.value) || 12 
              }))}
            />
            <p className="text-sm text-gray-500 mt-1">
              How long each round lasts (5-30 minutes)
            </p>
          </div>
          
          <div>
            <Label htmlFor="points-per-game">Points Per Game (optional)</Label>
            <Input
              id="points-per-game"
              type="number"
              min="10"
              max="50"
              value={settings.default_points_per_game || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                default_points_per_game: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="Leave empty for time-based games"
            />
            <p className="text-sm text-gray-500 mt-1">
              If set, games end when this score is reached
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Bonus Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Margin Bonus */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="margin-bonus" className="text-base font-medium">
                  Margin Bonus
                </Label>
                <p className="text-sm text-gray-600">
                  Award extra points for winning by a large margin
                </p>
              </div>
              <Switch
                id="margin-bonus"
                checked={settings.enable_margin_bonus}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  enable_margin_bonus: checked 
                }))}
              />
            </div>
            
            {settings.enable_margin_bonus && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="margin-threshold">Minimum Margin</Label>
                  <Input
                    id="margin-threshold"
                    type="number"
                    min="2"
                    max="10"
                    value={settings.margin_bonus_threshold}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      margin_bonus_threshold: parseInt(e.target.value) || 3 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="margin-points">Bonus Points</Label>
                  <Input
                    id="margin-points"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.margin_bonus_points}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      margin_bonus_points: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Winners Court Bonus */}
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="court-bonus" className="text-base font-medium">
                  Winners Court Bonus
                </Label>
                <p className="text-sm text-gray-600">
                  Award extra points for winning while defending Court 1
                </p>
              </div>
              <Switch
                id="court-bonus"
                checked={settings.enable_winners_court_bonus}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  enable_winners_court_bonus: checked 
                }))}
              />
            </div>
            
            {settings.enable_winners_court_bonus && (
              <div className="mt-4">
                <Label htmlFor="court-bonus-points">Bonus Points</Label>
                <Input
                  id="court-bonus-points"
                  type="number"
                  min="1"
                  max="5"
                  value={settings.winners_court_bonus_points}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    winners_court_bonus_points: parseInt(e.target.value) || 1 
                  }))}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Start Rounds */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="start-rounds" className="text-base font-medium">
                  Start Rounds
                </Label>
                <p className="text-sm text-gray-600">
                  Initial rounds with randomized partnerships before competitive play
                </p>
              </div>
              <Switch
                id="start-rounds"
                checked={settings.enable_start_rounds}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  enable_start_rounds: checked 
                }))}
              />
            </div>
            
            {settings.enable_start_rounds && (
              <div className="mt-4">
                <Label htmlFor="start-rounds-count">Number of Start Rounds</Label>
                <Input
                  id="start-rounds-count"
                  type="number"
                  min="1"
                  max="5"
                  value={settings.start_rounds_count}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    start_rounds_count: parseInt(e.target.value) || 2 
                  }))}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rotation Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Rotation Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Consecutive */}
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="max-consecutive" className="text-base font-medium">
                  Max Consecutive Partners
                </Label>
                <p className="text-sm text-gray-600">
                  Prevent players from partnering together too many rounds in a row
                </p>
              </div>
              <Switch
                id="max-consecutive"
                checked={settings.max_consecutive_constraints}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  max_consecutive_constraints: checked 
                }))}
              />
            </div>
            
            {settings.max_consecutive_constraints && (
              <div className="mt-4">
                <Label htmlFor="max-consecutive-count">Max Consecutive Rounds</Label>
                <Input
                  id="max-consecutive-count"
                  type="number"
                  min="1"
                  max="5"
                  value={settings.max_consecutive_count}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    max_consecutive_count: parseInt(e.target.value) || 2 
                  }))}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Rotation Gap */}
          <div className="border-l-4 border-red-500 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rotation-constraints" className="text-base font-medium">
                  Rotation Gap Constraints
                </Label>
                <p className="text-sm text-gray-600">
                  Ensure minimum gap between same partnerships
                </p>
              </div>
              <Switch
                id="rotation-constraints"
                checked={settings.enable_rotation_constraints}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  enable_rotation_constraints: checked 
                }))}
              />
            </div>
            
            {settings.enable_rotation_constraints && (
              <div className="mt-4">
                <Label htmlFor="rotation-gap">Minimum Gap (rounds)</Label>
                <Input
                  id="rotation-gap"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.rotation_min_gap}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    rotation_min_gap: parseInt(e.target.value) || 3 
                  }))}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {settings.default_points_per_game ? 
                `${settings.default_points_per_game} points` : 
                `${settings.default_round_minutes} minutes`
              }
            </Badge>
            
            {settings.enable_margin_bonus && (
              <Badge variant="secondary">
                Margin bonus: +{settings.margin_bonus_points} (≥{settings.margin_bonus_threshold})
              </Badge>
            )}
            
            {settings.enable_winners_court_bonus && (
              <Badge variant="secondary">
                Court bonus: +{settings.winners_court_bonus_points}
              </Badge>
            )}
            
            {settings.enable_start_rounds && (
              <Badge variant="secondary">
                Start rounds: {settings.start_rounds_count}
              </Badge>
            )}
            
            {settings.max_consecutive_constraints && (
              <Badge variant="outline">
                Max consecutive: {settings.max_consecutive_count}
              </Badge>
            )}
            
            {settings.enable_rotation_constraints && (
              <Badge variant="outline">
                Min gap: {settings.rotation_min_gap}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Warning about active events */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>
                Changes to scoring settings will only affect new tournaments. 
                Existing tournaments will continue using their original settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}