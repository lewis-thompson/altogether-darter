type Player = {
  id: string
  name: string
  score: number
}

type Props = {
  gameId: string
  players: Player[]
}

export default function GameScreen({ gameId, players }: Props) {
  return (
    <section>
      <h1>Game Screen</h1>
      <div>Game ID: {gameId}</div>
      <div>
        {players.map((player) => (
          <div key={player.id}>
            <span>{player.name}</span>
            <span>{player.score}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
