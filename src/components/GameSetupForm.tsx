import type { ChangeEvent } from 'react'

type Props = {
  selectedGameType: string
  players: string[]
  onGameTypeChange: (value: string) => void
  onPlayerChange: (players: string[]) => void
  onCreateGame: () => void
}

export default function GameSetupForm({
  selectedGameType,
  players,
  onGameTypeChange,
  onPlayerChange,
  onCreateGame
}: Props) {
  const handleGameTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onGameTypeChange(event.target.value)
  }

  const handleAddPlayer = () => {
    onPlayerChange([...players])
  }

  return (
    <form>
      <label htmlFor="game-type">Game type</label>
      <select id="game-type" value={selectedGameType} onChange={handleGameTypeChange} aria-label="Game type">
        <option value="killer">Killer</option>
        <option value="301">301</option>
      </select>

      <button type="button" onClick={onCreateGame}>
        Create game
      </button>

      <button type="button" onClick={handleAddPlayer}>
        Refresh players
      </button>
    </form>
  )
}
