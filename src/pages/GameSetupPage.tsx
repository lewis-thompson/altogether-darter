type Props = {
  availablePlayers: string[]
  onSubmit: () => void
}

export default function GameSetupPage({ availablePlayers, onSubmit }: Props) {
  return (
    <section>
      <h1>Game Setup</h1>
      <label htmlFor="game-type">Game type</label>
      <select id="game-type" aria-label="Game type">
        <option value="killer">Killer</option>
        <option value="301">301</option>
      </select>
      <button type="button" onClick={onSubmit}>
        Start Game
      </button>
      <div>
        <h2>Players</h2>
        <ul>
          {availablePlayers.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
