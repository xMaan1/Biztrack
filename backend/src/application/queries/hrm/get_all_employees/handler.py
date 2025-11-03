from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EmployeeRepository
from ....domain.entities.hrm_entity import Employee
from .query import GetAllEmployeesQuery

class GetAllEmployeesHandler(RequestHandlerBase[GetAllEmployeesQuery, Result[PagedResult[Employee]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllEmployeesQuery) -> Result[PagedResult[Employee]]:
        try:
            with self._unit_of_work as uow:
                repo = EmployeeRepository(uow.session)
                import uuid
                
                if query.department:
                    employees = repo.get_by_department(
                        query.department,
                        query.tenant_id,
                        query.skip,
                        query.page_size
                    )
                    total_count = len(employees)
                else:
                    employees = repo.get_all(
                        tenant_id=query.tenant_id,
                        skip=query.skip,
                        limit=query.page_size,
                        order_by=query.sort_by,
                        order_desc=(query.sort_order == 'desc')
                    )
                    total_count = repo.count(query.tenant_id)
                
                paged_result = PagedResult(
                    items=employees,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get employees: {str(e)}")

