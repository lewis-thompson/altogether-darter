import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface X01Props {
  players: Player[]
  startingScore: number
  legsPerSet?: number
  setsPerGame?: number
  doubleIn?: boolean
  doubleOut?: boolean
}

export function X01Page({ players, startingScore, legsPerSet = 3, setsPerGame = 3, doubleIn: _doubleIn = false, doubleOut: _doubleOut = true }: X01Props) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])
  const [visitScoreHistory, setVisitScoreHistory] = useState<number[]>([startingScore])
  const [legStartPlayerIndex, setLegStartPlayerIndex] = useState(0)

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
  const [setsWon, setSetsWon] = useState<Record<number, number>>(() =>
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
    const newScoreHistory = [...visitScoreHistory, isBust ? visitStartScore : newScore]
    setCurrentHits(newHits)
    setVisitScoreHistory(newScoreHistory)
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
      setVisitScoreHistory([startingScore])
      
      // Reset all players' scores for the new leg
      const resetScores: Record<number, number> = {}
      players.forEach((p) => {
        resetScores[p.id] = startingScore
      })
      setPlayerScores(resetScores)
      
      setLegsWon(newLegsWon)
      setVisitStartScore(startingScore)

      // Check if player has won enough legs for this set
      if (newLegsWon[currentPlayer.id] >= legsPerSet) {
        // Player won the set!
        const newSetsWon = { ...setsWon }
        newSetsWon[currentPlayer.id] = (newSetsWon[currentPlayer.id] || 0) + 1

        setSetsWon(newSetsWon)
        
        // Check if player has won the game
        if (newSetsWon[currentPlayer.id] >= setsPerGame) {
          // Game over!
          navigate('/game-complete', {
            state: {
              winner: currentPlayer,
              winnerPoints: newSetsWon[currentPlayer.id],
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

        // Reset leg counts for new set and rotate first player
        const resetLegsWon = { ...newLegsWon }
        players.forEach((p) => {
          resetLegsWon[p.id] = 0
        })
        setLegsWon(resetLegsWon)

        // First player of new set: player that went second in first game of previous set
        const newSetStartIndex = (legStartPlayerIndex + 1) % players.length
        setLegStartPlayerIndex(newSetStartIndex)
        setCurrentPlayerIndex(newSetStartIndex)
        setCurrentRound((r) => r + 1)
        return
      }

      // First player of new leg: player that went second in previous leg
      const newLegStartIndex = (legStartPlayerIndex + 1) % players.length
      setLegStartPlayerIndex(newLegStartIndex)
      setCurrentPlayerIndex(newLegStartIndex)
      setCurrentRound((r) => r + 1)
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
      setVisitScoreHistory([isBust ? visitStartScore : newScore])
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
    if (currentHits.length === 0) {
      // If no hits in current visit, go back to previous player's last hit
      const prevPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
      const prevPlayer = players[prevPlayerIndex]
      const prevPlayerHits = playerHits[prevPlayer.id] || []
      
      if (prevPlayerHits.length > 0) {
        // Go back to previous player
        setCurrentPlayerIndex(prevPlayerIndex)
        
        // Set up the last visit minus one hit
        const lastHitStr = prevPlayerHits[prevPlayerHits.length - 1]
        const newHits = prevPlayerHits.slice(0, -1)
        setCurrentHits(newHits)
        
        // Get the previous player's current score
        const prevPlayerScore = playerScores[prevPlayer.id] ?? startingScore
        const hitValue = getHitValue(lastHitStr as 'miss' | 'bull' | number, null)
        const restoredScore = prevPlayerScore + hitValue
        
        setPlayerScores({
          ...playerScores,
          [prevPlayer.id]: restoredScore,
        })
        
        // Remove from player hits
        const updatedHits = { ...playerHits }
        updatedHits[prevPlayer.id] = newHits
        setPlayerHits(updatedHits)
      }
      return
    }

    const newHits = currentHits.slice(0, -1)
    const newScoreHistory = visitScoreHistory.slice(0, -1)
    const previousScore = newScoreHistory[newScoreHistory.length - 1] ?? visitStartScore

    setCurrentHits(newHits)
    setVisitScoreHistory(newScoreHistory)
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
      'Remaining': (playerScores[player.id] ?? startingScore).toString(),
      'Legs': (legsWon[player.id] || 0).toString(),
      'Sets': (setsWon[player.id] || 0).toString(),
    },
  }))

  return (
    <GameTemplate
      headerConfig={{
        title: String(startingScore),
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: [
          { label: 'Legs to win', value: legsPerSet },
          { label: 'Sets to win', value: setsPerGame },
        ],
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
