import { Link } from 'react-router-dom'

interface GameHeaderProps {
  gameType: string
  currentPlayerName: string
  round?: number
  threshold?: number
  bullseyeBuyback?: boolean
  bullseyeRoundsLeft?: number | null
  onToggleBuyback?: () => void
  // Generic header stats for any game
  headerStats?: Array<{ label: string; value: string | number }>
}

export function GameHeader({
  gameType,
  currentPlayerName,
  round,
  bullseyeBuyback,
  bullseyeRoundsLeft,
  onToggleBuyback,
  headerStats,
}: GameHeaderProps) {
  return (
    <section className="killer-game-header" data-testid="game-header">
      <Link to="/" className="header-home-button" title="Home">
        ← Home
      </Link>
      <div className="header-row">
        <div className="header-info">
          <div className="header-title">{gameType}</div>
          {headerStats?.map((stat) => (
            <div key={stat.label} className="header-stat">
              <span className="stat-label">{stat.label}:</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="header-divider"></div>
        <div className="header-info">
          <div className="header-label">Current Player</div>
          <div className="header-title">{currentPlayerName}</div>
        </div>
        {round !== undefined && (
          <>
            <div className="header-divider"></div>
            <div className="header-info">
              <div className="header-label">Round</div>
              <div className="header-title">{round}</div>
            </div>
          </>
        )}
      </div>
      {bullseyeBuyback && (
        <div className="header-row">
          <div className="header-info">
            <div className="header-label">Bullseye Buyback</div>
            <div className="header-stat">
              <span>{bullseyeRoundsLeft ? `${bullseyeRoundsLeft} rounds` : 'Off'}</span>
            </div>
          </div>
          {onToggleBuyback && (
            <button
              type="button"
              className="header-toggle-button"
              onClick={onToggleBuyback}
              title="Toggle buyback"
            >
              Disable
            </button>
          )}
        </div>
      )}
    </section>
  )
}
