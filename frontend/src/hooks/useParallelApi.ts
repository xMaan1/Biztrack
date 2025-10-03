import { useState, useEffect, useCallback } from 'react';
import { parallelApiService, ParallelApiCall, ParallelApiResult } from '../services/parallelApiService';

// Re-export createApiCall for convenience
export { createApiCall } from '../services/parallelApiService';

interface UseParallelApiReturn<T = any> {
  data: ParallelApiResult<T> | null;
  loading: boolean;
  error: string | null;
  errors: { [key: string]: string };
  hasErrors: boolean;
  refetch: () => Promise<void>;
}

export const useParallelApi = <T = any>(
  calls: ParallelApiCall<T>[],
  dependencies: any[] = []
): UseParallelApiReturn<T> => {
  const [data, setData] = useState<ParallelApiResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasErrors, setHasErrors] = useState(false);

  const fetchData = useCallback(async () => {
    if (calls.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrors({});
      setHasErrors(false);
      
      const result = await parallelApiService.executeParallelWithErrors(calls);
      
      setData(result.results);
      setErrors(result.errors);
      setHasErrors(result.hasErrors);
      
      if (result.hasErrors) {
        console.warn('⚠️ Some parallel API calls had errors:', result.errors);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Parallel API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    errors,
    hasErrors,
    refetch: fetchData
  };
};

// Specialized hook for dashboard data using parallel calls
export const useDashboardParallel = () => {
  const calls: ParallelApiCall[] = [
    {
      key: 'projects',
      promise: fetch('/api/projects').then(res => res.json())
    },
    {
      key: 'workOrdersStats',
      promise: fetch('/api/work-orders/stats').then(res => res.json())
    },
    {
      key: 'invoicesOverview',
      promise: fetch('/api/invoices/dashboard/overview').then(res => res.json())
    },
    {
      key: 'subscription',
      promise: fetch('/api/tenants/current/subscription').then(res => res.json())
    }
  ];

  return useParallelApi(calls);
};
