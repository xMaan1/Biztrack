import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/ApiService';
import { useAuth } from './AuthContext';

export type PlanType = 'commerce' | 'healthcare' | 'workshop';

interface Subscription {
  id: string;
  plan: {
    id: string;
    name: string;
    planType: PlanType;
    features: string[];
  };
  status: string;
  startDate: string;
  endDate?: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  planType: PlanType | null;
  accessibleModules: string[];
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentTenant } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [accessibleModules, setAccessibleModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated || !currentTenant) {
      setSubscription(null);
      setPlanType(null);
      setAccessibleModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.get<any>('/tenants/current/subscription');
      
      if (response && response.success && response.subscription) {
        const sub = response.subscription;
        setSubscription(sub);
        
        const planTypeFromBackend = sub.plan?.planType;
        if (planTypeFromBackend && ['commerce', 'healthcare', 'workshop'].includes(planTypeFromBackend)) {
          setPlanType(planTypeFromBackend);
        } else {
          setPlanType('commerce');
        }

        const modules = sub.plan?.features || [];
        const moduleNames = modules.map((m: any) => 
          typeof m === 'string' ? m : m.name || m
        ).filter(Boolean);
        setAccessibleModules(moduleNames.length > 0 ? moduleNames : [planTypeFromBackend || 'commerce']);
      } else {
        setSubscription(null);
        setPlanType('commerce');
        setAccessibleModules(['commerce']);
      }
    } catch (error) {
      setSubscription(null);
      setPlanType('commerce');
      setAccessibleModules(['commerce']);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentTenant]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const value: SubscriptionContextType = {
    subscription,
    planType,
    accessibleModules,
    loading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
