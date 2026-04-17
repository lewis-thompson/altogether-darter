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

    let hitStr = ''
    let isOnTarget = false
    let hitValue = 0

    if (target === 'miss') {
      hitStr = 'M'
      isOnTarget = false
      hitValue = 0
    } else if (target === 'bull') {
      hitStr = 'SB'
      isOnTarget = false
      hitValue = 0
    } else if (target === targetNumber) {
      if (selectedModifier === 'double') hitValue = target * 2
      else if (selectedModifier === 'treble') hitValue = target * 3
      else hitValue = target
      
      isOnTarget = true
      hitStr = formatHit(target, selectedModifier)
    } else {
      hitStr = formatHit(target, selectedModifier)
    }

    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)

    // If on target, add to score
    if (isOnTarget) {
      const newScore = (playerScores[currentPlayer.id] || 0) + hitValue
      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: newScore,
      })
    }

    // Check for Shanghai (single, double, triple of same number in one turn)
    const isShanghai = checkShanghai(newHits, targetNumber)
    if (isShanghai) {
      // Instant win!
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })

      navigate('/game-complete', {
        state: {
          winner: currentPlayer,
          winnerPoints: playerScores[currentPlayer.id] || 0,
          totalPlayers: players.length,
          totalRounds: currentRound,
          totalAttempts: Object.values(playerHits).flat().length + newHits.length,
          totalHits: newHits.filter((h) => h !== 'M').length,
          totalMisses: newHits.filter((h) => h === 'M').length,
          bullseyeBuybackEnabled: false,
          bullseyeRounds: null,
        },
      })
      return
    }

    // Check if visit is over (3 darts or all 3 spent)
    if (newHits.length === 3) {
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])

      // Check if game over (all rounds complete)
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

  function checkShanghai(hits: string[], targetNum: number): boolean {
    // Shanghai means hitting single, double, and triple of the same number in one turn
    let hasSingle = false
    let hasDouble = false
    let hasTriple = false

    for (const hit of hits) {
      if (hit === 'M' || hit === 'SB' || hit === 'DB') continue
      
      // Extract number and modifier from hit string
      let modifier = ''
      let hitNum = 0

      if (hit.startsWith('D')) {
        modifier = 'D'
        hitNum = parseInt(hit.substring(1))
      } else if (hit.startsWith('T')) {
        modifier = 'T'
        hitNum = parseInt(hit.substring(1))
      } else {
        modifier = 'S'
        hitNum = parseInt(hit)
      }

      if (hitNum === targetNum) {
        if (modifier === 'S') hasSingle = true
        if (modifier === 'D') hasDouble = true
        if (modifier === 'T') hasTriple = true
      }
    }

    return hasSingle && hasDouble && hasTriple
  }

  function removeLastHit() {
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
        const lastHitStr = prevPlayerHits[prevPlayerHits.length - 1]
        const newHits = prevPlayerHits.slice(0, -1)
        setCurrentHits(newHits)
        
        // Undo the score
        if (lastHitStr !== 'M' && targetNumber > 0) {
          const hitValue = extractHitValue(lastHitStr, targetNumber)
          if (hitValue > 0) {
            setPlayerScores({
              ...playerScores,
              [prevPlayer.id]: Math.max(0, (playerScores[prevPlayer.id] || 0) - hitValue),
            })
          }
        }
        
        // Remove from player hits
        const updatedHits = { ...playerHits }
        updatedHits[prevPlayer.id] = newHits
        setPlayerHits(updatedHits)
      }
      return
    }

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

  // Shanghai score buttons: target number variations + miss (no modifier buttons needed)
  const shanghaiScoreButtons = targetNumber > 0 
    ? [targetNumber, `D${targetNumber}`, `T${targetNumber}`, 'miss' as const]
    : ['miss' as const]

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
      customScoreButtons={shanghaiScoreButtons}
      hideModifierButtons={true}
    />
  )
}
