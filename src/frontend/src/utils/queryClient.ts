import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance for Phone Service Platform.
 * Centralized to allow clean session isolation and cache purging across account switches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once before failing
    },
  },
});

/**
 * Purges all cached queries, mutations, and observers from memory.
 * Cancels all in-flight queries to discard active network promises.
 * Mandatory for RBAC-07 Session Isolation to ensure zero data leakage between user sessions.
 */
export const purgeQueryCache = (): void => {
  try {
    queryClient.cancelQueries();
  } catch {
    // Safe fail if no active queries
  }
  queryClient.clear();
};
