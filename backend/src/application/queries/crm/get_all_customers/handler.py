from typing import List
from sqlalchemy import or_, func
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CustomerRepository
from ....domain.entities.crm_entity import Customer
from .query import GetAllCustomersQuery

class GetAllCustomersHandler(RequestHandlerBase[GetAllCustomersQuery, Result[PagedResult[Customer]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllCustomersQuery) -> Result[PagedResult[Customer]]:
        try:
            with self._unit_of_work as uow:
                customer_repo = CustomerRepository(uow.session)
                
                filters = {}
                if query.status:
                    filters['customerStatus'] = query.status
                if query.customer_type:
                    filters['customerType'] = query.customer_type
                
                customers = customer_repo.find_by(filters, query.tenant_id)
                
                if query.search:
                    search_term = query.search.lower()
                    customers = [
                        c for c in customers
                        if (query.search in (c.firstName or '').lower() or
                            query.search in (c.lastName or '').lower() or
                            query.search in (c.email or '').lower() or
                            query.search in (c.phone or '').lower() or
                            query.search in (c.customerId or '').lower())
                    ]
                
                total_count = len(customers)
                customers = customers[query.skip:query.skip + query.page_size]
                
                paged_result = PagedResult(
                    items=customers,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get customers: {str(e)}")

