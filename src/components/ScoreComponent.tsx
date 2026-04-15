interface ScoreComponentProps {
  onAddScore: (value: 'miss' | 'bull' | number) => void
  onRemoveLastHit: () => void
  onToggleModifier: (modifier: 'double' | 'treble') => void
  selectedModifier: 'double' | 'treble' | null
  currentHits: string[]
  canScoreMore: boolean
  disableDoubleModifier?: boolean
  disableTrebleModifier?: boolean
  numbers?: number[]
}

export function ScoreComponent({
  onAddScore,
  onRemoveLastHit,
  onToggleModifier,
  selectedModifier,
  currentHits,
  canScoreMore,
  disableDoubleModifier = false,
  disableTrebleModifier = false,
  numbers = Array.from({ length: 20 }, (_, i) => i + 1),
}: ScoreComponentProps) {
  const scoreButtons = [...numbers, 'bull' as const, 'miss' as const]

  return (
    <section className="score-input-section">
      <section className="modifier-row">
        <button
          type="button"
          className={`modifier-button${selectedModifier === 'double' ? ' selected' : ''}`}
          onClick={() => onToggleModifier('double')}
          disabled={!canScoreMore || disableDoubleModifier}
        >
          Double
        </button>
        <button
          type="button"
          className={`modifier-button${selectedModifier === 'treble' ? ' selected' : ''}`}
          onClick={() => onToggleModifier('treble')}
          disabled={!canScoreMore || disableTrebleModifier}
        >
          Treble
        </button>
        <button
          type="button"
          className="modifier-button"
          onClick={onRemoveLastHit}
          disabled={currentHits.length === 0}
        >
          Back
        </button>
      </section>

      <section className="score-buttons">
        {scoreButtons.map((value) => {
          const isBull = value === 'bull'
          const isValueMiss = value === 'miss'

          return (
            <button
              key={String(value)}
              type="button"
              className={`score-button${selectedModifier && typeof value === 'number' ? ' modifier-active' : ''}`}
              onClick={() => onAddScore(value)}
              disabled={!canScoreMore || (selectedModifier === 'treble' && (isBull || isValueMiss))}
            >
              {typeof value === 'number'
                ? value
                : value === 'bull'
                  ? 'Bull'
                  : 'Miss'}
            </button>
          )
        })}
      </section>
    </section>
  )
}
