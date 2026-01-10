import { apiService } from './ApiService';
import {
  Lead,
  LeadCreate,
  LeadUpdate,
  CRMLeadsResponse,
  CRMLeadFilters,
  Contact,
  ContactCreate,
  ContactUpdate,
  CRMContactsResponse,
  CRMContactFilters,
  Company,
  CompanyCreate,
  CompanyUpdate,
  CRMCompaniesResponse,
  CRMCompanyFilters,
  Opportunity,
  OpportunityCreate,
  OpportunityUpdate,
  CRMOpportunitiesResponse,
  CRMOpportunityFilters,
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomersResponse,
  CustomerStats,
} from '../models/crm';

class CRMService {
  private baseUrl = '/crm';

  async getLeads(
    filters?: CRMLeadFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMLeadsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.assignedTo) params.append('assigned_to', filters.assignedTo);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/leads?${params.toString()}`);
  }

  async getLead(id: string): Promise<Lead> {
    return apiService.get(`${this.baseUrl}/leads/${id}`);
  }

  async createLead(lead: LeadCreate): Promise<Lead> {
    return apiService.post(`${this.baseUrl}/leads`, lead);
  }

  async updateLead(id: string, lead: LeadUpdate): Promise<Lead> {
    return apiService.put(`${this.baseUrl}/leads/${id}`, lead);
  }

  async deleteLead(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/leads/${id}`);
  }

  async convertLeadToContact(
    leadId: string,
    contactData: ContactCreate,
  ): Promise<{ message: string; contact: Contact }> {
    return apiService.post(`${this.baseUrl}/leads/${leadId}/convert`, contactData);
  }

  async getContacts(
    filters?: CRMContactFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMContactsResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.companyId) params.append('company_id', filters.companyId);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/contacts?${params.toString()}`);
  }

  async getContact(id: string): Promise<Contact> {
    return apiService.get(`${this.baseUrl}/contacts/${id}`);
  }

  async createContact(contact: ContactCreate): Promise<Contact> {
    return apiService.post(`${this.baseUrl}/contacts`, contact);
  }

  async updateContact(id: string, contact: ContactUpdate): Promise<Contact> {
    return apiService.put(`${this.baseUrl}/contacts/${id}`, contact);
  }

  async deleteContact(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/contacts/${id}`);
  }

  async getCompanies(
    filters?: CRMCompanyFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMCompaniesResponse> {
    const params = new URLSearchParams();
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.size) params.append('size', filters.size);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/companies?${params.toString()}`);
  }

  async getCompany(id: string): Promise<Company> {
    return apiService.get(`${this.baseUrl}/companies/${id}`);
  }

  async createCompany(company: CompanyCreate): Promise<Company> {
    return apiService.post(`${this.baseUrl}/companies`, company);
  }

  async updateCompany(id: string, company: CompanyUpdate): Promise<Company> {
    return apiService.put(`${this.baseUrl}/companies/${id}`, company);
  }

  async deleteCompany(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/companies/${id}`);
  }

  async getOpportunities(
    filters?: CRMOpportunityFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<CRMOpportunitiesResponse> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.assignedTo) params.append('assigned_to', filters.assignedTo);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/opportunities?${params.toString()}`);
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    return apiService.get(`${this.baseUrl}/opportunities/${id}`);
  }

  async createOpportunity(
    opportunity: OpportunityCreate,
  ): Promise<Opportunity> {
    return apiService.post(`${this.baseUrl}/opportunities`, opportunity);
  }

  async updateOpportunity(
    id: string,
    opportunity: OpportunityUpdate,
  ): Promise<Opportunity> {
    return apiService.put(`${this.baseUrl}/opportunities/${id}`, opportunity);
  }

  async deleteOpportunity(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/opportunities/${id}`);
  }

  async getCustomers(
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

    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (customerType) params.append('customer_type', customerType);

    const response = await apiService.get(
      `${this.baseUrl}/customers?${params.toString()}`,
    );
    return response;
  }

  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiService.get(`${this.baseUrl}/customers/${id}`);
    return response;
  }

  async createCustomer(customerData: CustomerCreate): Promise<Customer> {
    const response = await apiService.post(`${this.baseUrl}/customers`, customerData);
    return response;
  }

  async updateCustomer(
    id: string,
    customerData: CustomerUpdate,
  ): Promise<Customer> {
    const response = await apiService.put(`${this.baseUrl}/customers/${id}`, customerData);
    return response;
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/customers/${id}`);
    return response;
  }

  async getCustomerStats(): Promise<CustomerStats> {
    const response = await apiService.get(`${this.baseUrl}/customers/stats`);
    return response;
  }

  async searchCustomers(
    query: string,
    limit: number = 20,
  ): Promise<Customer[]> {
    const response = await apiService.get(
      `${this.baseUrl}/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return response;
  }
}

export default new CRMService();
