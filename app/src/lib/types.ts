
export type UUID = string;

export type Player = {
  id: UUID;
  full_name: string;
  elo: number;
};

export type MatchSide = [UUID, UUID]; // two players
export type CourtMatch = {
  court_num: number;
  teamA: MatchSide;
  teamB: MatchSide;
  scoreA?: number;
  scoreB?: number;
};

export type RoundState = {
  roundNum: number;
  courts: CourtMatch[];
};

export type Movement = "PROMOTE" | "DEFEND_C1" | "STAY" | "DROP";

export type RoundPoints = {
  playerId: UUID;
  points: number;
  court: number;
  movement: Movement;
};

export type EngineOptions = {
  antiRepeatWindow: number; // e.g., 3
};

// Event format types
export type EventFormat = "winners-court" | "americano";
export type AmericanoVariant = "individual" | "team";

// Team structure for Team Americano
export type Team = {
  id: UUID;
  event_id: UUID;
  player1_id: UUID;
  player2_id: UUID;
  name?: string;
};

// Americano-specific pairing information
export type AmericanoPartnerHistory = {
  playerId: UUID;
  partners: Set<UUID>;
  opponents: Set<UUID>;
  restCount: number;
  gamesPlayed: number;
};

export type AmericanoPairingOptions = {
  format: EventFormat;
  variant?: AmericanoVariant;
  antiRepeatWindow: number;
  restBalancing: boolean;
};
