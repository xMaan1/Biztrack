from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    RESIGNED = "resigned"
    RETIRED = "retired"
    PROBATION = "probation"

class EmployeeType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACTOR = "contractor"
    INTERN = "intern"
    FREELANCER = "freelancer"

class Department(str, Enum):
    ENGINEERING = "engineering"
    SALES = "sales"
    MARKETING = "marketing"
    HR = "hr"
    FINANCE = "finance"
    OPERATIONS = "operations"
    CUSTOMER_SUPPORT = "customer_support"
    LEGAL = "legal"
    IT = "it"
    GENERAL = "general"
    OTHER = "other"

class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ON_HOLD = "on_hold"

class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    TECHNICAL_TEST = "technical_test"
    REFERENCE_CHECK = "reference_check"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class ReviewType(str, Enum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"
    PROJECT_BASED = "project_based"
    PROBATION = "probation"

class ReviewStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"

class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    UNPAID = "unpaid"
    OTHER = "other"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class PayrollStatus(str, Enum):
    DRAFT = "draft"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"

class TrainingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"

class TrainingType(str, Enum):
    ONBOARDING = "onboarding"
    SKILL_DEVELOPMENT = "skill_development"
    COMPLIANCE = "compliance"
    LEADERSHIP = "leadership"
    TECHNICAL = "technical"
    SOFT_SKILLS = "soft_skills"
    CERTIFICATION = "certification"

class EmployeeBase(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    hireDate: str
    employeeId: str
    department: Department
    position: str
    employeeType: EmployeeType
    employmentStatus: EmploymentStatus
    managerId: Optional[str] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    attachments: List[str] = []

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    hireDate: Optional[str] = None
    employeeId: Optional[str] = None
    department: Optional[Department] = None
    position: Optional[str] = None
    employeeType: Optional[EmployeeType] = None
    employmentStatus: Optional[EmploymentStatus] = None
    managerId: Optional[str] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    attachments: Optional[List[str]] = None

class Employee(EmployeeBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class JobPostingBase(BaseModel):
    title: str
    department: Department
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    location: str
    type: EmployeeType
    salaryRange: Optional[str] = None
    benefits: List[str] = []
    status: JobStatus
    openDate: str
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: List[str] = []

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[Department] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    location: Optional[str] = None
    type: Optional[EmployeeType] = None
    salaryRange: Optional[str] = None
    benefits: Optional[List[str]] = None
    status: Optional[JobStatus] = None
    openDate: Optional[str] = None
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: Optional[List[str]] = None

class JobPosting(JobPostingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class ApplicationBase(BaseModel):
    jobPostingId: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    resume: Optional[str] = None
    coverLetter: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: List[str] = []
    status: ApplicationStatus
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    interviewDate: Optional[str] = None
    interviewNotes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    resume: Optional[str] = None
    coverLetter: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[ApplicationStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    interviewDate: Optional[str] = None
    interviewNotes: Optional[str] = None

class Application(ApplicationBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class PerformanceReviewBase(BaseModel):
    employeeId: str
    reviewerId: str
    reviewType: ReviewType
    reviewPeriod: str
    reviewDate: str
    status: ReviewStatus
    goals: List[str] = []
    achievements: List[str] = []
    areasOfImprovement: List[str] = []
    overallRating: Optional[int] = None
    technicalRating: Optional[int] = None
    communicationRating: Optional[int] = None
    teamworkRating: Optional[int] = None
    leadershipRating: Optional[int] = None
    comments: Optional[str] = None
    nextReviewDate: Optional[str] = None

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewUpdate(BaseModel):
    reviewerId: Optional[str] = None
    reviewType: Optional[ReviewType] = None
    reviewPeriod: Optional[str] = None
    reviewDate: Optional[str] = None
    status: Optional[ReviewStatus] = None
    goals: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    areasOfImprovement: Optional[List[str]] = None
    overallRating: Optional[int] = None
    technicalRating: Optional[int] = None
    communicationRating: Optional[int] = None
    teamworkRating: Optional[int] = None
    leadershipRating: Optional[int] = None
    comments: Optional[str] = None
    nextReviewDate: Optional[str] = None

class PerformanceReview(PerformanceReviewBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TimeEntryBase(BaseModel):
    employeeId: str
    date: str
    clockIn: str
    clockOut: Optional[str] = None
    totalHours: Optional[float] = None
    overtimeHours: Optional[float] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryUpdate(BaseModel):
    clockIn: Optional[str] = None
    clockOut: Optional[str] = None
    totalHours: Optional[float] = None
    overtimeHours: Optional[float] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class TimeEntry(TimeEntryBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class LeaveRequestBase(BaseModel):
    employeeId: str
    leaveType: LeaveType
    startDate: str
    endDate: str
    totalDays: float
    reason: str
    status: LeaveStatus
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    rejectionReason: Optional[str] = None
    notes: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    leaveType: Optional[LeaveType] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    totalDays: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[LeaveStatus] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    rejectionReason: Optional[str] = None
    notes: Optional[str] = None

class LeaveRequest(LeaveRequestBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class PayrollBase(BaseModel):
    employeeId: str
    payPeriod: str
    startDate: str
    endDate: str
    basicSalary: float
    allowances: float = 0
    deductions: float = 0
    overtimePay: float = 0
    bonus: float = 0
    netPay: float
    status: PayrollStatus
    paymentDate: Optional[str] = None
    notes: Optional[str] = None

class PayrollCreate(PayrollBase):
    pass

class PayrollUpdate(BaseModel):
    payPeriod: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    basicSalary: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    overtimePay: Optional[float] = None
    bonus: Optional[float] = None
    netPay: Optional[float] = None
    status: Optional[PayrollStatus] = None
    paymentDate: Optional[str] = None
    notes: Optional[str] = None

class Payroll(PayrollBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class BenefitsBase(BaseModel):
    employeeId: str
    benefitType: str
    provider: str
    policyNumber: Optional[str] = None
    startDate: str
    endDate: Optional[str] = None
    monthlyCost: float
    employeeContribution: float
    employerContribution: float
    status: str = "active"
    notes: Optional[str] = None

class BenefitsCreate(BenefitsBase):
    pass

class BenefitsUpdate(BaseModel):
    benefitType: Optional[str] = None
    provider: Optional[str] = None
    policyNumber: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    monthlyCost: Optional[float] = None
    employeeContribution: Optional[float] = None
    employerContribution: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Benefits(BenefitsBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TrainingBase(BaseModel):
    title: str
    description: str
    trainingType: TrainingType
    duration: str
    cost: float
    provider: str
    startDate: str
    endDate: str
    maxParticipants: Optional[int] = None
    status: TrainingStatus
    materials: List[str] = []
    objectives: List[str] = []
    prerequisites: List[str] = []

class TrainingCreate(TrainingBase):
    pass

class TrainingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    trainingType: Optional[TrainingType] = None
    duration: Optional[str] = None
    cost: Optional[float] = None
    provider: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    maxParticipants: Optional[int] = None
    status: Optional[TrainingStatus] = None
    materials: Optional[List[str]] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None

class Training(TrainingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TrainingEnrollmentBase(BaseModel):
    trainingId: str
    employeeId: str
    enrollmentDate: str
    completionDate: Optional[str] = None
    status: TrainingStatus
    score: Optional[int] = None
    certificate: Optional[str] = None
    feedback: Optional[str] = None

class TrainingEnrollmentCreate(TrainingEnrollmentBase):
    pass

class TrainingEnrollmentUpdate(BaseModel):
    completionDate: Optional[str] = None
    status: Optional[TrainingStatus] = None
    score: Optional[int] = None
    certificate: Optional[str] = None
    feedback: Optional[str] = None

class TrainingEnrollment(TrainingEnrollmentBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class HRMEmployeesResponse(BaseModel):
    employees: List[Employee]
    pagination: Pagination

class HRMJobPostingsResponse(BaseModel):
    jobPostings: List[JobPosting]
    pagination: Pagination

class HRMApplicationsResponse(BaseModel):
    applications: List[Application]
    pagination: Pagination

class HRMReviewsResponse(BaseModel):
    reviews: List[PerformanceReview]
    pagination: Pagination

class HRMTimeEntriesResponse(BaseModel):
    timeEntries: List[TimeEntry]
    pagination: Pagination

class HRMLeaveRequestsResponse(BaseModel):
    leaveRequests: List[LeaveRequest]
    pagination: Pagination

class HRMPayrollResponse(BaseModel):
    payroll: List[Payroll]
    pagination: Pagination

class HRMBenefitsResponse(BaseModel):
    benefits: List[Benefits]
    pagination: Pagination

class HRMTrainingResponse(BaseModel):
    training: List[Training]
    pagination: Pagination

class HRMEnrollmentsResponse(BaseModel):
    enrollments: List[TrainingEnrollment]
    pagination: Pagination

class HRMMetrics(BaseModel):
    totalEmployees: int
    activeEmployees: int
    newHires: int
    turnoverRate: float
    averageSalary: float
    openPositions: int
    pendingApplications: int
    upcomingReviews: int
    pendingLeaveRequests: int
    trainingCompletionRate: float

class HRMDashboard(BaseModel):
    metrics: HRMMetrics
    recentHires: List[Employee]
    upcomingReviews: List[PerformanceReview]
    pendingLeaveRequests: List[LeaveRequest]
    openJobPostings: List[JobPosting]
    recentApplications: List[Application]
    departmentDistribution: Dict[str, int]
    trainingPrograms: List[Training]

class HRMEmployeeFilters(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    employeeType: Optional[str] = None
    search: Optional[str] = None

class HRMJobFilters(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    search: Optional[str] = None

class HRMApplicationFilters(BaseModel):
    status: Optional[str] = None
    jobPostingId: Optional[str] = None
    assignedTo: Optional[str] = None
    search: Optional[str] = None

class HRMReviewFilters(BaseModel):
    employeeId: Optional[str] = None
    reviewType: Optional[str] = None
    status: Optional[str] = None
    reviewPeriod: Optional[str] = None

class HRMTimeFilters(BaseModel):
    employeeId: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    projectId: Optional[str] = None

class HRMLeaveFilters(BaseModel):
    employeeId: Optional[str] = None
    leaveType: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class HRMPayrollFilters(BaseModel):
    employeeId: Optional[str] = None
    payPeriod: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class HRMTrainingFilters(BaseModel):
    trainingType: Optional[str] = None
    status: Optional[str] = None
    provider: Optional[str] = None
    search: Optional[str] = None

class SupplierBase(BaseModel):
    name: str
    code: str
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    website: Optional[str] = None
    paymentTerms: Optional[str] = None
    creditLimit: Optional[float] = None
    isActive: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    website: Optional[str] = None
    paymentTerms: Optional[str] = None
    creditLimit: Optional[float] = None
    isActive: Optional[bool] = None

class Supplier(SupplierBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SupplierResponse(BaseModel):
    supplier: Supplier

class SuppliersResponse(BaseModel):
    suppliers: List[Supplier]
    total: int

