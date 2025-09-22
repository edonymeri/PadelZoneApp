// src/pages/Settings.tsx
import { useState, useEffect, useMemo } from "react";

import { supabase } from "@/lib/supabase";
import "../settings-override.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

import { 
  Settings as SettingsIcon, 
  Building2, 
  User, 
  Bell, 
  Shield, 
  Download,
  Upload,
  Trash2,
  Save,
  Users,
  Mail,
  Clock,
  Palette,
  Globe,
  Database,
  Key,
  UsersIcon,
  Trophy,
  BarChart3,
  Shuffle,
  UserCheck
} from "lucide-react";

import GroupManagement from "@/components/groups/GroupManagement";
import { ClubSettingsService } from '@/services/api/clubSettingsService';
import type { ClubSettings as ClubSettingsType, ScoringConfig, TournamentDefaults, BrandingConfig } from '@/lib/clubSettings';

interface ClubSettings {
  id: string;
  name: string;
  description?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  website?: string;
  timezone: string;
  default_round_minutes: number;
  default_courts: number;
  default_points_per_game?: number;
  logo_url?: string;
  primary_color: string;
  secondary_color?: string;
}

interface UserPreferences {
  notifications_email: boolean;
  notifications_in_app: boolean;
  dashboard_view: 'compact' | 'detailed';
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
];

