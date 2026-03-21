
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase App, Firestore, and Auth instances.
 * Ensures that initializeApp is only called once.
 */
export function initializeFirebase(): { app: FirebaseApp; firestore: Firestore; auth: Auth } {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  return { app, firestore, auth };
}

// Re-export hooks and providers for easy access
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
