import { useState, useEffect } from 'react'
import type { User } from '../types'
import { onAuthStateChanged } from '../services/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onAuthStateChanged((authUser) => {
      try {
        setUser(authUser)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication error')
      } finally {
        setIsLoading(false)
      }
    })

    return unsubscribe
  }, [])

  return { user, isLoading, error }
}
