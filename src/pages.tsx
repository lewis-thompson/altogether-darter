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
      </div>
    </main>
  )
}

type Player = {
  id: number
  name: string
  selectedNumber: number | null
}

type GameState = {
  players: Player[]
  bullseyeBuyback: boolean
  bullseyeRounds: number | null
  killerThreshold: number
}

const numbers = Array.from({ length: 20 }, (_, index) => index + 1)

export function CreateGamePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [bullseyeBuyback, setBullseyeBuyback] = useState(false)
  const [bullseyeRounds, setBullseyeRounds] = useState<number | ''>(1)
  const [killerThreshold, setKillerThreshold] = useState<number | ''>('')

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

  const isEachPlayerSelected = players.every(
    (player) => player.selectedNumber !== null,
  )
  const isUniqueSelection =
    players.length ===
    new Set(
      players
        .map((player) => player.selectedNumber)
        .filter((value): value is number => value !== null),
    ).size
  const hasValidKillerThreshold =
    killerThreshold !== '' && killerThreshold >= 1
  const hasValidBuybackRounds =
    !bullseyeBuyback || (bullseyeRounds !== '' && bullseyeRounds >= 1)
  const canStartGame =
    players.length >= 2 &&
    players.length <= 20 &&
    isEachPlayerSelected &&
    isUniqueSelection &&
    hasValidKillerThreshold &&
    hasValidBuybackRounds

  let validationMessage
  if (players.length < 2) {
    validationMessage = 'Add at least 2 players.'
  } else if (!isEachPlayerSelected) {
    validationMessage = 'Each player must choose a unique number.'
  } else if (!isUniqueSelection) {
    validationMessage = 'Each player must have a different number.'
  } else if (!hasValidKillerThreshold) {
    validationMessage = 'Enter how many hits are needed to become Killer.'
  } else if (!hasValidBuybackRounds) {
    validationMessage = 'Enter a number of buyback rounds when bullseye buyback is enabled.'
  }

  function handleStartGame() {
    if (!canStartGame) {
      return
    }

    navigate('/killer', {
      state: {
        players,
        bullseyeBuyback,
        bullseyeRounds: bullseyeBuyback ? Number(bullseyeRounds) : null,
        killerThreshold: Number(killerThreshold),
      } satisfies GameState,
    })
  }

  return (
    <PageLayout title="Create Game">
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
          <button
            className="page-button secondary"
            type="button"
            disabled={players.length === 0}
            onClick={randomizeNumbers}
          >
            Randomize numbers
          </button>
        </div>
      </form>

      <section className="players-section">
        <h2>Players</h2>
        {players.length === 0 ? (
          <p className="empty-state">No players added yet.</p>
        ) : (
          <ul className="players-list">
            {players.map((player) => {
              const otherSelectedNumbers = new Set(
                players
                  .filter((other) => other.id !== player.id)
                  .map((other) => other.selectedNumber)
                  .filter((value): value is number => value !== null),
              )
              return (
                <li key={player.id} className="player-item">
                  <div>
                    <p className="player-name">{player.name}</p>
                    <p className="player-choice">
                      Selected: {player.selectedNumber ?? 'None'}
                    </p>
                  </div>
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
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="settings-row">
        <section className="buyback-section">
          <div className="section-header">
            <h2>Bullseye buyback</h2>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={bullseyeBuyback}
                defaultValue={8}
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
              defaultValue={5}
              value={killerThreshold}
              onChange={(event) => {
                const value = event.target.value
                setKillerThreshold(value === '' ? '' : Number(value))
              }}
            />
          </div>
        </section>
      </div>

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

export function KillerPage() {
  const location = useLocation()
  const state = location.state as GameState | null

  return (
    <PageLayout title="Killer">
      {!state?.players ? (
        <p className="empty-state">No game data was passed. Return to Create Game to begin.</p>
      ) : (
        <section className="summary-card">
          <div className="summary-row">
            <strong>Killer threshold</strong>
            <span>{state.killerThreshold}</span>
          </div>
          <div className="summary-row">
            <strong>Bullseye buyback</strong>
            <span>{state.bullseyeBuyback ? `Yes — ${state.bullseyeRounds ?? 0} rounds` : 'No'}</span>
          </div>
          <div className="summary-row">
            <strong>Players</strong>
            <span>{state.players.length}</span>
          </div>
          <ul className="players-list summary-list">
            {state.players.map((player) => (
              <li key={player.id} className="player-item">
                <span>{player.name}</span>
                <span>Number {player.selectedNumber ?? 'None'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageLayout>
  )
}

export function SavedGamesPage() {
  return <PageLayout title="Saved Games" />
}

export function StatisticsPage() {
  return <PageLayout title="statistics" />
}
