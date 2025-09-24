// src/hooks/useSettingsState.ts
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { ClubSettingsService } from '@/services/api/clubSettingsService';
import type { ClubSettings as ClubSettingsType } from '@/lib/clubSettings';

interface ClubSettings {
  id: string;
  name: string;
  description?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  website?: string;
  timezone?: string;
  default_round_minutes?: number;
  default_courts?: number;
  default_points_per_game?: number;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface UserPreferences {
  notifications_email: boolean;
  notifications_in_app: boolean;
  dashboard_view: 'detailed' | 'compact';
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

type TabType = 'club' | 'scoring' | 'tournaments' | 'branding' | 'elo' | 'leaderboard' | 'wildcard' | 'players' | 'user' | 'notifications' | 'groups' | 'team' | 'data';

export function useSettingsState() {
  const { toast } = useToast();
  const clubId = useMemo(() => localStorage.getItem("clubId") || "", []);
  
  // Main state
  const [activeTab, setActiveTab] = useState<TabType>('club');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Club Settings
  const [clubSettings, setClubSettings] = useState<ClubSettings>({
    id: '',
    name: '',
    description: '',
    contact_email: '',
    phone: '',
    address: '',
    website: '',
    timezone: 'UTC',
    default_round_minutes: 12,
    default_courts: 4,
    default_points_per_game: undefined,
    logo_url: '',
    primary_color: '#0172fb',
    secondary_color: '#01CBFC'
  });

  // User Preferences
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    notifications_email: true,
    notifications_in_app: true,
    dashboard_view: 'detailed',
    theme: 'light',
    language: 'en'
  });

  // Team Members
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Club-specific settings
  const [clubSpecificSettings, setClubSpecificSettings] = useState<ClubSettingsType | null>(null);
  const [loadingClubSettings, setLoadingClubSettings] = useState(false);

  // Club selection
  const [clubsList, setClubsList] = useState<Array<{ id: string; name: string; created_at?: string }>>([]);
  const [clubNameDraft, setClubNameDraft] = useState<string>("");
  const [loadingClubs, setLoadingClubs] = useState<boolean>(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState<boolean>(false);

  // Load functions
  async function loadSettings() {
    setLoading(true);
    try {
      await Promise.all([
        loadClubSettings(),
        loadUserPreferences(),
        loadClubSpecificSettings(),
      ]);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error loading settings",
        description: "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadClubSettings() {
    if (!clubId) return;
    
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;

      if (data) {
        setClubSettings({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          contact_email: data.contact_email || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || '',
          timezone: data.timezone || 'UTC',
          default_round_minutes: data.default_round_minutes || 12,
          default_courts: data.default_courts || 4,
          default_points_per_game: data.default_points_per_game,
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#0172fb',
          secondary_color: data.secondary_color || '#01CBFC'
        });
      }
    } catch (error) {
      console.error('Error loading club settings:', error);
    }
  }

  async function loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('user_preferences');
      if (prefs) {
        setUserPrefs(JSON.parse(prefs));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  async function loadClubSpecificSettings() {
    if (!clubId) return;
    
    setLoadingClubSettings(true);
    try {
      const settings = await ClubSettingsService.getClubSettings(clubId);
      setClubSpecificSettings(settings);
    } catch (error) {
      console.error('Error loading club-specific settings:', error);
      toast({
        variant: "destructive",
        title: "Error loading club settings",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setLoadingClubSettings(false);
    }
  }

  async function loadClubsList() {
    if (loadingClubs) return;
    
    setLoadingClubs(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, created_at')
        .order('name');

      if (error) throw error;
      setClubsList(data || []);
    } catch (error) {
      console.error('Error loading clubs list:', error);
      toast({
        variant: "destructive",
        title: "Error loading clubs",
        description: "Could not load available clubs"
      });
    } finally {
      setLoadingClubs(false);
    }
  }

  // Save functions
  async function saveClubSettings() {
    if (!clubId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          name: clubSettings.name,
          description: clubSettings.description,
          contact_email: clubSettings.contact_email,
          phone: clubSettings.phone,
          address: clubSettings.address,
          website: clubSettings.website,
          timezone: clubSettings.timezone,
          default_round_minutes: clubSettings.default_round_minutes,
          default_courts: clubSettings.default_courts,
          default_points_per_game: clubSettings.default_points_per_game,
          logo_url: clubSettings.logo_url,
          primary_color: clubSettings.primary_color,
          secondary_color: clubSettings.secondary_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', clubId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Club settings have been updated successfully."
      });
      
      return true;
    } catch (error) {
      console.error('Error saving club settings:', error);
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveUserPreferences() {
    try {
      localStorage.setItem('user_preferences', JSON.stringify(userPrefs));
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated."
      });
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      toast({
        variant: "destructive",
        title: "Error saving preferences",
        description: "Could not save your preferences"
      });
      return false;
    }
  }

  // Club management functions
  async function createClubInline() {
    if (!clubNameDraft.trim()) return;
    
    setLoadingClubs(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([{ name: clubNameDraft.trim() }])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('clubId', data.id);
      setClubNameDraft("");
      toast({
        title: "Club created",
        description: `"${data.name}" has been created and selected.`
      });
      
      // Reload settings for the new club
      window.location.reload();
    } catch (error) {
      console.error('Error creating club:', error);
      toast({
        variant: "destructive",
        title: "Error creating club",
        description: "Could not create the club"
      });
    } finally {
      setLoadingClubs(false);
    }
  }

  function selectClubInline(id: string, name: string) {
    localStorage.setItem('clubId', id);
    setIsSwitchOpen(false);
    toast({
      title: "Club selected",
      description: `Switched to "${name}"`
    });
    window.location.reload();
  }

  // Export data function
  async function exportData() {
    if (!clubId) return;
    
    try {
      const [eventsResult, playersResult] = await Promise.all([
        supabase.from('events').select('*').eq('club_id', clubId),
        supabase.from('players').select('*').eq('club_id', clubId)
      ]);

      const exportData = {
        club: clubSettings,
        events: eventsResult.data || [],
        players: playersResult.data || [],
        exported_at: new Date().toISOString(),
        version: "1.0"
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubSettings.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Club data has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export club data"
      });
    }
  }

  // Effects
  useEffect(() => {
    if (!clubId) return;
    loadSettings();
  }, [clubId]);

  return {
    // State
    clubId,
    activeTab,
    setActiveTab,
    loading,
    saving,
    clubSettings,
    setClubSettings,
    userPrefs,
    setUserPrefs,
    teamMembers,
    setTeamMembers,
    clubSpecificSettings,
    setClubSpecificSettings,
    loadingClubSettings,
    clubsList,
    setClubsList,
    clubNameDraft,
    setClubNameDraft,
    loadingClubs,
    isSwitchOpen,
    setIsSwitchOpen,
    
    // New properties for refactored components
    scoringSettings: clubSpecificSettings, // Map existing settings to scoring settings
    setScoringSettings: setClubSpecificSettings, // Use existing setter
    dataStats: { players: 0, events: 0, rounds: 0, matches: 0 }, // Placeholder for now
    exporting: false, // Placeholder for now
    clearing: false, // Placeholder for now
    
    // Functions
    loadSettings,
    loadClubSettings,
    loadUserPreferences,
    loadClubSpecificSettings,
    loadClubsList,
    saveClubSettings,
    saveUserPreferences,
    createNewClub: createClubInline,
    selectClub: selectClubInline,
    exportAllData: exportData,
    saveScoringSettings: saveClubSettings, // Use same save function for now
    clearAllData: exportData, // Placeholder function for now
    
    // Utils
    toast
  };
}