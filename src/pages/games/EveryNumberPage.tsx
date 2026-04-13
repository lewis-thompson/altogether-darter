import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import type { Player, PlayerStatus } from '../../types'

interface EveryNumberProps {
  players: Player[]
}

export function EveryNumberPage({ players }: EveryNumberProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const numbers = [...Array(20).keys()].map((i) => i + 1)
  const hitsPerNumber = 3 // Default - can be parameterized
  const includeBullseye = true
  const allNumbers = includeBullseye ? [...numbers, 0] : numbers // 0 represents bull

  const [playerNumberHits, setPlayerNumberHits] = useState<Record<number, Record<number | string, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      allNumbers.forEach((n) => {
        acc[player.id][n] = 0
      })
      return acc
    }, {} as Record<number, Record<number | string, number>>)
  )
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

  function checkGameComplete(): boolean {
    return players.some((player) =>
      allNumbers.every((num) => (playerNumberHits[player.id][num] || 0) >= hitsPerNumber)
    )
  }

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

    const targetNum = target === 'bull' ? 0 : target
    const hitPoints = getPointsForHit(selectedModifier)
    const hitStr = target === 'bull' ? (selectedModifier === 'double' ? 'DB' : 'SB') : `${selectedModifier === 'double' ? 'D' : selectedModifier === 'treble' ? 'T' : ''}${target}`

    // Update number hit count
    const newPlayerNumberHits = { ...playerNumberHits }
    newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
    newPlayerNumberHits[currentPlayer.id][targetNum] = (newPlayerNumberHits[currentPlayer.id][targetNum] || 0) + hitPoints

    setPlayerNumberHits(newPlayerNumberHits)

    // Update scores
    const newScore = allNumbers.reduce((sum, num) => {
      const hits = newPlayerNumberHits[currentPlayer.id][num] || 0
      if (hits >= hitsPerNumber) return sum + hitsPerNumber
      return sum + hits
    }, 0)

    setPlayerScores({
      ...playerScores,
      [currentPlayer.id]: newScore,
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
      if (checkGameComplete()) {
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

      // Move to next player
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
    return <PageLayout title="Every Number">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Every Number" showHomeLink={false}>
      <GameHeader
        gameType="Every Number"
        currentPlayerName={currentPlayer.name}
        round={currentRound}
        headerStats={[
          { label: 'Hits per number', value: hitsPerNumber }
        ]}
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

      {/* Display number hits for each player */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '12px' }}>Number Progress</h3>
        {players.map((player) => (
          <div key={player.id} style={{ marginBottom: '16px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #eee' }}>
            <strong>{player.name}</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '4px', marginTop: '8px' }}>
              {allNumbers.map((num) => {
                const hits = playerNumberHits[player.id]?.[num] || 0
                const isComplete = hits >= hitsPerNumber
                return (
                  <div
                    key={num}
                    style={{
                      padding: '8px',
                      backgroundColor: isComplete ? '#d4edda' : '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '0.9em',
                      fontWeight: 'bold'
                    }}
                  >
                    {num === 0 ? 'B' : num}<br/>
                    <span style={{ fontSize: '0.8em' }}>{hits}/{hitsPerNumber}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

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
