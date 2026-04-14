import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface ScoreKillerProps {
  players: Player[]
  livesPerPlayer?: number
}

export function ScoreKillerPage({ players, livesPerPlayer = 3 }: ScoreKillerProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

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
  const [playerStatus] = useState<Record<number, PlayerStatus>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 'alive' as PlayerStatus }), {})
  )

  const [playerLives, setPlayerLives] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: livesPerPlayer }), {})
  )
  const [playerKills, setPlayerKills] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )
  const [lastVisitScore, setLastVisitScore] = useState(0)
  const [visitScore, setVisitScore] = useState(0)
  
  // Track last visit for undo functionality
  type VisitHistory = {
    playerId: number
    hits: string[]
    score: number
    meetsThreshold: boolean
    livesLost: boolean
    killMade: boolean
  }
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([])
  const [eliminationOrder, setEliminationOrder] = useState<number[]>([])

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]
  const alivePlayers = players.filter((p) => playerLives[p.id] > 0)

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  useEffect(() => {
    // Check if only one player left
    if (alivePlayers.length === 1 && Object.values(playerLives).some((lives) => lives === 0)) {
      const winner = alivePlayers[0]
      navigate('/game-complete', {
        state: {
          winner,
          winnerPoints: playerScores[winner.id] || 0,
          totalPlayers: players.length,
          totalRounds: currentRound,
          totalAttempts: Object.values(playerHits).flat().length,
          totalHits: Object.values(playerHits).flat().filter((h) => h !== 'M').length,
          totalMisses: Object.values(playerHits).flat().filter((h) => h === 'M').length,
          bullseyeBuybackEnabled: false,
          bullseyeRounds: null,
          finalStandings: players
            .map((p) => {
              const isAlive = playerLives[p.id] > 0
              return {
                id: p.id,
                name: p.name,
                selectedNumber: null,
                points: playerScores[p.id] || 0,
                status: isAlive ? ('alive' as PlayerStatus) : ('dead' as PlayerStatus),
              }
            })
            .sort((a, b) => {
              const aAlive = a.status === 'alive'
              const bAlive = b.status === 'alive'
              // Winners first (still alive), then by elimination order (reverse)
              if (aAlive && !bAlive) return -1
              if (!aAlive && bAlive) return 1
              if (aAlive && bAlive) return 0
              // Both dead: earlier eliminated comes later in standings
              const aElimIdx = eliminationOrder.indexOf(a.id)
              const bElimIdx = eliminationOrder.indexOf(b.id)
              return bElimIdx - aElimIdx
            }),
        },
      })
    }
  }, [alivePlayers.length, playerLives, playerScores, currentRound, playerHits, players, navigate])

  function getNumberValue(target: number): number {
    return target
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3 || playerLives[currentPlayer.id] <= 0) return

    if (target === 'miss') {
      const newHits = [...currentHits, 'M']
      setCurrentHits(newHits)
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        // End of visit - check if meets threshold
        const meetsThreshold = visitScore >= lastVisitScore
        const newLives = { ...playerLives }
        const newScores = { ...playerScores }

        if (!meetsThreshold && lastVisitScore > 0) {
          // Lose a life
          newLives[currentPlayer.id] = (newLives[currentPlayer.id] || 0) - 1
          // Track kill for the player with lastVisitScore (the killer)
          const previousPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
          const prevPlayer = players[previousPlayerIndex]
          setPlayerKills(prev => ({ ...prev, [prevPlayer.id]: (prev[prevPlayer.id] || 0) + 1 }))
          // Track elimination if lives reach 0
          if (newLives[currentPlayer.id] === 0 && !eliminationOrder.includes(currentPlayer.id)) {
            setEliminationOrder([...eliminationOrder, currentPlayer.id])
          }
        }

        newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + visitScore
        setPlayerLives(newLives)
        setPlayerScores(newScores)
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
        
        // Track visit in history
        setVisitHistory([...visitHistory, {
          playerId: currentPlayer.id,
          hits: newHits,
          score: visitScore,
          meetsThreshold,
          livesLost: !meetsThreshold && lastVisitScore > 0,
          killMade: !meetsThreshold && lastVisitScore > 0,
        }])
        
        setCurrentHits([])
        setVisitScore(0)
        setLastVisitScore(visitScore)

        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
        if (nextPlayerIndex === 0) {
          setCurrentRound((r) => r + 1)
        }
        setCurrentPlayerIndex(nextPlayerIndex)
      }
      return
    }

    if (target === 'bull') {
      const points = selectedModifier === 'double' ? 50 : 25
      const newHits = [...currentHits, (selectedModifier === 'double' ? 'DB' : 'SB')]
      setCurrentHits(newHits)
      setVisitScore(visitScore + points)
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        // End of visit
        const meetsThreshold = visitScore + points >= lastVisitScore
        const newLives = { ...playerLives }
        const newScores = { ...playerScores }

        if (!meetsThreshold && lastVisitScore > 0) {
          newLives[currentPlayer.id] = (newLives[currentPlayer.id] || 0) - 1
          const previousPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
          const prevPlayer = players[previousPlayerIndex]
          setPlayerKills(prev => ({ ...prev, [prevPlayer.id]: (prev[prevPlayer.id] || 0) + 1 }))
          // Track elimination if lives reach 0
          if (newLives[currentPlayer.id] === 0 && !eliminationOrder.includes(currentPlayer.id)) {
            setEliminationOrder([...eliminationOrder, currentPlayer.id])
          }
        }

        const totalScore = visitScore + points
        newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + totalScore
        setPlayerLives(newLives)
        setPlayerScores(newScores)
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
        
        // Track visit in history
        setVisitHistory([...visitHistory, {
          playerId: currentPlayer.id,
          hits: newHits,
          score: totalScore,
          meetsThreshold: visitScore + points >= lastVisitScore,
          livesLost: !meetsThreshold && lastVisitScore > 0,
          killMade: !meetsThreshold && lastVisitScore > 0,
        }])
        
        setCurrentHits([])
        setVisitScore(0)
        setLastVisitScore(totalScore)

        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
        if (nextPlayerIndex === 0) {
          setCurrentRound((r) => r + 1)
        }
        setCurrentPlayerIndex(nextPlayerIndex)
      }
      return
    }

    // Regular number hit
    let points = getNumberValue(target)
    let modifier = selectedModifier || 'single'
    if (selectedModifier === 'double') points *= 2
    if (selectedModifier === 'treble') points *= 3
    const hitStr = `${modifier === 'double' ? 'D' : modifier === 'treble' ? 'T' : ''}${target}`
    const newHits = [...currentHits, hitStr]

    setCurrentHits(newHits)
    setVisitScore(visitScore + points)
    setSelectedModifier(null)

    if (currentHits.length === 2) {
      // End of visit
      const totalVisitScore = visitScore + points
      const meetsThreshold = totalVisitScore >= lastVisitScore
      const newLives = { ...playerLives }
      const newScores = { ...playerScores }

      if (!meetsThreshold && lastVisitScore > 0) {
        newLives[currentPlayer.id] = (newLives[currentPlayer.id] || 0) - 1
        const previousPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
        const prevPlayer = players[previousPlayerIndex]
        setPlayerKills(prev => ({ ...prev, [prevPlayer.id]: (prev[prevPlayer.id] || 0) + 1 }))
        // Track elimination if lives reach 0
        if (newLives[currentPlayer.id] === 0 && !eliminationOrder.includes(currentPlayer.id)) {
          setEliminationOrder([...eliminationOrder, currentPlayer.id])
        }
      }

      newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + totalVisitScore
      setPlayerLives(newLives)
      setPlayerScores(newScores)
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      
      // Track visit in history
      setVisitHistory([...visitHistory, {
        playerId: currentPlayer.id,
        hits: newHits,
        score: totalVisitScore,
        meetsThreshold,
        livesLost: !meetsThreshold && lastVisitScore > 0,
        killMade: !meetsThreshold && lastVisitScore > 0,
      }])
      
      setCurrentHits([])
      setVisitScore(0)
      setLastVisitScore(totalVisitScore)

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
      
      // Also reduce visitScore based on the removed hit
      let hitValue = 0
      if (removedHit === 'M') {
        hitValue = 0
      } else if (removedHit === 'SB') {
        hitValue = 25
      } else if (removedHit === 'DB') {
        hitValue = 50
      } else {
        // Parse the hit (e.g., "D20", "T15", "10")
        const numberStr = removedHit.replace(/[DT]/g, '')
        const baseValue = parseInt(numberStr, 10)
        if (removedHit.startsWith('D')) {
          hitValue = baseValue * 2
        } else if (removedHit.startsWith('T')) {
          hitValue = baseValue * 3
        } else {
          hitValue = baseValue
        }
      }
      setVisitScore(Math.max(0, visitScore - hitValue))
    } else if (visitHistory.length > 0) {
      // Undo the last visit
      const lastVisit = visitHistory[visitHistory.length - 1]
      const newHistory = visitHistory.slice(0, -1)
      setVisitHistory(newHistory)
      
      // Restore the game state from before this visit
      const newPlayerHits = { ...playerHits }
      const newPlayerScores = { ...playerScores }
      const newPlayerLives = { ...playerLives }
      const newPlayerKills = { ...playerKills }
      
      // Remove the hits from the player's record
      newPlayerHits[lastVisit.playerId] = (newPlayerHits[lastVisit.playerId] || []).slice(0, -(lastVisit.hits.length))
      
      // Restore score (subtract what was added)
      newPlayerScores[lastVisit.playerId] = (newPlayerScores[lastVisit.playerId] || 0) - lastVisit.score
      
      // Restore lives if they were lost
      if (lastVisit.livesLost) {
        newPlayerLives[lastVisit.playerId] = (newPlayerLives[lastVisit.playerId] || 0) + 1
      }
      
      // Remove kill if it was made
      if (lastVisit.killMade) {
        const prevPlayerIdx = (players.findIndex(p => p.id === lastVisit.playerId) - 1 + players.length) % players.length
        newPlayerKills[players[prevPlayerIdx].id] = Math.max(0, (newPlayerKills[players[prevPlayerIdx].id] || 0) - 1)
      }
      
      // Update states
      setPlayerHits(newPlayerHits)
      setPlayerScores(newPlayerScores)
      setPlayerLives(newPlayerLives)
      setPlayerKills(newPlayerKills)
      
      // Go back to the previous player
      const previousPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
      setCurrentPlayerIndex(previousPlayerIndex)
      
      // Restore the previous visit's score
      if (newHistory.length > 0) {
        setLastVisitScore(newHistory[newHistory.length - 1].score)
      } else {
        setLastVisitScore(0)
      }
      
      // Reset current visit state
      setCurrentHits([])
      setVisitScore(0)
      
      // Remove from elimination order if they were just eliminated
      if (lastVisit.livesLost && newPlayerLives[lastVisit.playerId] > 0) {
        setEliminationOrder(eliminationOrder.filter(id => id !== lastVisit.playerId))
      }
    }
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  if (!user || !currentPlayer) {
    return <PageLayout title="Score Killer">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Score Killer" showHomeLink={false}>
      <GameHeader
        gameType="Score Killer"
        currentPlayerName={currentPlayer.name}
        headerStats={[
          {
            label: 'Score to beat',
            value: lastVisitScore === 0 ? '—' : lastVisitScore,
          },
        ]}
      />

      <PlayerSection
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        currentHits={currentHits}
        playerStatus={playerStatus}
        playerLives={playerLives}
        playerKills={playerKills}
        onPlayerRef={(playerId, element) => {
          playerCardRefs.current[playerId] = element
        }}
      />

      <ScoreComponent
        onAddScore={addHit}
        onRemoveLastHit={removeLastHit}
        onToggleModifier={toggleModifier}
        selectedModifier={selectedModifier}
        currentHits={currentHits}
        canScoreMore={currentHits.length < 3 && currentPlayerStatus === 'alive'}
      />
    </PageLayout>
  )
}
