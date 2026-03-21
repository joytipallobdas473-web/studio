
'use client';

import { useMemo } from 'react';

/**
 * A utility hook to stabilize Firebase references or queries.
 * Only re-creates the reference when the provided dependencies change.
 */
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
