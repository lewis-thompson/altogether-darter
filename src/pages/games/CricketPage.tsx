import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface CricketProps {
  players: Player[]
}

export function CricketPage({ players }: CricketProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const cricketNumbers = [15, 16, 17, 18, 19, 20, 0] // 0 = bull
  const hitsToClose = 3

  const [playerNumberHits, setPlayerNumberHits] = useState<Record<number, Record<number, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      cricketNumbers.forEach((n) => {
        acc[player.id][n] = 0
      })
      return acc
    }, {} as Record<number, Record<number, number>>)
  )

  const [closedNumbers, setClosedNumbers] = useState<Set<number>>(new Set())
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = []
      return acc
    }, {} as Record<number, string[]>)
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = 0
      return acc
    }, {} as Record<number, number>)
  )
  const [playerStatus] = useState<Record<number, PlayerStatus>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = 'alive' as PlayerStatus
      return acc
    }, {} as Record<number, PlayerStatus>)
  )

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  function getPointValue(target: number): number {
    if (target === 0) return 50
    return target
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return

    if (target === 'miss') {
      const newHits = [...currentHits, 'M']
      setCurrentHits(newHits)
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        // End of visit
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
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
    if (!cricketNumbers.includes(targetNum)) {
      // Miss the target number
      const newHits = [...currentHits, 'M']
      setCurrentHits(newHits)
      setSelectedModifier(null)

      if (currentHits.length === 2) {
        setPlayerHits({
          ...playerHits,
          [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
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

    // Valid cricket number
    const hitsValue = selectedModifier === 'double' ? 2 : selectedModifier === 'treble' ? 3 : 1
    const hitStr = `${selectedModifier === 'double' ? 'D' : selectedModifier === 'treble' ? 'T' : ''}${targetNum === 0 ? 'B' : targetNum}`

    // Update player's hits on this number
    const newPlayerNumberHits = { ...playerNumberHits }
    newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
    newPlayerNumberHits[currentPlayer.id][targetNum] = (newPlayerNumberHits[currentPlayer.id][targetNum] || 0) + hitsValue

    // Check if this number is now closed (all players have at least hitsToClose)
    const newClosedNumbers = new Set(closedNumbers)
    const allPlayersHitEnough = players.every(
      (p) => (newPlayerNumberHits[p.id]?.[targetNum] || 0) >= hitsToClose
    )
    if (allPlayersHitEnough) {
      newClosedNumbers.add(targetNum)
    }

    setPlayerNumberHits(newPlayerNumberHits)
    setClosedNumbers(newClosedNumbers)

    // Update score if number is closed
    let scoreIncrease = 0
    if (newClosedNumbers.has(targetNum)) {
      // Number is closed, calculate points scored this hit
      const excessHits = (newPlayerNumberHits[currentPlayer.id][targetNum] || 0) - hitsToClose
      if (excessHits > 0) {
        // Only the hits above hitsToClose count as points
        scoreIncrease = getPointValue(targetNum) * hitsValue
      }
    }

    setPlayerScores({
      ...playerScores,
      [currentPlayer.id]: (playerScores[currentPlayer.id] || 0) + scoreIncrease,
    })

    setCurrentHits([...currentHits, hitStr])
    setSelectedModifier(null)

    if (currentHits.length === 2) {
      // End of visit
      const newHits = [...currentHits, hitStr]
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })

      // Check if game complete
      if (newClosedNumbers.size === cricketNumbers.length) {
        // All numbers closed - winner is highest scorer
        const winner = players.reduce((best, p) =>
          (playerScores[p.id] || 0) > (playerScores[best.id] || 0) ? p : best
        )
        navigate('/game-complete', {
          state: {
            winner,
            winnerPoints: playerScores[winner.id] || 0,
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

      setCurrentHits([])

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
    return <PageLayout title="Cricket">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Cricket" showHomeLink={false}>
      <GameHeader gameType="Cricket" currentPlayerName={currentPlayer.name} round={currentRound} />

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
