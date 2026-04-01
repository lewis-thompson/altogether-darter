import { useCallback, useState } from 'react'

export type GameState = {
  gameId: string
  round: number
  players: Array<unknown>
}

export default function useGameState(gameId: string) {
  const [gameState, setGameState] = useState<GameState>({
    gameId,
    round: 1,
    players: []
  })

  const updateGameState = useCallback((nextState: Partial<GameState>) => {
    setGameState((currentState) => ({
      ...currentState,
      ...nextState
    }))
  }, [])

  return {
    gameState,
    updateGameState,
    gameId
  }
}
