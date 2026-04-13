import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface ScoreKillerProps {
  players: Player[]
  killerThreshold: number
}

export function ScoreKillerPage({ players, killerThreshold }: ScoreKillerProps) {
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
    players.reduce((acc, player) => ({ ...acc, [player.id]: 3 }), {})
  )
  const [playerKills, setPlayerKills] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )
  const [lastVisitScore, setLastVisitScore] = useState(0)
  const [visitScore, setVisitScore] = useState(0)

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
          finalStandings: players.map((p) => ({
            id: p.id,
            name: p.name,
            selectedNumber: null,
            points: playerScores[p.id] || 0,
            status: 'alive' as PlayerStatus,
          })),
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
        }

        newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + visitScore
        setPlayerLives(newLives)
        setPlayerScores(newScores)
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
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
        }

        const totalScore = visitScore + points
        newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + totalScore
        setPlayerLives(newLives)
        setPlayerScores(newScores)
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
        })
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
      }

      newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + totalVisitScore
      setPlayerLives(newLives)
      setPlayerScores(newScores)
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
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
      setCurrentHits(currentHits.slice(0, -1))
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
        round={currentRound}
        threshold={killerThreshold}
      />

      <PlayerSection
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        playerHits={playerHits}
        playerPoints={Object.fromEntries(Object.entries(playerScores).map(([k, v]) => [k, String(v)]))}
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
