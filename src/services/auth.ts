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
import { User } from '../types'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with Google
 * @param rememberMe - If true, user stays signed in across browser sessions
 */
export async function signInWithGoogle(rememberMe: boolean): Promise<User> {
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
  return auth.onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
      callback(firebaseUserToAppUser(firebaseUser))
    } else {
      callback(null)
    }
  })
}
