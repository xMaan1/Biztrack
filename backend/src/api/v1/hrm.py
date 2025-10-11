from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid
from datetime import datetime, timedelta

from ...models.unified_models import (
    User, Employee, EmployeeCreate, EmployeeUpdate, HRMEmployeesResponse,
    JobPosting, JobPostingCreate, JobPostingUpdate, HRMJobPostingsResponse,
    Application, ApplicationCreate, ApplicationUpdate, HRMApplicationsResponse,
    PerformanceReview, PerformanceReviewCreate, PerformanceReviewUpdate, HRMReviewsResponse,
    TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse,
    LeaveRequest, LeaveRequestCreate, LeaveRequestUpdate, HRMLeaveRequestsResponse,
    Payroll, PayrollCreate, PayrollUpdate, HRMPayrollResponse,
    Benefits, BenefitsCreate, BenefitsUpdate, HRMBenefitsResponse,
    Training, TrainingCreate, TrainingUpdate, HRMTrainingResponse,
    TrainingEnrollment, TrainingEnrollmentCreate, TrainingEnrollmentUpdate, HRMEnrollmentsResponse,
    HRMDashboard, HRMEmployeeFilters, HRMJobFilters, HRMApplicationFilters, HRMReviewFilters,
    HRMTimeFilters, HRMLeaveFilters, HRMPayrollFilters, HRMTrainingFilters,
    Department, EmploymentStatus, EmployeeType, JobStatus, ApplicationStatus,
    Supplier, SupplierCreate, SupplierUpdate, SupplierResponse, SuppliersResponse
)
from ...config.hrm_models import Employee as DBEmployee
from ...config.database import (
    get_db, get_user_by_id,
    get_employees, get_employee_by_id, create_employee, update_employee, delete_employee,
    get_job_postings, get_job_posting_by_id, create_job_posting, update_job_posting, delete_job_posting,
    get_applications, get_application_by_id, create_application, update_application, delete_application,
    get_performance_reviews, get_performance_review_by_id, create_performance_review, update_performance_review, delete_performance_review,
    get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry,
    get_leave_requests, get_leave_request_by_id, create_leave_request, update_leave_request, delete_leave_request,
    get_payroll, get_payroll_by_id, create_payroll, update_payroll, delete_payroll,
    get_benefits, get_benefit_by_id, create_benefit, update_benefit, delete_benefit,
    get_training, get_training_by_id, create_training, update_training, delete_training,
    get_training_enrollments, get_training_enrollment_by_id, create_training_enrollment, update_training_enrollment, delete_training_enrollment,
    get_hrm_dashboard_data,
    get_suppliers, get_supplier_by_id, get_supplier_by_code, create_supplier, update_supplier, delete_supplier
)
from ...api.dependencies import get_current_user, get_tenant_context, require_tenant_admin_or_super_admin

router = APIRouter(prefix="/hrm", tags=["hrm"])

