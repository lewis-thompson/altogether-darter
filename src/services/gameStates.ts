import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import {
  X01GameState,
  AroundTheWorldGameState,
  CricketGameState,
  EveryNumberGameState,
  ScoreKillerGameState,
  DoublesGameState,
  ShanghaiGameState,
  SplitscoreGameState,
} from '../types/gameStates'

const USERS_COLLECTION = 'users'
const GAMES_COLLECTION = 'games'
const GAME_STATE_COLLECTION = 'state'

// X01
export async function saveX01GameState(
  userId: string,
  gameId: string,
  state: X01GameState
): Promise<void> {
  const stateRef = doc(db, USERS_COLLECTION, userId, GAMES_COLLECTION, gameId, GAME_STATE_COLLECTION, 'x01')
  await setDoc(stateRef, state)
}

// Around The World
export async function saveAroundTheWorldGameState(
  userId: string,
  gameId: string,
  state: AroundTheWorldGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'around_the_world'
  )
  await setDoc(stateRef, state)
}

// Cricket
export async function saveCricketGameState(
  userId: string,
  gameId: string,
  state: CricketGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'cricket'
  )
  await setDoc(stateRef, state)
}

// Every Number
export async function saveEveryNumberGameState(
  userId: string,
  gameId: string,
  state: EveryNumberGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'every_number'
  )
  await setDoc(stateRef, state)
}

// Score Killer
export async function saveScoreKillerGameState(
  userId: string,
  gameId: string,
  state: ScoreKillerGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'score_killer'
  )
  await setDoc(stateRef, state)
}

// Doubles
export async function saveDoublesGameState(
  userId: string,
  gameId: string,
  state: DoublesGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'doubles'
  )
  await setDoc(stateRef, state)
}

// Shanghai
export async function saveShanghaiGameState(
  userId: string,
  gameId: string,
  state: ShanghaiGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'shanghai'
  )
  // Convert Set to Array for Firestore
  await setDoc(stateRef, {
    ...state,
  })
}

// Splitscore
export async function saveSplitscoreGameState(
  userId: string,
  gameId: string,
  state: SplitscoreGameState
): Promise<void> {
  const stateRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    GAMES_COLLECTION,
    gameId,
    GAME_STATE_COLLECTION,
    'splitscore'
  )
  await setDoc(stateRef, state)
}
