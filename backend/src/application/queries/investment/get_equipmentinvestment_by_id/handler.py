from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentInvestmentRepository
from ....domain.entities.investment_entity import EquipmentInvestment
from .query import GetEquipmentInvestmentByIdQuery

class GetEquipmentInvestmentByIdHandler(RequestHandlerBase[GetEquipmentInvestmentByIdQuery, Result[Optional[EquipmentInvestment]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetEquipmentInvestmentByIdQuery) -> Result[Optional[EquipmentInvestment]]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentInvestmentRepository(uow.session)
                entity = repo.get_by_id(query.equipmentinvestment_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get equipmentinvestment: {str(e)}")
