import { useState, useEffect } from 'react';
import { apiService } from '@/services/ApiService';

export interface PlanInfo {
  planType: string;
  planName: string;
  features: string[];
  maxProjects: number;
  maxUsers: number;
  subscriptionStatus: string;
}

export function usePlanInfo() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCurrentSubscription();
      
      if (response.success && response.subscription) {
        const subscription = response.subscription;
        const plan = subscription.plan;

        setPlanInfo({
          planType: plan.planType || 'workshop',
          planName: plan.name || 'Unknown Plan',
          features: plan.features || [],
          maxProjects: plan.maxProjects || 0,
          maxUsers: plan.maxUsers || 0,
          subscriptionStatus: subscription.status || 'unknown',
        });
      } else {
        setPlanInfo({
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
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load plan info');
      setPlanInfo({
        planType: 'workshop',
        planName: 'Workshop Master',
        features: [],
        maxProjects: 100,
        maxUsers: 50,
        subscriptionStatus: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanInfo();
  }, []);

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo: fetchPlanInfo,
  };
}

