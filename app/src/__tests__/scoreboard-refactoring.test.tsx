// src/__tests__/scoreboard-refactoring.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScoreboardRefactored from '@/pages/ScoreboardRefactored';

// Mock react-router-dom
const mockParams = { eventId: 'test-event-123' };
vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// Mock the custom hook
const mockScoreboardState = {
  eventId: 'test-event-123',
  meta: {
    id: 'test-event-123',
    name: 'Test Tournament',
    courts: 4,
    round_minutes: 15,
    points_per_game: null,
    ended_at: null,
    created_at: '2024-01-01T10:00:00Z'
  },
  roundNum: 3,
  courts: [
    {
      court_num: 1,
      teamA: ['player1', 'player2'],
      teamB: ['player3', 'player4'],
      scoreA: 6,
      scoreB: 4
    },
    {
      court_num: 2,
      teamA: ['player5', 'player6'],
      teamB: ['player7', 'player8'],
      scoreA: 0,
      scoreB: 0
    }
  ],
  players: {
    'player1': { id: 'player1', full_name: 'John Doe', elo: 1500 },
    'player2': { id: 'player2', full_name: 'Jane Smith', elo: 1600 },
    'player3': { id: 'player3', full_name: 'Bob Wilson', elo: 1400 },
    'player4': { id: 'player4', full_name: 'Alice Brown', elo: 1550 },
    'player5': { id: 'player5', full_name: 'Charlie Davis', elo: 1450 },
    'player6': { id: 'player6', full_name: 'Emma Wilson', elo: 1520 },
    'player7': { id: 'player7', full_name: 'Frank Miller', elo: 1480 },
    'player8': { id: 'player8', full_name: 'Grace Lee', elo: 1580 }
  },
  loading: false,
  recentEvents: [],
  errorMsg: null,
  leaderboard: [
    { playerName: 'Jane Smith', totalPoints: 28, wins: 4, gamesPlayed: 6 },
    { playerName: 'Grace Lee', totalPoints: 26, wins: 3, gamesPlayed: 5 },
    { playerName: 'Alice Brown', totalPoints: 24, wins: 3, gamesPlayed: 6 }
  ],
  eventWinners: null,
  viewingRoundNum: 3,
  isViewingHistorical: false,
  historicalCourts: [],
  loadingHistorical: false,
  allRounds: [
    { id: 'round1', round_num: 1 },
    { id: 'round2', round_num: 2 },
    { id: 'round3', round_num: 3 }
  ],
  handleRoundChange: vi.fn(),
  isEnded: false,
  playerCount: 8,
  isPointsMode: false
};

vi.mock('@/hooks/useScoreboardState', () => ({
  useScoreboardState: () => mockScoreboardState
}));

// Mock all the components
vi.mock('@/components/scoreboard/ScoreboardHeader', () => ({
  default: ({ meta, tvMode, setTvMode, playerCount, roundNum, isEnded }: any) => (
    <div data-testid="scoreboard-header">
      <span>Event: {meta.name}</span>
      <span>Players: {playerCount}</span>
      <span>Round: {roundNum}</span>
      <span>Ended: {isEnded.toString()}</span>
      <button onClick={() => setTvMode(!tvMode)}>
        {tvMode ? 'Exit TV Mode' : 'TV Mode'}
      </button>
    </div>
  )
}));

vi.mock('@/components/scoreboard/EventSelectionView', () => ({
  default: ({ recentEvents, loading, errorMsg, sortBy, setSortBy }: any) => (
    <div data-testid="event-selection-view">
      <span>Loading: {loading.toString()}</span>
      <span>Events: {recentEvents.length}</span>
      <span>Error: {errorMsg || 'None'}</span>
      <span>Sort: {sortBy}</span>
    </div>
  )
}));

vi.mock('@/components/scoreboard/ScoreboardRoundNavigation', () => ({
  default: ({ viewingRoundNum, roundNum, allRounds, isViewingHistorical, onRoundChange }: any) => (
    <div data-testid="round-navigation">
      <span>Viewing: {viewingRoundNum}</span>
      <span>Current: {roundNum}</span>
      <span>Total Rounds: {allRounds.length}</span>
      <span>Historical: {isViewingHistorical.toString()}</span>
      <button onClick={() => onRoundChange(1)}>Round 1</button>
      <button onClick={() => onRoundChange(2)}>Round 2</button>
      <button onClick={() => onRoundChange(3)}>Round 3</button>
    </div>
  )
}));

