export interface Plan {
  id: string;
  name: string;
  description: string;
  planType: string;
  price: number;
  billingCycle: string;
  maxProjects?: number;
  maxUsers?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalSubscriptions: number;
}

export interface PlanCreate {
  name: string;
  description: string;
  planType: string;
  price: number;
  billingCycle: string;
  maxProjects?: number;
  maxUsers?: number;
  features: string[];
  isActive: boolean;
}

export interface PlanUpdate {
  name?: string;
  description?: string;
  planType?: string;
  price?: number;
  billingCycle?: string;
  maxProjects?: number;
  maxUsers?: number;
  features?: string[];
  isActive?: boolean;
}
