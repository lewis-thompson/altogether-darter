import { useMemo, useState } from 'react'
import './App.css'
import GameSetupForm from './components/GameSetupForm'
import PlayerSelector from './components/PlayerSelector'
import Scoreboard, { type ScoreboardPlayer } from './components/Scoreboard'
import NumberPad from './components/NumberPad'
import GameCompletePage from './pages/GameCompletePage'
import HomePage from './pages/HomePage'
import StatisticsPage from './pages/StatisticsPage'

type Page = 'home' | 'setup' | 'game' | 'complete' | 'stats'

type ResultPlayer = {
  id: string
  name: string
  score: number
}

type StatRow = {
  playerId: string
  name: string
  gamesPlayed: number
  wins: number
}

const initialStats: StatRow[] = []

function createPlayerId(name: string, index: number) {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`
}

function getShotValue(input: string) {
  if (input === 'bullseye') return 50
  if (input === 'miss') return 0
  const parsed = Number(input)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getTargetForGameType(gameType: string, index: number) {
  return gameType === 'killer' ? 20 + index * 5 : 301
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedGameType, setSelectedGameType] = useState('killer')
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [players, setPlayers] = useState<ScoreboardPlayer[]>([])
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [gameId, setGameId] = useState('')
  const [winner, setWinner] = useState<ResultPlayer | null>(null)
  const [rankings, setRankings] = useState<ResultPlayer[]>([])
  const [stats, setStats] = useState<StatRow[]>(initialStats)
  const [message, setMessage] = useState('')

  const currentPlayerName = useMemo(
    () => players.find((player) => player.id === currentPlayerId)?.name ?? '',
    [players, currentPlayerId]
  )

  const handleStartNewGame = () => {
    setPage('setup')
    setMessage('')
  }

  const handleContinueGame = () => {
    if (players.length > 0 && page !== 'complete') {
      setPage('game')
      setMessage('')
      return
    }

    setMessage('No active game is available yet. Start a new game first.')
  }

  const handleViewStatistics = () => {
    setPage('stats')
    setMessage('')
  }

  const handleAddPlayer = (name: string) => {
    const trimmed = name.trim()

    if (!trimmed) {
      setMessage('Please enter a player name.')
      return
    }

    if (playerNames.some((player) => player.toLowerCase() === trimmed.toLowerCase())) {
      setMessage('That player has already been added.')
      return
    }

    setPlayerNames((current) => [...current, trimmed])
    setMessage('')
  }

  const handleGameTypeChange = (value: string) => {
    setSelectedGameType(value)
  }

  const handleCreateGame = () => {
    if (playerNames.length < 2) {
      setMessage('Add at least two players before starting the game.')
      return
    }

    const nextPlayers = playerNames.map((name, index) => ({
      id: createPlayerId(name, index),
      name,
      score: 0,
      target: getTargetForGameType(selectedGameType, index),
      isKiller: selectedGameType === 'killer' && index === 0
    }))

    setPlayers(nextPlayers)
    setCurrentPlayerId(nextPlayers[0].id)
    setGameId(`dart-game-${Date.now()}`)
    setPage('game')
    setMessage('')
  }

  const handleInput = (value: string) => {
    if (!currentPlayerId) {
      setMessage('No active player selected.')
      return
    }

    setPlayers((previous) => {
      const shotValue = getShotValue(value)
      const nextPlayers = previous.map((player) =>
        player.id === currentPlayerId
          ? { ...player, score: player.score + shotValue }
          : player
      )

      const currentIndex = previous.findIndex((player) => player.id === currentPlayerId)
      if (currentIndex >= 0) {
        const nextIndex = (currentIndex + 1) % previous.length
        setCurrentPlayerId(previous[nextIndex].id)
      }

      return nextPlayers
    })

    setMessage(`Recorded ${value} for ${currentPlayerName || 'current player'}.`)
  }

  const handleFinishGame = () => {
    if (players.length === 0) {
      setMessage('There is no game to finish yet.')
      return
    }

    const sorted = [...players].sort((a, b) => b.score - a.score)
    const winnerPlayer = sorted[0]
    const resultRankings = sorted.map(({ id, name, score }) => ({ id, name, score }))

    setWinner({
      id: winnerPlayer.id,
      name: winnerPlayer.name,
      score: winnerPlayer.score
    })
    setRankings(resultRankings)
    setPage('complete')
    setStats((previous) => {
      const next = [...previous]

      sorted.forEach((player) => {
        const existing = next.find((row) => row.playerId === player.id)

        if (existing) {
          existing.gamesPlayed += 1
          existing.wins += player.id === winnerPlayer.id ? 1 : 0
        } else {
          next.push({
            playerId: player.id,
            name: player.name,
            gamesPlayed: 1,
            wins: player.id === winnerPlayer.id ? 1 : 0
          })
        }
      })

      return next
    })
    setMessage('')
  }

  const handleBackHome = () => {
    setPage('home')
    setMessage('')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Altogether Darter</p>
          <h1>Play darts the easy way</h1>
          <p className="intro">
            Set up Killer or 301 games, add players, track scores, and see results live.
          </p>
        </div>

        <div className="app-nav">
          <button type="button" className="primary" onClick={handleStartNewGame}>
            Start new game
          </button>
          <button type="button" onClick={handleContinueGame}>
            Continue game
          </button>
          <button type="button" onClick={handleViewStatistics}>
            Statistics
          </button>
        </div>
      </header>

      <main className="app-main">
        {message ? <div className="banner">{message}</div> : null}

        {page === 'home' && (
          <HomePage
            onStartNewGame={handleStartNewGame}
            onContinueGame={handleContinueGame}
            onViewStatistics={handleViewStatistics}
          />
        )}

        {page === 'setup' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Game setup</h2>
              <p>Choose the game mode and add at least two players.</p>
            </div>

            <div className="form-row">
              <GameSetupForm
                selectedGameType={selectedGameType}
                players={playerNames}
                onGameTypeChange={handleGameTypeChange}
                onPlayerChange={setPlayerNames}
                onCreateGame={handleCreateGame}
              />

              <PlayerSelector players={playerNames} onAddPlayer={handleAddPlayer} />
            </div>

            {playerNames.length > 0 && (
              <div className="player-preview">
                <h3>Players in this match</h3>
                <ul>
                  {playerNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {page === 'game' && (
          <section className="panel">
            <div className="game-header">
              <div>
                <p className="eyebrow">Active game</p>
                <h2>{selectedGameType === 'killer' ? 'Killer' : '301'} mode</h2>
                <p>Game ID: {gameId}</p>
              </div>
              <button type="button" className="primary" onClick={handleFinishGame}>
                Finish game
              </button>
            </div>

            <div className="game-grid">
              <Scoreboard players={players} />

              <div className="play-panel">
                <div className="turn-banner">
                  Next turn: <strong>{currentPlayerName || 'waiting...'}</strong>
                </div>
                <NumberPad onInput={handleInput} />
              </div>
            </div>
          </section>
        )}

        {page === 'complete' && winner && (
          <section className="panel complete-panel">
            <GameCompletePage winner={winner} rankings={rankings} />
            <button type="button" className="secondary" onClick={handleBackHome}>
              Back to home
            </button>
          </section>
        )}

        {page === 'stats' && (
          <section className="panel">
            <StatisticsPage stats={stats} />
            <button type="button" className="secondary" onClick={handleBackHome}>
              Back to home
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
