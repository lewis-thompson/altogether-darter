import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface DoublesProps {
  players: Player[]
}

export function DoublesPage({ players }: DoublesProps) {
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

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  function getHitValue(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): string {
    if (target === 'miss') return 'M'
    if (target === 'bull') return selectedModifier === 'double' ? 'DB' : 'SB'
    if (modifier === 'double') return `D${target}`
    if (modifier === 'treble') return `T${target}`
    return String(target)
  }

  function getPointsForHit(hit: string): number {
    if (hit === 'M' || hit === 'SB') return 0
    if (hit === 'DB') return 50
    if (hit.startsWith('D')) {
      const num = parseInt(hit.substring(1), 10)
      return num * 2
    }
    return 0
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (!selectedModifier && target !== 'miss' && target !== 'bull') return

    const hitValue = target === 'bull' && selectedModifier === null ? 'SB' : getHitValue(target, selectedModifier)
    const points = getPointsForHit(hitValue)

    if (points === 0) {
      // Miss or non-double - reset modifier
      setCurrentHits([...currentHits, hitValue])
      setSelectedModifier(null)
      return
    }

    setCurrentHits([...currentHits, hitValue])
    setSelectedModifier(null)

    if (currentHits.length === 2) {
      // This is the 3rd dart in the visit, move to next player
      const newHits = [...currentHits, hitValue]
      const visitScore = newHits.reduce((sum, h) => sum + getPointsForHit(h), 0)
      const newPlayerScores = { ...playerScores }
      newPlayerScores[currentPlayer.id] = (newPlayerScores[currentPlayer.id] || 0) + visitScore
      setPlayerScores(newPlayerScores)
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])

      // Determine if game ends (all players have attempted all rounds)
      const allPlayersFinished = players.every((p) => playerHits[p.id]?.length > 0)
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        if (allPlayersFinished) {
          // Game over - winner is highest score
          const winner = players.reduce((best, p) =>
            (newPlayerScores[p.id] || 0) > (newPlayerScores[best.id] || 0) ? p : best
          )
          navigate('/game-complete', {
            state: {
              winner,
              winnerPoints: newPlayerScores[winner.id] || 0,
              totalPlayers: players.length,
              totalRounds: currentRound,
              totalAttempts: Object.values(playerHits).flat().length + newHits.length,
              totalHits: currentHits.length,
              totalMisses: newHits.filter((h) => h === 'M').length,
              bullseyeBuybackEnabled: false,
              bullseyeRounds: null,
            },
          })
          return
        }
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
    return <PageLayout title="Doubles">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Doubles" showHomeLink={false}>
      <GameHeader gameType="Doubles" currentPlayerName={currentPlayer.name} round={currentRound} />

      <PlayerSection
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        playerHits={playerHits}
        playerPoints={Object.fromEntries(Object.entries(playerScores).map(([k, v]) => [k, String(v)]))}
        playerStatus={playerStatus}
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
