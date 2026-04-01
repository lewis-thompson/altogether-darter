import { useCallback, useState } from 'react'

export default function usePlayers(userId: string) {
  const [players, setPlayers] = useState<string[]>([])

  const reloadPlayers = useCallback(() => {
    setPlayers([])
  }, [])

  return {
    players,
    reloadPlayers,
    userId
  }
}
