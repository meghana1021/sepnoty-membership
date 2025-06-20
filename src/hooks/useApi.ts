import { useState, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): ApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.response?.data?.error || error.message || 'An error occurred',
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

export function useAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R>
): {
  execute: (...args: T) => Promise<R>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: T): Promise<R> => {
    setLoading(true);
    setError(null);

    try {
      const result = await action(...args);
      setLoading(false);
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  return { execute, loading, error };
}