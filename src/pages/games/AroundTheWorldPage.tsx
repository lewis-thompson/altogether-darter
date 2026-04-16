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

    if (target === 'bull') {
      hitMatches = targetSegment === 'OB' || targetSegment === 'B'
    } else if (typeof targetSegment === 'number' && target === targetSegment) {
      hitMatches = true
    }

    if (hitMatches) {
      // Determine how many segments to advance based on dart type
      let segmentsAdvanced = 1 // Single hit advances 1
      if (selectedModifier === 'double') segmentsAdvanced = 2
      if (selectedModifier === 'treble') segmentsAdvanced = 3

      const newScore = currentScore + segmentsAdvanced
      const newHits = [...currentHits, String(target)]
      const newHistory = [...visitScoreHistory, newScore]
      setCurrentHits(newHits)
      setVisitScoreHistory(newHistory)
      setSelectedModifier(null)

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
    if (currentHits.length === 0) return

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
    />
  )
}
