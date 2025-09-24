// src/components/settings/SettingsNavigation.tsx
import { 
  Building2, 
  BarChart3, 
  Trophy, 
  Palette, 
  Users, 
  Bell, 
  UsersIcon, 
  UserCheck, 
  Shuffle, 
  Database,
  User,
  Shield 
} from "lucide-react";

type TabType = 'club' | 'scoring' | 'tournaments' | 'branding' | 'elo' | 'leaderboard' | 'wildcard' | 'players' | 'user' | 'notifications' | 'groups' | 'team' | 'data';

interface SettingsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function SettingsNavigation({ activeTab, onTabChange }: SettingsNavigationProps) {
  const tabs = [
    { id: 'club' as const, label: 'Club Info', icon: Building2 },
    { id: 'scoring' as const, label: 'Scoring', icon: BarChart3 },
    { id: 'tournaments' as const, label: 'Tournaments', icon: Trophy },
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'elo' as const, label: 'ELO System', icon: BarChart3 },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
    { id: 'wildcard' as const, label: 'Wildcards', icon: Shuffle },
    { id: 'players' as const, label: 'Players', icon: Users },
    { id: 'user' as const, label: 'User Preferences', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'groups' as const, label: 'Player Groups', icon: UsersIcon },
    { id: 'team' as const, label: 'Team Management', icon: UserCheck },
    { id: 'data' as const, label: 'Data & Privacy', icon: Database }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Settings
      </h2>
      
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}