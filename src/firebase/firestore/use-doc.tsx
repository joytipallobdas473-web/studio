
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Includes safety guards to prevent Internal Assertion errors during unmount.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (!isMounted) return;
          if (snapshot.exists()) {
            setData({ ...(snapshot.data() as T), id: snapshot.id });
          } else {
            setData(null);
          }
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          if (!isMounted) return;
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: memoizedDocRef.path,
          });

          setError(contextualError);
          setData(null);
          setIsLoading(false);
          errorEmitter.emit('permission-error', contextualError);
        }
      );
    } catch (err) {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
      // Add a small safety check to prevent assertion errors on rapid unmount
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Silently handle potential assertion errors during teardown
        }
      }
    };
  }, [memoizedDocRef]);

  // Safety check to ensure memoization
  if (memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('Firestore target was not properly memoized using useMemoFirebase.');
  }

  return { data, isLoading, error };
}
