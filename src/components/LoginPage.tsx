import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/auth'
import { createOrUpdateUser } from '../services/firestore'

export function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)

  async function handleSignIn() {
    try {
      setIsLoading(true)
      setError(null)
      const user = await signInWithGoogle(rememberMe)
      // Create or update user in Firestore
      await createOrUpdateUser(user.uid, user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page login-page">
      <div className="login-container">
        <h1>Altogether Darter</h1>
        <p>Sign in to continue</p>

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="page-button"
          style={{ marginTop: '24px' }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <label className="checkbox-row" style={{ marginTop: '16px', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          Remember me on this device
        </label>

        {error && (
          <p style={{ color: 'var(--danger)', marginTop: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
