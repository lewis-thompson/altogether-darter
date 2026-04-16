import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import type { Player } from '../../types'

interface EveryNumberProps {
  players: Player[]
  hitsPerNumber?: number
  includeBullseye?: boolean
}

export function EveryNumberPage({ players, hitsPerNumber: hitsPerNumberProp = 3, includeBullseye: includeBullseyeProp = true }: EveryNumberProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const numbers = [...Array(20).keys()].map((i) => i + 1)
  const hitsPerNumber = hitsPerNumberProp
  const includeBullseye = includeBullseyeProp
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
  
  const currentPlayer = players[currentPlayerIndex]

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

  function getDisplayHits(totalHits: number): number {
    // Display hits modulo hitsPerNumber
    // If totalHits = 4 and hitsPerNumber = 3: 4 % 3 = 1, so display 1/3
    // If totalHits = 5 and hitsPerNumber = 3: 5 % 3 = 2, so display 2/3
    // If totalHits = 6 and hitsPerNumber = 3: 6 % 3 = 0, so display 0/3
    return totalHits % hitsPerNumber
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
        const winner = players.reduce((best, p) => {
          const bestScore = allNumbers.reduce((sum, num) => {
            const hits = playerNumberHits[best.id][num] || 0
            return sum + (hits >= hitsPerNumber ? 1 : 0)
          }, 0)
          const pScore = allNumbers.reduce((sum, num) => {
            const hits = newPlayerNumberHits[p.id][num] || 0
            return sum + (hits >= hitsPerNumber ? 1 : 0)
          }, 0)
          return pScore > bestScore ? p : best
        })
        
        navigate('/game-complete', {
          state: {
            winner,
            winnerPoints: allNumbers.reduce((sum, num) => {
              const hits = newPlayerNumberHits[winner.id][num] || 0
              return sum + (hits >= hitsPerNumber ? 1 : 0)
            }, 0),
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
    return <div>Loading...</div>
  }

  const numberButtons = [
    ...Array.from({ length: 20 }, (_, i) => i + 1),
    'bull' as const,
  ]

  return (
    <main className="page">
      <header className="page-header">
        <h1>Every Number</h1>
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
              <div style={{ padding: '8px 12px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Hits per Number:</span> <span style={{ fontWeight: '600' }}>{hitsPerNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Number Progress - Only showing names and progress */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Player Progress</h2>
          {players.map((player) => (
            <div key={player.id} style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: currentPlayerIndex === players.indexOf(player) ? '2px solid #007bff' : '1px solid #eee' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '16px' }}>{player.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '6px' }}>
                {allNumbers.map((num) => {
                  const hits = playerNumberHits[player.id]?.[num] || 0
                  const displayHits = getDisplayHits(hits)
                  const isComplete = hits >= hitsPerNumber
                  return (
                    <div
                      key={num}
                      style={{
                        padding: '10px',
                        backgroundColor: isComplete ? '#d4edda' : '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <div>{num === 0 ? 'B' : num}</div>
                      <div style={{ fontSize: '11px', marginTop: '2px' , color: '#666' }}>{displayHits}/{hitsPerNumber}</div>
                    </div>
                  )
                })}
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
