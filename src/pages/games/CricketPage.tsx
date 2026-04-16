import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameTemplate } from '../GameTemplate'
import type { Player } from '../../types'

interface CricketProps {
  players: Player[]
}

// Classic Cricket: 15, 16, 17, 18, 19, 20, Bull
const CRICKET_NUMBERS = [15, 16, 17, 18, 19, 20, 0] // 0 represents Bull

export function CricketPage({ players }: CricketProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  // Track hits per number per player
  const [playerNumberHits, setPlayerNumberHits] = useState<Record<number, Record<number, number>>>(() =>
    players.reduce((acc, player) => {
      acc[player.id] = {}
      CRICKET_NUMBERS.forEach((num) => {
        acc[player.id][num] = 0
      })
      return acc
    }, {} as Record<number, Record<number, number>>)
  )

  // Track points per number per player
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

  // Determine how many players have opened a number
  function countPlayersWithOpen(number: number): number {
    return players.filter((p) => isNumberOpen(p.id, number)).length
  }

  // Determine if a number is closed (all players have opened it)
  function isNumberClosed(number: number): boolean {
    return players.every((p) => isNumberOpen(p.id, number))
  }

  // Check if game is over and if so, who won
  function getGameOverInfo(): { isOver: boolean; winner: Player | null } {
    for (const player of players) {
      const hasAllNumbersOpen = CRICKET_NUMBERS.every((num) => isNumberOpen(player.id, num))
      if (hasAllNumbersOpen) {
        // Check if this player has the most points
        const isWinner = players.every((p) => (playerScores[player.id] ?? 0) >= (playerScores[p.id] ?? 0))
        if (isWinner) {
          return { isOver: true, winner: player }
        }
      }
    }
    return { isOver: false, winner: null }
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
    const { isOver } = getGameOverInfo()
    if (isOver) return

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

      // Calculate points
      const wasOpen = oldHits >= 3
      const isNowOpen = newPlayerNumberHits[currentPlayer.id][targetNum] >= 3
      const wasClosed = isNumberClosed(targetNum)
      const isNowLastToOpen = countPlayersWithOpen(targetNum) === players.length - 1 && isNowOpen && !wasOpen

      // Points logic: Can score if:
      // 1. Already open for this player AND
      // 2. Number is already closed for all players (opened before this player) OR
      // 3. This is NOT the last player to open it
      if (isNowOpen && !wasClosed && !isNowLastToOpen) {
        const newPlayerNumberPoints = { ...playerNumberPoints }
        newPlayerNumberPoints[currentPlayer.id] = { ...newPlayerNumberPoints[currentPlayer.id] }
        const pointValue = targetNum === 0 ? 50 : targetNum

        if (!wasOpen) {
          // Number was just opened, only award for excess hits
          const excessHits = newPlayerNumberHits[currentPlayer.id][targetNum] - 3
          const pointsToAdd = pointValue * excessHits
          newPlayerNumberPoints[currentPlayer.id][targetNum] = (newPlayerNumberPoints[currentPlayer.id][targetNum] || 0) + pointsToAdd

          const newScore = (playerScores[currentPlayer.id] || 0) + pointsToAdd
          setPlayerScores({
            ...playerScores,
            [currentPlayer.id]: newScore,
          })
        } else {
          // Already open, award for multiplier hits
          const pointsToAdd = pointValue * multiplier
          newPlayerNumberPoints[currentPlayer.id][targetNum] = (newPlayerNumberPoints[currentPlayer.id][targetNum] || 0) + pointsToAdd

          const newScore = (playerScores[currentPlayer.id] || 0) + pointsToAdd
          setPlayerScores({
            ...playerScores,
            [currentPlayer.id]: newScore,
          })
        }

        setPlayerNumberPoints(newPlayerNumberPoints)
      } else if (isNowOpen && wasClosed && !wasOpen) {
        // This number was already closed, score the full excess
        const newPlayerNumberPoints = { ...playerNumberPoints }
        newPlayerNumberPoints[currentPlayer.id] = { ...newPlayerNumberPoints[currentPlayer.id] }
        const pointValue = targetNum === 0 ? 50 : targetNum
        const excessHits = newPlayerNumberHits[currentPlayer.id][targetNum] - 3
        const pointsToAdd = pointValue * excessHits
        newPlayerNumberPoints[currentPlayer.id][targetNum] = (newPlayerNumberPoints[currentPlayer.id][targetNum] || 0) + pointsToAdd

        const newScore = (playerScores[currentPlayer.id] || 0) + pointsToAdd
        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: newScore,
        })

        setPlayerNumberPoints(newPlayerNumberPoints)
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
      const gameOverInfo = getGameOverInfo()
      if (gameOverInfo.isOver && gameOverInfo.winner) {
        navigate('/game-complete', {
          state: {
            winner: gameOverInfo.winner,
            winnerPoints: playerScores[gameOverInfo.winner.id] || 0,
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

    // Undo the hit count and points
    if (targetNum !== null) {
      const newPlayerNumberHits = { ...playerNumberHits }
      newPlayerNumberHits[currentPlayer.id] = { ...newPlayerNumberHits[currentPlayer.id] }
      const oldHits = newPlayerNumberHits[currentPlayer.id][targetNum] || 0
      newPlayerNumberHits[currentPlayer.id][targetNum] = Math.max(0, oldHits - hitPoints)

      // Also undo any points that were awarded
      const pointValue = targetNum === 0 ? 50 : targetNum
      const wasOpen = oldHits >= 3
      const pointsToRemove = pointValue * hitPoints

      if (wasOpen) {
        const newPlayerNumberPoints = { ...playerNumberPoints }
        newPlayerNumberPoints[currentPlayer.id] = { ...newPlayerNumberPoints[currentPlayer.id] }
        newPlayerNumberPoints[currentPlayer.id][targetNum] = Math.max(0, (newPlayerNumberPoints[currentPlayer.id][targetNum] || 0) - pointsToRemove)
        setPlayerNumberPoints(newPlayerNumberPoints)

        setPlayerScores({
          ...playerScores,
          [currentPlayer.id]: Math.max(0, (playerScores[currentPlayer.id] || 0) - pointsToRemove),
        })
      }

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
    additionalData: {
      'Points': (playerScores[player.id] || 0).toString(),
    },
  }))

  const renderPlayerCard = (player: any) => {
    const playerObj = players.find(p => p.id === parseInt(player.id))
    if (!playerObj) return null

    return (
      <>
        <div className="template-player-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="template-player-name">{player.name}</span>
          <span style={{ color: '#007bff', fontSize: '14px' }}>Points: {playerScores[playerObj.id] || 0}</span>
        </div>
        <div style={{ padding: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9', minWidth: '30px' }}>
                  #
                </td>
                {CRICKET_NUMBERS.map((num) => (
                  <td
                    key={num}
                    style={{
                      textAlign: 'center',
                      padding: '6px',
                      borderRight: '1px solid #eee',
                      backgroundColor: isNumberClosed(num) ? '#d4edda' : '#f0f0f0',
                      fontWeight: '600',
                      minWidth: '35px',
                    }}
                  >
                    {num === 0 ? 'B' : num}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                  H
                </td>
                {CRICKET_NUMBERS.map((num) => {
                  const hits = playerNumberHits[playerObj.id]?.[num] || 0
                  const isOpen = hits >= 3
                  return (
                    <td
                      key={num}
                      style={{
                        textAlign: 'center',
                        padding: '6px',
                        borderRight: '1px solid #eee',
                        backgroundColor: isNumberClosed(num) ? '#d4edda' : isOpen ? '#fff3cd' : '#f0f0f0',
                        fontWeight: '600',
                      }}
                    >
                      {isNumberClosed(num) ? '✗' : isOpen ? '✓' : `${hits}/3`}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: '600', borderRight: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                  P
                </td>
                {CRICKET_NUMBERS.map((num) => {
                  const points = playerNumberPoints[playerObj.id]?.[num] || 0
                  return (
                    <td
                      key={num}
                      style={{
                        textAlign: 'center',
                        padding: '6px',
                        borderRight: '1px solid #eee',
                        backgroundColor: isNumberClosed(num) ? '#e8f5e9' : '#f0f0f0',
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
      </>
    )
  }

  return (
    <GameTemplate
      headerConfig={{
        title: 'Cricket',
        currentPlayer: currentPlayer.name,
        round: currentRound,
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
