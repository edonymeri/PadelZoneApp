// src/pages/Settings.tsx
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useSettingsState } from "@/hooks/useSettingsState";
import SettingsNavigation from "@/components/settings/SettingsNavigation";
import ClubSettingsSection from "@/components/settings/sections/ClubSettingsSection";
import ScoringSettingsSection from "@/components/settings/sections/ScoringSettingsSection";
import DataManagementSection from "@/components/settings/sections/DataManagementSection";

// Placeholder components for sections not yet refactored
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

// Temporary placeholder component for unrefactored sections
function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section is being refactored and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<
    'club' | 'scoring' | 'tournaments' | 'branding' | 'elo' | 
    'leaderboard' | 'wildcard' | 'players' | 'user' | 
    'notifications' | 'groups' | 'team' | 'data'
  >('club');

  // Use the extracted settings state hook
  const {
    clubId,
    clubSettings,
    setClubSettings,
    scoringSettings,
    setScoringSettings,
    dataStats,
    saving,
    exporting,
    clearing,
    clubsList,
    clubNameDraft,
    setClubNameDraft,
    loadingClubs,
    isSwitchOpen,
    setIsSwitchOpen,
    saveClubSettings,
    saveScoringSettings,
    exportAllData,
    clearAllData,
    loadClubsList,
    createNewClub,
    selectClub
  } = useSettingsState();

  const renderContent = () => {
    switch (activeTab) {
      case 'club':
        return (
          <ClubSettingsSection
            clubId={clubId}
            clubSettings={clubSettings}
            setClubSettings={setClubSettings}
            saving={saving}
            onSave={saveClubSettings}
            clubsList={clubsList}
            clubNameDraft={clubNameDraft}
            setClubNameDraft={setClubNameDraft}
            loadingClubs={loadingClubs}
            isSwitchOpen={isSwitchOpen}
            setIsSwitchOpen={setIsSwitchOpen}
            onLoadClubsList={loadClubsList}
            onCreateClub={createNewClub}
            onSelectClub={selectClub}
          />
        );
      
      case 'scoring':
        // Create scoring settings from club settings for now
        const scoringSettingsFromClub = {
          default_points_per_game: clubSettings.default_points_per_game || null,
          default_round_minutes: clubSettings.default_round_minutes || 12,
          enable_margin_bonus: true,
          margin_bonus_threshold: 3,
          margin_bonus_points: 1,
          enable_winners_court_bonus: true,
          winners_court_bonus_points: 1,
          enable_start_rounds: true,
          start_rounds_count: 2,
          max_consecutive_constraints: true,
          max_consecutive_count: 2,
          enable_rotation_constraints: true,
          rotation_min_gap: 3
        };
        
        return (
          <ScoringSettingsSection
            clubId={clubId}
            settings={scoringSettingsFromClub}
            setSettings={() => {}} // Placeholder for now
            saving={saving}
            onSave={saveScoringSettings}
          />
        );
      
      case 'data':
        return (
          <DataManagementSection
            clubId={clubId}
            dataStats={dataStats}
            exporting={exporting}
            onExportData={exportAllData}
            onClearData={clearAllData}
            clearing={clearing}
          />
        );
      
      case 'tournaments':
        return <PlaceholderSection title="Tournament Settings" />;
      
      case 'branding':
        return <PlaceholderSection title="Branding & Theme" />;
      
      case 'elo':
        return <PlaceholderSection title="ELO Configuration" />;
      
      case 'leaderboard':
        return <PlaceholderSection title="Leaderboard Settings" />;
      
      case 'wildcard':
        return <PlaceholderSection title="Wildcard Settings" />;
      
      case 'players':
        return <PlaceholderSection title="Player Management" />;
      
      case 'user':
        return <PlaceholderSection title="User Preferences" />;
      
      case 'notifications':
        return <PlaceholderSection title="Notification Settings" />;
      
      case 'groups':
        return <PlaceholderSection title="Group Management" />;
      
      case 'team':
        return <PlaceholderSection title="Team Management" />;
      
      default:
        return <PlaceholderSection title="Settings" />;
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Settings Navigation Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r min-h-screen">
            <SettingsNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </AppShell>
  );
}