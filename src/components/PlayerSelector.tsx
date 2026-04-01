import { useState } from 'react'

type Props = {
  players: string[]
  onAddPlayer: (name: string) => void
}

export default function PlayerSelector({ players, onAddPlayer }: Props) {
  const [name, setName] = useState('')

  return (
    <div>
      <label htmlFor="player-name">Player name</label>
      <input
        id="player-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Player name"
      />
      <button type="button" onClick={() => onAddPlayer(name)}>
        Add player
      </button>
      <ul>
        {players.map((player) => (
          <li key={player}>{player}</li>
        ))}
      </ul>
    </div>
  )
}
