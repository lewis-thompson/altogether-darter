import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface DoublesProps {
  players: Player[]
}

export function DoublesPage({ players }: DoublesProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )

  // Doubles has 21 rounds: targeting doubles 1-20, then bullseye
  const getTargetDouble = (round: number): string => {
    if (round > 21) return ''
    if (round === 21) return 'Bull'
    return `Double ${round}`
  }

  const currentPlayer = players[currentPlayerIndex]
  const targetDouble = getTargetDouble(currentRound)
  const targetNumber = currentRound <= 20 ? currentRound : 25 // 25 represents bullseye in scoring

  function formatHit(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): string {
    if (target === 'miss') return 'M'
    if (target === 'bull') return modifier === 'double' ? 'DB' : 'SB'
    if (modifier === 'double') return `D${target}`
    if (modifier === 'treble') return `T${target}`
    return String(target)
  }

  function getHitValue(hitStr: string, round: number): number {
    if (hitStr === 'M' || hitStr === 'SB') return 0
    if (hitStr === 'DB' && round === 21) return 50
    if (hitStr.startsWith('D')) {
      const num = parseInt(hitStr.slice(1), 10)
      if (num === targetNumber) return num * 2
    }
    return 0
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (currentRound > 21) return // Game over

    let isOnTarget = false
    let hitValue = 0

    if (target === 'miss') {
      isOnTarget = false
      hitValue = 0
    } else if (target === 'bull') {
      // Bull is only a target on round 21
      isOnTarget = currentRound === 21
      if (isOnTarget) hitValue = 50
    } else if (currentRound <= 20 && target === targetNumber && selectedModifier === 'double') {
      // Hit the target double
      isOnTarget = true
      hitValue = target * 2
    }

    const hitStr = formatHit(target, selectedModifier)
    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)
    setSelectedModifier(null)

    // Add score if on target
    if (isOnTarget) {
      const newScore = (playerScores[currentPlayer.id] || 0) + hitValue
      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: newScore,
      })
    }

    // Check if visit is over (3 darts)
    if (newHits.length === 3) {
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])

      // Check if game over
      if (currentRound === 21 && currentPlayerIndex === players.length - 1) {
        // Game complete
        const winner = players.reduce((best, p) =>
          (playerScores[p.id] || 0) > (playerScores[best.id] || 0) ? p : best
        )
        navigate('/game-complete', {
          state: {
            winner,
            winnerPoints: playerScores[winner.id] || 0,
            totalPlayers: players.length,
            totalRounds: 21,
            totalAttempts: Object.values(playerHits).flat().length + newHits.length,
            totalHits: newHits.filter((h) => h !== 'M').length,
            totalMisses: newHits.filter((h) => h === 'M').length,
            bullseyeBuybackEnabled: false,
            bullseyeRounds: null,
          },
        })
        return
      }

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
      const removedHit = currentHits[currentHits.length - 1]
      setCurrentHits(currentHits.slice(0, -1))

      // If we removed a scoring hit, subtract from score
      const hitValue = getHitValue(removedHit, currentRound)
      if (hitValue > 0) {
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: Math.max(0, (playerScores[currentPlayer.id] || 0) - hitValue),
        })
      }
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
      Score: (playerScores[player.id] || 0).toString(),
    },
  }))

  return (
    <GameTemplate
      headerConfig={{
        title: 'Doubles',
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: currentRound <= 21 ? [
          {
            label: 'Target',
            value: targetDouble,
          },
        ] : undefined,
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
