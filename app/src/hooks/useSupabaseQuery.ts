import { useState, useEffect, useCallback } from 'react';

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Generic hook for Supabase queries with loading states and error handling
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: QueryOptions = {}
): QueryState<T> & { refetch: () => Promise<void> } {
  const { enabled = true, refetchInterval } = options;
  
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const executeQuery = useCallback(async () => {
    if (!enabled) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await queryFn();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'An error occurred' 
      }));
    }
  }, [queryFn, enabled]);

  const refetch = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  useEffect(() => {
    let cancelled = false;
    
    const runQuery = async () => {
      if (cancelled) return;
      await executeQuery();
    };

    runQuery();

    return () => {
      cancelled = true;
    };
  }, [...deps, enabled]);

  // Set up refetch interval if specified
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      executeQuery();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, executeQuery]);

  return {
    ...state,
    refetch,
  };
}

/**
 * Hook for queries that return arrays
 */
export function useSupabaseQueryList<T>(
  queryFn: () => Promise<T[]>,
  deps: any[] = [],
  options: QueryOptions = {}
): QueryState<T[]> & { refetch: () => Promise<void> } {
  const result = useSupabaseQuery(queryFn, deps, options);
  
  return {
    ...result,
    data: result.data || [],
  };
}

/**
 * Hook for mutations with loading states
 */
export function useSupabaseMutation<TData, TVariables = void>() {
  const [state, setState] = useState({
    loading: false,
    error: null as string | null,
  });

  const mutate = useCallback(async (
    mutationFn: (variables: TVariables) => Promise<TData>,
    variables: TVariables
  ): Promise<TData | null> => {
    setState({ loading: true, error: null });
    
    try {
      const result = await mutationFn(variables);
      setState({ loading: false, error: null });
      return result;
    } catch (error: any) {
      setState({ loading: false, error: error.message || 'An error occurred' });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
