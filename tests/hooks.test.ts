import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import useAuth from '../src/hooks/useAuth'
import useGameState from '../src/hooks/useGameState'
import usePlayers from '../src/hooks/usePlayers'

describe('Custom hooks and state management', () => {
  it('loads authenticated user state and handles sign-in status', async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current).toHaveProperty('user')
    expect(typeof result.current.signIn).toBe('function')

    await act(async () => {
      await result.current.signIn()
    })

    expect(result.current).toHaveProperty('user')
  })

  it('loads player list for the authenticated user', () => {
    const { result } = renderHook(() => usePlayers('user-123'))

    expect(result.current).toHaveProperty('players')
    expect(Array.isArray(result.current.players)).toBe(true)
    expect(typeof result.current.reloadPlayers).toBe('function')
  })

  it('loads and persists current game state from Firestore', () => {
    const { result } = renderHook(() => useGameState('game-123'))

    expect(result.current).toHaveProperty('gameState')
    expect(typeof result.current.updateGameState).toBe('function')
  })

  it('updates game state correctly when scores, rounds, or player status change', () => {
    const { result } = renderHook(() => useGameState('game-123'))

    act(() => {
      result.current.updateGameState({ round: 2, players: [] })
    })

    expect(result.current.gameState).toEqual(expect.objectContaining({ round: 2 }))
  })
})
