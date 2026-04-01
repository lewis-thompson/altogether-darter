type StatRow = {
  playerId: string
  name: string
  gamesPlayed: number
  wins: number
}

type Props = {
  stats: StatRow[]
}

export default function StatisticsPage({ stats }: Props) {
  return (
    <section>
      <h1>Player Statistics</h1>
      <ul>
        {stats.map((row) => (
          <li key={row.playerId}>
            {row.name}: {row.gamesPlayed} games, {row.wins} wins
          </li>
        ))}
      </ul>
    </section>
  )
}
