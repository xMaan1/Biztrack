import { apiClient } from './apiClient';

export interface ParallelApiCall<T = any> {
  key: string;
  promise: Promise<T>;
}

export interface ParallelApiResult<T = any> {
  [key: string]: T;
}

class ParallelApiService {
  /**
   * Execute multiple API calls in parallel
   * @param calls Array of API call objects with key and promise
   * @returns Object with results keyed by the provided keys
   */
  async executeParallel<T = any>(
    calls: ParallelApiCall<T>[]
  ): Promise<ParallelApiResult<T>> {
    try {
      console.log(`🚀 Executing ${calls.length} API calls in parallel...`);
      
      const results = await Promise.allSettled(
        calls.map(call => call.promise)
      );
      
      const response: ParallelApiResult<T> = {};
      const errors: string[] = [];
      
      calls.forEach((call, index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled') {
          response[call.key] = result.value;
        } else {
          console.error(`❌ API call failed for ${call.key}:`, result.reason);
          errors.push(`${call.key}: ${result.reason}`);
          response[call.key] = undefined as any;
        }
      });
      
      if (errors.length > 0) {
        console.warn('⚠️ Some API calls failed:', errors);
      } else {
        console.log('✅ All parallel API calls completed successfully');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Parallel API execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple API calls with individual error handling
   * @param calls Array of API call objects
   * @returns Object with results and individual error states
   */
  async executeParallelWithErrors<T = any>(
    calls: ParallelApiCall<T>[]
  ): Promise<{
    results: ParallelApiResult<T>;
    errors: { [key: string]: string };
    hasErrors: boolean;
  }> {
    try {
      console.log(`🚀 Executing ${calls.length} API calls in parallel with error handling...`);
      
      const results = await Promise.allSettled(
        calls.map(call => call.promise)
      );
      
      const response: ParallelApiResult<T> = {};
      const errors: { [key: string]: string } = {};
      let hasErrors = false;
      
      calls.forEach((call, index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled') {
          response[call.key] = result.value;
        } else {
          const errorMessage = result.reason?.message || 'Unknown error';
          errors[call.key] = errorMessage;
          hasErrors = true;
          console.error(`❌ API call failed for ${call.key}:`, result.reason);
        }
      });
      
      return {
        results: response,
        errors,
        hasErrors
      };
    } catch (error) {
      console.error('❌ Parallel API execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute API calls with timeout
   * @param calls Array of API call objects
   * @param timeoutMs Timeout in milliseconds
   * @returns Object with results
   */
  async executeParallelWithTimeout<T = any>(
    calls: ParallelApiCall<T>[],
    timeoutMs: number = 10000
  ): Promise<ParallelApiResult<T>> {
    try {
      console.log(`🚀 Executing ${calls.length} API calls in parallel with ${timeoutMs}ms timeout...`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Parallel API calls timeout')), timeoutMs);
      });
      
      const apiPromise = Promise.allSettled(
        calls.map(call => call.promise)
      );
      
      const results = await Promise.race([apiPromise, timeoutPromise]);
      
      const response: ParallelApiResult<T> = {};
      
      calls.forEach((call, index) => {
        const result = results[index];
        
        if (result.status === 'fulfilled') {
          response[call.key] = result.value;
        } else {
          console.error(`❌ API call failed for ${call.key}:`, result.reason);
          response[call.key] = undefined as any;
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Parallel API execution with timeout failed:', error);
      throw error;
    }
  }
}

// Helper function to create API call objects
export const createApiCall = <T = any>(
  key: string,
  apiCall: () => Promise<T>
): ParallelApiCall<T> => ({
  key,
  promise: apiCall()
});

// Helper function for common parallel patterns
export const parallelApiHelpers = {
  // Fetch multiple endpoints in parallel
  fetchMultiple: async <T = any>(
    endpoints: { [key: string]: string }
  ): Promise<ParallelApiResult<T>> => {
    const calls = Object.entries(endpoints).map(([key, endpoint]) =>
      createApiCall(key, () => apiClient.get<T>(endpoint).then((res: any) => res.data))
    );
    
    return parallelApiService.executeParallel(calls);
  },

  // Fetch dashboard data in parallel (alternative to aggregated endpoint)
  fetchDashboardData: async (): Promise<ParallelApiResult> => {
    const calls = [
      createApiCall('projects', () => apiClient.get('/projects').then((res: any) => res.data)),
      createApiCall('workOrdersStats', () => apiClient.get('/work-orders/stats').then((res: any) => res.data)),
      createApiCall('invoicesOverview', () => apiClient.get('/invoices/dashboard/overview').then((res: any) => res.data)),
      createApiCall('subscription', () => apiClient.get('/tenants/current/subscription').then((res: any) => res.data)),
      createApiCall('users', () => apiClient.get('/tenants/current/users').then((res: any) => res.data))
    ];
    
    return parallelApiService.executeParallel(calls);
  }
};

export const parallelApiService = new ParallelApiService();
