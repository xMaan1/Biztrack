import { useState } from 'react';
import { reportsService } from '../services/reportsService';
import { useCachedApi } from './useCachedApi';

export const useReportsDashboard = () => {
  const result = useCachedApi(
    'reports-dashboard',
    () => {
      console.log('=== useReportsDashboard API CALL ===');
      return reportsService.getDashboard().then(data => {
        console.log('Dashboard API response:', data);
        return data;
      }).catch(error => {
        console.log('Dashboard API error:', error);
        throw error;
      });
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  console.log('=== useReportsDashboard RESULT ===');
  console.log('result:', result);
  console.log('===============================');
  
  return result;
};

export const useReportsSummary = () => {
  const result = useCachedApi(
    'reports-summary',
    () => {
      console.log('=== useReportsSummary API CALL ===');
      return reportsService.getSummary().then(data => {
        console.log('Summary API response:', data);
        return data;
      }).catch(error => {
        console.log('Summary API error:', error);
        throw error;
      });
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes
    }
  );
  
  console.log('=== useReportsSummary RESULT ===');
  console.log('result:', result);
  console.log('=============================');
  
  return result;
};

export const useWorkOrderAnalytics = (filters?: {
  start_date?: string;
  end_date?: string;
  user_id?: string;
}) => {
  const cacheKey = `work-order-analytics-${JSON.stringify(filters || {})}`;
  
  return useCachedApi(
    cacheKey,
    () => reportsService.getWorkOrderAnalytics(filters),
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useProjectAnalytics = (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const cacheKey = `project-analytics-${JSON.stringify(filters || {})}`;
  
  return useCachedApi(
    cacheKey,
    () => reportsService.getProjectAnalytics(filters),
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useFinancialAnalytics = (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const cacheKey = `financial-analytics-${JSON.stringify(filters || {})}`;
  
  return useCachedApi(
    cacheKey,
    () => reportsService.getFinancialAnalytics(filters),
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useReportsExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReports = async (
    reportType: string,
    format: string = 'json',
    filters?: {
      start_date?: string;
      end_date?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsService.exportReports(reportType, format, filters);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to export reports');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    exportReports,
    loading,
    error,
  };
};
