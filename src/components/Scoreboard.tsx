export type ScoreboardPlayer = {
  id: string
  name: string
  score: number
  target: number
  isKiller: boolean
}

type Props = {
  players: ScoreboardPlayer[]
}

export default function Scoreboard({ players }: Props) {
  return (
    <section>
      <h2>Scoreboard</h2>
      <div>
        {players.map((player) => (
          <article key={player.id}>
            <h3>{player.name}</h3>
            <div>Score: {player.score}</div>
            <div>Target: {player.target}</div>
            <div>{player.isKiller ? 'Killer' : 'Chaser'}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
