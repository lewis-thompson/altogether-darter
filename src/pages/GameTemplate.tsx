import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import './GameTemplate.css'

interface PlayerData {
  id: string
  name: string
  hits: string[]
  additionalData: Record<string, string | number>
}

interface HeaderConfig {
  title: string
  currentPlayer: string
  round: number
  stats?: Array<{
    label: string
    value: string | number
  }>
}

interface GameTemplateProps {
  headerConfig: HeaderConfig
  players: PlayerData[]
  currentPlayerIndex: number
  currentHits: string[]
  onAddScore: (value: 'miss' | 'bull' | number) => void
  onRemoveLastHit: () => void
  onToggleModifier?: (modifier: 'double' | 'treble') => void
  selectedModifier?: 'double' | 'treble' | null
  homeLink?: string
}

export function GameTemplate({
  headerConfig,
  players,
  currentPlayerIndex,
  currentHits,
  onAddScore,
  onRemoveLastHit,
  onToggleModifier,
  selectedModifier = null,
  homeLink = '/',
}: GameTemplateProps) {
  const [isModifierActive, setIsModifierActive] = useState<'double' | 'treble' | null>(selectedModifier)
  const playerCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const currentPlayer = players[currentPlayerIndex]

  // Autoscroll to center the current player
  useEffect(() => {
    const currentCard = playerCardRefs.current[currentPlayer.id]
    if (currentCard) {
      currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentPlayerIndex, currentPlayer.id])

  const handleToggleModifier = (modifier: 'double' | 'treble') => {
    setIsModifierActive(isModifierActive === modifier ? null : modifier)
    onToggleModifier?.(modifier)
  }

  const scoreButtons = [
    ...Array.from({ length: 20 }, (_, i) => i + 1),
    'bull' as const,
    'miss' as const,
  ]

  return (
    <div className="game-template-container">
      {/* Header Section */}
      <div className="template-header">
        <div className="template-header-top">
          <Link to={homeLink} className="template-home-button">
            ← Home
          </Link>
        </div>
        <div className="template-header-content">
          <div className="template-header-title">{headerConfig.title}</div>
          <div className="template-header-stats">
            {headerConfig.stats?.map((stat, index) => (
              <div key={index}>
                <div className="template-header-stat">
                  <span className="template-stat-label">{stat.label}:</span>
                  <span className="template-stat-value">{stat.value}</span>
                </div>
                {index < (headerConfig.stats?.length ?? 0) - 1 && (
                  <div className="template-header-divider"></div>
                )}
              </div>
            ))}
          </div>
          <div className="template-header-stats">
            <div className="template-header-stat">
              <span className="template-stat-label">Current Player:</span>
              <span className="template-stat-value">{headerConfig.currentPlayer}</span>
            </div>
            <div className="template-header-divider"></div>
            <div className="template-header-stat">
              <span className="template-stat-label">Round:</span>
              <span className="template-stat-value">{headerConfig.round}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Players Section - Scrollable */}
      <div className="template-players-wrapper">
        <div className="template-players-list">
          {players.map((player, index) => (
            <div
              key={player.id}
              ref={(element) => {
                playerCardRefs.current[player.id] = element
              }}
              className={`template-player-card ${index === currentPlayerIndex ? 'active' : ''}`}
            >
              <div className="template-player-header">
                <span className="template-player-name">{player.name}</span>
              </div>
              <div className="template-player-data">
                <div className="template-data-row">
                  <span className="template-data-label">Hits</span>
                  <span className="template-data-value">
                    {index === currentPlayerIndex && currentHits.length > 0
                      ? currentHits.join(' | ')
                      : player.hits.length === 0
                        ? '—'
                        : player.hits.join(' | ')}
                  </span>
                </div>
                {Object.entries(player.additionalData).map(([key, value]) => (
                  <div key={key} className="template-data-row">
                    <span className="template-data-label">{key}</span>
                    <span className="template-data-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Component - Inline */}
      <div className="template-score-section">
        <div className="template-modifier-row">
          <button
            className={`template-modifier-button${isModifierActive === 'double' ? ' selected' : ''}`}
            onClick={() => handleToggleModifier('double')}
            disabled={currentHits.length >= 3}
          >
            Double
          </button>
          <button
            className={`template-modifier-button${isModifierActive === 'treble' ? ' selected' : ''}`}
            onClick={() => handleToggleModifier('treble')}
            disabled={currentHits.length >= 3}
          >
            Treble
          </button>
          <button className="template-modifier-button" onClick={onRemoveLastHit} disabled={currentHits.length === 0}>
            Back
          </button>
        </div>

        <div className="template-score-buttons">
          {scoreButtons.map((value) => {
            const isBull = value === 'bull'
            const isMiss = value === 'miss'
            const displayValue = typeof value === 'number' ? value : isBull ? 'Bull' : 'Miss'

            return (
              <button
                key={String(value)}
                className={`template-score-button${
                  isModifierActive && typeof value === 'number' ? ' modifier-active' : ''
                }`}
                onClick={() => onAddScore(value)}
                disabled={currentHits.length >= 3 || (isModifierActive === 'treble' && (isBull || isMiss))}
              >
                {displayValue}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
