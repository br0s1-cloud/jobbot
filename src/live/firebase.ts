import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './firebase.config';

// VITE_FIREBASE_* env vars (optional) override the committed config, e.g. to point at a test project.
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId);
}

export function getFirebase() {
  if (!app) {
    app = initializeApp(config);
    // Offline cache so the phone PWA opens instantly and survives flaky connections.
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
  return { app, db: db!, auth: getAuth(app) };
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export function watchUser(cb: (u: User | null) => void) {
  return onAuthStateChanged(getFirebase().auth, cb);
}

export function signOutUser() {
  return signOut(getFirebase().auth);
}
