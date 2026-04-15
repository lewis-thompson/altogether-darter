import { useState } from 'react'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface X01Props {
  players: Player[]
  startingScore: number
}

export function X01Page({ players, startingScore }: X01Props) {
  const { user } = useAuth()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: startingScore }), {})
  )

  const [visitStartScore, setVisitStartScore] = useState(startingScore)
  const [legsWon, setLegsWon] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )

  const currentPlayer = players[currentPlayerIndex]
  const currentScore = playerScores[currentPlayer.id] ?? startingScore

  function getHitValue(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): number {
    if (target === 'miss') return 0
    if (target === 'bull') return modifier === 'double' ? 50 : 25
    if (modifier === 'double') return (target as number) * 2
    if (modifier === 'treble') return (target as number) * 3
    return target as number
  }

  function formatHit(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): string {
    if (target === 'miss') return 'M'
    if (target === 'bull') return modifier === 'double' ? 'DB' : 'SB'
    if (modifier === 'double') return `D${target}`
    if (modifier === 'treble') return `T${target}`
    return String(target)
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (currentScore <= 1) return // Already bust

    const hitValue = getHitValue(target, selectedModifier)
    const hitStr = formatHit(target, selectedModifier)
    const newScore = currentScore - hitValue
    let finished = false
    let isBust = false

    // Check for valid finish
    if (newScore === 0 && selectedModifier === 'double') {
      // Winner!
      finished = true
    } else if (newScore < 0 || (newScore === 1)) {
      // Bust - revert to start of visit score
      isBust = true
    }

    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)
    setSelectedModifier(null)

    if (!isBust) {
      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: newScore,
      })
    }

    if (finished) {
      // Player won the leg!
      const newLegsWon = { ...legsWon }
      newLegsWon[currentPlayer.id] = (newLegsWon[currentPlayer.id] || 0) + 1

      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])
      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: startingScore, // Reset for next leg
      })
      setLegsWon(newLegsWon)
      setVisitStartScore(startingScore)

      // For now, just reset and next player
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        setCurrentRound((r) => r + 1)
      }
      setCurrentPlayerIndex(nextPlayerIndex)
      return
    }

    if (currentHits.length === 2 || isBust) {
      // End of visit
      if (isBust) {
        // Revert score to start of visit
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: visitStartScore,
        })
      }

      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])
      setVisitStartScore(isBust ? visitStartScore : newScore)

      // Move to next player
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        setCurrentRound((r) => r + 1)
      }
      setCurrentPlayerIndex(nextPlayerIndex)
    }
  }

  function removeLastHit() {
    if (currentHits.length > 0) {
      setCurrentHits(currentHits.slice(0, -1))
    }
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  if (!user || !currentPlayer) {
    return <div>Loading...</div>
  }

  const lastVisitHitsForTemplate = Object.fromEntries(
    Object.entries(playerHits).map(([playerId, hits]) => [String(playerId), hits])
  )

  const playerDataForTemplate = players.map((player) => ({
    id: String(player.id),
    name: player.name,
    hits: currentPlayerIndex === players.indexOf(player) ? currentHits : [],
    additionalData: {
      'Remaining': (playerScores[player.id] ?? startingScore).toString(),
      'Legs Won': (legsWon[player.id] || 0).toString(),
    },
  }))

  return (
    <GameTemplate
      headerConfig={{
        title: 'X01',
        currentPlayer: currentPlayer.name,
        round: currentRound,
      }}
      players={playerDataForTemplate}
      currentPlayerIndex={currentPlayerIndex}
      currentHits={currentHits}
      lastVisitHits={lastVisitHitsForTemplate}
      onAddScore={addHit}
      onRemoveLastHit={removeLastHit}
      onToggleModifier={toggleModifier}
      selectedModifier={selectedModifier}
    />
  )
}
