
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
