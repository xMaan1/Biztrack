from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentInvestmentRepository
from .command import DeleteEquipmentInvestmentCommand

class DeleteEquipmentInvestmentHandler(RequestHandlerBase[DeleteEquipmentInvestmentCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteEquipmentInvestmentCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentInvestmentRepository(uow.session)
                
                equipmentinvestment = repo.get_by_id(command.equipmentinvestment_id, command.tenant_id)
                if not equipmentinvestment:
                    return Result.failure("EquipmentInvestment not found")
                
                repo.delete(equipmentinvestment)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete equipmentinvestment: {str(e)}")
