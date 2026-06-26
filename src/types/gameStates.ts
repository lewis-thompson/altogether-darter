// Game state types for each game variant

// X01 - Countdown from a starting score
export interface X01GameState {
  startingScore: number // 301, 501, 701, etc.
  roundsPlayed: number
}

// Around The World - Hit consecutive numbers with specific areas
export interface AroundTheWorldGameState {
  roundsPlayed: number
  currentSegment: number // 1-20, Bull
}

// Cricket - Score points on 15-20 and bull
export interface CricketGameState {
  roundsPlayed: number
  closedNumbers: Set<number> // Which numbers are closed (15-20, bull)
}

// Every Number - Hit every number on the board
export interface EveryNumberGameState {
  roundsPlayed: number
  targetNumbers: number[] // Numbers to hit (1-20, bull)
}

// Score Killer - Accumulate total score, highest score is "killer"
export interface ScoreKillerGameState {
  roundsPlayed: number
  killerThreshold: number // Score at which a player becomes "killer"
}

// Doubles - Only doubles and bull count
export interface DoublesGameState {
  roundsPlayed: number
}

// Shanghai - Hit each number once per round (1-7, then 8-15, then 16-20 + bull)
export interface ShanghaiGameState {
  roundsPlayed: number
  currentRound: number // 1-3
  roundNumbers: number[][] // Numbers for each round
}

// Splitscore - Teams compete with alternating scoring
export interface SplitscoreGameState {
  roundsPlayed: number
  teamsCount: number
}

// Generic player round score
export interface PlayerRoundScore {
  playerId: number
  round: number
  score: number
  hits: string[] // e.g., ['D20', 'T15', 'D25']
}

// Game result summary
export interface GameResult {
  gameType: string
  winner: {
    id: number
    name: string
  }
  players: Array<{
    id: number
    name: string
    finalScore: number
    position: number
  }>
  totalRounds: number
  totalHits: number
  totalMisses: number
  finishedAt: Date
}
