type Props = {
  onStartNewGame: () => void
  onContinueGame: () => void
  onViewStatistics: () => void
}

export default function HomePage({ onStartNewGame, onContinueGame, onViewStatistics }: Props) {
  return (
    <section>
      <h1>Home</h1>
      <button type="button" onClick={onStartNewGame}>
        Start New Game
      </button>
      <button type="button" onClick={onContinueGame}>
        Continue Game
      </button>
      <button type="button" onClick={onViewStatistics}>
        View Statistics
      </button>
    </section>
  )
}
