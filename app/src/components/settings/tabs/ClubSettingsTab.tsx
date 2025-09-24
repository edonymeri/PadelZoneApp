// src/components/settings/tabs/ClubSettingsTab.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import SettingsFormSection from "../shared/SettingsFormSection";

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

interface ClubSettingsTabProps {
  clubId: string;
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

export default function ClubSettingsTab({ clubId }: ClubSettingsTabProps) {
  const { toast } = useToast();
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClubSettings();
  }, [clubId]);

  const loadClubSettings = async () => {
    if (!clubId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      setClubSettings(data);
    } catch (error) {
      console.error('Failed to load club settings:', error);
      toast({
        variant: "destructive",
        title: "Failed to load club settings",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveClubSettings = async () => {
    if (!clubId || !clubSettings) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update(clubSettings)
        .eq('id', clubId);

      if (error) throw error;
      
      toast({
        title: "Club settings saved",
        description: "Your club information has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save club settings:', error);
      toast({
        variant: "destructive",
        title: "Failed to save club settings",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateClubSettings = (field: keyof ClubSettings, value: any) => {
    setClubSettings(prev => prev ? { ...prev, [field]: value } : null);
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

  if (!clubSettings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No club settings found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <SettingsFormSection
        title="Basic Information"
        description="Configure your club's basic details and contact information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club-name" className="text-sm font-medium text-gray-700">
              Club Name
            </Label>
            <Input
              id="club-name"
              value={clubSettings.name}
              onChange={(e) => updateClubSettings('name', e.target.value)}
              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="club-email" className="text-sm font-medium text-gray-700">
              Contact Email
            </Label>
            <Input
              id="club-email"
              type="email"
              value={clubSettings.contact_email || ''}
              onChange={(e) => updateClubSettings('contact_email', e.target.value)}
              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club-phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="club-phone"
              value={clubSettings.phone || ''}
              onChange={(e) => updateClubSettings('phone', e.target.value)}
              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="club-website" className="text-sm font-medium text-gray-700">
              Website
            </Label>
            <Input
              id="club-website"
              value={clubSettings.website || ''}
              onChange={(e) => updateClubSettings('website', e.target.value)}
              placeholder="https://..."
              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="club-address" className="text-sm font-medium text-gray-700">
            Address
          </Label>
          <Textarea
            id="club-address"
            value={clubSettings.address || ''}
            onChange={(e) => updateClubSettings('address', e.target.value)}
            rows={2}
            className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="club-description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="club-description"
            value={clubSettings.description || ''}
            onChange={(e) => updateClubSettings('description', e.target.value)}
            rows={3}
            placeholder="Tell people about your club..."
            className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </SettingsFormSection>

      {/* Regional Settings */}
      <SettingsFormSection
        title="Regional Settings"
        description="Configure timezone and regional preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club-timezone" className="text-sm font-medium text-gray-700">
              Timezone
            </Label>
            <Select
              value={clubSettings.timezone}
              onValueChange={(value) => updateClubSettings('timezone', value)}
            >
              <SelectTrigger className="bg-white border-gray-300">
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
      </SettingsFormSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveClubSettings}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Club Settings"}
        </Button>
      </div>
    </div>
  );
}