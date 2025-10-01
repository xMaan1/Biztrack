from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid
from .hrm_models import Employee, JobPosting, PerformanceReview, TimeEntry, LeaveRequest, Payroll, Benefits

# Employee functions
def get_employee_by_id(employee_id: str, db: Session, tenant_id: str = None) -> Optional[Employee]:
    query = db.query(Employee).filter(Employee.id == employee_id)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.first()

def get_employee_by_user_id(user_id: str, db: Session, tenant_id: str = None) -> Optional[Employee]:
    query = db.query(Employee).filter(Employee.userId == user_id)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.first()

def get_all_employees(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    query = db.query(Employee)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.order_by(Employee.createdAt.desc()).offset(skip).limit(limit).all()

def get_employees_by_department(department: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    query = db.query(Employee).filter(Employee.department == department)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.order_by(Employee.createdAt.desc()).offset(skip).limit(limit).all()

def create_employee(employee_data: dict, db: Session) -> Employee:
    db_employee = Employee(**employee_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(employee_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Employee]:
    employee = get_employee_by_id(employee_id, db, tenant_id)
    if employee:
        for key, value in update_data.items():
            if hasattr(employee, key) and value is not None:
                # Handle special field mappings
                if key == 'department' and hasattr(value, 'value'):
                    setattr(employee, key, value.value)
                elif key == 'hireDate' and isinstance(value, str):
                    setattr(employee, key, datetime.strptime(value, "%Y-%m-%d").date())
                elif key == 'managerId' and value:
                    setattr(employee, key, uuid.UUID(value))
                else:
                    setattr(employee, key, value)
        employee.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(employee)
    return employee

def delete_employee(employee_id: str, db: Session, tenant_id: str = None) -> bool:
    employee = get_employee_by_id(employee_id, db, tenant_id)
    if employee:
        db.delete(employee)
        db.commit()
        return True
    return False

# JobPosting functions
def get_job_posting_by_id(job_id: str, db: Session, tenant_id: str = None) -> Optional[JobPosting]:
    query = db.query(JobPosting).filter(JobPosting.id == job_id)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.first()

def get_all_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    query = db.query(JobPosting)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.order_by(JobPosting.postedDate.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    """Get all job postings (alias for get_all_job_postings)"""
    return get_all_job_postings(db, tenant_id, skip, limit)

def get_active_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    query = db.query(JobPosting).filter(JobPosting.isActive == True)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.order_by(JobPosting.postedDate.desc()).offset(skip).limit(limit).all()

def create_job_posting(job_data: dict, db: Session) -> JobPosting:
    db_job = JobPosting(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job_posting(job_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[JobPosting]:
    job = get_job_posting_by_id(job_id, db, tenant_id)
    if job:
        for key, value in update_data.items():
            if hasattr(job, key) and value is not None:
                setattr(job, key, value)
        job.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job

def delete_job_posting(job_id: str, db: Session, tenant_id: str = None) -> bool:
    job = get_job_posting_by_id(job_id, db, tenant_id)
    if job:
        db.delete(job)
        db.commit()
        return True
    return False

# PerformanceReview functions
def get_performance_review_by_id(review_id: str, db: Session, tenant_id: str = None) -> Optional[PerformanceReview]:
    query = db.query(PerformanceReview).filter(PerformanceReview.id == review_id)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.first()

def get_all_performance_reviews(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    query = db.query(PerformanceReview)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.order_by(PerformanceReview.reviewDate.desc()).offset(skip).limit(limit).all()

def get_performance_reviews_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    query = db.query(PerformanceReview).filter(PerformanceReview.employeeId == employee_id)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.order_by(PerformanceReview.reviewDate.desc()).offset(skip).limit(limit).all()

def create_performance_review(review_data: dict, db: Session) -> PerformanceReview:
    db_review = PerformanceReview(**review_data)
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def update_performance_review(review_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[PerformanceReview]:
    review = get_performance_review_by_id(review_id, db, tenant_id)
    if review:
        for key, value in update_data.items():
            if hasattr(review, key) and value is not None:
                setattr(review, key, value)
        review.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(review)
    return review

def delete_performance_review(review_id: str, db: Session, tenant_id: str = None) -> bool:
    review = get_performance_review_by_id(review_id, db, tenant_id)
    if review:
        db.delete(review)
        db.commit()
        return True
    return False

# TimeEntry functions
def get_time_entry_by_id(entry_id: str, db: Session, tenant_id: str = None) -> Optional[TimeEntry]:
    query = db.query(TimeEntry).filter(TimeEntry.id == entry_id)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.first()

def get_all_time_entries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    query = db.query(TimeEntry)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.order_by(TimeEntry.date.desc()).offset(skip).limit(limit).all()

def get_time_entries_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    query = db.query(TimeEntry).filter(TimeEntry.employeeId == employee_id)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.order_by(TimeEntry.date.desc()).offset(skip).limit(limit).all()

def create_time_entry(entry_data: dict, db: Session) -> TimeEntry:
    db_entry = TimeEntry(**entry_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_time_entry(entry_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[TimeEntry]:
    entry = get_time_entry_by_id(entry_id, db, tenant_id)
    if entry:
        for key, value in update_data.items():
            if hasattr(entry, key) and value is not None:
                setattr(entry, key, value)
        entry.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(entry)
    return entry

def delete_time_entry(entry_id: str, db: Session, tenant_id: str = None) -> bool:
    entry = get_time_entry_by_id(entry_id, db, tenant_id)
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False

# LeaveRequest functions
def get_leave_request_by_id(request_id: str, db: Session, tenant_id: str = None) -> Optional[LeaveRequest]:
    query = db.query(LeaveRequest).filter(LeaveRequest.id == request_id)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.first()

def get_all_leave_requests(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    query = db.query(LeaveRequest)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.order_by(LeaveRequest.createdAt.desc()).offset(skip).limit(limit).all()

def get_leave_requests_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    query = db.query(LeaveRequest).filter(LeaveRequest.employeeId == employee_id)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.order_by(LeaveRequest.createdAt.desc()).offset(skip).limit(limit).all()

def create_leave_request(request_data: dict, db: Session) -> LeaveRequest:
    db_request = LeaveRequest(**request_data)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def update_leave_request(request_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[LeaveRequest]:
    request = get_leave_request_by_id(request_id, db, tenant_id)
    if request:
        for key, value in update_data.items():
            if hasattr(request, key) and value is not None:
                setattr(request, key, value)
        request.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(request)
    return request

def delete_leave_request(request_id: str, db: Session, tenant_id: str = None) -> bool:
    request = get_leave_request_by_id(request_id, db, tenant_id)
    if request:
        db.delete(request)
        db.commit()
        return True
    return False

# Payroll functions
def get_payroll_by_id(payroll_id: str, db: Session, tenant_id: str = None) -> Optional[Payroll]:
    query = db.query(Payroll).filter(Payroll.id == payroll_id)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.first()

def get_all_payrolls(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    query = db.query(Payroll)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.order_by(Payroll.startDate.desc()).offset(skip).limit(limit).all()

def get_payrolls_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    query = db.query(Payroll).filter(Payroll.employeeId == employee_id)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.order_by(Payroll.startDate.desc()).offset(skip).limit(limit).all()

def create_payroll(payroll_data: dict, db: Session) -> Payroll:
    db_payroll = Payroll(**payroll_data)
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    return db_payroll

def update_payroll(payroll_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Payroll]:
    payroll = get_payroll_by_id(payroll_id, db, tenant_id)
    if payroll:
        for key, value in update_data.items():
            if hasattr(payroll, key) and value is not None:
                setattr(payroll, key, value)
        payroll.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(payroll)
    return payroll

def delete_payroll(payroll_id: str, db: Session, tenant_id: str = None) -> bool:
    payroll = get_payroll_by_id(payroll_id, db, tenant_id)
    if payroll:
        db.delete(payroll)
        db.commit()
        return True
    return False

# Benefits functions
def get_benefit_by_id(benefit_id: str, db: Session, tenant_id: str = None) -> Optional[Benefits]:
    query = db.query(Benefits).filter(Benefits.id == benefit_id)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.first()

def get_all_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    query = db.query(Benefits)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.order_by(Benefits.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    query = db.query(Benefits).filter(Benefits.isActive == True)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.order_by(Benefits.createdAt.desc()).offset(skip).limit(limit).all()

def create_benefit(benefit_data: dict, db: Session) -> Benefits:
    db_benefit = Benefits(**benefit_data)
    db.add(db_benefit)
    db.commit()
    db.refresh(db_benefit)
    return db_benefit

def update_benefit(benefit_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Benefits]:
    benefit = get_benefit_by_id(benefit_id, db, tenant_id)
    if benefit:
        for key, value in update_data.items():
            if hasattr(benefit, key) and value is not None:
                setattr(benefit, key, value)
        benefit.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(benefit)
    return benefit

def delete_benefit(benefit_id: str, db: Session, tenant_id: str = None) -> bool:
    benefit = get_benefit_by_id(benefit_id, db, tenant_id)
    if benefit:
        db.delete(benefit)
        db.commit()
        return True
    return False

# Alias functions for backward compatibility
def get_employees(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    """Get all employees (alias for get_all_employees)"""
    return get_all_employees(db, tenant_id, skip, limit)

def get_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    """Get all benefits (alias for get_all_benefits)"""
    return get_all_benefits(db, tenant_id, skip, limit)

def get_performance_reviews(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    """Get all performance reviews (alias for get_all_performance_reviews)"""
    return get_all_performance_reviews(db, tenant_id, skip, limit)

def get_time_entries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    """Get all time entries (alias for get_all_time_entries)"""
    return get_all_time_entries(db, tenant_id, skip, limit)

def get_leave_requests(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    """Get all leave requests (alias for get_all_leave_requests)"""
    return get_all_leave_requests(db, tenant_id, skip, limit)

def get_payroll(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    """Get all payroll records (alias for get_all_payrolls)"""
    return get_all_payrolls(db, tenant_id, skip, limit)

# Placeholder functions for models not yet implemented
def get_training_by_id(training_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Training model not yet implemented
    return None

def get_all_trainings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    # Placeholder - Training model not yet implemented
    return []

def get_training(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all trainings (alias for get_all_trainings)"""
    return get_all_trainings(db, tenant_id, skip, limit)

def create_training(training_data: dict, db: Session) -> Any:
    # Placeholder - Training model not yet implemented
    return None

def update_training(training_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Training model not yet implemented
    return None

def delete_training(training_id: str, db: Session, tenant_id: str = None) -> bool:
    # Placeholder - Training model not yet implemented
    return False

def get_training_enrollment_by_id(enrollment_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def get_all_training_enrollments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return []

def get_training_enrollments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all training enrollments (alias for get_all_training_enrollments)"""
    return get_all_training_enrollments(db, tenant_id, skip, limit)

def create_training_enrollment(enrollment_data: dict, db: Session) -> Any:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def update_training_enrollment(enrollment_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def delete_training_enrollment(enrollment_id: str, db: Session, tenant_id: str = None) -> bool:
    # Placeholder - TrainingEnrollment model not yet implemented
    return False

def get_application_by_id(application_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Application model not yet implemented
    return None

def get_all_applications(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    # Placeholder - Application model not yet implemented
    return []

def get_applications(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all applications (alias for get_all_applications)"""
    return get_all_applications(db, tenant_id, skip, limit)

def create_application(application_data: dict, db: Session) -> Any:
    # Placeholder - Application model not yet implemented
    return None

def update_application(application_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Application model not yet implemented
    return None

def delete_application(application_id: str, db: Session, tenant_id: str = None) -> bool:
    # Placeholder - Application model not yet implemented
    return False

# HRM Dashboard functions
def get_hrm_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get HRM dashboard statistics"""
    total_employees = db.query(Employee).filter(Employee.tenant_id == tenant_id).count()
    active_employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.employmentStatus == "active"
    ).count()
    
    total_job_postings = db.query(JobPosting).filter(JobPosting.tenant_id == tenant_id).count()
    active_job_postings = db.query(JobPosting).filter(
        JobPosting.tenant_id == tenant_id,
        JobPosting.isActive == True
    ).count()
    
    total_leave_requests = db.query(LeaveRequest).filter(LeaveRequest.tenant_id == tenant_id).count()
    pending_leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.status == "pending"
    ).count()
    
    total_performance_reviews = db.query(PerformanceReview).filter(PerformanceReview.tenant_id == tenant_id).count()
    recent_reviews = db.query(PerformanceReview).filter(
        PerformanceReview.tenant_id == tenant_id
    ).order_by(PerformanceReview.reviewDate.desc()).limit(5).all()
    
    return {
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "inactive": total_employees - active_employees
        },
        "job_postings": {
            "total": total_job_postings,
            "active": active_job_postings
        },
        "leave_requests": {
            "total": total_leave_requests,
            "pending": pending_leave_requests
        },
        "performance_reviews": {
            "total": total_performance_reviews,
            "recent": len(recent_reviews)
        }
    }
