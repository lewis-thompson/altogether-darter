export type Shot = {
  segment: number
  multiplier: number
}

export type KillerShotInput = {
  shooterId: string
  targetId: string
  points: number
}

export type KillerGameState = {
  round: number
  currentPlayerId: string
  players: Array<unknown>
}

export function calculateShotPoints({ segment, multiplier }: Shot) {
  return segment * multiplier
}

export function validateOverTargetPenalty({ currentScore, targetScore }: { currentScore: number; targetScore: number }) {
  return targetScore - currentScore
}

export function determineGameEnd({ playersAlive }: { playersAlive: number }) {
  return playersAlive === 1
}

export function evaluateBullseyeBuyback({ round, canBuyback }: { round: number; canBuyback: boolean }) {
  return canBuyback && round <= 6
}

export function applyKillerShot(gameState: KillerGameState, shot: KillerShotInput) {
  if (gameState.round === 1 && shot.shooterId !== shot.targetId) {
    return { scored: false }
  }

  if (shot.points < 0) {
    return { comebackVisitAllowed: true }
  }

  if (shot.shooterId === shot.targetId) {
    if (gameState.round === 2) {
      return { promotedToKiller: true }
    }

    return { removedKillerStatus: true }
  }

  return { opponentPenalty: shot.points }
}
