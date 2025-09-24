// src/components/settings/sections/ClubSettingsSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Save, Globe } from "lucide-react";

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'America/Denver', 'America/Toronto', 'America/Mexico_City', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney'
];

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

interface ClubSettingsSectionProps {
  clubId: string;
  clubSettings: ClubSettings;
  setClubSettings: React.Dispatch<React.SetStateAction<ClubSettings>>;
  saving: boolean;
  onSave: () => Promise<boolean>;
  clubsList: Array<{ id: string; name: string; created_at?: string }>;
  clubNameDraft: string;
  setClubNameDraft: React.Dispatch<React.SetStateAction<string>>;
  loadingClubs: boolean;
  isSwitchOpen: boolean;
  setIsSwitchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onLoadClubsList: () => Promise<void>;
  onCreateClub: () => Promise<void>;
  onSelectClub: (id: string, name: string) => void;
}

export default function ClubSettingsSection({ 
  clubId,
  clubSettings, 
  setClubSettings, 
  saving, 
  onSave,
  clubsList,
  clubNameDraft,
  setClubNameDraft,
  loadingClubs,
  isSwitchOpen,
  setIsSwitchOpen,
  onLoadClubsList,
  onCreateClub,
  onSelectClub
}: ClubSettingsSectionProps) {
  
  if (!clubId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Select or Create Club
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You need to select a club before you can configure settings.
            </p>
            
            <Dialog open={isSwitchOpen} onOpenChange={setIsSwitchOpen}>
              <DialogTrigger asChild>
                <Button onClick={onLoadClubsList}>
                  Select Club
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select or Create Club</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-club-name">Create New Club</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="new-club-name"
                        placeholder="Club name"
                        value={clubNameDraft}
                        onChange={(e) => setClubNameDraft(e.target.value)}
                      />
                      <Button 
                        onClick={onCreateClub} 
                        disabled={!clubNameDraft.trim() || loadingClubs}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                  
                  {clubsList.length > 0 && (
                    <div>
                      <Label>Or Select Existing Club</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {clubsList.map((club) => (
                          <Button
                            key={club.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => onSelectClub(club.id, club.name)}
                          >
                            {club.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
            <Building2 className="w-6 h-6 mr-2" />
            Club Settings
          </h1>
          <p className="text-gray-600">Manage your club's basic information and preferences</p>
        </div>
        <Button onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="club-name">Club Name *</Label>
            <Input
              id="club-name"
              value={clubSettings.name}
              onChange={(e) => setClubSettings(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter club name"
            />
          </div>
          
          <div>
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={clubSettings.contact_email || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="contact@club.com"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={clubSettings.phone || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={clubSettings.website || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://club.com"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={clubSettings.address || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Club Street, City, State, Country"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={clubSettings.description || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell us about your club..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Operational Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={clubSettings.timezone || 'UTC'} 
              onValueChange={(value) => setClubSettings(prev => ({ ...prev, timezone: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="round-minutes">Default Round Minutes</Label>
            <Input
              id="round-minutes"
              type="number"
              min="5"
              max="30"
              value={clubSettings.default_round_minutes || 12}
              onChange={(e) => setClubSettings(prev => ({ 
                ...prev, 
                default_round_minutes: parseInt(e.target.value) || 12 
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="default-courts">Default Courts</Label>
            <Input
              id="default-courts"
              type="number"
              min="1"
              max="20"
              value={clubSettings.default_courts || 4}
              onChange={(e) => setClubSettings(prev => ({ 
                ...prev, 
                default_courts: parseInt(e.target.value) || 4 
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="points-per-game">Default Points Per Game</Label>
            <Input
              id="points-per-game"
              type="number"
              min="10"
              max="50"
              value={clubSettings.default_points_per_game || ''}
              onChange={(e) => setClubSettings(prev => ({ 
                ...prev, 
                default_points_per_game: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Leave empty for time-based"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              value={clubSettings.logo_url || ''}
              onChange={(e) => setClubSettings(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="md:col-span-1"></div>
          
          <div>
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex space-x-2">
              <Input
                id="primary-color"
                type="color"
                value={clubSettings.primary_color || '#0172fb'}
                onChange={(e) => setClubSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-16"
              />
              <Input
                value={clubSettings.primary_color || '#0172fb'}
                onChange={(e) => setClubSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                placeholder="#0172fb"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex space-x-2">
              <Input
                id="secondary-color"
                type="color"
                value={clubSettings.secondary_color || '#01CBFC'}
                onChange={(e) => setClubSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="w-16"
              />
              <Input
                value={clubSettings.secondary_color || '#01CBFC'}
                onChange={(e) => setClubSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                placeholder="#01CBFC"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}