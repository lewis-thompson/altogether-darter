import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/auth'
import { createOrUpdateUser } from '../services/firestore'

// Mock user for dev mode
const MOCK_DEV_USER = {
  uid: 'dev-user-123',
  displayName: 'Dev User',
  email: 'dev@localhost',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)
  const isDev = import.meta.env.DEV && !import.meta.env.PROD

  // Auto-sign in during development
  useEffect(() => {
    if (isDev) {
      handleSignIn()
    }
  }, [])

  async function handleSignIn() {
    try {
      setIsLoading(true)
      setError(null)
      const user = await signInWithGoogle(rememberMe)
      // Create or update user in Firestore (skip in dev if it fails)
      try {
        await createOrUpdateUser(user.uid, user)
      } catch (firebaseErr) {
        // Firestore might be disconnected in dev - that's okay
        console.warn('Firestore unavailable in dev mode:', firebaseErr)
      }
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

        {isDev && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '0.9em',
            color: '#333'
          }}>
            🔧 <strong>Development Mode</strong> - Auto-logged in as "{MOCK_DEV_USER.displayName}"
          </div>
        )}

        {!isDev && (
          <>
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
          </>
        )}

        {error && (
          <p style={{ color: 'var(--danger)', marginTop: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
