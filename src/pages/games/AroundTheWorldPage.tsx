import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface AroundTheWorldProps {
  players: Player[]
}

export function AroundTheWorldPage({ players }: AroundTheWorldProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])
  const [visitScoreHistory, setVisitScoreHistory] = useState<number[]>([])

  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 1 }), {})
  )

  const currentPlayer = players[currentPlayerIndex]

  function getCurrentSegment(score: number): number | string {
    if (score <= 20) return score
    if (score === 21) return 'OB' // Outer bull
    return 'B' // Inner bull (bullseye)
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    const currentScore = playerScores[currentPlayer.id] || 1
    const darts = currentHits.length

    // Check if hit matches current target
    const targetSegment = getCurrentSegment(currentScore)
    let hitMatches = false
    let segmentsAdvanced = 0
    let displayHit = ''

    if (target === 'miss') {
      hitMatches = false
      displayHit = 'M'
      segmentsAdvanced = 0
    } else if (target === 'bull') {
      hitMatches = targetSegment === 'OB' || targetSegment === 'B'
      displayHit = 'SB'
      segmentsAdvanced = 1
    } else if (typeof targetSegment === 'number' && target === targetSegment) {
      hitMatches = true
      segmentsAdvanced = selectedModifier === 'double' ? 2 : selectedModifier === 'treble' ? 3 : 1
      displayHit = `${selectedModifier === 'double' ? 'D' : selectedModifier === 'treble' ? 'T' : 'S'}${target}`
    } else {
      displayHit = String(target)
    }

    if (hitMatches) {
      const newScore = currentScore + segmentsAdvanced
      const newHits = [...currentHits, displayHit]
      const newHistory = [...visitScoreHistory, newScore]
      setCurrentHits(newHits)
      setVisitScoreHistory(newHistory)

      if (darts === 2) {
        // End of visit
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: newScore,
        })
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
        setCurrentHits([])
        setVisitScoreHistory([])

        // Check if won
        if (newScore >= 22) {
          // Game won!
          navigate('/game-complete', {
            state: {
              winner: currentPlayer,
              winnerPoints: newScore,
              totalPlayers: players.length,
              totalRounds: currentRound,
              totalAttempts: Object.values(playerHits).flat().length + newHits.length,
              totalHits: newHits.filter((h) => h !== 'miss').length,
              totalMisses: newHits.filter((h) => h === 'miss').length,
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
      } else {
        // Can throw again in same visit
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: newScore,
        })
      }
    } else {
      // Missed the target
      const newHits = [...currentHits, 'M']
      const newHistory = [...visitScoreHistory, currentScore] // Score doesn't change on miss
      setCurrentHits(newHits)
      setVisitScoreHistory(newHistory)
      setSelectedModifier(null)

      if (darts === 2) {
        // End of visit
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
        setCurrentHits([])
        setVisitScoreHistory([])

        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
        if (nextPlayerIndex === 0) {
          setCurrentRound((r) => r + 1)
        }
        setCurrentPlayerIndex(nextPlayerIndex)
      }
    }
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
        const newHits = prevPlayerHits.slice(0, -1)
        setCurrentHits(newHits)
        
        // For simplicity, just reduce the score back one segment
        // In a full implementation, you'd track score history per player
        const currentScore = playerScores[prevPlayer.id] || 1
        const previousScore = currentScore === 1 ? 1 : currentScore - 1
        
        setPlayerScores({
          ...playerScores,
          [prevPlayer.id]: previousScore,
        })
        
        // Remove from player hits
        const updatedHits = { ...playerHits }
        updatedHits[prevPlayer.id] = newHits
        setPlayerHits(updatedHits)
      }
      return
    }

    const newHits = currentHits.slice(0, -1)
    const newHistory = visitScoreHistory.slice(0, -1)
    const previousScore = newHistory.length > 0 ? newHistory[newHistory.length - 1] : (playerScores[currentPlayer.id] || 1)

    setCurrentHits(newHits)
    setVisitScoreHistory(newHistory)
    setPlayerScores({
      ...playerScores,
      [currentPlayer.id]: previousScore,
    })
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
      Segment: getCurrentSegment(playerScores[player.id] || 0).toString(),
    },
  }))

  // AroundTheWorld score buttons: target segment variations + miss (no modifier buttons needed)
  const targetSegment = getCurrentSegment(playerScores[currentPlayer.id] || 1)
  const aroundTheWorldScoreButtons = typeof targetSegment === 'number' 
    ? [targetSegment, `D${targetSegment}`, `T${targetSegment}`, 'miss' as const]
    : ['bull' as const, 'miss' as const]

  return (
    <GameTemplate
      headerConfig={{
        title: 'Around The World',
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
      customScoreButtons={aroundTheWorldScoreButtons}
      hideModifierButtons={true}
    />
  )
}
