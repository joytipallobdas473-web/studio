'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// Use a global variable to persist instances across HMR in development.
// This prevents the "INTERNAL ASSERTION FAILED" error caused by multiple initializations.
const globalForFirebase = globalThis as unknown as {
  app: FirebaseApp | undefined;
  auth: Auth | undefined;
  db: Firestore | undefined;
};

export function initializeFirebase() {
  if (typeof window === 'undefined') return { firebaseApp: null, auth: null, firestore: null };

  if (!globalForFirebase.app) {
    if (!getApps().length) {
      globalForFirebase.app = initializeApp(firebaseConfig);
    } else {
      globalForFirebase.app = getApp();
    }
  }

  if (!globalForFirebase.auth) globalForFirebase.auth = getAuth(globalForFirebase.app);
  if (!globalForFirebase.db) globalForFirebase.db = getFirestore(globalForFirebase.app);

  return {
    firebaseApp: globalForFirebase.app,
    auth: globalForFirebase.auth,
    firestore: globalForFirebase.db
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
