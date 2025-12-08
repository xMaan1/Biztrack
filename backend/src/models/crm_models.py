from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from .common import (
    LeadStatus,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    QuoteStatus,
    ContractStatus,
    Industry,
    Pagination
)

class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: LeadSource = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: int = 0
    budget: Optional[float] = None
    timeline: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: Optional[int] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None

class Lead(LeadBase):
    id: str
    tenant_id: str
    createdBy: str
    assignedToUser: Optional[Dict[str, str]] = None
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    mobile: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    contactType: ContactType = ContactType.CUSTOMER
    isPrimary: bool = False
    notes: Optional[str] = None
    tags: List[str] = []
    isActive: bool = True

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    contactType: Optional[ContactType] = None
    isPrimary: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isActive: Optional[bool] = None

class Contact(ContactBase):
    id: str
    tenant_id: str
    createdBy: str
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    isActive: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isActive: Optional[bool] = None

class Company(CompanyBase):
    id: str
    tenant_id: str
    createdBy: str
    annualRevenue: Optional[float] = None
    employeeCount: Optional[int] = None
    foundedYear: Optional[int] = None
    contacts: List[Contact] = []
    opportunities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

Company.model_rebuild()

class OpportunityBase(BaseModel):
    title: str
    description: Optional[str] = None
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: Optional[float] = None
    probability: int = 50
    expectedCloseDate: Optional[str] = None
    leadSource: LeadSource = LeadSource.WEBSITE
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[OpportunityStage] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expectedCloseDate: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class Opportunity(OpportunityBase):
    id: str
    tenant_id: str
    createdBy: str
    assignedToUser: Optional[Dict[str, str]] = None
    closedDate: Optional[datetime] = None
    wonAmount: Optional[float] = None
    lostReason: Optional[str] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unitPrice: float
    discount: float = 0.0
    total: float

class QuoteBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    validUntil: str
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: List[QuoteItem] = []
    subtotal: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float = 0.0

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    validUntil: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    subtotal: Optional[float] = None
    taxRate: Optional[float] = None
    taxAmount: Optional[float] = None
    total: Optional[float] = None

class Quote(QuoteBase):
    id: str
    quoteNumber: str
    status: QuoteStatus = QuoteStatus.DRAFT
    tenant_id: str
    createdBy: str
    sentAt: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
    acceptedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ContractBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    startDate: str
    endDate: str
    value: float
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: bool = False
    renewalTerms: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    value: Optional[float] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: Optional[bool] = None
    renewalTerms: Optional[str] = None

class Contract(ContractBase):
    id: str
    contractNumber: str
    status: ContractStatus = ContractStatus.DRAFT
    tenant_id: str
    createdBy: str
    signedAt: Optional[datetime] = None
    activatedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SalesActivityBase(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None

class SalesActivityCreate(SalesActivityBase):
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None

class SalesActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class SalesActivity(SalesActivityBase):
    id: str
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    tenant_id: str
    createdBy: str
    assignedTo: Optional[str] = None
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class LeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination

class ContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: Pagination

class CompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: Pagination

class OpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: Pagination

class QuotesResponse(BaseModel):
    quotes: List[Quote]
    pagination: Pagination

class ContractsResponse(BaseModel):
    contracts: List[Contract]
    pagination: Pagination

class SalesActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: Pagination

class SalesMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class SalesPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class SalesDashboard(BaseModel):
    metrics: SalesMetrics
    pipeline: List[SalesPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Opportunity]

class CRMLeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination

class CRMContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: Pagination

class CRMCompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: Pagination

class CRMOpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: Pagination

class CRMActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: Pagination

class CRMMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalContacts: int
    totalCompanies: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class CRMPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class CRMDashboard(BaseModel):
    metrics: CRMMetrics
    pipeline: List[CRMPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Opportunity]
    recentLeads: List[Lead]

