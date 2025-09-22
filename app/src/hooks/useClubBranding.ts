// Custom hook for club branding configuration
import { useState, useEffect } from 'react';
import { ClubSettingsService } from '@/services/api/clubSettingsService';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/clubSettings';
import type { BrandingConfig } from '@/lib/clubSettings';

export function useClubBranding(clubId?: string) {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(DEFAULT_BRANDING_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) {
      setBrandingConfig(DEFAULT_BRANDING_CONFIG);
      return;
    }

    const loadBrandingConfig = async () => {
      setLoading(true);
      try {
        const config = await ClubSettingsService.getBrandingConfig(clubId);
        setBrandingConfig(config);
      } catch (error) {
        console.error('Failed to load branding config:', error);
        setBrandingConfig(DEFAULT_BRANDING_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadBrandingConfig();
  }, [clubId]);

  // Utility functions for branding
  const getCourtName = (courtNumber: number): string => {
    if (brandingConfig.useCustomCourtNames && brandingConfig.customCourtNames[courtNumber - 1]) {
      return brandingConfig.customCourtNames[courtNumber - 1];
    }
    
    // Default naming logic
    if (courtNumber === 1) {
      return 'Winners Court';
    }
    return `Court ${courtNumber}`;
  };

  const getEventTerminology = (): string => {
    return brandingConfig.eventTerminology || 'Tournament';
  };

  const getPlayerTerminology = (): string => {
    return brandingConfig.playerTerminology || 'Player';
  };

  return {
    brandingConfig,
    loading,
    getCourtName,
    getEventTerminology,
    getPlayerTerminology
  };
}