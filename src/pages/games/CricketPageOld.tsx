import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import type { Player } from '../../types'

interface CricketProps {
  players: Player[]
}

// Classic Cricket: 15, 16, 17, 18, 19, 20, Bull
const CRICKET_NUMBERS = [15, 16, 17, 18, 19, 20, 0] // 0 represents Bull

type NumberStatus = 'open' | 'closed' | 'not-started'

export function CricketPage({ players }: CricketProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  // Track hits per number per player: { [playerId]: { [number]: hitCount } }
  const [playerNumberHits, setPlayerNumberHits] = useState<Record<number, Record<number, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      CRICKET_NUMBERS.forEach((num) => {
        acc[player.id][num] = 0
      })
      return acc
    }, {} as Record<number, Record<number, number>>)
  )

  // Track points per number per player: { [playerId]: { [number]: points } }
  const [playerNumberPoints, setPlayerNumberPoints] = useState<Record<number, Record<number, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      CRICKET_NUMBERS.forEach((num) => {
        acc[player.id][num] = 0
      })
      return acc
    }, {} as Record<number, Record<number, number>>)
  )

  // Track total points per player
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )

  // Track all hits for history
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )

  const currentPlayer = players[currentPlayerIndex]

  // Determine if a number is open for a specific player (3+ hits)
  function isNumberOpen(playerId: number, number: number): boolean {
    return (playerNumberHits[playerId]?.[number] || 0) >= 3
  }

  // Determine if a number is closed (all players have opened it)
  function isNumberClosed(number: number): boolean {
    return players.every((p) => isNumberOpen(p.id, number))
  }

  // Get number status
  function getNumberStatus(number: number): NumberStatus {
    if (isNumberClosed(number)) return 'closed'
    if (players.some((p) => isNumberOpen(p.id, number))) return 'open'
    return 'not-started'
  }

  // Check if game is over
  function isGameOver(): boolean {
    // All numbers must be closed
    const allClosed = CRICKET_NUMBERS.every((num) => isNumberClosed(num))
    return allClosed
  }

  // Get winner (player with most points if game is over)
  function getWinner(): Player | null {
    if (!isGameOver()) return null
    return players.reduce((best, p) =>
      (playerScores[p.id] ?? 0) > (playerScores[best.id] ?? 0) ? p : best
    )
  }

  function formatHit(target: 'miss' | 'bull' | number, modifier: 'double' | 'treble' | null): string {
    if (target === 'miss') return 'M'
    if (target === 'bull') return modifier === 'double' ? 'DB' : 'SB'
    if (modifier === 'double') return `D${target}`
    if (modifier === 'treble') return `T${target}`
    return String(target)
  }

  function getHitMultiplier(modifier: 'double' | 'treble' | null): number {
    if (modifier === 'double') return 2
    if (modifier === 'treble') return 3
    return 1
  }

  function addHit(target: 'miss' | 'bull' | number) {
    if (currentHits.length >= 3) return
    if (isGameOver()) return

    const hitStr = formatHit(target, selectedModifier)
    const newHits = [...currentHits, hitStr]
    setCurrentHits(newHits)
    setSelectedModifier(null)

    // If not a miss, update number hits and potentially points
    if (target !== 'miss') {
      const targetNum = target === 'bull' ? 0 : target
      const multiplier = getHitMultiplier(selectedModifier)
      const newPlayerNumberHits = { ...playerNumberHits }
      newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
      const oldHits = newPlayerNumberHits[currentPlayer.id][targetNum] || 0
      newPlayerNumberHits[currentPlayer.id][targetNum] = oldHits + multiplier

      setPlayerNumberHits(newPlayerNumberHits)

      // Calculate score change
      const wasOpen = oldHits >= 3
      const isNowOpen = newPlayerNumberHits[currentPlayer.id][targetNum] >= 3
      const isClosed = isNumberClosed(targetNum)
      let pointsToAdd = 0

      if (isNowOpen && !isClosed) {
        // Number is newly open for this player and not closed for all
        // Award points
        const newPlayerNumberPoints = { ...playerNumberPoints }
        newPlayerNumberPoints[currentPlayer.id] = { ...newPlayerNumberPoints[currentPlayer.id] }
        const pointValue = targetNum === 0 ? 50 : targetNum
        
        if (!wasOpen) {
          // Number was just opened, only award for the hits above 3
          pointsToAdd = pointValue * (newPlayerNumberHits[currentPlayer.id][targetNum] - 3)
        } else {
          // Number was already open, award for all multiplier hits
          pointsToAdd = pointValue * multiplier
        }

        newPlayerNumberPoints[currentPlayer.id][targetNum] = (newPlayerNumberPoints[currentPlayer.id][targetNum] || 0) + pointsToAdd
        setPlayerNumberPoints(newPlayerNumberPoints)

        const newScore = (playerScores[currentPlayer.id] || 0) + pointsToAdd
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: newScore,
        })
      }
    }

    // Check if visit is over (3 darts)
    if (newHits.length === 3) {
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: [...(playerHits[currentPlayer.id] || []), ...newHits],
      })
      setCurrentHits([])

      // Move to next player
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      if (nextPlayerIndex === 0) {
        setCurrentRound((r) => r + 1)
      }
      setCurrentPlayerIndex(nextPlayerIndex)

      // Check if game is over
      if (isGameOver()) {
        const winner = getWinner()
        if (winner) {
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
        }
      }
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
    return <div>Loading...</div>
  }

  const numberButtons = [
    ...CRICKET_NUMBERS.filter((n) => n !== 0),
    'bull' as const,
  ]

  return (
    <main className="page">
      <header className="page-header">
        <h1>Cricket</h1>
        <a href="/" className="home-link">Home</a>
      </header>

      <div className="page-content">
        {/* Header section */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              <span style={{ color: '#666' }}>Current Player:</span> <span style={{ color: '#333' }}>{currentPlayer.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ padding: '8px 12px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Round:</span> <span style={{ fontWeight: '600' }}>{currentRound}</span>
              </div>
            </div>
          </div>

          {/* Cricket numbers status */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {CRICKET_NUMBERS.map((num) => {
              const status = getNumberStatus(num)
              const numStr = num === 0 ? 'Bull' : String(num)
              const bgColor = status === 'closed' ? '#28a745' : status === 'open' ? '#ffc107' : '#e9ecef'
              const textColor = status === 'closed' ? 'white' : status === 'open' ? '#000' : '#666'

              return (
                <div
                  key={num}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '12px',
                  }}
                >
                  {numStr} {status === 'closed' ? '✓' : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Player Progress */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Players</h2>
          {players.map((player) => (
            <div key={player.id} style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: currentPlayerIndex === players.indexOf(player) ? '2px solid #007bff' : '1px solid #eee' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{player.name}</span>
                <span style={{ color: '#007bff', fontSize: '14px' }}>Points: {playerScores[player.id] || 0}</span>
              </div>

              {/* Cricket numbers table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #eee' }}>Number</th>
                      {CRICKET_NUMBERS.map((num) => (
                        <th key={num} style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #eee', minWidth: '50px' }}>
                          {num === 0 ? 'B' : num}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: '600', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9' }}>Hits</td>
                      {CRICKET_NUMBERS.map((num) => {
                        const hits = playerNumberHits[player.id]?.[num] || 0
                        const isOpen = hits >= 3
                        return (
                          <td
                            key={num}
                            style={{
                              textAlign: 'center',
                              padding: '8px',
                              borderRight: '1px solid #eee',
                              backgroundColor: isOpen && isNumberClosed(num) ? '#d4edda' : isOpen ? '#fff3cd' : '#f0f0f0',
                              fontWeight: '600',
                            }}
                          >
                            {isOpen && isNumberClosed(num) ? '✓' : `${hits}/3`}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: '600', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9' }}>Points</td>
                      {CRICKET_NUMBERS.map((num) => {
                        const points = playerNumberPoints[player.id]?.[num] || 0
                        const isOpen = (playerNumberHits[player.id]?.[num] || 0) >= 3
                        return (
                          <td
                            key={num}
                            style={{
                              textAlign: 'center',
                              padding: '8px',
                              borderRight: '1px solid #eee',
                              backgroundColor: isNumberClosed(num) ? '#e8f5e9' : '#f0f0f0',
                              fontWeight: isOpen ? '600' : '400',
                              color: isOpen && !isNumberClosed(num) ? '#0066cc' : '#666',
                            }}
                          >
                            {points > 0 ? points : '-'}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Score input section */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Current Hits: {currentHits.join(', ') || 'none'}</h3>
            <button onClick={removeLastHit} disabled={currentHits.length === 0} style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentHits.length === 0 ? 0.5 : 1 }}>
              Remove Last Hit
            </button>
          </div>

          {/* Modifiers */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => toggleModifier('double')}
              style={{
                padding: '10px 16px',
                backgroundColor: selectedModifier === 'double' ? '#007bff' : '#e9ecef',
                color: selectedModifier === 'double' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Double
            </button>
            <button
              onClick={() => toggleModifier('treble')}
              style={{
                padding: '10px 16px',
                backgroundColor: selectedModifier === 'treble' ? '#007bff' : '#e9ecef',
                color: selectedModifier === 'treble' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Treble
            </button>
          </div>

          {/* Number buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px' }}>
            {numberButtons.map((num, index) => (
              <button
                key={index}
                onClick={() => addHit(num === 'bull' ? 'bull' : num)}
                style={{
                  padding: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                {num === 'bull' ? 'Bull' : num}
              </button>
            ))}
            <button
              onClick={() => addHit('miss')}
              style={{
                padding: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Miss
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
