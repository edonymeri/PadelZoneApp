// src/components/settings/tabs/ScoringConfigTab.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ClubSettingsService } from "@/services/api/clubSettingsService";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "@/lib/clubSettings";
import SettingsFormSection from "../shared/SettingsFormSection";
import SettingsNumberField from "../shared/SettingsNumberField";
import SettingsToggleField from "../shared/SettingsToggleField";

interface ScoringConfigTabProps {
  clubId: string;
}

export default function ScoringConfigTab({ clubId }: ScoringConfigTabProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [clubId]);

  const loadConfig = async () => {
    if (!clubId) return;
    
    setIsLoading(true);
    try {
      const data = await ClubSettingsService.getScoringConfig(clubId);
      setConfig(data);
    } catch (error) {
      console.error('Failed to load scoring config:', error);
      toast({
        variant: "destructive",
        title: "Failed to load scoring configuration",
        description: "Using default settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!clubId) return;
    
    setIsSaving(true);
    try {
      await ClubSettingsService.updateScoringConfig(clubId, config);
      toast({
        title: "Scoring configuration saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save scoring config:', error);
      toast({
        variant: "destructive",
        title: "Failed to save configuration",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<ScoringConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default Scoring */}
      <SettingsFormSection
        title="Default Scoring"
        description="Configure default point values and game settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsNumberField
            id="defaultPointsPerGame"
            label="Points per game"
            description="Default points needed to win a game"
            value={config.defaultPointsPerGame}
            onChange={(value) => updateConfig({ defaultPointsPerGame: value })}
            min={10}
            max={50}
          />
        </div>
      </SettingsFormSection>

      {/* Format-Specific Configurations */}
      <SettingsFormSection
        title="Winners Court Scoring"
        description="Specific settings for Winners Court format tournaments"
      >
        <div className="space-y-4">
          <SettingsToggleField
            id="enableCourtHierarchy"
            label="Enable court hierarchy bonuses"
            description="Higher courts award bonus points for wins"
            checked={config.formatSpecific.winnersCourtScoring.enableCourtHierarchy}
            onCheckedChange={(checked) => updateConfig({
              formatSpecific: {
                ...config.formatSpecific,
                winnersCourtScoring: {
                  ...config.formatSpecific.winnersCourtScoring,
                  enableCourtHierarchy: checked
                }
              }
            })}
          />
          
          {config.formatSpecific.winnersCourtScoring.enableCourtHierarchy && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
              <SettingsNumberField
                id="courtOneBonusPoints"
                label="Court 1 bonus"
                description="Extra points for wins on court 1"
                value={config.formatSpecific.winnersCourtScoring.courtOneBonusPoints}
                onChange={(value) => updateConfig({
                  formatSpecific: {
                    ...config.formatSpecific,
                    winnersCourtScoring: {
                      ...config.formatSpecific.winnersCourtScoring,
                      courtOneBonusPoints: value
                    }
                  }
                })}
                min={0}
                max={10}
                suffix="pts"
              />
              
              <SettingsNumberField
                id="courtTwoBonusPoints"
                label="Court 2 bonus"
                description="Extra points for wins on court 2"
                value={config.formatSpecific.winnersCourtScoring.courtTwoBonusPoints}
                onChange={(value) => updateConfig({
                  formatSpecific: {
                    ...config.formatSpecific,
                    winnersCourtScoring: {
                      ...config.formatSpecific.winnersCourtScoring,
                      courtTwoBonusPoints: value
                    }
                  }
                })}
                min={0}
                max={10}
                suffix="pts"
              />
              
              <SettingsNumberField
                id="courtThreeBonusPoints"
                label="Court 3 bonus"
                description="Extra points for wins on court 3"
                value={config.formatSpecific.winnersCourtScoring.courtThreeBonusPoints}
                onChange={(value) => updateConfig({
                  formatSpecific: {
                    ...config.formatSpecific,
                    winnersCourtScoring: {
                      ...config.formatSpecific.winnersCourtScoring,
                      courtThreeBonusPoints: value
                    }
                  }
                })}
                min={0}
                max={10}
                suffix="pts"
              />
            </div>
          )}
        </div>
      </SettingsFormSection>

      {/* Americano Scoring */}
      <SettingsFormSection
        title="Americano Scoring"
        description="Specific settings for Americano format tournaments"
      >
        <div className="space-y-4">
          <SettingsToggleField
            id="enableBalancedScoring"
            label="Enable balanced scoring"
            description="Adjust scoring to maintain competitive balance"
            checked={config.formatSpecific.americanoScoring.enableBalancedScoring}
            onCheckedChange={(checked) => updateConfig({
              formatSpecific: {
                ...config.formatSpecific,
                americanoScoring: {
                  ...config.formatSpecific.americanoScoring,
                  enableBalancedScoring: checked
                }
              }
            })}
          />
          
          <SettingsNumberField
            id="partnerVarietyBonus"
            label="Partner variety bonus"
            description="Bonus points for playing with different partners"
            value={config.formatSpecific.americanoScoring.partnerVarietyBonus}
            onChange={(value) => updateConfig({
              formatSpecific: {
                ...config.formatSpecific,
                americanoScoring: {
                  ...config.formatSpecific.americanoScoring,
                  partnerVarietyBonus: value
                }
              }
            })}
            min={0}
            max={5}
            suffix="pts"
          />
        </div>
      </SettingsFormSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveConfig}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Scoring Configuration"}
        </Button>
      </div>
    </div>
  );
}