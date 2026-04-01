import { describe, expect, it } from 'vitest'

import {
  validateGameDocument,
  validateGamePlayerDocument,
  validateKillerStateDocument,
  validatePlayerDocument,
  validateStatsDocument,
  validateUserDocument,
  VALID_GAME_STATUSES
} from '../src/lib/firestoreSchema'

describe('Firestore schema and data shapes', () => {
  it('validates required user document fields and types', () => {
    expect(
      validateUserDocument({
        id: 'user-1',
        displayName: 'Player One',
        email: 'player1@example.com',
        createdAt: '2026-04-01T12:00:00.000Z'
      })
    ).toBe(true)
  })

  it('validates player documents under users/{userId}/players/{playerId}', () => {
    expect(
      validatePlayerDocument({
        id: 'player-1',
        name: 'Alice',
        createdAt: '2026-04-01T12:00:00.000Z',
        stats: {}
      })
    ).toBe(true)
  })

  it('validates stats documents under users/{userId}/players/{playerId}/stats/{gameType}', () => {
    expect(
      validateStatsDocument({
        gamesPlayed: 3,
        wins: 2,
        averageScore: 52
      })
    ).toBe(true)
  })

  it('validates game documents under users/{userId}/games/{gameId}', () => {
    expect(
      validateGameDocument({
        id: 'game-1',
        userId: 'user-1',
        status: 'in-progress',
        createdAt: '2026-04-01T12:00:00.000Z'
      })
    ).toBe(true)
  })

  it('validates killer game state documents under users/{userId}/games/{gameId}/state/killer', () => {
    expect(
      validateKillerStateDocument({
        activeKillerId: 'player-2',
        currentTarget: 20,
        round: 2
      })
    ).toBe(true)
  })

  it('validates game player state documents under users/{userId}/games/{gameId}/players/{playerId}', () => {
    expect(
      validateGamePlayerDocument({
        id: 'player-1',
        score: 120,
        target: 20,
        isKiller: false
      })
    ).toBe(true)
  })

  it('ensures saved games and in-progress games use consistent status values', () => {
    expect(VALID_GAME_STATUSES).toContain('in-progress')
    expect(VALID_GAME_STATUSES).toContain('completed')
  })
})
