
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Global singleton to prevent "INTERNAL ASSERTION FAILED" during HMR
const globalForFirebase = globalThis as unknown as {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
};

/**
 * Initializes Firebase services as a singleton.
 * Ensures that the app, auth, and firestore instances are created once.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    if (!globalForFirebase.app) {
      const apps = getApps();
      globalForFirebase.app = apps.length > 0 
        ? apps[0] 
        : initializeApp(firebaseConfig as FirebaseOptions);
    }

    if (!globalForFirebase.auth && globalForFirebase.app) {
      globalForFirebase.auth = getAuth(globalForFirebase.app);
    }
    
    if (!globalForFirebase.db && globalForFirebase.app) {
      globalForFirebase.db = getFirestore(globalForFirebase.app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }

  return {
    firebaseApp: globalForFirebase.app || null,
    auth: globalForFirebase.auth || null,
    firestore: globalForFirebase.db || null
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
