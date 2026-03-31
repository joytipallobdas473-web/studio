'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    try {
      const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!isMounted) return;
          const results: WithId<T>[] = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id
          }));
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          if (!isMounted) return;
          
          if (err.code === 'permission-denied') {
            const path: string =
              memoizedTargetRefOrQuery.type === 'collection'
                ? (memoizedTargetRefOrQuery as CollectionReference).path
                : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query?.path?.canonicalString() || 'unknown';

            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path,
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
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
