from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EmployeeRepository
from ....domain.entities.hrm_entity import Employee
from .command import CreateEmployeeCommand

class CreateEmployeeHandler(RequestHandlerBase[CreateEmployeeCommand, Result[Employee]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateEmployeeCommand) -> Result[Employee]:
        try:
            with self._unit_of_work as uow:
                employee_repo = EmployeeRepository(uow.session)
                
                hire_date = datetime.strptime(command.hireDate, "%Y-%m-%d").date() if command.hireDate else datetime.now().date()
                date_of_birth = datetime.strptime(command.dateOfBirth, "%Y-%m-%d").date() if command.dateOfBirth else None
                
                employee_entity = Employee(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    userId=uuid.UUID(command.userId),
                    employeeId=command.employeeId,
                    department=command.department,
                    position=command.position,
                    hireDate=hire_date,
                    salary=command.salary,
                    managerId=uuid.UUID(command.managerId) if command.managerId else None,
                    notes=command.notes,
                    resume_url=command.resume_url,
                    attachments=command.attachments or [],
                    phone=command.phone,
                    dateOfBirth=date_of_birth,
                    address=command.address,
                    emergencyContact=command.emergencyContact,
                    emergencyPhone=command.emergencyPhone,
                    skills=command.skills or [],
                    certifications=command.certifications or [],
                    employeeType=command.employeeType,
                    employmentStatus=command.employmentStatus,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                employee_repo.add(employee_entity)
                uow.commit()
                return Result.success(employee_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create employee: {str(e)}")

