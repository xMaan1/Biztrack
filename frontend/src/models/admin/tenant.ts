export interface Tenant {
  id: string;
  name: string;
  domain: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: any;
  userCount: number;
  subscription?: TenantSubscription;
}

export interface TenantSubscription {
  id: string;
  isActive: boolean;
  status: string;
  startDate: string;
  endDate: string;
  plan: TenantPlan;
}

export interface TenantPlan {
  id: string;
  name: string;
  description: string;
  planType: string;
  price: number;
  billingCycle: string;
  features: string[];
}

export interface AdminStats {
  tenants: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    superAdmins: number;
    tenantAssigned: number;
    systemUsers: number;
  };
  subscriptions: {
    total: number;
    active: number;
    inactive: number;
  };
  planDistribution: Array<{
    planName: string;
    planType: string;
    count: number;
  }>;
}

export interface TenantCreate {
  name: string;
  domain: string;
  description: string;
  settings?: any;
}

export interface TenantUpdate {
  name?: string;
  domain?: string;
  description?: string;
  isActive?: boolean;
  settings?: any;
}
