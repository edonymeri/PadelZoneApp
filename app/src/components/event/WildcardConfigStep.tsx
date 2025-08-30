// src/components/event/WildcardConfigStep.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Zap, Tornado, Info } from "lucide-react";

interface WildcardConfigStepProps {
  wildcardEnabled: boolean;
  setWildcardEnabled: (enabled: boolean) => void;
  wildcardStartRound: number;
  setWildcardStartRound: (round: number) => void;
  wildcardFrequency: number;
  setWildcardFrequency: (frequency: number) => void;
  wildcardIntensity: 'mild' | 'medium' | 'mayhem';
  setWildcardIntensity: (intensity: 'mild' | 'medium' | 'mayhem') => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

const intensityInfo = {
  mild: {
    icon: Shuffle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Swap ~25% of players between adjacent courts",
    effect: "Gentle mixing while maintaining court hierarchy"
  },
  medium: {
    icon: Zap,
    color: "text-yellow-600", 
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    description: "Redistribute ~50% of players across all courts",
    effect: "Balanced chaos with strategic opportunities"
  },
  mayhem: {
    icon: Tornado,
    color: "text-red-600",
    bgColor: "bg-red-50", 
    borderColor: "border-red-200",
    description: "Complete randomization of all player positions",
    effect: "Total chaos - anyone can end up anywhere!"
  }
};

export default function WildcardConfigStep({
  wildcardEnabled,
  setWildcardEnabled,
  wildcardStartRound,
  setWildcardStartRound,
  wildcardFrequency,
  setWildcardFrequency,
  wildcardIntensity,
  setWildcardIntensity,
  onNext,
  onBack,
  isValid
}: WildcardConfigStepProps) {

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🎲 Wildcard Configuration</h2>
        <p className="text-gray-600">
          Add excitement with surprise rounds that randomly redistribute players across courts!
        </p>
      </div>

      {/* Main Toggle */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🎲 Enable Wildcard Rounds
              </CardTitle>
              <CardDescription>
                Create surprise rounds that shake up the tournament hierarchy
              </CardDescription>
            </div>
            <Switch 
              checked={wildcardEnabled} 
              onCheckedChange={setWildcardEnabled}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </CardHeader>

        {wildcardEnabled && (
          <CardContent className="space-y-6">
            {/* Start Round */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">When to start wildcards</Label>
              <Select value={wildcardStartRound.toString()} onValueChange={(value) => setWildcardStartRound(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">After Round 4</SelectItem>
                  <SelectItem value="5">After Round 5 (Recommended)</SelectItem>
                  <SelectItem value="6">After Round 6</SelectItem>
                  <SelectItem value="7">After Round 7</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                💡 First few rounds establish skill hierarchy before chaos begins
              </p>
            </div>

            {/* Frequency */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Wildcard frequency</Label>
              <Select value={wildcardFrequency.toString()} onValueChange={(value) => setWildcardFrequency(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Every 2 rounds (Frequent chaos)</SelectItem>
                  <SelectItem value="3">Every 3 rounds (Recommended)</SelectItem>
                  <SelectItem value="4">Every 4 rounds (Occasional surprises)</SelectItem>
                  <SelectItem value="5">Every 5 rounds (Rare wildcards)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                ⚡ How often wildcards activate after the start round
              </p>
            </div>

            {/* Intensity */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Chaos intensity</Label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(intensityInfo).map(([intensity, info]) => {
                  const Icon = info.icon;
                  const isSelected = wildcardIntensity === intensity;
                  
                  return (
                    <button
                      key={intensity}
                      onClick={() => setWildcardIntensity(intensity as 'mild' | 'medium' | 'mayhem')}
                      className={`text-left p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        isSelected 
                          ? `${info.borderColor} ${info.bgColor} ring-2 ring-purple-200` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? info.color : 'text-gray-400'}`} />
                        <span className={`font-semibold capitalize ${isSelected ? info.color : 'text-gray-700'}`}>
                          {intensity}
                        </span>
                        {isSelected && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Selected</span>}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{info.description}</p>
                      <p className="text-xs text-gray-500">{info.effect}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Wildcard Preview</h4>
                  <p className="text-sm text-blue-800">
                    Wildcards will activate starting Round {wildcardStartRound}, then every {wildcardFrequency} rounds 
                    with <span className="font-semibold">{wildcardIntensity}</span> intensity.
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    Expected wildcard rounds: {wildcardStartRound}, {wildcardStartRound + wildcardFrequency}, {wildcardStartRound + (wildcardFrequency * 2)}, ...
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {wildcardEnabled ? 'Next: Review & Create' : 'Skip Wildcards'}
        </Button>
      </div>
    </div>
  );
}
