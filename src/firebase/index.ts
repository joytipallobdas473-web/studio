'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// Singleton SDK instances to prevent internal assertion errors
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization failed:', e);
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!authInstance) authInstance = getAuth(firebaseApp);
  if (!firestoreInstance) firestoreInstance = getFirestore(firebaseApp);
  
  return {
    firebaseApp,
    auth: authInstance,
    firestore: firestoreInstance
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
