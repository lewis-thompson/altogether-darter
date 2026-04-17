import { useState } from 'react'
import { GameTemplate } from './GameTemplate'
import type { Player } from '../types'

export function DummyKillerPage() {
  const initialPlayers: Player[] = [
    { id: 1, name: 'Player A', selectedNumber: 4 },
    { id: 2, name: 'Player B', selectedNumber: 17 },
    { id: 3, name: 'Player C', selectedNumber: 2 },
    { id: 4, name: 'Player D', selectedNumber: 6 },
    { id: 5, name: 'Player E', selectedNumber: 20 },
    { id: 6, name: 'Player F', selectedNumber: 1 },
    { id: 7, name: 'Player G', selectedNumber: 9 },
  ]

  const [players] = useState<Player[]>(initialPlayers)
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(
    initialPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {})
  )
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentHits, setCurrentHits] = useState<string[]>([])
  const [currentRound, setCurrentRound] = useState(1)

  const killerThreshold = 5
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
    if (currentHits.length === 0) {
      // If no hits in current visit, go back to previous player's last hit
      const prevPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
      const prevPlayer = players[prevPlayerIndex]
      const prevPlayerHits = playerHits[prevPlayer.id] || []
      
      if (prevPlayerHits.length > 0) {
        // Go back to previous player
        setCurrentPlayerIndex(prevPlayerIndex)
        if (prevPlayerIndex > currentPlayerIndex) {
          setCurrentRound((r) => Math.max(1, r - 1))
        }
        // Set up the last visit minus one hit
        const newHits = prevPlayerHits.slice(0, -1)
        setCurrentHits(newHits)
        // Remove from player hits
        const updatedHits = { ...playerHits }
        updatedHits[prevPlayer.id] = newHits
        setPlayerHits(updatedHits)
      }
    } else {
      setCurrentHits(currentHits.slice(0, -1))
    }
  }

  // Prepare template data
  const templatePlayers = players.map((player) => ({
    id: String(player.id),
    name: player.name,
    hits: playerHits[player.id] || [],
    additionalData: {
      'Number': `#${player.selectedNumber ?? '-'}`,
    },
  }))

  return (
    <GameTemplate
      headerConfig={{
        title: 'Dummy Killer',
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: [
          {
            label: 'Threshold',
            value: killerThreshold,
          },
        ],
      }}
      players={templatePlayers}
      currentPlayerIndex={currentPlayerIndex}
      currentHits={currentHits}
      onAddScore={handleAddScore}
      onRemoveLastHit={handleRemoveLastHit}
      homeLink="/"
    />
  )
}
