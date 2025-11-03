from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ContractRepository
from ....domain.entities.sales_entity import Contract
from .query import GetContractByIdQuery

class GetContractByIdHandler(RequestHandlerBase[GetContractByIdQuery, Result[Optional[Contract]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetContractByIdQuery) -> Result[Optional[Contract]]:
        try:
            with self._unit_of_work as uow:
                repo = ContractRepository(uow.session)
                entity = repo.get_by_id(query.contract_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get contract: {str(e)}")