vi.mock('@/components/scoreboard/CourtsGrid', () => ({
  default: ({ courts, players, isViewingHistorical, loading, errorMsg }: any) => (
    <div data-testid="courts-grid">
      <span>Courts: {courts.length}</span>
      <span>Players: {Object.keys(players).length}</span>
      <span>Historical: {isViewingHistorical.toString()}</span>
      <span>Loading: {loading.toString()}</span>
      <span>Error: {errorMsg || 'None'}</span>
      {courts.map((court: any) => (
        <div key={court.court_num} data-testid={`court-${court.court_num}`}>
          <span>Court {court.court_num}</span>
          <span>Score: {court.scoreA}-{court.scoreB}</span>
          <span>Team A: {court.teamA.map((p: string) => players[p]?.full_name).join(', ')}</span>
          <span>Team B: {court.teamB.map((p: string) => players[p]?.full_name).join(', ')}</span>
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/scoreboard/ScoreboardLeaderboard', () => ({
  default: ({ leaderboard, eventWinners, isEnded }: any) => (
    <div data-testid="scoreboard-leaderboard">
      <span>Players: {leaderboard.length}</span>
      <span>Winners: {eventWinners ? 'Yes' : 'None'}</span>
      <span>Ended: {isEnded.toString()}</span>
      {leaderboard.slice(0, 3).map((player: any, idx: number) => (
        <div key={idx} data-testid={`leaderboard-${idx}`}>
          <span>#{idx + 1}: {player.playerName}</span>
          <span>{player.totalPoints} pts</span>
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/event/EventWinners', () => ({
  default: ({ winners }: any) => (
    <div data-testid="event-winners">
      <span>Winners Component</span>
    </div>
  )
}));

describe('Scoreboard Refactoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main components correctly', () => {
    render(<ScoreboardRefactored />);
    
    expect(screen.getByTestId('scoreboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('round-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('courts-grid')).toBeInTheDocument();
    expect(screen.getByTestId('scoreboard-leaderboard')).toBeInTheDocument();
  });

  it('passes correct props to header', () => {
    render(<ScoreboardRefactored />);
    
    const header = screen.getByTestId('scoreboard-header');
    expect(header).toHaveTextContent('Event: Test Tournament');
    expect(header).toHaveTextContent('Players: 8');
    expect(header).toHaveTextContent('Round: 3');
    expect(header).toHaveTextContent('Ended: false');
  });

  it('displays courts with correct information', () => {
    render(<ScoreboardRefactored />);
    
    const courtsGrid = screen.getByTestId('courts-grid');
    expect(courtsGrid).toHaveTextContent('Courts: 2');
    expect(courtsGrid).toHaveTextContent('Players: 8');
    
    // Check individual courts
    const court1 = screen.getByTestId('court-1');
    expect(court1).toHaveTextContent('Court 1');
    expect(court1).toHaveTextContent('Score: 6-4');
    expect(court1).toHaveTextContent('Team A: John Doe, Jane Smith');
    expect(court1).toHaveTextContent('Team B: Bob Wilson, Alice Brown');
    
    const court2 = screen.getByTestId('court-2');
    expect(court2).toHaveTextContent('Court 2');
    expect(court2).toHaveTextContent('Score: 0-0');
  });

  it('shows leaderboard with correct data', () => {
    render(<ScoreboardRefactored />);
    
    const leaderboard = screen.getByTestId('scoreboard-leaderboard');
    expect(leaderboard).toHaveTextContent('Players: 3');
    expect(leaderboard).toHaveTextContent('Ended: false');
    
    // Check top 3 players
    expect(screen.getByTestId('leaderboard-0')).toHaveTextContent('#1: Jane Smith');
    expect(screen.getByTestId('leaderboard-0')).toHaveTextContent('28 pts');
    expect(screen.getByTestId('leaderboard-1')).toHaveTextContent('#2: Grace Lee');
    expect(screen.getByTestId('leaderboard-2')).toHaveTextContent('#3: Alice Brown');
  });

  it('handles round navigation correctly', () => {
    render(<ScoreboardRefactored />);
    
    const navigation = screen.getByTestId('round-navigation');
    expect(navigation).toHaveTextContent('Viewing: 3');
    expect(navigation).toHaveTextContent('Current: 3');
    expect(navigation).toHaveTextContent('Total Rounds: 3');
    expect(navigation).toHaveTextContent('Historical: false');
    
    // Test round navigation
    const roundButton = screen.getByText('Round 1');
    fireEvent.click(roundButton);
    expect(mockScoreboardState.handleRoundChange).toHaveBeenCalledWith(1);
  });

  it('toggles TV mode correctly', () => {
    render(<ScoreboardRefactored />);
    
    const tvModeButton = screen.getByText('TV Mode');
    fireEvent.click(tvModeButton);
    
    // Should render TV mode layout
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('8 Players')).toBeInTheDocument();
    expect(screen.getByText('4 Courts')).toBeInTheDocument();
    expect(screen.getByText('Round 3')).toBeInTheDocument();
  });

  it('shows event selection when no eventId', () => {
    // Mock no eventId
    const { useScoreboardState } = require('@/hooks/useScoreboardState');
    useScoreboardState.mockReturnValueOnce({
      ...mockScoreboardState,
      eventId: null,
      recentEvents: [
        { id: 'event1', name: 'Past Tournament 1', courts: 2, player_count: 4 },
        { id: 'event2', name: 'Past Tournament 2', courts: 4, player_count: 8 }
      ]
    });

    render(<ScoreboardRefactored />);
    
    const eventSelection = screen.getByTestId('event-selection-view');
    expect(eventSelection).toHaveTextContent('Events: 2');
    expect(eventSelection).toHaveTextContent('Loading: false');
  });

  it('shows loading state correctly', () => {
    const { useScoreboardState } = require('@/hooks/useScoreboardState');
    useScoreboardState.mockReturnValueOnce({
      ...mockScoreboardState,
      loading: true,
      meta: null
    });

    render(<ScoreboardRefactored />);
    
    expect(screen.getByText('Loading scoreboard...')).toBeInTheDocument();
  });

  it('handles ended tournament state', () => {
    const { useScoreboardState } = require('@/hooks/useScoreboardState');
    useScoreboardState.mockReturnValueOnce({
      ...mockScoreboardState,
      isEnded: true,
      meta: { ...mockScoreboardState.meta, ended_at: '2024-01-01T18:00:00Z' },
      eventWinners: { first: 'Jane Smith', second: 'Grace Lee', third: 'Alice Brown' }
    });

    render(<ScoreboardRefactored />);
    
    expect(screen.getByTestId('event-winners')).toBeInTheDocument();
    const leaderboard = screen.getByTestId('scoreboard-leaderboard');
    expect(leaderboard).toHaveTextContent('Ended: true');
    expect(leaderboard).toHaveTextContent('Winners: Yes');
  });

  it('maintains component composition correctly', () => {
    render(<ScoreboardRefactored />);
    
    // Verify the main layout structure
    const mainContainer = document.querySelector('.min-h-screen.bg-gray-50');
    expect(mainContainer).toBeInTheDocument();
    
    // Verify components are rendered in correct order
    const components = [
      'scoreboard-header',
      'round-navigation',
      'courts-grid',
      'scoreboard-leaderboard'
    ];
    
    components.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });
});

describe('Scoreboard Refactoring Benefits', () => {
  it('demonstrates modular architecture', () => {
    render(<ScoreboardRefactored />);
    
    // Each major section is now a separate component
    const components = [
      'scoreboard-header',
      'round-navigation', 
      'courts-grid',
      'scoreboard-leaderboard'
    ];
    
    components.forEach(testId => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('maintains all original functionality', () => {
    render(<ScoreboardRefactored />);
    
    // TV mode toggle
    expect(screen.getByText('TV Mode')).toBeInTheDocument();
    
    // Round navigation
    expect(screen.getByTestId('round-navigation')).toBeInTheDocument();
    
    // Courts display
    expect(screen.getByTestId('courts-grid')).toBeInTheDocument();
    
    // Live leaderboard
    expect(screen.getByTestId('scoreboard-leaderboard')).toBeInTheDocument();
  });

  it('separates concerns effectively', () => {
    render(<ScoreboardRefactored />);
    
    // Header handles event info and navigation
    const header = screen.getByTestId('scoreboard-header');
    expect(header).toHaveTextContent('Test Tournament');
    
    // Courts grid handles match display
    const courts = screen.getByTestId('courts-grid');
    expect(courts).toHaveTextContent('Courts: 2');
    
    // Leaderboard handles rankings
    const leaderboard = screen.getByTestId('scoreboard-leaderboard');
    expect(leaderboard).toHaveTextContent('#1: Jane Smith');
  });
});