export default function Settings() {
  const { toast } = useToast();
  const clubId = useMemo(() => localStorage.getItem("clubId") || "", []);
  
  // State
  const [activeTab, setActiveTab] = useState<'club' | 'scoring' | 'tournaments' | 'branding' | 'elo' | 'leaderboard' | 'wildcard' | 'players' | 'user' | 'notifications' | 'groups' | 'team' | 'data'>('club');
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

  // Team Members (simplified)
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Club-specific settings
  const [clubSpecificSettings, setClubSpecificSettings] = useState<ClubSettingsType | null>(null);
  const [loadingClubSettings, setLoadingClubSettings] = useState(false);

  // When no club is selected, let the user select or create one inline
  const [clubsList, setClubsList] = useState<Array<{ id: string; name: string; created_at?: string }>>([]);
  const [clubNameDraft, setClubNameDraft] = useState<string>("");
  const [loadingClubs, setLoadingClubs] = useState<boolean>(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!clubId) return;
    loadSettings();
  }, [clubId]);

  async function loadSettings() {
    setLoading(true);
    try {
      await Promise.all([
        loadClubSettings(),
        loadUserPreferences(),
        loadClubSpecificSettings()
      ]);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        variant: "destructive",
        title: "Failed to load settings",
        description: "Please refresh the page to try again."
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadClubSettings() {
    try {
      // First try to load basic club data
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, created_at, owner_id")
        .eq("id", clubId)
        .single();

      if (error) {
        console.error("Error loading basic club data:", error);
        throw error;
      }
      
      if (data) {
        console.log("Loaded basic club data:", data);
        
        // Try to load extended settings if they exist
        try {
          const { data: extendedData } = await supabase
            .from("clubs")
            .select(`
              description, contact_email, phone, address, website, 
              timezone, default_round_minutes, default_courts, 
              default_points_per_game, logo_url, primary_color, secondary_color
            `)
            .eq("id", clubId)
            .single();
          
          console.log("Extended club data:", extendedData);
          
          setClubSettings({
            id: data.id,
            name: data.name || '',
            description: extendedData?.description || '',
            contact_email: extendedData?.contact_email || '',
            phone: extendedData?.phone || '',
            address: extendedData?.address || '',
            website: extendedData?.website || '',
            timezone: extendedData?.timezone || 'UTC',
            default_round_minutes: extendedData?.default_round_minutes || 12,
            default_courts: extendedData?.default_courts || 4,
            default_points_per_game: extendedData?.default_points_per_game,
            logo_url: extendedData?.logo_url || '',
            primary_color: extendedData?.primary_color || '#0172fb',
            secondary_color: extendedData?.secondary_color || '#01CBFC'
          });
        } catch (extendedError) {
          console.warn("Extended settings not available, using defaults:", extendedError);
          // Use basic data with defaults
          setClubSettings({
            id: data.id,
            name: data.name || '',
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
        }
      }
    } catch (error) {
      console.error("Failed to load club settings:", error);
      // Set minimal defaults if everything fails
      setClubSettings(prev => ({
        ...prev,
        id: clubId,
        name: 'My Club'
      }));
      
      toast({
        variant: "destructive",
        title: "Database schema outdated",
        description: "Please update your database schema to use all settings features."
      });
    }
  }

  async function loadUserPreferences() {
    // For now, load from localStorage (in a real app, this would be from user profile)
    const prefs = localStorage.getItem('user_preferences');
    if (prefs) {
      setUserPrefs(JSON.parse(prefs));
    }
  }

  async function loadClubSpecificSettings() {
    if (!clubId) return;
    
    setLoadingClubSettings(true);
    try {
      const settings = await ClubSettingsService.getClubSettings(clubId);
      setClubSpecificSettings(settings);
    } catch (error) {
      console.error("Failed to load club-specific settings:", error);
      toast({
        variant: "destructive",
        title: "Failed to load club settings",
        description: "Using default settings. Some features may be limited."
      });
    } finally {
      setLoadingClubSettings(false);
    }
  }

  // -------- No-club helpers --------
  async function loadClubsList() {
    try {
      setLoadingClubs(true);
      const { data, error } = await supabase
        .from("clubs")
        .select("id,name,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClubsList(data || []);
    } catch (e: any) {
      console.error("Failed to load clubs list:", e);
      toast({ variant: "destructive", title: "Failed to load clubs", description: e.message || "" });
    } finally {
      setLoadingClubs(false);
    }
  }

  async function createClubInline() {
    if (!clubNameDraft.trim()) {
      toast({ variant: "destructive", title: "Club name is required" });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name: clubNameDraft.trim() })
        .select()
        .single();
      if (error) throw error;
      localStorage.setItem("clubId", data.id);
      toast({ title: "Club created", description: data.name });
      // reload to pick up new clubId across app
      window.location.reload();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Create failed", description: e.message || "" });
    }
  }

  function selectClubInline(id: string, name: string) {
    localStorage.setItem("clubId", id);
    toast({ title: "Club selected", description: name });
    window.location.reload();
  }

  async function saveClubSettings() {
    if (!clubSettings.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Club name is required."
      });
      return;
    }

    setSaving(true);
    try {
      console.log("Saving club settings:", clubSettings);
      
      const updateData = {
        name: clubSettings.name.trim(),
        description: clubSettings.description?.trim() || null,
        contact_email: clubSettings.contact_email?.trim() || null,
        phone: clubSettings.phone?.trim() || null,
        address: clubSettings.address?.trim() || null,
        website: clubSettings.website?.trim() || null,
        timezone: clubSettings.timezone,
        default_round_minutes: clubSettings.default_round_minutes,
        default_courts: clubSettings.default_courts,
        default_points_per_game: clubSettings.default_points_per_game || null,
        logo_url: clubSettings.logo_url?.trim() || null,
        primary_color: clubSettings.primary_color,
        secondary_color: clubSettings.secondary_color
      };

      // Try to update with all fields first
      let { data, error } = await supabase
        .from("clubs")
        .update(updateData)
        .eq("id", clubId)
        .select()
        .single();

      // If that fails, try updating just the basic fields
      if (error && error.message?.includes('column')) {
        console.warn("Full update failed, trying basic update:", error);
        const basicUpdate = {
          name: updateData.name
        };
        
        const result = await supabase
          .from("clubs")
          .update(basicUpdate)
          .eq("id", clubId)
          .select()
          .single();
          
        data = result.data;
        error = result.error;
        
        if (!error) {
          // Notify ClubSwitcher that club data has been updated
          window.dispatchEvent(new Event("clubUpdated"));
          
          toast({
            title: "Basic settings saved",
            description: "Club name updated. Please update your database schema for full settings support."
          });
          return;
        }
      }

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Update successful:", data);

      // Notify ClubSwitcher that club data has been updated
      window.dispatchEvent(new Event("clubUpdated"));

      toast({
        title: "Settings saved",
        description: "Club settings have been updated successfully."
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveUserPreferences() {
    localStorage.setItem('user_preferences', JSON.stringify(userPrefs));
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated."
    });
  }

  async function exportData() {
    try {
      console.log("Starting data export for club:", clubId);
      
      // Show loading toast
      toast({
        title: "Exporting data...",
        description: "Please wait while we prepare your club data."
      });

      // Export club data as JSON
      const [eventsResult, playersResult] = await Promise.all([
        supabase.from("events").select("*").eq("club_id", clubId),
        supabase.from("players").select("*").eq("club_id", clubId)
      ]);

      const exportData = {
        club: clubSettings,
        events: eventsResult.data || [],
        players: playersResult.data || [],
        statistics: {
          total_events: eventsResult.data?.length || 0,
          total_players: playersResult.data?.length || 0,
          exported_at: new Date().toISOString()
        }
      };

      console.log("Export data prepared:", exportData);

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Clean filename for download
      const cleanClubName = clubSettings.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `${cleanClubName}_export_${dateStr}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: `Exported ${exportData.statistics.total_events} events and ${exportData.statistics.total_players} players.`
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export data. Please try again."
      });
    }
  }

  if (!clubId) {
    // Lazy load clubs list for inline selection
    if (!loadingClubs && clubsList.length === 0) {
      // fire and forget; safe in render guard
      loadClubsList();
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Choose or create a club to continue.</p>
          </div>

          <Card className="border-2 border-gray-200 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Building2 className="w-5 h-5" style={{ color: '#0172fb' }} />
                Select a Club
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create club */}
              <div>
                <h3 className="text-lg font-bold mb-3">Create Club</h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Club name"
                    value={clubNameDraft}
                    onChange={(e) => setClubNameDraft(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button onClick={createClubInline} style={{ backgroundColor: '#0172fb' }} className="text-white">
                    Create
                  </Button>
                </div>
              </div>

              {/* Existing clubs */}
              <div>
                <h3 className="text-lg font-bold mb-3">Or select an existing club</h3>
                {loadingClubs ? (
                  <div className="p-4 text-center text-gray-500">Loading clubs…</div>
                ) : clubsList.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg">No clubs yet.</div>
                ) : (
                  <div className="space-y-3">
                    {clubsList.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">Created {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</div>
                        </div>
                        <Button variant="outline" className="border-gray-300" onClick={() => selectClubInline(c.id, c.name)}>
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="flex gap-4">
              <div className="w-64 h-64 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'club', label: 'Club Settings', icon: Building2 },
    { id: 'scoring', label: 'Scoring Rules', icon: Shield },
    { id: 'tournaments', label: 'Tournament Defaults', icon: SettingsIcon },
    { id: 'branding', label: 'Branding & Terms', icon: Palette },
    { id: 'elo', label: 'ELO System', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard Config', icon: BarChart3 },
    { id: 'wildcard', label: 'Wildcard Rules', icon: Shuffle },
    { id: 'players', label: 'Player Management', icon: UserCheck },
    { id: 'user', label: 'User Preferences', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'groups', label: 'Player Groups', icon: UsersIcon },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'data', label: 'Data & Security', icon: Database }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="settings-main-title text-3xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" style={{ color: '#0172fb' }} />
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your club settings, preferences, and team configuration.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <Card className="border-2 border-gray-200 shadow-lg bg-white">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={activeTab === tab.id ? { backgroundColor: '#0172fb' } : {}}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="hidden sm:block">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'club' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Building2 className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Club Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Basic Information</h3>
                    {/* Change Club inline action */}
                    <div className="mb-4">
                      <Dialog open={isSwitchOpen} onOpenChange={(o) => { setIsSwitchOpen(o); if (o) loadClubsList(); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-gray-300">Change Club</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-gray-200">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900">Switch Club</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Create New</h4>
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <Input
                                  placeholder="Club name"
                                  value={clubNameDraft}
                                  onChange={(e) => setClubNameDraft(e.target.value)}
                                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <Button onClick={createClubInline} style={{ backgroundColor: '#0172fb' }} className="text-white">Create</Button>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Existing Clubs</h4>
                              {loadingClubs ? (
                                <div className="p-4 text-center text-gray-500">Loading…</div>
                              ) : clubsList.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 border rounded-lg">No clubs found.</div>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-auto">
                                  {clubsList.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div>
                                        <div className="font-medium text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</div>
                                      </div>
                                      <Button variant="outline" className="border-gray-300" onClick={() => selectClubInline(c.id, c.name)}>Select</Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" className="border-gray-300" onClick={() => setIsSwitchOpen(false)}>Close</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="club-name" className="text-sm font-medium text-gray-700">Club Name *</Label>
                        <Input
                          id="club-name"
                          value={clubSettings.name}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">Contact Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={clubSettings.contact_email}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <Input
                          id="phone"
                          value={clubSettings.phone}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                        <Input
                          id="website"
                          value={clubSettings.website}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, website: e.target.value }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        value={clubSettings.description}
                        onChange={(e) => setClubSettings(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tell us about your club..."
                      />
                    </div>
                    <div className="mt-6">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                      <Textarea
                        id="address"
                        value={clubSettings.address}
                        onChange={(e) => setClubSettings(prev => ({ ...prev, address: e.target.value }))}
                        className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        rows={2}
                        placeholder="Club address..."
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Tournament Defaults */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Tournament Defaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="round-minutes" className="text-sm font-medium text-gray-700">Round Duration (minutes)</Label>
                        <Input
                          id="round-minutes"
                          type="number"
                          min="5"
                          max="60"
                          value={clubSettings.default_round_minutes}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, default_round_minutes: parseInt(e.target.value) || 12 }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="default-courts" className="text-sm font-medium text-gray-700">Default Courts</Label>
                        <Input
                          id="default-courts"
                          type="number"
                          min="1"
                          max="16"
                          value={clubSettings.default_courts}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, default_courts: parseInt(e.target.value) || 4 }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="points-per-game" className="text-sm font-medium text-gray-700">Default Points (optional)</Label>
                        <Input
                          id="points-per-game"
                          type="number"
                          min="1"
                          max="50"
                          value={clubSettings.default_points_per_game || ''}
                          onChange={(e) => setClubSettings(prev => ({ ...prev, default_points_per_game: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Leave empty for time-based"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Regional Settings */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Regional Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">Timezone</Label>
                        <Select value={clubSettings.timezone} onValueChange={(value) => setClubSettings(prev => ({ ...prev, timezone: value }))}>
                          <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Branding */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="primary-color" className="text-sm font-medium text-gray-700">Primary Color</Label>
                        <div className="flex gap-3 mt-1">
                          <Input
                            id="primary-color"
                            type="color"
                            value={clubSettings.primary_color}
                            onChange={(e) => setClubSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-16 h-10 p-1 border-2 border-gray-300 bg-white"
                          />
                          <Input
                            value={clubSettings.primary_color}
                            onChange={(e) => setClubSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="#0172fb"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondary-color" className="text-sm font-medium text-gray-700">Secondary Color</Label>
                        <div className="flex gap-3 mt-1">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={clubSettings.secondary_color}
                            onChange={(e) => setClubSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="w-16 h-10 p-1 border-2 border-gray-300 bg-white"
                          />
                          <Input
                            value={clubSettings.secondary_color}
                            onChange={(e) => setClubSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="#01CBFC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveClubSettings}
                      disabled={saving}
                      style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                      className="hover:opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Club Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scoring Configuration Tab */}
            {activeTab === 'scoring' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Shield className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Scoring Rules Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingClubSettings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : clubSpecificSettings ? (
                    <>
                      {/* Base Scoring */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Base Scoring</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="baseWinPoints" className="text-sm font-medium text-gray-700">Points for Win</Label>
                            <Input
                              id="baseWinPoints"
                              type="number"
                              min="0"
                              max="10"
                              value={clubSpecificSettings.scoring_config.baseWinPoints}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                scoring_config: { ...prev.scoring_config, baseWinPoints: parseInt(e.target.value) || 0 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxPointsPerMatch" className="text-sm font-medium text-gray-700">Maximum Points per Match</Label>
                            <Input
                              id="maxPointsPerMatch"
                              type="number"
                              min="1"
                              max="10"
                              value={clubSpecificSettings.scoring_config.maxPointsPerMatch}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                scoring_config: { ...prev.scoring_config, maxPointsPerMatch: parseInt(e.target.value) || 1 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Bonus Points */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Bonus Points</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="marginBonusThreshold" className="text-sm font-medium text-gray-700">Margin Bonus Threshold</Label>
                            <Input
                              id="marginBonusThreshold"
                              type="number"
                              min="1"
                              max="20"
                              value={clubSpecificSettings.scoring_config.marginBonusThreshold}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                scoring_config: { ...prev.scoring_config, marginBonusThreshold: parseInt(e.target.value) || 1 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-600 mt-1">Points difference needed for bonus</p>
                          </div>
                          <div>
                            <Label htmlFor="marginBonusPoints" className="text-sm font-medium text-gray-700">Margin Bonus Points</Label>
                            <Input
                              id="marginBonusPoints"
                              type="number"
                              min="0"
                              max="5"
                              value={clubSpecificSettings.scoring_config.marginBonusPoints}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                scoring_config: { ...prev.scoring_config, marginBonusPoints: parseInt(e.target.value) || 0 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Winner's Court Bonus */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Winner's Court Bonus</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="winnersCourtBonus" className="text-base font-medium text-gray-900">
                                Enable Winner's Court Bonus
                              </Label>
                              <p className="text-sm text-gray-600">
                                Give extra points for winning on the top court
                              </p>
                            </div>
                            <Switch
                              id="winnersCourtBonus"
                              checked={clubSpecificSettings.scoring_config.winnersCourtBonusEnabled}
                              onCheckedChange={(checked) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                scoring_config: { ...prev.scoring_config, winnersCourtBonusEnabled: checked }
                              } : prev)}
                            />
                          </div>
                          
                          {clubSpecificSettings.scoring_config.winnersCourtBonusEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label htmlFor="winnersCourtBonusPoints" className="text-sm font-medium text-gray-700">Bonus Points</Label>
                                <Input
                                  id="winnersCourtBonusPoints"
                                  type="number"
                                  min="0"
                                  max="5"
                                  value={clubSpecificSettings.scoring_config.winnersCourtBonusPoints}
                                  onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                    ...prev,
                                    scoring_config: { ...prev.scoring_config, winnersCourtBonusPoints: parseInt(e.target.value) || 0 }
                                  } : prev)}
                                  className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <Label htmlFor="winnersCourtBonusStartRound" className="text-sm font-medium text-gray-700">Start Round</Label>
                                <Input
                                  id="winnersCourtBonusStartRound"
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={clubSpecificSettings.scoring_config.winnersCourtBonusStartRound}
                                  onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                    ...prev,
                                    scoring_config: { ...prev.scoring_config, winnersCourtBonusStartRound: parseInt(e.target.value) || 1 }
                                  } : prev)}
                                  className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <p className="text-sm text-gray-600 mt-1">Round when bonus starts applying</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-6 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateScoringConfig(clubId, clubSpecificSettings.scoring_config);
                            toast({
                              title: success ? "Scoring settings saved" : "Failed to save settings",
                              description: success ? "Your scoring configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Scoring Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load scoring settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tournament Defaults Tab */}
            {activeTab === 'tournaments' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <SettingsIcon className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Tournament Defaults
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingClubSettings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : clubSpecificSettings ? (
                    <>
                      {/* Tournament Format */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Default Tournament Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="defaultFormat" className="text-sm font-medium text-gray-700">Default Format</Label>
                            <Select value={clubSpecificSettings.tournament_defaults.defaultFormat} onValueChange={(value: 'winners-court' | 'americano') => setClubSpecificSettings(prev => prev ? {
                              ...prev,
                              tournament_defaults: { ...prev.tournament_defaults, defaultFormat: value }
                            } : prev)}>
                              <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="winners-court">Winner's Court</SelectItem>
                                <SelectItem value="americano">Americano</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="defaultCourts" className="text-sm font-medium text-gray-700">Default Courts</Label>
                            <Input
                              id="defaultCourts"
                              type="number"
                              min="1"
                              max="16"
                              value={clubSpecificSettings.tournament_defaults.defaultCourts}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                tournament_defaults: { ...prev.tournament_defaults, defaultCourts: parseInt(e.target.value) || 1 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Game Settings */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Game Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="defaultTimePerGame" className="text-sm font-medium text-gray-700">Default Time per Game (minutes)</Label>
                            <Input
                              id="defaultTimePerGame"
                              type="number"
                              min="1"
                              max="60"
                              value={clubSpecificSettings.tournament_defaults.defaultTimePerGame}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                tournament_defaults: { ...prev.tournament_defaults, defaultTimePerGame: parseInt(e.target.value) || 1 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxPlayersPerEvent" className="text-sm font-medium text-gray-700">Max Players per Event</Label>
                            <Input
                              id="maxPlayersPerEvent"
                              type="number"
                              min="4"
                              max="100"
                              value={clubSpecificSettings.tournament_defaults.maxPlayersPerEvent}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                tournament_defaults: { ...prev.tournament_defaults, maxPlayersPerEvent: parseInt(e.target.value) || 4 }
                              } : prev)}
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-6 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateTournamentDefaults(clubId, clubSpecificSettings.tournament_defaults);
                            toast({
                              title: success ? "Tournament defaults saved" : "Failed to save settings",
                              description: success ? "Your tournament defaults have been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Tournament Defaults
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load tournament settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Palette className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Branding & Terminology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingClubSettings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : clubSpecificSettings ? (
                    <>
                      {/* Terminology */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Custom Terminology</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="eventTerminology" className="text-sm font-medium text-gray-700">Event Term</Label>
                            <Input
                              id="eventTerminology"
                              value={clubSpecificSettings.branding_config.eventTerminology}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                branding_config: { ...prev.branding_config, eventTerminology: e.target.value }
                              } : prev)}
                              placeholder="Tournament, Session, Night, etc."
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-600 mt-1">How you refer to events/tournaments</p>
                          </div>
                          <div>
                            <Label htmlFor="playerTerminology" className="text-sm font-medium text-gray-700">Player Term</Label>
                            <Input
                              id="playerTerminology"
                              value={clubSpecificSettings.branding_config.playerTerminology}
                              onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                branding_config: { ...prev.branding_config, playerTerminology: e.target.value }
                              } : prev)}
                              placeholder="Player, Member, Participant, etc."
                              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-600 mt-1">How you refer to players</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Court Names */}
                      <div>
                        <h3 className="text-lg font-bold mb-4">Custom Court Names</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="useCustomCourtNames" className="text-base font-medium text-gray-900">
                                Use Custom Court Names
                              </Label>
                              <p className="text-sm text-gray-600">
                                Replace "Court 1", "Court 2" with custom names
                              </p>
                            </div>
                            <Switch
                              id="useCustomCourtNames"
                              checked={clubSpecificSettings.branding_config.useCustomCourtNames}
                              onCheckedChange={(checked) => setClubSpecificSettings(prev => prev ? {
                                ...prev,
                                branding_config: { ...prev.branding_config, useCustomCourtNames: checked }
                              } : prev)}
                            />
                          </div>
                          
                          {clubSpecificSettings.branding_config.useCustomCourtNames && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-gray-700">Court Names (one per line)</Label>
                              <Textarea
                                value={clubSpecificSettings.branding_config.customCourtNames.join('\n')}
                                onChange={(e) => setClubSpecificSettings(prev => prev ? {
                                  ...prev,
                                  branding_config: { 
                                    ...prev.branding_config, 
                                    customCourtNames: e.target.value.split('\n').filter(name => name.trim())
                                  }
                                } : prev)}
                                placeholder="Center Court&#10;Court Alpha&#10;Court Beta&#10;Practice Court"
                                className="min-h-[100px] bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                              />
                              <p className="text-sm text-gray-600">Enter one court name per line. First line = Court 1, etc.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-6 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateBrandingConfig(clubId, clubSpecificSettings.branding_config);
                            toast({
                              title: success ? "Branding settings saved" : "Failed to save settings",
                              description: success ? "Your branding configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Branding Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load branding settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ELO System Configuration Tab */}
            {activeTab === 'elo' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Trophy className="w-5 h-5" style={{ color: '#0172fb' }} />
                    ELO System Configuration
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    Configure ELO ratings with format-specific settings for Winners Court and Americano tournaments.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {clubSpecificSettings ? (
                    <>
                      {/* Global ELO Settings */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Global ELO Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="eloEnabled" className="font-medium text-gray-700">
                              Enable ELO System
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="eloEnabled"
                                checked={clubSpecificSettings.elo_config.enabled}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { ...prev.elo_config, enabled: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.elo_config.enabled ? 'ELO ratings enabled' : 'ELO ratings disabled'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="startingElo" className="font-medium text-gray-700">
                              Starting ELO Rating
                            </Label>
                            <Input
                              id="startingElo"
                              type="number"
                              min="800"
                              max="2000"
                              value={clubSpecificSettings.elo_config.startingElo}
                              onChange={(e) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  elo_config: { ...prev.elo_config, startingElo: parseInt(e.target.value) || 1000 }
                                }))
                              }
                              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="eloFloor" className="font-medium text-gray-700">
                              ELO Floor (Minimum)
                            </Label>
                            <Input
                              id="eloFloor"
                              type="number"
                              min="0"
                              max="1500"
                              value={clubSpecificSettings.elo_config.eloFloor}
                              onChange={(e) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  elo_config: { ...prev.elo_config, eloFloor: parseInt(e.target.value) || 0 }
                                }))
                              }
                              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="eloCeiling" className="font-medium text-gray-700">
                              ELO Ceiling (Maximum)
                            </Label>
                            <Input
                              id="eloCeiling"
                              type="number"
                              min="1500"
                              max="3000"
                              value={clubSpecificSettings.elo_config.eloCeiling}
                              onChange={(e) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  elo_config: { ...prev.elo_config, eloCeiling: parseInt(e.target.value) || 2400 }
                                }))
                              }
                              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Format-Specific ELO Settings */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Format-Specific ELO Configuration</h3>
                        
                        {/* Winners Court ELO */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-blue-900">Winners Court Format</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">K-Factor</Label>
                              <Input
                                type="number"
                                min="16"
                                max="64"
                                value={clubSpecificSettings.elo_config.winnersCourtConfig?.kFactor || 32}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      winnersCourtConfig: {
                                        ...prev.elo_config.winnersCourtConfig,
                                        kFactor: parseInt(e.target.value) || 32
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Gain</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.winnersCourtConfig?.maxEloGainPerMatch || 50}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      winnersCourtConfig: {
                                        ...prev.elo_config.winnersCourtConfig,
                                        maxEloGainPerMatch: parseInt(e.target.value) || 50
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Loss</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.winnersCourtConfig?.maxEloLossPerMatch || 50}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      winnersCourtConfig: {
                                        ...prev.elo_config.winnersCourtConfig,
                                        maxEloLossPerMatch: parseInt(e.target.value) || 50
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Americano Individual ELO */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-green-900">Americano Individual Format</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">K-Factor</Label>
                              <Input
                                type="number"
                                min="16"
                                max="64"
                                value={clubSpecificSettings.elo_config.americanoIndividualConfig?.kFactor || 24}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoIndividualConfig: {
                                        ...prev.elo_config.americanoIndividualConfig,
                                        kFactor: parseInt(e.target.value) || 24
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Gain</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.americanoIndividualConfig?.maxEloGainPerMatch || 40}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoIndividualConfig: {
                                        ...prev.elo_config.americanoIndividualConfig,
                                        maxEloGainPerMatch: parseInt(e.target.value) || 40
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Loss</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.americanoIndividualConfig?.maxEloLossPerMatch || 40}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoIndividualConfig: {
                                        ...prev.elo_config.americanoIndividualConfig,
                                        maxEloLossPerMatch: parseInt(e.target.value) || 40
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Americano Team ELO */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-purple-900">Americano Team Format</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">K-Factor</Label>
                              <Input
                                type="number"
                                min="16"
                                max="64"
                                value={clubSpecificSettings.elo_config.americanoTeamConfig?.kFactor || 28}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoTeamConfig: {
                                        ...prev.elo_config.americanoTeamConfig,
                                        kFactor: parseInt(e.target.value) || 28
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Gain</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.americanoTeamConfig?.maxEloGainPerMatch || 35}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoTeamConfig: {
                                        ...prev.elo_config.americanoTeamConfig,
                                        maxEloGainPerMatch: parseInt(e.target.value) || 35
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Max ELO Loss</Label>
                              <Input
                                type="number"
                                min="10"
                                max="100"
                                value={clubSpecificSettings.elo_config.americanoTeamConfig?.maxEloLossPerMatch || 35}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    elo_config: { 
                                      ...prev.elo_config, 
                                      americanoTeamConfig: {
                                        ...prev.elo_config.americanoTeamConfig,
                                        maxEloLossPerMatch: parseInt(e.target.value) || 35
                                      }
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateEloConfig(clubId, clubSpecificSettings.elo_config);
                            toast({
                              title: success ? "ELO settings saved" : "Failed to save settings",
                              description: success ? "Your ELO configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save ELO Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load ELO settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Leaderboard Configuration Tab */}
            {activeTab === 'leaderboard' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <BarChart3 className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Leaderboard Configuration
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    Configure which statistics and rankings to display for different tournament formats.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {clubSpecificSettings ? (
                    <>
                      {/* Global Leaderboard Settings */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Global Leaderboard Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label className="font-medium text-gray-700">Ranking Periods</Label>
                            <div className="space-y-2">
                              {(['weekly', 'monthly', 'season', 'all-time'] as const).map((period) => (
                                <div key={period} className="flex items-center space-x-2">
                                  <Switch
                                    checked={clubSpecificSettings.leaderboard_config.rankingPeriods.includes(period)}
                                    onCheckedChange={(checked) => {
                                      const currentPeriods = clubSpecificSettings.leaderboard_config.rankingPeriods;
                                      const newPeriods = checked 
                                        ? [...currentPeriods, period]
                                        : currentPeriods.filter(p => p !== period);
                                      
                                      setClubSpecificSettings(prev => ({
                                        ...prev,
                                        leaderboard_config: { 
                                          ...prev.leaderboard_config, 
                                          rankingPeriods: newPeriods 
                                        }
                                      }));
                                    }}
                                  />
                                  <span className="text-sm text-gray-700 capitalize">{period.replace('-', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="font-medium text-gray-700">Sort Priority</Label>
                            <div className="space-y-2">
                              {(['total_score', 'games_won', 'goal_difference', 'elo'] as const).map((stat, index) => (
                                <div key={stat} className="flex items-center justify-between p-2 border rounded">
                                  <span className="text-sm text-gray-700">{stat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                  <span className="text-xs text-gray-500">Priority {index + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={clubSpecificSettings.leaderboard_config.showHistoricalRankings}
                            onCheckedChange={(checked) => 
                              setClubSpecificSettings(prev => ({
                                ...prev,
                                leaderboard_config: { ...prev.leaderboard_config, showHistoricalRankings: checked }
                              }))
                            }
                          />
                          <Label className="font-medium text-gray-700">Show Historical Rankings</Label>
                        </div>
                      </div>

                      {/* Format-Specific Stats Configuration */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Format-Specific Statistics</h3>
                        
                        {/* Winners Court Stats */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-blue-900">Winners Court Format</h4>
                          <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700">Display Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {['total_score', 'games_won', 'goal_difference', 'elo', 'win_percentage', 'court_progression', 'winners_court_time'].map((stat) => (
                                <div key={stat} className="flex items-center space-x-2">
                                  <Switch
                                    checked={clubSpecificSettings.leaderboard_config.winnersCourtStats.includes(stat)}
                                    onCheckedChange={(checked) => {
                                      const currentStats = clubSpecificSettings.leaderboard_config.winnersCourtStats;
                                      const newStats = checked 
                                        ? [...currentStats, stat]
                                        : currentStats.filter(s => s !== stat);
                                      
                                      setClubSpecificSettings(prev => ({
                                        ...prev,
                                        leaderboard_config: { 
                                          ...prev.leaderboard_config, 
                                          winnersCourtStats: newStats 
                                        }
                                      }));
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Americano Stats */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-green-900">Americano Format</h4>
                          <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700">Display Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {['total_score', 'games_won', 'goal_difference', 'elo', 'win_percentage', 'consistency_rating', 'partner_compatibility'].map((stat) => (
                                <div key={stat} className="flex items-center space-x-2">
                                  <Switch
                                    checked={clubSpecificSettings.leaderboard_config.americanoStats.includes(stat)}
                                    onCheckedChange={(checked) => {
                                      const currentStats = clubSpecificSettings.leaderboard_config.americanoStats;
                                      const newStats = checked 
                                        ? [...currentStats, stat]
                                        : currentStats.filter(s => s !== stat);
                                      
                                      setClubSpecificSettings(prev => ({
                                        ...prev,
                                        leaderboard_config: { 
                                          ...prev.leaderboard_config, 
                                          americanoStats: newStats 
                                        }
                                      }));
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Individual Mode Stats */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-purple-900">Individual Mode</h4>
                          <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700">Display Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {['elo', 'total_score', 'games_won', 'win_percentage', 'goal_difference', 'performance_trend'].map((stat) => (
                                <div key={stat} className="flex items-center space-x-2">
                                  <Switch
                                    checked={clubSpecificSettings.leaderboard_config.individualModeStats.includes(stat)}
                                    onCheckedChange={(checked) => {
                                      const currentStats = clubSpecificSettings.leaderboard_config.individualModeStats;
                                      const newStats = checked 
                                        ? [...currentStats, stat]
                                        : currentStats.filter(s => s !== stat);
                                      
                                      setClubSpecificSettings(prev => ({
                                        ...prev,
                                        leaderboard_config: { 
                                          ...prev.leaderboard_config, 
                                          individualModeStats: newStats 
                                        }
                                      }));
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Team Mode Stats */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-orange-900">Team Mode</h4>
                          <div className="space-y-4">
                            <Label className="text-sm font-medium text-gray-700">Display Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {['team_elo', 'total_score', 'games_won', 'win_percentage', 'goal_difference', 'team_chemistry'].map((stat) => (
                                <div key={stat} className="flex items-center space-x-2">
                                  <Switch
                                    checked={clubSpecificSettings.leaderboard_config.teamModeStats.includes(stat)}
                                    onCheckedChange={(checked) => {
                                      const currentStats = clubSpecificSettings.leaderboard_config.teamModeStats;
                                      const newStats = checked 
                                        ? [...currentStats, stat]
                                        : currentStats.filter(s => s !== stat);
                                      
                                      setClubSpecificSettings(prev => ({
                                        ...prev,
                                        leaderboard_config: { 
                                          ...prev.leaderboard_config, 
                                          teamModeStats: newStats 
                                        }
                                      }));
                                    }}
                                  />
                                  <span className="text-xs text-gray-700">
                                    {stat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateLeaderboardConfig(clubId, clubSpecificSettings.leaderboard_config);
                            toast({
                              title: success ? "Leaderboard settings saved" : "Failed to save settings",
                              description: success ? "Your leaderboard configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Leaderboard Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load leaderboard settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wildcard Configuration Tab */}
            {activeTab === 'wildcard' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Shuffle className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Wildcard Rules Configuration
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    Configure wildcard events and format-specific wildcard rules for tournaments.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {clubSpecificSettings ? (
                    <>
                      {/* Global Wildcard Settings */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Global Wildcard Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="wildcardDefault" className="font-medium text-gray-700">
                              Enable Wildcards by Default
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="wildcardDefault"
                                checked={clubSpecificSettings.wildcard_config.enabledByDefault}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    wildcard_config: { ...prev.wildcard_config, enabledByDefault: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.wildcard_config.enabledByDefault ? 'Wildcards enabled by default' : 'Wildcards disabled by default'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="allowMidTournament" className="font-medium text-gray-700">
                              Allow Mid-Tournament Changes
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="allowMidTournament"
                                checked={clubSpecificSettings.wildcard_config.allowMidTournament}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    wildcard_config: { ...prev.wildcard_config, allowMidTournament: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.wildcard_config.allowMidTournament ? 'Can enable/disable during tournament' : 'Fixed at tournament start'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="defaultFrequency" className="font-medium text-gray-700">
                              Default Frequency (rounds)
                            </Label>
                            <Input
                              id="defaultFrequency"
                              type="number"
                              min="1"
                              max="10"
                              value={clubSpecificSettings.wildcard_config.defaultFrequency}
                              onChange={(e) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  wildcard_config: { ...prev.wildcard_config, defaultFrequency: parseInt(e.target.value) || 3 }
                                }))
                              }
                              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="defaultStartRound" className="font-medium text-gray-700">
                              Default Start Round
                            </Label>
                            <Input
                              id="defaultStartRound"
                              type="number"
                              min="1"
                              max="20"
                              value={clubSpecificSettings.wildcard_config.defaultStartRound}
                              onChange={(e) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  wildcard_config: { ...prev.wildcard_config, defaultStartRound: parseInt(e.target.value) || 3 }
                                }))
                              }
                              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="defaultIntensity" className="font-medium text-gray-700">
                              Default Intensity Level
                            </Label>
                            <Select
                              value={clubSpecificSettings.wildcard_config.defaultIntensity}
                              onValueChange={(value: 'mild' | 'medium' | 'mayhem') => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  wildcard_config: { ...prev.wildcard_config, defaultIntensity: value }
                                }))
                              }
                            >
                              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mild">Mild - Gentle mix-ups</SelectItem>
                                <SelectItem value="medium">Medium - Moderate chaos</SelectItem>
                                <SelectItem value="mayhem">Mayhem - Maximum chaos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Format-Specific Wildcard Rules */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Format-Specific Wildcard Rules</h3>
                        
                        {/* Winners Court Wildcards */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-blue-900">Winners Court Format</h4>
                            <Switch
                              checked={clubSpecificSettings.wildcard_config.enabledForWinnersCourt}
                              onCheckedChange={(checked) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  wildcard_config: { ...prev.wildcard_config, enabledForWinnersCourt: checked }
                                }))
                              }
                            />
                          </div>
                          <p className="text-sm text-blue-700">
                            {clubSpecificSettings.wildcard_config.enabledForWinnersCourt 
                              ? "Wildcards are enabled for Winners Court tournaments. Players can experience court shuffles, partner swaps, and scoring modifiers."
                              : "Wildcards are disabled for Winners Court tournaments. Traditional court progression will be maintained."
                            }
                          </p>
                        </div>
                        
                        {/* Americano Wildcards */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-green-900">Americano Format</h4>
                            <Switch
                              checked={clubSpecificSettings.wildcard_config.enabledForAmericano}
                              onCheckedChange={(checked) => 
                                setClubSpecificSettings(prev => ({
                                  ...prev,
                                  wildcard_config: { ...prev.wildcard_config, enabledForAmericano: checked }
                                }))
                              }
                            />
                          </div>
                          <p className="text-sm text-green-700">
                            {clubSpecificSettings.wildcard_config.enabledForAmericano 
                              ? "Wildcards are enabled for Americano tournaments. Note that this may disrupt the balanced rotation system."
                              : "Wildcards are disabled for Americano tournaments (recommended). This preserves the balanced partner rotation."
                            }
                          </p>
                          {clubSpecificSettings.wildcard_config.enabledForAmericano && (
                            <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                              <p className="text-sm text-yellow-800">
                                ⚠️ <strong>Warning:</strong> Enabling wildcards in Americano format may compromise the fairness of partner rotation and affect tournament balance.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Wildcard Examples */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Wildcard Examples</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Mild Wildcards</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Partner swaps between games</li>
                              <li>• Court rotation changes</li>
                              <li>• Bonus point opportunities</li>
                            </ul>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Medium Wildcards</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Random court assignments</li>
                              <li>• Score multipliers</li>
                              <li>• Sudden elimination rounds</li>
                            </ul>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Mayhem Wildcards</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Complete tournament reshuffles</li>
                              <li>• Reverse scoring systems</li>
                              <li>• Mystery game modes</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updateWildcardConfig(clubId, clubSpecificSettings.wildcard_config);
                            toast({
                              title: success ? "Wildcard settings saved" : "Failed to save settings",
                              description: success ? "Your wildcard configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Wildcard Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load wildcard settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Player Management Configuration Tab */}
            {activeTab === 'players' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <UserCheck className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Player Management Configuration
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    Configure player management settings with format-specific constraints and validation rules.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {clubSpecificSettings ? (
                    <>
                      {/* General Player Management */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">General Player Management</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="requireApproval" className="font-medium text-gray-700">
                              Require Player Approval
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="requireApproval"
                                checked={clubSpecificSettings.player_config.requirePlayerApproval}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, requirePlayerApproval: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.player_config.requirePlayerApproval ? 'Players need approval to join' : 'Open registration'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="allowGuests" className="font-medium text-gray-700">
                              Allow Guest Players
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="allowGuests"
                                checked={clubSpecificSettings.player_config.allowGuestPlayers}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, allowGuestPlayers: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.player_config.allowGuestPlayers ? 'Guest players allowed' : 'Members only'}
                              </span>
                            </div>
                          </div>
                          
                          {clubSpecificSettings.player_config.allowGuestPlayers && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="maxGuests" className="font-medium text-gray-700">
                                  Max Guests Per Event
                                </Label>
                                <Input
                                  id="maxGuests"
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={clubSpecificSettings.player_config.maxGuestsPerEvent}
                                  onChange={(e) => 
                                    setClubSpecificSettings(prev => ({
                                      ...prev,
                                      player_config: { ...prev.player_config, maxGuestsPerEvent: parseInt(e.target.value) || 0 }
                                    }))
                                  }
                                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="guestNaming" className="font-medium text-gray-700">
                                  Guest Naming Pattern
                                </Label>
                                <Input
                                  id="guestNaming"
                                  placeholder="Guest {number}"
                                  value={clubSpecificSettings.player_config.guestNamingPattern}
                                  onChange={(e) => 
                                    setClubSpecificSettings(prev => ({
                                      ...prev,
                                      player_config: { ...prev.player_config, guestNamingPattern: e.target.value }
                                    }))
                                  }
                                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="allowPartialFill" className="font-medium text-gray-700">
                              Allow Partial Tournament Fill
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="allowPartialFill"
                                checked={clubSpecificSettings.player_config.allowPartialFill}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, allowPartialFill: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.player_config.allowPartialFill ? 'Can start with fewer players' : 'Must meet minimum requirements'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="autoFillWaitlist" className="font-medium text-gray-700">
                              Auto-fill from Waitlist
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="autoFillWaitlist"
                                checked={clubSpecificSettings.player_config.autoFillFromWaitlist}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, autoFillFromWaitlist: checked }
                                  }))
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {clubSpecificSettings.player_config.autoFillFromWaitlist ? 'Automatically fill from waitlist' : 'Manual waitlist management'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Format-Specific Player Constraints */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Format-Specific Player Constraints</h3>
                        
                        {/* Winners Court Constraints */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-blue-900">Winners Court Format</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Minimum Players</Label>
                              <Input
                                type="number"
                                min="4"
                                max="100"
                                value={clubSpecificSettings.player_config.winnersCourtMinPlayers}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { 
                                      ...prev.player_config, 
                                      winnersCourtMinPlayers: parseInt(e.target.value) || 4 
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Maximum Players</Label>
                              <Input
                                type="number"
                                min="4"
                                max="100"
                                value={clubSpecificSettings.player_config.winnersCourtMaxPlayers}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { 
                                      ...prev.player_config, 
                                      winnersCourtMaxPlayers: parseInt(e.target.value) || 32 
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-blue-700">
                            Winners Court format works best with {clubSpecificSettings.player_config.winnersCourtMinPlayers}-{clubSpecificSettings.player_config.winnersCourtMaxPlayers} players for optimal court hierarchy.
                          </p>
                        </div>
                        
                        {/* Americano Constraints */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                          <h4 className="font-medium text-green-900">Americano Format</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Minimum Players</Label>
                              <Input
                                type="number"
                                min="4"
                                max="100"
                                value={clubSpecificSettings.player_config.americanoMinPlayers}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { 
                                      ...prev.player_config, 
                                      americanoMinPlayers: parseInt(e.target.value) || 4 
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Maximum Players</Label>
                              <Input
                                type="number"
                                min="4"
                                max="100"
                                value={clubSpecificSettings.player_config.americanoMaxPlayers}
                                onChange={(e) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { 
                                      ...prev.player_config, 
                                      americanoMaxPlayers: parseInt(e.target.value) || 24 
                                    }
                                  }))
                                }
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={clubSpecificSettings.player_config.americanoRequireEvenPlayers}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, americanoRequireEvenPlayers: checked }
                                  }))
                                }
                              />
                              <Label className="text-sm font-medium text-gray-700">Require Even Number of Players</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={clubSpecificSettings.player_config.americanoRequireCompleteRotation}
                                onCheckedChange={(checked) => 
                                  setClubSpecificSettings(prev => ({
                                    ...prev,
                                    player_config: { ...prev.player_config, americanoRequireCompleteRotation: checked }
                                  }))
                                }
                              />
                              <Label className="text-sm font-medium text-gray-700">Require Complete Partner Rotation</Label>
                            </div>
                          </div>
                          
                          <p className="text-sm text-green-700">
                            Americano format requires {clubSpecificSettings.player_config.americanoMinPlayers}-{clubSpecificSettings.player_config.americanoMaxPlayers} players
                            {clubSpecificSettings.player_config.americanoRequireEvenPlayers ? ' (even numbers only)' : ''} for balanced partner rotation.
                          </p>
                        </div>
                      </div>

                      {/* Player Validation Summary */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Validation Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Winners Court</h5>
                            <p className="text-sm text-gray-600">
                              Players: {clubSpecificSettings.player_config.winnersCourtMinPlayers}-{clubSpecificSettings.player_config.winnersCourtMaxPlayers}<br/>
                              Guest limit: {clubSpecificSettings.player_config.allowGuestPlayers ? clubSpecificSettings.player_config.maxGuestsPerEvent : 0}<br/>
                              Partial fill: {clubSpecificSettings.player_config.allowPartialFill ? 'Allowed' : 'Not allowed'}
                            </p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Americano</h5>
                            <p className="text-sm text-gray-600">
                              Players: {clubSpecificSettings.player_config.americanoMinPlayers}-{clubSpecificSettings.player_config.americanoMaxPlayers}
                              {clubSpecificSettings.player_config.americanoRequireEvenPlayers ? ' (even only)' : ''}<br/>
                              Guest limit: {clubSpecificSettings.player_config.allowGuestPlayers ? clubSpecificSettings.player_config.maxGuestsPerEvent : 0}<br/>
                              Rotation: {clubSpecificSettings.player_config.americanoRequireCompleteRotation ? 'Complete required' : 'Partial allowed'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={async () => {
                            const success = await ClubSettingsService.updatePlayerConfig(clubId, clubSpecificSettings.player_config);
                            toast({
                              title: success ? "Player management settings saved" : "Failed to save settings",
                              description: success ? "Your player management configuration has been updated." : "Please try again.",
                              variant: success ? "default" : "destructive",
                            });
                          }}
                          style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                          className="hover:opacity-90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Player Management Settings
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Unable to load player management settings. Please refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'user' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <User className="w-5 h-5" style={{ color: '#0172fb' }} />
                    User Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Dashboard */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Dashboard</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="dashboard-view" className="text-sm font-medium text-gray-700">Dashboard View</Label>
                        <Select value={userPrefs.dashboard_view} onValueChange={(value: 'compact' | 'detailed') => setUserPrefs(prev => ({ ...prev, dashboard_view: value }))}>
                          <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="theme" className="text-sm font-medium text-gray-700">Theme</Label>
                        <Select value={userPrefs.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => setUserPrefs(prev => ({ ...prev, theme: value }))}>
                          <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Language & Region */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Language & Region</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="language" className="text-sm font-medium text-gray-700">Language</Label>
                        <Select value={userPrefs.language} onValueChange={(value) => setUserPrefs(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Actions */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Account</h3>
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Sign Out</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Sign out of your account and return to the login screen.
                        </p>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              await supabase.auth.signOut();
                              toast({
                                title: "Signed out successfully",
                                description: "You have been signed out of your account.",
                              });
                            } catch (error: any) {
                              toast({
                                title: "Error signing out",
                                description: error.message,
                                variant: "destructive",
                              });
                            }
                          }}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveUserPreferences}
                      style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                      className="hover:opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Bell className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications" className="text-base font-medium text-gray-900">
                            Tournament Updates
                          </Label>
                          <p className="text-sm text-gray-600">
                            Receive email notifications about tournament progress and results
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={userPrefs.notifications_email}
                          onCheckedChange={(checked) => setUserPrefs(prev => ({ ...prev, notifications_email: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">In-App Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="app-notifications" className="text-base font-medium text-gray-900">
                            Real-time Updates
                          </Label>
                          <p className="text-sm text-gray-600">
                            Show notifications within the app for real-time updates
                          </p>
                        </div>
                        <Switch
                          id="app-notifications"
                          checked={userPrefs.notifications_in_app}
                          onCheckedChange={(checked) => setUserPrefs(prev => ({ ...prev, notifications_in_app: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveUserPreferences}
                      style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                      className="hover:opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'groups' && (
              <GroupManagement clubId={clubId} />
            )}

            {activeTab === 'team' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Users className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Team & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Current Limitations */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Team Management Coming Soon</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Advanced team features are being developed. Currently, each club is managed by its creator.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Account Info */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Club Owner</div>
                            <div className="text-sm text-gray-500">
                              You have full access to all club features
                            </div>
                          </div>
                          <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Owner
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Future Features Preview */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Planned Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm">Email invitations for team members</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm">Role-based permissions (Organizer, Viewer)</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm">Team collaboration tools</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm">Activity logs and notifications</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact for Beta */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Want Early Access?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          If you need team management features for your club, contact us to join the beta program.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={() => window.open('mailto:support@padelzone.com?subject=Team Management Beta', '_blank')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'data' && (
              <Card className="border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black font-bold">
                    <Database className="w-5 h-5" style={{ color: '#0172fb' }} />
                    Data & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Data Export */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Data Export</h3>
                    <p className="text-gray-600 mb-4">
                      Export all your club data including events, players, and tournament history.
                    </p>
                    <Button
                      onClick={exportData}
                      variant="outline"
                      className="border-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Club Data
                    </Button>
                  </div>

                  <Separator />

                  {/* Data Import */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Data Import</h3>
                    <p className="text-gray-600 mb-4">
                      Import player data from CSV files or other tournament management systems.
                    </p>
                    <Button variant="outline" className="border-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </div>

                  <Separator />

                  {/* Security */}
                  <div>
                    <h3 className="settings-heading text-lg font-bold mb-4">Security</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800">Data Protection</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Your data is encrypted and securely stored. We never share your information with third parties.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="border-2 text-red-600 border-red-200 hover:bg-red-50">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-lg font-bold mb-4" style={{ color: '#DC2626 !important' }}>Danger Zone</h3>
                    <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                      <h4 className="font-medium text-red-800 mb-2">Delete Club</h4>
                      <p className="text-sm text-red-700 mb-4">
                        Permanently delete this club and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="outline" className="border-2 border-red-300 text-red-700 hover:bg-red-100">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Club
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
