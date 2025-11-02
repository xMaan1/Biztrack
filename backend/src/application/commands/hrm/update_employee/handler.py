from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EmployeeRepository
from ....domain.entities.hrm_entity import Employee
from .command import UpdateEmployeeCommand

class UpdateEmployeeHandler(RequestHandlerBase[UpdateEmployeeCommand, Result[Employee]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateEmployeeCommand) -> Result[Employee]:
        try:
            with self._unit_of_work as uow:
                employee_repo = EmployeeRepository(uow.session)
                
                employee = employee_repo.get_by_id(command.employee_id, command.tenant_id)
                if not employee:
                    return Result.failure("Employee not found")
                
                if command.department is not None:
                    if hasattr(command.department, 'value'):
                        employee.department = command.department.value
                    else:
                        employee.department = command.department
                if command.position is not None:
                    employee.position = command.position
                if command.hireDate is not None:
                    employee.hireDate = datetime.strptime(command.hireDate, "%Y-%m-%d").date()
                if command.salary is not None:
                    employee.salary = command.salary
                if command.managerId is not None:
                    import uuid
                    employee.managerId = uuid.UUID(command.managerId) if command.managerId else None
                if command.notes is not None:
                    employee.notes = command.notes
                if command.resume_url is not None:
                    employee.resume_url = command.resume_url
                if command.attachments is not None:
                    employee.attachments = command.attachments
                if command.phone is not None:
                    employee.phone = command.phone
                if command.dateOfBirth is not None:
                    employee.dateOfBirth = datetime.strptime(command.dateOfBirth, "%Y-%m-%d").date() if command.dateOfBirth else None
                if command.address is not None:
                    employee.address = command.address
                if command.emergencyContact is not None:
                    employee.emergencyContact = command.emergencyContact
                if command.emergencyPhone is not None:
                    employee.emergencyPhone = command.emergencyPhone
                if command.skills is not None:
                    employee.skills = command.skills
                if command.certifications is not None:
                    employee.certifications = command.certifications
                if command.employeeType is not None:
                    employee.employeeType = command.employeeType.value if hasattr(command.employeeType, 'value') else command.employeeType
                if command.employmentStatus is not None:
                    employee.employmentStatus = command.employmentStatus.value if hasattr(command.employmentStatus, 'value') else command.employmentStatus
                
                employee.updatedAt = datetime.utcnow()
                employee_repo.update(employee)
                uow.commit()
                
                return Result.success(employee)
                
        except Exception as e:
            return Result.failure(f"Failed to update employee: {str(e)}")

