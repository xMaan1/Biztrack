export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  COLD_CALL = 'cold_call',
  TRADE_SHOW = 'trade_show',
  PARTNER = 'partner',
  OTHER = 'other',
}

export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum ContactType {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  PARTNER = 'partner',
  VENDOR = 'vendor',
  OTHER = 'other',
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  NOTE = 'note',
  PROPOSAL = 'proposal',
  CONTRACT = 'contract',
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export enum Industry {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  score: number;
  budget?: number;
  timeline?: string;
  convertedToContact?: string;
  convertedToOpportunity?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
}

export interface LeadUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  score?: number;
  budget?: number;
  timeline?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
  type: ContactType;
  notes?: string;
  tags: string[];
  isActive: boolean;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
  type?: ContactType;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface ContactUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
  type?: ContactType;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface Company {
  id: string;
  name: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreate {
  name: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
}

export interface CompanyUpdate {
  name?: string;
  industry?: Industry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
  annualRevenue?: number;
  employeeCount?: number;
  foundedYear?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  stage: OpportunityStage;
  amount?: number;
  probability: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags: string[];
  closedDate?: string;
  wonAmount?: number;
  lostReason?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityCreate {
  title: string;
  description?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
}

export interface OpportunityUpdate {
  title?: string;
  description?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
}

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
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: 'individual' | 'business';
  customerStatus: 'active' | 'inactive' | 'blocked';
  creditLimit: number;
  currentBalance: number;
  paymentTerms: 'Credit' | 'Card' | 'Cash' | 'Due Payments';
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
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: 'individual' | 'business';
  customerStatus?: 'active' | 'inactive' | 'blocked';
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: 'Credit' | 'Card' | 'Cash' | 'Due Payments';
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

export interface CRMLeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMCompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMOpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CRMLeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
}

export interface CRMContactFilters {
  type?: ContactType;
  companyId?: string;
  search?: string;
}

export interface CRMCompanyFilters {
  industry?: Industry;
  size?: CompanySize;
  search?: string;
}

export interface CRMOpportunityFilters {
  stage?: OpportunityStage;
  assignedTo?: string;
  search?: string;
}

export interface CRMMetrics {
  totalLeads: number;
  activeLeads: number;
  totalContacts: number;
  totalRevenue: number;
  projectedRevenue: number;
  conversionRate: number;
}

export interface CRMPipeline {
  stage: string;
  count: number;
  value: number;
  probability: number;
}

export interface CRMDashboard {
  metrics: CRMMetrics;
  pipeline: CRMPipeline[];
  recentActivities: any[];
  topOpportunities: Opportunity[];
  recentLeads: Lead[];
}
