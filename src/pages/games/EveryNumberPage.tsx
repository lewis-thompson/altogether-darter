import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
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

  function getDisplayHits(totalHits: number): string {
    const hitsRequired = hitsPerNumber
    
    // If we haven't hit it the required number of times yet, show current count
    if (totalHits < hitsRequired) {
      return `${totalHits}/${hitsRequired}`
    }
    
    // If we've hit it exactly the required number of times
    if (totalHits === hitsRequired) {
      return `${hitsRequired}/${hitsRequired}`
    }
    
    // If we've overshot, count down: (3 - (totalHits % 3)) / 3
    const remainder = totalHits % hitsRequired
    if (remainder === 0) {
      return `0/${hitsRequired}`
    }
    const displayCount = hitsRequired - remainder
    return `${displayCount}/${hitsRequired}`
  }

  function isNumberComplete(totalHits: number): boolean {
    // Only show as complete/green if exactly hitsPerNumber hits
    return totalHits === hitsPerNumber
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
    if (currentHits.length === 0) return

    const lastHit = currentHits[currentHits.length - 1]
    if (lastHit === 'M') {
      setCurrentHits(currentHits.slice(0, -1))
      return
    }

    // Parse the last hit to determine which number was hit
    let targetNum: number | null = null
    let hitPoints = 1

    if (lastHit === 'DB') {
      targetNum = 0
      hitPoints = 2
    } else if (lastHit === 'SB') {
      targetNum = 0
      hitPoints = 1
    } else if (lastHit.startsWith('D')) {
      targetNum = parseInt(lastHit.substring(1))
      hitPoints = 2
    } else if (lastHit.startsWith('T')) {
      targetNum = parseInt(lastHit.substring(1))
      hitPoints = 3
    } else {
      targetNum = parseInt(lastHit)
      hitPoints = 1
    }

    // Undo the hit count
    if (targetNum !== null) {
      const newPlayerNumberHits = { ...playerNumberHits }
      newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
      newPlayerNumberHits[currentPlayer.id][targetNum] = Math.max(0, (newPlayerNumberHits[currentPlayer.id][targetNum] || 0) - hitPoints)
      setPlayerNumberHits(newPlayerNumberHits)
    }

    setCurrentHits(currentHits.slice(0, -1))
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  if (!user || !currentPlayer) {
    return <div>Loading...</div>
  }

  const playerDataForTemplate = players.map((player) => ({
    id: String(player.id),
    name: player.name,
    hits: currentPlayerIndex === players.indexOf(player) ? currentHits : [],
    additionalData: {},
  }))

  const renderPlayerCard = (player: any) => (
    <>
      <div className="template-player-header">
        <span className="template-player-name">{player.name}</span>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '6px' }}>
          {allNumbers.map((num) => {
            const hits = playerNumberHits[player.id]?.[num] || 0
            const displayHits = getDisplayHits(hits)
            const isComplete = isNumberComplete(hits)
            return (
              <div
                key={num}
                style={{
                  padding: '8px',
                  backgroundColor: isComplete ? '#d4edda' : '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                <div>{num === 0 ? 'B' : num}</div>
                <div style={{ fontSize: '10px', marginTop: '2px', color: '#666' }}>{displayHits}</div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <GameTemplate
      headerConfig={{
        title: 'Every Number',
        currentPlayer: currentPlayer.name,
        round: currentRound,
        stats: [{ label: 'Hits per Number', value: hitsPerNumber }],
      }}
      players={playerDataForTemplate}
      currentPlayerIndex={currentPlayerIndex}
      currentHits={currentHits}
      onAddScore={addHit}
      onRemoveLastHit={removeLastHit}
      onToggleModifier={toggleModifier}
      selectedModifier={selectedModifier}
      renderPlayerCard={renderPlayerCard}
    />
  )
}
