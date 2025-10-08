import { User } from '../auth/User';

export interface TenantUser extends User {
  tenantUserActive: boolean;
  lastLogin: string | null;
}

export interface TenantCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  createdAt: string;
}

export interface TenantProject {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
}

export interface TenantStatistics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalCustomers: number;
  totalInvoices: number;
  totalInvoiceValue: number;
  lastActivity: string;
}

export interface TenantDetails {
  tenant: {
    id: string;
    name: string;
    domain: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    settings: any;
  };
  subscription?: {
    id: string;
    isActive: boolean;
    status: string;
    startDate: string;
    endDate: string;
    plan: {
      id: string;
      name: string;
      description: string;
      planType: string;
      price: number;
      billingCycle: string;
      maxProjects: number;
      maxUsers: number;
      features: string[];
      modules: string[];
    };
  };
  users: TenantUser[];
  invoices: TenantInvoice[];
  projects: TenantProject[];
  customers: TenantCustomer[];
  statistics: TenantStatistics;
}
