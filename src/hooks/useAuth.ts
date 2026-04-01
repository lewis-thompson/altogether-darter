import { useCallback, useState } from 'react'

type User = {
  id: string
  displayName: string
  email: string
}

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  const signIn = useCallback(async () => {
    const authenticatedUser = {
      id: 'user-123',
      displayName: 'Demo User',
      email: 'demo@example.com'
    }

    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  return {
    user,
    signIn
  }
}
