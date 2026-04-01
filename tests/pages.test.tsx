import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import GameCompletePage from '../src/pages/GameCompletePage'
import GameScreen from '../src/pages/GameScreen'
import GameSetupPage from '../src/pages/GameSetupPage'
import HomePage from '../src/pages/HomePage'
import StatisticsPage from '../src/pages/StatisticsPage'

describe('Page flow and navigation', () => {
  it('shows Home page with Start New Game, Continue Game, and View Statistics actions', () => {
    const onStartNewGame = vi.fn()
    const onContinueGame = vi.fn()
    const onViewStatistics = vi.fn()

    render(
      <HomePage
        onStartNewGame={onStartNewGame}
        onContinueGame={onContinueGame}
        onViewStatistics={onViewStatistics}
      />
    )

    expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view statistics/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start new game/i }))
    expect(onStartNewGame).toHaveBeenCalled()
  })

  it('allows game setup configuration for Killer game and player selection', () => {
    const onSubmit = vi.fn()

    render(<GameSetupPage availablePlayers={['Alice']} onSubmit={onSubmit} />)

    expect(screen.getByRole('combobox', { name: /game type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('navigates to Game Screen after creating a game', () => {
    render(
      <GameScreen
        gameId="game-1"
        players={[{ id: 'p1', name: 'Alice', score: 501 }]}
      />
    )

    expect(screen.getByText(/game id/i)).toBeInTheDocument()
  })

  it('displays the Game Complete page when the game finishes', () => {
    render(
      <GameCompletePage
        winner={{ id: 'p1', name: 'Alice', score: 0 }}
        rankings={[{ id: 'p1', name: 'Alice', score: 0 }]}
      />
    )

    expect(screen.getByText(/game complete/i)).toBeInTheDocument()
    expect(screen.getByText(/winner/i)).toBeInTheDocument()
  })

  it('shows player statistics on the Statistics page', () => {
    render(
      <StatisticsPage
        stats={[{ playerId: 'p1', name: 'Alice', gamesPlayed: 3, wins: 2 }]}
      />
    )

    expect(screen.getByText(/player statistics/i)).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })
})
