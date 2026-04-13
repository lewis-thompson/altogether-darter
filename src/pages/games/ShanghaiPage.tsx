import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface ShanghaiProps {
  players: Player[]
}

export function ShanghaiPage({ players }: ShanghaiProps) {
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

  const roundSequences = [
    [...Array(7).keys()].map((i) => i + 1), // Round 1: 1-7
    [...Array(8).keys()].map((i) => i + 8), // Round 2: 8-15
    [...Array(5).keys()].map((i) => i + 16).concat([0]), // Round 3: 16-20 + Bull (0)
  ]

  const [currentGameRound, setCurrentGameRound] = useState(1)
  const [playerNumberHits, setPlayerNumberHits] = useState<Record<number, Record<string, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      return acc
    }, {} as Record<number, Record<string, number>>)
  )

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]
  const roundNumbers = roundSequences[currentGameRound - 1] || []

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  function getPointsForHit(modifier: 'double' | 'treble' | null): number {
    if (modifier === 'double') return 2
    if (modifier === 'treble') return 3
    return 1
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (target === 'miss') {
      setCurrentHits([...currentHits, 'M'])
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        // End of visit
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...currentHits, 'M'],
        })
        setCurrentHits([])

        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
        if (nextPlayerIndex === 0) {
          setCurrentRound((r) => r + 1)
        }
        setCurrentPlayerIndex(nextPlayerIndex)
      }
      return
    }

    if (!roundNumbers.includes(target === 'bull' ? 0 : target)) {
      // Hit wrong number for this round
      setCurrentHits([...currentHits, 'M'])
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...currentHits, 'M'],
        })
        setCurrentHits([])

        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
        if (nextPlayerIndex === 0) {
          setCurrentRound((r) => r + 1)
        }
        setCurrentPlayerIndex(nextPlayerIndex)
      }
      return
    }

    const targetNum = target === 'bull' ? 0 : target
    const hitModifier = selectedModifier || 'single'
    const hitStr = `${hitModifier === 'double' ? 'D' : hitModifier === 'treble' ? 'T' : 'S'}${targetNum}`

    // Update number hits
    const newPlayerNumberHits = { ...playerNumberHits }
    newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
    newPlayerNumberHits[currentPlayer.id][hitStr] = (newPlayerNumberHits[currentPlayer.id][hitStr] || 0) + 1

    // Check for shanghai
    const roundHits = Object.fromEntries(
      Object.entries(newPlayerNumberHits[currentPlayer.id])
        .filter(([k]) => k.includes(String(targetNum)))
        .map(([k, v]) => [k, v])
    )

    const hasShanghai = roundHits[`S${targetNum}`] > 0 && roundHits[`D${targetNum}`] > 0 && roundHits[`T${targetNum}`] > 0

    setPlayerNumberHits(newPlayerNumberHits)

    // Calculate score
    const points = getPointsForHit(selectedModifier)
    const value = points
    const newScore = (playerScores[currentPlayer.id] || 0) + value

    setPlayerScores({
      ...playerScores,
      [currentPlayer.id]: newScore,
    })

    setCurrentHits([...currentHits, hitStr])
    setSelectedModifier(null)

    if (hasShanghai || currentHits.length === 2) {
      // Game complete (shanghai or normal end of visit)
      const newHits = hasShanghai ? [...currentHits, hitStr] : [...currentHits, hitStr]
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })

      if (hasShanghai) {
        // Winner is this player!
        navigate('/game-complete', {
          state: {
            winner: currentPlayer,
            winnerPoints: newScore,
            totalPlayers: players.length,
            totalRounds: currentGameRound,
            totalAttempts: Object.values(playerHits).flat().length + newHits.length,
            totalHits: newHits.filter((h) => h !== 'M').length,
            totalMisses: newHits.filter((h) => h === 'M').length,
            bullseyeBuybackEnabled: false,
            bullseyeRounds: null,
          },
        })
        return
      }

      setCurrentHits([])

      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        if (currentGameRound === 3) {
          // Game over - all rounds complete
          const winner = players.reduce((best, p) =>
            (playerScores[p.id] || 0) > (playerScores[best.id] || 0) ? p : best
          )
          navigate('/game-complete', {
            state: {
              winner,
              winnerPoints: playerScores[winner.id] || 0,
              totalPlayers: players.length,
              totalRounds: 3,
              totalAttempts: Object.values(playerHits).flat().length + newHits.length,
              totalHits: newHits.filter((h) => h !== 'M').length,
              totalMisses: newHits.filter((h) => h === 'M').length,
              bullseyeBuybackEnabled: false,
              bullseyeRounds: null,
            },
          })
          return
        }
        setCurrentGameRound((r) => r + 1)
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
    return <PageLayout title="Shanghai">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Shanghai" showHomeLink={false}>
      <GameHeader gameType="Shanghai" currentPlayerName={currentPlayer.name} round={currentRound} />

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
