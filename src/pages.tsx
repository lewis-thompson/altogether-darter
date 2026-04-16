import { useState, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function PageLayout({
  title,
  children,
}: {
  title: string
  children?: ReactNode
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

export function HomePage() {
  const navigate = useNavigate()

  const quickTestPlayers: Player[] = [
    { id: 1, name: 'A', selectedNumber: null },
    { id: 2, name: 'B', selectedNumber: null },
    { id: 3, name: 'C', selectedNumber: null },
    { id: 4, name: 'D', selectedNumber: null },
  ]

  const handleQuickStart = (gameType: string) => {
    const players = [...quickTestPlayers]

    // Assign random numbers for Killer only
    if (gameType === 'killer') {
      players.forEach(p => {
        p.selectedNumber = Math.floor(Math.random() * 20) + 1
      })
      navigate('/killer', {
        state: {
          players,
          bullseyeBuyback: false,
          bullseyeRounds: null,
          killerThreshold: 5,
        },
      })
    } else if (gameType === 'x01') {
      navigate('/x01', {
        state: {
          players,
          startingScore: 501,
          legsPerSet: 3,
          setsPerGame: 3,
        },
      })
    } else if (gameType === 'score-killer') {
      navigate('/score-killer', {
        state: {
          players,
          livesPerPlayer: 3,
        },
      })
    } else {
      // All other games just need players: cricket, doubles, splitscore, shanghai, around-the-world, every-number
      navigate(`/${gameType}`, {
        state: {
          players,
        },
      })
    }
  }

  const games = [
    'killer',
    'x01',
    'cricket',
    'doubles',
    'splitscore',
    'score-killer',
    'shanghai',
    'around-the-world',
    'every-number',
  ]

  return (
    <main className="page home-page">
      <h1>Altogether Darter</h1>
      <div className="button-grid">
        <Link className="page-button" to="/create-game">
          New Game
        </Link>
        <Link className="page-button" to="/saved-games">
          Continue Game
        </Link>
        <Link className="page-button" to="/statistics">
          Statistics
        </Link>
        <Link className="page-button" to="/dummy-killer">
          Test Dummy Killer
        </Link>
      </div>

      <section className="quick-test-section">
        <h2>Quick Test Games (4 Players: A, B, C, D)</h2>
        <div className="quick-test-grid">
          {games.map(game => (
            <button
              key={game}
              className="quick-test-button"
              onClick={() => handleQuickStart(game)}
            >
              {game
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

type Player = {
  id: number
  name: string
  selectedNumber: number | null
}

type PlayerStatus = 'alive' | 'out-recovery' | 'dead-buyback' | 'dead'

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

const numbers = Array.from({ length: 20 }, (_, index) => index + 1)

export function CreateGamePage() {
  const navigate = useNavigate()
  const [gameType, setGameType] = useState('killer')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  
  // Killer-specific
  const [bullseyeBuyback, setBullseyeBuyback] = useState(false)
  const [bullseyeRounds, setBullseyeRounds] = useState<number | ''>(1)
  const [killerThreshold, setKillerThreshold] = useState<number | ''>(5)
  
  // Every Number-specific
  const [hitsPerNumber, setHitsPerNumber] = useState<number | ''>(3)
  const [includeBullseye, setIncludeBullseye] = useState(true)
  
  // Score Killer-specific
  const [livesPerPlayer, setLivesPerPlayer] = useState<number | ''>(3)
  
  // X01-specific
  const [x01Value, setX01Value] = useState<number | ''>(501)
  const [legsPerSet, setLegsPerSet] = useState<number | ''>(3)
  const [setsPerGame, setSetsPerGame] = useState<number | ''>(3)
  const [doubleIn, setDoubleIn] = useState(false)
  const [doubleOut, setDoubleOut] = useState(true)
  
  // Cricket-specific
  const [cricketNumberCount, setCricketNumberCount] = useState<number | ''>(7)
  const [hitsToOpen, setHitsToOpen] = useState<number | ''>(3)
  
  // Shanghai-specific
  const [shanghaiNumberCount, setShanghaiNumberCount] = useState<number | ''>(3)
  const [shanghaiScoringMode, setShanghaiScoringMode] = useState<'points' | 'numeric'>('points')
  
  // Around The World-specific
  const [atw3PointBull, setAtw3PointBull] = useState(true)
  const [atwReplayOnHit, setAtwReplayOnHit] = useState(false)
  const [atwBackOnMiss, setAtwBackOnMiss] = useState(false)
  const [atwBackOnSingleMiss, setAtwBackOnSingleMiss] = useState(false)
  const [atwTrebleWin, setAtwTrebleWin] = useState(false)

  function handleAddPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = playerName.trim()
    if (!trimmedName || players.length >= 20) {
      return
    }

    setPlayers((current) => [
      ...current,
      { id: Date.now(), name: trimmedName, selectedNumber: null },
    ])
    setPlayerName('')
  }

  function selectPlayerNumber(playerId: number, selectedNumber: number) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === playerId ? { ...player, selectedNumber } : player,
      ),
    )
  }

  function randomizeNumbers() {
    const available = [...numbers]
    for (let i = available.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[available[i], available[j]] = [available[j], available[i]]
    }

    setPlayers((current) =>
      current.map((player, index) => ({
        ...player,
        selectedNumber: available[index],
      })),
    )
  }

  // Validation logic
  const requiresPlayerNumbers = ['killer']
  const requiresMinPlayers = ['killer', 'score-killer', 'cricket']
  
  const needsPlayerNumbers = requiresPlayerNumbers.includes(gameType)
  const needsMinPlayersCheck = requiresMinPlayers.includes(gameType)
  const minPlayersRequired = needsMinPlayersCheck ? 2 : 1
  
  const isEachPlayerSelected = needsPlayerNumbers
    ? players.every((player) => player.selectedNumber !== null)
    : true
    
  const isUniqueSelection = needsPlayerNumbers
    ? players.length ===
      new Set(
        players
          .map((player) => player.selectedNumber)
          .filter((value): value is number => value !== null),
      ).size
    : true

  // Game-specific validation
  let gameSpecificValid = true
  let validationMessage = ''
  
  if (players.length < minPlayersRequired) {
    validationMessage = `Add at least ${minPlayersRequired} player${minPlayersRequired > 1 ? 's' : ''}.`
  } else if (!isEachPlayerSelected) {
    validationMessage = 'Each player must choose a unique number.'
  } else if (!isUniqueSelection) {
    validationMessage = 'Each player must have a different number.'
  } else if (gameType === 'killer') {
    if (!killerThreshold || killerThreshold < 1) {
      validationMessage = 'Enter how many hits are needed to become Killer.'
      gameSpecificValid = false
    } else if (bullseyeBuyback && (!bullseyeRounds || bullseyeRounds < 1)) {
      validationMessage = 'Enter a number of buyback rounds when bullseye buyback is enabled.'
      gameSpecificValid = false
    }
  } else if (gameType === 'every-number') {
    if (!hitsPerNumber || hitsPerNumber < 1) {
      validationMessage = 'Enter how many hits per number.'
      gameSpecificValid = false
    }
  } else if (gameType === 'score-killer') {
    if (!livesPerPlayer || livesPerPlayer < 1) {
      validationMessage = 'Enter how many lives per player.'
      gameSpecificValid = false
    }
  } else if (gameType === 'x01') {
    if (!x01Value || x01Value < 1) {
      validationMessage = 'Enter a valid X01 value.'
      gameSpecificValid = false
    }
  } else if (gameType === 'cricket') {
    if (!cricketNumberCount || cricketNumberCount < 1 || cricketNumberCount > 8) {
      validationMessage = 'Enter number count between 1 and 8.'
      gameSpecificValid = false
    } else if (!hitsToOpen || hitsToOpen < 1) {
      validationMessage = 'Enter how many hits to open a number.'
      gameSpecificValid = false
    }
  } else if (gameType === 'shanghai') {
    if (!shanghaiNumberCount || shanghaiNumberCount < 1 || shanghaiNumberCount > 3) {
      validationMessage = 'Enter number count between 1 and 3.'
      gameSpecificValid = false
    }
  }
  
  const canStartGame =
    players.length >= minPlayersRequired &&
    players.length <= 20 &&
    isEachPlayerSelected &&
    isUniqueSelection &&
    gameSpecificValid

  function handleStartGame() {
    if (!canStartGame) {
      return
    }

    const gameState: Record<string, unknown> = { players }

    // Route to appropriate game page based on game type
    let route = '/killer'
    
    switch (gameType) {
      case 'killer':
        gameState.bullseyeBuyback = bullseyeBuyback
        gameState.bullseyeRounds = bullseyeBuyback ? Number(bullseyeRounds) : null
        gameState.killerThreshold = Number(killerThreshold)
        route = '/killer'
        break
      case 'every-number':
        gameState.hitsPerNumber = Number(hitsPerNumber)
        gameState.includeBullseye = includeBullseye
        route = '/every-number'
        break
      case 'score-killer':
        gameState.livesPerPlayer = Number(livesPerPlayer)
        route = '/score-killer'
        break
      case 'x01':
        gameState.startingScore = Number(x01Value)
        gameState.legsPerSet = Number(legsPerSet)
        gameState.setsPerGame = Number(setsPerGame)
        gameState.doubleIn = doubleIn
        gameState.doubleOut = doubleOut
        route = '/x01'
        break
      case 'doubles':
        route = '/doubles'
        break
      case 'splitscore':
        route = '/splitscore'
        break
      case 'cricket':
        gameState.numberCount = Number(cricketNumberCount)
        gameState.hitsToOpen = Number(hitsToOpen)
        route = '/cricket'
        break
      case 'shanghai':
        gameState.numberCount = Number(shanghaiNumberCount)
        gameState.scoringMode = shanghaiScoringMode
        route = '/shanghai'
        break
      case 'around-the-world':
        gameState.bullOn3 = atw3PointBull
        gameState.replayOnHit = atwReplayOnHit
        gameState.backOnMiss = atwBackOnMiss
        gameState.backOnSingleMiss = atwBackOnSingleMiss
        gameState.trebleWin = atwTrebleWin
        route = '/around-the-world'
        break
    }

    navigate(route, { state: gameState })
  }

  return (
    <PageLayout title="Create Game">
      <section style={{ marginBottom: '24px' }}>
        <div className="form-row">
          <label htmlFor="game-type">Game Type</label>
          <select
            id="game-type"
            value={gameType}
            onChange={(e) => {
              setGameType(e.target.value)
              // Reset player numbers when changing game type if not needed
              if (!['killer'].includes(e.target.value)) {
                setPlayers(players.map(p => ({ ...p, selectedNumber: null })))
              }
            }}
            style={{ padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="killer">Killer</option>
            <option value="every-number">Every Number</option>
            <option value="score-killer">Score Killer</option>
            <option value="x01">X01</option>
            <option value="doubles">Doubles</option>
            <option value="splitscore">Splitscore</option>
            <option value="cricket">Cricket</option>
            <option value="shanghai">Shanghai</option>
            <option value="around-the-world">Around The World</option>
          </select>
        </div>
      </section>

      <form className="player-form" onSubmit={handleAddPlayer}>
        <div className="form-row">
          <label htmlFor="player-name">Player name</label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Type a player name"
          />
        </div>
        <div className="player-form-actions">
          <button className="page-button" type="submit" disabled={players.length >= 20 || !playerName.trim()}>
            Add player
          </button>
          {needsPlayerNumbers && (
            <button
              className="page-button secondary"
              type="button"
              disabled={players.length === 0}
              onClick={randomizeNumbers}
            >
              Randomize numbers
            </button>
          )}
        </div>
      </form>

      <section className="players-section">
        <h2>Players</h2>
        {players.length === 0 ? (
          <p className="empty-state">No players added yet.</p>
        ) : (
          <ul className="players-list">
            {players.map((player) => {
              const otherSelectedNumbers = needsPlayerNumbers
                ? new Set(
                    players
                      .filter((other) => other.id !== player.id)
                      .map((other) => other.selectedNumber)
                      .filter((value): value is number => value !== null),
                  )
                : new Set()
              return (
                <li key={player.id} className="player-item">
                  <div>
                    <p className="player-name">{player.name}</p>
                    {needsPlayerNumbers && (
                      <p className="player-choice">
                        Selected: {player.selectedNumber ?? 'None'}
                      </p>
                    )}
                  </div>
                  {needsPlayerNumbers && (
                    <div className="number-grid">
                      {numbers.map((number) => {
                        const isSelected = player.selectedNumber === number
                        const isDisabled = otherSelectedNumbers.has(number)
                        return (
                          <button
                            key={number}
                            type="button"
                            className={`number-button${isSelected ? ' selected' : ''}`}
                            disabled={isDisabled && !isSelected}
                            onClick={() => selectPlayerNumber(player.id, number)}
                          >
                            {number}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Killer Settings */}
      {gameType === 'killer' && (
        <div className="settings-row">
          <section className="buyback-section">
            <div className="section-header">
              <h2>Bullseye buyback</h2>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={bullseyeBuyback}
                  onChange={(event) => setBullseyeBuyback(event.target.checked)}
                />
                Enabled
              </label>
            </div>

            {bullseyeBuyback && (
              <div className="form-row">
                <label htmlFor="buyback-rounds">Buyback rounds</label>
                <input
                  id="buyback-rounds"
                  type="number"
                  min={1}
                  value={bullseyeRounds}
                  onChange={(event) => {
                    const value = event.target.value
                    setBullseyeRounds(value === '' ? '' : Number(value))
                  }}
                />
              </div>
            )}
          </section>

          <section className="killer-section">
            <div className="section-header">
              <h2>Killer threshold</h2>
              <p className="section-note">How many hits of a player's own number makes them the killer</p>
            </div>
            <div className="form-row">
              <label htmlFor="killer-threshold">Hits required</label>
              <input
                id="killer-threshold"
                type="number"
                min={1}
                value={killerThreshold}
                onChange={(event) => {
                  const value = event.target.value
                  setKillerThreshold(value === '' ? '' : Number(value))
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Every Number Settings */}
      {gameType === 'every-number' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>Every Number Settings</h2>
            </div>
            <div className="form-row">
              <label htmlFor="hits-per-number">Hits per number</label>
              <input
                id="hits-per-number"
                type="number"
                min={1}
                value={hitsPerNumber}
                onChange={(event) => {
                  const value = event.target.value
                  setHitsPerNumber(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeBullseye}
                onChange={(e) => setIncludeBullseye(e.target.checked)}
              />
              Include bullseye
            </label>
          </section>
        </div>
      )}

      {/* Score Killer Settings */}
      {gameType === 'score-killer' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>Score Killer Settings</h2>
            </div>
            <div className="form-row">
              <label htmlFor="lives-per-player">Lives per player</label>
              <input
                id="lives-per-player"
                type="number"
                min={1}
                value={livesPerPlayer}
                onChange={(event) => {
                  const value = event.target.value
                  setLivesPerPlayer(value === '' ? '' : Number(value))
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* X01 Settings */}
      {gameType === 'x01' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>X01 Settings</h2>
            </div>
            <div className="form-row">
              <label htmlFor="x01-value">Starting score (e.g., 501, 301)</label>
              <input
                id="x01-value"
                type="number"
                min={1}
                step={100}
                value={x01Value}
                onChange={(event) => {
                  const value = event.target.value
                  setX01Value(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="legs-per-set">Legs to win a set</label>
              <input
                id="legs-per-set"
                type="number"
                min={1}
                value={legsPerSet}
                onChange={(event) => {
                  const value = event.target.value
                  setLegsPerSet(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="sets-per-game">Sets to win the game</label>
              <input
                id="sets-per-game"
                type="number"
                min={1}
                value={setsPerGame}
                onChange={(event) => {
                  const value = event.target.value
                  setSetsPerGame(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={doubleIn}
                onChange={(e) => setDoubleIn(e.target.checked)}
              />
              Require double in
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={doubleOut}
                onChange={(e) => setDoubleOut(e.target.checked)}
              />
              Require double out (finish)
            </label>
          </section>
        </div>
      )}

      {/* Cricket Settings */}
      {gameType === 'cricket' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>Cricket Settings</h2>
            </div>
            <div className="form-row">
              <label htmlFor="cricket-number-count">Number of numbers to play (1-8)</label>
              <input
                id="cricket-number-count"
                type="number"
                min={1}
                max={8}
                value={cricketNumberCount}
                onChange={(event) => {
                  const value = event.target.value
                  setCricketNumberCount(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="cricket-hits-to-open">Hits needed to open a number</label>
              <input
                id="cricket-hits-to-open"
                type="number"
                min={1}
                value={hitsToOpen}
                onChange={(event) => {
                  const value = event.target.value
                  setHitsToOpen(value === '' ? '' : Number(value))
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Shanghai Settings */}
      {gameType === 'shanghai' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>Shanghai Settings</h2>
            </div>
            <div className="form-row">
              <label htmlFor="shanghai-number-count">Number of rounds (1-3)</label>
              <input
                id="shanghai-number-count"
                type="number"
                min={1}
                max={3}
                value={shanghaiNumberCount}
                onChange={(event) => {
                  const value = event.target.value
                  setShanghaiNumberCount(value === '' ? '' : Number(value))
                }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="shanghai-scoring">Scoring mode</label>
              <select
                id="shanghai-scoring"
                value={shanghaiScoringMode}
                onChange={(e) => setShanghaiScoringMode(e.target.value as 'points' | 'numeric')}
                style={{ padding: '8px', fontSize: '1em', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="points">Points (S=1, D=2, T=3)</option>
                <option value="numeric">Numeric (S=number, D=number*2, T=number*3)</option>
              </select>
            </div>
          </section>
        </div>
      )}

      {/* Around The World Settings */}
      {gameType === 'around-the-world' && (
        <div className="settings-row">
          <section>
            <div className="section-header">
              <h2>Around The World Settings</h2>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={atw3PointBull}
                onChange={(e) => setAtw3PointBull(e.target.checked)}
              />
              Bullseye counts as 3 points (or play 25)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={atwReplayOnHit}
                onChange={(e) => setAtwReplayOnHit(e.target.checked)}
              />
              Replay if 3 hits on target in one visit
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={atwBackOnMiss}
                onChange={(e) => setAtwBackOnMiss(e.target.checked)}
              />
              Go back if all darts miss
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={atwBackOnSingleMiss}
                onChange={(e) => setAtwBackOnSingleMiss(e.target.checked)}
              />
              Go back if single dart misses
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={atwTrebleWin}
                onChange={(e) => setAtwTrebleWin(e.target.checked)}
              />
              Treble 20 wins the game
            </label>
          </section>
        </div>
      )}

      {/* Doubles and Splitscore have no additional settings */}

      {validationMessage ? (
        <p className="validation-message">{validationMessage}</p>
      ) : null}

      <div className="actions-row">
        <button className="page-button" type="button" disabled={!canStartGame} onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </PageLayout>
  )
}



export function GameCompletePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as GameCompleteState | null

  if (!state) {
    return (
      <PageLayout title="Game Complete">
        <p className="empty-state">No completed game summary was found.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Game Complete">
      <section className="game-header">
        <div className="summary-row">
          <strong>Winner</strong>
          <span>{state.winner.name}</span>
        </div>
        <div className="summary-row">
          <strong>Final points</strong>
          <span>{state.winnerPoints}</span>
        </div>
        <div className="summary-row">
          <strong>Rounds</strong>
          <span>{state.totalRounds}</span>
        </div>
        <div className="summary-row">
          <strong>Total hits</strong>
          <span>{state.totalHits}</span>
        </div>
        <div className="summary-row">
          <strong>Misses</strong>
          <span>{state.totalMisses}</span>
        </div>
      </section>

      <section className="players-section">
        <h2>Final standings</h2>
        <ul className="summary-list">
          {state.finalStandings.map((playerItem) => (
            <li key={playerItem.id} className="history-item">
              <span>{playerItem.name}</span>
              <span>{playerItem.status === 'alive' ? 'Winner' : playerItem.status === 'dead-buyback' ? 'Dead (buyback)' : 'Dead'}</span>
              <span>{playerItem.points} pts</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="actions-row">
        <button className="page-button" type="button" onClick={() => navigate('/')}>Back Home</button>
      </div>
    </PageLayout>
  )
}

export function SavedGamesPage() {
  return <PageLayout title="Saved Games" />
}

export function StatisticsPage() {
  return <PageLayout title="statistics" />
}
