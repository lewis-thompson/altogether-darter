import { useState } from 'react'
import { GameTemplate } from './GameTemplate'

interface Player {
  id: string
  name: string
  number: number
  points: number
  alive: boolean
}

export function DummyKillerPage() {
  const initialPlayers: Player[] = [
    { id: 'A', name: 'Player A', number: 4, points: 0, alive: true },
    { id: 'B', name: 'Player B', number: 17, points: 0, alive: true },
    { id: 'C', name: 'Player C', number: 2, points: 0, alive: true },
    { id: 'D', name: 'Player D', number: 6, points: 0, alive: true },
    { id: 'E', name: 'Player E', number: 20, points: 0, alive: true },
    { id: 'F', name: 'Player F', number: 1, points: 0, alive: true },
    { id: 'G', name: 'Player G', number: 9, points: 0, alive: true },
  ]

  const [players] = useState<Player[]>(initialPlayers)
  const [playerHits, setPlayerHits] = useState<Record<string, string[]>>(
    initialPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {})
  )
  const [lastVisitHits, setLastVisitHits] = useState<Record<string, string[]>>(
    initialPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {})
  )
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentHits, setCurrentHits] = useState<string[]>([])
  const [currentRound, setCurrentRound] = useState(1)

  const killerScore = 3
  const currentPlayer = players[currentPlayerIndex]

  const handleAddScore = (value: 'miss' | 'bull' | number) => {
    let hitStr = ''
    if (value === 'miss') {
      hitStr = 'M'
    } else if (value === 'bull') {
      hitStr = 'Bull'
    } else {
      hitStr = String(value)
    }

    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)

    // After 3 hits, move to next player
    if (newHits.length === 3) {
      // Update the current player's hits
      const updatedHits = { ...playerHits }
      updatedHits[currentPlayer.id] = [...(updatedHits[currentPlayer.id] || []), ...newHits]
      setPlayerHits(updatedHits)

      // Store this visit's hits as the last visit hits for this player
      const updatedLastVisitHits = { ...lastVisitHits }
      updatedLastVisitHits[currentPlayer.id] = newHits
      setLastVisitHits(updatedLastVisitHits)

      // Reset for next player
      setCurrentHits([])
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        setCurrentRound((r) => r + 1)
      }
      setCurrentPlayerIndex(nextPlayerIndex)
    }
  }

  const handleRemoveLastHit = () => {
    setCurrentHits(currentHits.slice(0, -1))
  }

  // Prepare template data
  const templatePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    hits: playerHits[player.id] || [],
    additionalData: {
      'Number': `#${player.number}`,
      'Points': player.points,
      'Status': player.alive ? 'Alive' : 'Dead',
    },
  }))

  return (
    <GameTemplate
      headerConfig={{
        title: 'Dummy Game',
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: [
          {
            label: 'Killer Score',
            value: killerScore,
          },
        ],
      }}
      players={templatePlayers}
      currentPlayerIndex={currentPlayerIndex}
      currentHits={currentHits}
      lastVisitHits={lastVisitHits}
      onAddScore={handleAddScore}
      onRemoveLastHit={handleRemoveLastHit}
      homeLink="/"
    />
  )
}
