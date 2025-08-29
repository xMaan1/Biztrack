import { ApiService } from "./ApiService";
import {
  Lead,
  LeadCreate,
  LeadUpdate,
  CRMLeadsResponse,
  Contact,
  ContactCreate,
  ContactUpdate,
  CRMContactsResponse,
  Company,
  CompanyCreate,
  CompanyUpdate,
  CRMCompaniesResponse,
  Opportunity,
  OpportunityCreate,
  OpportunityUpdate,
  CRMOpportunitiesResponse,
  SalesActivity,
  SalesActivityCreate,
  SalesActivityUpdate,
  CRMActivitiesResponse,
  CRMDashboard,
  CRMLeadFilters,
  CRMContactFilters,
  CRMCompanyFilters,
  CRMOpportunityFilters,
  CRMActivityFilters,
} from "../models/crm";

// Customer Types
export interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  cnic?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: "individual" | "business";
  customerStatus: "active" | "inactive" | "blocked";
  creditLimit: number;
  currentBalance: number;
  paymentTerms: "immediate" | "net30" | "net60";
  assignedToId?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  cnic?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: "individual" | "business";
  customerStatus?: "active" | "inactive" | "blocked";
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: "immediate" | "net30" | "net60";
  assignedToId?: string;
  notes?: string;
  tags?: string[];
}

export interface CustomerUpdate extends Partial<CustomerCreate> {}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  blocked_customers: number;
  individual_customers: number;
  business_customers: number;
  recent_customers: number;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
}

// Customer Service
export class CustomerService {
  static async getCustomers(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string,
    customerType?: string,
  ): Promise<CustomersResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (customerType) params.append("customer_type", customerType);

    const response = await ApiService.get(
      `/crm/customers?${params.toString()}`,
    );
    return response;
  }

  static async getCustomerById(id: string): Promise<Customer> {
    const response = await ApiService.get(`/crm/customers/${id}`);
    return response;
  }

  static async createCustomer(customerData: CustomerCreate): Promise<Customer> {
    const response = await ApiService.post("/crm/customers", customerData);
    return response;
  }

  static async updateCustomer(
    id: string,
    customerData: CustomerUpdate,
  ): Promise<Customer> {
    const response = await ApiService.put(`/crm/customers/${id}`, customerData);
    return response;
  }

  static async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await ApiService.delete(`/crm/customers/${id}`);
    return response;
  }

  static async getCustomerStats(): Promise<CustomerStats> {
    const response = await ApiService.get("/crm/customers/stats");
    return response;
  }

  static async searchCustomers(
    query: string,
    limit: number = 20,
  ): Promise<Customer[]> {
    const response = await ApiService.get(
      `/crm/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return response;
  }
}

// Existing Lead Types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  priority: "low" | "medium" | "high" | "urgent";
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class CRMService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // Lead Management
  async getLeads(
    filters?: CRMLeadFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMLeadsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.source) params.append("source", filters.source);
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/leads?${params.toString()}`);
  }

  async getLead(id: string): Promise<Lead> {
    return this.apiService.get(`/crm/leads/${id}`);
  }

  async createLead(lead: LeadCreate): Promise<Lead> {
    return this.apiService.post("/crm/leads", lead);
  }

  async updateLead(id: string, lead: LeadUpdate): Promise<Lead> {
    return this.apiService.put(`/crm/leads/${id}`, lead);
  }

  async deleteLead(id: string): Promise<void> {
    return this.apiService.delete(`/crm/leads/${id}`);
  }

  async convertLeadToContact(
    leadId: string,
    contactData: ContactCreate,
  ): Promise<{ message: string; contact: Contact }> {
    return this.apiService.post(`/crm/leads/${leadId}/convert`, contactData);
  }

  // Contact Management
  async getContacts(
    filters?: CRMContactFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMContactsResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.companyId) params.append("company_id", filters.companyId);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/contacts?${params.toString()}`);
  }

  async getContact(id: string): Promise<Contact> {
    return this.apiService.get(`/crm/contacts/${id}`);
  }

  async createContact(contact: ContactCreate): Promise<Contact> {
    return this.apiService.post("/crm/contacts", contact);
  }

  async updateContact(id: string, contact: ContactUpdate): Promise<Contact> {
    return this.apiService.put(`/crm/contacts/${id}`, contact);
  }

  async deleteContact(id: string): Promise<void> {
    return this.apiService.delete(`/crm/contacts/${id}`);
  }

  // Company Management
  async getCompanies(
    filters?: CRMCompanyFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMCompaniesResponse> {
    const params = new URLSearchParams();
    if (filters?.industry) params.append("industry", filters.industry);
    if (filters?.size) params.append("size", filters.size);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/companies?${params.toString()}`);
  }

  async getCompany(id: string): Promise<Company> {
    return this.apiService.get(`/crm/companies/${id}`);
  }

  async createCompany(company: CompanyCreate): Promise<Company> {
    return this.apiService.post("/crm/companies", company);
  }

  async updateCompany(id: string, company: CompanyUpdate): Promise<Company> {
    return this.apiService.put(`/crm/companies/${id}`, company);
  }

  async deleteCompany(id: string): Promise<void> {
    return this.apiService.delete(`/crm/companies/${id}`);
  }

  // Opportunity Management
  async getOpportunities(
    filters?: CRMOpportunityFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMOpportunitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append("stage", filters.stage);
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/opportunities?${params.toString()}`);
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    return this.apiService.get(`/crm/opportunities/${id}`);
  }

  async createOpportunity(
    opportunity: OpportunityCreate,
  ): Promise<Opportunity> {
    return this.apiService.post("/crm/opportunities", opportunity);
  }

  async updateOpportunity(
    id: string,
    opportunity: OpportunityUpdate,
  ): Promise<Opportunity> {
    return this.apiService.put(`/crm/opportunities/${id}`, opportunity);
  }

  async deleteOpportunity(id: string): Promise<void> {
    return this.apiService.delete(`/crm/opportunities/${id}`);
  }

  // Sales Activity Management
  async getActivities(
    filters?: CRMActivityFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMActivitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.completed !== undefined)
      params.append("completed", filters.completed.toString());
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/crm/activities?${params.toString()}`);
  }

  async getActivity(id: string): Promise<SalesActivity> {
    return this.apiService.get(`/crm/activities/${id}`);
  }

  async createActivity(activity: SalesActivityCreate): Promise<SalesActivity> {
    return this.apiService.post("/crm/activities", activity);
  }

  async updateActivity(
    id: string,
    activity: SalesActivityUpdate,
  ): Promise<SalesActivity> {
    return this.apiService.put(`/crm/activities/${id}`, activity);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.apiService.delete(`/crm/activities/${id}`);
  }

  // Dashboard
  async getDashboard(): Promise<CRMDashboard> {
    return this.apiService.get("/crm/dashboard");
  }

  // Utility Methods
  getLeadStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal_sent: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  }

  getOpportunityStageColor(stage: string): string {
    const stageColors: { [key: string]: string } = {
      prospecting: "bg-blue-100 text-blue-800",
      qualification: "bg-yellow-100 text-yellow-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-800";
  }

  getActivityTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      call: "bg-blue-100 text-blue-800",
      email: "bg-green-100 text-green-800",
      meeting: "bg-purple-100 text-purple-800",
      task: "bg-yellow-100 text-yellow-800",
      note: "bg-gray-100 text-gray-800",
      proposal: "bg-indigo-100 text-indigo-800",
      contract: "bg-pink-100 text-pink-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default new CRMService();
