import GameResultCard from '../components/GameResultCard'

type ResultPlayer = {
  id: string
  name: string
  score: number
}

type Props = {
  winner: ResultPlayer
  rankings: ResultPlayer[]
}

export default function GameCompletePage({ winner, rankings }: Props) {
  return (
    <section>
      <h1>Game Complete</h1>
      <GameResultCard winner={winner} rankings={rankings} />
    </section>
  )
}
