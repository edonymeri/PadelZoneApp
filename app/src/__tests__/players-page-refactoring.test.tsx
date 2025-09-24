// src/__tests__/players-page-refactoring.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayersPageRefactored from '@/pages/PlayersPageRefactored';

// Create mock functions
const mockAddPlayer = vi.fn();
const mockDeletePlayer = vi.fn();
const mockUpdatePlayer = vi.fn();
const mockToast = vi.fn();

// Mock the hooks with proper vi.fn() functions
vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: vi.fn(() => ({
    addPlayer: mockAddPlayer,
    deletePlayer: mockDeletePlayer,
    updatePlayer: mockUpdatePlayer,
    allPlayers: [
      { id: '1', full_name: 'John Doe', elo: 1500 },
      { id: '2', full_name: 'Jane Smith', elo: 1600 },
      { id: '3', full_name: 'Alex Johnson', elo: 1400 }
    ],
    loading: false
  }))
}));

vi.mock('@/hooks/useEvent', () => ({
  useEvent: vi.fn(() => ({
    currentEvent: { id: 'event-1', name: 'Test Event' }
  }))
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast
  }))
}));

// Mock all the components
vi.mock('@/components/players/PlayersPageHeader', () => ({
  default: ({ playerCount, filteredCount, hasFilters }: any) => (
    <div data-testid="players-page-header">
      <span>Total: {playerCount}</span>
      <span>Filtered: {filteredCount}</span>
      <span>Has Filters: {hasFilters.toString()}</span>
    </div>
  )
}));

vi.mock('@/components/players/EventSelectionBanner', () => ({
  default: ({ currentEvent, playerCount }: any) => (
    <div data-testid="event-selection-banner">
      <span>Event: {currentEvent?.name || 'None'}</span>
      <span>Players: {playerCount}</span>
    </div>
  )
}));

vi.mock('@/components/players/AddPlayerForm', () => ({
  default: ({ newName, onAddPlayer, adding }: any) => (
    <div data-testid="add-player-form">
      <input 
        data-testid="player-name-input"
        value={newName}
        onChange={() => {}}
        placeholder="Player name"
      />
      <button 
        data-testid="add-player-button"
        onClick={onAddPlayer}
        disabled={adding}
      >
        {adding ? 'Adding...' : 'Add Player'}
      </button>
    </div>
  )
}));

vi.mock('@/components/players/PlayerFilters', () => ({
  default: ({ 
    searchTerm, 
    selectedGroup, 
    sortBy, 
    onClearFilters, 
    playerCount, 
    totalCount 
  }: any) => (
    <div data-testid="player-filters">
      <span>Search: {searchTerm}</span>
      <span>Group: {selectedGroup}</span>
      <span>Sort: {sortBy}</span>
      <span>Showing: {playerCount}/{totalCount}</span>
      <button data-testid="clear-filters" onClick={onClearFilters}>
        Clear Filters
      </button>
    </div>
  )
}));

