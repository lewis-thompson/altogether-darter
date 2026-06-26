// Player types
export type PlayerStatus = 'alive' | 'out-recovery' | 'dead-buyback' | 'dead'

export interface Player {
  id: number
  name: string
  selectedNumber: number | null
}

export interface GamePlayer {
  playerNumber: number
  score: number
  targetScore: number
}

// Game types
export interface GameState {
  players: Player[]
  bullseyeBuyback: boolean
  bullseyeRounds: number | null
  killerThreshold: number
}

export interface GameCompleteState {
  winner: Player
  winnerPoints: number
  totalPlayers: number
  totalRounds: number
  totalAttempts: number
  totalHits: number
  totalMisses: number
  bullseyeBuybackEnabled: boolean
  bullseyeRounds: number | null
  finalStandings: Array<{
    id: number
    name: string
    selectedNumber: number | null
    points: number
    status: PlayerStatus
  }>
}

// User types
export interface User {
  uid: string
  displayName: string
  email: string
  createdAt: Date
}

// Firestore types
export interface FirestorePlayer {
  name: string
  createdAt: Date
}

export interface FirestoreGame {
  type: string
  savedAt: Date
  status: 'in_progress' | 'finished' | 'abandoned'
}

export interface FirestoreGamePlayer {
  playerNumber: number
  score: number
  targetScore: number
}

export interface FirestoreKillerState {
  roundsPlayed: number
  bullseyeBuyback: boolean
}

export interface FirestorePlayerStats {
  gamesPlayed: number
  gamesWon: number
  averageFinishPosition: number
  biggestSave: number
  mostPointsInRound: number
}
