type ResultPlayer = {
  id: string
  name: string
  score: number
}

type Props = {
  winner: ResultPlayer
  rankings: ResultPlayer[]
}

export default function GameResultCard({ winner, rankings }: Props) {
  return (
    <section>
      <h2>Winner</h2>
      <div>{winner.name}</div>
      <div>Score: {winner.score}</div>
      <h3>Rankings</h3>
      <ol>
        {rankings.map((player) => (
          <li key={player.id}>
            {player.name}: {player.score}
          </li>
        ))}
      </ol>
    </section>
  )
}
