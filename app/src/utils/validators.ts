import { GAME_CONFIG, VALIDATION_MESSAGES } from './constants';

/**
 * Validation utility functions
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED_FIELD };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_EMAIL };
  }
  
  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED_FIELD };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: string | number | null | undefined): ValidationResult {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED_FIELD };
  }
  
  return { isValid: true };
}

/**
 * Validate club name
 */
export function validateClubName(name: string): ValidationResult {
  const requiredCheck = validateRequired(name);
  if (!requiredCheck.isValid) return requiredCheck;
  
  if (name.trim().length < 2) {
    return { isValid: false, error: VALIDATION_MESSAGES.CLUB_NAME_TOO_SHORT };
  }
  
  return { isValid: true };
}

/**
 * Validate player name
 */
export function validatePlayerName(name: string): ValidationResult {
  const requiredCheck = validateRequired(name);
  if (!requiredCheck.isValid) return requiredCheck;
  
  if (name.trim().length < 2) {
    return { isValid: false, error: VALIDATION_MESSAGES.PLAYER_NAME_TOO_SHORT };
  }
  
  return { isValid: true };
}

/**
 * Validate score input
 */
export function validateScore(score: number | string): ValidationResult {
  const numScore = typeof score === 'string' ? parseInt(score, 10) : score;
  
  if (isNaN(numScore)) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_SCORE };
  }
  
  if (numScore < GAME_CONFIG.MIN_SCORE || numScore > GAME_CONFIG.MAX_SCORE) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_SCORE };
  }
  
  return { isValid: true };
}

/**
 * Validate number of courts
 */
export function validateCourts(courts: number): ValidationResult {
  if (courts < GAME_CONFIG.MIN_COURTS || courts > GAME_CONFIG.MAX_COURTS) {
    return { 
      isValid: false, 
      error: `Courts must be between ${GAME_CONFIG.MIN_COURTS} and ${GAME_CONFIG.MAX_COURTS}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate event configuration
 */
export function validateEventConfig(config: {
  name: string;
  courts: number;
  playerCount: number;
  roundMinutes?: number;
  pointsPerGame?: number;
}): ValidationResult {
  // Validate name
  const nameCheck = validateRequired(config.name);
  if (!nameCheck.isValid) return nameCheck;
  
  // Validate courts
  const courtsCheck = validateCourts(config.courts);
  if (!courtsCheck.isValid) return courtsCheck;
  
  // Validate player count vs courts
  const requiredPlayers = config.courts * GAME_CONFIG.MAX_PLAYERS_PER_COURT;
  if (config.playerCount < requiredPlayers) {
    return { 
      isValid: false, 
      error: `Need at least ${requiredPlayers} players for ${config.courts} courts` 
    };
  }
  
  // Validate round minutes (if provided)
  if (config.roundMinutes !== undefined) {
    if (config.roundMinutes < 1 || config.roundMinutes > 60) {
      return { 
        isValid: false, 
        error: 'Round minutes must be between 1 and 60' 
      };
    }
  }
  
  // Validate points per game (if provided)
  if (config.pointsPerGame !== undefined) {
    if (config.pointsPerGame < 1 || config.pointsPerGame > 100) {
      return { 
        isValid: false, 
        error: 'Points per game must be between 1 and 100' 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate ELO rating
 */
export function validateElo(elo: number): ValidationResult {
  if (elo < 0 || elo > 3000) {
    return { 
      isValid: false, 
      error: 'ELO rating must be between 0 and 3000' 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // URL is optional
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { 
      isValid: false, 
      error: 'Please enter a valid URL' 
    };
  }
}

/**
 * Batch validate multiple fields
 */
export function validateFields(validations: Array<() => ValidationResult>): ValidationResult {
  for (const validate of validations) {
    const result = validate();
    if (!result.isValid) {
      return result;
    }
  }
  
  return { isValid: true };
}

/**
 * Create a validation function for minimum length
 */
export function createMinLengthValidator(minLength: number, fieldName: string) {
  return (value: string): ValidationResult => {
    const requiredCheck = validateRequired(value);
    if (!requiredCheck.isValid) return requiredCheck;
    
    if (value.trim().length < minLength) {
      return { 
        isValid: false, 
        error: `${fieldName} must be at least ${minLength} characters` 
      };
    }
    
    return { isValid: true };
  };
}

/**
 * Create a validation function for maximum length
 */
export function createMaxLengthValidator(maxLength: number, fieldName: string) {
  return (value: string): ValidationResult => {
    if (value.length > maxLength) {
      return { 
        isValid: false, 
        error: `${fieldName} must be no more than ${maxLength} characters` 
      };
    }
    
    return { isValid: true };
  };
}
