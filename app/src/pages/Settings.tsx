// src/pages/SettingsRefactored.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon, 
  Building2, 
  BarChart3,
  Trophy,
  Palette,
  Users,
  UserCheck,
  Shuffle,
  Target
} from "lucide-react";

import ClubSettingsTab from "@/components/settings/tabs/ClubSettingsTab";
// Import other tabs as they're created
// import ScoringConfigTab from "@/components/settings/tabs/ScoringConfigTab";

type TabId = 'club' | 'scoring' | 'tournaments' | 'branding' | 'elo' | 'leaderboard' | 'wildcard' | 'players';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'club',
    label: 'Club Settings',
    icon: Building2,
    description: 'Basic club information and contact details'
  },
  {
    id: 'scoring',
    label: 'Scoring Config',
    icon: BarChart3,
    description: 'Configure scoring rules and point values'
  },
  {
    id: 'tournaments',
    label: 'Tournament Defaults',
    icon: Trophy,
    description: 'Default settings for new tournaments'
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: Palette,
    description: 'Colors, logos, and visual customization'
  },
  {
    id: 'elo',
    label: 'ELO Config',
    icon: Target,
    description: 'ELO rating system configuration'
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Leaderboard display and ranking settings'
  },
  {
    id: 'wildcard',
    label: 'Wildcard Config',
    icon: Shuffle,
    description: 'Wildcard round configuration'
  },
  {
    id: 'players',
    label: 'Player Management',
    icon: UserCheck,
    description: 'Player validation and management rules'
  }
];

export default function SettingsRefactored() {
  const clubId = useMemo(() => localStorage.getItem("clubId") || "", []);
  const [activeTab, setActiveTab] = useState<TabId>('club');

  if (!clubId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Please select a club first to access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'club':
        return <ClubSettingsTab clubId={clubId} />;
      case 'scoring':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Scoring configuration coming soon...</p>
          </div>
        );
      case 'tournaments':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Tournament defaults coming soon...</p>
          </div>
        );
      case 'branding':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Branding settings coming soon...</p>
          </div>
        );
      case 'elo':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">ELO configuration coming soon...</p>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Leaderboard settings coming soon...</p>
          </div>
        );
      case 'wildcard':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Wildcard configuration coming soon...</p>
          </div>
        );
      case 'players':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Player management coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Tab not implemented yet.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure your club settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-80">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-900">
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className={`w-full justify-start text-left h-auto p-3 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <div className="font-medium">{tab.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {tab.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {(() => {
                    const currentTab = TABS.find(tab => tab.id === activeTab);
                    const Icon = currentTab?.icon || SettingsIcon;
                    return (
                      <>
                        <Icon className="h-6 w-6" />
                        {currentTab?.label || 'Settings'}
                      </>
                    );
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTabContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}