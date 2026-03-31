'use client';

import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!isMounted) return;
          const results: WithId<T>[] = [];
          for (const doc of snapshot.docs) {
            results.push({ ...(doc.data() as T), id: doc.id });
          }
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
            // For non-permission errors (like missing indexes), we set the error state
            // but do not emit a global error to avoid intrusive UI overlays.
            setError(err);
          }
          
          setData(null);
          setIsLoading(false);
        }
      );
    } catch (err) {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = true;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore errors on unmount
        }
      }
    };
  }, [memoizedTargetRefOrQuery]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore target was not properly memoized using useMemoFirebase.');
  }

  return { data, isLoading, error };
}