import type { Player, PlayerStatus } from '../types'

interface PlayerSectionProps {
  players: Player[]
  currentPlayerIndex: number
  playerHits: Record<number, string[]>
  playerPoints: Record<number, string>
  playerStatus: Record<number, PlayerStatus>
  killerThreshold?: number
  playerLives?: Record<number, number>
  playerKills?: Record<number, number>
  onPlayerRef?: (playerId: number, element: HTMLDivElement | null) => void
}

export function PlayerSection({
  players,
  currentPlayerIndex,
  playerHits,
  playerPoints,
  playerStatus,
  killerThreshold,
  playerLives,
  playerKills,
  onPlayerRef,
}: PlayerSectionProps) {
  const isKiller = (playerId: number) =>
    playerPoints[playerId] === String(killerThreshold) && playerStatus[playerId] === 'alive'

  return (
    <div className="killer-players-list" data-testid="player-section">
      {players.map((player, index) => {
        const status = playerStatus[player.id]
        const hits = playerHits[player.id] ?? []
        const points = playerPoints[player.id] ?? '0'

        return (
          <div
            key={player.id}
            ref={(element) => onPlayerRef?.(player.id, element)}
            className={`player-card${index === currentPlayerIndex ? ' active' : ''}${
              status === 'dead' ? ' dead' : ''
            }${status === 'dead-buyback' ? ' dead-buyback' : ''}${
              status === 'out-recovery' ? ' out-recovery' : ''
            }`}
            data-testid={`player-card-${player.id}`}
          >
            <div className="player-card-header">
              <span className="player-name">{player.name}</span>
              <span className="player-selected-number">#{player.selectedNumber ?? '-'}</span>
            </div>
            <div className="player-card-row">
              <strong>Hits</strong>
              <span>{hits.join(' | ') || '—'}</span>
            </div>
            <div className="player-card-row">
              <strong>Points</strong>
              <span>{points}</span>
            </div>
            {playerLives !== undefined && playerKills !== undefined ? (
              <>
                <div className="player-card-row">
                  <strong>Lives</strong>
                  <span>{playerLives[player.id] ?? 0}</span>
                </div>
                <div className="player-card-row">
                  <strong>Kills</strong>
                  <span>{playerKills[player.id] ?? 0}</span>
                </div>
              </>
            ) : null}
            <div className="player-card-row player-card-status">
              <span>
                {status === 'alive'
                  ? 'Alive'
                  : status === 'out-recovery'
                    ? 'Dead — recovery turn'
                    : status === 'dead-buyback'
                      ? 'Dead — buyback available'
                      : 'Dead'}
              </span>
            </div>
            {isKiller(player.id) ? (
              <div className="player-card-killer">Killer</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
