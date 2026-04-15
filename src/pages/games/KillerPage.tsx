import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import type { Player } from '../../types'

type PlayerStatus = 'alive' | 'out-recovery' | 'dead-buyback' | 'dead'

type GameState = {
  players: Player[]
  bullseyeBuyback: boolean
  bullseyeRounds: number | null
  killerThreshold: number
}

type GameCompleteState = {
  winner: Player
  winnerPoints: number
  totalPlayers: number
  totalRounds: number
  totalAttempts: number
  totalHits: number
  totalMisses: number
  bullseyeBuybackEnabled: boolean
  bullseyeRounds: number | null
  finalStandings: Array<{
    id: number
    name: string
    selectedNumber: number | null
    points: number
    status: PlayerStatus
  }>
}

function PageLayout({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <Link className="home-link" to="/">
          Home
        </Link>
      </header>
      <div className="page-content">{children}</div>
    </main>
  )
}

const numbers = Array.from({ length: 20 }, (_, index) => index + 1)

interface KillerPageProps {
  state?: GameState | null
}

export function KillerPage({ state: propState }: KillerPageProps = {}) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const state = propState || (location.state as GameState | null)
  const playerListRef = useRef<HTMLDivElement | null>(null)
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])
  const [scoreComponentCollapsed, setScoreComponentCollapsed] = useState(false)
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    state?.players?.reduce(
      (acc, player) => ({ ...acc, [player.id]: [] }),
      {} as Record<number, string[]>,
    ) ?? {},
  )
  const [playerPoints, setPlayerPoints] = useState<Record<number, number>>(() =>
    state?.players?.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<number, number>,
    ) ?? {},
  )
  const [playerStatus, setPlayerStatus] = useState<Record<number, PlayerStatus>>(() =>
    state?.players?.reduce(
      (acc, player) => ({ ...acc, [player.id]: 'alive' as PlayerStatus }),
      {} as Record<number, PlayerStatus>,
    ) ?? {},
  )
  const [hitStack, setHitStack] = useState<
    {
      playerId: number
      playerIndex: number
      round: number
      hit: string
      changes: Array<{
        playerId: number
        prevPoints: number
        nextPoints: number
        prevStatus: PlayerStatus
        nextStatus: PlayerStatus
      }>
    }[]
  >([])
  const [buybackActive, setBuybackActive] = useState(state?.bullseyeBuyback ?? false)
  const [totalHits, setTotalHits] = useState(0)
  const [totalMisses, setTotalMisses] = useState(0)
  const navGuard = useRef(false)

  if (!user) {
    return <PageLayout title="Killer"><p>Loading...</p></PageLayout>
  }

  if (!state?.players) {
    return (
      <PageLayout title="Killer">
        <p className="empty-state">No game data was passed. Return to Create Game to begin.</p>
      </PageLayout>
    )
  }

  const players = state.players
  const threshold = state.killerThreshold
  const player = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[player.id]
  const buybackUsable = buybackActive && state.bullseyeRounds !== null && currentRound <= state.bullseyeRounds
  const alivePlayers = players.filter((item) => playerStatus[item.id] === 'alive')

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex]
    const card = currentPlayer && playerCardRefs.current[currentPlayer.id]
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, players])

  useEffect(() => {
    if (state.bullseyeRounds !== null && currentRound > state.bullseyeRounds && buybackActive) {
      setPlayerStatus((current) => {
        const nextStatus = { ...current }
        players.forEach((playerItem) => {
          if (nextStatus[playerItem.id] === 'dead-buyback') {
            nextStatus[playerItem.id] = 'dead'
          }
        })
        return nextStatus
      })
    }
  }, [currentRound, buybackActive, players, state.bullseyeRounds])

  useEffect(() => {
    const activePlayers = players.filter((playerItem) => {
      const status = playerStatus[playerItem.id]
      return status !== 'dead' && !(status === 'dead-buyback' && !buybackActive)
    })

    if (alivePlayers.length === 1 && activePlayers.length === 1 && !navGuard.current) {
      navGuard.current = true
      const winner = alivePlayers[0]
      const finalStandings = players.map((playerItem) => ({
        id: playerItem.id,
        name: playerItem.name,
        selectedNumber: playerItem.selectedNumber,
        points: playerPoints[playerItem.id] ?? 0,
        status: playerStatus[playerItem.id],
      }))

      navigate('/game-complete', {
        state: {
          winner,
          winnerPoints: playerPoints[winner.id] ?? 0,
          totalPlayers: players.length,
          totalRounds: currentRound,
          totalAttempts: hitStack.length,
          totalHits,
          totalMisses,
          bullseyeBuybackEnabled: state.bullseyeBuyback,
          bullseyeRounds: state.bullseyeRounds,
          finalStandings,
        } satisfies GameCompleteState,
      })
    }
  }, [alivePlayers.length, playerPoints, playerStatus, players, currentRound, hitStack.length, totalHits, totalMisses, navigate, state.bullseyeBuyback, state.bullseyeRounds, buybackActive])

  function findNextEligiblePlayerIndex(startIndex: number) {
    for (let i = 1; i <= players.length; i += 1) {
      const nextIndex = (startIndex + i) % players.length
      const status = playerStatus[players[nextIndex].id]
      if (status === 'alive' || status === 'out-recovery' || (status === 'dead-buyback' && buybackActive)) {
        return nextIndex
      }
    }
    return null
  }

  useEffect(() => {
    const currentId = player?.id
    if (!currentId) {
      return
    }

    const status = playerStatus[currentId]
    const isEligible = status === 'alive' || status === 'out-recovery' || (status === 'dead-buyback' && buybackActive)
    if (!isEligible) {
      const nextIndex = findNextEligiblePlayerIndex(currentPlayerIndex)
      if (nextIndex !== null && nextIndex !== currentPlayerIndex) {
        if (nextIndex <= currentPlayerIndex) {
          setCurrentRound((round) => round + 1)
        }
        setCurrentPlayerIndex(nextIndex)
        setCurrentHits(playerHits[players[nextIndex].id] ?? [])
      }
    }
  }, [buybackActive, currentPlayerIndex, player, playerHits, playerStatus, players])

  function formatHit(target: 'miss' | 'bull' | number) {
    if (target === 'miss') {
      return 'M'
    }

    if (target === 'bull') {
      return selectedModifier === 'double' ? 'B' : 'SB'
    }

    if (selectedModifier === 'double') {
      return `D${target}`
    }

    if (selectedModifier === 'treble') {
      return `T${target}`
    }

    return String(target)
  }

  function pointsForHit(hit: string, selectedNumber: number | null) {
    if (selectedNumber === null) {
      return 0
    }
    if (hit === `D${selectedNumber}`) {
      return 2
    }
    if (hit === `T${selectedNumber}`) {
      return 3
    }
    if (hit === String(selectedNumber)) {
      return 1
    }
    return 0
  }

  function calculatePoints(currentPoints: number, hit: string, selectedNumber: number | null) {
    const rawPoints = pointsForHit(hit, selectedNumber)
    if (rawPoints === 0) {
      return currentPoints
    }

    const total = currentPoints + rawPoints
    if (total === threshold) {
      return total
    }

    if (total > threshold) {
      return threshold - (total - threshold)
    }

    return total
  }

  function resolveNegativeStatus(points: number) {
    if (points >= 0) {
      return 'alive' as PlayerStatus
    }

    return 'out-recovery' as PlayerStatus
  }

  function isAssignedHit(hit: string, selectedNumber: number | null) {
    if (selectedNumber === null) {
      return false
    }

    return (
      hit === String(selectedNumber) ||
      hit === `D${selectedNumber}` ||
      hit === `T${selectedNumber}`
    )
  }

  function addHit(target: 'miss' | 'bull' | number) {
    const hitValue = formatHit(target)
    const nextHits = [...currentHits, hitValue]
    const isBull = target === 'bull'
    const isMiss = target === 'miss'
    const currentPoints = playerPoints[player.id] ?? 0
    const currentStatus = playerStatus[player.id]
    const isKiller = currentStatus === 'alive' && currentPoints === threshold
    const newPoints = { ...playerPoints }
    const newStatus = { ...playerStatus }
    const changes: Array<{
      playerId: number
      prevPoints: number
      nextPoints: number
      prevStatus: PlayerStatus
      nextStatus: PlayerStatus
    }> = []

    if (currentStatus === 'dead-buyback') {
      if (isBull && buybackUsable) {
        changes.push({
          playerId: player.id,
          prevPoints: currentPoints,
          nextPoints: 0,
          prevStatus: currentStatus,
          nextStatus: 'alive',
        })
        newPoints[player.id] = 0
        newStatus[player.id] = 'alive'
      }
    } else if (currentStatus === 'out-recovery') {
      const assignedNumber = player.selectedNumber
      if (assignedNumber !== null && isAssignedHit(hitValue, assignedNumber)) {
        const nextPoints = calculatePoints(currentPoints, hitValue, assignedNumber)
        const nextStatus = nextPoints >= 0 ? 'alive' : 'out-recovery'
        changes.push({
          playerId: player.id,
          prevPoints: currentPoints,
          nextPoints,
          prevStatus: currentStatus,
          nextStatus,
        })
        newPoints[player.id] = nextPoints
        newStatus[player.id] = nextStatus
      }
    } else if (currentStatus === 'alive') {
      if (isKiller && !isBull && !isMiss) {
        const targetNumber = Number(hitValue.replace(/^D|^T/, ''))
        const targetPlayer = players.find((playerItem) => playerItem.selectedNumber === targetNumber)
        if (targetPlayer) {
          const prevTargetPoints = playerPoints[targetPlayer.id] ?? 0
          const pointChange = pointsForHit(hitValue, targetNumber)
          const targetNextPoints = prevTargetPoints - pointChange
          const targetNextStatus = resolveNegativeStatus(targetNextPoints)

          changes.push({
            playerId: targetPlayer.id,
            prevPoints: prevTargetPoints,
            nextPoints: targetNextPoints,
            prevStatus: playerStatus[targetPlayer.id],
            nextStatus: targetNextStatus,
          })

          newPoints[targetPlayer.id] = targetNextPoints
          newStatus[targetPlayer.id] = targetNextStatus
        }
      } else {
        const nextPoints = calculatePoints(currentPoints, hitValue, player.selectedNumber)
        changes.push({
          playerId: player.id,
          prevPoints: currentPoints,
          nextPoints,
          prevStatus: currentStatus,
          nextStatus: 'alive',
        })
        newPoints[player.id] = nextPoints
        newStatus[player.id] = 'alive'
      }
    }

    setCurrentHits(nextHits)
    setPlayerHits((current) => ({ ...current, [player.id]: nextHits }))
    setPlayerPoints(newPoints)
    setPlayerStatus(newStatus)
    setHitStack((current) => [
      ...current,
      {
        playerId: player.id,
        playerIndex: currentPlayerIndex,
        round: currentRound,
        hit: hitValue,
        changes,
      },
    ])
    setSelectedModifier(null)
    const recordAsMiss = currentStatus === 'dead-buyback' ? !isBull : isMiss
    if (recordAsMiss) {
      setTotalMisses((current) => current + 1)
    } else {
      setTotalHits((current) => current + 1)
    }

    if (nextHits.length === 3) {
      if (currentStatus === 'out-recovery') {
        const playerFinalPoints = newPoints[player.id] ?? 0
        const recoveryHit = nextHits.some((hit) => isAssignedHit(hit, player.selectedNumber))
        if (!recoveryHit || playerFinalPoints < 0) {
          newStatus[player.id] = buybackUsable ? 'dead-buyback' : 'dead'
        } else {
          newStatus[player.id] = 'alive'
        }
      }
      if (currentStatus === 'dead-buyback') {
        const playerFinalPoints = newPoints[player.id] ?? 0
        if (playerFinalPoints < 0 && newStatus[player.id] === 'dead-buyback') {
          newStatus[player.id] = 'dead'
        }
      }
      setPlayerStatus(newStatus)
      const nextIndex = findNextEligiblePlayerIndex(currentPlayerIndex)
      if (nextIndex !== null) {
        if (nextIndex <= currentPlayerIndex) {
          setCurrentRound((round) => round + 1)
        }
        setCurrentPlayerIndex(nextIndex)
        setCurrentHits([])
      }
    } else {
      setPlayerStatus(newStatus)
    }
  }

  function removeLastHit() {
    if (hitStack.length === 0) {
      return
    }

    const lastAction = hitStack[hitStack.length - 1]
    const previousHits = (playerHits[lastAction.playerId] ?? []).slice(0, -1)
    const restoredPoints = { ...playerPoints }
    const restoredStatus = { ...playerStatus }

    lastAction.changes.forEach((change) => {
      restoredPoints[change.playerId] = change.prevPoints
      restoredStatus[change.playerId] = change.prevStatus
    })

    setHitStack((current) => current.slice(0, -1))
    setPlayerPoints(restoredPoints)
    setPlayerStatus(restoredStatus)
    setPlayerHits((current) => ({
      ...current,
      [lastAction.playerId]: previousHits,
    }))
    setCurrentPlayerIndex(lastAction.playerIndex)
    setCurrentRound(lastAction.round)
    setCurrentHits(previousHits)
    setSelectedModifier(null)

    if (lastAction.hit === 'M') {
      setTotalMisses((current) => Math.max(0, current - 1))
    } else {
      setTotalHits((current) => Math.max(0, current - 1))
    }
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  function toggleBuybackActive() {
    setBuybackActive((current) => {
      const next = !current
      if (!next) {
        setPlayerStatus((currentStatus) => {
          const updated = { ...currentStatus }
          players.forEach((playerItem) => {
            if (updated[playerItem.id] === 'dead-buyback') {
              updated[playerItem.id] = 'dead'
            }
          })
          return updated
        })
      }
      return next
    })
  }

  const scoreButtons = [...numbers, 'bull' as const, 'miss' as const]
  const isKiller = (playerId: number) => playerPoints[playerId] === threshold && playerStatus[playerId] === 'alive'

  return (
    <PageLayout title="Killer">
      <section className={`killer-game-header${state.bullseyeBuyback ? ' with-buyback' : ''}`}>
        <Link to="/" className="header-home-button" title="Home">
          ← Home
        </Link>
        <div className="header-row">
          <div className="header-info">
            <div className="header-title">Killer</div>
            <div className="header-stat">
              <span className="stat-label">Threshold:</span>
              <span className="stat-value">{threshold}</span>
            </div>
          </div>
          <div className="header-divider"></div>
          <div className="header-info">
            <div className="header-label">Current Player</div>
            <div className="header-title">{player.name}</div>
          </div>
          <div className="header-divider"></div>
          <div className="header-info">
            <div className="header-label">Round</div>
            <div className="header-title">{currentRound}</div>
          </div>
        </div>
        {state.bullseyeBuyback && (
          <div className="header-row">
            <div className="header-info">
              <div className="header-label">Bullseye Buyback</div>
              <div className="header-stat">
                <span>{buybackActive ? `${state.bullseyeRounds ?? 0} rounds` : 'Off'}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="header-toggle-button" 
              onClick={toggleBuybackActive}
              title={buybackActive ? 'Turn off buyback' : 'Turn on buyback'}
            >
              Disable
            </button>
          </div>
        )}
      </section>

      <div className="killer-players-list" ref={playerListRef}>
        {players.map((playerItem, index) => {
          const status = playerStatus[playerItem.id]
          return (
            <div
              key={playerItem.id}
              ref={(element) => {
                playerCardRefs.current[playerItem.id] = element
              }}
              className={`player-card${index === currentPlayerIndex ? ' active' : ''}${status === 'dead' ? ' dead' : ''}${status === 'dead-buyback' ? ' dead-buyback' : ''}${status === 'out-recovery' ? ' out-recovery' : ''}`}
            >
              <div className="player-card-header">
                <span className="player-name">{playerItem.name}</span>
                <span className="player-selected-number">#{playerItem.selectedNumber ?? '-'}</span>
              </div>
              <div className="player-card-row">
                <strong>Hits</strong>
                <span>{(playerHits[playerItem.id] ?? []).join(' | ') || '—'}</span>
              </div>
              <div className="player-card-row">
                <strong>Points</strong>
                <span>{playerPoints[playerItem.id] ?? 0}</span>
              </div>
              <div className="player-card-row player-card-status">
                <span>
                  {status === 'alive'
                    ? 'Alive'
                    : status === 'out-recovery'
                    ? 'Dead — recovery turn'
                    : status === 'dead-buyback'
                    ? 'Dead — buyback available'
                    : 'Dead'}
                </span>
              </div>
              {isKiller(playerItem.id) ? <div className="player-card-killer">Killer</div> : null}
            </div>
          )
        })}
      </div>

      <section className={`score-input-section${scoreComponentCollapsed ? ' collapsed' : ''}`}>
        <button
          className="score-component-header"
          onClick={() => setScoreComponentCollapsed(!scoreComponentCollapsed)}
          type="button"
        >
          <span>Score input</span>
          <span className="collapse-indicator">{scoreComponentCollapsed ? '▼' : '▲'}</span>
        </button>

        {!scoreComponentCollapsed && (
          <>
            <section className="modifier-row">
              <button
                type="button"
                className={`modifier-button${selectedModifier === 'double' ? ' selected' : ''}`}
                onClick={() => toggleModifier('double')}
                disabled={currentHits.length >= 3 || currentPlayerStatus === 'dead'}
              >
                Double
              </button>
              <button
                type="button"
                className={`modifier-button${selectedModifier === 'treble' ? ' selected' : ''}`}
                onClick={() => toggleModifier('treble')}
                disabled={currentHits.length >= 3 || currentPlayerStatus === 'dead'}
              >
                Treble
              </button>
              <button
                type="button"
                className="modifier-button"
                onClick={removeLastHit}
                disabled={hitStack.length === 0}
              >
                Back
              </button>
            </section>

            <section className="score-buttons">
              {scoreButtons.map((value) => {
                const isBull = value === 'bull'
                const isMiss = value === 'miss'
                const isDisabled =
                  currentPlayerStatus === 'dead' ||
                  (currentPlayerStatus === 'dead-buyback' && !isBull && !isMiss) ||
                  (selectedModifier === 'treble' && (isBull || isMiss)) ||
                  (selectedModifier === 'double' && isMiss) ||
                  currentHits.length >= 3

                return (
                  <button
                    key={String(value)}
                    type="button"
                    className={`score-button${selectedModifier && typeof value === 'number' ? ' modifier-active' : ''}`}
                    onClick={() => addHit(value)}
                    disabled={isDisabled}
                  >
                    {typeof value === 'number' ? value : value === 'bull' ? 'Bull' : 'Miss'}
                  </button>
                )
              })}
            </section>
          </>
        )}
      </section>
    </PageLayout>
  )
}