vi.mock('@/components/players/PlayersList', () => ({
  default: ({ players, onDeletePlayer, onEditPlayer }: any) => (
    <div data-testid="players-list">
      {players.map((player: any) => (
        <div key={player.id} data-testid={`player-${player.id}`}>
          <span>{player.full_name}</span>
          <span>{player.elo} ELO</span>
          <button 
            data-testid={`edit-${player.id}`}
            onClick={() => onEditPlayer(player.id, 'New Name')}
          >
            Edit
          </button>
          <button 
            data-testid={`delete-${player.id}`}
            onClick={() => onDeletePlayer(player.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}));

describe('PlayersPage Refactoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main sections correctly', () => {
    render(<PlayersPageRefactored />);
    
    // Check that all major components are rendered
    expect(screen.getByTestId('players-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('event-selection-banner')).toBeInTheDocument();
    expect(screen.getByTestId('add-player-form')).toBeInTheDocument();
    expect(screen.getByTestId('player-filters')).toBeInTheDocument();
    expect(screen.getByTestId('players-list')).toBeInTheDocument();
  });

  it('passes correct props to header component', () => {
    render(<PlayersPageRefactored />);
    
    const header = screen.getByTestId('players-page-header');
    expect(header).toHaveTextContent('Total: 3');
    expect(header).toHaveTextContent('Filtered: 3');
    expect(header).toHaveTextContent('Has Filters: false');
  });

  it('passes correct props to event banner', () => {
    render(<PlayersPageRefactored />);
    
    const banner = screen.getByTestId('event-selection-banner');
    expect(banner).toHaveTextContent('Event: Test Event');
    expect(banner).toHaveTextContent('Players: 3');
  });

  it('displays all players correctly', () => {
    render(<PlayersPageRefactored />);
    
    expect(screen.getByTestId('player-1')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('player-1')).toHaveTextContent('1500 ELO');
    expect(screen.getByTestId('player-2')).toHaveTextContent('Jane Smith');
    expect(screen.getByTestId('player-2')).toHaveTextContent('1600 ELO');
    expect(screen.getByTestId('player-3')).toHaveTextContent('Alex Johnson');
    expect(screen.getByTestId('player-3')).toHaveTextContent('1400 ELO');
  });

  it('shows default filter state correctly', () => {
    render(<PlayersPageRefactored />);
    
    const filters = screen.getByTestId('player-filters');
    expect(filters).toHaveTextContent('Search: ');
    expect(filters).toHaveTextContent('Group: all');
    expect(filters).toHaveTextContent('Sort: name');
    expect(filters).toHaveTextContent('Showing: 3/3');
  });

  it('handles clear filters functionality', () => {
    render(<PlayersPageRefactored />);
    
    const clearButton = screen.getByTestId('clear-filters');
    fireEvent.click(clearButton);
    
    // The filters should reset to default state
    const filters = screen.getByTestId('player-filters');
    expect(filters).toHaveTextContent('Group: all');
    expect(filters).toHaveTextContent('Sort: name');
  });

  it('handles player editing', async () => {
    render(<PlayersPageRefactored />);
    
    const editButton = screen.getByTestId('edit-1');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(mockUpdatePlayer).toHaveBeenCalledWith('1', { full_name: 'New Name' });
    });
  });

  it('handles player deletion', async () => {
    render(<PlayersPageRefactored />);
    
    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockDeletePlayer).toHaveBeenCalledWith('1');
    });
  });

  it('shows loading state correctly', () => {
    // Re-mock the hook for this specific test
    const { usePlayer } = require('@/hooks/usePlayer');
    usePlayer.mockReturnValueOnce({
      addPlayer: vi.fn(),
      deletePlayer: vi.fn(),
      updatePlayer: vi.fn(),
      allPlayers: [],
      loading: true
    });

    render(<PlayersPageRefactored />);
    
    expect(screen.getByText('Loading players...')).toBeInTheDocument();
    expect(screen.queryByTestId('players-list')).not.toBeInTheDocument();
  });

  it('uses correct responsive layout classes', () => {
    render(<PlayersPageRefactored />);
    
    // Check for responsive grid layout
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('maintains proper component composition', () => {
    render(<PlayersPageRefactored />);
    
    // Verify the layout structure
    const mainContainer = document.querySelector('.min-h-screen.bg-gray-50');
    expect(mainContainer).toBeInTheDocument();
    
    const contentContainer = document.querySelector('.max-w-6xl.mx-auto');
    expect(contentContainer).toBeInTheDocument();
  });
});

describe('PlayersPage Component Integration', () => {
  it('integrates all components without breaking', () => {
    render(<PlayersPageRefactored />);
    
    // Test that no errors are thrown during render
    expect(screen.getByTestId('players-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('event-selection-banner')).toBeInTheDocument();
    expect(screen.getByTestId('add-player-form')).toBeInTheDocument();
    expect(screen.getByTestId('player-filters')).toBeInTheDocument();
    expect(screen.getByTestId('players-list')).toBeInTheDocument();
  });

  it('handles empty player state gracefully', () => {
    // Re-mock the hook for this specific test
    const { usePlayer } = require('@/hooks/usePlayer');
    usePlayer.mockReturnValueOnce({
      addPlayer: vi.fn(),
      deletePlayer: vi.fn(),
      updatePlayer: vi.fn(),
      allPlayers: [],
      loading: false
    });

    render(<PlayersPageRefactored />);
    
    const header = screen.getByTestId('players-page-header');
    expect(header).toHaveTextContent('Total: 0');
    expect(header).toHaveTextContent('Filtered: 0');
  });
});

describe('PlayersPage Refactoring Benefits', () => {
  it('demonstrates component separation', () => {
    render(<PlayersPageRefactored />);
    
    // Each major section is now a separate component
    const components = [
      'players-page-header',
      'event-selection-banner', 
      'add-player-form',
      'player-filters',
      'players-list'
    ];
    
    components.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('maintains functional coherence', () => {
    render(<PlayersPageRefactored />);
    
    // All players are still displayed
    expect(screen.getByTestId('player-1')).toBeInTheDocument();
    expect(screen.getByTestId('player-2')).toBeInTheDocument();
    expect(screen.getByTestId('player-3')).toBeInTheDocument();
    
    // Form functionality is preserved
    expect(screen.getByTestId('add-player-form')).toBeInTheDocument();
    
    // Filter functionality is preserved  
    expect(screen.getByTestId('player-filters')).toBeInTheDocument();
  });
});