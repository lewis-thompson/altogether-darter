import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface SplitscoreProps {
  players: Player[]
}

export function SplitscorerPage({ players }: SplitscoreProps) {
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
    players.reduce((acc, player) => ({ ...acc, [player.id]: 40 }), {})
  )
  const [playerStatus] = useState<Record<number, PlayerStatus>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 'alive' as PlayerStatus }), {})
  )

  const roundTargets = [
    { number: 15, type: 'number', name: '15' },
    { number: 16, type: 'number', name: '16' },
    { number: 0, type: 'double', name: 'Double' },
    { number: 17, type: 'number', name: '17' },
    { number: 18, type: 'number', name: '18' },
    { number: 0, type: 'treble', name: 'Treble' },
    { number: 19, type: 'number', name: '19' },
    { number: 20, type: 'number', name: '20' },
    { number: 50, type: 'number', name: 'Bullseye' },
  ] // 9 rounds

  const startingScore = 40

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]
  const currentTarget = roundTargets[currentRound - 1]

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (!currentTarget) return // No more rounds

    let hitStr = ''

    if (target === 'miss') {
      hitStr = 'M'
    } else if (target === 'bull') {
      hitStr = selectedModifier === 'double' ? 'DB' : 'SB'
    } else {
      hitStr = `${selectedModifier === 'double' ? 'D' : selectedModifier === 'treble' ? 'T' : 'S'}${target}`
    }

    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)
    setSelectedModifier(null)

    if (currentHits.length === 2) {
      // End of visit (3 darts)
      // Check if all 3 darts missed the target
      const allMissed = newHits.every((hit) => !checkIfOnTarget(hit, currentTarget))

      let newScore = (playerScores[currentPlayer.id] || startingScore)
      if (allMissed) {
        // Halve the score
        newScore = Math.floor(newScore / 2)
      } else {
        // Add points for hits on target
        const visitPoints = newHits.reduce((sum, hit) => {
          if (hit === 'M' || hit === 'SB') return sum
          if (hit === 'DB') return sum + (currentTarget.type === 'double' ? 50 : 0)
          // Parse number from hit
          const num = parseInt(hit.replace(/^D|^T|^S/, ''), 10)
          if (currentTarget.type === 'number' && currentTarget.number === num) return sum + num
          if (currentTarget.type === 'double' && (hit.startsWith('D') || hit === 'DB')) return sum + (hit === 'DB' ? 50 : num * 2)
          if (currentTarget.type === 'treble' && hit.startsWith('T')) return sum + num * 3
          return sum
        }, 0)
        newScore += visitPoints
      }

      setPlayerScores({
        ...playerScores,
        [currentPlayer.id]: newScore,
      })

      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })

      // Check if all rounds complete
      if (currentRound === 9 && currentPlayerIndex === players.length - 1) {
        // Game over
        const winner = players.reduce((best, p) =>
          (playerScores[p.id] || startingScore) > (playerScores[best.id] || startingScore) ? p : best
        )
        navigate('/game-complete', {
          state: {
            winner,
            winnerPoints: playerScores[winner.id] || startingScore,
            totalPlayers: players.length,
            totalRounds: 9,
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

  function checkIfOnTarget(hitStr: string | 'miss', target?: typeof currentTarget): boolean {
    if (!target) return false
    if (hitStr === 'M') return false
    if (target.type === 'number') {
      if (hitStr === 'SB' || hitStr === 'DB') return target.number === 50
      const num = parseInt(hitStr.replace(/^D|^T|^S/, ''), 10)
      return num === target.number
    }
    if (target.type === 'double') {
      if (hitStr === 'DB') return true
      return hitStr.startsWith('D')
    }
    if (target.type === 'treble') {
      return hitStr.startsWith('T')
    }
    return false
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
    return <PageLayout title="Splitscore">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Splitscore" showHomeLink={false}>
      <GameHeader
        gameType="Splitscore"
        currentPlayerName={currentPlayer.name}
        round={currentRound}
      />

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
