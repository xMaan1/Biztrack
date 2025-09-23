import { useState, useEffect } from "react";
import { apiService } from "../services/ApiService";

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

  useEffect(() => {
    fetchPlanInfo();
  }, []);

  const fetchPlanInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current tenant's subscription info
      const response = await apiService.get("/tenants/current/subscription");

      if (response.success && response.subscription) {
        const subscription = response.subscription;
        const plan = subscription.plan;

        setPlanInfo({
          planType: plan.planType || "unknown",
          planName: plan.name || "Unknown Plan",
          features: plan.features || [],
          maxProjects: plan.maxProjects || 0,
          maxUsers: plan.maxUsers || 0,
          subscriptionStatus: subscription.status || "unknown",
        });
      } else {
        // Fallback: try to get from tenant context or default to workshop
        setPlanInfo({
          planType: "workshop", // Default to workshop for now
          planName: "Workshop Master",
          features: [
            "Project Management",
            "Production Planning",
            "Work Order Management",
          ],
          maxProjects: 100,
          maxUsers: 50,
          subscriptionStatus: "active",
        });
      }
    } catch (err) {
      setError("Failed to fetch plan information");

      // Fallback to workshop plan
      setPlanInfo({
        planType: "workshop",
        planName: "Workshop Master",
        features: [
          "Project Management",
          "Production Planning",
          "Work Order Management",
        ],
        maxProjects: 100,
        maxUsers: 50,
        subscriptionStatus: "active",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPlanInfo = () => {
    fetchPlanInfo();
  };

  return {
    planInfo,
    loading,
    error,
    refreshPlanInfo,
  };
}
