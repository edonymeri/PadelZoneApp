// src/__tests__/settings-refactoring.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsNavigation from '@/components/settings/SettingsNavigation';
import ClubSettingsSection from '@/components/settings/sections/ClubSettingsSection';

// Mock the useToast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Settings Refactoring', () => {
  it('renders settings navigation component', () => {
    const mockOnTabChange = vi.fn();
    
    render(
      <SettingsNavigation 
        activeTab="club" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    // Check that navigation items are rendered
    expect(screen.getByText('Club Info')).toBeTruthy();
    expect(screen.getByText('Scoring')).toBeTruthy();
    expect(screen.getByText('Data & Privacy')).toBeTruthy();
  });

  it('renders club settings section without club selected', () => {
    const mockSetters = {
      clubId: '',
      clubSettings: { 
        id: '', 
        name: '', 
        timezone: 'UTC',
        default_round_minutes: 12,
        default_courts: 4,
        primary_color: '#0172fb'
      },
      setClubSettings: vi.fn(),
      saving: false,
      onSave: vi.fn(),
      clubsList: [],
      clubNameDraft: '',
      setClubNameDraft: vi.fn(),
      loadingClubs: false,
      isSwitchOpen: false,
      setIsSwitchOpen: vi.fn(),
      onLoadClubsList: vi.fn(),
      onCreateClub: vi.fn(),
      onSelectClub: vi.fn()
    };
    
    render(<ClubSettingsSection {...mockSetters} />);
    
    // Should show select club message when no club is selected
    expect(screen.getByText('You need to select a club before you can configure settings.')).toBeTruthy();
  });

  it('club settings section shows form when club is selected', () => {
    const mockSetters = {
      clubId: 'test-club-id',
      clubSettings: { 
        id: 'test-club-id', 
        name: 'Test Club', 
        timezone: 'UTC',
        default_round_minutes: 12,
        default_courts: 4,
        primary_color: '#0172fb'
      },
      setClubSettings: vi.fn(),
      saving: false,
      onSave: vi.fn(),
      clubsList: [],
      clubNameDraft: '',
      setClubNameDraft: vi.fn(),
      loadingClubs: false,
      isSwitchOpen: false,
      setIsSwitchOpen: vi.fn(),
      onLoadClubsList: vi.fn(),
      onCreateClub: vi.fn(),
      onSelectClub: vi.fn()
    };
    
    render(<ClubSettingsSection {...mockSetters} />);
    
    // Should show club settings form when club is selected
    expect(screen.getByText('Club Settings')).toBeTruthy();
    expect(screen.getByDisplayValue('Test Club')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });
});