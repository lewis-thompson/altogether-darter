import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import GameSetupForm from '../src/components/GameSetupForm'
import GameResultCard from '../src/components/GameResultCard'
import NumberPad from '../src/components/NumberPad'
import PlayerSelector from '../src/components/PlayerSelector'
import Scoreboard from '../src/components/Scoreboard'

describe('Component behavior', () => {
  it('renders the game setup form with game type and player selection', () => {
    render(
      <GameSetupForm
        selectedGameType="killer"
        players={[]}
        onGameTypeChange={vi.fn()}
        onPlayerChange={vi.fn()}
        onCreateGame={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox', { name: /game type/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create game/i })).toBeInTheDocument()
  })

  it('renders the player selector and handles adding a new player', () => {
    const onAddPlayer = vi.fn()

    render(<PlayerSelector players={['Alice']} onAddPlayer={onAddPlayer} />)

    fireEvent.change(screen.getByRole('textbox', { name: /player name/i }), {
      target: { value: 'Bob' }
    })
    fireEvent.click(screen.getByRole('button', { name: /add player/i }))

    expect(onAddPlayer).toHaveBeenCalledWith('Bob')
  })

  it('renders the number pad and registers input for numbers, bullseye, and miss', () => {
    const onInput = vi.fn()

    render(<NumberPad onInput={onInput} />)

    fireEvent.click(screen.getByRole('button', { name: /5/i }))
    fireEvent.click(screen.getByRole('button', { name: /bullseye/i }))
    fireEvent.click(screen.getByRole('button', { name: /miss/i }))

    expect(onInput).toHaveBeenCalledTimes(3)
  })

  it('renders the scoreboard with player names, scores, targets, and killer status', () => {
    render(
      <Scoreboard
        players={[
          { id: 'p1', name: 'Alice', score: 40, target: 20, isKiller: false }
        ]}
      />
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText(/target/i)).toBeInTheDocument()
  })

  it('renders the game result card on completion with winner and rankings', () => {
    render(
      <GameResultCard
        winner={{ id: 'p1', name: 'Alice', score: 0 }}
        rankings={[{ id: 'p1', name: 'Alice', score: 0 }]}
      />
    )

    expect(screen.getByText(/winner/i)).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })
})
