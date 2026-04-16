import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface ShanghaiProps {
  players: Player[]
}

export function ShanghaiPage({ players }: ShanghaiProps) {
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

  // Shanghai has 20 rounds, targeting numbers 1-20
  const getTargetNumber = (round: number): number => {
    if (round > 20) return -1 // Game over
    return round
  }

  const currentPlayer = players[currentPlayerIndex]
  const targetNumber = getTargetNumber(currentRound)

  function formatHit(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): string {
    if (target === 'miss') return 'M'
    if (target === 'bull') return modifier === 'double' ? 'DB' : 'SB'
    if (modifier === 'double') return `D${target}`
    if (modifier === 'treble') return `T${target}`
    return String(target)
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (targetNumber < 1) return // Game over

    // Check if hit is on target
    let isOnTarget = false
    let hitValue = 0

    if (target === 'miss') {
      isOnTarget = false
      hitValue = 0
    } else if (target === 'bull') {
      // Bull is never the target in Shanghai (targets are 1-20)
      isOnTarget = false
      hitValue = 0
    } else if (target === targetNumber) {
      // Hit the target number
      isOnTarget = true
      if (selectedModifier === 'double') hitValue = target * 2
      else if (selectedModifier === 'treble') hitValue = target * 3
      else hitValue = target
    }

    const hitStr = formatHit(target, selectedModifier)
    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)
    setSelectedModifier(null)

    // If on target, add to score
    if (isOnTarget) {
      const newScore = (playerScores[currentPlayer.id] || 0) + hitValue
      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: newScore,
      })
    }

    // Check if visit is over (3 darts or all 3 spent)
    if (newHits.length === 3) {
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])

      // Check if game over
      if (currentRound === 20 && currentPlayerIndex === players.length - 1) {
        // Game complete
        const winner = players.reduce((best, p) =>
          (playerScores[p.id] || 0) > (playerScores[best.id] || 0) ? p : best
        )
        navigate('/game-complete', {
          state: {
            winner,
            winnerPoints: playerScores[winner.id] || 0,
            totalPlayers: players.length,
            totalRounds: 20,
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
      if (removedHit !== 'M' && targetNumber > 0) {
        const hitValue = extractHitValue(removedHit, targetNumber)
        if (hitValue > 0) {
          setPlayerScores({
            ...playerScores,
            [currentPlayer.id]: Math.max(0, (playerScores[currentPlayer.id] || 0) - hitValue),
          })
        }
      }
    }
  }

  function extractHitValue(hitStr: string, targetNum: number): number {
    if (hitStr === 'M' || hitStr === 'SB' || hitStr === 'DB') return 0

    const modifier = hitStr.charAt(0)
    const num = parseInt(hitStr.slice(1), 10)

    if (num !== targetNum) return 0

    if (modifier === 'D') return targetNum * 2
    if (modifier === 'T') return targetNum * 3
    return targetNum
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
        title: 'Shanghai',
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: targetNumber > 0 ? [
          {
            label: 'Target',
            value: targetNumber.toString(),
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
