export const VALID_GAME_STATUSES = ['pending', 'in-progress', 'completed'] as const

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number => typeof value === 'number'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export function validateUserDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isString(data.id) &&
    isString(data.displayName) &&
    isString(data.email) &&
    isString(data.createdAt)
  )
}

export function validatePlayerDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isString(data.id) &&
    isString(data.name) &&
    isString(data.createdAt) &&
    isObject(data.stats)
  )
}

export function validateStatsDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isNumber(data.gamesPlayed) &&
    isNumber(data.wins) &&
    isNumber(data.averageScore)
  )
}

export function validateGameDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isString(data.id) &&
    isString(data.userId) &&
    isString(data.status) &&
    VALID_GAME_STATUSES.includes(data.status as typeof VALID_GAME_STATUSES[number]) &&
    isString(data.createdAt)
  )
}

export function validateKillerStateDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isString(data.activeKillerId) &&
    isNumber(data.currentTarget) &&
    isNumber(data.round)
  )
}

export function validateGamePlayerDocument(data: unknown) {
  if (!isObject(data)) return false
  return (
    isString(data.id) &&
    isNumber(data.score) &&
    isNumber(data.target) &&
    isBoolean(data.isKiller)
  )
}