# Employee endpoints
@router.get("/employees", response_model=HRMEmployeesResponse)
async def get_hrm_employees(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    employee_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all employees with optional filtering"""
    try:
        skip = (page - 1) * limit
        employees = get_employees(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if department or status or employee_type or search:
            filtered_employees = []
            for employee in employees:
                if department and employee.department != department:
                    continue
                if status and employee.employmentStatus != status:
                    continue
                if employee_type and employee.employeeType != employee_type:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (employee.firstName or "").lower(),
                        search_lower in (employee.lastName or "").lower(),
                        search_lower in (employee.email or "").lower(),
                        search_lower in (employee.position or "").lower()
                    ]):
                        continue
                filtered_employees.append(employee)
            employees = filtered_employees
        
        # Get total count for pagination
        total = len(employees)
        
        # Convert database employees to Pydantic models
        employee_models = []
        for db_employee in employees:
            # Get user data for this employee
            user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
            
            employee_models.append(Employee(
                id=str(db_employee.id),
                firstName=user.firstName if user else "",
                lastName=user.lastName if user else "",
                email=user.email if user else "",
                phone=None,  # Not stored in User model
                dateOfBirth=None,  # Not stored in current DB model
                hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
                employeeId=db_employee.employeeId,
                department=Department(db_employee.department) if db_employee.department else Department.OTHER,
                position=db_employee.position,
                employeeType=EmployeeType.FULL_TIME,  # Default since not in DB model
                employmentStatus=EmploymentStatus.ACTIVE,  # Default since not in DB model
                managerId=str(db_employee.managerId) if db_employee.managerId else None,
                salary=db_employee.salary,
                address=None,  # Not stored in current DB model
                emergencyContact=None,  # Not stored in current DB model
                emergencyPhone=None,  # Not stored in current DB model
                skills=[],  # Not stored in current DB model
                certifications=[],  # Not stored in current DB model
                notes=db_employee.notes,
                tenant_id=str(db_employee.tenant_id),
                createdBy="",  # Not stored in current DB model
                createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
                updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else ""
            ))
        
        return HRMEmployeesResponse(
            employees=employee_models,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employees: {str(e)}")

@router.post("/employees", response_model=Employee)
async def create_hrm_employee(
    employee_data: EmployeeCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new employee"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        # Create database employee record
        db_employee = DBEmployee(
            tenant_id=tenant_context["tenant_id"],
            userId=current_user.id,
            employeeId=employee_data.employeeId,
            department=employee_data.department.value,
            position=employee_data.position,
            hireDate=datetime.strptime(employee_data.hireDate, "%Y-%m-%d").date(),
            salary=employee_data.salary,
            managerId=uuid.UUID(employee_data.managerId) if employee_data.managerId else None,
            notes=employee_data.notes
        )
        
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        
        # Convert to response model
        return Employee(
            id=str(db_employee.id),
            firstName=employee_data.firstName,
            lastName=employee_data.lastName,
            email=employee_data.email,
            phone=employee_data.phone,
            dateOfBirth=employee_data.dateOfBirth,
            hireDate=employee_data.hireDate,
            employeeId=employee_data.employeeId,
            department=employee_data.department,
            position=employee_data.position,
            employeeType=employee_data.employeeType,
            employmentStatus=employee_data.employmentStatus,
            managerId=employee_data.managerId,
            salary=employee_data.salary,
            address=employee_data.address,
            emergencyContact=employee_data.emergencyContact,
            emergencyPhone=employee_data.emergencyPhone,
            skills=employee_data.skills,
            certifications=employee_data.certifications,
            notes=employee_data.notes,
            tenant_id=str(db_employee.tenant_id),
            createdBy=str(current_user.id),
            createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else None,
            updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else None
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating employee: {str(e)}")

@router.get("/employees/{employee_id}", response_model=Employee)
async def get_hrm_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get employee by ID"""
    try:
        employee = get_employee_by_id(db, employee_id, tenant_context["tenant_id"] if tenant_context else None)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employee: {str(e)}")

@router.put("/employees/{employee_id}", response_model=Employee)
async def update_hrm_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update employee"""
    try:
        update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
        db_employee = update_employee(employee_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Get user data for this employee
        user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
        
        # Convert to response model
        return Employee(
            id=str(db_employee.id),
            firstName=user.firstName if user else "",
            lastName=user.lastName if user else "",
            email=user.email if user else "",
            phone=None,  # Not stored in User model
            dateOfBirth=None,  # Not stored in current DB model
            hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
            employeeId=db_employee.employeeId,
            department=Department(db_employee.department) if db_employee.department else Department.OTHER,
            position=db_employee.position,
            employeeType=EmployeeType.FULL_TIME,  # Default since not in DB model
            employmentStatus=EmploymentStatus.ACTIVE,  # Default since not in DB model
            managerId=str(db_employee.managerId) if db_employee.managerId else None,
            salary=db_employee.salary,
            address=None,  # Not stored in current DB model
            emergencyContact=None,  # Not stored in current DB model
            emergencyPhone=None,  # Not stored in current DB model
            skills=[],  # Not stored in current DB model
            certifications=[],  # Not stored in current DB model
            notes=db_employee.notes,
            tenant_id=str(db_employee.tenant_id),
            createdBy="",  # Not stored in current DB model
            createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
            updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating employee: {str(e)}")

@router.delete("/employees/{employee_id}")
async def delete_hrm_employee(
    employee_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete employee"""
    try:
        success = delete_employee(employee_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Employee not found")
        return {"message": "Employee deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting employee: {str(e)}")

# Job Posting endpoints
@router.get("/jobs", response_model=HRMJobPostingsResponse)
async def get_hrm_jobs(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all job postings with optional filtering"""
    try:
        skip = (page - 1) * limit
        jobs = get_job_postings(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if department or status or job_type or search:
            filtered_jobs = []
            for job in jobs:
                if department and job.department != department:
                    continue
                if status and job.status != status:
                    continue
                if job_type and job.type != job_type:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (job.title or "").lower(),
                        search_lower in (job.description or "").lower(),
                        search_lower in (job.location or "").lower()
                    ]):
                        continue
                filtered_jobs.append(job)
            jobs = filtered_jobs
        
        # Convert SQLAlchemy models to Pydantic models
        job_postings = []
        for job in jobs:
            job_data = {
                "id": str(job.id),
                "title": job.title,
                "department": Department(job.department) if job.department else None,
                "description": job.description,
                "requirements": job.requirements.split('\n') if job.requirements else [],
                "responsibilities": job.responsibilities or [],
                "location": job.location,
                "type": EmployeeType(job.type) if job.type else None,
                "salaryRange": job.salary,
                "benefits": job.benefits or [],
                "status": JobStatus(job.status) if job.status else None,
                "openDate": job.postedDate.isoformat() if job.postedDate else None,
                "closeDate": job.closingDate.isoformat() if job.closingDate else None,
                "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
                "tags": job.tags or [],
                "tenant_id": str(job.tenant_id),
                "createdBy": str(job.createdBy),
                "createdAt": job.createdAt.isoformat() if job.createdAt else None,
                "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
            }
            job_postings.append(JobPosting(**job_data))
        
        # Get total count for pagination
        total = len(job_postings)
        
        return HRMJobPostingsResponse(
            jobPostings=job_postings,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job postings: {str(e)}")

@router.post("/jobs", response_model=JobPosting)
def create_hrm_job(
    job_data: JobPostingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new job posting"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    tenant_id = tenant_context["tenant_id"]
    
    # Convert Pydantic model to SQLAlchemy model data
    job_dict = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "title": job_data.title,
        "department": job_data.department.value if job_data.department else None,
        "description": job_data.description,
        "requirements": "\n".join(job_data.requirements) if job_data.requirements else None,
        "responsibilities": job_data.responsibilities,
        "salary": job_data.salaryRange,
        "location": job_data.location,
        "type": job_data.type.value if job_data.type else None,
        "status": job_data.status.value if job_data.status else "draft",
        "postedDate": datetime.fromisoformat(job_data.openDate) if job_data.openDate else datetime.utcnow(),
        "closingDate": datetime.fromisoformat(job_data.closeDate) if job_data.closeDate else None,
        "benefits": job_data.benefits,
        "hiringManagerId": job_data.hiringManagerId if job_data.hiringManagerId else None,
        "tags": job_data.tags,
        "createdBy": str(current_user.id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    db_job = create_job_posting(job_dict, db)
    
    # Convert SQLAlchemy model to Pydantic response model
    response_data = {
        "id": str(db_job.id),
        "title": db_job.title,
        "department": Department(db_job.department) if db_job.department else None,
        "description": db_job.description,
        "requirements": db_job.requirements.split('\n') if db_job.requirements else [],
        "responsibilities": db_job.responsibilities or [],
        "location": db_job.location,
        "type": EmployeeType(db_job.type) if db_job.type else None,
        "salaryRange": db_job.salary,
        "benefits": db_job.benefits or [],
        "status": JobStatus(db_job.status) if db_job.status else None,
        "openDate": db_job.postedDate.isoformat() if db_job.postedDate else None,
        "closeDate": db_job.closingDate.isoformat() if db_job.closingDate else None,
        "hiringManagerId": str(db_job.hiringManagerId) if db_job.hiringManagerId else None,
        "tags": db_job.tags or [],
        "tenant_id": str(db_job.tenant_id),
        "createdBy": str(db_job.createdBy),
        "createdAt": db_job.createdAt.isoformat() if db_job.createdAt else None,
        "updatedAt": db_job.updatedAt.isoformat() if db_job.updatedAt else None
    }
    
    return JobPosting(**response_data)

@router.get("/jobs/{job_id}", response_model=JobPosting)
async def get_hrm_job_by_id(
    job_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific job posting by ID"""
    try:
        job = get_job_posting_by_id(db, job_id, tenant_context["tenant_id"] if tenant_context else None)
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert SQLAlchemy model to Pydantic model
        job_data = {
            "id": str(job.id),
            "title": job.title,
            "department": Department(job.department) if job.department else None,
            "description": job.description,
            "requirements": job.requirements.split('\n') if job.requirements else [],
            "responsibilities": job.responsibilities or [],
            "location": job.location,
            "type": EmployeeType(job.type) if job.type else None,
            "salaryRange": job.salary,
            "benefits": job.benefits or [],
            "status": JobStatus(job.status) if job.status else None,
            "openDate": job.postedDate.isoformat() if job.postedDate else None,
            "closeDate": job.closingDate.isoformat() if job.closingDate else None,
            "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
            "tags": job.tags or [],
            "tenant_id": str(job.tenant_id),
            "createdBy": str(job.createdBy),
            "createdAt": job.createdAt.isoformat() if job.createdAt else None,
            "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
        }
        return JobPosting(**job_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job posting: {str(e)}")

@router.put("/jobs/{job_id}", response_model=JobPosting)
async def update_hrm_job(
    job_id: str,
    job_data: JobPostingUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing job posting"""
    try:
        job = update_job_posting(db, job_id, job_data.dict(exclude_unset=True), tenant_context["tenant_id"] if tenant_context else None)
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert SQLAlchemy model to Pydantic model
        job_data = {
            "id": str(job.id),
            "title": job.title,
            "department": Department(job.department) if job.department else None,
            "description": job.description,
            "requirements": job.requirements.split('\n') if job.requirements else [],
            "responsibilities": job.responsibilities or [],
            "location": job.location,
            "type": EmployeeType(job.type) if job.type else None,
            "salaryRange": job.salary,
            "benefits": job.benefits or [],
            "status": JobStatus(job.status) if job.status else None,
            "openDate": job.postedDate.isoformat() if job.postedDate else None,
            "closeDate": job.closingDate.isoformat() if job.closingDate else None,
            "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
            "tags": job.tags or [],
            "tenant_id": str(job.tenant_id),
            "createdBy": str(job.createdBy),
            "createdAt": job.createdAt.isoformat() if job.createdAt else None,
            "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
        }
        return JobPosting(**job_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating job posting: {str(e)}")

@router.delete("/jobs/{job_id}")
async def delete_hrm_job(
    job_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a job posting"""
    try:
        success = delete_job_posting(job_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Job posting not found")
        return {"message": "Job posting deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting job posting: {str(e)}")

# Application endpoints
@router.get("/applications", response_model=HRMApplicationsResponse)
async def get_hrm_applications(
    status: Optional[str] = Query(None),
    job_posting_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all applications with optional filtering"""
    try:
        skip = (page - 1) * limit
        applications = get_applications(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if status or job_posting_id or assigned_to or search:
            filtered_applications = []
            for app in applications:
                if status and app.status != status:
                    continue
                if job_posting_id and app.jobPostingId != job_posting_id:
                    continue
                if assigned_to and app.assignedTo != assigned_to:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (app.firstName or "").lower(),
                        search_lower in (app.lastName or "").lower(),
                        search_lower in (app.email or "").lower()
                    ]):
                        continue
                filtered_applications.append(app)
            applications = filtered_applications
        
        # Convert SQLAlchemy models to Pydantic models
        application_list = []
        for app in applications:
            app_data = {
                "id": str(app.id),
                "jobPostingId": str(app.jobPostingId),
                "firstName": app.firstName,
                "lastName": app.lastName,
                "email": app.email,
                "phone": app.phone,
                "resume": app.resume,
                "coverLetter": app.coverLetter,
                "experience": app.experience,
                "education": app.education,
                "skills": app.skills or [],
                "status": ApplicationStatus(app.status) if app.status else None,
                "assignedTo": str(app.assignedTo) if app.assignedTo else None,
                "notes": app.notes,
                "interviewDate": app.interviewDate.isoformat() if app.interviewDate else None,
                "interviewNotes": app.interviewNotes,
                "tenant_id": str(app.tenant_id),
                "createdBy": str(app.createdBy),
                "createdAt": app.createdAt.isoformat() if app.createdAt else None,
                "updatedAt": app.updatedAt.isoformat() if app.updatedAt else None
            }
            application_list.append(Application(**app_data))
        
        # Get total count for pagination
        total = len(application_list)
        
        return HRMApplicationsResponse(
            applications=application_list,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@router.post("/applications", response_model=Application)
def create_hrm_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new application"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    tenant_id = tenant_context["tenant_id"]
    
    # Import the SQLAlchemy Application model
    from ...config.hrm_models import Application as DBApplication
    
    # Create database application record
    db_application = DBApplication(
        id=uuid.uuid4(),
        tenant_id=uuid.UUID(tenant_id),
        jobPostingId=uuid.UUID(application_data.jobPostingId),
        firstName=application_data.firstName,
        lastName=application_data.lastName,
        email=application_data.email,
        phone=application_data.phone,
        resume=application_data.resume,
        coverLetter=application_data.coverLetter,
        experience=application_data.experience,
        education=application_data.education,
        skills=application_data.skills,
        status=application_data.status.value if application_data.status else "applied",
        assignedTo=uuid.UUID(application_data.assignedTo) if application_data.assignedTo else None,
        notes=application_data.notes,
        interviewDate=datetime.fromisoformat(application_data.interviewDate) if application_data.interviewDate else None,
        interviewNotes=application_data.interviewNotes,
        createdBy=current_user.id,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    # Convert to response format
    response_data = {
        "id": str(db_application.id),
        "jobPostingId": str(db_application.jobPostingId),
        "firstName": db_application.firstName,
        "lastName": db_application.lastName,
        "email": db_application.email,
        "phone": db_application.phone,
        "resume": db_application.resume,
        "coverLetter": db_application.coverLetter,
        "experience": db_application.experience,
        "education": db_application.education,
        "skills": db_application.skills,
        "status": ApplicationStatus(db_application.status) if db_application.status else None,
        "assignedTo": str(db_application.assignedTo) if db_application.assignedTo else None,
        "notes": db_application.notes,
        "interviewDate": db_application.interviewDate.isoformat() if db_application.interviewDate else None,
        "interviewNotes": db_application.interviewNotes,
        "tenant_id": str(db_application.tenant_id),
        "createdBy": str(db_application.createdBy),
        "createdAt": db_application.createdAt.isoformat() if db_application.createdAt else None,
        "updatedAt": db_application.updatedAt.isoformat() if db_application.updatedAt else None
    }
    
    return Application(**response_data)

# Performance Review endpoints
@router.get("/reviews", response_model=HRMReviewsResponse)
async def get_hrm_reviews(
    employee_id: Optional[str] = Query(None),
    review_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    review_period: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all performance reviews with optional filtering"""
    try:
        skip = (page - 1) * limit
        reviews = get_performance_reviews(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or review_type or status or review_period:
            filtered_reviews = []
            for review in reviews:
                if employee_id and review.employeeId != employee_id:
                    continue
                if review_type and review.reviewType != review_type:
                    continue
                if status and review.status != status:
                    continue
                if review_period and review.reviewPeriod != review_period:
                    continue
                filtered_reviews.append(review)
            reviews = filtered_reviews
        
        # Get total count for pagination
        total = len(reviews)
        
        return HRMReviewsResponse(
            reviews=reviews,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance reviews: {str(e)}")

@router.post("/reviews", response_model=PerformanceReview)
async def create_hrm_review(
    review_data: PerformanceReviewCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new performance review"""
    try:
        review = PerformanceReview(
            id=str(uuid.uuid4()),
            **review_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        return review
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating performance review: {str(e)}")

@router.get("/reviews/{review_id}", response_model=PerformanceReview)
async def get_hrm_review_by_id(
    review_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific performance review by ID"""
    try:
        review = get_performance_review_by_id(db, review_id, tenant_context["tenant_id"] if tenant_context else None)
        if not review:
            raise HTTPException(status_code=404, detail="Performance review not found")
        return review
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance review: {str(e)}")

@router.put("/reviews/{review_id}", response_model=PerformanceReview)
async def update_hrm_review(
    review_id: str,
    review_data: PerformanceReviewUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing performance review"""
    try:
        review = update_performance_review(db, review_id, review_data.dict(exclude_unset=True), tenant_context["tenant_id"] if tenant_context else None)
        if not review:
            raise HTTPException(status_code=404, detail="Performance review not found")
        return review
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating performance review: {str(e)}")

@router.delete("/reviews/{review_id}")
async def delete_hrm_review(
    review_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a performance review"""
    try:
        success = delete_performance_review(db, review_id, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Performance review not found")
        return {"message": "Performance review deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting performance review: {str(e)}")

# Time Entry endpoints
@router.get("/time-entries", response_model=HRMTimeEntriesResponse)
async def get_hrm_time_entries(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all time entries with optional filtering"""
    try:
        skip = (page - 1) * limit
        time_entries = get_time_entries(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or start_date or end_date or project_id:
            filtered_entries = []
            for entry in time_entries:
                if employee_id and entry.employeeId != employee_id:
                    continue
                if start_date and entry.date < start_date:
                    continue
                if end_date and entry.date > end_date:
                    continue
                if project_id and entry.projectId != project_id:
                    continue
                filtered_entries.append(entry)
            time_entries = filtered_entries
        
        # Get total count for pagination
        total = len(time_entries)
        
        return HRMTimeEntriesResponse(
            timeEntries=time_entries,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entries: {str(e)}")

@router.post("/time-entries", response_model=TimeEntry)
async def create_hrm_time_entry(
    time_entry_data: TimeEntryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new time entry"""
    try:
        time_entry = TimeEntry(
            id=str(uuid.uuid4()),
            **time_entry_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating time entry: {str(e)}")


# Leave Request endpoints
@router.get("/leave-requests", response_model=HRMLeaveRequestsResponse)
async def get_hrm_leave_requests(
    employee_id: Optional[str] = Query(None),
    leave_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all leave requests with optional filtering"""
    try:
        skip = (page - 1) * limit
        leave_requests = get_leave_requests(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or leave_type or status or start_date or end_date:
            filtered_requests = []
            for request in leave_requests:
                if employee_id and request.employeeId != employee_id:
                    continue
                if leave_type and request.leaveType != leave_type:
                    continue
                if status and request.status != status:
                    continue
                if start_date and request.startDate < start_date:
                    continue
                if end_date and request.endDate > end_date:
                    continue
                filtered_requests.append(request)
            leave_requests = filtered_requests
        
        # Get total count for pagination
        total = len(leave_requests)
        
        return HRMLeaveRequestsResponse(
            leaveRequests=leave_requests,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leave requests: {str(e)}")

@router.post("/leave-requests", response_model=LeaveRequest)
async def create_hrm_leave_request(
    leave_request_data: LeaveRequestCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new leave request"""
    try:
        leave_request = LeaveRequest(
            id=str(uuid.uuid4()),
            **leave_request_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(leave_request)
        db.commit()
        db.refresh(leave_request)
        
        return leave_request
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating leave request: {str(e)}")

@router.get("/leave-requests/{leave_request_id}", response_model=LeaveRequest)
async def get_hrm_leave_request(
    leave_request_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific leave request by ID"""
    try:
        leave_request = get_leave_request_by_id(db, leave_request_id, tenant_context["tenant_id"] if tenant_context else None)
        if not leave_request:
            raise HTTPException(status_code=404, detail="Leave request not found")
        return leave_request
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leave request: {str(e)}")

@router.put("/leave-requests/{leave_request_id}", response_model=LeaveRequest)
async def update_hrm_leave_request(
    leave_request_id: str,
    leave_request_update: LeaveRequestUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a leave request"""
    try:
        updated_request = update_leave_request(
            db, 
            leave_request_id, 
            leave_request_update.dict(exclude_unset=True),
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_request:
            raise HTTPException(status_code=404, detail="Leave request not found")
        return updated_request
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating leave request: {str(e)}")

@router.delete("/leave-requests/{leave_request_id}")
async def delete_hrm_leave_request(
    leave_request_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a leave request"""
    try:
        deleted = delete_leave_request(db, leave_request_id, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Leave request not found")
        return {"message": "Leave request deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting leave request: {str(e)}")

# Payroll endpoints
@router.get("/payroll", response_model=HRMPayrollResponse)
async def get_hrm_payroll(
    employee_id: Optional[str] = Query(None),
    pay_period: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all payroll records with optional filtering"""
    try:
        skip = (page - 1) * limit
        payroll_records = get_payroll(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or pay_period or status or start_date or end_date:
            filtered_records = []
            for record in payroll_records:
                if employee_id and record.employeeId != employee_id:
                    continue
                if pay_period and record.payPeriod != pay_period:
                    continue
                if status and record.status != status:
                    continue
                if start_date and record.startDate < start_date:
                    continue
                if end_date and record.endDate > end_date:
                    continue
                filtered_records.append(record)
            payroll_records = filtered_records
        
        # Get total count for pagination
        total = len(payroll_records)
        
        return HRMPayrollResponse(
            payroll=payroll_records,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll records: {str(e)}")

@router.post("/payroll", response_model=Payroll)
async def create_hrm_payroll(
    payroll_data: PayrollCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new payroll record"""
    try:
        payroll = Payroll(
            id=str(uuid.uuid4()),
            **payroll_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        
        return payroll
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating payroll record: {str(e)}")

@router.get("/payroll/{payroll_id}", response_model=Payroll)
async def get_hrm_payroll(
    payroll_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific payroll record by ID"""
    try:
        payroll = get_payroll_by_id(db, payroll_id, tenant_context["tenant_id"] if tenant_context else None)
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        return payroll
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll record: {str(e)}")

@router.put("/payroll/{payroll_id}", response_model=Payroll)
async def update_hrm_payroll(
    payroll_id: str,
    payroll_update: PayrollUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a payroll record"""
    try:
        updated_payroll = update_payroll(
            db, 
            payroll_id, 
            payroll_update.dict(exclude_unset=True),
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        return updated_payroll
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payroll record: {str(e)}")

@router.delete("/payroll/{payroll_id}")
async def delete_hrm_payroll(
    payroll_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a payroll record"""
    try:
        deleted = delete_payroll(db, payroll_id, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        return {"message": "Payroll record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting payroll record: {str(e)}")

# Benefits endpoints
@router.get("/benefits", response_model=HRMBenefitsResponse)
async def get_hrm_benefits(
    employee_id: Optional[str] = Query(None),
    benefit_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all benefits with optional filtering"""
    try:
        skip = (page - 1) * limit
        benefits = get_benefits(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or benefit_type or status:
            filtered_benefits = []
            for benefit in benefits:
                if employee_id and benefit.employeeId != employee_id:
                    continue
                if benefit_type and benefit.benefitType != benefit_type:
                    continue
                if status and benefit.status != status:
                    continue
                filtered_benefits.append(benefit)
            benefits = filtered_benefits
        
        # Get total count for pagination
        total = len(benefits)
        
        return HRMBenefitsResponse(
            benefits=benefits,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching benefits: {str(e)}")

@router.post("/benefits", response_model=Benefits)
async def create_hrm_benefit(
    benefit_data: BenefitsCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new benefit"""
    try:
        benefit = Benefits(
            id=str(uuid.uuid4()),
            **benefit_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(benefit)
        db.commit()
        db.refresh(benefit)
        
        return benefit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating benefit: {str(e)}")

# Training endpoints
@router.get("/training", response_model=HRMTrainingResponse)
async def get_hrm_training(
    training_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all training programs with optional filtering"""
    try:
        skip = (page - 1) * limit
        training_programs = get_training(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if training_type or status or provider or search:
            filtered_programs = []
            for program in training_programs:
                if training_type and program.trainingType != training_type:
                    continue
                if status and program.status != status:
                    continue
                if provider and program.provider != provider:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (program.title or "").lower(),
                        search_lower in (program.description or "").lower(),
                        search_lower in (program.provider or "").lower()
                    ]):
                        continue
                filtered_programs.append(program)
            training_programs = filtered_programs
        
        # Get total count for pagination
        total = len(training_programs)
        
        return HRMTrainingResponse(
            training=training_programs,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training programs: {str(e)}")

@router.post("/training", response_model=Training)
async def create_hrm_training(
    training_data: TrainingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new training program"""
    try:
        training = Training(
            id=str(uuid.uuid4()),
            **training_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(training)
        db.commit()
        db.refresh(training)
        
        return training
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating training program: {str(e)}")

@router.get("/training/{training_id}", response_model=Training)
async def get_hrm_training(
    training_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific training program by ID"""
    try:
        training = get_training_by_id(db, training_id, tenant_context["tenant_id"] if tenant_context else None)
        if not training:
            raise HTTPException(status_code=404, detail="Training program not found")
        return training
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training program: {str(e)}")

@router.put("/training/{training_id}", response_model=Training)
async def update_hrm_training(
    training_id: str,
    training_update: TrainingUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a training program"""
    try:
        updated_training = update_training(
            db, 
            training_id, 
            training_update.dict(exclude_unset=True),
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_training:
            raise HTTPException(status_code=404, detail="Training program not found")
        return updated_training
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating training program: {str(e)}")

@router.delete("/training/{training_id}")
async def delete_hrm_training(
    training_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a training program"""
    try:
        deleted = delete_training(db, training_id, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Training program not found")
        return {"message": "Training program deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting training program: {str(e)}")

# Training Enrollment endpoints
@router.get("/training-enrollments", response_model=HRMEnrollmentsResponse)
async def get_hrm_training_enrollments(
    training_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all training enrollments with optional filtering"""
    try:
        skip = (page - 1) * limit
        enrollments = get_training_enrollments(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if training_id or employee_id or status:
            filtered_enrollments = []
            for enrollment in enrollments:
                if training_id and enrollment.trainingId != training_id:
                    continue
                if employee_id and enrollment.employeeId != employee_id:
                    continue
                if status and enrollment.status != status:
                    continue
                filtered_enrollments.append(enrollment)
            enrollments = filtered_enrollments
        
        # Get total count for pagination
        total = len(enrollments)
        
        return HRMEnrollmentsResponse(
            enrollments=enrollments,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training enrollments: {str(e)}")

@router.post("/training-enrollments", response_model=TrainingEnrollment)
async def create_hrm_training_enrollment(
    enrollment_data: TrainingEnrollmentCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new training enrollment"""
    try:
        enrollment = TrainingEnrollment(
            id=str(uuid.uuid4()),
            **enrollment_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        
        return enrollment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating training enrollment: {str(e)}")

@router.get("/training-enrollments/{enrollment_id}", response_model=TrainingEnrollment)
async def get_hrm_training_enrollment(
    enrollment_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific training enrollment by ID"""
    try:
        enrollment = get_training_enrollment_by_id(db, enrollment_id, tenant_context["tenant_id"] if tenant_context else None)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Training enrollment not found")
        return enrollment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training enrollment: {str(e)}")

@router.put("/training-enrollments/{enrollment_id}", response_model=TrainingEnrollment)
async def update_hrm_training_enrollment(
    enrollment_id: str,
    enrollment_update: TrainingEnrollmentUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a training enrollment"""
    try:
        updated_enrollment = update_training_enrollment(
            db, 
            enrollment_id, 
            enrollment_update.dict(exclude_unset=True),
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_enrollment:
            raise HTTPException(status_code=404, detail="Training enrollment not found")
        return updated_enrollment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating training enrollment: {str(e)}")

@router.delete("/training-enrollments/{enrollment_id}")
async def delete_hrm_training_enrollment(
    enrollment_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a training enrollment"""
    try:
        deleted = delete_training_enrollment(db, enrollment_id, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=500, detail="Training enrollment not found")
        return {"message": "Training enrollment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting training enrollment: {str(e)}")

# Supplier endpoints
@router.get("/suppliers", response_model=SuppliersResponse)
def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all suppliers for the current tenant"""
    try:
        suppliers = get_suppliers(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        total = len(suppliers)
        return SuppliersResponse(suppliers=suppliers, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching suppliers: {str(e)}")

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def read_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get supplier by ID"""
    try:
        supplier = get_supplier_by_id(supplier_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return SupplierResponse(supplier=supplier)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supplier: {str(e)}")

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier_endpoint(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new supplier"""
    try:
        # Check if supplier code already exists for this tenant
        existing_supplier = get_supplier_by_code(supplier.code, db, tenant_context["tenant_id"] if tenant_context else None)
        if existing_supplier:
            raise HTTPException(
                status_code=400, 
                detail=f"Supplier with code '{supplier.code}' already exists"
            )
        
        supplier_data = supplier.dict()
        supplier_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })
        
        db_supplier = create_supplier(supplier_data, db)
        return SupplierResponse(supplier=db_supplier)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating supplier: {str(e)}")

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier_endpoint(
    supplier_id: str,
    supplier: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update supplier"""
    try:
        update_data = {k: v for k, v in supplier.dict().items() if v is not None}
        db_supplier = update_supplier(supplier_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return SupplierResponse(supplier=db_supplier)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating supplier: {str(e)}")

@router.delete("/suppliers/{supplier_id}")
def delete_supplier_endpoint(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete supplier"""
    try:
        success = delete_supplier(supplier_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return {"message": "Supplier deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting supplier: {str(e)}")

# HRM Dashboard endpoint
@router.get("/dashboard", response_model=HRMDashboard)
async def get_hrm_dashboard(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get HRM dashboard data"""
    try:
        dashboard_data = get_hrm_dashboard_data(db, tenant_context["tenant_id"] if tenant_context else None)
        if not dashboard_data:
            raise HTTPException(status_code=500, detail="Error fetching dashboard data")
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")
