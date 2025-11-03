from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.hrm_entity import (
    Employee, JobPosting, PerformanceReview, TimeEntry,
    LeaveRequest, Payroll, Benefits, Training, TrainingEnrollment,
    Application, Supplier
)

class EmployeeRepository(BaseRepository[Employee]):
    def __init__(self, session: Session):
        super().__init__(session, Employee)

    def get_by_user_id(self, user_id: str, tenant_id: Optional[str] = None) -> Optional[Employee]:
        query = self._session.query(Employee).filter(Employee.userId == user_id)
        if tenant_id:
            query = query.filter(Employee.tenant_id == tenant_id)
        return query.first()

    def get_by_department(self, department: str, tenant_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Employee]:
        query = self._session.query(Employee).filter(Employee.department == department)
        if tenant_id:
            query = query.filter(Employee.tenant_id == tenant_id)
        return query.order_by(Employee.createdAt.desc()).offset(skip).limit(limit).all()

class JobPostingRepository(BaseRepository[JobPosting]):
    def __init__(self, session: Session):
        super().__init__(session, JobPosting)

class PerformanceReviewRepository(BaseRepository[PerformanceReview]):
    def __init__(self, session: Session):
        super().__init__(session, PerformanceReview)

class TimeEntryRepository(BaseRepository[TimeEntry]):
    def __init__(self, session: Session):
        super().__init__(session, TimeEntry)

    def get_by_employee(self, employee_id: str, tenant_id: Optional[str] = None) -> List[TimeEntry]:
        query = self._session.query(TimeEntry).filter(TimeEntry.employeeId == employee_id)
        if tenant_id:
            query = query.filter(TimeEntry.tenant_id == tenant_id)
        return query.all()

    def get_by_project(self, project_id: str, tenant_id: Optional[str] = None) -> List[TimeEntry]:
        query = self._session.query(TimeEntry).filter(TimeEntry.projectId == project_id)
        if tenant_id:
            query = query.filter(TimeEntry.tenant_id == tenant_id)
        return query.all()

class LeaveRequestRepository(BaseRepository[LeaveRequest]):
    def __init__(self, session: Session):
        super().__init__(session, LeaveRequest)

class PayrollRepository(BaseRepository[Payroll]):
    def __init__(self, session: Session):
        super().__init__(session, Payroll)

class BenefitsRepository(BaseRepository[Benefits]):
    def __init__(self, session: Session):
        super().__init__(session, Benefits)

class TrainingRepository(BaseRepository[Training]):
    def __init__(self, session: Session):
        super().__init__(session, Training)

class TrainingEnrollmentRepository(BaseRepository[TrainingEnrollment]):
    def __init__(self, session: Session):
        super().__init__(session, TrainingEnrollment)

class ApplicationRepository(BaseRepository[Application]):
    def __init__(self, session: Session):
        super().__init__(session, Application)

    def get_by_job_posting(self, job_posting_id: str, tenant_id: Optional[str] = None) -> List[Application]:
        query = self._session.query(Application).filter(Application.jobPostingId == job_posting_id)
        if tenant_id:
            query = query.filter(Application.tenant_id == tenant_id)
        return query.all()

class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, session: Session):
        super().__init__(session, Supplier)

    def get_by_code(self, code: str, tenant_id: str) -> Optional[Supplier]:
        return self._session.query(Supplier).filter(
            Supplier.code == code,
            Supplier.tenant_id == tenant_id
        ).first()

