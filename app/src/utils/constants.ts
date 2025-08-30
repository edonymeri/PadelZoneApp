// Brand colors
export const BRAND_COLORS = {
  primary: '#0172FB',
  secondary1: '#01CBFC',
  secondary2: '#1F2354',
} as const;

// Game configuration
export const GAME_CONFIG = {
  DEFAULT_ELO: 1000,
  MAX_COURTS: 16,
  MIN_COURTS: 1,
  ANTI_REPEAT_WINDOW: 3,
  MAX_PLAYERS_PER_COURT: 4,
  MIN_PLAYERS_FOR_EVENT: 4,
  DEFAULT_ROUND_MINUTES: 12,
  MAX_SCORE: 99,
  MIN_SCORE: 0,
} as const;

// UI constants
export const UI_CONFIG = {
  REFRESH_INTERVAL: 5000, // 5 seconds
  DEBOUNCE_DELAY: 400,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  INVALID_SCORE: 'Score must be between 0 and 99',
  NOT_ENOUGH_PLAYERS: 'Not enough players for this number of courts',
  TOO_MANY_COURTS: 'Too many courts for the number of players',
  CLUB_NAME_TOO_SHORT: 'Club name must be at least 2 characters',
  PLAYER_NAME_TOO_SHORT: 'Player name must be at least 2 characters',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  CLUBS: '/',
  PLAYERS: '/players',
  EVENTS: '/events',
  EVENT_CONTROL: '/event/:eventId',
  SCOREBOARD: '/scoreboard',
  SCOREBOARD_EVENT: '/scoreboard/:eventId',
  PLAYER_PROFILE: '/player/:playerId',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  CLUB_ID: 'clubId',
  THEME: 'theme',
  USER_PREFERENCES: 'userPreferences',
} as const;

// API endpoints (if needed for external APIs)
export const API_ENDPOINTS = {
  // Add any external API endpoints here
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
  SCORE_UPDATED: 'Score updated successfully',
  PLAYER_ADDED: 'Player added successfully',
  PLAYER_REMOVED: 'Player removed successfully',
} as const;
