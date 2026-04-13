import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  User,
  FirestorePlayer,
  FirestoreGame,
  FirestoreGamePlayer,
  FirestoreKillerState,
  FirestorePlayerStats,
} from '../types'

const USERS_COLLECTION = 'users'
const PLAYERS_COLLECTION = 'players'
const GAMES_COLLECTION = 'games'
const STATS_COLLECTION = 'stats'
const GAME_PLAYERS_COLLECTION = 'players'
const GAME_STATE_COLLECTION = 'state'

/**
 * Create or update user document
 */
export async function createOrUpdateUser(userId: string, user: User): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  await setDoc(
    userRef,
    {
      displayName: user.displayName,
      email: user.email,
      createdAt: Timestamp.fromDate(user.createdAt),
    },
    { merge: true }
  )
}

/**
 * Create a new player for a user
 */
export async function createPlayer(userId: string, name: string): Promise<string> {
  const playersRef = collection(db, USERS_COLLECTION, userId, PLAYERS_COLLECTION)
  const docRef = await addDoc(playersRef, {
    name,
    createdAt: Timestamp.now(),
  } as unknown as FirestorePlayer)
  return docRef.id
}

/**
 * Get all players for a user
 */
export async function getPlayers(userId: string): Promise<Array<{ id: string } & FirestorePlayer>> {
  const playersRef = collection(db, USERS_COLLECTION, userId, PLAYERS_COLLECTION)
  const snapshot = await getDocs(playersRef)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<{ id: string } & FirestorePlayer>
}

/**
 * Create a new game for a user
 */
export async function createGame(
  userId: string,
  gameType: string,
  status: 'in_progress' | 'finished' | 'abandoned' = 'in_progress'
): Promise<string> {
  const gamesRef = collection(db, USERS_COLLECTION, userId, GAMES_COLLECTION)
  const docRef = await addDoc(gamesRef, {
    type: gameType,
    savedAt: Timestamp.now(),
    status,
  } as unknown as FirestoreGame)
  return docRef.id
}

/**
 * Add a player to a game
 */
export async function addGamePlayer(
  userId: string,
  gameId: string,
  playerId: string,
  playerNumber: number,
  targetScore: number
): Promise<void> {
  const playerRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_PLAYERS_COLLECTION,
    playerId
  )
  await setDoc(playerRef, {
    playerNumber,
    score: 0,
    targetScore,
  } as FirestoreGamePlayer)
}

/**
 * Update game player score
 */
export async function updateGamePlayerScore(
  userId: string,
  gameId: string,
  playerId: string,
  score: number
): Promise<void> {
  const playerRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_PLAYERS_COLLECTION,
    playerId
  )
  await updateDoc(playerRef, { score })
}

/**
 * Save killer game state
 */
export async function saveKillerGameState(
  userId: string,
  gameId: string,
  state: FirestoreKillerState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'killer'
  )
  await setDoc(stateRef, state)
}

/**
 * Get killer game state
 */
export async function getKillerGameState(
  userId: string,
  gameId: string
): Promise<FirestoreKillerState | null> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'killer'
  )
  const snapshot = await getDoc(stateRef)
  return snapshot.exists() ? (snapshot.data() as FirestoreKillerState) : null
}

/**
 * Update game status
 */
export async function updateGameStatus(
  userId: string,
  gameId: string,
  status: 'in_progress' | 'finished' | 'abandoned'
): Promise<void> {
  const gameRef = doc(db, USERS_COLLECTION, userId, GAMES_COLLECTION, gameId)
  await updateDoc(gameRef, { status })
}

/**
 * Get player statistics for a game type
 */
export async function getPlayerStats(
  userId: string,
  playerId: string,
  gameType: string
): Promise<FirestorePlayerStats | null> {
  const statsRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    PLAYERS_COLLECTION,
    playerId,
    STATS_COLLECTION,
    gameType
  )
  const snapshot = await getDoc(statsRef)
  if (snapshot.exists()) {
    return snapshot.data() as FirestorePlayerStats
  }
  // Return default stats if none exist
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    averageFinishPosition: 0,
    biggestSave: 0,
    mostPointsInRound: 0,
  }
}

/**
 * Update player statistics
 */
export async function updatePlayerStats(
  userId: string,
  playerId: string,
  gameType: string,
  stats: Partial<FirestorePlayerStats>
): Promise<void> {
  const statsRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    PLAYERS_COLLECTION,
    playerId,
    STATS_COLLECTION,
    gameType
  )
  await setDoc(statsRef, stats, { merge: true })
}
