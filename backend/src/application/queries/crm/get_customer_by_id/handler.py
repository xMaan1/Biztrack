from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CustomerRepository
from ....domain.entities.crm_entity import Customer
from .query import GetCustomerByIdQuery

class GetCustomerByIdHandler(RequestHandlerBase[GetCustomerByIdQuery, Result[Optional[Customer]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetCustomerByIdQuery) -> Result[Optional[Customer]]:
        try:
            with self._unit_of_work as uow:
                customer_repo = CustomerRepository(uow.session)
                customer = customer_repo.get_by_id(query.customer_id, query.tenant_id)
                return Result.success(customer)
        except Exception as e:
            return Result.failure(f"Failed to get customer: {str(e)}")

