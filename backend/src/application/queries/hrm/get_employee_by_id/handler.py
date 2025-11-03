from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EmployeeRepository
from ....domain.entities.hrm_entity import Employee
from .query import GetEmployeeByIdQuery

class GetEmployeeByIdHandler(RequestHandlerBase[GetEmployeeByIdQuery, Result[Optional[Employee]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetEmployeeByIdQuery) -> Result[Optional[Employee]]:
        try:
            with self._unit_of_work as uow:
                repo = EmployeeRepository(uow.session)
                entity = repo.get_by_id(query.employee_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get employee: {str(e)}")

