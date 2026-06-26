import { useState, useRef } from 'react'
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
  const [lastVisitHits, setLastVisitHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = []
      return acc
    }, {} as Record<number, string[]>)
  )

  const currentPlayer = players[currentPlayerIndex]
  const navGuard = useRef(false)

  function checkCompleteFromState(numberHits: Record<number, Record<number | string, number>>): boolean {
    return players.some((player) =>
      allNumbers.every((num) => (numberHits[player.id][num] || 0) >= hitsPerNumber)
    )
  }

  function countCompletedNumbers(playerId: number, numberHits: Record<number, Record<number | string, number>>): number {
    return allNumbers.filter((num) => (numberHits[playerId][num] || 0) >= hitsPerNumber).length
  }

  function totalDartsThrown(): number {
    return Object.values(playerHits).flat().length
  }

  function getPointsForHit(modifier: 'double' | 'treble' | null): number {
    if (modifier === 'double') return 2
    if (modifier === 'treble') return 3
    return 1
  }

  function calculateHitCount(currentCount: number, hitPoints: number): number {
    const newCount = currentCount + hitPoints
    if (newCount > hitsPerNumber) {
      // Bounce back like Killer: if over the threshold, subtract the excess
      return hitsPerNumber - (newCount - hitsPerNumber)
    }
    return newCount
  }

  function getDisplayHits(totalHits: number): string {
    return `${totalHits}/${hitsPerNumber}`
  }

  function isNumberComplete(totalHits: number): boolean {
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
        setLastVisitHits((current) => ({
          ...current,
          [currentPlayer.id]: newHits,
        }))
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

    // Update number hit count with bounce-back logic
    const newPlayerNumberHits = { ...playerNumberHits }
    newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
    const currentCount = newPlayerNumberHits[currentPlayer.id][targetNum] || 0
    newPlayerNumberHits[currentPlayer.id][targetNum] = calculateHitCount(currentCount, hitPoints)

    setPlayerNumberHits(newPlayerNumberHits)
    const newCurrentHits = [...currentHits, hitStr]
    setCurrentHits(newCurrentHits)
    setSelectedModifier(null)

    // Check win after every dart, not just end of visit
    const isComplete = checkCompleteFromState(newPlayerNumberHits)

    if (newCurrentHits.length === 3 || isComplete) {
      // End of visit (or early win)
      const newHits = newCurrentHits
      const cumulativeHits = [...(playerHits[currentPlayer.id] || []), ...newHits]
      setPlayerHits({
        ...playerHits,
        [currentPlayer.id]: cumulativeHits,
      })
      setLastVisitHits((current) => ({
        ...current,
        [currentPlayer.id]: newHits,
      }))

      if (isComplete && !navGuard.current) {
        navGuard.current = true
        const totalDarts = totalDartsThrown() + newHits.length
        const finalStandings = players
          .map((p) => ({
            id: p.id,
            name: p.name,
            selectedNumber: p.selectedNumber,
            position: 0,
            completedNumbers: countCompletedNumbers(p.id, newPlayerNumberHits),
            totalDarts: (playerHits[p.id] || []).length + (p.id === currentPlayer.id ? newHits.length : 0),
            status: 'alive' as const,
            points: countCompletedNumbers(p.id, newPlayerNumberHits),
          }))
          .sort((a, b) => b.completedNumbers - a.completedNumbers)
          .map((p, i) => ({ ...p, position: i + 1 }))

        const winner = players.find((p) =>
          allNumbers.every((num) => (newPlayerNumberHits[p.id][num] || 0) >= hitsPerNumber)
        ) ?? currentPlayer

        navigate('/game-complete', {
          state: {
            winner,
            gameType: 'every-number',
            winnerPoints: countCompletedNumbers(winner.id, newPlayerNumberHits),
            totalPlayers: players.length,
            totalRounds: currentRound,
            totalAttempts: totalDarts,
            totalHits: totalDarts - Object.values(playerHits).flat().filter((h) => h === 'M').length,
            totalMisses: Object.values(playerHits).flat().filter((h) => h === 'M').length,
            bullseyeBuybackEnabled: false,
            bullseyeRounds: null,
            finalStandings,
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
    if (currentHits.length === 0) {
      // If no hits in current visit, go back to previous player's last hit
      const prevPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length
      const prevPlayer = players[prevPlayerIndex]
      const prevPlayerHits = lastVisitHits[prevPlayer.id] || []

      if (prevPlayerHits.length > 0) {
        // Go back to previous player
        setCurrentPlayerIndex(prevPlayerIndex)
        if (prevPlayerIndex > currentPlayerIndex) {
          setCurrentRound((r) => Math.max(1, r - 1))
        }

        // Set up the last visit minus one hit
        const lastHitStr = prevPlayerHits[prevPlayerHits.length - 1]
        const newHits = prevPlayerHits.slice(0, -1)
        setCurrentHits(newHits)

        // Undo the hit count for this number
        let targetNum: number | null = null
        let hitPoints = 1

        if (lastHitStr === 'DB') {
          targetNum = 0
          hitPoints = 2
        } else if (lastHitStr === 'SB') {
          targetNum = 0
          hitPoints = 1
        } else if (lastHitStr.startsWith('D')) {
          targetNum = parseInt(lastHitStr.substring(1))
          hitPoints = 2
        } else if (lastHitStr.startsWith('T')) {
          targetNum = parseInt(lastHitStr.substring(1))
          hitPoints = 3
        } else if (lastHitStr !== 'M') {
          targetNum = parseInt(lastHitStr)
          hitPoints = 1
        }

        if (targetNum !== null) {
          const newPlayerNumberHits = { ...playerNumberHits }
          newPlayerNumberHits[prevPlayer.id] = { ...newPlayerNumberHits[prevPlayer.id] }
          const currentCount = newPlayerNumberHits[prevPlayer.id][targetNum] || 0
          // Reverse the bounce-back logic
          let previousCount = currentCount - hitPoints
          if (previousCount < 0) {
            // This was a bounce-back, so we need to restore the original
            previousCount = hitsPerNumber + currentCount
          }
          newPlayerNumberHits[prevPlayer.id][targetNum] = Math.max(0, previousCount)
          setPlayerNumberHits(newPlayerNumberHits)
        }

        // Remove from player hits
        setPlayerHits((current) => ({
          ...current,
          [prevPlayer.id]: (current[prevPlayer.id] || []).slice(0, -1),
        }))
        setLastVisitHits((current) => ({
          ...current,
          [prevPlayer.id]: newHits,
        }))
      }
      return
    }

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
      const currentCount = newPlayerNumberHits[currentPlayer.id][targetNum] || 0

      // Reverse the bounce-back logic
      let previousCount = currentCount - hitPoints
      if (previousCount < 0) {
        // This was a bounce-back, so we need to restore the original
        previousCount = hitsPerNumber + currentCount
      }
      newPlayerNumberHits[currentPlayer.id][targetNum] = Math.max(0, previousCount)
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
      lastVisitHits={Object.fromEntries(
        Object.entries(lastVisitHits).map(([playerId, hits]) => [String(playerId), hits])
      )}
      onAddScore={addHit}
      onRemoveLastHit={removeLastHit}
      onToggleModifier={toggleModifier}
      selectedModifier={selectedModifier}
      renderPlayerCard={renderPlayerCard}
    />
  )
}
