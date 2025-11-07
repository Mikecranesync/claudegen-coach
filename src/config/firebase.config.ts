import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
// import { FIREBASE_APP_ID } from '@utils/constants'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if configuration is provided
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

const initializeFirebase = (): void => {
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase configuration not found. Using local storage fallback.')
    return
  }

  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    console.log('Firebase initialized successfully')
  } catch (error) {
    console.error('Error initializing Firebase:', error)
  }
}

// Initialize on import
initializeFirebase()

export { app, db, auth }
export const isFirebaseAvailable = (): boolean => app !== null
