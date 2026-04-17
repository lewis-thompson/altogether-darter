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
  customScoreButtons?: (number | string)[]
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
  customScoreButtons,
}: ScoreComponentProps) {
  const scoreButtons = customScoreButtons || [...numbers, 'bull' as const, 'miss' as const]

  function getButtonLabel(value: number | string): string {
    if (typeof value === 'number') return String(value)
    if (value === 'bull') return 'Bull'
    if (value === 'miss') return 'Miss'
    if (typeof value === 'string') {
      // Handle dart notation like 'D1', 'T1', 'S1'
      if (value.startsWith('D')) return `D${value.slice(1)}`
      if (value.startsWith('T')) return `T${value.slice(1)}`
      if (value.startsWith('S')) return value.slice(1)
      return value
    }
    return String(value)
  }

  function getButtonValue(value: number | string): 'miss' | 'bull' | number {
    if (typeof value === 'number') return value
    if (value === 'bull' || value === 'miss') return value
    if (typeof value === 'string') {
      // For dart notation, extract the number
      if (value.startsWith('D') || value.startsWith('T') || value.startsWith('S')) {
        const num = parseInt(value.slice(1), 10)
        return num
      }
      return value as 'miss' | 'bull'
    }
    return value
  }

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
          const buttonValue = getButtonValue(value)
          const buttonLabel = getButtonLabel(value)

          return (
            <button
              key={String(value)}
              type="button"
              className={`score-button${selectedModifier && typeof buttonValue === 'number' ? ' modifier-active' : ''}`}
              onClick={() => onAddScore(buttonValue)}
              disabled={!canScoreMore || (selectedModifier === 'treble' && (isBull || isValueMiss))}
            >
              {buttonLabel}
            </button>
          )
        })}
      </section>
    </section>
  )
}
