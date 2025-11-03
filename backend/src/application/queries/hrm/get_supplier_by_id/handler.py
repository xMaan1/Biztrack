from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import SupplierRepository
from ....domain.entities.hrm_entity import Supplier
from .query import GetSupplierByIdQuery

class GetSupplierByIdHandler(RequestHandlerBase[GetSupplierByIdQuery, Result[Optional[Supplier]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetSupplierByIdQuery) -> Result[Optional[Supplier]]:
        try:
            with self._unit_of_work as uow:
                repo = SupplierRepository(uow.session)
                entity = repo.get_by_id(query.supplier_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get supplier: {str(e)}")
