import { useCachedApi } from './useCachedApi';
import { apiService } from '../services/ApiService';

export interface PlanInfo {
  planType: string;
  planName: string;
  features: string[];
  maxProjects: number;
  maxUsers: number;
  subscriptionStatus: string;
}

export function usePlanInfo() {
  const { data: subscriptionData, loading, error, refetch } = useCachedApi(
    'plan_info',
    async () => {
      const response = await apiService.get('/tenants/current/subscription');
      return response;
    },
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const planInfo: PlanInfo | null = subscriptionData ? (() => {
    if (subscriptionData.success && subscriptionData.subscription) {
      const subscription = subscriptionData.subscription;
      const plan = subscription.plan;

      return {
        planType: plan.planType || 'unknown',
        planName: plan.name || 'Unknown Plan',
        features: plan.features || [],
        maxProjects: plan.maxProjects || 0,
        maxUsers: plan.maxUsers || 0,
        subscriptionStatus: subscription.status || 'unknown',
      };
    } else {
      return {
        planType: 'workshop',
        planName: 'Workshop Master',
        features: [
          'Project Management',
          'Production Planning',
          'Work Order Management',
        ],
        maxProjects: 100,
        maxUsers: 50,
        subscriptionStatus: 'active',
      };
    }
  })() : null;

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo: refetch,
  };
}
