'use client';
    
import { useState, useEffect, useRef } from 'react';
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
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedDocRef);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    try {
      const unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (!isMounted) return;
          const docData = snapshot.exists() 
            ? { ...(snapshot.data() as T), id: snapshot.id } 
            : null;
          
          setData(docData);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          if (!isMounted) return;
          
          if (err.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: memoizedDocRef.path,
            });

            errorEmitter.emit('permission-error', contextualError);
            setError(contextualError);
          } else {
            setError(err);
          }

          setData(null);
          setIsLoading(false);
        }
      );
      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      if (isMounted) {
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        const unsubscribeFunc = unsubscribeRef.current;
        unsubscribeRef.current = null;
        // Crucial: Defer unsubscription to prevent internal SDK assertion errors
        setTimeout(() => {
          unsubscribeFunc();
        }, 0);
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
