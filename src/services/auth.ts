import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase'
import type { User } from '../types'

const googleProvider = new GoogleAuthProvider()

// Development mode - set to true to bypass authentication
const DEV_MODE = import.meta.env.DEV && !import.meta.env.PROD

// Mock user for development
const MOCK_DEV_USER: User = {
  uid: 'dev-user-123',
  displayName: 'Dev User',
  email: 'dev@localhost',
  createdAt: new Date(),
}

/**
 * Sign in with Google
 * @param rememberMe - If true, user stays signed in across browser sessions
 */
export async function signInWithGoogle(rememberMe: boolean): Promise<User> {
  // In development mode, return mock user
  if (DEV_MODE) {
    return MOCK_DEV_USER
  }

  // Set persistence before signing in
  const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence
  await setPersistence(auth, persistenceType)

  const result = await signInWithPopup(auth, googleProvider)
  const firebaseUser = result.user

  const user: User = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Convert Firebase user to app User type
 */
export function firebaseUserToAppUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  // In development mode, immediately return mock user
  if (DEV_MODE) {
    callback(MOCK_DEV_USER)
    return () => {} // Return no-op unsubscribe function
  }

  return auth.onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
      callback(firebaseUserToAppUser(firebaseUser))
    } else {
      callback(null)
    }
  })
}
