import { describe, expect, it } from 'vitest'

import {
  applyKillerShot,
  calculateShotPoints,
  determineGameEnd,
  evaluateBullseyeBuyback,
  validateOverTargetPenalty
} from '../src/lib/gameLogic'

describe('Killer game logic', () => {
  it('calculates points correctly for single, double, and triple hits', () => {
    expect(calculateShotPoints({ segment: 20, multiplier: 1 })).toBe(20)
    expect(calculateShotPoints({ segment: 15, multiplier: 2 })).toBe(30)
    expect(calculateShotPoints({ segment: 7, multiplier: 3 })).toBe(21)
  })

  it('prevents killer scoring against other players during the first round', () => {
    const gameState = { round: 1, currentPlayerId: 'p2', players: [] }

    expect(applyKillerShot(gameState, { shooterId: 'p2', targetId: 'p1', points: 20 })).toEqual(
      expect.objectContaining({ scored: false })
    )
  })

  it('subtracts excess points when a player goes over the target', () => {
    expect(validateOverTargetPenalty({ currentScore: 25, targetScore: 20 })).toBe(-5)
  })

  it('promotes a player to killer when the exact target is reached', () => {
    const result = applyKillerShot({ round: 2, currentPlayerId: 'p1', players: [] }, { shooterId: 'p1', targetId: 'p1', points: 20 })

    expect(result).toEqual(expect.objectContaining({ promotedToKiller: true }))
  })

  it('deducts points from opponents when a killer hits their number', () => {
    const result = applyKillerShot({ round: 3, currentPlayerId: 'p2', players: [] }, { shooterId: 'p2', targetId: 'p1', points: 15 })

    expect(result).toEqual(expect.objectContaining({ opponentPenalty: 15 }))
  })

  it('removes killer status and penalizes when a killer hits their own number', () => {
    const result = applyKillerShot({ round: 3, currentPlayerId: 'p2', players: [] }, { shooterId: 'p2', targetId: 'p2', points: 15 })

    expect(result).toEqual(expect.objectContaining({ removedKillerStatus: true }))
  })

  it('enforces a single comeback visit when a player drops below zero', () => {
    const result = applyKillerShot({ round: 4, currentPlayerId: 'p3', players: [] }, { shooterId: 'p3', targetId: 'p4', points: -5 })

    expect(result).toEqual(expect.objectContaining({ comebackVisitAllowed: true }))
  })

  it('applies bullseye buyback rules only within allowed rounds', () => {
    expect(evaluateBullseyeBuyback({ round: 6, canBuyback: true })).toBe(true)
    expect(evaluateBullseyeBuyback({ round: 10, canBuyback: false })).toBe(false)
  })

  it('determines game end when the last player is standing', () => {
    expect(determineGameEnd({ playersAlive: 1 })).toBe(true)
    expect(determineGameEnd({ playersAlive: 2 })).toBe(false)
  })
})
